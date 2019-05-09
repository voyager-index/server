// Listen on port 5000, or use "export PORT=31415"
// to start on port 31415
const PORT = process.env.PORT || 5000

const fetch = require('node-fetch');
const https = require('https');
const path = require('path')

// POST requests
const bodyParser = require('body-parser');

// Used to connect to PostgreSQL database.
const pool = require('./config.js');

// Use express for the web server.
const express = require('express')
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Use ejs for templating.
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);

const DEBUG = false;

// ---------- //
// Pages
// ---------- //

// database page
app.get('/db', async (req, res) => {
    try {
        const client = await pool.connect()

        const result = await client.query('SELECT * FROM Country');
        const results = { 'results': (result) ? result.rows : null};

        const table = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = {'tables': (table) ? table.rows : null};

        res.render('pages/db', {tables:tables, results:results});
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});


// city page
app.get('/city', async(req, res) => {
    res.render('pages/city');
});


// city page
app.post('/city', async (req, res) => {

    // get data from POST body.
    const name = req.body.name;
    const lon = req.body.lon;
    const lat = req.body.lat;

    // Does this: ${variable_name} follow the usual convention for not allowing SQL injections?
    // Also, Intl_aiports has not been added to the DB (database/data/data.sql) yet, if anyone is looking for a quick fix to do.
            // INNER JOIN Intl_Airports ia ON ia.CityId = c.id

    const query = `
SELECT c.name AS city, co.name AS country, TRUNC(c.lon, 2) AS lon, TRUNC(c.lat,2) AS lat,
p.total AS population, i.speed AS mbps,
cl.NearCoast AS beach, a.Exists AS airport,
e.elevation AS elevation, ap.Index as pollution,
t.Jan AS tempJan, t.Feb AS tempFeb, t.Mar AS tempMar ,t.April AS tempApr ,t.May AS tempMay ,t.June AS tempJun ,t.July AS tempJul ,t.Aug AS tempAug ,t.Sept AS tempSep ,t.Oct AS tempOct ,t.Nov AS tempNov ,t.Dec AS tempDec,
pr.Jan AS precipJan, pr.Feb AS precipFeb, pr.Mar AS precipMar ,pr.April AS precipApr ,pr.May AS precipMay ,pr.June AS precipJun ,pr.July AS precipJul ,pr.Aug AS precipAug ,pr.Sept AS precipSep ,pr.Oct AS precipOct ,pr.Nov AS precipNov ,pr.Dec AS precipDec,
uv.Jan AS uvJan, uv.Feb AS uvFeb, uv.Mar AS uvMar ,uv.April AS uvApr ,uv.May AS uvMay ,uv.June AS uvJun ,uv.July AS uvJul ,uv.Aug AS uvAug ,uv.Sept AS uvSep ,uv.Oct AS uvOct ,uv.Nov AS uvNov ,uv.Dec AS uvDec

FROM City c
INNER JOIN Country co ON co.id = c.country
INNER JOIN Internet_Speed i ON i.Country = co.id
INNER JOIN Population p ON p.CityId = c.id
INNER JOIN Coastlines cl ON  cl.CityId = c.id
INNER JOIN Airports a ON a.CityId = c.id
INNER JOIN Elevation e ON e.CityId = c.id
INNER JOIN Air_pollution ap ON ap.CityId = c.id
INNER JOIN Temp t ON t.CityId = c.id
INNER JOIN Precipitation pr ON pr.CityId = c.id
INNER JOIN UV_Index uv ON uv.CityId = c.id

WHERE C.name = '${name}'
AND TRUNC(C.lon, 2) = TRUNC(${lon}, 2)
AND TRUNC(C.lat, 2) = TRUNC(${lat}, 2)
;
`

    try {
        const client = await pool.connect()
        const result = await client.query(query);
        var results = null;
        if (result.rows[0]){
            results = result.rows[0];
        }
        else {
            //It should probably just show the data that it can get, or say that it can't find data.
        }
        client.release();
        res.send(results);
    }
    catch(error) {
        console.log(error);
    }
});

// Basic post request that receives bounding box, returns city points
// returns array with the form: [ [City, lon, lat, rank] ],
// example: [["San Diego", -17.1, 32.2, 2.7] ]]
// example: [["New York", -74, 40.7, 4.5], ["San Diego", -117, 33, 2.7], ["Dallas", -96, 33, 1.2]];
app.post('/bounding', async (req, res) => {
    const bounding_box = req.body.bounding_box;
    const filters = req.body.filters;

    const bottom_left_lon = bounding_box[0];
    const bottom_left_lat = bounding_box[1];
    const top_right_lon = bounding_box[2];
    const top_right_lat = bounding_box[3];

    let lon_wrap = Number.MAX_SAFE_INTEGER;
    let lon_wrap_neg = Number.MAX_SAFE_INTEGER;

    // edge case: left side of map crosses 180 degress longitude.
    // edge case: left side of map crosses 0 degress longitude.
    lon_wrap = -1 * (bottom_left_lon + 180) % 360;
    lon_wrap_neg = 1 * (bottom_left_lon + 180) % 360;

    const bound = `WHERE
        (C.lon >= ${bottom_left_lon} OR
        C.lon >= ${lon_wrap}) AND
        C.lat >= ${bottom_left_lat} AND

        (C.lon <= ${lon_wrap_neg} OR
        C.lon <= ${top_right_lon}) AND
        C.lat <= ${top_right_lat}
        `;

   var select = 'SELECT C.name as name, C.lon as lon, C.lat as lat, P.total ';
   var from = 'FROM City C INNER JOIN Population P on P.CityId = C.id INNER JOIN Country co ON C.Country = co.id ';
   var where = bound;

   for (var i = 0; i < filters.length; i++){
        if(filters[i] == "internet"){
            select += ', I.Speed ';
            from += ' INNER JOIN Internet_Speed I ON I.Country = co.id ';
            where += ' AND I.Speed > 2 ';
        }
        if(filters[i] == "pollution"){
            select += ', ap.Index ';
            from += ' INNER JOIN Air_pollution ap ON ap.CityId = C.id ';
            where += ' AND (ap.Index = NULL OR ap.Index < 10) ';
        }
        if(filters[i] == "beaches"){
            select += ', cl.NearCoast ';
            from += ' INNER JOIN Coastlines cl ON cl.CityId = C.id ';
            where += ' AND cl.NearCoast = true ';
        }
   }

    var query = select + from + where + " ORDER BY P.total DESC LIMIT 100;";

    let cities = [];
    try {
        const client = await pool.connect()
        const result = await client.query(query);
        const results = { 'cities': (result) ? result.rows : null};

        cities = obj_arr2arr(results.cities);

        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
    var cityRank = rankCities(cities, filters);
    res.send(cityRank);
});

function rankCities(cities, filters){
    //True False values don't matter, because they are filtered out.
    var rankedCities = [];
    var i;
    for (i = 0 ; i < cities.length; i++){
        //name, lon, lat, rank
        rankedCities.push([cities[i][0], Number(cities[i][1]), Number(cities[i][2]), 3]);
    }
    if(filters.includes("internet")){

    }
    if(filters.includes("pollution")){

    }
    var returnVal = {'cities': rankedCities};
    return returnVal;
}


app.get('/data', (req, res) => {
    res.render('pages/data_article');
});

app.get('/settings', (req, res) => {
    res.render('pages/settings');
});


// -------------------- //
// Helper functions
// -------------------- //


function obj_arr2arr(obj_arr) {
    let arr = []

    for (let i = 0; i < obj_arr.length; i++) {
        let arr_new = obj2arr(obj_arr[i])
        arr.push(arr_new);
    }

    return arr;
}


function obj2arr(obj) {
    let arr = [];

    for (let property in obj) {
        arr.push(obj[property]);
    }
    //ranking
    arr.push("3");
    return arr;
}

// Used to interprete JSON objects returned by requests to API's.
// Fetches "url" and returns whatever value is associated with the "object".
async function getThing(url, object) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            return eval(object);
        })
}


