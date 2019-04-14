const PORT = process.env.PORT || 5000
const express = require('express')
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fetch = require("node-fetch");
const https = require('https');
const path = require('path')
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

const app = express();
app.use(bodyParser());
app.set('view engine', 'ejs');


app.get('/db', async (req, res) => {
    try {
        const client = await pool.connect()
        const result = await client.query('SELECT * FROM test_table');
        const results = { 'results': (result) ? result.rows : null};
        res.render('pages/db', results );
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})


app.get('/city', async(req, res) => {
    const city = "portland";
    const city_req = await getCity(city);
    const city_name = city_req.name;
    const city_image = city_req.image;
    res.render('pages/city',{city_name:city_name, city_image:city_image});
})


async function getThing(url, object, err) {
    return fetch(url)
    .then(response => response.json())
        .then(data => {
            try {
                return eval(object);
            }
            catch(error) {
                err;
            }
        })
}

async function getCity(city) {
    const city_search = "https://api.teleport.org/api/cities/?search=" + city;
    const city_url = 'data._embedded["city:search-results"][0]._links["city:item"].href';
    const city_guess = 'data._embedded["city:search-results"][0].matching_full_name';
    const urban_url = 'data._links["city:urban_area"].href';
    const image_url = 'data._links["ua:images"].href';
    const mobile_url = 'data.photos[0].image.web';

    const err = () => {
        res.render('pages/city',{city_name:"City not found.",city_image:"https://www.rust-lang.org/logos/error.png"});
    }
    const city_name = await getThing(city_search, city_guess, err);
    const urban_search = await getThing(city_search, city_url, err);
    const image_search = await getThing(urban_search, urban_url, err);
    const mobile_search = await getThing(image_search, image_url, err);
    const city_image = await getThing(mobile_search, mobile_url, err);

    const ret = new Object();
    ret.name = city_name;
    ret.image = city_image;

    return ret;
}


app.post('/city-submit', async (req, res) => {
    var qParams = [];
    const city = encodeURI(req.body.city);

    const city_req = await getCity(city);
    const city_name = city_req.name;
    const city_image = city_req.image;
    res.render('pages/city',{city_name:city_name, city_image:image});
})


app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => console.log(`Listening at http://localhost:${ PORT }`))
