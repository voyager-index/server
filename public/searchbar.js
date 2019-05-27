$(document).ready(() => {
    $('#city-search').on('input', function(){
        search_for(this.value);
    });

    $('#clear').click(() => {
        $('#city-search')[0].value = '';
        search_for('');
    });

});

function search_for(value){
    const data = {
        'search_string': value,
    }

    postData('/city-search', data)
    .then(response => build_grid(response.cities));
}

function build_grid(arr) {
    $('.grid-container').empty();
    arr.forEach((city) => {
        const item = $('<div>', {class: 'grid-item'});

        const img = $('<img>', {class: 'city-image'});

        const name = $('<h3>', {class: 'city-name', text: city[0]});
        name.attr('data-name', city[0]);

        $('.grid-container').append(item);
        item.append(img);
        item.append(name);

        const arr = [
            'lon', 'lat', 'rank', 'id'
        ];
        let i = 1;

        arr.forEach((element) => {
            const div = $('<div>');
            div.attr(`data-${element}`, city[i]);
            item.append(div);
            i += 1;
        });

        const hover_text = $('<p>', {class: 'hover-text'});
        item.append(hover_text);

        grid_init();
    });
}