// Start app.
app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index', { layout: 'layout-map' }))
    .listen(PORT, () => console.log(`Listening at http://localhost:${ PORT }`))



/*
Saved old version.

app.post('/bounding', async (req, res) => {
    const bounding_box = req.body.bounding_box;
    const type = req.body.type;

    if (DEBUG) {
        console.log("req.body:", req.body);
        console.log("type:", type);

        console.log(`bounding_box:
        bottom-left lon: ${bounding_box[0]}
        bottom-left lat: ${bounding_box[1]}
        top-right lon: ${bounding_box[2]}
        top-right lat: ${bounding_box[3]}`);
    }

    const bottom_left_lon = bounding_box[0];
    const bottom_left_lat = bounding_box[1];
    const top_right_lon = bounding_box[2];
    const top_right_lat = bounding_box[3];

    let lon_wrap = Number.MAX_SAFE_INTEGER;
    let lon_wrap_neg = Number.MAX_SAFE_INTEGER;

    // edge case: left side of map crosses 180 degress longitude.
    // edge case: left side of map crosses 0 degress longitude.
    lon_wrap = -1 * (bottom_left_lon + 180) % 360;
    lon_wrap_neg = 1 * (bottom_left_lon + 180) % 360;

    const bound = `
WHERE
(C.lon >= ${bottom_left_lon} OR
C.lon >= ${lon_wrap}) AND
C.lat >= ${bottom_left_lat} AND

(C.lon <= ${lon_wrap_neg} OR
C.lon <= ${top_right_lon}) AND
C.lat <= ${top_right_lat}
`;

    const pop_max = () => {
        return (isNaN(req.body.pop_max)) ? "POWER(2,31)" : req.body.pop_max;
    }

    const pop_min = () => {
        return (isNaN(req.body.pop_min)) ? 0 : req.body.pop_min;
    }

    const internet_max = () => {
        return (isNaN(req.body.internet_max)) ? "POWER(2,31)" : req.body.internet_max;
    }

    const internet_min = () => {
        return (isNaN(req.body.internet_min)) ? 0 : req.body.internet_min;
    }

    const pop = `
AND P.total <= ${pop_max()}
AND P.total >= ${pop_min()}
`;

    const internet = `
AND I.speed <= ${internet_max()}
AND I.speed >= ${internet_min()}
`;

    const inner_joins = `
INNER JOIN Country CO ON CO.id = C.country
INNER JOIN Internet_Speed I ON I.Country = CO.id
INNER JOIN Population P ON (P.CityId = C.id)
`
    const common =
        inner_joins
    +   bound
    +   pop
    +   internet;

    let cities = [];
    try {
        const client = await pool.connect()

        let query_string = `
SELECT C.name, C.lon, C.lat, P.total, CO.name AS country, I.speed FROM City C`
+ common
+
`ORDER BY P.total DESC
LIMIT 100`

        if (DEBUG) {
            console.log("pop:", pop);
            console.log("query:", query_string);
        }
        const result = await client.query(query_string);
        const results = { 'cities': (result) ? result.rows : null};

        cities = obj_arr2arr(results.cities);

        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }

    res.send(cities);
});


*/
