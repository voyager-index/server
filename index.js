const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser());
const https = require('https');

let ejs = require('ejs');
app.set('view engine', 'ejs');


const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

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
    res.render('pages/city', {city_name:"Portland", city_image:""});
})

app.post('/city-submit', async (req, res) => {
    var qParams = [];
    console.log("req:", req.body.city);
    const city = encodeURI(req.body.city);
    //for (var p in req.body){
    //    qParams.push({'name':p,'value':req.body[p]})
    //}
    //console.log(qParams[0]);

    // An object of options to indicate where to post to
    const post_options = {
        //host: 'webdev.liambeckman.com',
        //path: '/getpost',
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

    let output = '';

    var city_url = "";

    // Set up the request
    const post_req = https.request(post_options, function(response) {
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            output += chunk;
        });

        response.on('end', () => {
            try {
                const obj = JSON.parse(output);
                city_url = obj.results[0].urls.regular;
                var request = require('request').defaults({ encoding: null });

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
})


app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
