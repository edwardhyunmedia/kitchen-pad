// 홈 화면 위젯 (애플 위젯 지침을 따라 다시 만든 것)
// - 크기: 작게 s(정사각), 중간 m(가로 2배), 크게 l(정사각 4칸). 쓸모 있는 크기만 제공
// - 여백 16pt, 묶음 안쪽은 11pt, 안쪽 모서리는 바깥 모서리와 같은 중심 (CSS가 --pt로 처리)
// - 글자는 11pt 이상, 한눈에 보이는 큰 정보 하나 + 가까이서 보는 세부 정보
// - 위젯 안 버튼(약 체크, 커피 시작)은 앱을 열지 않고 바로 동작, 나머지 영역은 해당 앱을 엶
// - 데이터를 아직 못 받았으면 모양만 잡힌 자리표시(회색 막대), 연결 안 됐으면 무엇을 하면 되는지 안내
// 화면(DOM)과 무관한 순수 함수라서 테스트에서도 불러 씀
import { codeInfo, WEATHER_ICONS, LOCATION } from './weather.js';
import { dayLabel, sameDay, upcoming, fmtTime } from './calendar.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// SF Symbols 느낌의 단색 기호 (글자색을 따라감)
const sym = (d, fill = false) => `<svg class="sym" viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${d}</svg>`;
export const SYM = {
  pill: sym('<path d="M4.6 13.6l9-9a4.2 4.2 0 0 1 6 6l-9 9a4.2 4.2 0 0 1-6-6z"/><path d="M9.1 9.1l6 6"/>'),
  cal: sym('<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  cup: sym('<path d="M4 9h12v4.5a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 4 13.5V9z"/><path d="M16 10.5h1.2a2.6 2.6 0 0 1 0 5.2H16"/>'),
  loc: sym('<path d="M20.5 3.5L3.5 10.6l7.2 2.7 2.7 7.2z"/>', true),
  play: sym('<path d="M8 5.2v13.6c0 .8.9 1.3 1.5.8l10-6.8a1 1 0 0 0 0-1.6l-10-6.8C8.9 3.9 8 4.4 8 5.2z"/>', true),
  open: sym('<path d="M9 5l7 7-7 7"/>'),
  check: sym('<path d="M6.5 12.5l3.6 3.6 7.4-8.2"/>'),
  cake: sym('<path d="M4 20.5h16M5.5 20.5v-6.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6.5M5.5 15.5c1.2 1 2.4 1 3.5 0s2.4-1 3.5 0 2.4 1 3.5 0 2.4-1 2.5 0"/><path d="M12 12V9M12 6.2c-.8-.9-.8-1.7 0-2.7.8 1 .8 1.8 0 2.7z"/>'),
};
export const ACCENT = { meds: '#ff9500', cal: '#ff3b30', coffee: '#a2845e', wx: '#0a84ff' };
const EVENT_COLOR = '#0a84ff';

// 위젯 고르기 화면에 쓰는 이름·설명 (설명은 동작 동사로 끝냄, '이 위젯' 같은 말은 빼기)
export const WIDGET_INFO = {
  'w:meds': { name: '약', desc: '오늘 남은 약을 보고 동그라미를 눌러 바로 먹음 체크하세요.', sym: 'pill', accent: ACCENT.meds },
  'w:cal': { name: '일정', desc: '다가오는 구글 캘린더 일정을 한눈에 확인하세요.', sym: 'cal', accent: ACCENT.cal },
  'w:wx': { name: '날씨', desc: '마포구의 지금 날씨와 최고·최저 기온을 보세요.', sym: 'loc', accent: ACCENT.wx },
  'w:coffee': { name: '커피', desc: '자주 내리는 레시피로 타이머를 바로 시작하세요.', sym: 'cup', accent: ACCENT.coffee },
};

// 값이 바뀌면 숫자가 굴러가듯 바뀌게 표시해 둘 자리 (data-k)
// 밤에는 해 대신 달
const wicon = (code, hour) => {
  const i = codeInfo(code).icon, night = hour < 6 || hour >= 18;
  return WEATHER_ICONS[night && i === 'sun' ? 'moon' : night && i === 'partly' ? 'pmoon' : i];
};
const v = (k, html, cls = '') => `<span class="${cls}" data-k="${k}">${html}</span>`;
const head = (kind, label, right = '') => `<div class="w-hd" style="color:${ACCENT[kind]}">${SYM[{ meds: 'pill', cal: 'cal', coffee: 'cup', wx: 'loc' }[kind]]}<span>${esc(label)}</span>${right ? `<b class="w-hr">${right}</b>` : ''}</div>`;
// 자리표시: 글자 대신 회색 막대
const ph = (...widths) => `<div class="w-ph">${widths.map(w => `<i style="width:${w}%"></i>`).join('')}</div>`;
const note = text => `<div class="w-note">${esc(text)}</div>`;

// ---------- 약 ----------
// 보여줄 순서: 시간 지났는데 안 먹은 것(빨강) → 다음 예정
export function medRows(summary, log, now) {
  const slots = summary?.slots || [];
  const left = slots.filter(s => !log?.[s.key]);
  const late = left.filter(s => now >= s.at);
  const next = left.filter(s => now < s.at);
  return { late, next, todo: [...late, ...next], done: slots.filter(s => log?.[s.key]), total: slots.length };
}
const circle = (s, late, done = false) =>
  `<button class="w-tg ${late ? 'late' : ''} ${done ? 'on' : ''}" type="button" data-slot="${esc(s.key)}" aria-label="${esc(s.personName)} ${esc(s.time)} ${esc(s.medName)} ${done ? '먹음 취소' : '먹음 체크'}">${done ? SYM.check : ''}</button>`;
const medRow = (s, now, done = false, who = true) => {
  const late = !done && now >= s.at;
  const sub = [who ? esc(s.personName) : '', late ? '아직 안 먹음' : done ? '먹음' : ''].filter(Boolean).join(' · ');
  return `<div class="w-row ${late ? 'late' : ''} ${done ? 'done' : ''}">${circle(s, late, done)}<div class="w-rt"><b>${esc(s.time)} ${esc(s.medName)}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
};

function meds(size, d) {
  const { summary, log } = d.meds || {};
  const now = d.now;
  const r = medRows(summary, log, now);
  if (!r.total) {
    return `${head('meds', '약')}<div class="w-fill"></div>${note(summary?.people?.length ? '오늘 먹을 약이 없어요' : '약 앱에서 약과 시간을 넣으세요')}`;
  }
  const count = v('mc', String(r.todo.length), 'w-count');
  if (size === 's') {
    const s = r.todo[0];
    if (!s) return `${head('meds', '약')}<div class="w-fill"></div><div class="w-doneall">${SYM.check}</div>${note('오늘 약을 다 먹었어요')}`;
    const late = now >= s.at;
    return `${head('meds', '약', count)}<div class="w-fill"></div>
      <div class="w-cap ${late ? 'late' : ''}">${late ? '안 먹은 약' : '다음 약'}</div>
      <div class="w-one">${v('mt', esc(s.time), 'w-t28' + (late ? ' late' : ''))}${circle(s, late)}</div>
      <div class="w-l15">${v('mn', `${esc(s.medName)} · ${esc(s.personName)}`)}</div>`;
  }
  if (size === 'm') {
    const rows = r.todo.slice(0, 3).map(s => medRow(s, now)).join('');
    return `<div class="w-split"><div class="w-side">${head('meds', '약')}<div class="w-fill"></div>${count}<div class="w-cap">${r.todo.length ? '남은 약' : '다 먹었어요'}</div></div>
      <div class="w-list">${rows || note('오늘 약을 다 먹었어요')}${r.todo.length > 3 ? `<div class="w-more">외 ${r.todo.length - 3}개</div>` : ''}</div></div>`;
  }
  // 크게: 사람별로 오늘 약 전부 (먹은 건 채워진 체크로 남겨서 얼마나 먹었는지 보이게)
  const people = summary.people.filter(p => p.total);
  let budget = 8;
  const sections = people.map(p => {
    if (budget <= 0) return '';
    const mine = summary.slots.filter(s => s.personId === p.id);
    const shown = mine.slice(0, Math.max(1, budget - 1));
    budget -= shown.length + 1;
    return `<div class="w-sec"><div class="w-sh">${esc(p.name)} <span>${mine.filter(s => log?.[s.key]).length}/${mine.length}</span></div>${shown.map(s => medRow(s, now, !!log?.[s.key], false)).join('')}</div>`;
  }).join('');
  return `${head('meds', '약', count)}<div class="w-lg">${sections}</div>`;
}

// ---------- 일정 ----------
const SPECIAL = /생일|생신|기념일|birthday|anniversary/i;
const evTime = (e, now, withDay) => `${withDay ? `${esc(dayLabel(e.start, now))} ` : ''}${e.allDay ? '종일' : fmtTime(e.start)}`;
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// 일정 줄을 누르면 달력 앱의 그날로
const evRow = (e, now, withDay = true) =>
  `<div class="w-ev" data-day="${ymd(e.start < now && e.allDay ? now : e.start)}" style="--ec:${EVENT_COLOR}"><b>${esc(e.title)}</b><small>${evTime(e, now, withDay)}</small></div>`;
function dateBlock(now, special) {
  return `<div class="w-day" style="color:${ACCENT.cal}">${DAYS[now.getDay()]}${special ? `<span class="w-cake">${SYM.cake}</span>` : ''}</div>${v('cd', String(now.getDate()), 'w-date')}`;
}
function cal(size, d) {
  const now = d.now;
  const c = d.cal || { state: 'off', events: [] };
  const list = upcoming(c.events || [], now).sort((a, b) => a.start - b.start);
  const special = list.some(e => SPECIAL.test(e.title) && (sameDay(e.start, now) || (e.allDay && e.start <= now)));
  const stale = c.at && now - c.at > 60 * 60000 ? `<div class="w-upd">${Math.floor((now - c.at) / 3600000)}시간 전 업데이트</div>` : '';
  const body = n => {
    if (c.state === 'off') return note('설정에서 구글 캘린더를 연결하면 일정이 보여요');
    if (c.state === 'loading') return ph(80, 50, 70, 40).repeat(n > 2 ? 2 : 1);
    if (!list.length) return note('7일 안에 일정이 없어요');
    return list.slice(0, n).map(e => evRow(e, now)).join('') + (list.length > n && n > 2 ? `<div class="w-more">외 ${list.length - n}개</div>` : '');
  };
  const cls = special ? ' special' : '';
  if (size === 's') return `<div class="w-calhd${cls}">${dateBlock(now, special)}</div><div class="w-evs">${body(2)}</div>${stale}`;
  // 중간: 왼쪽은 요일과 아주 큰 날짜를 세로 가운데에 (FigCraft에서 고친 모양)
  if (size === 'm') return `<div class="w-split"><div class="w-side w-calm${cls}"><div class="w-fill"></div>${dateBlock(now, special)}<div class="w-fill"></div>${stale}</div><div class="w-list">${body(3)}</div></div>`;
  // 크게: 날짜별로 묶어서
  let html = '', last = '', n = 0;
  if (c.state !== 'ok' || !list.length) html = body(6);
  else for (const e of list) {
    if (n >= 7) break;
    const lab = dayLabel(e.start, now);
    if (lab !== last) { html += `<div class="w-sh">${esc(lab)}</div>`; last = lab; n++; }
    html += evRow(e, now, false); n++;
  }
  return `<div class="w-calhd row${cls}">${dateBlock(now, special)}</div><div class="w-lg">${html}</div>${stale}`;
}

// ---------- 날씨 ----------
// 애플 날씨처럼 하늘색 배경 (낮/밤, 맑음/흐림/비·눈)
export function skyOf(code, hour) {
  const night = hour < 6 || hour >= 18;
  const icon = codeInfo(code).icon;
  if (['rain', 'storm', 'snow', 'fog'].includes(icon)) return night ? 'sky-nwet' : 'sky-wet';
  if (icon === 'cloud') return night ? 'sky-ncloud' : 'sky-cloud';
  return night ? 'sky-night' : 'sky-day';
}
function wx(size, d) {
  const x = d.wx || { state: 'off' };
  const w = x.w;
  if (x.state === 'off' || (!w && x.state !== 'loading')) return `<div class="w-wxtop"><b>${esc(LOCATION.name)}</b>${SYM.loc}</div><div class="w-fill"></div>${note('설정에서 날씨를 켜면 보여요')}`;
  if (!w) return `<div class="w-wxtop"><b>${esc(LOCATION.name)}</b>${SYM.loc}</div>${ph(40)}<div class="w-fill"></div>${ph(70, 55)}`;
  const info = codeInfo(w.code);
  const top = `<div class="w-wxtop"><b>${esc(LOCATION.name)}</b>${SYM.loc}</div>${v('wt', `${w.temp}°`, 'w-temp')}`;
  const cond = `<div class="w-wxc"><span class="w-wi">${wicon(w.code, d.now.getHours())}</span><b>${esc(info.label)}</b></div><div class="w-hl">${v('hl', `최고:${w.max}° 최저:${w.min}°`)}</div>`;
  if (size === 's') return `${top}<div class="w-fill"></div>${cond}`;
  const hours = (w.hours || []).slice(0, 6);
  return `<div class="w-wxm"><div>${top}</div><div class="w-wxr">${cond}</div></div><div class="w-fill"></div>${
    hours.length ? `<div class="w-hours">${hours.map(h => `<div><small>${h.h}시</small><span class="w-wi">${wicon(h.code, h.h)}</span><b>${h.temp}°</b></div>`).join('')}</div>` : ''}`;
}

// ---------- 커피 ----------
// 내리기 직전에 필요한 '원두 g, 물 ml'을 한 줄로 크게 (좁으면 두 줄로 넘어감) (단위가 말해주니 '원두/물' 글자는 안 씀)
// 위: 기호 + 레시피 이름, 오른쪽에 시작 버튼 / 아래: 숫자, 있으면 온도·분쇄도 한 줄
const mins = r => Math.round((r.steps || []).reduce((a, s) => a + (s.sec || 0), 0) / 60);
const mmss = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const extras = (r, short) => [r.temp ? `${r.temp}°` : '', r.grind ? `분쇄 ${r.grind}` : '', short ? '' : r.ice ? `얼음 ${r.ice}g` : '', short ? '' : `${mins(r)}분`].filter(Boolean).join(' · ');
const unit = (n, u) => `${n}<i>${u}</i>`;
// 위: 큰 컵과 버튼만, 이름은 숫자 바로 위 두 줄까지
// 머리의 컵: 버튼 높이에 맞춘 큰 컵 (선 굵기는 작은 기호와 같게 보이도록 가늘게)
const CUP = `<svg class="sym w-cup" viewBox="2.9 7.9 18 12.2" fill="none" stroke="currentColor" stroke-width="1.26" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h12v4.5a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 4 13.5V9z"/><path d="M16 10.5h1.2a2.6 2.6 0 0 1 0 5.2H16"/></svg>`;
const cofHead = btn => `<div class="w-hd w-chd" style="color:${ACCENT.coffee}">${CUP}${btn}</div>`;
const cofName = name => `<div class="w-cname" style="color:${ACCENT.coffee}">${esc(name)}</div>`;
const playBtn = r => `<button class="w-play" type="button" data-play="${esc(r.id)}" aria-label="${esc(r.name)} 타이머 시작">${SYM.play}</button>`;
function coffee(size, d) {
  const { recipes = [], current = null, running = null } = d.coffee || {};
  const r = current || recipes[0];
  if (!r) return `${head('coffee', '커피')}<div class="w-fill"></div>${note('커피 앱에서 레시피를 넣으세요')}`;
  if (running) {
    const st = running.step || {};
    return `${cofHead(`<button class="w-play" type="button" data-open-coffee aria-label="커피 타이머 보기">${SYM.open}</button>`)}<div class="w-fill"></div>
      ${cofName(`${running.name} · ${running.done ? '다 됐어요' : st.label || '내리는 중'}`)}
      <div class="w-big">${st.pourTo && !running.done ? unit(st.pourTo, 'ml까지') : mmss(running.remain)}</div>
      ${st.pourTo && !running.done ? `<div class="w-sub">남은 시간 ${mmss(running.remain)}</div>` : ''}`;
  }
  const ex = short => extras(r, short);
  const main = short => `${cofName(r.name)}<div class="w-big w-cnum">${r.dose ? v('cg', unit(r.dose, 'g')) : ''}${r.water ? v('cw', unit(r.water, 'ml')) : ''}</div>${ex(short) ? `<div class="w-sub ${short ? '' : 'w-wrap'}">${esc(ex(short))}</div>` : ''}`;
  if (size === 's') return `${cofHead(playBtn(r))}<div class="w-fill"></div>${main(true)}`;
  const others = recipes.filter(x => x.id !== r.id).slice(0, 3);
  return `<div class="w-split"><div class="w-side w-cside">${cofHead(playBtn(r))}<div class="w-fill"></div>${main(true)}</div>
    <div class="w-list w-cof">${others.map(x => `<div class="w-crow"><div class="w-rt"><b>${esc(x.name)}</b><small>${[x.dose ? `${x.dose}g` : '', x.water ? `${x.water}ml` : ''].filter(Boolean).join(' · ')}</small></div>
      <button class="w-play sm" type="button" data-play="${esc(x.id)}" aria-label="${esc(x.name)} 타이머 시작">${SYM.play}</button></div>`).join('')}</div></div>`;
}

const RENDER = { 'w:meds': meds, 'w:cal': cal, 'w:wx': wx, 'w:coffee': coffee };
// 위젯 하나의 안쪽 HTML. data = { now, meds:{summary,log}, cal:{state,events,at}, wx:{state,w}, coffee:{recipes,running} }
export function widgetBody(id, size, data) {
  const f = RENDER[id];
  return f ? f(size, data) : '';
}
// 위젯 상자 (배경 포함). 날씨는 하늘색 배경
export function widgetBox(id, size, data, extra = '') {
  const kind = id.slice(2);
  const w = data.wx?.w;
  const sky = id === 'w:wx' ? (w ? skyOf(w.code, data.now.getHours()) : 'sky-off') : '';
  return `<div class="wg w-${kind} w-${size} ${sky}" ${extra}>${widgetBody(id, size, data)}</div>`;
}
