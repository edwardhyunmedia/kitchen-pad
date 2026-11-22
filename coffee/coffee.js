import { icons } from '../shared/icons.js';
import { load, save } from '../shared/store.js';
import { beep } from '../shared/alarm.js';
import { DEFAULT_RECIPES, timerState, totalSec, Timer } from './logic.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const getRecipes = () => load('coffee.recipes', DEFAULT_RECIPES);
const mmss = s => `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;

$('back').innerHTML = icons.back;
$('open-edit').innerHTML = icons.gear;
$('t-close').innerHTML = icons.close;
$('t-reset').innerHTML = icons.reset;

// ---------- 목록 ----------
function renderList() {
  const list = getRecipes();
  $('recipes').innerHTML = list.map((r, i) => `
    <button class="tile on" type="button" data-i="${i}">
      <span class="glyph" style="background:var(--brown)">${icons.cup}</span>
      <span><div class="name">${esc(r.name)}</div><div class="state">${mmss(totalSec(r))}</div></span>
    </button>`).join('') || '<p class="empty">레시피가 없어요. 오른쪽 위 설정에서 추가하세요.</p>';
}
$('recipes').addEventListener('click', e => {
  const t = e.target.closest('[data-i]');
  if (t) openTimer(getRecipes()[t.dataset.i]);
});

// ---------- 타이머 ----------
$('t-icon').innerHTML = icons.cup;
let recipe = null;
const timer = new Timer();
let lastStep = 0;
let raf = null;

function openTimer(r) {
  if (!r || !r.steps.length) return;
  recipe = r;
  timer.reset();
  lastStep = 0;
  $('t-title').textContent = r.name;
  $('t-sub').textContent = `원두 ${r.dose}g, 물 ${r.water}g`;
  $('timer-sheet').classList.add('open');
  draw();
}
function closeTimer() {
  timer.reset();
  cancelAnimationFrame(raf);
  $('timer-sheet').classList.remove('open');
}
function draw() {
  const st = timerState(recipe, timer.elapsed(performance.now()) / 1000);
  const step = recipe.steps[st.stepIndex];
  const next = recipe.steps[st.stepIndex + 1];
  if (st.stepIndex !== lastStep && !st.done) beep(2);
  if (st.done && timer.running) { beep(3); timer.pause(performance.now()); }
  lastStep = st.stepIndex;

  $('t-sec').textContent = st.done ? 0 : st.stepRemaining;
  const el = timer.elapsed(performance.now()) / 1000;
  const stepStart = recipe.steps.slice(0, st.stepIndex).reduce((a, x) => a + x.sec, 0);
  $('t-fill').style.height = st.done ? '100%' : `${Math.min(100, ((el - stepStart) / step.sec) * 100)}%`;
  $('t-cap').classList.toggle('done', st.done);
  $('t-step').textContent = st.done ? '추출 완료' : step.label;
  $('t-pour').textContent = !st.done && step.pourTo ? `${step.pourTo}g까지 붓기` : '';
  $('t-next').textContent = st.done ? '' : next ? `다음: ${next.label}` : `남은 시간 ${mmss(st.totalRemaining)}`;
  $('t-dots').innerHTML = recipe.steps.map((_, i) => `<span class="${st.done || i < st.stepIndex ? 'done' : i === st.stepIndex ? 'now' : ''}"></span>`).join('');
  $('t-play').innerHTML = timer.running ? icons.pause : icons.play;
  $('t-play').setAttribute('aria-label', timer.running ? '일시정지' : '시작');
  if (timer.running) raf = requestAnimationFrame(draw);
}
$('t-play').addEventListener('click', () => {
  const now = performance.now();
  if (timer.running) timer.pause(now);
  else {
    if (timerState(recipe, timer.elapsed(now) / 1000).done) { timer.reset(); lastStep = 0; }
    timer.start(now);
  }
  cancelAnimationFrame(raf);
  draw();
});
$('t-reset').addEventListener('click', () => { timer.reset(); lastStep = 0; cancelAnimationFrame(raf); draw(); });
$('t-close').addEventListener('click', closeTimer);

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
