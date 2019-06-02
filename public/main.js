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

bindButtons();

function bindButtons(){
  var buttons = document.getElementsByClassName("btn-default");
  for (var i = 0; i < buttons.length; i++){
    buttons[i].addEventListener("click", function(){
      if (this.classList.contains("active")){
        this.classList.remove("active");
      }
      else{
        this.classList.add("active");
      }
    });
  }
}

var cityMarkers = [];
var markerVectorLayer;

let theme = localStorage.getItem("theme");
let urlString = '';

let _points = [];

if (theme == "dark") {
    urlString = 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
}

else {
    urlString = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

function makeMap(lon, lat, zoom, target) {
    var map = new Map({
      target: target,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: urlString
          })
        })
      ],
      view: new View({
        center: proj.fromLonLat([lon,lat]),
        zoom: zoom,
        minZoom: 1,
        projection: "EPSG:3857"
        //units: 'degrees'
      })
    });

    return map;
}

var map = makeMap(0, 0, 3, 'map');

map.on('click', function(evt) {
    var pixel = evt.pixel;
    displayFeatureInfo(pixel);
});

var displayFeatureInfo = function(pixel) {
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      features.push(feature); // We may want to ensure this only works on one layer, and only gets one set of features.
  });
  if (features.length > 0) {
    $('#city-popup').removeClass('hidden'); // Moved here for separation of concerns
    const name = features[0].get('name'); // Removed the loop, there should only be one city displayed in the overlay.
    const lat = features[0].get('lat');
    const lon = features[0].get('lon');
    const id = features[0].get('id');

    // Make request for city info
    var http = new XMLHttpRequest();
    http.open("POST", '/city', true);
    http.setRequestHeader("Content-Type", "application/json");
    http.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const data = JSON.parse(this.response);
        cityInfo(data); // found in public/city-popup.js
      }
    } // Could probably use an error message
    var param = {
      'name': name,
      'lat': lat,
      'lon': lon,
      'id': id,
    };
    http.send(JSON.stringify(param));
  }
};

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

  setPoints(points);

  // Send bounding box coords to server.
  makeBBoxRequest();
}

// Every movement on the map, scroll or zoom, triggers the makeBBoxRequest() function,
// which sends a POST request containing a bounding box array to the server.
function makeBBoxRequest(){
  const points = getPoints();
  const filters = getFilters();

  var http = new XMLHttpRequest();
  http.open("POST", '/bounding', true);
  http.setRequestHeader("Content-Type", "application/json");

  http.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {

      //Turn a string into an array
      const cities = JSON.parse(this.response);
      const cityarr = cities.cities;
      buildFeatures(cityarr);
    }
  }
  var param = {
      'bounding_box': points,
      'filters': filters
  };

  http.send(JSON.stringify(param));
}

function getFilters(){
  var buttons = document.getElementsByClassName("active");
  var filters = [];
  for (var i = 0; i < buttons.length; i++){
    var classes = buttons[i].classList;
    for(var j = 0; j < classes.length; j++){
      if (classes[j] != 'btn' && classes[j] != 'btn-default' && classes[j] != 'active' ){
        filters.push(classes[j]);
        continue;
      }
    }
  }
  return filters;
}

// Turn city array into markers
// erases all previous markers from the map, and draws all new ones,
// coloring them +  adding text based on the (currently fake) ranking.
function buildFeatures(cities) {
  clearMarkers();
  for (var i = 0; i < cities.length; i++){
    //console.log('cities:', cities[i]);
    var name = cities[i].city;
    var lon = cities[i].lon;
    var lat = cities[i].lat;
    var rank = cities[i].rank;
    var id = cities[i].id;

    var image = '';
    if (cities[i].image) {
        image = cities[i].image;
        //console.log('cities arr:', cities[i]);
        //console.log('image:', image);
    }

    //I have added 3 different marker png images to the folder for use
    // Credit to https://mapicons.mapsmarker.com. Creative commons license. (I edited the marker to erase icon)
    var src;
    if(Number(rank) > 3.5){
      src = "greenMarker.png";
    }
    else if (Number(rank) > 2.5){
      src = "yellowMarker.png";
    }
    else{
       src = "redMarker.png";
    }

      if (cities[i].image) {
          cityMarkers[i] = new Feature({
              geometry: new Point(
                  proj.fromLonLat([lon, lat])
              ),
              name: name,
              lon: lon,
              lat: lat,
              rank: rank,
              id: id,
              image: image,
          });
          //console.log(cityMarkers[i]);
      }
      else {
          cityMarkers[i] = new Feature({
              geometry: new Point(
                  proj.fromLonLat([lon, lat])
              ),
              name: name,
              lon: lon,
              lat: lat,
              rank: rank,
              id: id,
          });
      }

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
        text: String(rank),
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

function getPoints() {
    return _points;
}

function setPoints(newPoints) {
    _points = newPoints;
}

export {buildFeatures};
export {getPoints};
export {makeBBoxRequest};
export {makeMap};
export {getFilters};
