import { icons } from './icons.js';
import { APP_ICONS } from './appicons.js';
import { load, save } from './store.js';
import { getConfig, getLog } from '../meds/state.js';
import { medsSummary } from './summary.js';
import { normalizeLayout, itemSize, moveItem, removeItem, addItem, addable } from './layout.js';
import { FACES, faceById, renderFace } from './faces.js';
import { getSettings, setSettings, getPhotoUrl } from './settings.js';
import { getWeather, WEATHER_ICONS, codeInfo } from './weather.js';
import { DEFAULT_RECIPES, startRun } from '../coffee/logic.js';
import { currentSlotFor, toggleTaken } from '../meds/logic.js';
import { setLog } from '../meds/state.js';

const $ = id => document.getElementById(id);
const body = document.body;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const APP_INFO = {
  'app:meds': { name: '약', icon: 'pill', svg: 'meds', grad: '#ff9500', href: 'meds/' },
  'app:coffee': { name: '커피', icon: 'cup', svg: 'coffee', grad: '#a2845e', href: 'coffee/' },
  'app:settings': { name: '설정', icon: 'gear', svg: 'settings', grad: '#8e8e93', href: 'settings/' },
};

let settings = getSettings();
let weather = null;
let photo = null;
let layout = [];
let summary = null;

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
  return { opts, weather, photo, summary, log: getLog(), coffeeName: recipes[0]?.name };
}
function drawFace(force) {
  const now = new Date();
  const f = settings.face;
  const analog = f.id === 'ana' || f.id === 'mini';
  const key = [f.id, f.color, f.showDate, f.showWeather, weather?.temp, photo, now.getHours(), now.getMinutes(), analog ? now.getSeconds() : '', summary?.slots.length].join('|');
  if (!force && key === faceKey) return;
  faceKey = key;
  $('face-layer').dataset.face = f.id;
  renderFace($('face-layer'), now, faceCtx(f));
}

// ---------- 상단 시간·날짜·날씨 ----------
function drawHero() {
  const d = new Date();
  $('h-time').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('h-date').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
  $('h-wx').innerHTML = weather ? `${WEATHER_ICONS[codeInfo(weather.code).icon]}${weather.temp}°` : '';
}

// ---------- 그리드 ----------
function widgetHtml(id) {
  if (id.startsWith('w:person:')) {
    const p = summary.people.find(x => `w:person:${x.id}` === id);
    if (!p) return '';
    const big = !p.total ? '약 없음' : p.allDone ? '다 먹었어요' : p.late ? `${p.late}번 안 먹음` : `${p.left}번 남음`;
    const sub = p.late ? `${p.lateTime} ${p.lateMed}` : p.nextTime ? `${p.nextTime} ${p.nextMed}` : '';
    return `<div class="wg"><div class="wh">${esc(p.name)}</div><div><div class="wbig ${p.late ? 'alert' : ''}">${esc(big)}</div>${sub ? `<div class="wsub">${esc(sub)}</div>` : ''}</div></div>`;
  }
  if (id === 'w:coffee') {
    const r = load('coffee.recipes', DEFAULT_RECIPES)[0];
    const min = r ? Math.round(r.steps.reduce((a, s) => a + s.sec, 0) / 60) : 0;
    return `<div class="wg"><div class="wh">커피</div><div><div class="wbig">${esc(r?.name || '레시피 없음')}</div>${r ? `<div class="wsub">${min}분</div>` : ''}</div>${r ? `<button class="wplay" type="button" data-play aria-label="커피 타이머 시작">${icons.play}</button>` : ''}</div>`;
  }
  if (id === 'w:next') {
    const n = summary.next;
    return `<div class="wg"><div><div class="wh">다음 약</div><div class="wbig">${n ? esc(n.time) : '없음'}${n ? `<span class="wsub2">${esc(n.medName)} ${esc(n.personName)}</span>` : ''}</div></div></div>`;
  }
  return '';
}
function itemHtml(id) {
  const minus = `<button class="minus" type="button" data-remove="${esc(id)}" aria-label="홈 화면에서 빼기">${icons.minus}</button>`;
  const size = itemSize(id);
  if (size === 'app') {
    const a = APP_INFO[id];
    return `<div class="it app" data-id="${esc(id)}" role="link" aria-label="${a.name}">${minus}<span class="ico glass">${APP_ICONS[a.svg]}</span></div>`;
  }
  return `<div class="it ${size}" data-id="${esc(id)}">${minus}${widgetHtml(id)}</div>`;
}
function drawGrid() {
  $('grid').innerHTML = layout.map(itemHtml).join('') + `<div class="it app addslot" data-add><span>${icons.plus}</span></div>`;
}
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
    if (p.target.closest('[data-add]')) openAdd();
    return;
  }
  if (p.target.closest('[data-play]')) return startCoffee();
  if (!p.id) return;
  if (p.id.startsWith('app:')) openApp(APP_INFO[p.id].href, p.el);
  else if (p.id.startsWith('w:person:')) quickTake(p.id.slice(9));
  else if (p.id === 'w:coffee') openApp('coffee/', p.el);
  else openApp('meds/', p.el);
});
document.addEventListener('pointercancel', () => { if (press?.el) { press.el.classList.remove('dragging'); press.el.style.transform = ''; } press = null; });

