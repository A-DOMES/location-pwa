// config.js

// ✅ 사용자 서버 URL
const CONFIG = {
  USER_URL: "https://script.google.com/macros/s/AKfycbyaug-zCqNcFXRB6Rk7zvG_IgRc3N3ZlFXbsBPNuZkHvbDBru94xNJhAzA2chEkn5p9aA/exec",

  // ✅ 관리자 서버 URL
  ADMIN_URL: "https://script.google.com/macros/s/AKfycbxHggbDGg9_ujeL-6CCzKdkhhxzAH1QC-FgXOLcwWOaJK8gxO9NNVjoLHZCH_KK5odtJA/exec",

  // ✅ client.html (조회용 페이지)
  CLIENT_URL: "client.html",
  
  // ✅ 구글 지도 Map ID (환경별)
  mapIds: {
    android: "5bd2daaa37ebfc3fe0839614",
    ios: "5bd2daaa37ebfc3faedae42d",
    javascript: "5bd2daaa37ebfc3f6b7ad5e2",
    fixed: "5bd2daaa37ebfc3f466d5e4c"
  },
    // ✅ 기본 좌표 및 간격
  DEFAULT_CENTER: { lat: 36.5, lng: 127.5 }, // 대한민국 중앙 좌표
  DEFAULT_INTERVAL: 300000 // 5분 (밀리초)
};

