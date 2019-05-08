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
    // https://old.reddit.com/r/loadingicon/comments/6h421f/winders_oc/
    $('#city-image').attr('src', 'loading-davebees.gif');
    $(window).off('click');
}


async function cityImage(city) {
    $('#city-popup').removeClass('hidden');

    console.log("cityImage:", city);
    try {
        const city_req = await getCity(city);
        const city_name = city_req.name;
        const city_image = city_req.image;

        //$('#city-name').text(city_name);
        $('#city-image').attr('src', city_image);
    }

    catch(error) {
        $(window).off('click');
        console.error(error);
        $('#city-image').attr('src', '404.gif');
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


async function cityInfo(features) {
    console.log("city info checking in:", features);

    const properties = ['name', 'country', 'population', 'internet', 'lon', 'lat'];
    for (let i = 0; i < properties.length; i++) {
        //console.log(features[0].get(properties[i]));
        const val = features[0].get(properties[i]);
        $('#popup-' + properties[i]).text(val);
    }
}
