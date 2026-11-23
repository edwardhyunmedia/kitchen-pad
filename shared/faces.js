// 시계 페이스 8종. 모든 크기는 cqw/cqh(담는 상자 기준)라 미리보기에서도 그대로 줄어듦
import { WEATHER_ICONS, codeInfo } from './weather.js';
import { dayLabel, sameDay } from './calendar.js';

const pad = n => String(n).padStart(2, '0');
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const FACES = [
  { id: 'big', name: '큰 숫자', colors: [['#f1efe9', '#1d1d1f', '#ff6a3d'], ['#1c1c1e', '#f5f5f7', '#ffd60a'], ['#e8f0ff', '#1b2a4a', '#3b82f6'], ['#fdeef4', '#3a1d2b', '#e8457c'], ['#eaf4ea', '#1f3324', '#34a853']] },
  { id: 'photo', name: '사진', colors: [['#fff'], ['#1d1d1f']] },
  { id: 'album', name: '공유 앨범', colors: [['#fff'], ['#1d1d1f']] },
  { id: 'ana', name: '숫자 시계', colors: [['#5e9c6a', '#111', '#fff'], ['#efe9dc', '#1d1d1f', '#e8457c'], ['#26304a', '#f5f5f7', '#ffd60a'], ['#f4b8a2', '#3a1d14', '#fff']] },
  { id: 'mini', name: '미니멀', colors: [['#ead7d4', '#5b2b2b', '#e84c9a'], ['#dfe7ef', '#22364d', '#ff9500'], ['#ecebe4', '#2b2b2e', '#34c759'], ['#2b2b2e', '#f2f2f2', '#ff6a3d']] },
  { id: 'flow', name: '플로우', colors: [['#ff9ad5', '#7aa7ff', '#c79bff'], ['#ffd27a', '#ff8a7a', '#ffb3c7'], ['#7ae0c3', '#6fb8ff', '#b4f0a0'], ['#c3c7d1', '#8e9bb5', '#e6e8ee']] },
  { id: 'cal', name: '달력', colors: [['#ff3b30'], ['#007aff'], ['#34c759'], ['#af52de']] },
  { id: 'mod', name: '홈 위젯', colors: [['#7b7ff0', '#5359d6'], ['#f4a261', '#e76f51'], ['#4fb3a5', '#2a7f8f'], ['#3a3a3c', '#1c1c1e']] },
];
export const faceById = id => FACES.find(f => f.id === id) || FACES[0];
export const DEFAULT_FACE = { id: 'big', color: 0, showDate: true, showWeather: true };

function dateLine(now, ctx, extraWeather = true) {
  const parts = [];
  if (ctx.opts.showDate !== false) parts.push(`${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`);
  if (extraWeather && ctx.opts.showWeather !== false && ctx.weather) parts.push(`<span class="fw">${WEATHER_ICONS[codeInfo(ctx.weather.code).icon]}${ctx.weather.temp}°</span>`);
  return parts.length ? `<div class="fdate">${parts.join('')}</div>` : '';
}

function analog(now, c, numerals, style) {
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
  const ha = h * 30 + m * 0.5, ma = m * 6 + s * 0.1, sa = s * 6;
  const nums = numerals === 'big'
    ? `<g font-family="Pretendard" font-weight="400" fill="${c[1]}" text-anchor="middle" dominant-baseline="central" font-size="70">
        <text x="100" y="44">12</text><text x="162" y="104">3</text><text x="100" y="162">6</text><text x="38" y="104">9</text></g>`
    : `<g font-family="Pretendard" font-weight="300" fill="${c[1]}" opacity=".45" text-anchor="middle" dominant-baseline="central" font-size="20">
        <text x="100" y="22">12</text><text x="178" y="100">3</text><text x="100" y="178">6</text><text x="22" y="100">9</text></g>`;
  const handCol = style === 'big' ? c[2] : c[1];
  return `<svg class="ana" viewBox="0 0 200 200">${nums}
    <g stroke="${handCol}" stroke-linecap="round">
      <line x1="100" y1="100" x2="100" y2="54" stroke-width="${style === 'big' ? 5 : 7}" transform="rotate(${ha} 100 100)"/>
      <line x1="100" y1="100" x2="100" y2="24" stroke-width="${style === 'big' ? 4 : 5}" transform="rotate(${ma} 100 100)"/></g>
    <line x1="100" y1="114" x2="100" y2="22" stroke="${style === 'big' ? c[2] : c[2]}" stroke-width="1.3" opacity=".9" transform="rotate(${sa} 100 100)"/>
    <circle cx="100" cy="100" r="4.5" fill="${c[2]}"/></svg>`;
}

