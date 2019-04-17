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

map.on('moveend', onMoveEnd);

function onMoveEnd(evt) {
  var map = evt.map;
  var extent = map.getView().calculateExtent(map.getSize());
  var points = [];
  var bottomLeft = ol.proj.toLonLat([extent[0], extent[1]]);
  var topRight = ol.proj.toLonLat([extent[2], extent[3]]);
  points.push(bottomLeft[0]);
  points.push(bottomLeft[1]);
  points.push(topRight[0]);
  points.push(topRight[1]);
  makeBBoxRequest(points);
}

function makeBBoxRequest(points){
  var http = new XMLHttpRequest();
  http.open("POST", '/bounding', true);
  http.setRequestHeader("Content-Type", "application/json");

  http.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        console.log("Server: ", this.response);
    }
  }
  var param = {'bounding_box': points};
  console.log("Sending: ", param);
  http.send(JSON.stringify(param));
}