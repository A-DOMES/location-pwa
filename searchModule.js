// searchModule.js
import { showSingleUser } from './panelModule.js';

function searchUser(userId, globalData) {
  const row = globalData.find(r => r[1] === userId);
  if (row) {
    showSingleUser(userId, globalData);
  } else {
    document.getElementById("user-content").innerHTML = "<p>해당 사용자를 찾을 수 없습니다.</p>";
  }
}

export { searchUser };
