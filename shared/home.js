import { icons } from './icons.js';
import { APP_ICONS } from './appicons.js';
import { load, save } from './store.js';
import { getConfig, getLog } from '../meds/state.js';
import { medsSummary } from './summary.js';
import { normalizeLayout, splitMedsWithWeather, swapItems, itemSize, nextSize, moveItem, removeItem, addItem, addable, WIDGET_SIZES } from './layout.js';
import { widgetBox, widgetBody, WIDGET_INFO, SYM } from './widgets.js';
import { FACES, faceById, renderFace } from './faces.js';
import { getSettings, setSettings, getPhotoUrl } from './settings.js';
import { getWeather } from './weather.js';
import { getAlbum, pickPhoto } from './album.js';
import { createSlides } from './slides.js';
import { findFocus, savedFocus } from './focus.js';
import { getEvents, todayEvents, upcoming, fmtTime, nextEvents, weekEvents, dayLabel } from './calendar.js';
import { DEFAULT_RECIPES, startRun, timerState, runElapsed, mergeSeeds } from '../coffee/logic.js';
import { toggleTaken } from '../meds/logic.js';
import { setLog } from '../meds/state.js';
// 새 커피 레시피를 홈에서도 바로 반영 (커피 앱을 안 열어도 위젯에 나오게)
{ const m = mergeSeeds(load('coffee.recipes', DEFAULT_RECIPES), load('coffee.seeded', [])); if (m.changed) { save('coffee.recipes', m.recipes); save('coffee.seeded', m.seeded); } }

const $ = id => document.getElementById(id);
const body = document.body;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const APP_INFO = {
  'app:meds': { name: '약', icon: 'pill', svg: 'meds', grad: '#ff9500', href: 'meds/index.html' },
  'app:coffee': { name: '커피', icon: 'cup', svg: 'coffee', grad: '#a2845e', href: 'coffee/index.html' },
  'app:cal': { name: '달력', icon: 'bell', svg: 'cal', grad: '#ff3b30', href: 'calendar/index.html' },
  'app:wx': { name: '날씨', icon: 'bell', svg: 'wx', grad: '#0a84ff', href: 'weather/index.html' },
  'app:settings': { name: '설정', icon: 'gear', svg: 'settings', grad: '#8e8e93', href: 'settings/index.html' },
};

let settings = getSettings();
let weather = null;
let photo = null;
let album = [];
// 사진 시계: 공유 앨범이 켜져 있고 사진이 있으면 5분마다 다음 사진, 아니면 태블릿에 넣은 사진 한 장
// 사진 바뀌는 간격 (설정, 기본 1분)
const slideMin = () => Math.max(0.25, (settings.albumSec || 60) / 60);
const albumNow = (t = Date.now()) => (settings.album && album.length ? pickPhoto(album, t, slideMin()) : null);
const facePhoto = () => albumNow()?.url || photo;
let layout = [];
let summary = null;
let events = [];
let eventsLoaded = false, wxTried = false;
// 한 번만: 저장된 배치의 약 중간 위젯 → 날씨 작게 + 약 작게
if (!load('mig.wxsplit', false)) {
  const saved = load('home.layout', null);
  const r = splitMedsWithWeather(Array.isArray(saved) ? saved : ['w:meds'], load('home.sizes', {}));
  if (Array.isArray(saved)) save('home.layout', r.layout);
  save('home.sizes', r.sizes);
  save('mig.wxsplit', true);
}
// 한 번만: 날씨는 위 오른쪽, 커피는 약 왼쪽으로 (자리 맞바꿈)
if (!load('mig.wxswap', false)) {
  const saved = load('home.layout', null);
  if (Array.isArray(saved)) save('home.layout', swapItems(saved, 'w:coffee', 'w:wx'));
  save('mig.wxswap', true);
}
let sizes = load('home.sizes', {});

// ---------- 배경 ----------
async function applyBg() {
  photo = await getPhotoUrl();
  const usePhoto = false; // 일단 배경은 흰색만
  const bg = $('bgl');
  bg.className = 'bgl ' + (usePhoto ? 'photo' : 'plain');
  bg.style.backgroundImage = usePhoto ? `url('${photo}')` : '';
  bg.style.setProperty('--blur', `${settings.bg.blur}px`);
  bg.style.setProperty('--dim', settings.bg.dim);
  body.classList.toggle('plain', !usePhoto);
}

