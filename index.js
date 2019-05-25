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

// Used for sending git issues form /issues
const auth_issue = require('./auth-issue.js');

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

// common string used in all city queries.
const common = `
    SELECT c.name AS city, co.name AS country, TRUNC(c.lon, 2) AS lon, TRUNC(c.lat,2) AS lat, c.id,
    p.total AS population, i.speed AS mbps,
    cl.NearCoast AS beach, a.Exists AS airport,
    e.elevation AS elevation, ap.Index as pollution,
    t.Jan AS tempJan, t.Feb AS tempFeb, t.Mar AS tempMar ,t.April AS tempApr ,t.May AS tempMay ,t.June AS tempJun ,t.July AS tempJul ,t.Aug AS tempAug ,t.Sept AS tempSep ,t.Oct AS tempOct ,t.Nov AS tempNov ,t.Dec AS tempDec,
    pr.Jan AS precipJan, pr.Feb AS precipFeb, pr.Mar AS precipMar ,pr.April AS precipApr ,pr.May AS precipMay ,pr.June AS precipJun ,pr.July AS precipJul ,pr.Aug AS precipAug ,pr.Sept AS precipSep ,pr.Oct AS precipOct ,pr.Nov AS precipNov ,pr.Dec AS precipDec,
    uv.Jan AS uvJan, uv.Feb AS uvFeb, uv.Mar AS uvMar ,uv.April AS uvApr ,uv.May AS uvMay ,uv.June AS uvJun ,uv.July AS uvJul ,uv.Aug AS uvAug ,uv.Sept AS uvSep ,uv.Oct AS uvOct ,uv.Nov AS uvNov ,uv.Dec AS uvDec,
    ppp.ppp AS purchasingpower,
    pi.percent AS povertyIndex

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
    INNER JOIN Puchasing_Power_Parity ppp ON ppp.Country = co.id
    INNER JOIN Poverty_Index pi ON pi.Country = co.id
`;

// ---------- //
// Pages
// ---------- //

// database page
app.get('/db', async (req, res) => {
    try {
        const client = await pool.connect()

        const query = `
            ${common}
            ORDER BY p.total DESC
        ;`

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

    // TODO: uncomment lat/lon checks. Currently, checks result in no matches for some odd reason.
    const query = `
        ${common}
        WHERE C.name = '${name}'
        --AND TRUNC(C.lon, 2) = TRUNC(${lon}, 2)
        --AND TRUNC(C.lat, 2) = TRUNC(${lat}, 2)
    ;`;
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

// city page
app.post('/city-search', async (req, res) => {
    // get data from POST body.
    const search_string = req.body.search_string;

    const query = `
        ${common}
        WHERE C.name ILIKE '%${search_string}%'
        ORDER BY P.total DESC
        LIMIT 10
    ;`;

    const action = (results) => {
        const filters = [];
        var cityRank = rankCities(results, filters);
        res.send(cityRank);
    }

    try {
        const results = await swimming_pool(query, action);
    }
    catch(err) {
        console.error(err);
        res.send('Error:', err);
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

    var query = `
        ${common}

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
    //console.log(query);

    let cities = [];
    try {
        const client = await pool.connect()
        const result = await client.query(query);
        const results = result ? result.rows : null;
        var cityRank = rankCities(results, filters);
        res.send(cityRank);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

app.get('/grid', async (req, res) => {
    var query = `
        ${common}
        ORDER BY P.total DESC LIMIT 100
    ;`;
    //console.log(query);

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
        var weight; // Weight given to each section depending on whether or not it was selected as filter
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
        } else { // Get weather with month filter included
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

        // Temp ranking
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

        // Population
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
            if (pop > 35000 && pop < 1500000){ // I just made up what to do here, feel free to make more complex. 2 pts gained if between 35k and 1.5mil
                popRank += 10;
            }
        }
        weight = .2;
        if (filters.includes('rural') || filters.includes('town') || filters.includes('city') || filters.includes('metro')){
            weight = 1;
        }
        rank += popRank * weight;

        // Purchasing power
        var purchasePower = cities[i]["purchasingpower"];
        var pppRank = Math.round((1 - purchasePower)*10);
        weight = .2;
        if(filters.includes('purchase')){
            weight = 1;
        }
        rank += pppRank * weight;

        // Socioeconomic filter
        var povertyindex = cities[i].povertyindex;
        var povertyindexRank = 0;
        //console.log("Socioeconomic filter:", povertyindex);
        if (filters.includes('high-poverty-index')){
            povertyindexRank = povertyindex - 2;
        }
        else if (filters.includes('medium-poverty-index')){
            povertyindexRank = 2 - povertyindex;
        }
        else if (filters.includes('low-poverty-index')){
            povertyindexRank = 4 - povertyindex;
        }
        //console.log('old rank:', rank);
        rank += povertyindexRank;
        //console.log('new rank:', rank, '\n');
        //console.log("Socioeconomic filter:", povertyindexRank);

        // Adjust to onle 1 decimal place
        var roundedRank = Math.round(rank * 10)/10;
        //name, lon, lat, rank, id
        rankedCities.push([cities[i]["city"], Number(cities[i]["lon"]), Number(cities[i]["lat"]), roundedRank, cities[i]["id"]]);
    }

    /*
    // Adjust to relative rank
    // Rank range: 0 - 10
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
    if (maxRank > 10 || maxRank - minRank > 10 ){
        for (var l = 0; l < rankedCities.length; l++){
            rankedCities[l][3] = ((rankedCities[l][3] * 10) / maxRank).toFixed(1); // toFixed converts to string, so to stat consistent we do it whether or not maxRank is > 10
        }
    } else {
        for (var l = 0; l < rankedCities.length; l++){
            rankedCities[l][3] = (rankedCities[l][3]).toFixed(1);
        }
    }
    */
    for (var l = 0; l < rankedCities.length; l++){
        rankedCities[l][3] = (rankedCities[l][3]).toFixed(1);
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

/*
Data and settings page routers
*/

app.get('/data', (req, res) => {
    res.render('pages/data_article');
});

app.get('/settings', (req, res) => {
    res.render('pages/settings');
});


// issue page

app.get('/issues', async (req, res) => {
    const id = req.query.id;
    const query = `
        SELECT C.name AS city, CO.name AS country FROM City C
        INNER JOIN Country CO ON CO.id = C.country
        WHERE C.id = ${id}
    ;`;
    //console.log(query);
    let city = '';
    let country = '';
    const client = await pool.connect()

    try {
        const result = await client.query(query);
        let results = result.rows[0];
        console.log(results);
        city = results.city;
        country = results.country;
    } catch(err) {
        console.error(err);
    }

    client.release();
    res.render('pages/issues', {city: city, country: country, id: id});
});

// POST request
app.post('/issues-submit', (req, res) => {
    const arr = []
    for (let p in req.body){
        arr.push({'name':p, 'value':req.body[p]});
    }
    console.log(arr);
    const issue_title = arr[0].value;
    const issue_body = arr[1].value;

    const host = 'https://api.github.com';
    const path = '/repos/cs467-map/database/issues';
    const url = host + path;

    const post_data = JSON.stringify({
        'title' : issue_title,
        'body': issue_body,
    });

    fetch(url, {
        port: '443',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data),
            'Authorization': auth_issue,
            'User-Agent': 'issuebot3000'
        },
        body: post_data,
    })
    .then(response => response.json())
    .catch(error => console.error('Error:', error))
    .then(response => console.log('Success:', response))
    .then(res.render("pages/issues-submit", {issue_title: issue_title, issue_body: issue_body}));
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
