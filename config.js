// config.js

// ✅ 사용자 서버 URL
const CONFIG = {
  USER_URL: "https://script.google.com/macros/s/AKfycbyZLHG8TJYXdlvFacENYfFgW5tPPJ9XK0NznDQSxT9tTWAFPcmJshp2Ap8OQyNTf3zDLA/exec",

  // ✅ 관리자 서버 URL
  ADMIN_URL: "https://script.google.com/macros/s/AKfycby5VaIp1jOdxVjt1ZJKH31I-Dg8pK5URUIAHaKgbGDAEa6_IO5vCiosjMnpxcd943ekMQ/exec",

  // ✅ client.html (조회용 페이지)
  CLIENT_URL: "client.html",
  
  // ✅ 구글 지도 Map ID (환경별)
  mapIds: {
    android: "5bd2daaa37ebfc3fe0839614",
    ios: "5bd2daaa37ebfc3faedae42d",
    javascript: "5bd2daaa37ebfc3f6b7ad5e2",
    fixed: "5bd2daaa37ebfc3f466d5e4c"
  },
};
  // ✅ 개별 export (index.html, client.js 등에서 import 가능)
  export const ADMIN_API_URL = CONFIG.ADMIN_URL;   // 클라이언트가 호출할 관리자 서버 URL
  export const USER_API_URL = CONFIG.USER_URL;     // 관리자 서버 내부에서 호출할 사용자 서버 URL
  export const DEFAULT_CENTER = { lat: 36.5, lng: 127.5 }; // 대한민국 중앙 좌표
  export const DEFAULT_INTERVAL = 300000; // 5분 (밀리초)
  
  // ✅ 필요하다면 CONFIG 전체도 export 가능
  export default CONFIG;
