$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});

// default
$("#population").prop("checked", true);
setType('population');

const slider = document.getElementById("myRange");
const output = document.getElementById("demo");
output.innerHTML = slider.value; // Display the default slider value

console.log("Voyager:", Voyager);

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    output.innerHTML = this.value;
}

$("#internet").click(() => {
    setType("internet");
    changeMarkers();
});

$("#population").click(() => {
    setType("population");
    changeMarkers();
});

$(".submit").click(() => {
    const pop_min = $("#pop_min").val() || 0;
    const pop_max = $("#pop_max").val() || Math.pow(10,10);
    Voyager.setPops(pop_min, pop_max);
    changeMarkers();
});

$(".clear").click(() => {
    const pop_min = 0;
    const pop_max = Math.pow(10,10);
    Voyager.setPops(pop_min, pop_max);
    changeMarkers();
    $("input").val('');
});

function setType(newType) {
    Voyager.setMarkerType(newType);
}

function getType() {
    return Voyager.getMarkerType();
}

function getPopMin() {
    return Voyager.getPops()[0];
}

function getPopMax() {
    return Voyager.getPops()[1];
}

function changeMarkers() {
    const data_send = {'bounding_box': Voyager.getPoints(), 'type': getType(), 'pop_min': getPopMin(), 'pop_max': getPopMax()};
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
