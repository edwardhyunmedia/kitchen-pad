// 날씨 앱: 지금 날씨, 12시간, 7일 (보내는 건 고정된 마포구 좌표뿐)
import { icons } from '../shared/icons.js';
import { load, save } from '../shared/store.js';
import { getWeather, codeInfo, WEATHER_ICONS, LOCATION } from '../shared/weather.js';

const $ = id => document.getElementById(id);
const WD = ['일', '월', '화', '수', '목', '금', '토'];
$('back').innerHTML = icons.home;
$('reload').innerHTML = icons.reset;

// 위젯과 같은 하늘색 (낮/밤, 맑음/흐림/비)
const SKY = { day: ['#2f7fd8', '#6bb2f0'], cloud: ['#5d7896', '#93a9c0'], wet: ['#4a5a6e', '#7d8b9c'], night: ['#0b1630', '#283c66'], ncloud: ['#1d2533', '#424d61'], nwet: ['#1a2029', '#3a4452'], off: ['#8e9aab', '#b6c0cd'] };
const isNight = h => h < 6 || h >= 18;
function skyKey(code, h) {
  const i = codeInfo(code).icon, n = isNight(h);
  if (['rain', 'storm', 'snow', 'fog'].includes(i)) return n ? 'nwet' : 'wet';
  if (i === 'cloud') return n ? 'ncloud' : 'cloud';
  return n ? 'night' : 'day';
}
const icon = (code, h) => { const i = codeInfo(code).icon; return WEATHER_ICONS[isNight(h) && i === 'sun' ? 'moon' : isNight(h) && i === 'partly' ? 'pmoon' : i]; };
function setSky(k) { const [a, b] = SKY[k]; const r = document.documentElement.style; r.setProperty('--a', a); r.setProperty('--b', b); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', a); }

function draw(w) {
  const on = !!load('settings', {}).weather;
  if (!on || !w) {
    setSky('off');
    $('main').innerHTML = `<div class="off"><div class="now"><div class="place">${LOCATION.name}</div></div>
      <p>${on ? '날씨를 받아오지 못했어요. 인터넷 연결을 확인하세요.' : '날씨를 켜면 마포구의 날씨를 받아와요. (보내는 건 마포구 위치뿐)'}</p>
      ${on ? '' : '<button type="button" id="turn-on">날씨 켜기</button>'}</div>`;
    $('turn-on')?.addEventListener('click', async () => { save('settings', { ...load('settings', {}), weather: true }); window.dispatchEvent(new Event('kp-settings-changed')); draw(await getWeather()); });
    return;
  }
  const now = new Date();
  setSky(skyKey(w.code, now.getHours()));
  const info = codeInfo(w.code);
  const hours = (w.hours || []).slice(0, 12);
  const days = w.days || [];
  const lo = Math.min(...days.map(d => d.min), w.temp), hi = Math.max(...days.map(d => d.max), w.temp);
  const span = Math.max(1, hi - lo);
  const dayName = (d, i) => (i === 0 ? '오늘' : WD[new Date(`${d.date}T12:00:00`).getDay()]);
  const ago = Math.max(0, Math.round((Date.now() - w.at) / 60000));
  $('main').innerHTML = `<section class="now"><div class="place">${LOCATION.name}</div><div class="temp">${w.temp}°</div><div class="cond">${info.label}</div><div class="hl">최고:${w.max}° 최저:${w.min}°</div></section>
    ${hours.length ? `<section class="card"><h3>시간별</h3><div class="hours">${hours.map((h, i) => `<div><small>${h.h}시</small><span class="wi">${icon(h.code, h.h)}</span>${h.temp}°</div>`).join('')}</div></section>` : ''}
    ${days.length ? `<section class="card"><h3>7일</h3><div class="days">${days.map((d, i) => `<div><span>${dayName(d, i)}</span><span class="wi">${icon(d.code, 12)}</span><span class="lo">${d.min}°</span><span class="bar"><i style="left:${((d.min - lo) / span) * 100}%;right:${100 - ((d.max - lo) / span) * 100}%"></i></span><span class="hi">${d.max}°</span></div>`).join('')}</div></section>` : ''}
    <p class="upd">${ago < 1 ? '방금' : ago < 60 ? `${ago}분 전` : `${Math.floor(ago / 60)}시간 전`} 업데이트</p>`;
}

$('reload').addEventListener('click', async () => {
  $('reload').disabled = true;
  const c = load('weather.cache', null);
  if (c) save('weather.cache', { ...c, at: 0 }); // 오래된 걸로 표시해서 새로 받게 (실패하면 있던 걸 그대로 보여줌)
  draw(await getWeather());
  $('reload').disabled = false;
});
getWeather().then(draw);
