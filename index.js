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

// number of elements on the grid page
const grid_number = 16;

// common database string used in all city queries.
const common = `
    SELECT c.name AS city, co.name AS country, TRUNC(c.lon, 2) AS lon, TRUNC(c.lat,2) AS lat, c.id,
    p.total AS population, i.speed AS mbps,
    cl.NearCoast AS beach, a.Exists AS airport,
    e.elevation AS elevation, ap.Index as pollution,
    pt.palms as palms, h.totalrate as totalhomicides, h.femalerate as femalehomicides,

    -- temperature
    t.Jan AS tempJan, t.Feb AS tempFeb, t.Mar AS tempMar, t.April AS tempApr, t.May AS tempMay, t.June AS tempJun, t.July AS tempJul, t.Aug AS tempAug, t.Sept AS tempSep, t.Oct AS tempOct, t.Nov AS tempNov, t.Dec AS tempDec,

    -- precipitation
    pr.Jan AS precipJan, pr.Feb AS precipFeb, pr.Mar AS precipMar, pr.April AS precipApr, pr.May AS precipMay, pr.June AS precipJun, pr.July AS precipJul, pr.Aug AS precipAug, pr.Sept AS precipSep, pr.Oct AS precipOct, pr.Nov AS precipNov, pr.Dec AS precipDec,

    -- uv
    uv.Jan AS uvJan, uv.Feb AS uvFeb, uv.Mar AS uvMar, uv.April AS uvApr, uv.May AS uvMay, uv.June AS uvJun, uv.July AS uvJul, uv.Aug AS uvAug, uv.Sept AS uvSep, uv.Oct AS uvOct, uv.Nov AS uvNov, uv.Dec AS uvDec,

    -- socioeconomic
    ppp.ppp AS purchasingpower,
    pi.percent AS povertyIndex,

    --- city image
    ci.src AS image

    FROM City c
    INNER JOIN Air_pollution ap ON ap.CityId = c.id
    INNER JOIN Airports a ON a.CityId = c.id
    INNER JOIN Coastlines cl ON  cl.CityId = c.id
    INNER JOIN Country co ON co.id = c.country
    INNER JOIN Elevation e ON e.CityId = c.id
    INNER JOIN Homicide h ON co.id = h.country
    INNER JOIN Internet_Speed i ON i.Country = co.id
    INNER JOIN Palm_Trees pt ON pt.CityId = c.id
    INNER JOIN Population p ON p.CityId = c.id
    INNER JOIN Poverty_Index pi ON pi.Country = co.id
    INNER JOIN Precipitation pr ON pr.CityId = c.id
    INNER JOIN Puchasing_Power_Parity ppp ON ppp.Country = co.id
    INNER JOIN Temp t ON t.CityId = c.id
    INNER JOIN UV_Index uv ON uv.CityId = c.id
    LEFT JOIN City_Image ci ON ci.CityId = c.id
`;

// ---------- //
// Pages
// ---------- //

