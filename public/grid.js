// Grid page also has the city.js script, and so can use getCity() if need be

$(document).ready(() => {
	const gridItems = document.getElementsByClassName("grid-item");
	for (var i = 0; i < gridItems.length; i++){
		gridItems[i].addEventListener("mouseover", function(e) {
			this.lastElementChild.textContent = "hi from public/grid.js";
		});

		gridItems[i].addEventListener("mouseleave", function(e) {
			this.lastElementChild.textContent = "";
		});

		gridItems[i].addEventListener("click", function(e) {
			window.alert("Eventually there will be an overlay that appears instead.");
		});
	}
});