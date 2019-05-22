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
            query += ' AND I.Speed > 1';
        }
        if(filters[i] == "pollution"){
            query += ' AND (ap.Index = NULL OR ap.Index < 100)';
        }
        if(filters[i] == "beaches"){
            query += ' AND cl.NearCoast = true';
        }
        if(filters[i] == "rural"){
            query += ' AND (p.total < 20000)';
        }
        if(filters[i] == "town"){
            query += ' AND (p.total < 100000 AND p.total > 20000)';
        }
        if(filters[i] == "city"){
            query += ' AND (p.total < 500000 AND p.total > 100000)';
        }
        if(filters[i] == "metro"){
            query += ' AND (p.total > 500000)';
        }
        if(filters[i] == "airports"){
            query += ' AND (a.Exists = true)'
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
        ORDER BY P.total DESC LIMIT 24;`

    let cities = [];
    try {
        const client = await pool.connect()
        const result = await client.query(query);
        const results = result ? result.rows : null;

        const filters = [];
        console.log(results.length);
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
    var selectedMonth;
    // Month included?
    const group = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    var includeMonth = false;
    for (var j = 0; j < 12; j++){
        if (filters.includes(group[j])){
            includeMonth = true;
            selectedMonth = group[j];
        }
    }
    
    var rankedCities = [];
    var i;
    for (i = 0 ; i < cities.length; i++){

        var rank = 0; // Starting rank for each city
        var weight = 1; // Weight to be used for each section.
        const pop = Number(cities[i]["population"]);

        // Rank based on filter buttons. These names are in the class list for each button on index.ejs

        //Internet Speed
        weight = .2;
        var mbps = cities[i]["mbps"];
        var internetRank = 0;
        if (mbps != null){
            if (mbps > 20){
                internetRank += 10;
            } else {
                internetRank += mbps/2;
            }
        }
        if(filters.includes("internet")){  // MBPS is greater than 1
            weight = 1;
        }
        rank += internetRank*weight;

        // Pollution
        weight = .2;
        var pollution = Number(cities[i]["pollution"]) || 0;
        var pollutionRank = (100 - pollution)/10;
        if(filters.includes("pollution")){ // Index is null or less than 100
            weight = 1;
        }
        rank += pollutionRank*weight;

        // Weather
        var avgUV;     // Integer, index of 0 - 16, * 16       For higher accuracy, so its 0 through 256
        var avgPrecip; // Integer, mm
        var avgTemp; // Integer, degrees C * 10
        var uvRank = 0, precipRank = 0, tempRank = 0;

        // Get weather without month
        if (includeMonth == false){
            // get averages
            avgUV = getAvgUV(cities[i]);
            avgPrecip = getAvgPrecip(cities[i]);
            avgTemp = getAvgTemp(cities[i]);
        } else { // Get weather with month
            // get averages
                avgUV = getMonthUV(cities[i], selectedMonth);
                avgPrecip = getMonthPrecip(cities[i], selectedMonth);
                avgTemp = getMonthTemp(cities[i], selectedMonth);
        }


        /*
RANKING DONE BELOW
        */

        // UV Ranking
        if(avgUV > 10 * 16){ //high uv
            uvRank -= (Math.round(avgUV/16) - 10); // each index pt above 10 subtracts 1 from the rank
        } else {
            uvRank += 10 - Math.round(avgUV/16); //uv index of 10 gives 0 to ranking, uv index of 0 gives 10 to ranking
        }
        weight = .2;
        if(filters.includes('uv')){
            weight = 1;
        } 
        rank += uvRank * weight;

        //Precip ranking
        if (avgPrecip <= 200){
            precipRank = (200 - avgPrecip)/20; // 0 adds 10 to rank, 200 adds 0
        } else if (rank < 300) {
            precipRank -= 2;
        } else { // At a certain point it doesnt matter, you're just in the rain.
            precipRank -= 5;
        }
        weight = .2;
        if (filters.includes('precipitation')){ // in MM, from 0 to ~800
               weight = 1;
        }
        rank += precipRank * weight;

            
        if (filters.includes('cold') ){
            // 0 f to 45 f == -17.7 C to 7.2
            if (avgTemp >= -177 && avgTemp <= 72){
                tempRank += 10;
            } else if (avgTemp < -177) {
                tempRank -= 2;
            } else {
                tempRank -= 5;
            }
        } else if ( filters.includes('temperate')){
            // 45 f to 72 f ==  7.2 C to 22.2 C
            if (avgTemp >= 72 && avgTemp <= 222){
                tempRank += 10;
            } else if ( (avgTemp < 72 && avgTemp > 50) || (avgTemp > 222 && avgTemp < 266 ) ) {  // 41 - 45 f, or 72f - 80f
                tempRank -= 2;
            } else {
                tempRank -= 5;
            }

        } else if (filters.includes('warm')){
            // 75 f to 90 f == 23.8 C to 32.2
            if (avgTemp >= 238 && avgTemp <= 322){
                tempRank += 10;
            } else if ( (avgTemp < 238 && avgTemp > 222) || (avgTemp > 322 && avgTemp < 362 ) ) { //warmer than 72, or colder than 97
                tempRank -= 2;
            } else {
                tempRank -= 5;
            }
        } else if (filters.includes('hot')){
            // 85 f to 101 f == 29.4 C to 38.3
            if (avgTemp >= 294 && avgTemp <= 383){
                tempRank += 10;
            }
            else if ( (avgTemp < 294 && avgTemp > 250) || (avgTemp > 383 && avgTemp < 433 ) ) { // warmer than 77f, or colder than 110f
                tempRank -= 2;
            } else {
                tempRank -= 5;
            }
        } else { // No filter
            // 65 f to 90 f == 18.3 C to 32.2
            if (avgTemp >= 183 && avgTemp <= 322){
                tempRank += 10;
            } else if ( (avgTemp < 183 && avgTemp > 127) || (avgTemp > 322 && avgTemp < 362 ) ) { //warmer than 55f, or colder than 97
                tempRank -= 2;
            } else {
                tempRank -= 5;
            }
        }
        weight = .2;
        if (filters.includes('cold') || filters.includes('temperate') || filters.includes('warm') || filters.includes('hot')){
            weight = 1;
        }
        rank += tempRank * weight;


        var popRank = 0;
        if(filters.includes('rural')){
                    // < 20k
                    popRank += (20 - pop/1000 )/ 2; // 0 people adds 10pts, 20k adds 0 pts
        } else if(filters.includes('town')){
                    // < 100k
                    popRank += 10;
        } else if(filters.includes('city')){
                    // < 500k
                    popRank += 10;
        } else if(filters.includes('metro')){
            popRank += pop/1000000;
        } else { // No filter
            if (pop > 35000 && pop < 1500000){
                popRank += 10;
            }
        }
        weight = .2;
        if (filters.includes('rural') || filters.includes('town') || filters.includes('city') || filters.includes('metro')){
            weight = 1;
        }
        rank += popRank * weight;

        var roundedRank = Math.round(rank * 10)/10;
        //name, lon, lat, rank
        rankedCities.push([cities[i]["city"], Number(cities[i]["lon"]), Number(cities[i]["lat"]), roundedRank]);
    }

    // Adjust to relative rank
    var maxRank = -100, minRank = 100000, thisRank;
    for (var k = 0; k < rankedCities.length; k++){
        thisRank = rankedCities[k][3];
        if (thisRank > maxRank){
            maxRank = thisRank;
        }
        if (thisRank < minRank){
            minRank = thisRank;
        }
    }
    if (minRank < 0){
        const addToRank = Math.abs(minRank);
        for (var l = 0; l < rankedCities.length; l++){
            rankedCities[l][3] += addToRank;
        }
    }
    if (maxRank > 10){
        for (var l = 0; l < rankedCities.length; l++){
            rankedCities[l][3] = ((rankedCities[l][3] * 10) / maxRank).toFixed(1); // toFixed converts to string, so to stat consistent we do it whether or not maxRank is > 10
        }
    } else {
        for (var l = 0; l < rankedCities.length; l++){
            rankedCities[l][3] = (rankedCities[l][3]).toFixed(1);
        }
    }


    var returnVal = {'cities': rankedCities};
    return returnVal;
}

function getAvgUV(city){
    const uvTotal = (city['uvjan']) + (city['uvfeb']) + (city['uvmar']) + (city['uvapr']) + (city['uvmay']) + (city['uvjun']) + 
                    (city['uvjul']) + (city['uvaug']) + (city['uvsep']) + (city['uvoct']) + (city['uvnov']) + (city['uvdec']);
    return Math.round(uvTotal/12);
}

function getAvgPrecip(city){
   //console.log(city['precipdec']);
    const precipTotal = city['precipjan'] + city['precipfeb'] + city['precipmar'] + city['precipapr'] + city['precipmay'] + city['precipjun'] + 
                        city['precipjul'] + city['precipaug'] + city['precipsep'] + city['precipoct'] + city['precipnov'] + city['precipdec'];
    return Math.round(precipTotal/12);
}

function getAvgTemp(city){
    const tempTotal = city['tempjan'] + city['tempfeb'] + city['tempmar'] + city['tempapr'] + city['tempmay'] + city['tempjun'] + 
                      city['tempjul'] + city['tempaug'] + city['tempsep'] + city['tempoct'] + city['tempnov'] + city['tempdec'];
    return Math.round(tempTotal/12);
}

function getMonthUV(city, month){
    const index = "uv" +  month;
    return city[index];
}

function getMonthPrecip(city, month){
    const index = "precip" +  month;
    return city[index];
}

function getMonthTemp(city, month){
    const index = "temp" +  month;
    return city[index];
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
