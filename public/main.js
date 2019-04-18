var cityMarkers = [];
var markerVectorLayer;

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([0,0]),
    zoom: 3,
    projection: "EPSG:3857"
    //units: 'degrees'
  })
});

// onMoveEnd is called anytime the map moves at all (scroll or zoom)
map.on('moveend', onMoveEnd);

function onMoveEnd(evt) {
  var map = evt.map;
  // This gets the bounding box, but as a different type of coordinate system
  var extent = map.getView().calculateExtent(map.getSize());
  var points = [];

  // Convert to Lon/Lat
  var bottomLeft = ol.proj.toLonLat([extent[0], extent[1]]);
  var topRight = ol.proj.toLonLat([extent[2], extent[3]]);
  points.push(bottomLeft[0]);
  points.push(bottomLeft[1]);
  points.push(topRight[0]);
  points.push(topRight[1]);

  //Send bounding box coords to server.
  makeBBoxRequest(points);
}

// Every movement on the map, scroll or zoom, triggers the makeBBoxRequest() function,
// which sends a POST request containing a bounding box array to the server.
function makeBBoxRequest(points){
  var http = new XMLHttpRequest();
  http.open("POST", '/bounding', true);
  http.setRequestHeader("Content-Type", "application/json");

  http.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        console.log("Server: ", this.response);

        const cities = this.response;

        buildFeatures(cities);
    }
  }
  var param = {'bounding_box': points};
  console.log("Sending: ", param);
  http.send(JSON.stringify(param));
}


//Turn city array into markers
// erases all previous markers from the map, and draws all new ones,
// coloring them +  adding text based on the (currently fake) ranking.
function buildFeatures(cities) {
  clearMarkers();

  for (var i = 0; i < cities.length; i++){
    //Intentionally left these easy to modify, so that they can be changed to meet what is really being sent from server
    var name = cities[i][0];
    var lon = cities[i][1];
    var lat = cities[i][2];
    var rank = cities[i][3].toString();

    //I have added 3 different marker png images to the folder for use
    // Credit to https://mapicons.mapsmarker.com. Creative commons license. (I edited the marker to erase icon)
    var src;
    if(cities[i][3] > 3.5){
      src = "greenMarker.png";
    }
    else if (cities[i][3] > 2.5){
      src = "yellowMarker.png";
    }
    else{
       src = "redMarker.png";
    }
    cityMarkers[i] = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([lon, lat])
      ),
      name: name,
    });

    // Adds a style to the marker
    var iconStyle = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [12, 40],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 1,
        src: src,
      }),
      text: new ol.style.Text({
        text: rank,
        offsetY: -20, //Positive = shift down
        offsetX: 4, //Positive = shift right
        scale: 1.4,
        fill: new ol.style.Fill({
          color: "#FFFFFF"
        }),
        stroke: new ol.style.Stroke({
          color: "#000000",
          width: 2.5
        })
      })
    });
    cityMarkers[i].setStyle(iconStyle);

  }

  //New Source for the vector (set of points) layer
  var vectorSource = new ol.source.Vector({
    features: cityMarkers
  });

  //The layer itself
  markerVectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });
  map.addLayer(markerVectorLayer);
}

//This function is be used to get rid of the markers that were on the previously map
function clearMarkers(){
  //reset markers array, delete markers layer
  map.removeLayer(markerVectorLayer);
  cityMarkers = [];
}
