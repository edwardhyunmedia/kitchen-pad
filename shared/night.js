// 야간 모드: 정한 시간이 되면 화면 전체를 어둡게 (모든 화면에 포함)
// + 야간에 일정 시간 안 만지면 더 어둡게 (바깥 화면에서만 — 화면 위에 검은 막 + Fully 밝기 낮춤)
import { load } from './store.js';
import { isNight, shouldIdleDim } from './night-logic.js';

const top = !(() => { try { return window.frameElement?.id === 'appframe'; } catch { return false; } })();
const NIGHT_BRIGHT = 90;   // 야간 기본 밝기 (0~255)
const IDLE_BRIGHT = 12;    // 야간 + 안 만질 때 밝기
let wasNight = null;
let wasDim = false;
let savedBrightness = null;
let lastTouch = Date.now();

const nightSettings = () => ({ on: true, from: '00:00', to: '06:00', dimScreen: true, idleDim: 120, ...(load('settings', {}).night || {}) });
const fullyDo = fn => { try { if (window.fully) fn(window.fully); } catch { /* Fully 기능 없음 */ } };

// 검은 막: 어두울 때 첫 터치는 밝히기만 하고 아래 버튼은 안 눌리게
let veil = null;
function ensureVeil() {
  if (veil || !top) return;
  const st = document.createElement('style');
  st.textContent = '#night-veil{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 1.2s ease;z-index:2147483647}html.night-idle #night-veil{opacity:.72;pointer-events:auto}';
  document.head.appendChild(st);
  veil = document.createElement('div');
  veil.id = 'night-veil';
  const wakeUp = e => { e.preventDefault(); e.stopPropagation(); touch(); };
  veil.addEventListener('pointerdown', wakeUp);
  veil.addEventListener('click', wakeUp);
  document.body.appendChild(veil);
}

function setDim(dim, n) {
  document.documentElement.classList.toggle('night-idle', dim);
  if (dim === wasDim) return;
  if (n.dimScreen) fullyDo(f => f.setScreenBrightness(dim ? IDLE_BRIGHT : Math.min(NIGHT_BRIGHT, Number(savedBrightness) || NIGHT_BRIGHT)));
  wasDim = dim;
}

function apply() {
  const n = nightSettings();
  const night = !!n.on && isNight(new Date(), n.from, n.to);
  document.documentElement.classList.toggle('dark', night);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#000000' : '#ffffff');
  if (!top) { wasNight = night; return; }
  // Fully Kiosk가 있으면 화면 밝기도 낮춤
  if (night !== wasNight && n.dimScreen) {
    fullyDo(f => {
      if (night) { savedBrightness = f.getScreenBrightness(); f.setScreenBrightness(Math.min(NIGHT_BRIGHT, Number(savedBrightness) || NIGHT_BRIGHT)); }
      else if (wasNight && savedBrightness != null) f.setScreenBrightness(savedBrightness);
    });
    if (!night) wasDim = false;
  }
  wasNight = night;
  const alarm = !!document.querySelector('.alarm.open');
  if (night || wasDim) ensureVeil();
  setDim(shouldIdleDim({ night, idleMs: Date.now() - lastTouch, after: n.idleDim, alarm }), n);
}

function touch() {
  lastTouch = Date.now();
  if (wasDim) apply();
}

apply();
setInterval(apply, top ? 5000 : 30000);
window.addEventListener('storage', e => { if (e.key === 'kp.settings') apply(); });
window.addEventListener('kp-settings-changed', apply);
if (top) {
  ['pointerdown', 'keydown'].forEach(t => window.addEventListener(t, touch, true));
  // 겹쳐 열린 앱 화면 안에서 만진 것도 만진 걸로
  window.addEventListener('message', e => { if (e.origin === location.origin && e.data?.kp && e.data.type === 'activity') touch(); });
}
