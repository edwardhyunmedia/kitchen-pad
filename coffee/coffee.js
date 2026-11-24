import { icons } from '../shared/icons.js';
import { fitTiles } from '../shared/fit.js';
import { load, save } from '../shared/store.js';
import { beep } from '../shared/alarm.js';
import { tellParent } from '../shared/inframe.js';
import { ART, ABOUT, aboutOf } from './about.js';
import { DEFAULT_RECIPES, timerState, totalSec, startRun, pauseRun, runElapsed, mergeSeeds } from './logic.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const getRecipes = () => load('coffee.recipes', DEFAULT_RECIPES);
// 새로 받은 레시피를 기존 목록에 한 번만 추가
{
  const m = mergeSeeds(getRecipes(), load('coffee.seeded', []));
  if (m.changed) { save('coffee.recipes', m.recipes); save('coffee.seeded', m.seeded); }
}
const info = r => [
  `원두 ${r.dose}g`, `물 ${r.water}g`, r.temp ? `${r.temp}°C` : '', r.grind ? `분쇄 ${r.grind}` : '', r.ice ? `얼음 ${r.ice}g` : '', r.ratio ? `비율 ${r.ratio}` : '',
].filter(Boolean).join(', ');
const mmss = s => `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;

$('back').innerHTML = icons.home;
$('open-edit').innerHTML = icons.gear;
$('t-close').innerHTML = icons.close;
$('t-reset').innerHTML = icons.reset;

// ---------- 목록 ----------
function renderList() {
  const list = getRecipes();
  const last = load('coffee.last', null);
  // 카드가 커져서 내리기 전에 필요한 걸 다 보여줌: 원두 g · 물 ml (크게), 온도·분쇄·얼음, 걸리는 시간·단계 수
  $('recipes').innerHTML = list.map((r, i) => {
    const extra = [r.temp ? `${esc(r.temp)}°` : '', r.grind ? `분쇄 ${esc(r.grind)}` : '', r.ice ? `얼음 ${esc(r.ice)}g` : ''].filter(Boolean).map(x => `<span class="nw">${x}</span>`).join(' · ');
    return `
    <button class="tile ctile" type="button" data-i="${i}">
      <span class="t-top"><span class="glyph t-info" role="button" tabindex="0" data-info="${i}" aria-label="${esc(r.name)} 설명 보기" style="background:var(--brown);color:#fff">${icons.cup}<b class="t-i">i</b></span>${r.id === last ? '<span class="t-tag">최근</span>' : ''}</span>
      <span class="t-body">
        <div class="name">${esc(r.name)}</div>
        <div class="t-big t-pair">${r.dose ? `<span>${esc(r.dose)}<i>g</i></span>` : ''}${r.water ? `<span>${esc(r.water)}<i>ml</i></span>` : ''}</div>
        ${extra ? `<div class="state">${extra}</div>` : ''}
        <div class="state">${mmss(totalSec(r))} · ${r.steps.length}단계</div>
      </span>
    </button>`;
  }).join('') || '<p class="empty">레시피가 없어요. 아래 설정 버튼에서 추가하세요.</p>';
}
$('recipes').addEventListener('click', e => {
  const info = e.target.closest('[data-info]');
  if (info) return openInfo(getRecipes()[info.dataset.info]);
  const t = e.target.closest('[data-i]');
  if (t) openTimer(getRecipes()[t.dataset.i]);
});

// ---------- 설명 (아이콘을 누르면) ----------
const clock = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
function openInfo(r) {
  if (!r) return;
  const a = aboutOf(r);
  const facts = [['원두', r.dose ? `${r.dose}g` : ''], ['물', r.water ? `${r.water}g` : ''], ['얼음', r.ice ? `${r.ice}g` : ''], ['비율', r.ratio || ''],
    ['물 온도', r.temp ? `${r.temp}°C` : ''], ['분쇄', r.grind || ''], ['시간', mmss(totalSec(r))]].filter(f => f[1]);
  let t = 0;
  const steps = r.steps.map(st => { const at = t; t += st.sec; return `<li><span class="i-at">${clock(at)}</span><span class="i-lb">${esc(st.label)}</span><span class="i-to">${st.pourTo ? `${st.pourTo}g까지` : ''}</span></li>`; }).join('');
  const art = ART[a.art] || ART.v60;
  const hb = (art.match(/fill="(#[0-9a-f]{6})"/i) || [])[1] || '#efe4d6';
  $('info-body').innerHTML = `
    <div class="i-hero" style="--hb:${hb}"><div class="i-glow"></div>${art}<span class="i-kind">${esc(a.kind)}</span></div>
    <div class="i-pad">
    <h2 class="i-name">${esc(r.name)}</h2>
    <div class="i-origin">${esc(a.origin)}</div>
    <div class="i-facts">${facts.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
    <div class="i-text">${a.text.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <h3 class="i-h">순서</h3>
    <ol class="i-steps">${steps}<li class="i-end"><span class="i-at">${clock(t)}</span><span class="i-lb">끝</span><span class="i-to"></span></li></ol>
    ${r.note && !ABOUT[r.id] ? `<p class="i-note">${esc(r.note)}</p>` : ''}
    <button class="btn i-start" type="button" id="info-start">이 레시피로 시작</button>
    </div>`;
  $('info-start').onclick = () => { closeInfo(); openTimer(r); };
  $('info-sheet').classList.add('open');
  $('info-body').scrollTop = 0;
  $('info-body').onscroll = () => $('info-close').classList.toggle('solid', $('info-body').scrollTop > 120);
}
function closeInfo() { $('info-sheet').classList.remove('open'); }
$('info-close').innerHTML = icons.close;
$('info-close').addEventListener('click', closeInfo);
$('info-sheet').addEventListener('click', e => { if (e.target === e.currentTarget) closeInfo(); });
$('recipes').addEventListener('keydown', e => { const info = e.target.closest('[data-info]'); if (info && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openInfo(getRecipes()[info.dataset.info]); } });

// ---------- 타이머 (실행 상태를 저장해서 다른 화면으로 가도 계속 돎) ----------
$('t-icon').innerHTML = icons.cup;
let recipe = null;
let lastStep = 0;
let raf = null;
const getRun = () => load('coffee.run', null);
const myRun = () => { const r = getRun(); return r && recipe && r.recipeId === recipe.id ? r : null; };
const running = () => { const r = myRun(); return !!(r && r.since != null); };

function openTimer(r) {
  if (!r || !r.steps.length) return;
  recipe = r;
  lastStep = timerState(recipe, runElapsed(myRun(), Date.now())).stepIndex;
  $('t-title').textContent = r.name;
  $('t-sub').textContent = info(r);
  $('timer-sheet').classList.add('open');
  window.kpCoffeeOpen = true;
  tellParent({ type: 'coffee-open', open: true });
  draw();
}
// 닫으면 타이머도 멈춤 (뒤에서 몰래 돌거나 알림이 뜨지 않게)
function closeTimer() {
  if (myRun()) save('coffee.run', null);
  cancelAnimationFrame(raf);
  $('timer-sheet').classList.remove('open');
  window.kpCoffeeOpen = false;
  tellParent({ type: 'coffee-open', open: false });
}
function draw() {
  cancelAnimationFrame(raf);
  const now = Date.now();
  const el = runElapsed(myRun(), now);
  const st = timerState(recipe, el);
  const step = recipe.steps[st.stepIndex];
  const next = recipe.steps[st.stepIndex + 1];
  if (running() && st.stepIndex !== lastStep && !st.done) beep(2);
  if (st.done && running()) { beep(3); save('coffee.run', pauseRun(myRun(), now)); }
  lastStep = st.stepIndex;

  $('t-sec').textContent = st.done ? 0 : st.stepRemaining;
  const stepStart = recipe.steps.slice(0, st.stepIndex).reduce((a, x) => a + x.sec, 0);
  $('t-fill').style.height = st.done ? '100%' : `${Math.min(100, ((el - stepStart) / step.sec) * 100)}%`;
  $('t-cap').classList.toggle('done', st.done);
  $('t-step').textContent = st.done ? '추출 완료' : step.label;
  $('t-pour').textContent = !st.done && step.pourTo ? `${step.pourTo}g까지 붓기` : '';
  $('t-next').textContent = st.done ? (recipe.note || '') : el === 0 && recipe.note ? recipe.note : next ? `다음: ${next.label}` : `남은 시간 ${mmss(st.totalRemaining)}`;
  $('t-dots').innerHTML = recipe.steps.map((_, i) => `<span class="${st.done || i < st.stepIndex ? 'done' : i === st.stepIndex ? 'now' : ''}"></span>`).join('');
  $('t-play').innerHTML = running() ? icons.pause : icons.play;
  $('t-play').setAttribute('aria-label', running() ? '일시정지' : '시작');
  if (running()) raf = requestAnimationFrame(draw);
}
$('t-play').addEventListener('click', () => {
  const now = Date.now();
  if (running()) save('coffee.run', pauseRun(myRun(), now));
  else {
    let r = myRun();
    if (r && timerState(recipe, runElapsed(r, now)).done) r = null;
    save('coffee.run', startRun(r || null, recipe.id, now));
    save('coffee.last', recipe.id); // 홈 위젯이 마지막으로 내린 레시피를 먼저 보여줌
    lastStep = timerState(recipe, runElapsed(getRun(), now)).stepIndex;
  }
  draw();
});
// 처음부터: 타이머를 멈추고 지움
$('t-reset').addEventListener('click', () => { if (myRun()) save('coffee.run', null); lastStep = 0; draw(); });
$('t-close').addEventListener('click', closeTimer);

// 홈 위젯이나 알약에서 들어오면 돌고 있는 타이머를 바로 열기
if (new URLSearchParams(location.search).has('run')) {
  const r = getRun();
  const rec = r && getRecipes().find(x => x.id === r.recipeId);
  history.replaceState(null, '', location.pathname);
  if (rec) openTimer(rec);
}

// ---------- 편집 ----------
let draft = null;
let armed = null;
function openEdit() { draft = getRecipes(); armed = null; renderEdit(); $('edit-sheet').classList.add('open'); }
function closeEdit() {
  draft = draft
    .map(r => ({
      ...r,
      name: String(r.name).trim() || '이름 없는 레시피',
      dose: Math.max(0, Number(r.dose) || 0),
      water: Math.max(0, Number(r.water) || 0),
      temp: Number(r.temp) > 0 ? Number(r.temp) : undefined,
      ice: Number(r.ice) > 0 ? Number(r.ice) : undefined,
      grind: String(r.grind ?? '').trim() || undefined,
      ratio: String(r.ratio ?? '').trim() || undefined,
      note: String(r.note ?? '').trim() || undefined,
      steps: r.steps
        .map(s => ({ label: String(s.label).trim() || '단계', sec: Math.max(1, Math.round(Number(s.sec) || 0)), ...(Number(s.pourTo) > 0 ? { pourTo: Number(s.pourTo) } : {}) })),
    }))
    .filter(r => r.steps.length);
  save('coffee.recipes', draft);
  $('edit-sheet').classList.remove('open');
  renderList();
}
function renderEdit() {
  $('edit-body').innerHTML = draft.map((r, ri) => `
    <p class="group-label">${esc(String(r.name).trim() || '새 레시피')}</p>
    <div class="group">
      <div class="row"><span class="label">이름</span><input class="grow" type="text" value="${esc(r.name)}" placeholder="레시피 이름" data-f="${ri}.name" maxlength="20"></div>
      <div class="row"><span class="label grow">원두</span><input type="number" value="${esc(r.dose)}" data-f="${ri}.dose" style="width:70px"><span class="unit">g</span></div>
      <div class="row"><span class="label grow">물</span><input type="number" value="${esc(r.water)}" data-f="${ri}.water" style="width:70px"><span class="unit">g</span></div>
      <div class="row"><span class="label grow">물 온도</span><input type="number" value="${esc(r.temp ?? '')}" placeholder="-" data-f="${ri}.temp" style="width:70px"><span class="unit">°C</span></div>
      <div class="row"><span class="label grow">얼음</span><input type="number" value="${esc(r.ice ?? '')}" placeholder="-" data-f="${ri}.ice" style="width:70px"><span class="unit">g</span></div>
      <div class="row"><span class="label">분쇄</span><input class="grow" type="text" value="${esc(r.grind ?? '')}" placeholder="예: 11~11.3" data-f="${ri}.grind" maxlength="20"></div>
      <div class="row"><span class="label">비율</span><input class="grow" type="text" value="${esc(r.ratio ?? '')}" placeholder="예: 1:10" data-f="${ri}.ratio" maxlength="10"></div>
      <div class="row"><span class="label">메모</span><input class="grow" type="text" value="${esc(r.note ?? '')}" placeholder="예: 얼음 컵 위에 서빙" data-f="${ri}.note" maxlength="60"></div>
    </div>
    <p class="group-label">단계</p>
    <div class="group">
      ${r.steps.map((s, si) => `
        <div class="row">
          <input class="grow left" type="text" value="${esc(s.label)}" placeholder="단계 이름" data-s="${ri}.${si}.label" maxlength="16">
          <input type="number" value="${esc(s.sec)}" data-s="${ri}.${si}.sec" style="width:48px" aria-label="초"><span class="unit">초</span>
          <input type="number" value="${esc(s.pourTo ?? '')}" data-s="${ri}.${si}.pourTo" style="width:52px" placeholder="-" aria-label="붓는 양"><span class="unit">g</span>
          <button class="icon-btn" type="button" style="width:32px;background:var(--fill)" aria-label="단계 삭제" data-delstep="${ri}.${si}">${icons.close}</button>
        </div>`).join('')}
      <div class="row"><button class="row-btn" type="button" data-addstep="${ri}">+ 단계 추가</button></div>
    </div>
    <div class="group" style="margin-top:10px"><div class="row"><button class="row-btn danger center" type="button" data-delrecipe="${ri}">${armed === ri ? '한 번 더 누르면 삭제' : `${esc(String(r.name).trim() || '이 레시피')} 삭제`}</button></div></div>`).join('') +
    `<div class="group" style="margin-top:22px"><div class="row"><button class="row-btn" type="button" data-addrecipe>+ 레시피 추가</button></div></div>`;
}
$('edit-body').addEventListener('input', e => {
  const d = e.target.dataset;
  if (d.f) { const [ri, k] = d.f.split('.'); draft[ri][k] = e.target.value; }
  else if (d.s) { const [ri, si, k] = d.s.split('.'); draft[ri].steps[si][k] = e.target.value; }
});
$('edit-body').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (!d.delrecipe) armed = null;
  if (d.addstep) draft[d.addstep].steps.push({ label: '붓기', sec: 30, pourTo: '' });
  else if (d.delstep) { const [ri, si] = d.delstep.split('.'); draft[ri].steps.splice(si, 1); }
  else if (d.delrecipe) {
    const ri = Number(d.delrecipe);
    if (armed !== ri) { armed = ri; renderEdit(); return; }
    draft.splice(ri, 1);
  }
  else if ('addrecipe' in d) draft.push({ id: newId(), name: '', dose: 15, water: 250, steps: [{ label: '뜸 들이기', sec: 40, pourTo: 40 }] });
  else return;
  renderEdit();
});
$('open-edit').addEventListener('click', openEdit);
$('edit-done').addEventListener('click', closeEdit);

renderList();
fitTiles();
