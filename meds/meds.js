import { icons } from '../shared/icons.js';
import { todaySlots, toggleTaken, dateKey } from './logic.js';
import { getConfig, setConfig, getLog, setLog } from './state.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = iso => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const newId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

$('back').innerHTML = icons.home;
$('open-settings').innerHTML = icons.gear;

// ---------- 오늘 화면 ----------
function render() {
  const cfg = getConfig();
  const log = getLog();
  const now = new Date();
  const slots = todaySlots(cfg, now);
  const taken = slots.filter(s => log[s.key]).length;
  if (!cfg.people.length) {
    $('summary').textContent = '등록된 사람이 없어요. 아래 설정 버튼에서 사람을 추가하세요.';
    $('people').innerHTML = '';
    return;
  }
  $('summary').textContent = slots.length
    ? `오늘 ${slots.length}번 중 ${taken}번 먹었어요`
    : '아직 등록된 약이 없어요. 아래 설정 버튼에서 추가하세요.';

  $('people').innerHTML = cfg.people.map(p => {
    const mine = slots.filter(s => s.personId === p.id);
    const tiles = mine.map(s => {
      const done = log[s.key];
      const late = !done && now >= s.at;
      const state = done ? `${hm(done)}에 먹음` : late ? `${s.time} 안 먹음` : `${s.time} 예정`;
      return `<button class="tile ${done ? 'on' : ''}" type="button" data-key="${esc(s.key)}" aria-pressed="${!!done}">
        <span class="glyph" style="${done ? 'background:var(--green)' : late ? 'background:var(--red);color:#fff' : ''}">${done ? icons.check : icons.pill}</span>
        <span><div class="name">${esc(s.medName)}</div><div class="state ${late ? 'alert' : ''}">${esc(state)}</div></span>
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
let armed = null; // 삭제 확인 대기 중인 항목

function openSettings() {
  draft = getConfig();
  armed = null;
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
  const del = (id, label) => (armed === id ? '한 번 더 누르면 삭제' : label);
  const people = draft.people.map((p, pi) => `
    <p class="group-label">${esc(p.name.trim() || '새 사람')}</p>
    <div class="group">
      <div class="row"><span class="label">이름</span><input class="grow" type="text" value="${esc(p.name)}" placeholder="이름 입력" data-pname="${pi}" maxlength="12"></div>
      ${p.meds.map((m, mi) => `
        <div class="row"><span class="label">약 이름</span><input class="grow" type="text" placeholder="예: 비타민" value="${esc(m.name)}" data-mname="${pi}.${mi}" maxlength="20"></div>
        <div class="row">
          <span class="label">시간</span>
          <div class="chips" style="justify-content:flex-end">
            ${m.times.map((t, ti) => `<span class="chip"><input type="time" value="${esc(t)}" data-time="${pi}.${mi}.${ti}"><button class="x" type="button" aria-label="시간 지우기" data-deltime="${pi}.${mi}.${ti}">${icons.close}</button></span>`).join('')}
            <button class="add-chip" type="button" data-addtime="${pi}.${mi}">+ 시간</button>
          </div>
        </div>
        <div class="row"><button class="row-btn danger" type="button" data-delmed="${pi}.${mi}">${del('m' + pi + '.' + mi, `${esc(m.name.trim() || '이 약')} 삭제`)}</button></div>`).join('')}
      <div class="row"><button class="row-btn" type="button" data-addmed="${pi}">+ 약 추가</button></div>
    </div>
    <div class="group" style="margin-top:10px"><div class="row"><button class="row-btn danger center" type="button" data-delperson="${pi}">${del('p' + pi, `${esc(p.name.trim() || '이 사람')} 삭제`)}</button></div></div>`).join('');
  $('settings-body').innerHTML = people + `
    <div class="group" style="margin-top:22px"><div class="row"><button class="row-btn" type="button" data-addperson>+ 사람 추가</button></div></div>
    <p class="group-label">알림</p>
    <div class="group">
      <div class="row"><span class="label grow">안 먹으면 다시 알림</span><input type="number" min="5" max="240" value="${esc(draft.remindAfterMin)}" data-remind style="width:70px"><span class="unit">분 뒤</span></div>
      <div class="row"><span class="label grow">다시 알림 횟수</span><input type="number" min="0" max="10" value="${esc(draft.maxRemind)}" data-maxremind style="width:70px"><span class="unit">번</span></div>
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
  const arm = id => { if (armed === id) { armed = null; return true; } armed = id; renderSettings(); return false; };
  if (!d.delmed && !d.delperson) armed = null;
  if (d.addmed) draft.people[d.addmed].meds.push({ id: newId(), name: '', times: ['08:00'] });
  else if ('addperson' in d) draft.people.push({ id: 'p' + newId(), name: '', meds: [] });
  else if (d.delperson) { if (!arm('p' + d.delperson)) return; draft.people.splice(d.delperson, 1); }
  else if (d.delmed) { if (!arm('m' + d.delmed)) return; const [pi, mi] = d.delmed.split('.'); draft.people[pi].meds.splice(mi, 1); }
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
