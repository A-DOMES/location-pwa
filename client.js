// config.js에서 값 가져오기
import { API_URL, DEFAULT_CENTER, DEFAULT_INTERVAL } from './config.js';

/* ---------------------- 전역 변수 ---------------------- */
let map, mode = "current", markers = [], polylines = [], markerCluster, intervalId, allData = [];
const previousCoords = {}; // 사용자별 이전 좌표/시간 저장

/* ---------------------- 초기화 ---------------------- */
window.onload = () => {
  map = new google.maps.Map(document.getElementById("map"), {
    center: DEFAULT_CENTER,
    zoom: 7
  });
  loadData();
};

/* ---------------------- 데이터 로드 후 마커 클러스터링 ---------------------- */
function renderMarkers(data) {
  // 기존 마커 제거
  markers.forEach(m => m.setMap(null));
  markers = [];

  // 새 마커 생성
  data.forEach(item => {
    const marker = new google.maps.Marker({
      position: { lat: item.lat, lng: item.lng },
      map: map,
      title: item.name
    });
    markers.push(marker);
  });

  // 기존 클러스터 제거
  if (markerCluster) {
    markerCluster.clearMarkers();
  }

  // ✅ CDN으로 불러온 MarkerClusterer 사용 (최신 방식)
  markerCluster = new MarkerClusterer({ map, markers });
}

/* ---------------------- 지도 초기화 ---------------------- */
function clearMap() {
  markers.forEach(m => m.setMap(null)); markers = [];
  polylines.forEach(p => p.setMap(null)); polylines = [];
  if (markerCluster) markerCluster.clearMarkers();
}

function showMap() {
  clearMap();

  if (mode === "current") {
    drawCurrentMarkers();
  } else if (mode === "paths") {
    drawPaths();
  }

  if (document.getElementById("clusterOption").checked) {
    // ✅ MarkerClusterer 전역 객체 사용
    markerCluster = new MarkerClusterer({ map, markers });
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
    if (user.status === "정상") {
      const prev = previousCoords[user.name];
      const timeChanged = !prev || prev.time !== user.time;
      if (timeChanged) {
        const marker = new google.maps.Marker({
          position: { lat: parseFloat(user.lat), lng: parseFloat(user.lng) },
          map: map,
          icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          title: `${user.name} (${user.status}, ${user.time})`
        });
        markers.push(marker);
      }
      previousCoords[user.name] = { lat: user.lat, lng: user.lng, time: user.time };
    }
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
          ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          : "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      });
      markers.push(marker);
    });
  });
}

/* ---------------------- 우측 패널 내용 업데이트 ---------------------- */
function updateUserPanelContent(viewMode = "current") {
  const panel = document.getElementById("user-content");
  panel.innerHTML = "";

  if (viewMode === "current") {
    const latestByUser = {};
    allData.forEach(item => {
      if (!latestByUser[item.name] || new Date(item.time) > new Date(latestByUser[item.name].time)) {
        latestByUser[item.name] = item;
      }
    });

    let hasCurrent = false;

    Object.values(latestByUser).forEach(user => {
      const prev = previousCoords[user.name];
      const timeChanged = !prev || prev.time !== user.time;

      if (user.status === "정상" && timeChanged) {
        hasCurrent = true;
        panel.innerHTML += `
          <div style="margin-bottom:20px; padding:12px; border:1px solid #ddd; border-radius:8px; background:#fafafa;">
            <div style="font-weight:bold; font-size:16px; color:#333;">👤 ${user.name}</div>
            <div>📍 위치: ${user.location}</div>
            <div>🕒 최초 입력(A열): ${user.connectTime}</div>
            <div>🕒 마지막 갱신(F열): ${user.time}</div>
            <div>✅ 상태: ${user.status}</div>
            <div style="font-family:monospace; color:#444;">좌표: (${user.lat}, ${user.lng})</div>
          </div>
        `;
        previousCoords[user.name] = { lat: user.lat, lng: user.lng, time: user.time };
      }
    });

    if (!hasCurrent) {
      panel.innerHTML = `<div style="color:#999; text-align:center; margin-top:20px;">현재 접속자가 없습니다</div>`;
    }
  }

  if (viewMode === "all") {
    let hasUser = false;
    allData.forEach(user => {
      if (user.status === "정상") {
        hasUser = true;
        panel.innerHTML += `
          <div style="margin-bottom:20px; padding:12px; border:1px solid #ddd; border-radius:8px; background:#fafafa;">
            <div style="font-weight:bold; font-size:16px; color:#333;">👤 ${user.name}</div>
            <div>📍 위치: ${user.location}</div>
            <div>🕒 최초 입력(A열): ${user.connectTime}</div>
            <div>🕒 마지막 갱신(F열): ${user.time}</div>
            <div>✅ 상태: ${user.status}</div>
            <div style="font-family:monospace; color:#444;">좌표: (${user.lat}, ${user.lng})</div>
          </div>
        `;
      }
    });

    if (!hasUser) {
      panel.innerHTML = `<div style="color:#999; text-align:center; margin-top:20px;">현재 접속자가 없습니다</div>`;
    }
  }
}