function startCoffee() {
  const r = load('coffee.recipes', DEFAULT_RECIPES)[0];
  if (!r) return;
  save('coffee.run', startRun(null, r.id, Date.now()));
  openApp('coffee/?run', document.querySelector('.it[data-id="w:coffee"]'));
}

// ---------- 위젯 눌러서 바로 먹음 체크 (3초 되돌리기) ----------
let undo = null, toastTimer = null;
function toast(text, onUndo) {
  $('toast-text').textContent = text;
  undo = onUndo;
  $('toast').classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').classList.remove('on'); undo = null; }, 3000);
}
$('toast-undo').addEventListener('click', () => { if (undo) undo(); $('toast').classList.remove('on'); undo = null; });
function quickTake(personId) {
  const cfg = getConfig();
  const slot = currentSlotFor(cfg, getLog(), personId, new Date());
  const name = cfg.people.find(p => p.id === personId)?.name || '';
  if (!slot) { toast(`${name} 오늘 약은 다 먹었어요`, null); $('toast-undo').hidden = true; return; }
  $('toast-undo').hidden = false;
  setLog(toggleTaken(getLog(), slot.key, new Date()));
  toast(`${name} ${slot.time} ${slot.medName} 먹음`, () => setLog(toggleTaken(getLog(), slot.key, new Date())));
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
// 타이머 알약을 누르면 커피 앱을 겹쳐 열기
document.addEventListener('click', e => {
  const pill = e.target.closest('.live-pill');
  if (!pill) return;
  e.preventDefault();
  wake();
  if (appOpen) closeApp(() => openApp('coffee/?run', pill)); else openApp('coffee/?run', pill);
}, true);

// ---------- 시계 화면 정보 (멀리서 보는 다음 약) ----------
function drawGlance() {
  const g = $('glance');
  const f = settings.face.id;
  if (!summary || f === 'mod' || f === 'cal') { g.innerHTML = ''; return; }
  const late = summary.people.find(p => p.late);
  if (late) { g.innerHTML = `<span class="gl late"><i></i>${esc(late.name)} ${esc(late.lateTime)} ${esc(late.lateMed)} 아직 안 먹음</span>`; return; }
  const n = summary.next;
  g.innerHTML = n ? `<span class="gl"><i></i>다음 약 ${esc(n.time)} ${esc(n.medName)} <small>${esc(n.personName)}</small></span>` : '';
}

// ---------- 편집 모드 ----------
function enterEdit() { body.classList.add('edit'); clearTimeout(idleTimer); }
function exitEdit() { body.classList.remove('edit'); save('home.layout', layout); armIdle(); }
$('done-btn').addEventListener('click', exitEdit);
$('add-btn').addEventListener('click', openAdd);

const ADD_INFO = id => {
  if (APP_INFO[id]) return { title: APP_INFO[id].name, sub: '앱', svg: APP_INFO[id].svg };
  if (id.startsWith('w:person:')) { const p = summary.people.find(x => `w:person:${x.id}` === id); return { title: `${p?.name || ''} 약`, sub: '위젯', icon: 'pill', grad: '#ff9500' }; }
  if (id === 'w:coffee') return { title: '커피', sub: '위젯', icon: 'cup', grad: '#a2845e' };
  return { title: '다음 약', sub: '긴 위젯', icon: 'bell', grad: '#ff9500' };
};
function openAdd() {
  const list = addable(layout, getConfig().people);
  $('add-list').innerHTML = list.length
    ? list.map(id => { const a = ADD_INFO(id); return `<button class="addcard" type="button" data-addid="${esc(id)}">${a.svg ? `<span class="ico glass">${APP_ICONS[a.svg]}</span>` : `<span class="ico" style="background:${a.grad}">${icons[a.icon]}</span>`}<span>${esc(a.title)}<small>${a.sub}</small></span></button>`; }).join('')
    : '<p class="empty">모두 홈 화면에 있어요</p>';
  $('add-sheet').classList.add('open');
}
$('add-list').addEventListener('click', e => {
  const b = e.target.closest('[data-addid]');
  if (!b) return;
  layout = addItem(layout, b.dataset.addid);
  drawGrid();
  $('add-sheet').classList.remove('open');
});
$('add-close').addEventListener('click', () => $('add-sheet').classList.remove('open'));

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
}
$('pstrip').addEventListener('click', e => {
  const c = e.target.closest('[data-face]');
  if (!c || c.dataset.face === pick.id) return;
  pick = { ...pick, id: c.dataset.face, color: 0 };
  drawPicker();
});
$('swatches').addEventListener('click', e => { const b = e.target.closest('[data-sw]'); if (b) { pick.color = Number(b.dataset.sw); drawPicker(); } });
$('tg-date').addEventListener('click', () => { pick.showDate = pick.showDate === false; drawPicker(); });
$('tg-wx').addEventListener('click', () => { pick.showWeather = pick.showWeather === false; drawPicker(); });
$('pick-done').addEventListener('click', () => {
  settings = setSettings({ face: pick });
  $('picker').classList.remove('open');
  drawFace(true);
});

