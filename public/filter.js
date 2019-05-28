$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter-col").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});

$("#filter > .btn").click(() => {
    //changeMarkers();
    changeGrid();
});

// mimics radio button for filters
// with rest parameter syntax
function button_group(...args) {
    args.forEach((arg) => {
        $('.' + arg).off('click');
        $('.' + arg).click((e) => {
            // remove active class from other buttons
            args.forEach((a) => {
                if (a != arg) {
                    $('.' + a).removeClass('active');
                }
            });

            //changeMarkers();
            changeGrid();
        });
    });
}

// city size filter
button_group('rural', 'town', 'city', 'metro');

// temperature filter
button_group('cold', 'temperate', 'warm', 'hot');

// Months
button_group('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec');

// Socioeconomic filter
button_group('high-poverty-index', 'medium-poverty-index', 'low-poverty-index');


function changeMarkers() {
    // Gets list of filters from Voyager module (/public/main.js).
    // Gets bouding box from Voyager module (/public/main.js).
    // Sends both to /bounding as POST request.
    const filters = Voyager.getFilters();
    //console.log('filters:', filters);

    const data_send = {
        'bounding_box': Voyager.getPoints(),
        'filters': filters,
    };

    // /index.js receives request, queries database, ranks cities,
    // and returns city array (as data.cities).
    // Calls Voayger.buildFeatures() with city array.
    postData(`/bounding`, data_send)
        .then(data => Voyager.buildFeatures(data.cities))
        .catch(error => console.error(error));
}


function changeGrid() {
    const filters = Voyager.getFilters();
    console.log('filters:', filters);

    const data_send = {
        'filters': filters,
    };

    // /index.js receives request, queries database, ranks cities,
    // and returns city array (as data.cities).
    // Calls Voayger.buildFeatures() with city array.
    postData(`/grid-search`, data_send)
        .then(data => build_grid(data.cities))
        .catch(error => console.error(error));
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

$(function(){
    $('input[name="city-type"]').click(function(){
        var $radio = $(this);

        // if this was previously checked
        if ($radio.data('waschecked') == true)
        {
            $radio.prop('checked', false);
            $radio.data('waschecked', false);
            $radio.class += " active";
        }
        else
            $radio.data('waschecked', true);

        // remove was checked from other radios
        $radio.siblings('input[name="rad"]').data('waschecked', false);
    });
});

$(function() {
        // When the value of the radio change
        $('input[name="city-type"]').on('change', function() {
            $(this).parent()
            .addClass('active')
            .siblings().removeClass('active');
        });
    });
