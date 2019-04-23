// Listen on port 5000, or use "export PORT=31415"
// to start on port 31415
const PORT = process.env.PORT || 5000

const fetch = require("node-fetch");
const https = require('https');
const path = require('path')

// POST requests
const bodyParser = require('body-parser');

// Use ejs for templating.
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');

// Used to connect to PostgreSQL database.
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Use express for the web server.
const express = require('express')
const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(expressLayouts);


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
    const city = "portland";
    const city_req = await getCity(city);
    const city_name = city_req.name;
    const city_image = city_req.image;
    res.render('pages/city',{city_name:city_name, city_image:city_image});
});


// city page
app.post('/city', async (req, res) => {

    // get city name from POST body.
    const city = encodeURI(req.body.city);

    // error page
    const err = () => {
        res.render('pages/city',{city_name:"City not found.",city_image:"https://www.rust-lang.org/logos/error.png"});
    }

    try {
        const city_req = await getCity(city);
        const city_name = city_req.name;
        const city_image = city_req.image;
        res.render('pages/city',{city_name:city_name, city_image:city_image});
    }
    catch(error) {
        console.log(error);
        err();
    }
});

// Basic post request that receives bounding box, returns city points
// returns array with the form: [ [City, lon, lat, rank] ], 
// example: [["San Diego", -17.1, 32.2, 2.7] ]]
// example: [["New York", -74, 40.7, 4.5], ["San Diego", -117, 33, 2.7], ["Dallas", -96, 33, 1.2]];
app.post('/bounding', async (req, res) => {
    const bounding_box = req.body.bounding_box;

    console.log(`bounding_box:
    bottom-left lon: ${bounding_box[0]}
    bottom-left lat: ${bounding_box[1]}
    top-right lon: ${bounding_box[2]}
    top-right lat: ${bounding_box[3]}`);

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
    // console.log("lon_wrap:", lon_wrap);
    // console.log("lon_wrap_neg:", lon_wrap_neg);

    let cities = [];
    try {
        const client = await pool.connect()

        const query_string = `
SELECT C.name, C.lon, C.lat, TRUNC((P.total / 1e6), 1) FROM City C
INNER JOIN Population P ON (P.CityId = C.id)
WHERE 
(C.lon >= ${bottom_left_lon} OR 
C.lon >= ${lon_wrap}) AND
C.lat >= ${bottom_left_lat} AND

(C.lon <= ${lon_wrap_neg} OR
C.lon <= ${top_right_lon}) AND
C.lat <= ${top_right_lat}

ORDER BY P.total DESC
LIMIT 100
`

        console.log(query_string);
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


// Returns a city's name and image.
async function getCity(city) {
    const city_search = "https://api.teleport.org/api/cities/?search=" + city;
    const city_url = 'data._embedded["city:search-results"][0]._links["city:item"].href';
    const city_guess = 'data._embedded["city:search-results"][0].matching_full_name';
    const urban_url = 'data._links["city:urban_area"].href';
    const image_url = 'data._links["ua:images"].href';
    const mobile_url = 'data.photos[0].image.web';

    const city_name = await getThing(city_search, city_guess);
    const urban_search = await getThing(city_search, city_url);
    const image_search = await getThing(urban_search, urban_url);
    const mobile_search = await getThing(image_search, image_url);
    const city_image = await getThing(mobile_search, mobile_url);

    const ret = new Object();
    ret.name = city_name;
    ret.image = city_image;

    return ret;
}


// Start app.
app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => console.log(`Listening at http://localhost:${ PORT }`))
