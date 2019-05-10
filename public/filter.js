$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});

$(".internet").click(() => {
    changeMarkers();
});

$(".beaches").click(() => {
    changeMarkers();
});

$(".pollution").click(() => {
    changeMarkers();
});

function changeMarkers() {
    const filters = Voyager.getFilters();
    console.log("filters:", filters);

    const data_send = {
        'bounding_box': Voyager.getPoints(),
        'filters': filters
    };

    postData(`/bounding`, data_send)
        .then(data => Voyager.buildFeatures(data.cities))
        .catch(error => console.error(error));
}