function calendar(now, ctx, c) {
  const y = now.getFullYear(), mo = now.getMonth();
  const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
  let cells = '';
  for (let i = 0; i < first; i++) cells += '<td></td>';
  for (let d = 1; d <= days; d++) {
    const has = (ctx.eventDays || []).includes(`${y}-${mo}-${d}`);
    cells += `<td class="${d === now.getDate() ? 't' : ''}${has ? ' has' : ''}"><span ${d === now.getDate() ? `style="background:${c[0]}"` : ''}>${d}</span>${has ? `<i style="background:${c[0]}"></i>` : ''}</td>`;
    if ((first + d) % 7 === 0) cells += '</tr><tr>';
  }
  const pad2 = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const items = [
    ...(ctx.events || []).map(e => ({ t: e.allDay ? '종일' : pad2(e.start), k: e.allDay ? '' : pad2(e.start), title: e.title, who: '' })),
    ...(ctx.summary?.slots || []).filter(s => !ctx.log?.[s.key] && s.at >= now).map(s => ({ t: s.time, k: s.time, title: s.medName, who: s.personName })),
  ].sort((a, b) => a.k.localeCompare(b.k)).slice(0, 4);
  let evs = items.map(i => `<div class="ev" style="border-color:${c[0]}">${esc(i.t)} ${esc(i.title)} ${i.who ? `<small>${esc(i.who)}</small>` : ''}</div>`).join('');
  // 오늘 남은 게 적으면 다가오는 날의 일정도 (날짜와 함께)
  const later = (ctx.nextEvents || []).filter(e => !sameDay(e.start, now)).slice(0, Math.max(0, 4 - items.length));
  evs += later.map(e => `<div class="ev" style="border-color:${c[0]}">${esc(dayLabel(e.start, now))} ${e.allDay ? '종일' : pad2(e.start)} ${esc(e.title)}</div>`).join('');
  return `<div class="cal">
    <div class="mon" style="color:${c[0]}">${y}년 ${mo + 1}월</div>
    <div class="day">${now.getDate()}</div><div class="wd">${DAYS[now.getDay()]}요일 <b>${pad(now.getHours())}:${pad(now.getMinutes())}</b></div>
    <table><tr>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr><tr>${cells}</tr></table>
    ${evs || '<div class="ev none">7일 안에 일정이 없어요</div>'}</div>`;
}

function modular(now, ctx, c) {
  const ps = (ctx.summary?.people || []).filter(p => p.total).slice(0, 2);
  const tile = p => `<div class="mw"><span>${esc(p.name)}</span><div><b class="${p.late ? 'late' : ''}">${p.allDone ? '다 먹음' : p.late ? `${p.late}번 안 먹음` : `${p.left}번 남음`}</b>${p.nextTime ? `<small>${esc(p.nextTime)} ${esc(p.nextMed)}</small>` : ''}</div></div>`;
  const nx = ctx.summary?.next;
  return `<div class="mod" style="background:linear-gradient(160deg,${c[0]},${c[1]})">
    <div class="mt">${pad(now.getHours())}:${pad(now.getMinutes())}</div>${dateLine(now, ctx)}
    <div class="mg">${ps.map(tile).join('')}
      <div class="mw"><span>다음 약</span><b>${nx ? esc(nx.time) : '없음'}</b></div>
      <div class="mw"><span>커피</span><b>${esc(ctx.coffeeName || '기본')}</b></div></div></div>`;
}