// ---------- 시계 페이스 ----------
let faceKey = '';
function faceCtx(opts) {
  const recipes = load('coffee.recipes', DEFAULT_RECIPES);
  return { opts, weather, photo: facePhoto(), photoWide: (a => !!a && a.w > a.h)(albumNow()), summary, log: getLog(), coffeeName: recipes[0]?.name, events: todayEvents(events, new Date()), nextEvents: nextEvents(events, new Date(), 3), weekEvents: weekEvents(events, new Date(), 5), eventDays: events.map(e => `${e.start.getFullYear()}-${e.start.getMonth()}-${e.start.getDate()}`), wdata: wdata(), modIds: modIds() };
}
function drawFace(force) {
  const now = new Date();
  const f = settings.face;
  const analog = f.id === 'ana' || f.id === 'mini';
  const key = [f.id, f.color, f.showDate, f.showWeather, f.showEvents, events.length, weather?.temp, !!facePhoto(), now.getHours(), now.getMinutes(), analog ? now.getSeconds() : '', summary?.slots.length].join('|');
  if (!force && key === faceKey) return;
  faceKey = key;
  $('face-layer').dataset.face = f.id;
  try {
    // 사진은 아래 슬라이드 층이 따로 보여줌 (시계 글자를 다시 그려도 사진이 깜빡이지 않게)
    renderFace($('face-layer'), now, { ...faceCtx(f), noPhoto: true });
  }
  catch { $('face-layer').innerHTML = `<div class="fc fallback"><div class="bn">${pad(now.getHours())}</div><div class="bn">${pad(now.getMinutes())}</div></div>`; }
}

// ---------- 상단 시간·날짜 (날씨는 위젯·시계 화면에서만) ----------
function drawHero() {
  const d = new Date();
  $('h-time').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('h-date').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
  opticalLeft($('h-time')); opticalLeft($('h-date'));
}

// 큰 글자는 글자 자체의 왼쪽 여백 때문에 안쪽으로 들어가 보임 → 실제 잉크 위치에 맞춰 당김
const inkCanvas = document.createElement('canvas').getContext('2d');
function opticalLeft(el) {
  if (!el || !el.textContent) return;
  const cs = getComputedStyle(el);
  inkCanvas.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = inkCanvas.measureText(el.textContent.trim()[0]);
  el.style.marginLeft = `${Math.min(0, m.actualBoundingBoxLeft)}px`;
}

// 그리드를 화면 높이에 맞춰 줄여서 스크롤 없이 한 화면에. 좌우 여백도 같이 맞춰 시간·위젯 왼쪽 선 일치
const FIT_MIN = 0.85; // 한 화면에 맞추려고 줄일 수 있는 한도 (원래 크기의 85%)
function fitGrid() {
  const home = $('home'), grid = $('grid'), scroll = $('scroll');
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  const gap = vw * 0.042, basePad = vw * 0.05;
  const wCell = (vw - 2 * basePad - 3 * gap) / 4;
  home.style.setProperty('--cell', `${wCell}px`);
  home.style.paddingLeft = home.style.paddingRight = `${basePad}px`;
  const rows = getComputedStyle(grid).gridTemplateRows.split(' ').filter(Boolean).length;
  if (!rows) return;
  // 잠든 화면에선 #home이 살짝 확대돼 있어서 getBoundingClientRect가 틀림 → 확대와 무관한 offset 값으로 잼
  const top = scroll.offsetTop + 14;
  const bar = body.classList.contains('edit') ? (document.querySelector('.editbar')?.offsetHeight || 0) + vh * 0.03 + gap : basePad; // 아래 여백 = 좌우 여백 (위젯이 화면 아래 끝에 붙지 않게)
  let hCell = (vh - top - bar - (rows - 1) * gap) / rows;
  // 높이에 맞춰 줄어들면 좌우 여백이 커지므로, 아래 여백도 그 좌우 여백과 똑같아지게 칸 크기를 정함
  if (!body.classList.contains('edit') && rows > 2) hCell = Math.min(hCell, (vh - top - (rows - 1) * gap - vw / 2 + 1.5 * gap) / (rows - 2));
  // 조금만 넘치면 살짝 줄여서 한 화면에, 많이 넘치면 줄이지 않고 원래 크기로 아래로 스크롤
  // (크게 줄이면 좌우 여백만 휑하게 커짐)
  const over = hCell < wCell * FIT_MIN;
  const cell = over ? wCell : Math.min(wCell, hCell);
  const pad = (vw - 4 * cell - 3 * gap) / 2;
  scroll.style.paddingBottom = over ? `${basePad}px` : '';
  home.style.setProperty('--cell', `${cell}px`);
  home.style.setProperty('--pt', `${(2 * cell + gap) / 170}px`); // 작은 위젯 한 변 = 170pt
  home.style.paddingLeft = home.style.paddingRight = `${pad}px`;
  // 실제로 그려진 아래 여백을 재서 좌우 여백과 다르면 한 번 더 맞춤
  if (!over && !body.classList.contains('edit') && rows > 2 && cell < wCell) {
    const diff = pad - (vh - Math.max(...[...grid.querySelectorAll('.it:not(.addslot)')].map(e => e.offsetTop + e.offsetHeight - scroll.scrollTop), 0));
    if (Math.abs(diff) > 1) {
      const c2 = Math.max(wCell * FIT_MIN, Math.min(wCell, cell - diff / (rows - 2)));
      home.style.setProperty('--cell', `${c2}px`);
      home.style.setProperty('--pt', `${(2 * c2 + gap) / 170}px`);
      home.style.paddingLeft = home.style.paddingRight = `${(vw - 4 * c2 - 3 * gap) / 2}px`;
    }
  }
  grid.querySelectorAll('.w-temp, .w-date, .w-t28').forEach(opticalLeft);
  opticalLeft($('h-time')); opticalLeft($('h-date'));
}

