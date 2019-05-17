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
            window.alert("Eventually there will be an overlay that appears instead.");
        });

        const city = gridItems[i].innerText;
        const cityImage = gridItems[i].childNodes[1];
        //cityImage.src = 'loading-davebees.gif';

        try {
            const city_req = await getCity(city);
            console.log('city_req:', city_req);
            const city_name = city_req.name;
            const city_image = city_req.image;
            cityImage.src = city_image;
        }
        catch(err) {
            console.log(err);
            const city_req = await getCityFallback(city);
            console.log('city_req:', city_req);
            cityImage.src = city_req;
        }
    }
});
