// ---------------------- 전역 변수 (client.js) ----------------------
let myMarker;                      // 내 위치 마커
let radarPolygon = null;           // 레이더 영역 폴리곤
let radarRadiusMeters = 50;        // 레이더 반경 (기본값 50m)
let radarEnabled = true;           // 레이더 활성화 여부
let pathCoords = [];               // 경로 좌표 배열
let pathPolyline;                  // 경로 Polyline
let poiMarkers = [];               // POI 마커 배열
let compassMarkers = [];           // 나침반 마커 배열
let directionsService, directionsRenderer; // 길찾기 서비스/렌더러

// ✅ POI 아이콘 정의 (관공서 포함)
const poiIcons = {
  cafe: "https://cdn-icons-png.flaticon.com/512/415/415733.png",
  convenience_store: "https://cdn-icons-png.flaticon.com/512/1076/1076327.png",
  restaurant: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
  gas_station: "https://cdn-icons-png.flaticon.com/512/2933/2933914.png",
  bank: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
  pharmacy: "https://cdn-icons-png.flaticon.com/512/2969/2969375.png",
  bus_station: "https://cdn-icons-png.flaticon.com/512/61/61088.png",
  city_hall: "https://cdn-icons-png.flaticon.com/512/148/148947.png",
  local_government_office: "https://cdn-icons-png.flaticon.com/512/148/148947.png"
};

// ---------------------- 부채꼴 레이더 ----------------------
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
function startTracking() {
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

        // 이동 시 → 부채꼴 표시 / 멈춤 시 → 제거
        if (pathCoords.length > 1) {
          const prev = pathCoords[pathCoords.length - 2];
          const dist = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(prev.lat, prev.lng),
            new google.maps.LatLng(myPos.lat, myPos.lng)
          );
          if (dist > 2) {
            updateRadarPolygon(myPos, heading);
          } else {
            if (radarPolygon) radarPolygon.setMap(null);
          }
        }

        // 원형 표시 + 주변 장소 + 나침반
        drawMultipleCircles(myPos);
        showNearbyPlaces(myPos, radarRadiusMeters);
        addCompass();
      },
      (err) => console.error("위치 추적 실패:", err),
      { enableHighAccuracy: true }
    );
  }
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
