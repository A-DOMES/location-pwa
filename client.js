let myMarker, radarPolygon;
let radarRadiusMeters = 50;
let radarEnabled = true;
let pathCoords = [];
let pathPolyline;
let poiMarkers = [];
let compassMarkers = [];
let directionsService = new google.maps.DirectionsService();
let directionsRenderer = new google.maps.DirectionsRenderer();

// ---------------------- 레이더 ----------------------
function updateRadarPolygon(myPos, heading) {
  if (!radarEnabled) {
    if (radarPolygon) radarPolygon.setMap(null);
    return;
  }
  const angle = 90;
  const points = [];
  const radiusInDegrees = radarRadiusMeters / 111000;
  for (let a = -angle/2; a <= angle/2; a += 5) {
    const rad = (heading + a) * Math.PI / 180;
    const latOffset = radiusInDegrees * Math.cos(rad);
    const lngOffset = radiusInDegrees * Math.sin(rad);
    points.push({ lat: myPos.lat + latOffset, lng: myPos.lng + lngOffset });
  }
  points.unshift(myPos);

  if (radarPolygon) {
    radarPolygon.setPath(points);
  } else {
    radarPolygon = new google.maps.Polygon({
      paths: points,
      strokeColor: "#00BFFF",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#00BFFF",
      fillOpacity: 0.25,
      map: map
    });
  }
}

// ---------------------- 위치 추적 ----------------------
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const heading = pos.coords.heading || 0;

      if (!myMarker) {
        myMarker = new google.maps.Marker({
          position: myPos,
          map: map,
          title: "내 위치",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#FF0000",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 10
          }
        });
      } else {
        myMarker.setPosition(myPos);
      }

      // 경로 기록
      pathCoords.push(myPos);
      if (pathPolyline) {
        pathPolyline.setPath(pathCoords);
      } else {
        pathPolyline = new google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: map
        });
      }

      updateRadarPolygon(myPos, heading);
      drawMultipleCircles(myPos);
      showNearbyPlaces(myPos, radarRadiusMeters);

      map.setHeading(heading);
      map.setTilt(45);

      addCompass();
    },
    (err) => console.error("위치 추적 실패:", err),
    { enableHighAccuracy: true }
  );
}

// ---------------------- 원형 표시 ----------------------
function drawMultipleCircles(myPos) {
  [100, 500, 1000].forEach(r => {
    new google.maps.Circle({
      center: myPos,
      radius: r,
      strokeColor: "#FF0000",
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: "#FF0000",
      fillOpacity: 0.05,
      map: map
    });
  });
}

// ---------------------- 주변 장소 ----------------------
function clearPoiMarkers() {
  poiMarkers.forEach(m => m.setMap(null));
  poiMarkers = [];
}

function showRouteToDestination(destination) {
  if (!myMarker) return;
  const request = {
    origin: myMarker.getPosition(),
    destination: destination,
    travelMode: google.maps.TravelMode.WALKING
  };
  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);
    }
  });
}

function showNearbyPlaces(myPos, radiusMeters) {
  clearPoiMarkers();
  const service = new google.maps.places.PlacesService(map);
  const types = Object.keys(poiIcons);
  const infowindow = new google.maps.InfoWindow();

  types.forEach(type => {
    service.nearbySearch({ location: myPos, radius: radiusMeters, type: [type] },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          results.forEach(place => {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: map,
              title: place.name,
              icon: { url: poiIcons[type], scaledSize: new google.maps.Size(32, 32) }
            });

            marker.addListener("click", () => {
              infowindow.setContent(`<b>${place.name}</b><br>${place.vicinity || "주소 정보 없음"}<br>(더블클릭하면 경로 안내)`);
              infowindow.open(map, marker);
            });

            marker.addListener("dblclick", () => {
              showRouteToDestination(place.geometry.location);
            });

            poiMarkers.push(marker);
          });
        }
      });
  });
}

// ---------------------- 나침반 ----------------------
function clearCompass() {
  compassMarkers.forEach(m => m.setMap(null));
  compassMarkers = [];
}

function addCompass() {
  clearCompass();
  const bounds = map.getBounds();
  if (!bounds) return;
  const center = bounds.getCenter();
  const offset = 0.001;
  const directions = [
    { label: "N", pos: { lat: center.lat() + offset, lng: center.lng() } },
    { label: "S", pos: { lat: center.lat() - offset, lng: center.lng() } },
    { label: "E", pos: { lat: center.lat(), lng: center.lng() + offset } },
    { label: "W", pos: { lat: center.lat(), lng: center.lng() - offset } }
  ];
  directions.forEach(d => {
    const marker = new google.maps.Marker({
      position: d.pos,
      map: map,
      label: d.label
    });
    compassMarkers.push(marker);
  });
}

// ---------------------- 버튼 이벤트 ----------------------
document.addEventListener("DOMContentLoaded", () => {
  const btnConnection = document.getElementById("btn-connection");
  const btnSettings = document.getElementById("btn-settings");
  const connectionPanel = document.getElementById("connection-panel");
  const settingsPanel = document.getElementById("settings-panel");

  if (btnConnection) {
    btnConnection.onclick = () => {
      settingsPanel.classList.remove("open");
      connectionPanel.classList.toggle("open");
    };
  }

  if (btnSettings) {
    btnSettings.onclick = () => {
      connectionPanel.classList.remove("open");
      settingsPanel.classList.toggle("open");
    };
  }
});