// ---------- 그리드 ----------
// 위젯이 그릴 데이터 (못 받았으면 'loading', 연결 안 했으면 'off')
function wdata() {
  const run = load('coffee.run', null);
  const recipes = load('coffee.recipes', DEFAULT_RECIPES);
  return {
    now: new Date(),
    meds: { summary, log: getLog() },
    cal: { state: !settings.calUrl ? 'off' : eventsLoaded ? 'ok' : 'loading', events, at: load('cal.cache', null)?.at || null },
    wx: { state: !settings.weather ? 'off' : weather ? 'ok' : wxTried ? 'off' : 'loading', w: weather },
    coffee: coffeeData(recipes, run),
  };
}
// 커피: 마지막으로 내린 레시피를 먼저, 내리는 중이면 지금 단계·남은 시간
function coffeeData(recipes, run) {
  const last = load('coffee.last', null);
  const current = recipes.find(r => r.id === (run?.recipeId || last)) || recipes[0] || null;
  let running = null;
  if (run && run.since != null) {
    const r = recipes.find(x => x.id === run.recipeId);
    if (r) {
      const t = timerState(r, runElapsed(run, Date.now()));
      running = { name: r.name, step: r.steps[t.stepIndex], remain: t.totalRemaining, done: t.done };
    }
  }
  return { recipes, current, running };
}
// 시계 '홈 위젯' 페이스에 올릴 위젯 4개: 홈 화면 순서대로, 모자라면 나머지로 채움
function modIds() {
  const on = layout.filter(id => id.startsWith('w:'));
  return [...on, ...['w:meds', 'w:cal', 'w:wx', 'w:coffee'].filter(id => !on.includes(id))].slice(0, 4);
}
const RESIZE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/></svg>';
function widgetHtml(id, data) {
  return widgetBox(id, itemSize(id, sizes), data);
}
function itemHtml(id) {
  if (!data) data = wdata();
  const minus = `<button class="minus" type="button" data-remove="${esc(id)}" aria-label="홈 화면에서 빼기">${icons.minus}</button>`;
  const size = itemSize(id, sizes);
  if (size === 'app') {
    const a = APP_INFO[id];
    return `<div class="it app" data-id="${esc(id)}" role="link" aria-label="${a.name}">${minus}<span class="ico glass">${APP_ICONS[a.svg]}</span></div>`;
  }
  const rs = (WIDGET_SIZES[id] || []).length > 1 ? `<button class="rs" type="button" data-resize="${esc(id)}" aria-label="위젯 크기 바꾸기">${RESIZE}</button>` : '';
  return `<div class="it ${size}" data-id="${esc(id)}">${minus}${widgetHtml(id, data)}${rs}</div>`;
}
// 바뀐 값은 살짝 굴러 들어오게 (처음 그릴 땐 그대로)
let shown = null;
function drawGrid() {
  data = wdata();
  $('grid').innerHTML = layout.map(itemHtml).join('') + `<div class="it app addslot" data-add><span>${icons.plus}</span></div>`;
  const now = {};
  $('grid').querySelectorAll('.it[data-id] [data-k]').forEach(el => {
    const k = `${el.closest('.it').dataset.id}|${el.dataset.k}`;
    now[k] = el.textContent;
    if (shown && k in shown && shown[k] !== el.textContent) el.classList.add('roll');
  });
  shown = now;
  fitGrid();
}
let data = null;
addEventListener('resize', () => fitGrid());
document.fonts?.ready.then(() => { fitGrid(); drawFace(true); });
function refreshData() {
  const cfg = getConfig();
  summary = medsSummary(cfg, getLog(), new Date());
  layout = normalizeLayout(load('home.layout', null), cfg.people);
}

// ---------- 자는 상태 ↔ 깨어난 상태 ----------
let idleTimer = null;
const busy = () => body.classList.contains('edit') || document.querySelector('#home .sheet-back.open, .sheet-back.open, .picker.open, .alarm.open');
function coffeeRunning() { const r = load('coffee.run', null); return !!(r && r.since != null); }
function sleep() {
  if (busy()) return armIdle();
  if (appOpen) {
    if (coffeeSheetOpen && coffeeRunning()) return armIdle(); // 커피 타이머 보는 중엔 그대로
    return closeApp(() => body.classList.add('idle'));
  }
  body.classList.add('idle');
}
function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(sleep, Math.max(5, settings.idleSec) * 1000); }
function wake() {
  body.classList.remove('idle');
  armIdle();
  // 안내 문구는 처음 한 번만
  if (!load('hint.seen', false)) { save('hint.seen', true); document.querySelector('.idle-hint')?.remove(); }
}

