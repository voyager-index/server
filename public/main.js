import {Map, View, Feature} from 'ol';
import {Icon, Fill, Stroke, Style, Text} from 'ol/style';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import * as proj from 'ol/proj';
import * as geom from 'ol/geom';
import * as layer from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Source from 'ol/source/Source';
import Point from 'ol/geom/Point';

var cityMarkers = [];
var markerVectorLayer;

let theme = localStorage.getItem("theme");
let urlString = '';

if (theme == "dark") {
    urlString = 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
}

else {
    urlString = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        url: urlString
      })
    })
  ],
  view: new View({
    center: proj.fromLonLat([0,0]),
    zoom: 3,
    minZoom: 1,
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
  var bottomLeft = proj.toLonLat([extent[0], extent[1]]);
  var topRight = proj.toLonLat([extent[2], extent[3]]);
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

      //Turn a string into an array
      const cities = JSON.parse(this.response);
      buildFeatures(cities);
    }
  }
  var param = {'bounding_box': points};
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
    var lon = Number(cities[i][1]);
    var lat = Number(cities[i][2]);
    var rank = cities[i][3].toString();
//console.log(i, name);
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

    cityMarkers[i] = new Feature({
      geometry: new Point(
        proj.fromLonLat([lon, lat])
      ),
      name: name,
    });

    // Adds a style to the marker
    var iconStyle = new Style({
      image: new Icon({
        anchor: [12, 40],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        //opacity: 1,
        src: src,
      }),
      text: new Text({
        text: rank,
        offsetY: -20, //Positive = shift down
        offsetX: 4, //Positive = shift right
        scale: 1.4,
        fill: new Fill({
          color: "#FFFFFF"
        }),
        stroke: new Stroke({
          color: "#000000",
          width: 2.5
        })
      })
    });
    cityMarkers[i].setStyle(iconStyle);

  }

  //New Source for the vector (set of points) layer
  var vectorSource = new VectorSource({
    features: cityMarkers
  });

  //The layer itself
  markerVectorLayer = new VectorLayer({
    source: vectorSource,
  });

  markerVectorLayer.setZIndex(100);
  map.addLayer(markerVectorLayer);
}

//This function is be used to get rid of the markers that were on the previously map
function clearMarkers(){
  //reset markers array, delete markers layer
  map.removeLayer(markerVectorLayer);
  cityMarkers = [];
}
