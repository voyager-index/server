$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});


// default values
$("#population").prop("checked", true);
Voyager.setState('marker', 'population');


const slider = document.getElementById("myRange");
const output = document.getElementById("demo");
output.innerHTML = slider.value; // Display the default slider value

console.log("Voyager:", Voyager);

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    output.innerHTML = this.value;
}

$("#internet").click(() => {
    Voyager.setState("marker", "internet");
    changeMarkers();
});

$("#population").click(() => {
    Voyager.setState("marker", "population");
    changeMarkers();
});

$(".submit").click(() => {
    setAllStates();
});

$(".clear").click(() => {
    $(".filter-input").val('');
    setAllStates();
    changeMarkers();
});

$(".filter-input").on('change input', function() {
    console.log("changed.");
    setAllStates();
});

function getInputValues() {
    const pop_min = $("#pop_min").val() * Math.pow(10,6) || 0;
    const pop_max = $("#pop_max").val() * Math.pow(10,6) || Math.pow(10,10);
    const internet_min = $("#internet_min").val() || 0;
    const internet_max = $("#internet_max").val() || Math.pow(10,10);

    const obj = new Object();

    obj.pop_min = pop_min;
    obj.pop_max = pop_max;
    obj.internet_min = internet_min;
    obj.internet_max = internet_max;

    return obj;
}


function setAllStates() {
    const obj = getInputValues();
    Voyager.setState("pop", [obj.pop_min, obj.pop_max]);
    Voyager.setState("internet", [obj.internet_min, obj.internet_max]);

    changeMarkers();
}


function changeMarkers() {
    const state = Voyager.getState();

    const data_send = {
        'bounding_box': Voyager.getPoints(),
        'type': state.marker,
        'pop_min': state.pop[0],
        'pop_max': state.pop[1],
        'internet_min': state.internet[0],
        'internet_max': state.internet[1]
    };

    postData(`/bounding`, data_send)
        .then(data => Voyager.buildFeatures(data))
        .catch(error => console.error(error));
}


// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
function postData(url = ``, data = {}) {
    console.log("Sending", JSON.stringify(data), "to", url);
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json());
}