// ---------- 터치: 탭 / 길게 누르기 / 끌기 ----------
let press = null; // { x, y, t, id, el, longTimer, dragging, grab }
const LONG = 550;

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('pointerdown', e => {
  if (e.target.closest('.sheet-back, .picker, .alarm, .editbar, .live-pill, .appview, .toast')) return;
  const idle = body.classList.contains('idle');
  const itEl = e.target.closest('.it[data-id]');
  press = { x: e.clientX, y: e.clientY, idle, el: itEl, id: itEl?.dataset.id, target: e.target, moved: false };
  press.longTimer = setTimeout(() => {
    if (!press || press.moved) return;
    press.long = true;
    if (press.idle) openPicker();
    else if (!body.classList.contains('edit')) enterEdit();
  }, LONG);
  if (!idle) armIdle();
});

document.addEventListener('pointermove', e => {
  if (!press) return;
  const dx = e.clientX - press.x, dy = e.clientY - press.y;
  if (!press.moved && Math.hypot(dx, dy) > 10) { press.moved = true; clearTimeout(press.longTimer); }
  // 편집 모드에서 아이템 끌기
  if (body.classList.contains('edit') && press.el && press.moved) {
    if (!press.dragging) {
      press.dragging = true;
      const r = press.el.getBoundingClientRect();
      press.grab = { x: press.x - r.left, y: press.y - r.top };
      press.el.classList.add('dragging');
    }
    followPointer(e.clientX, e.clientY);
    const under = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.matches?.('.it[data-id]') && n.dataset.id !== press.id);
    if (under) {
      const next = moveItem(layout, press.id, under.dataset.id);
      if (next.join() !== layout.join()) {
        layout = next;
        drawGrid();
        press.el = $('grid').querySelector(`.it[data-id="${CSS.escape(press.id)}"]`);
        press.el.classList.add('dragging');
        followPointer(e.clientX, e.clientY);
      }
    }
  }
});
function followPointer(x, y) {
  const el = press.el;
  el.style.transform = '';
  const r = el.getBoundingClientRect();
  el.style.transform = `translate(${x - press.grab.x - r.left}px, ${y - press.grab.y - r.top}px) scale(1.06)`;
}

document.addEventListener('pointerup', e => {
  if (!press) return;
  clearTimeout(press.longTimer);
  const p = press;
  press = null;
  if (p.dragging) { p.el.classList.remove('dragging'); p.el.style.transform = ''; return; }
  if (p.long || p.moved) return;
  // 그냥 탭
  if (p.idle) { wake(); return; }
  if (body.classList.contains('edit')) {
    const rm = p.target.closest('[data-remove]');
    if (rm) { layout = removeItem(layout, rm.dataset.remove); drawGrid(); return; }
    const rsz = p.target.closest('[data-resize]');
    if (rsz) { const id = rsz.dataset.resize; sizes = { ...sizes, [id]: nextSize(id, sizes) }; save('home.sizes', sizes); drawGrid(); return; }
    if (p.target.closest('[data-add]')) openAdd();
    return;
  }
  const play = p.target.closest('[data-play]');
  if (play) return startCoffee(play.dataset.play);
  if (p.target.closest('[data-open-coffee]')) return openApp('coffee/index.html?run', p.el);
  if (!p.id) return;
  const slot = p.target.closest('[data-slot]');
  if (p.id.startsWith('app:')) openApp(APP_INFO[p.id].href, p.el);
  else if (slot) takeSlot(slot.dataset.slot);
  else if (p.id === 'w:coffee') openApp('coffee/index.html', p.el);
  else if (p.id === 'w:meds') openApp('meds/index.html', p.el);
  // 위젯을 누르면 그 앱으로 (일정 → 달력, 날씨 → 날씨). 아직 연결 안 했으면 앱 안에서 안내
  else if (p.id === 'w:cal') { const dd = p.target.closest('[data-day]')?.dataset.day; openApp(`calendar/index.html${dd ? `?d=${dd}` : ''}`, p.el); }
  else if (p.id === 'w:wx') openApp('weather/index.html', p.el);
});
document.addEventListener('pointercancel', () => { if (press?.el) { press.el.classList.remove('dragging'); press.el.style.transform = ''; } press = null; });

function startCoffee(id) {
  const list = load('coffee.recipes', DEFAULT_RECIPES);
  const r = list.find(x => x.id === id) || list[0];
  if (!r) return;
  save('coffee.run', startRun(null, r.id, Date.now()));
  save('coffee.last', r.id);
  openApp('coffee/index.html?run', document.querySelector('.it[data-id="w:coffee"]'));
}

