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

        if (state[5]) {
            const image = state[5];
            $('#city-image').attr('src', image);
        }

        else {
            $('#image').empty();
            $('#image').append("<img id='city-image' class='w-85' src=''/>");
            cityImage(city, lat, lon, id);
        }
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
    $('#image').append("<img id='city-image' class='w-85' src=''/>");

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

    const data_send = {
        'name': city,
        'lat': lat,
        'lon': lon,
        'id': id,
    };

    const element = $('#city-image');
    getImage(data_send, element);
}

// Calls cityImage() now
async function cityInfo(features) {
    const city = features.city;
    const lat = features.lat;
    const lon = features.lon;
    const id = features.id;

    if (features.image) {
        const image = features.image;
        saveState(city, lat, lon, id, image);
        $('#city-image').attr('src', image);
    }
    else {
        saveState(city, lat, lon, id);
        cityImage(city, lat, lon, id);
    }

    // These properties must be present in both the the DB response, and the city-popup div in index.ejs
    const properties = ['city', 'country', 'population', 'lon', 'lat', 'elevation', 'airport', 'intlairport', 'beach', 'palms', 'totalhomicides', 'femalehomicides'];
    for (let i = 0; i < properties.length; i++) {
        const val = features[properties[i]];
        $('#popup-' + properties[i]).text(val);
    }
    const fixedproperties = [ 'mbps', 'pollution', 'purchasingpower', 'povertyindex'];
    for (let i = 0; i < fixedproperties.length; i++) {
        const val = Number(features[fixedproperties[i]]).toFixed(2);
        $('#popup-' + fixedproperties[i]).text(val);
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

    $(window).on('click', (e) => {
        e = e || window.event;
        const element = document.getElementById('city-popup');
        console.log('click!');

        // https://stackoverflow.com/questions/34621987/check-if-clicked-element-is-descendant-of-parent-otherwise-remove-parent-elemen
        if (e.target !== element &&
            ! element.contains(e.target)) {
            close_popup();
        }
    });
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
