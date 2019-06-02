function build_grid(arr) {
    $('.grid-container').empty();
    arr.forEach((city) => {
        const item = $('<div>', {class: 'grid-item'});

        const img = $('<img>', {class: 'city-image'});

        const name = $('<h3>', {class: 'city-name', text: city.city});
        name.attr('data-name', city.city);

        $('.grid-container').append(item);
        item.append(img);
        item.append(name);

        const arr = [
            'lon', 'lat', 'rank', 'id'
        ];

        arr.forEach((element) => {
            const div = $('<div>');
            div.attr(`data-${element}`, city[element]);
            item.append(div);
        });

        const hover_text = $('<p>', {class: 'hover-text'});
        item.append(hover_text);

        grid_init();
    });
}

