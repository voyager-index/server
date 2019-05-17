// Grid page also has the city.js script, and so can use getCity() if need be

$(document).ready(() => {
	const gridItems = document.getElementsByClassName("grid-item");
	for (var i = 0; i < gridItems.length; i++){
		gridItems[i].addEventListener("mouseover", function(e) {
			this.lastElementChild.textContent = "hi";
		})

		gridItems[i].addEventListener("mouseleave", function(e) {
			this.lastElementChild.textContent = "";
		})
	}
});