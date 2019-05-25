let _state = {};
const DEBUG = false;

$(window).keydown((e) => {
    e = e || window.event;
    let key = e.which || e.keyCode; // keyCode detection
    console.log("key:", key);
    if (key == 27) {
        close_popup();
    }
});


$(document).ready(() => {
    $('.exit').click(() => {
        close_popup();
    });

    // show image of the city
    $('#select-image').click(() => {
        const state = getState();
        const city = state[0];
        const lat = state[1];
        const lon = state[2];
        const id = state[3];

        $('#image').empty();
        $('#image').append("<img id='city-image' class='w-85' src='loading-davebees.gif'/>");
        cityImage(city, lat, lon, id);
    });

    // show map of the city
    $('#select-map').click(() => {
        const state = getState();
        const lat = state[1];
        const lon = state[2];

        $('#image').empty();
        $('#image').append("<div id='map-fallback'></div>");

        // call makeMap() function in /public/main.js
        const map = Voyager.makeMap(Number(lon), Number(lat), 11, 'map-fallback');
    });
});


function close_popup() {
    $('#city-popup').addClass('hidden');

    $('#image').empty();

    // loading animation
    // source: https://old.reddit.com/r/loadingicon/comments/6h421f/winders_oc/
    $('#image').append("<img id='city-image' class='w-85' src='loading-davebees.gif'/>");

    $(window).off('click');
}


// loads city image.
async function cityImage(city, lat, lon, id) {
    if (DEBUG) {
        console.log('city:', city);
        console.log('lat:', lat);
        console.log('lon:', lon);
        console.log('id:', id);
    }

    saveState(city, lat, lon, id);

    const data_send = {
        'name': city,
        'lat': lat,
        'lon': lon,
        'id': id,
    };

    // tries very hard to get city image.
    // option 1: see if image is in database.
    postData(`/city-image`, data_send)
        .then(data => $('#city-image').attr('src', data.src))
        .catch(async (err) => {
            console.error(err);
            try {
                // option 2: use teleport api to get image.
                const city_req = await getCity(city);
                const city_name = city_req.name;
                const city_image = city_req.image;
                $('#city-image').attr('src', city_image);
            } catch(err) {
                //console.error(err);
                try {
                    // option 3: use google places api to get image.
                    const city_req = await getCityFallback(city);
                    $('#city-image').attr('src', city_req);
                } catch(err) {
                    // no image found.
                    $('#city-image').attr('src', '/city.png');
                    //console.error(err);
                    //console.error('Could not find image for city ' + id);
                }
            }
        });

    $(window).on('click', (e) => {
        e = e || window.event;
        const element = document.getElementById('city-popup');

        // https://stackoverflow.com/questions/34621987/check-if-clicked-element-is-descendant-of-parent-otherwise-remove-parent-elemen
        if (e.target !== element &&
            ! element.contains(e.target)) {
            close_popup();
        }
    });
}

// Calls cityImage() now
async function cityInfo(features) {
    const name = features.city;
    const lat = features.lat;
    const lon = features.lon;
    const id = features.id;
    cityImage(name, lat, lon, id);

    // These properties must be present in both the the DB response, and the city-popup div in index.ejs
    const properties = ['city', 'country', 'population', 'mbps', 'lon', 'lat', 'elevation', 'pollution', 'airport', 'beach'];
    for (let i = 0; i < properties.length; i++) {
        const val = features[properties[i]];
        $('#popup-' + properties[i]).text(val);
    }

    $('#popup-issues').attr('href', '/issues/?id=' + id);

    const tempProperties = ['tempJan', 'tempFeb', 'tempMar', 'tempApr', 'tempMay' , 'tempJun' , 'tempJul',
        'tempAug' , 'tempSep' ,'tempOct' , 'tempNov' , 'tempDec'];
    for (let i = 0; i < tempProperties.length; i++) {
        const val = Number(features[tempProperties[i].toLowerCase()]) / 10;
        $('#popup-' + tempProperties[i]).text(val);
    }

    const precipProperties = ['precipJan',  'precipFeb', 'precipMar' ,'precipApr' , 'precipMay' , 'precipJun',
        'precipJul' , 'precipAug' ,'precipSep' , 'precipOct' , 'precipNov' , 'precipDec'];
    for (let i = 0; i < precipProperties.length; i++) {
        const val = features[precipProperties[i].toLowerCase()];
        $('#popup-' + precipProperties[i]).text(val);
    }

    const uvProperties = ['uvJan',  'uvFeb',  'uvMar' , 'uvApr' , 'uvMay' , 'uvJun' ,'uvJul' , 'uvAug' , 'uvSep' , 'uvOct' , 'uvNov' , 'uvDec'];
    for (let i = 0; i < uvProperties.length; i++) {
        const val = Math.round(Number(features[uvProperties[i].toLowerCase()]) / 16);
        $('#popup-' + uvProperties[i]).text(val);
    }

}

function getState() {
    return _state;
}

// saves the current name, lat, lon, and id of the city for global use.
function saveState(...args) {
    let i = 0;
    args.forEach((arg) => {
        _state[i] = arg;
        i += 1;
    });
    console.log(_state);
}