// ---------- 위젯 눌러서 바로 먹음 체크 (3초 되돌리기) ----------
let undo = null, toastTimer = null;
function toast(text, onUndo) {
  $('toast-undo').hidden = !onUndo;
  $('toast-text').textContent = text;
  undo = onUndo;
  $('toast').classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').classList.remove('on'); undo = null; }, 3000);
}
$('toast-undo').addEventListener('click', () => { if (undo) undo(); $('toast').classList.remove('on'); undo = null; });
// 위젯의 동그라미: 그 약 하나만 먹음/취소 (되돌리기 가능)
function takeSlot(key) {
  const s = summary?.slots.find(x => x.key === key);
  if (!s) return;
  const was = !!getLog()[key];
  setLog(toggleTaken(getLog(), key, new Date()));
  toast(`${s.personName} ${s.time} ${s.medName} ${was ? '먹음 취소' : '먹음'}`, () => setLog(toggleTaken(getLog(), key, new Date())));
}

// ---------- 앱 열기: 아이콘에서 커지며 열림, 새로고침 없음 ----------
let appOpen = false, appFrom = null, coffeeSheetOpen = false;
function rectOf(el) {
  const r = el?.getBoundingClientRect();
  return r && r.width ? r : { left: innerWidth / 2 - 40, top: innerHeight / 2 - 40, width: 80, height: 80 };
}
function setFromTransform(r) {
  const v = $('appview');
  v.style.transform = `translate(${r.left}px, ${r.top}px) scale(${r.width / innerWidth}, ${r.height / innerHeight})`;
  v.style.borderRadius = `${Math.max(40, innerWidth * 0.12)}px`;
}
function openApp(href, fromEl) {
  const v = $('appview');
  appFrom = fromEl;
  $('appframe').src = href;
  v.style.transition = 'none';
  setFromTransform(rectOf(fromEl));
  v.style.opacity = '0';
  v.classList.add('open');
  appOpen = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    v.style.transition = '';
    v.style.transform = 'none';
    v.style.borderRadius = '0px';
    v.style.opacity = '1';
  }));
  armIdle();
}
function closeApp(then) {
  if (!appOpen) { then && then(); return; }
  const v = $('appview');
  appOpen = false;
  coffeeSheetOpen = false;
  window.kpCoffeeOpen = false;
  const el = appFrom && document.contains(appFrom) ? appFrom : null;
  setFromTransform(rectOf(el));
  v.style.opacity = '0';
  setTimeout(() => { v.classList.remove('open'); $('appframe').src = 'about:blank'; refreshData(); drawGrid(); then && then(); }, 320);
}
window.addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data?.kp) return;
  const m = e.data;
  if (m.type === 'close') closeApp();
  else if (m.type === 'activity') armIdle();
  else if (m.type === 'pick') closeApp(() => openPicker());
  else if (m.type === 'coffee-open') { coffeeSheetOpen = !!m.open; window.kpCoffeeOpen = coffeeSheetOpen; }
});
// ---------- 시계 화면 정보 (멀리서 보는 다음 약) ----------
function glanceHtml() {
  const f = settings.face.id;
  if (!summary || f === 'mod' || f === 'cal') return '';
  const late = summary.people.find(p => p.late);
  if (late) return `<span class="gl late"><i></i>${esc(late.name)} ${esc(late.lateTime)} ${esc(late.lateMed)} 아직 안 먹음</span>`;
  // 시계에 일정 목록이 이미 나오면 아래 알약에는 일정을 또 띄우지 않음 (약만)
  const ev = settings.face.showEvents === false ? todayEvents(events, new Date()).find(e => !e.allDay && e.start > new Date()) : null;
  const n = summary.next;
  if (ev && (!n || fmtTime(ev.start) <= n.time)) return `<span class="gl cal"><i></i>${fmtTime(ev.start)} ${esc(ev.title)}</span>`;
  return n ? `<span class="gl"><i></i>다음 약 ${esc(n.time)} ${esc(n.medName)} <small>${esc(n.personName)}</small></span>` : '';
}
// 아래로 쓸어내린 알림은 내용이 바뀔 때까지 숨김 (시계 위치는 알림이 있든 없든 그대로)
function drawGlance() {
  const html = glanceHtml();
  $('glance').innerHTML = html && load('glance.hide', '') !== html ? html : '';
}
let glanceDrag = null;
$('glance').addEventListener('pointerdown', e => { if (e.target.closest('.gl')) glanceDrag = { y: e.clientY }; });
document.addEventListener('pointermove', e => {
  if (!glanceDrag) return;
  const gl = $('glance').querySelector('.gl');
  if (gl) gl.style.transform = `translateY(${Math.max(0, e.clientY - glanceDrag.y)}px)`;
});
document.addEventListener('pointerup', e => {
  if (!glanceDrag) return;
  const dy = e.clientY - glanceDrag.y;
  glanceDrag = null;
  const gl = $('glance').querySelector('.gl');
  if (!gl) return;
  if (dy > 30) {
    save('glance.hide', glanceHtml());
    gl.classList.add('bye');
    setTimeout(drawGlance, 250);
  } else gl.style.transform = '';
});

