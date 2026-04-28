let map, myMarker, radarPolygon;
let radarRadiusMeters = 50;
let radarEnabled = true;

// ✅ POI별 커스텀 아이콘 매핑
const poiIcons = {
  cafe: "https://cdn-icons-png.flaticon.com/512/415/415733.png",
  convenience_store: "https://cdn-icons-png.flaticon.com/512/1076/1076327.png",
  restaurant: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
  gas_station: "https://cdn-icons-png.flaticon.com/512/2933/2933914.png",
  bank: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
  pharmacy: "https://cdn-icons-png.flaticon.com/512/2969/2969375.png",
  bus_station: "https://cdn-icons-png.flaticon.com/512/61/61088.png"
};

function initMap() {
  const defaultPos = { lat: 37.5665, lng: 126.9780 }; // 서울 시청 예시
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // ✅ 거리 측정 이벤트 등록
  google.maps.event.addListener(map, 'click', (event) => {
    if (!myMarker) return;
    const clickedPos = event.latLng;
    const myPos = myMarker.getPosition();
    const distance = google.maps.geometry.spherical.computeDistanceBetween(myPos, clickedPos);
    alert("선택한 지점까지 거리: " + Math.round(distance) + "m");
  });

  // ✅ 지도 로딩 완료 후 나침반 표시
  google.maps.event.addListenerOnce(map, 'idle', addCompass);
}

// ✅ 레이더 갱신
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

// ✅ 내 위치 추적 + 경로 기록
let pathCoords = [];
let pathPolyline;

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

// ✅ 다중 반경 표시
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

// ✅ POI 마커 관리
let poiMarkers = [];
function clearPoiMarkers() {
  poiMarkers.forEach(m => m.setMap(null));
  poiMarkers = [];
}

// ✅ 목적지 안내
let directionsService = new google.maps.DirectionsService();
let directionsRenderer = new google.maps.DirectionsRenderer();
directionsRenderer.setMap(map);

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

// ✅ 반경 내 POI 표시
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

            // InfoWindow 표시
            marker.addListener("click", () => {
              infowindow.setContent(`<b>${place.name}</b><br>${place.vicinity || "주소 정보 없음"}<br>(더블클릭하면 경로 안내)`);
              infowindow.open(map, marker);
            });

            // ✅ 더블클릭 시 목적지 안내
            marker.addListener("dblclick", () => {
              showRouteToDestination(place.geometry.location);
            });

            poiMarkers.push(marker);
          });
        }
      });
  });
}

// ✅ 나침반 표시
let compassMarkers = [];
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

// ✅ initMap을 전역에 등록
window.initMap = initMap;
