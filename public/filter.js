$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter-col").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});

$("filter > .btn").click(() => {
    changeMarkers();
});

// mimics radio button for filters
function button_group(...args) {
    args.forEach((arg) => {
        $('.' + arg).click((e) => {

            // remove active class from other buttons
            args.forEach((a) => {
                if (a != arg) {
                    $('.' + a).removeClass('active');
                }
            });

            // change markers
            changeMarkers();
        });
    });
}

// city size filter
button_group('rural', 'town', 'city', 'metro');

// temperature filter
button_group('cold', 'temperate', 'warm', 'hot');

// Gets list of filters from Voyager module (/public/main.js).
// Gets bouding box from Voyager module (/public/main.js).
// Sends both to /bounding as POST request.

// /index.js receives request, queries database, ranks cities,
// and returns city array (as data.cities).

// Calls Voayger.buildFeatures() with city array.
function changeMarkers() {
    const filters = Voyager.getFilters();
    console.log('filters:', filters);

    const data_send = {
        'bounding_box': Voyager.getPoints(),
        'filters': filters
    };

    postData(`/bounding`, data_send)
        .then(data => Voyager.buildFeatures(data.cities))
        .catch(error => console.error(error));
}
