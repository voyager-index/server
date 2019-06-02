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
        'rank': true,
    }

    postData('/city-search', data)
        .then(response => {
            console.log('response:', response);
            build_grid(response.cities);
        });
}
