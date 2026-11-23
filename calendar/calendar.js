// 달력 앱: 구글 캘린더에서 받아 둔 일정(오늘부터 7일)을 달력으로 보기 (읽기만)
import { icons } from '../shared/icons.js';
import { load } from '../shared/store.js';
import { getEvents, monthCells, eventsOn, sameDay, fmtTime } from '../shared/calendar.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const chev = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

$('back').innerHTML = icons.home;
$('reload').innerHTML = icons.reset;
$('prev').innerHTML = chev('M15 5l-7 7 7 7');
$('next').innerHTML = chev('M9 5l7 7-7 7');

let events = [];
const now = new Date();
let view = { y: now.getFullYear(), m: now.getMonth() };
let sel = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// 홈 위젯에서 특정 날을 눌러 들어오면 그날 (?d=2026-11-27)
const qd = new URLSearchParams(location.search).get('d');
if (qd && /^\d{4}-\d{2}-\d{2}$/.test(qd)) { const [y, m, d] = qd.split('-').map(Number); sel = new Date(y, m - 1, d); view = { y, m: m - 1 }; }

const connected = () => !!load('settings', {}).calUrl;

function draw() {
  const today = new Date();
  $('yr').textContent = `${view.y}년`;
  $('mon').textContent = `${view.m + 1}월`;
  const cells = monthCells(view.y, view.m);
  $('grid').innerHTML = WD.map(d => `<div class="wd">${d}</div>`).join('') + cells.map(c => {
    const d = c.date;
    const cls = ['day', c.out ? 'out' : '', d.getDay() === 0 ? 'sun' : '', sameDay(d, today) ? 'today' : '', sameDay(d, sel) ? 'sel' : '', eventsOn(events, d).length ? 'has' : ''].join(' ');
    return `<button type="button" class="${cls}" data-d="${d.getFullYear()}-${d.getMonth()}-${d.getDate()}" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일"><b>${d.getDate()}</b><i></i></button>`;
  }).join('');
  drawAgenda();
}

function timeOf(e, day) {
  if (e.allDay) return '종일';
  const s = sameDay(e.start, day) ? fmtTime(e.start) : '';
  const t = sameDay(e.end, day) ? fmtTime(e.end) : '';
  return `${s || '…'}<small>${t || '…'}</small>`;
}
function drawAgenda() {
  const head = `<h2>${sel.getMonth() + 1}월 ${sel.getDate()}일 ${WD[sel.getDay()]}요일</h2>`;
  if (!connected()) {
    $('agenda').innerHTML = `${head}<div class="empty2">설정에서 구글 캘린더 연결 코드를 넣으면 일정이 보여요.</div><a class="connect" href="../settings/index.html">설정 열기</a>`;
    return;
  }
  const list = eventsOn(events, sel);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const outside = sel < start || sel >= end;
  $('agenda').innerHTML = head + (list.length
    ? list.map(e => `<div class="ev"><b>${esc(e.title)}</b><span>${timeOf(e, sel)}</span></div>`).join('')
    : `<div class="empty2">${outside ? '이 날 일정은 아직 안 받아왔어요' : '일정 없음'}</div>`)
    + `<p class="foot">구글 캘린더에서 오늘부터 7일 동안의 일정을 받아와요.</p>`;
}

$('grid').addEventListener('click', e => {
  const b = e.target.closest('[data-d]');
  if (!b) return;
  const [y, m, d] = b.dataset.d.split('-').map(Number);
  sel = new Date(y, m, d);
  if (m !== view.m) view = { y, m };
  draw();
});
const move = k => { const d = new Date(view.y, view.m + k, 1); view = { y: d.getFullYear(), m: d.getMonth() }; draw(); };
$('prev').addEventListener('click', () => move(-1));
$('next').addEventListener('click', () => move(1));
$('reload').addEventListener('click', async () => {
  $('reload').disabled = true;
  events = await getEvents(true);
  $('reload').disabled = false;
  draw();
});

draw();
getEvents().then(e => { events = e; draw(); });
