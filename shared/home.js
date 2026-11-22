import { icons } from './icons.js';

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

tickClock();
setInterval(tickClock, 5000);
renderApps();