// ---------- 시작 ----------
async function loadWeather() { weather = await getWeather(); drawHero(); drawFace(); }

async function init() {
  if (load('hint.seen', false)) document.querySelector('.idle-hint')?.remove();
  refreshData();
  await applyBg();
  drawHero();
  drawFace(true);
  drawGrid();
  loadWeather();
  if (new URLSearchParams(location.search).has('pick')) { history.replaceState(null, '', location.pathname); openPicker(); }
  setInterval(() => { drawHero(); drawFace(); }, 1000);
  setInterval(() => { if (!body.classList.contains('edit')) { refreshData(); drawGrid(); } }, 30000);
  setInterval(loadWeather, 10 * 60000);
  const onData = () => { refreshData(); if (!body.classList.contains('edit')) drawGrid(); drawFace(true); drawGlance(); };
  window.addEventListener('kp-meds-changed', onData);
  window.addEventListener('storage', e => { if (e.key?.startsWith('kp.meds') || e.key?.startsWith('kp.coffee')) onData(); if (e.key === 'kp.settings') { settings = getSettings(); drawFace(true); drawGlance(); } });
  setInterval(drawGlance, 30000);
  drawGlance();
  // 알람이 울리면 깨우기
  // (body 클래스를 바꾸면 다시 불리므로, 잠든 상태일 때만 깨움)
  setInterval(() => { if (body.classList.contains('idle') && document.querySelector('.alarm.open')) wake(); }, 500);
}
init();
