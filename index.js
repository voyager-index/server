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

        const query = `SELECT c.name AS city, co.name AS country, TRUNC(c.lon, 2) AS lon, TRUNC(c.lat,2) AS lat,
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

            ORDER BY p.total DESC;`

        const result = await client.query(query);
        const results = { 'results': (result) ? result.rows : null};

        for (var i = 0 ; i < results.results.length; i++){
            var temp = results.results[i].tempjan + results.results[i].tempfeb + results.results[i].tempmar + results.results[i].tempapr + results.results[i].tempmay + results.results[i].tempjun + results.results[i].tempjul +
            results.results[i].tempaug + results.results[i].tempsep + results.results[i].tempoct + results.results[i].tempnov + results.results[i].tempdec;
            temp = temp / 12;
            temp = temp /10;
            results.results[i].temp = Math.round(temp);
            var precip = results.results[i].precipjan + results.results[i].precipfeb + results.results[i].precipmar + results.results[i].precipapr + results.results[i].precipmay + results.results[i].precipjun + results.results[i].precipjul +
            results.results[i].precipaug + results.results[i].precipsep + results.results[i].precipoct + results.results[i].precipnov + results.results[i].precipdec;
            precip = precip / 12;
            results.results[i].precip = Math.round(precip);
            var uv = results.results[i].uvjan + results.results[i].uvfeb + results.results[i].uvmar + results.results[i].uvapr + results.results[i].uvmay + results.results[i].uvjun + results.results[i].uvjul +
            results.results[i].uvaug + results.results[i].uvsep + results.results[i].uvoct + results.results[i].uvnov + results.results[i].uvdec;
            uv = uv / 12;
            uv = uv /16;
            results.results[i].uv = Math.round(uv);
        }

        res.render('pages/db', {results:results});
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
        uv.Jan AS uvJan, uv.Feb AS uvFeb, uv.Mar AS uvMar ,uv.April AS uvApr ,uv.May AS uvMay ,uv.June AS uvJun ,uv.July AS uvJul ,uv.Aug AS uvAug ,uv.
        Sept AS uvSep ,uv.Oct AS uvOct ,uv.Nov AS uvNov ,uv.Dec AS uvDec
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
        --AND TRUNC(C.lon, 2) = TRUNC(${lon}, 2)
        --AND TRUNC(C.lat, 2) = TRUNC(${lat}, 2)
        ;
        `
    //console.log(query);
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

    var query = `SELECT c.name AS city, co.name AS country, TRUNC(c.lon, 2) AS lon, TRUNC(c.lat,2) AS lat,
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

        WHERE
        (C.lon >= ${bottom_left_lon} OR
        C.lon >= ${lon_wrap}) AND
        C.lat >= ${bottom_left_lat} AND

        (C.lon <= ${lon_wrap_neg} OR
        C.lon <= ${top_right_lon}) AND
        C.lat <= ${top_right_lat}
        `;


   for (var i = 0; i < filters.length; i++){
        if(filters[i] == "internet"){
            query += ' AND I.Speed > 1 ';
        }
        if(filters[i] == "pollution"){
            query += ' AND (ap.Index = NULL OR ap.Index < 100) ';
        }
        if(filters[i] == "beaches"){
            query += ' AND cl.NearCoast = true ';
        }
        if(filters[i] == "rural"){
            query += ' AND (p.total < 20000)';
        }
        if(filters[i] == "town"){
            query += ' AND (p.total < 100000 AND p.total > 20000)';
        }
        if(filters[i] == "city"){
            query += ' AND (p.total < 300000 AND p.total > 100000)';
        }
        if(filters[i] == "metro"){
            query += ' AND (p.total > 300000)';
        }
   }

    query += " ORDER BY P.total DESC LIMIT 100;";

    let cities = [];
    try {
        const client = await pool.connect()
        const result = await client.query(query);
        const results = result ? result.rows : null;

        var cityRank = rankCities(results, filters);
        res.send(cityRank);
//        cities = obj_arr2arr(results.cities);

        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }

});

app.get('/grid', async (req, res) => {
     var query = `SELECT c.name AS city, co.name AS country, TRUNC(c.lon, 2) AS lon, TRUNC(c.lat,2) AS lat, c.id,
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
        ORDER BY P.total DESC LIMIT 100;`

    let cities = [];
    try {
        const client = await pool.connect()
        const result = await client.query(query);
        const results = result ? result.rows : null;

        const filters = [];
        var cityRank = rankCities(results, filters);
        res.render('pages/grid', cityRank);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

function rankCities(cities, filters){
    //True False values don't matter, because they are filtered out.
    //console.log(cities[0]);
    var rankedCities = [];
    var i;
    for (i = 0 ; i < cities.length; i++){
        // This section builds initial ranking. Obviously, it will need to be changed/ improved, I don't think bigger = better with cities
        // This is more just to get something down, feel free to edit and improve.
        var rank;
        const pop = Number(cities[i]["population"]);
        if ( pop > 100000){
            rank = 4.5;
        } else if (pop > 500000) {
            rank = 3.5;
        } else if ( pop > 100000) {
            rank = 2.5;
        } else {
            rank = 1.5;
        }


        // Rank based on filter buttons. These names are in the class list for each button on index.ejs
        // Obviously we also need to improve this, but just to get something in place for us to build on.
        if(filters.includes("internet")){
            var mbps = cities[i]["mbps"];
            if (mbps > 10){
                rank += 2;
            } else if (mbps > 4){
                rank += 1.5;
            } else if (mbps > 2){
                rank += .5;
            } else {
                rank -= 1;
            }
        }
        if(filters.includes("pollution")){
            var pollution = Number(cities[i]["pollution"]);
            if (pollution < 5){
                rank += 2;
            } else if (pollution < 10){
                rank += 1;
            } else if (pollution < 20) {
                rank -= 1;
            } else {
                rank -= 2;
            }
        }


        //name, lon, lat, rank
        rankedCities.push([cities[i]["city"], Number(cities[i]["lon"]), Number(cities[i]["lat"]), rank, cities[i]["id"]]);
    }
    var returnVal = {'cities': rankedCities};
    return returnVal;
}

// city page
app.post('/city-image', async (req, res) => {

    // get data from POST body.
    const id = req.body.id;

    const query = `
    SELECT src FROM City_Image CI
    WHERE CI.cityid = ${id}
        ;
        `
    //console.log(query);
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
