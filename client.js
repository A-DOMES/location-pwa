let selectedUser = null;
let currentPathLine = null;

// 드롭다운 필터링
document.getElementById("path-user-select").addEventListener("change", function() {
  const value = this.value;
  let filtered = allData;

  if (value === "online") {
    filtered = allData.filter(user => user.status === "온라인");
  } else if (value === "offline") {
    filtered = allData.filter(user => user.status === "오프라인");
  }
  renderUserTable(filtered);
});

// 검색창 토글 버튼
document.getElementById("toggle-search").addEventListener("click", () => {
  const searchBox = document.getElementById("search-container");
  searchBox.style.display = (searchBox.style.display === "none") ? "block" : "none";
});

// 검색 기능
document.getElementById("user-search").addEventListener("input", function() {
  const keyword = this.value.toLowerCase();
  const filtered = allData.filter(user => 
    (user.name && user.name.toLowerCase().includes(keyword)) ||
    (user.phone && user.phone.toLowerCase().includes(keyword))
  );
  renderUserTable(filtered);
});

// 마커 생성 시 이벤트 연결
function addMarker(user) {
  const marker = new google.maps.Marker({
    position: { lat: user.lat, lng: user.lng },
    map: map,
    title: user.name
  });

  marker.addListener("click", () => {
    selectedUser = user;
    openUserPanel("user", user);
  });
}

// 사용자 패널 열기
function openUserPanel(type, userData = null) {
  const panel = document.getElementById("user-panel");
  panel.classList.add("open");

  if (type === "user" && userData) {
    document.getElementById("user-panel-title").textContent = userData.name + " 정보";
    document.getElementById("user-table-body").innerHTML = `
      <tr>
        <td>${userData.name}</td>
        <td>${userData.phone}</td>
        <td>${userData.carNumber}</td>
        <td>${userData.status}</td>
        <td>${userData.role}</td>
        <td>${userData.lat}, ${userData.lng}</td>
      </tr>
    `;
  } else {
    updateUserPanelContent(type);
  }
}

// 경로 표시
function showUserPath(userData) {
  if (currentPathLine) {
    currentPathLine.setMap(null);
  }

  if (userData.path && userData.path.length > 1) {
    currentPathLine = new google.maps.Polyline({
      path: userData.path,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 3
    });
    currentPathLine.setMap(map);
  } else {
    showMessage("경로 데이터가 없습니다.");
  }
}

// 버튼 이벤트 연결
document.getElementById("show-path").addEventListener("click", () => {
  if (selectedUser) {
    showUserPath(selectedUser);
  }
});
