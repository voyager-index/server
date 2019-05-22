// Grid page also has the city.js script, and so can use getCity() if need be

$(document).ready(async () => {
    const gridItems = document.getElementsByClassName("grid-item");
    for (var i = 0; i < gridItems.length; i++){
        gridItems[i].addEventListener("mouseover", function(e) {
            this.lastElementChild.textContent = "hi from public/grid.js";
        });

        gridItems[i].addEventListener("mouseleave", function(e) {
            this.lastElementChild.textContent = "";
        });

        gridItems[i].addEventListener("click", function(e) {
            $('#city-popup').removeClass('hidden'); // Moved here for separation of concerns
            const city = $(this)[0].children[1].getAttribute('data-name');
            const lat = $(this)[0].children[2].getAttribute('data-lon');
            const lon = $(this)[0].children[3].getAttribute('data-lat');
            const data_send = {
                'name': city,
                'lat': lat,
                'lon': lon,
            };

            postData(`/city`, data_send)
                .then(data => cityInfo(data))
                .catch(error => console.error(error));
        });
    }

    for (var i = 0; i < gridItems.length; i++) {
        const city = gridItems[i].innerText;
        const cityImage = gridItems[i].childNodes[1];
        //cityImage.src = 'loading-davebees.gif';
        const id = gridItems[i].children[5].getAttribute('data-id');
        const data_send = {
            'id': id,
        };

        postData(`/city-image`, data_send)
            .then(data => cityImage.src = data.src)
            .catch(async () => {
                try {
                    const city_req = await getCity(city);
                    const city_name = city_req.name;
                    const city_image = city_req.image;
                    cityImage.src = city_image;
                }
                catch(err) {
                    console.log(err);
                    const city_req = await getCityFallback(city);
                    cityImage.src = city_req;
                }
            });
    }
});
