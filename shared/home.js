import { icons } from './icons.js';
import { todaySlots } from '../meds/logic.js';
import { getConfig, getLog } from '../meds/state.js';

// 새 앱은 여기에 한 줄 추가
export const APPS = [
  { href: 'meds/', name: '약', icon: 'pill', color: 'var(--orange)' },
  { href: 'coffee/', name: '커피', icon: 'cup', color: 'var(--brown)' },
];

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = n => String(n).padStart(2, '0');

function tickClock() {
  const d = new Date();
  document.getElementById('clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  document.getElementById('date').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
}

export const appStates = {}; // 앱별 상태 문구 (약 앱이 채움)

export function renderApps() {
  const el = document.getElementById('apps');
  el.innerHTML = APPS.map(a => {
    const st = appStates[a.href] || {};
    return `<a class="tile on" href="${a.href}" style="text-decoration:none;color:inherit">
      ${st.badge ? `<span class="badge">${st.badge}</span>` : ''}
      <span class="glyph" style="background:${a.color}">${icons[a.icon]}</span>
      <span><div class="name">${a.name}</div><div class="state">${st.text || '열기'}</div></span>
    </a>`;
  }).join('');
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function medsSummary() {
  const cfg = getConfig();
  const log = getLog();
  const now = new Date();
  const slots = todaySlots(cfg, now);
  const late = slots.filter(s => !log[s.key] && now >= s.at);
  const left = slots.filter(s => !log[s.key]);
  appStates['meds/'] = slots.length
    ? { text: left.length ? `${left.length}번 남음` : '오늘 다 먹었어요', badge: late.length || '' }
    : { text: '약을 추가하세요' };
  document.getElementById('pills').innerHTML = cfg.people
    .map(p => {
      const mine = slots.filter(s => s.personId === p.id);
      if (!mine.length) return '';
      const l = mine.filter(s => !log[s.key] && now >= s.at).length;
      const r = mine.filter(s => !log[s.key]).length;
      const cls = l ? 'warn' : r ? '' : 'ok';
      const txt = l ? `${p.name} 약 ${l}번 안 먹음` : r ? `${p.name} 약 ${r}번 남음` : `${p.name} 약 다 먹음`;
      return `<span class="pill ${cls}"><span class="dot"></span>${esc(txt)}</span>`;
    })
    .join('');
  renderApps();
}

tickClock();
setInterval(tickClock, 5000);
medsSummary();
setInterval(medsSummary, 30000);
window.addEventListener('kp-meds-changed', medsSummary);
