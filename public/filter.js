$("#toggle").click(() => {
    /* to toggle the sidebar, just switch the CSS classes */
    $("#filter").toggleClass("hidden");
    $("#content").toggleClass("col-lg-12 col-lg-10");
});

const slider = document.getElementById("myRange");
const output = document.getElementById("demo");
output.innerHTML = slider.value; // Display the default slider value

Voyager.setMarkerType("internet");
console.log("Voyager:", Voyager);

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    output.innerHTML = this.value;
}

$("#internet").click(() => {
    Voyager.setMarkerType("internet");
    Voyager.makeBBoxRequest();
});

$("#population").click(() => {
    Voyager.setMarkerType("population");
    Voyager.makeBBoxRequest();
});

$("#rating").click(() => {
    Voyager.setMarkerType("rating");
    Voyager.makeBBoxRequest();
});
