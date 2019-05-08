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
});


function close_popup() {
    $('#city-popup').addClass('hidden');

    $('#image').empty();
    // https://old.reddit.com/r/loadingicon/comments/6h421f/winders_oc/
    $('#image').append("<img id='city-image' src='loading-davebees.gif'/>");

    $(window).off('click');
}


async function cityImage(city, lat, lon) {
    try {
        const city_req = await getCity(city);
        const city_image = city_req.image;

        $('#city-image').attr('src', city_image);
    }

    catch(error) {
        $(window).off('click');
        console.error(error);
        $('#image').empty();
        $('#image').append("<div id='map-fallback'></div>");
        const map = Voyager.makeMap(lon, lat, 11, 'map-fallback');
    }

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
    cityImage(name, lat, lon);


    // These properties must be present in both the the DB response, and the city-popup div in index.ejs 
    const properties = ['city', 'country', 'population', 'mbps', 'lon', 'lat', 'elevation', 'pollution', 'airport', 'beach'];
    for (let i = 0; i < properties.length; i++) {
        const val = features[properties[i]];
        $('#popup-' + properties[i]).text(val);
    }

}
