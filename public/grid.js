// Grid page also has the city.js script, and so can use getCity() if need be

$(document).ready(async () => {
    grid_init();
    $('#city-popup').css('margin-right', '50%');
    $('#city-popup').css('margin-left', '-5%');
    $('#city-popup').css('width', '70%');
});

function grid_init() {
    // add event listeners to each city in the grid.
    const gridItems = document.getElementsByClassName("grid-item");
    for (var i = 0; i < gridItems.length; i++){
        // hover listner
        gridItems[i].addEventListener("mouseover", function(e) {
            this.lastElementChild.textContent = "hi from public/grid.js";
        });

        // hover off listner
        gridItems[i].addEventListener("mouseleave", function(e) {
            this.lastElementChild.textContent = "";
        });

        // click listner (brings up the standard city popup).
        gridItems[i].addEventListener("click", function(e) {
            $('#city-popup').removeClass('hidden'); // Moved here for separation of concerns
            const city = $(this)[0].children[1].getAttribute('data-name');
            const lat = $(this)[0].children[2].getAttribute('data-lon');
            const lon = $(this)[0].children[3].getAttribute('data-lat');
            const id = $(this)[0].children[5].getAttribute('data-id');
            const data_send = {
                'id': id,
                'name': city,
                'lat': lat,
                'lon': lon,
            };

            postData(`/city`, data_send)
                .then(data => {
                    console.log('data:', data);
                    cityInfo(data);
                })
                .catch(error => console.error(error));
        });
    }

    // get image of each city
    for (var i = 0; i < gridItems.length; i++) {
        const city = gridItems[i].innerText;
        const cityImage = $(gridItems[i]).find('img')[0];
        //cityImage.src = 'loading-davebees.gif';
        const id = gridItems[i].children[5].getAttribute('data-id');
        const data_send = {
            'id': id,
        };

        postData(`/city-image`, data_send)
            .then(data => {
                cityImage.src = data[0].src;
            })
            .catch(async (err) => {
                //console.error(err);
                try {
                    const city_req = await getCity(city);
                    const city_name = city_req.name;
                    const city_image = city_req.image;
                    cityImage.src = city_image;
                } catch(err) {
                    //console.error(err);
                    try {
                        const city_req = await getCityFallback(city);
                        cityImage.src = city_req;
                    } catch(err) {
                        cityImage.src = '/city.png';
                        //console.error(err);
                        //console.error('Could not find image for city ' + id);
                    }
                }
            });
    }
}
