// mapModule.js
let map;

function initMap(center = {lat:37.5665, lng:126.9780}, zoom = 12) {
  map = new google.maps.Map(document.getElementById("map"), { center, zoom });
  return map;
}

function drawPath(pathCoords, color = "#FF0000") {
  new google.maps.Polyline({
    path: pathCoords,
    strokeColor: color,
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map: map
  });
}

export { initMap, drawPath, map };
