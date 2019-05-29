$(document).ready(() => {

    $('#clear').click(() => {
        $('#city-search')[0].value = '';
        search_for('');
    });

    //setup before functions
    let typingTimer;                //timer identifier
    const doneTypingInterval = 200;  //time in ms

    //on keyup, start the countdown
    $('#city-search').keyup(function(){
        clearTimeout(typingTimer);
        if ($('#city-search').val()) {
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        }
    });

    //user is "finished typing," do something
    function doneTyping() {
        //do something
        const val = $('#city-search').val();
        console.log('done.', val);
        search_for(val);
    }

});

function search_for(value){
    const data = {
        'city': value,
        'ranked': true,
    }

    postData('/city-search', data)
        .then(response => {
            console.log('response:', response);
            build_grid(response.cities);
        });
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
