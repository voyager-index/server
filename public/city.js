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
