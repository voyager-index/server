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

function makeBBoxRequest(points){
  var http = new XMLHttpRequest();
  http.open("POST", '/bounding', true);
  http.setRequestHeader("Content-Type", "application/json");

  http.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        console.log("Server: ", this.response);
        //Once we are getting real city data from the server, this can be deleted
        var fakeCities = [["New York", -74, 40.7]];

        buildFeatures(fakeCities);
    }
  }
  var param = {'bounding_box': points};
  console.log("Sending: ", param);
  http.send(JSON.stringify(param));
}


//This will eventually be used to take city points and make them into markers
function buildFeatures(cities) {
  clearMarkers();
  for (var i = 0; i < cities.length; i++){
    //Intentionally left these easy to modify, so that they can be changed to meet what is really being sent from server
    var name = cities[i][0];
    var lon = cities[i][1];
    var lat = cities[i][2];

    cityMarkers[i] = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([lon, lat])
      ),
    });
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