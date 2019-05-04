/*
$(document).ready(() => {
    $("#submit").click((event) => {
        event.preventDefault();
        const query = $("#city-name").val();
        main(query);
    })

    $('#city-name').on('keyup', (event) => {
        if (event.keyCode == 13) {
            const query = $("#city-name").val();
            cityImage(query);
        }
    })

    cityImage("portland");
});
*/


$(window).keydown((e) => {
    e = e || window.event;
    let key = e.which || e.keyCode; // keyCode detection
    console.log("key:", key);
    if (key == 27) {
        close_popup();
    }
});


$('.exit').click(() => {
    close_popup();
});


function close_popup() {
    $('#city-popup').addClass('hidden');
    // https://old.reddit.com/r/loadingicon/comments/6h421f/winders_oc/
    $('#city-image').attr('src', 'loading-davebees.gif');
    $(window).off('click');
}


async function cityImage(city) {
    $('#city-popup').removeClass('hidden');

    try {
        const city_req = await getCity(city);
        const city_name = city_req.name;
        const city_image = city_req.image;

        $('#city-name').val(city_name);
        $('#city-image').attr('src', city_image);
    }
    catch(error) {
        $(window).off('click');
        console.error(error);
        $('#city-image').attr('src', 'https://i.imgur.com/0kvtMLE.gif');
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


// Returns a city's name and image.
async function getCity(city) {
    const city_search = "https://api.teleport.org/api/cities/?search=" + city;
    const city_url = 'data._embedded["city:search-results"][0]._links["city:item"].href';
    const city_guess = 'data._embedded["city:search-results"][0].matching_full_name';
    const urban_url = 'data._links["city:urban_area"].href';
    const image_url = 'data._links["ua:images"].href';
    const mobile_url = 'data.photos[0].image.mobile';

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

// Used to interprete JSON objects returned by requests to API's.
// Fetches "url" and returns whatever value is associated with the "object".
async function getThing(url, object) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            return eval(object);
        })
}


/*

    // get city name from POST body.
const city = encodeURI(req.body.city);

// error page
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
    console.log(error);
    err();
}
*/