// database page
app.get('/db', async (req, res) => {
    const query = `
        ${common}
        ORDER BY p.total DESC
    ;`;

    const action = (results) => {
        for (var i = 0 ; i < results.length; i++) {
            let temp = 0;
            let uv = 0;
            let precip = 0;
            let obj = results[i]
            Object.keys(obj).forEach(key => {
                if (key.substring(0,4) == 'temp') {
                    temp += obj[key];
                }
                else if (key.substring(0, 6) == 'precip') {
                    precip += obj[key];
                }
                else if (key.substring(0, 2) == 'uv') {
                    uv += obj[key];
                }
            });

            temp = temp / 12 / 10;
            results[i].temp = Math.round(temp);

            precip = precip / 12;
            results[i].precip = Math.round(precip);

            uv = uv / 12 / 16;
            results[i].uv = Math.round(uv);
        }

        res.render('pages/db', {results:results});
    }

    try {
        const results = await swimming_pool(query, action);
    } catch (err) {
        console.error(err);
        res.send('Error:', err);
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
    const id = req.body.id;

    // Does this: ${variable_name} follow the usual convention for not allowing SQL injections?
    // Also, Intl_aiports has not been added to the DB (database/data/data.sql) yet, if anyone is looking for a quick fix to do.
    // INNER JOIN Intl_Airports ia ON ia.CityId = c.id

    // TODO: uncomment lat/lon checks. Currently, checks result in no matches for some odd reason.
    const query = `
        ${common}
        WHERE C.id = '${id}'
        --AND TRUNC(C.lon, 2) = TRUNC(${lon}, 2)
        --AND TRUNC(C.lat, 2) = TRUNC(${lat}, 2)
    ;`;
    //console.log(query);

    try {
        const results = await swimming_pool(query);
        //console.log('results:', results);
        res.send(results[0]);
    }
    catch(err) {
        console.error(err);
        res.send('Error:', err);
    }
});

// city page
app.post('/city-search', async (req, res) => {
    // get data from POST body.
    const city = req.body.city;
    let ranked = false;

    if (req.body.ranked) {
        ranked = req.body.ranked;
    }

    const query = `
        ${common}
        WHERE C.name ILIKE '%${city}%'
        ORDER BY P.total DESC
        LIMIT ${grid_number}
    ;`;

    const action = (results) => {
        const filters = [];
        if (ranked == true) {
            var cityRank = rankCities(results, filters);
            res.send(cityRank);
        }
        else {
            res.send(results);
        }
    }

    try {
        const results = await swimming_pool(query, action);
    }
    catch(err) {
        console.error(err);
        res.send('Error:', err);
    }
});

// city page
app.post('/grid-search', async (req, res) => {
    // get data from POST body.
    const filters = req.body.filters;

    const query = `
        ${common}
        ORDER BY P.total DESC
    ;`;

    const action = (results) => {
        var cityRank = rankCities(results, filters);
        cityRank.cities.sort((a, b) => parseFloat(b[3]) - parseFloat(a[3]));
        cityRank.cities = cityRank.cities.slice(0, grid_number);
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

// city page
app.post('/city-image', async (req, res) => {

    // get data from POST body.
    const id = req.body.id;

    const query = `
        SELECT src FROM City_Image CI
        WHERE CI.cityid = ${id}
    ;`;

    try {
        const results = await swimming_pool(query);
        res.send(results[0]);
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
        if(filters[i] == "palms"){
            query += ' AND (pt.palms = true)'
        }
   }

    query += " ORDER BY P.total DESC LIMIT 100;";
    //console.log(query);

    const action = (results) => {
        var cityRank = rankCities(results, filters);
        res.send(cityRank);
    }

    try {
        const results = await swimming_pool(query, action);
    } catch (err) {
        console.error(err);
        res.send('Error:', err);
    }


});


app.get('/grid', async (req, res) => {
    var query = `
        ${common}
        ORDER BY P.total DESC
        LIMIT ${grid_number}
    ;`;
    //console.log(query);

    const action = (results) => {
        const filters = [];
        var cityRank = rankCities(results, filters);
        res.render('pages/grid', { cityRank: cityRank, layout : 'layout-map' });
    }

    let cities = [];
    try {
        const results = await swimming_pool(query, action);
    } catch (err) {
        console.error(err);
        res.send('Error:', err);
    }
});

/*
Data and settings page routers
*/

app.get('/data', (req, res) => {
    res.render('pages/data_article');
});

app.get('/settings', (req, res) => {
    res.render('pages/settings');
});


// issues page
app.get('/issues', async (req, res) => {
    if (req.query.id) {
        const id = req.query.id;
        const query = `
        SELECT C.name AS city, CO.name AS country FROM City C
        INNER JOIN Country CO ON CO.id = C.country
        WHERE C.id = ${id}
    ;`;
        //console.log(query);

        const action = (results) => {
            let city = results[0].city;
            let country = results[0].country;
            res.render('pages/issues', {city: city, country: country, id: id});
        };

        try {
            const results = await swimming_pool(query, action);
        } catch(err) {
            console.error(err);
        }
    }
    else {
        res.render('pages/issues', {city: '', country: '', id: ''});
    }


});

// POST request
app.post('/issues-submit', (req, res) => {
    const arr = []
    for (let p in req.body){
        arr.push({'name':p, 'value':req.body[p]});
    }
    const issue_type = arr[0].value;
    const issue_title = arr[1].value;
    const issue_body = arr[2].value;

    const host = 'https://api.github.com';
    let path = '';
    if (issue_type == 'database') {
        path = '/repos/cs467-map/database/issues';
    }
    if (issue_type == 'server') {
        path = '/repos/cs467-map/server/issues';
    }
    const url = host + path;
    console.log(issue_type);
    console.log(host);
    console.log(path);
    console.log(url);

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
    .catch(err => console.error('Error:', err))
    .then(response => console.log('Success:', response))
    .then(res.render("pages/issues-submit", {issue_title: issue_title, issue_body: issue_body, issue_type: issue_type}));
});

// Start app.
app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index', { layout: 'layout-map' }))
    .listen(PORT, () => console.log(`Listening at http://localhost:${ PORT }`))

// -------------------- //
// Helper functions
// -------------------- //

/*
This function ranks the cities that are passed to it. If there are no filters selected,
then it uses our values.
If there is one filter, then it is ranked soley on that filter.
If there are more than one, then the score is a combination of the values of the filter rankings,
plus the rest of the factors, using our values, weighted down to be less impactful.
*/
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
        var filterrank = 0; // Starting rank for each city, for filter button selections
        var weightedrank = 0; // This ranking is for information we have that the user did not select to filter by
        var weight = .2; // Weight given to each section depending on whether or not it was selected as filter
        var weightedCount = 0; //Count of items that may be given a weighted score.
        const pop = Number(cities[i]["population"]);

        // Rank based on filter buttons. These names are in the class list for each button on index.ejs

        //Internet Speed
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
            filterrank += internetRank;
        } else {
            weightedrank += internetRank;
            weightedCount++;
        }

        // Pollution
        var pollution = Number(cities[i]["pollution"]) || 0;
        var pollutionRank = (100 - pollution)/10;
        if(filters.includes("pollution")){ // Index is null or less than 100
            filterrank += pollutionRank;
        } else {
            weightedrank += pollutionRank;
            weightedCount++;
        }

        // Weather
        var avgUV;     // Integer, index of 0 - 16, * 16       For higher accuracy, so its 0 through 256
        var avgPrecip; // Integer, mm
        var avgTemp; // Integer, degrees C * 10
        var uvRank = 0, precipRank = 0, tempRank = 0;

        // Get weather without month
        if (includeMonth == false){
            // get averages
            avgUV = getAvgThing(cities[i], 'uv');
            avgPrecip = getAvgThing(cities[i], 'precip');
            avgTemp = getAvgThing(cities[i], 'temp');


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
        if(filters.includes('uv')){
            filterrank += uvRank;
        } else {
            weightedrank += uvRank;
            weightedCount++;
        }

        //Precip ranking
        if (avgPrecip <= 200){
            precipRank = (200 - avgPrecip)/20; // 0 adds 10 to rank, 200 adds 0
        } else if (rank < 300) {
            precipRank -= 2;
        } else { // At a certain point it doesnt matter, you're just in the rain.
            precipRank -= 5;
        }
        if (filters.includes('precipitation')){ // in MM, from 0 to ~800
            filterrank += precipRank;
        } else {
            weightedrank += precipRank;
            weightedCount++;
        }

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
        if (filters.includes('cold') || filters.includes('temperate') || filters.includes('warm') || filters.includes('hot')){
            filterrank += tempRank;
        } else {
            weightedrank += tempRank;
            weightedCount++;
        }

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
        if (filters.includes('rural') || filters.includes('town') || filters.includes('city') || filters.includes('metro')){
           filterrank += popRank;
        } else {
            weightedrank += popRank;
            weightedCount++;
        }

        // Purchasing power
        var purchasePower = cities[i]["purchasingpower"];
        var pppRank = Math.round((1 - purchasePower)*10);
        if(filters.includes('purchase')){
            filterrank += pppRank;
        } else {
            weightedrank += pppRank;
            weightedCount++;
        }

        // Socioeconomic filter
        var povertyindex = cities[i].povertyindex;
        //console.log("Socioeconomic filter:", povertyindex);
        if (filters.includes('high-poverty-index')){
            filterrank += povertyindex - 2;
        }
        else if (filters.includes('medium-poverty-index')){
            filterrank += 2 - povertyindex;
        }
        else if (filters.includes('low-poverty-index')){
            filterrank += 4 - povertyindex;
        }
        else {
            weightedrank += 4 - povertyindex;
            weightedCount++;
        }

        // Homicides and female homicides by country
        // Max is 83, avg is 7.5, America is 4.9, 0s means no data
        var totalHoms = Number(cities[i]["totalhomicides"]) || 0;
        var femaleHoms = Number(cities[i]["femalehomicides"]) || 0;
        var safe, safeforwomen;
        if(totalHoms > 8 || totalHoms == 0){
            safe = 0;
        } else {
            safe = 10 - totalHoms;
        }

        if(femaleHoms > 8 || femaleHoms == 0){
            safeforwomen = 0;
        } else {
            safeforwomen = 10 - femaleHoms;
        }

        if (filters.includes('safe')){
            filterrank += safe;
        } else {
            weightedrank += safe;
            weightedCount++;
        }

        if (filters.includes('safeforwomen')){
            filterrank += safeforwomen;
        } else {
            weightedrank += safeforwomen;
            weightedCount++;
        }

        var rank;
        if(filters.length == 0 || (filters.length == 1 && (filters[0] == "palms" || filters[0] == "beaches" || filters[0] == "airports"))){
            rank = weightedrank/weightedCount;
        }
        else if(filters.length == 1 && filters[0] != "palms" && filters[0] != "beaches" && filters[0] != "airports"){
            rank = filterrank;
        }
        else {
            rank = (filterrank + (weightedrank * weight) ) / (filters.length + (weightedCount * weight));
        }

        // Adjust to onle 1 decimal place
        var roundedRank = Math.round(rank * 10)/10;

        //name, lon, lat, rank, id
        if (cities[i]['image']) {
            rankedCities.push([cities[i]["city"], Number(cities[i]["lon"]), Number(cities[i]["lat"]), roundedRank, cities[i]["id"], cities[i]["image"]]);
        }
        else {
            rankedCities.push([cities[i]["city"], Number(cities[i]["lon"]), Number(cities[i]["lat"]), roundedRank, cities[i]["id"]]);
        }

    }

    for (var l = 0; l < rankedCities.length; l++){
        //console.log('ranked:', rankedCities[l]);
        rankedCities[l][3] = (rankedCities[l][3]).toFixed(1);
    }

    var returnVal = {'cities': rankedCities};
    return returnVal;
}

// a sleep deprived attempt to standardize interactions with the client.
// makes for an error handling experience with fewer suprises.
async function swimming_pool(query = '', action) {
    try {
        const client = await pool.connect()
        const result = await client.query(query);
        const results = result ? result.rows : null;
        client.release();

        // return results
        if (arguments.length == 1) {
            return results;
        }
        // do assigned action with results
        else {
            action(results);
        }

    //TODO: It should probably just show the data that it can get, or say that it can't find data.
    } catch (err) {
        console.error(err);
    }
}

function getAvgThing(obj, prefix = '') {
    let total = [];
    Object.keys(obj).forEach(key => {
        if (key.substring(0, prefix.length) == prefix) {
            total.push(obj[key]);
        }
    });

    // cool reduce operation
    // https://stackoverflow.com/questions/1230233/how-to-find-the-sum-of-an-array-of-numbers
    const sum = total.reduce((a, b) => a + b);
    return Math.round(sum / total.length);
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