// ---------- 편집 모드 ----------
function enterEdit() { body.classList.add('edit'); clearTimeout(idleTimer); fitGrid(); }
function exitEdit() { body.classList.remove('edit'); save('home.layout', layout); armIdle(); fitGrid(); }
$('done-btn').addEventListener('click', exitEdit);
$('add-btn').addEventListener('click', openAdd);

// ---------- 위젯 고르기 (애플 위젯 갤러리처럼: 실제 미리보기 + 크기 고르기 + 한 줄 설명) ----------
const SIZE_NAME = { s: '작게', m: '중간', l: '크게' };
const gsize = {};
function galleryPrev(id, size, width) {
  const pt = Math.min(width, 560) / 364;
  const w = (size === 's' ? 170 : 364) * pt, h = (size === 'l' ? 382 : 170) * pt;
  return `<div class="gprev" style="width:${w}px;height:${h}px;--pt:${pt}px">${widgetBox(id, size, wdata())}</div>`;
}
function openAdd() {
  const list = addable(layout, getConfig().people);
  const wids = list.filter(id => id.startsWith('w:')), apps = list.filter(id => id.startsWith('app:'));
  const width = Math.max(240, ($('add-sheet').querySelector('.sheet')?.clientWidth || innerWidth) - 32 - 36);
  const cards = wids.map(id => {
    const info = WIDGET_INFO[id], ok = WIDGET_SIZES[id];
    const sz = ok.includes(gsize[id]) ? gsize[id] : itemSize(id, {});
    return `<div class="gcard" data-gid="${esc(id)}">
      <div class="gtitle" style="color:${info.accent}">${SYM[info.sym]}<span style="color:var(--label, #000)">${esc(info.name)}</span></div>
      <div class="gdesc">${esc(info.desc)}</div>
      ${galleryPrev(id, sz, width)}
      ${ok.length > 1 ? `<div class="gsizes">${ok.map(k => `<button type="button" data-gsize="${k}" class="${k === sz ? 'on' : ''}">${SIZE_NAME[k]}</button>`).join('')}</div>` : ''}
      <button class="gadd" type="button" data-addid="${esc(id)}" data-size="${sz}">위젯 추가</button></div>`;
  }).join('');
  const appCards = apps.map(id => `<button class="addcard" type="button" data-addid="${esc(id)}"><span class="ico glass">${APP_ICONS[APP_INFO[id].svg]}</span><span>${esc(APP_INFO[id].name)}<small>앱</small></span></button>`).join('');
  $('add-list').innerHTML = (cards ? `<h4>위젯</h4>${cards}` : '') + (appCards ? `<h4>앱</h4><div class="gapps">${appCards}</div>` : '') || '<p class="empty">모두 홈 화면에 있어요</p>';
  $('add-sheet').classList.add('open');
}
$('add-list').addEventListener('click', e => {
  const sb = e.target.closest('[data-gsize]');
  if (sb) { gsize[sb.closest('[data-gid]').dataset.gid] = sb.dataset.gsize; const top = $('add-list').parentElement.scrollTop; openAdd(); $('add-list').parentElement.scrollTop = top; return; }
  const b = e.target.closest('[data-addid]');
  if (!b) return;
  const id = b.dataset.addid;
  if (b.dataset.size) { sizes = { ...sizes, [id]: b.dataset.size }; save('home.sizes', sizes); }
  layout = addItem(layout, id);
  drawGrid();
  $('add-sheet').classList.remove('open');
});
$('add-close').addEventListener('click', () => $('add-sheet').classList.remove('open'));

