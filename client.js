// config.js에서 값 가져오기
import { API_URL, DEFAULT_CENTER, DEFAULT_INTERVAL, mapIds } from './config.js';

/* ---------------------- 전역 변수 ---------------------- */
let map, mode = "current", markers = [], polylines = [], markerCluster, intervalId, allData = [];
const previousCoords = {}; // 사용자별 이전 좌표/시간 저장

/* ---------------------- 지도 초기화 ---------------------- */
// ✅ 기기 환경에 따라 mapId 선택
function getMapIdByDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return mapIds.android;
  if (/iphone|ipad|ipod/.test(ua)) return mapIds.ios;
  if (/windows|macintosh|linux/.test(ua)) return mapIds.javascript;
  return mapIds.fixed; // 기본값
}

// ✅ 구글맵 초기화
function initMap() {
  const mapId = getMapIdByDevice();

  // 기본 지도 생성 (대한민국 중앙 좌표)
  map = new google.maps.Map(document.getElementById("map"), {
    center: DEFAULT_CENTER,
    zoom: 7,                       // ✅ 위성에서 보는 듯한 높이
    mapTypeId: "roadmap",          // ✅ 기본 지도 모드
    mapId: mapId
  });

  // ✅ 내 위치 가져오기
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const myPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // 지도 중심을 내 위치로 이동 (옵션)
        // map.setCenter(myPos);
        // map.setZoom(15);

        // 내 위치 마커 표시
        new google.maps.Marker({
          position: myPos,
          map: map,
          title: "내 위치"
        });
      },
      (error) => {
        console.warn("위치 정보를 가져오지 못했습니다:", error.message);
        // 실패 시 기본 좌표에 마커 표시
        new google.maps.Marker({
          position: DEFAULT_CENTER,
          map: map,
          title: "기본 위치"
        });
      }
    );
  } else {
    console.warn("이 브라우저는 Geolocation을 지원하지 않습니다.");
    new google.maps.Marker({
      position: DEFAULT_CENTER,
      map: map,
      title: "기본 위치"
    });
  }
}

/* ---------------------- 지도 표시 ---------------------- */
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

  if (document.getElementById("clusterOption")?.checked) {
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
    if (document.getElementById("limitOption")?.checked) data = data.slice(-50);

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
  if (!panel) return;
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
          <div class="user-card">
            <div class="user-name">👤 ${user.name}</div>
            <div>📍 위치: ${user.location}</div>
            <div>🕒 최초 입력(A열): ${user.connectTime}</div>
            <div>🕒 마지막 갱신(F열): ${user.time}</div>
            <div>✅ 상태: ${user.status}</div>
            <div class="coords">좌표: (${user.lat}, ${user.lng})</div>
          </div>
        `;
        previousCoords[user.name] = { lat: user.lat, lng: user.lng, time: user.time };
      }
    });

    if (!hasCurrent) {
      panel.innerHTML = `<div class="no-user">현재 접속자가 없습니다</div>`;
    }
  }

  if (viewMode === "all") {
    let hasUser = false;
    allData.forEach(user => {
      if (user.status === "정상") {
        hasUser = true;
        panel.innerHTML += `
          <div class="user-card">
            <div class="user-name">👤 ${user.name}</div>
            <div>📍 위치: ${user.location}</div>
            <div>🕒 최초 입력(A열): ${user.connectTime}</div>
            <div>🕒 마지막 갱신(F열): ${user.time}</div>
            <div>✅ 상태: ${user.status}</div>
            <div class="coords">좌표: (${user.lat}, ${user.lng})</div>
          </div>
        `;
      }
    });

    if (!hasUser) {
      panel.innerHTML = `<div class="no-user">현재 접속자가 없습니다</div>`;
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
  const closeBtn = document.getElementById("close-user-panel");

  // 접속현황 버튼 클릭
  btnConnection.addEventListener("click", () => {
    settingsPanel.style.display = "none"; // 다른 패널 닫기
    connectionPanel.style.left = btnConnection.getBoundingClientRect().left + "px";
    connectionPanel.style.display = connectionPanel.style.display === "block" ? "none" : "block";
  });

  // 환경설정 버튼 클릭
  btnSettings.addEventListener("click", () => {
    connectionPanel.style.display = "none"; // 다른 패널 닫기
    settingsPanel.style.left = btnSettings.getBoundingClientRect().left + "px";
    settingsPanel.style.display = settingsPanel.style.display === "block" ? "none" : "block";
  });

  // 사용자 패널 닫기 버튼
  if (closeBtn) {
    closeBtn.addEventListener("click", closeUserPanel);
  }

  // 외부 클릭 시 패널 닫기
  document.addEventListener("click", (e) => {
    if (!btnConnection.contains(e.target) && !connectionPanel.contains(e.target)) {
      connectionPanel.style.display = "none";
    }
    if (!btnSettings.contains(e.target) && !settingsPanel.contains(e.target)) {
      settingsPanel.style.display = "none";
    }
  });

  // ✅ connection-panel 내부 버튼 동작
  const viewCurrentBtn = document.getElementById("view-current");
  const viewAllBtn = document.getElementById("view-all");
  const viewDetailBtn = document.getElementById("view-detail");

  if (viewCurrentBtn) {
    viewCurrentBtn.addEventListener("click", () => {
      mode = "current";          // 현재 접속자 보기 모드
      showMap();                 // 지도 갱신
      openUserPanel("current");  // 사용자 패널 열기
    });
  }

  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      mode = "all";              // 전체 사용자 보기 모드
      showMap();                 // 지도 갱신
      openUserPanel("all");      // 사용자 패널 열기
    });
  }

  if (viewDetailBtn) {
    viewDetailBtn.addEventListener("click", () => {
      mode = "paths";            // 사용자별 상세 보기 (경로 모드)
      showMap();                 // 지도 갱신
      openUserPanel("paths");    // 사용자 패널 열기
    });
  }
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
    await fetch(`${API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
document.addEventListener("DOMContentLoaded", () => {
  // ✅ 지도 초기화 직접 실행
  initMap();

  // ✅ 첫 데이터 로드
  loadData();

  // ✅ 데이터 주기적 갱신 (기본 5분)
  intervalId = setInterval(loadData, DEFAULT_INTERVAL);

  // ✅ 위치 자동 전송 (1분마다)
  setInterval(sendLocation, 60000);
});
