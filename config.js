// config.js

// ✅ 사용자 서버 URL
const CONFIG = {
  USER_URL: "https://script.google.com/macros/s/AKfycbyZLHG8TJYXdlvFacENYfFgW5tPPJ9XK0NznDQSxT9tTWAFPcmJshp2Ap8OQyNTf3zDLA/exec",

  // ✅ 관리자 서버 URL
  ADMIN_URL: "https://script.google.com/macros/s/AKfycby5VaIp1jOdxVjt1ZJKH31I-Dg8pK5URUIAHaKgbGDAEa6_IO5vCiosjMnpxcd943ekMQ/exec",

  // ✅ 구글 지도 Map ID (환경별)
  mapIds: {
    android: "5bd2daaa37ebfc3fe0839614",
    ios: "5bd2daaa37ebfc3faedae42d",
    javascript: "5bd2daaa37ebfc3f6b7ad5e2",
    fixed: "5bd2daaa37ebfc3f466d5e4c"
  },

  // ✅ 조회용 client.html URL (필요 시)
  CLIENT_URL: "client.html"
};
