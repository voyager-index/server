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
        const result = await client.query('SELECT * FROM Country');
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


app.post('/city', async (req, res) => {
    var qParams = [];
    const city = encodeURI(req.body.city);
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
        err();
    }
})


app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => console.log(`Listening at http://localhost:${ PORT }`))


async function getThing(url, object) {
    return fetch(url)
    .then(response => response.json())
        .then(data => {
            return eval(object);
        })
}


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
