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
    const img = "https://d13k13wj6adfdf.cloudfront.net/urban_areas/portland-or_web-55a07378b0.jpg";
    res.render('pages/city', {city_name:"Portland", city_image:img});
})

app.post('/city-submit', async (req, res) => {
    var qParams = [];
    console.log("req:", req.body.city);
    const city = encodeURI(req.body.city);

    const city_search = "https://api.teleport.org/api/cities/?search=" + city;
    let city_url = "";
    let urban_url = "";
    let image_url = "";
    let mobile_url = "";
    let city_guess = "";

    fetch(city_search)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            city_url = data._embedded["city:search-results"][0]._links["city:item"].href;
            city_guess = data._embedded["city:search-results"][0].matching_full_name;

            console.log("city_url:", city_url);
            fetch(city_url)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    let urban_url = data._links["city:urban_area"].href;

                    fetch(urban_url)
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(data) {
                            image_url = data._links["ua:images"].href;

                            fetch(image_url)
                                .then(function(response) {
                                    return response.json();
                                })
                                .then(function(data) {
                                    mobile_url = data.photos[0].image.web;
                                    res.render('pages/city',{city_name:city_guess, city_image:mobile_url});
                                });
                        });
                });
        });


    //res.render('pages/city-submit');
    /*
    // An object of options to indicate where to sned the request to.
    const options = {
        host: 'api.unsplash.com',
        path: '/search/photos?query=' + city,
        port: '443',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(city),
            'Authorization': 'Client-ID 195148f3e5b47fe30e0761f4cc1c920288dfa2b9d200d48accb4991c6496e435'
        }
    };

    let output = "";
    let city_url = "";

    // Set up the request
    const post_req = https.request(options, function(response) {
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            output += chunk;
        });

        response.on('end', () => {
            try {
                const obj = JSON.parse(output);
                city_url = obj.results[0].urls.regular;
                var request = require('request').defaults({ encoding: null });

                // get image of city, convert image data from hexadecimal to string
                request.get(city_url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
                        res.render('pages/city',{city_name:decodeURI(city), city_image:data});
                    }
                });
            }
            catch(err) {
                console.error(err);
                res.render('pages/city',{city_name:"City not found.", city_image:""});
            }
        });
    });

    // post the data
    post_req.write(city);
    post_req.end();
    */
})


app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