/* ---------------------- 패널 열기/닫기 ---------------------- */
function openUserPanel(viewMode) {
  document.getElementById("connection-panel").style.display = "none";
  document.getElementById("user-panel").style.display = "block";
  updateUserPanelContent(viewMode);
}

function closeUserPanel() {
  document.getElementById("user-panel").style.display = "none";
}

/* ---------------------- 갱신 주기 설정 ---------------------- */
function setCustomInterval() {
  const value = parseInt(document.getElementById("intervalValue").value);
  const unit = document.getElementById("intervalUnit").value;
  if (isNaN(value) || value <= 0) { alert("1 이상의 값을 입력하세요."); return; }
  let newInterval = unit === "seconds" ? value * 1000 : value * 60000;
  clearInterval(intervalId);
  intervalId = setInterval(loadData, newInterval);
  alert("갱신 주기가 변경되었습니다.");
}

/* ---------------------- 패널 동작 ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const btnConnection = document.getElementById("btn-connection");
  const btnSettings = document.getElementById("btn-settings");
  const connectionPanel = document.getElementById("connection-panel");
  const settingsPanel = document.getElementById("settings-panel");
  const userPanel = document.getElementById("user-panel");

  btnConnection.onclick = () => {
    settingsPanel.style.display = "none";
    connectionPanel.style.left = btnConnection.getBoundingClientRect().left + "px";
    connectionPanel.style.display = connectionPanel.style.display === "block" ? "none" : "block";
  };

  btnSettings.onclick = () => {
    connectionPanel.style.display = "none";
    settingsPanel.style.left = btnSettings.getBoundingClientRect().left + "px";
    settingsPanel.style.display = settingsPanel.style.display === "block" ? "none" : "block";
  };

  const closeBtn = document.getElementById("close-user-panel");
  if (closeBtn) closeBtn.addEventListener("click", closeUserPanel);

  document.addEventListener("click", function(e) {
    if (!btnConnection.contains(e.target) && !connectionPanel.contains(e.target)) connectionPanel.style.display = "none";
    if (!btnSettings.contains(e.target) && !settingsPanel.contains(e.target)) settingsPanel.style.display = "none";
  });
});

/* ---------------------- 화면 복귀 시 갱신 ---------------------- */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("화면 복귀 → 데이터 갱신 실행");
    loadData(); // ✅ 패널과 지도 즉시 갱신
  }
});

/* ---------------------- 위치 전송 ---------------------- */
async function sendLocation() {
  if (!navigator.geolocation) {
    alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    await fetch("https://script.google.com/macros/s/AKfycbwI7IbJE5IpnPpW20bbFK366rgiMJpRuJ19Qjy8G31tMnrIdSJnCfM4M3YfJHT_EeNEHw/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // ✅ 안정성을 위해 추가
      body: JSON.stringify({
        name: document.getElementById("username")?.value || "익명",
        lat: lat,
        lng: lng,
        status: "정상",
        time: new Date().toISOString()
      })
    });
  });
}

/* ---------------------- 데이터 로드 ---------------------- */
async function loadData() {
  try {
    const res = await fetch(`${API_URL}/data`);
    const data = await res.json();
    allData = data;
    showMap();
  } catch (err) {
    console.error("데이터 로드 실패:", err);
  }
}

/* ---------------------- 초기 실행 ---------------------- */
window.onload = () => {
  // 지도 초기화
  map = new google.maps.Map(document.getElementById("map"), {
    center: DEFAULT_CENTER,
    zoom: 7
  });

  // 첫 데이터 로드
  loadData();

  // 데이터 주기적 갱신 (기본 5분)
  intervalId = setInterval(loadData, DEFAULT_INTERVAL);

  // 위치 자동 전송 (1분마다)
  setInterval(sendLocation, 60000);
};
