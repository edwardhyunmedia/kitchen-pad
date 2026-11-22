import { icons } from '../shared/icons.js';
import { todaySlots, toggleTaken, dateKey } from './logic.js';
import { getConfig, setConfig, getLog, setLog } from './state.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = iso => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const newId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

$('back').innerHTML = icons.back;
$('open-settings').innerHTML = icons.gear;

// ---------- 오늘 화면 ----------
function render() {
  const cfg = getConfig();
  const log = getLog();
  const now = new Date();
  const slots = todaySlots(cfg, now);
  const taken = slots.filter(s => log[s.key]).length;
  $('summary').textContent = slots.length
    ? `오늘 ${slots.length}번 중 ${taken}번 먹었어요`
    : '아직 등록된 약이 없어요. 오른쪽 위 설정에서 추가하세요.';

  $('people').innerHTML = cfg.people.map(p => {
    const mine = slots.filter(s => s.personId === p.id);
    const tiles = mine.map(s => {
      const done = log[s.key];
      const late = !done && now >= s.at;
      const state = done ? `${s.time} 먹음 · ${hm(done)}` : late ? `${s.time} 아직 안 먹음` : `${s.time} 예정`;
      return `<button class="tile ${done ? 'on' : ''} ${late ? 'late' : ''}" type="button" data-key="${esc(s.key)}" aria-pressed="${!!done}">
        <span class="glyph" style="${done ? 'background:var(--green)' : ''}">${done ? icons.check : icons.pill}</span>
        <span><div class="name">${esc(s.medName)}</div><div class="state" style="${late ? 'color:var(--red)' : ''}">${esc(state)}</div></span>
      </button>`;
    }).join('');
    const add = `<button class="tile" type="button" data-add="${esc(p.id)}">
        <span class="glyph">${icons.plus}</span>
        <span><div class="name">약 추가</div></span>
      </button>`;
    return `<h2 class="section">${esc(p.name)}</h2><div class="grid">${tiles}${mine.length ? '' : add}</div>`;
  }).join('');
}

$('people').addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.add) return openSettings();
  if (t.dataset.key) {
    setLog(toggleTaken(getLog(), t.dataset.key, new Date()));
    render();
  }
});

// ---------- 설정 ----------
let draft = null;

function openSettings() {
  draft = getConfig();
  renderSettings();
  $('settings').classList.add('open');
}
function closeSettings() {
  // 이름 없는 약, 빈 시간은 정리해서 저장
  for (const p of draft.people) {
    p.name = p.name.trim() || '이름 없음';
    p.meds = p.meds.filter(m => m.name.trim()).map(m => ({ ...m, name: m.name.trim(), times: [...new Set(m.times.filter(Boolean))].sort() }));
  }
  draft.remindAfterMin = Math.min(240, Math.max(5, Number(draft.remindAfterMin) || 30));
  draft.maxRemind = Math.min(10, Math.max(0, Math.round(Number(draft.maxRemind) || 0)));
  setConfig(draft);
  $('settings').classList.remove('open');
  render();
}

function renderSettings() {
  const people = draft.people.map((p, pi) => `
    <p class="group-label">사람 ${pi + 1}</p>
    <div class="group">
      <div class="row"><span>이름</span><input class="grow" type="text" value="${esc(p.name)}" data-pname="${pi}" maxlength="12"></div>
      ${p.meds.map((m, mi) => `
        <div class="row" style="flex-wrap:wrap">
          <input type="text" placeholder="약 이름" value="${esc(m.name)}" data-mname="${pi}.${mi}" style="flex:1 1 200px" maxlength="20">
          ${m.times.map((t, ti) => `<span style="display:inline-flex;gap:4px;align-items:center">
              <input type="time" value="${esc(t)}" data-time="${pi}.${mi}.${ti}">
              <button class="icon-btn" type="button" style="width:40px" aria-label="시간 지우기" data-deltime="${pi}.${mi}.${ti}">${icons.close}</button>
            </span>`).join('')}
          <button class="link-btn" type="button" data-addtime="${pi}.${mi}">시간 추가</button>
          <button class="link-btn" type="button" style="color:var(--red)" data-delmed="${pi}.${mi}">약 삭제</button>
        </div>`).join('')}
      <div class="row"><button class="link-btn" type="button" data-addmed="${pi}">약 추가</button></div>
    </div>`).join('');
  $('settings-body').innerHTML = people + `
    <p class="group-label">알림</p>
    <div class="group">
      <div class="row"><span class="grow">안 먹었을 때 다시 알림 간격(분)</span><input type="number" min="5" max="240" value="${esc(draft.remindAfterMin)}" data-remind style="width:110px"></div>
      <div class="row"><span class="grow">다시 알림 횟수</span><input type="number" min="0" max="10" value="${esc(draft.maxRemind)}" data-maxremind style="width:110px"></div>
    </div>`;
}

$('settings-body').addEventListener('input', e => {
  const d = e.target.dataset;
  if (d.pname != null) draft.people[d.pname].name = e.target.value;
  else if (d.mname) { const [pi, mi] = d.mname.split('.'); draft.people[pi].meds[mi].name = e.target.value; }
  else if (d.time) { const [pi, mi, ti] = d.time.split('.'); draft.people[pi].meds[mi].times[ti] = e.target.value; }
  else if ('remind' in d) draft.remindAfterMin = e.target.value;
  else if ('maxremind' in d) draft.maxRemind = e.target.value;
});
$('settings-body').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.addmed) draft.people[d.addmed].meds.push({ id: newId(), name: '', times: ['08:00'] });
  else if (d.delmed) { const [pi, mi] = d.delmed.split('.'); draft.people[pi].meds.splice(mi, 1); }
  else if (d.addtime) { const [pi, mi] = d.addtime.split('.'); draft.people[pi].meds[mi].times.push('20:00'); }
  else if (d.deltime) { const [pi, mi, ti] = d.deltime.split('.'); draft.people[pi].meds[mi].times.splice(ti, 1); }
  else return;
  renderSettings();
});
$('open-settings').addEventListener('click', openSettings);
$('close-settings').addEventListener('click', closeSettings);

window.addEventListener('kp-meds-changed', render);
render();
setInterval(render, 30000);