// ---------- 위젯 모양: 기본(밝게/어둡게 자동) / 투명 / 틴트 ----------
const TINTS = ['#ff9500', '#ff3b30', '#ff2d55', '#af52de', '#5856d6', '#007aff', '#30b0c7', '#34c759', '#a2845e'];
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v * t + y[i] * (1 - t))).join(',')})`; };
function hueOf(h) {
  const [r, g, b] = hex(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (x * 60 + 360) % 360;
}
function applyLook() {
  const lk = settings.look || {};
  const mode = ['clear', 'tint'].includes(lk.mode) ? lk.mode : '';
  if (mode) body.dataset.look = mode; else delete body.dataset.look;
  if (mode === 'tint') {
    const t = TINTS.includes(lk.tint) ? lk.tint : TINTS[0];
    const st = body.style;
    st.setProperty('--tint', t);
    st.setProperty('--tbg', mix(t, '#151517', .2));
    st.setProperty('--tfg', mix(t, '#ffffff', .32));
    st.setProperty('--tfg2', mix(t, '#8e8e93', .45));
    st.setProperty('--tfg3', mix(t, '#3a3a3c', .35));
    st.setProperty('--tpage', mix(t, '#0b0b0c', .1));
    // 색 있는 그림·기호를 회색으로 만든 뒤 고른 색으로 물들임 (sepia 기본 색조 ≈ 38°)
    st.setProperty('--tf', `grayscale(1) sepia(1) hue-rotate(${Math.round(hueOf(t) - 38)}deg) saturate(2.6) brightness(1.05)`);
  }
}
function drawLooks() {
  const lk = settings.look || {}, mode = lk.mode || 'default';
  const L = [['default', '기본', '밝게, 밤엔 어둡게'], ['clear', '투명', '유리처럼 비치게'], ['tint', '틴트', '고른 색 한 가지로']];
  $('looks').innerHTML = L.map(([k, n, d]) => `<button type="button" class="lk ${k === mode ? 'on' : ''}" data-look="${k}"><span class="lkp lkp-${k}" style="${k === 'tint' ? `--tint:${lk.tint || TINTS[0]}` : ''}"><i></i><i></i></span><b>${n}</b><small>${d}</small></button>`).join('');
  $('tints').innerHTML = mode === 'tint' ? TINTS.map(c => `<button type="button" class="sw ${c === (lk.tint || TINTS[0]) ? 'sel' : ''}" data-tint="${c}" aria-label="색" style="background:${c}"></button>`).join('') : '';
}
$('look-btn').addEventListener('click', () => { drawLooks(); $('look-sheet').classList.add('open'); });
$('look-close').addEventListener('click', () => $('look-sheet').classList.remove('open'));
$('looks').addEventListener('click', e => {
  const b = e.target.closest('[data-look]');
  if (!b) return;
  settings = setSettings({ look: { ...(settings.look || {}), mode: b.dataset.look } });
  applyLook(); drawLooks();
});
$('tints').addEventListener('click', e => {
  const b = e.target.closest('[data-tint]');
  if (!b) return;
  settings = setSettings({ look: { ...(settings.look || {}), mode: 'tint', tint: b.dataset.tint } });
  applyLook(); drawLooks();
});

// ---------- 시계 고르기·꾸미기 ----------
let pick = null;
function openPicker() {
  pick = { ...settings.face };
  $('pstrip').innerHTML = FACES.map(f => `<div class="pcard" data-face="${f.id}"><div class="pprev face-root"></div><div class="pname">${f.name}</div></div>`).join('');
  drawPicker();
  $('picker').classList.add('open');
  const sel = $('pstrip').querySelector(`[data-face="${pick.id}"]`);
  sel?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
function drawPicker() {
  const now = new Date();
  $('pstrip').querySelectorAll('.pcard').forEach(card => {
    const id = card.dataset.face;
    card.classList.toggle('sel', id === pick.id);
    const opts = id === pick.id ? pick : { ...pick, id, color: 0 };
    renderFace(card.querySelector('.pprev'), now, faceCtx(opts));
  });
  const f = faceById(pick.id);
  $('swatches').innerHTML = f.colors.map((c, i) => `<button class="sw ${i === pick.color ? 'sel' : ''}" type="button" data-sw="${i}" aria-label="색 ${i + 1}" style="background:${c.length > 1 ? `linear-gradient(135deg,${c[0]} 50%,${c[c.length - 1]} 50%)` : c[0]}"></button>`).join('');
  $('tg-date').classList.toggle('on', pick.showDate !== false);
  $('tg-wx').classList.toggle('on', pick.showWeather !== false);
  $('tg-ev').classList.toggle('on', pick.showEvents !== false);
}
$('pstrip').addEventListener('click', e => {
  const c = e.target.closest('[data-face]');
  if (!c || c.dataset.face === pick.id) return;
  pick = { ...pick, id: c.dataset.face, color: 0 };
  drawPicker();
});
$('swatches').addEventListener('click', e => { const b = e.target.closest('[data-sw]'); if (b) { pick.color = Number(b.dataset.sw); drawPicker(); } });
$('tg-date').addEventListener('click', () => { pick.showDate = pick.showDate === false; drawPicker(); });
$('tg-ev').addEventListener('click', () => {
  pick.showEvents = pick.showEvents === false;
  drawPicker();
  if (pick.showEvents !== false && !settings.calUrl) toast('설정에서 구글 캘린더 연결 코드를 넣으면 일정이 나와요');
});
$('tg-wx').addEventListener('click', async () => {
  pick.showWeather = pick.showWeather === false;
  drawPicker();
  if (pick.showWeather === false) return;
  // 날씨 받아오기가 꺼져 있으면 같이 켬 (보내는 건 고정된 마포구 좌표뿐)
  if (!settings.weather) settings = setSettings({ weather: true });
  if (!weather) { toast('날씨 받아오는 중…'); await loadWeather(); }
  if (weather) { toast(`날씨 ${weather.temp}°`); drawPicker(); }
  else toast('날씨를 못 받아왔어요. 인터넷 연결을 확인하세요');
});
$('pick-done').addEventListener('click', () => {
  settings = setSettings({ face: pick });
  $('picker').classList.remove('open');
  drawFace(true);
});

// ---------- 시작 ----------
async function loadAlbum(force = false) {
  album = (await getAlbum(force)).photos;
  drawFace(true);
  tickSlides();
  findFaces();
}
// ---------- 사진 슬라이드 (디졸브, 얼굴 중심) ----------
let retryAt = 0;
const bad = new Set();
const slides = createSlides($('slides'), {
  // 못 받은 사진은 건너뛰고 바로 다음 사진, 목록은 새로 받기 (1분에 한 번까지)
  onError: url => { bad.add(url); tickSlides(); if (Date.now() > retryAt) { retryAt = Date.now() + 60000; bad.clear(); bad.add(url); loadAlbum(true); } },
});
function slideUrl() {
  const first = facePhoto();
  if (!first || !bad.has(first) || !album.length) return first;
  const i = album.findIndex(p => p.url === first);
  for (let k = 1; k <= album.length; k++) { const p = album[(i + k) % album.length]; if (!bad.has(p.url)) return p.url; }
  return photo;
}
function tickSlides() {
  const id = settings.face.id;
  const url = id === 'photo' || id === 'album' ? slideUrl() : null;
  $('slides').classList.toggle('on', !!url);
  slides.show(url);
  // 다음 사진 미리 받아 두기
  const next = albumNow(Date.now() + (settings.albumSec || 60) * 1000);
  if (next && next.url !== url) new Image().src = next.url;
}
setInterval(tickSlides, 1000);
// 얼굴 위치는 처음 한 번만 찾아서 저장 (태블릿 안에서만 계산)
let finding = false;
async function findFaces() {
  if (finding) return;
  finding = true;
  for (const p of album) {
    if (savedFocus(p.url) !== undefined) continue;
    try { await findFocus(p.url); } catch {}
    await new Promise(r => setTimeout(r, 800));
  }
  finding = false;
}
async function loadWeather() { weather = await getWeather(); wxTried = true; drawHero(); drawFace(true); if (!body.classList.contains('edit')) drawGrid(); }
async function loadEvents() { events = await getEvents(); eventsLoaded = true; if (!body.classList.contains('edit')) drawGrid(); drawGlance(); drawFace(true); }

async function init() {
  if (load('hint.seen', false)) document.querySelector('.idle-hint')?.remove();
  refreshData();
  await applyBg();
  applyLook();
  drawHero();
  drawFace(true);
  drawGrid();
  loadWeather();
  if (new URLSearchParams(location.search).has('pick')) { history.replaceState(null, '', location.pathname); openPicker(); }
  setInterval(() => { drawHero(); drawFace(); }, 1000);
  setInterval(() => { if (!body.classList.contains('edit')) { refreshData(); drawGrid(); } }, 30000);
  // 커피 내리는 중엔 위젯의 단계·남은 시간을 1초마다
  setInterval(() => { const r = load('coffee.run', null); if (r && r.since != null && layout.includes('w:coffee') && !body.classList.contains('edit') && !body.classList.contains('idle')) drawGrid(); }, 1000);
  setInterval(loadWeather, 10 * 60000);
  loadEvents();
  setInterval(loadEvents, 5 * 60000);
  loadAlbum();
  setInterval(loadAlbum, 25 * 60000);
  const onData = () => { refreshData(); if (!body.classList.contains('edit')) drawGrid(); drawFace(true); drawGlance(); };
  window.addEventListener('kp-meds-changed', onData);
  window.addEventListener('storage', e => { if (e.key?.startsWith('kp.meds') || e.key?.startsWith('kp.coffee')) onData(); if (e.key === 'kp.settings') { settings = getSettings(); applyLook(); drawFace(true); drawGlance(); loadEvents(); loadWeather(); loadAlbum(); tickSlides(); } if (e.key === 'kp.home.layout' || e.key === 'kp.home.sizes') { sizes = load('home.sizes', {}); refreshData(); drawGrid(); } });
  setInterval(drawGlance, 30000);
  drawGlance();
  // 알람이 울리면 깨우기
  // (body 클래스를 바꾸면 다시 불리므로, 잠든 상태일 때만 깨움)
  setInterval(() => { if (body.classList.contains('idle') && document.querySelector('.alarm.open')) wake(); }, 500);
}
init();
