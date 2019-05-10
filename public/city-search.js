$(document).ready(() => {
    $("#submit").click((event) => {
        event.preventDefault();
        const query = $("#city-search").val();
        cityImage(query);
    })

    $('#city-search').on('keyup', (event) => {
        if (event.keyCode == 13) {
            const query = $("#city-search").val();
            cityImage(query);
        }
    })

    cityImage("portland");
});


async function cityImage(city) {
    const city_req = await getCity(city);
    const city_name = city_req.name;
    const city_image = city_req.image;

    $('#city-search').val(city_name);
    $('#city-image').attr('src', city_image);
}
