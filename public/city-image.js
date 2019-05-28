async function getImage(data_send, element) {
    // tries very hard to get city image.
    // option 1: see if image is in database.
    postData(`/city-image`, data_send)
        .then(data => $(element).attr('src', data.src))
        .catch(async (err) => {
            //console.error(err);
            $(element).attr('src', 'city-default.jpg');
            try {
                    // option 3: use google places api to get image.
                    const city_req = await getCityFallback(data_send.city);
                    $(element).attr('src', city_req);
            } catch(err) {
                //console.error(err);
                try {
                // option 2: use teleport api to get image.
                const city_req = await getCity(data_send.city);
                const city_name = city_req.name;
                const city_image = city_req.image;
                $(element).attr('src', city_image);
                } catch(err) {
                    // no image found.
                    //console.error(err);
                    console.error('Could not find image for city ' + data_send.id);
                }
            }
        });
}
