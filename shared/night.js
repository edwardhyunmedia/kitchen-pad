// 야간 모드: 정한 시간이 되면 화면 전체를 어둡게 (모든 화면에 포함)
import { load } from './store.js';
import { isNight } from './night-logic.js';

const top = window === window.top;
let wasNight = null;
let savedBrightness = null;

function apply() {
  const n = { on: true, from: '00:00', to: '06:00', dimScreen: true, ...(load('settings', {}).night || {}) };
  const night = !!n.on && isNight(new Date(), n.from, n.to);
  document.documentElement.classList.toggle('dark', night);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#000000' : '#ffffff');
  // Fully Kiosk가 있으면 화면 밝기도 낮춤 (바깥 화면에서만)
  if (top && night !== wasNight) {
    try {
      if (window.fully && n.dimScreen) {
        if (night) { savedBrightness = fully.getScreenBrightness(); fully.setScreenBrightness(Math.min(90, Number(savedBrightness) || 90)); }
        else if (wasNight && savedBrightness != null) fully.setScreenBrightness(savedBrightness);
      }
    } catch { /* Fully 기능 없음 */ }
  }
  wasNight = night;
}
apply();
setInterval(apply, 30000);
window.addEventListener('storage', e => { if (e.key === 'kp.settings') apply(); });
window.addEventListener('kp-settings-changed', apply);
