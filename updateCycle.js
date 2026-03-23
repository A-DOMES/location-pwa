// updateCycle.js
import { showAllUsers } from './panelModule.js';

let globalData = [];

function startUpdateCycle() {
  setInterval(checkLocation, (5 * 60 + 2) * 1000);
  checkLocation();
}

function checkLocation() {
  fetch("YOUR_SCRIPT_URL")
    .then(res => res.json())
    .then(data => {
      globalData = data;
      showAllUsers(globalData);
    })
    .catch(err => console.error("데이터 가져오기 오류:", err));
}

export { startUpdateCycle, globalData };