// root에 페이스를 그림. ctx: { opts, weather, photo(URL), summary, log, coffeeName }
export function renderFace(root, now, ctx) {
  const f = faceById(ctx.opts.id);
  const c = f.colors[ctx.opts.color] || f.colors[0];
  const hh = pad(now.getHours()), mm = pad(now.getMinutes());
  let html = '';
  switch (f.id) {
    case 'big':
      html = `<div class="fc" style="background:${c[0]};color:${c[1]}"><div class="bn">${hh}</div><div class="bn" style="color:${c[2]}">${mm}</div>${dateLine(now, ctx)}</div>`;
      break;
    case 'photo':
      html = `<div class="fc ph ${c[0] === '#fff' ? 'light' : 'dark'}" style="${ctx.photo ? `background-image:url('${ctx.photo}')` : ''}">
        ${ctx.photo ? '' : '<div class="nophoto">설정에서 사진을 고르세요</div>'}<div class="pn">${hh}</div><div class="pn">${mm}</div>${dateLine(now, ctx)}</div>`;
      break;
    case 'album': {
      // 공유 앨범 사진을 화면 가득, 위에 작은 시계·날짜·날씨. 가로 사진은 잘리지 않게 통째로 + 뒤에 흐린 같은 사진
      const u = ctx.photo ? String(ctx.photo).replace(/'/g, '%27') : '';
      const bg = u ? `background-image:url('${u}')` : '';
      html = `<div class="fc alb ${c[0] === '#fff' ? '' : 'darktext'}" style="--t:${c[0]}">
        ${u ? `<div class="ab" style="${bg}"></div><div class="af ${ctx.photoWide ? 'wide' : ''}" style="${bg}"></div>` : '<div class="nophoto">설정에서 아이폰 공유 앨범을 켜주세요</div>'}
        <div class="ag"></div>
        <div class="ac"><div class="at">${hh}:${mm}</div>${dateLine(now, ctx)}</div></div>`;
      break;
    }
    case 'ana':
      html = `<div class="fc" style="background:${c[0]};color:${c[1]}">${analog(now, c, 'big', 'big')}${ctx.opts.showDate !== false ? `<div class="corner">${DAYS[now.getDay()]} ${now.getDate()}</div>` : ''}</div>`;
      break;
    case 'mini':
      html = `<div class="fc" style="background:${c[0]};color:${c[1]}">${analog(now, c, 'small', 'mini')}${dateLine(now, ctx)}</div>`;
      break;
    case 'flow':
      html = `<div class="fc flow" style="--a:${c[0]};--b:${c[1]};--c:${c[2]}"><div class="fn">${hh}</div><div class="fn">${mm}</div>${dateLine(now, ctx)}</div>`;
      break;
    case 'cal':
      html = `<div class="fc" style="background:#fbfaf7;color:#1d1d1f">${calendar(now, ctx, c)}</div>`;
      break;
    case 'mod':
      html = modular(now, ctx, c);
      break;
  }
  root.innerHTML = html;
  opticalFix(root);
}

// 큰 숫자는 글자 자체의 좌우 여백(특히 1)과 자간 때문에 한쪽으로 치우쳐 보임
// → 실제 잉크(보이는 획) 위치를 재서 가운데/왼쪽 선에 맞춤
let ink = null;
function inkBox(el) {
  const text = el.textContent.trim();
  if (!text || !el.offsetWidth || typeof document === 'undefined') return null;
  ink = ink || document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(el);
  ink.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const ls = parseFloat(cs.letterSpacing) || 0;
  let extra = 0;
  if ('letterSpacing' in ink) ink.letterSpacing = `${ls}px`; else extra = ls * (text.length - 1);
  const m = ink.measureText(text);
  return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight + extra };
}
export function opticalFix(root) {
  root.querySelectorAll('.bn, .pn, .fn').forEach(el => {
    el.style.position = 'relative'; el.style.left = '0px';
    const b = inkBox(el);
    const pl = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    if (b) el.style.left = `${el.offsetWidth / 2 - pl - (b.left + b.right) / 2}px`;
  });
  root.querySelectorAll('.mt, .cal .day, .alb .at').forEach(el => {
    el.style.position = 'relative'; el.style.left = '0px';
    const b = inkBox(el);
    if (b) el.style.left = `${-b.left}px`;
  });
}
