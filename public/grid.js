// Grid page also has the city.js script, and so can use getCity() if need be

$(document).ready(async () => {
    grid_init();
});

function grid_init() {
    // add event listeners to each city in the grid.
    const gridItems = document.getElementsByClassName("grid-item");
    for (var i = 0; i < gridItems.length; i++){
        const rank = gridItems[i].children[4].getAttribute('data-rank');

        // hover listner
        gridItems[i].addEventListener("mouseover", function(e) {
            this.lastElementChild.textContent = "rank: " + rank;
        });


        // hover off listner
        gridItems[i].addEventListener("mouseleave", function(e) {
            this.lastElementChild.textContent = "";
        });

        // click listner (brings up the standard city popup).
        gridItems[i].addEventListener("click", function(e) {
            const image = $(this)[0].children[0].src;
            const city = $(this)[0].children[1].getAttribute('data-name');
            const lat = $(this)[0].children[2].getAttribute('data-lon');
            const lon = $(this)[0].children[3].getAttribute('data-lat');
            const id = $(this)[0].children[5].getAttribute('data-id');

            $('#city-image').attr('src', image);
            $('#city-popup').removeClass('hidden'); // Moved here for separation of concerns

            const data_send = {
                'id': id,
                'name': city,
                'lat': lat,
                'lon': lon,
            };

            postData(`/city`, data_send)
                .then(data => {
                    // city-popup.js
                    data.image = image;
                    cityInfo(data);
                })
                .catch(error => console.error(error));
        });
    }

    // get image of each city
    for (var i = 0; i < gridItems.length; i++) {
        const cityImage = $(gridItems[i]).find('img')[0];
        const image = gridItems[i].children[6].getAttribute('data-image');

        if (image) {
            $(cityImage).attr('src', image);
        }

        else {
            const city = gridItems[i].innerText;
            const id = gridItems[i].children[5].getAttribute('data-id');
            const data_send = {
                'id': id,
                'city': city,
            };

            getImage(data_send, cityImage);
        }
    }
}
