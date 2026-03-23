// updateCycle.js
let globalData = [];
let map;

// --- 주기적 갱신 시작 ---
function startUpdateCycle() {
  // 지도 초기화
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 37.5665, lng: 126.9780}, // 서울 기본 좌표
    zoom: 12
  });

  // 5분 + 2초마다 실행
  setInterval(checkLocation, (5 * 60 + 2) * 1000);

  // 첫 실행
  checkLocation();
}

// --- 데이터 가져오기 ---
function checkLocation() {
  fetch("YOUR_SCRIPT_URL") // Google Apps Script 웹앱 URL
    .then(res => res.json())
    .then(data => {
      globalData = data;
      showAllUsers(globalData); // 패널 + 지도 갱신
    })
    .catch(err => console.error("데이터 가져오기 오류:", err));
}

// --- 거리 계산 ---
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function totalDistance(pathCoords) {
  let dist = 0;
  for (let i = 1; i < pathCoords.length; i++) {
    dist += haversine(
      pathCoords[i-1].lat, pathCoords[i-1].lng,
      pathCoords[i].lat, pathCoords[i].lng
    );
  }
  return dist;
}

function getUserPath(row) {
  const pathCoords = [];
  for (let col = 7; col < row.length; col += 2) {
    const lat = row[col];
    const lng = row[col+1];
    if (lat && lng) {
      pathCoords.push({lat: parseFloat(lat), lng: parseFloat(lng)});
    }
  }
  return pathCoords;
}

// --- 전체 사용자 표시 ---
function showAllUsers(data) {
  let html = "<h3>전체 사용자 이동 통계</h3>";

  data.forEach(row => {
    const userId = row[1];
    const startTime = new Date(row[0]);
    const endTime = new Date(row[5]);
    const totalTimeMinutes = (endTime - startTime) / (1000 * 60);

    const pathCoords = getUserPath(row);
    const totalDist = totalDistance(pathCoords);

    new google.maps.Polyline({
      path: pathCoords,
      strokeColor: "#" + Math.floor(Math.random()*16777215).toString(16),
      strokeOpacity: 1.0,
      strokeWeight: 2,
      map: map
    });

    html += `
      <div style="margin-bottom:10px; border-bottom:1px solid #ccc;">
        <p><strong>${userId}</strong> (${row[6]})</p>
        <p>현재 위치: ${row[3]}, ${row[4]}</p>
        <p>총 이동시간: ${totalTimeMinutes.toFixed(1)} 분</p>
        <p>총 이동거리: ${totalDist.toFixed(2)} km</p>
        <button onclick="showSingleUser('${userId}')">이 사용자만 보기</button>
      </div>
    `;
  });

  document.getElementById("user-content").innerHTML = html;
}

// --- 특정 사용자 표시 ---
function showSingleUser(userId) {
  const row = globalData.find(r => r[1] === userId);
  if (!row) return;

  const startTime = new Date(row[0]);
  const endTime = new Date(row[5]);
  const totalTimeMinutes = (endTime - startTime) / (1000 * 60);

  const pathCoords = getUserPath(row);
  const totalDist = totalDistance(pathCoords);

  map = new google.maps.Map(document.getElementById("map"), {
    center: pathCoords.length ? pathCoords[0] : {lat:37.5665, lng:126.9780},
    zoom: 12
  });
  new google.maps.Polyline({
    path: pathCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
    map: map
  });

  document.getElementById("user-content").innerHTML = `
    <h3>${row[1]} (${row[6]})</h3>
    <p>현재 위치: ${row[3]}, ${row[4]}</p>
    <p>총 이동시간: ${totalTimeMinutes.toFixed(1)} 분</p>
    <p>총 이동거리: ${totalDist.toFixed(2)} km</p>
    <button onclick="showAllUsers(globalData)">전체 보기</button>
  `;
}

export { startUpdateCycle, showAllUsers, showSingleUser };
