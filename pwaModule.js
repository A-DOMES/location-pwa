// pwaModule.js

let map, mode = "current", markers = [], polylines = [], markerCluster, intervalId, allData = [];

/* ---------------------- 데이터 로딩 ---------------------- */
export async function loadData() {
  const response = await fetch("https://script.google.com/macros/s/AKfycbztvsGB7DD9V4CfHprAjtOKxvOmiIMnlInHCk5hDTjOeSTzaF2vgGXcw9fMsNtKcLlvAg/exec");
  allData = await response.json();
  showMap();
}

/* ---------------------- 지도 초기화 ---------------------- */
function clearMap() {
  markers.forEach(m => m.setMap(null)); markers = [];
  polylines.forEach(p => p.setMap(null)); polylines = [];
  if (markerCluster) markerCluster.clearMarkers();
}

export function showMap() {
  clearMap();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.5, lng: 127.5 },
    zoom: 7
  });

  if (mode === "current") {
    drawCurrentMarkers();
  } else if (mode === "paths") {
    drawPaths();
  }

  if (document.getElementById("clusterOption").checked) {
    markerCluster = new MarkerClusterer(map, markers, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
  }

  updateUserPanelContent(mode);
}

/* ---------------------- 현재 위치 표시 ---------------------- */
function drawCurrentMarkers() {
  const latestByUser = {};
  allData.forEach(item => {
    if (!latestByUser[item.name] || new Date(item.time) > new Date(latestByUser[item.name].time)) {
      latestByUser[item.name] = item;
    }
  });
  Object.values(latestByUser).forEach(user => {
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(user.lat), lng: parseFloat(user.lng) },
      map: map,
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      title: `${user.name} (${user.status}, ${user.time})`
    });
    markers.push(marker);
  });
}

/* ---------------------- 경로 표시 ---------------------- */
function drawPaths() {
  const grouped = {};
  allData.forEach(item => {
    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(item);
  });

  Object.values(grouped).forEach(records => {
    records.sort((a, b) => new Date(a.time) - new Date(b.time));
    let data = records;
    if (document.getElementById("limitOption").checked) data = data.slice(-50);

    const pathCoords = data.map(item => ({ lat: parseFloat(item.lat), lng: parseFloat(item.lng) }));
    const polyline = new google.maps.Polyline({
      path: pathCoords, geodesic: true,
      strokeColor: "#" + Math.floor(Math.random() * 16777215).toString(16),
      strokeOpacity: 1.0, strokeWeight: 2, map: map
    });
    polylines.push(polyline);

    data.forEach((d, idx) => {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(d.lat), lng: parseFloat(d.lng) },
        map: map,
        title: `${d.name} / ${d.time}`,
        icon: idx === data.length - 1
          ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
      });
      markers.push(marker);
    });
  });
}

/* ---------------------- 패널 업데이트 ---------------------- */
export function updateUserPanelContent(viewMode = "current") {
  const panel = document.getElementById("user-content");
  panel.innerHTML = "";

  if (viewMode === "current") {
    const latestByUser = {};
    allData.forEach(item => {
      if (!latestByUser[item.name] || new Date(item.time) > new Date(latestByUser[item.name].time)) {
        latestByUser[item.name] = item;
      }
    });
    Object.values(latestByUser).forEach(latest => {
      panel.innerHTML += `
        <div style="margin-bottom:10px">
          <strong>${latest.name}</strong><br>
          📍 위치: ${latest.location}<br>
          🕒 최초 입력: ${latest.connectTime}<br>
          🕒 마지막 갱신: ${latest.time}<br>
          상태: ${latest.status}<br>
          좌표: (${latest.lat}, ${latest.lng})
        </div>
      `;
    });
  } else if (viewMode === "all") {
    allData.forEach(item => {
      panel.innerHTML += `
        <div style="margin-bottom:10px">
          <strong>${item.name}</strong><br>
          📍 위치: ${item.location}<br>
          🕒 입력: ${item.time}<br>
          상태: ${item.status}<br>
          좌표: (${item.lat}, ${item.lng})
        </div>
      `;
    });
  } else if (viewMode === "detail") {
    const grouped = {};
    allData.forEach(item => {
      if (!grouped[item.name]) grouped[item.name] = [];
      grouped[item.name].push(item);
    });
    Object.entries(grouped).forEach(([name, records]) => {
      panel.innerHTML += `<div style="margin-bottom:15px"><strong>${name}</strong><br>`;
      records.forEach(r => {
        panel.innerHTML += `🕒 ${r.time} | ${r.status} | (${r.lat}, ${r.lng})<br>`;
      });
      panel.innerHTML += `</div>`;
    });
  }
}

/* ---------------------- 갱신 주기 설정 ---------------------- */
export function setCustomInterval() {
  const value = parseInt(document.getElementById("intervalValue").value);
  const unit = document.getElementById("intervalUnit").value;
  if (isNaN(value) || value <= 0) { alert("1 이상의 값을 입력하세요."); return; }
  let newInterval = unit === "seconds" ? value * 1000 : value * 60000;
  clearInterval(intervalId);
  intervalId = setInterval(loadData, newInterval);
  alert("갱신 주기가 변경되었습니다.");
}

/* ---------------------- 패널 동작 ---------------------- */
export function openUserPanel(viewMode) {
  document.getElementById("connection-panel").style.display = "none";
  document.getElementById("user-panel").style.display = "block";
  updateUserPanelContent(viewMode);
}
export function closeUserPanel() {
  document.getElementById("user-panel").style.display = "none";
}

/* ---------------------- 초기 실행 ---------------------- */
export function initApp() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.5, lng: 127.5 },
    zoom: 7
  });
  loadData();
  intervalId = setInterval(loadData, 300000); // 기본 5분 갱신
}

/* ---------------------- 전역(window)에 붙이기 ---------------------- */
window.initApp = initApp;
window.openUserPanel = openUserPanel;
window.closeUserPanel = closeUserPanel;
window.setCustomInterval = setCustomInterval;
window.showMap = showMap;

