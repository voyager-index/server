$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter-col").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});

$(".internet").click(() => {
    changeMarkers();
});

$(".beaches").click(() => {
    changeMarkers();
});

$(".pollution").click(() => {
    changeMarkers();
});

function changeMarkers() {
    const filters = Voyager.getFilters();

    const data_send = {
        'bounding_box': Voyager.getPoints(),
        'filters': filters
    };

    postData(`/bounding`, data_send)
        .then(data => Voyager.buildFeatures(data.cities))
        .catch(error => console.error(error));
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