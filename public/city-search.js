$(document).ready(() => {
    $("#submit").click((event) => {
        event.preventDefault();
        const query = $("#city-name").val();
        cityImage(query);
    })

    $('#city-name').on('keyup', (event) => {
        if (event.keyCode == 13) {
            const query = $("#city-name").val();
            cityImage(query);
        }
    })

    cityImage("portland");
});


async function cityImage(city) {
    const city_req = await getCity(city);
    const city_name = city_req.name;
    const city_image = city_req.image;

    $('#city-name').val(city_name);
    $('#city-image').attr('src', city_image);
}
