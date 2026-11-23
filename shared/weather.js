// 날씨: 설정에서 켰을 때만 요청. 보내는 건 고정된 마포구 좌표뿐 (기기·사용자 정보 없음)
import { load, save } from './store.js';

export const LOCATION = { lat: 37.5663, lon: 126.9019, name: '마포구' };

const CODES = [
  [[0], '맑음', 'sun'], [[1, 2], '구름 조금', 'partly'], [[3], '흐림', 'cloud'], [[45, 48], '안개', 'fog'],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], '비', 'rain'], [[71, 73, 75, 77, 85, 86], '눈', 'snow'], [[95, 96, 99], '뇌우', 'storm'],
];
export function codeInfo(code) {
  for (const [list, label, icon] of CODES) if (list.includes(code)) return { label, icon };
  return { label: '흐림', icon: 'cloud' };
}

export function buildUrl() {
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', LOCATION.lat);
  u.searchParams.set('longitude', LOCATION.lon);
  u.searchParams.set('current', 'temperature_2m,weather_code');
  u.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code');
  u.searchParams.set('hourly', 'temperature_2m,weather_code');
  u.searchParams.set('timezone', 'Asia/Seoul');
  u.searchParams.set('forecast_days', '7');
  return u.toString();
}

// 시간별 예보에서 지금 이후 24시간 (시간 문자열은 서울 시각). 위젯은 앞 6개만 씀
function hoursAfter(h, now) {
  if (!h || !Array.isArray(h.time)) return [];
  const seoulNow = new Date(now + 9 * 3600000).toISOString().slice(0, 13); // 'YYYY-MM-DDTHH'
  const out = [];
  h.time.forEach((t, i) => {
    if (out.length < 24 && String(t).slice(0, 13) > seoulNow && h.temperature_2m?.[i] != null)
      out.push({ h: Number(String(t).slice(11, 13)), temp: Math.round(h.temperature_2m[i]), code: h.weather_code?.[i] ?? 3 });
  });
  return out;
}

// 날짜별 예보 (최대 7일)
function daysOf(d) {
  if (!d || !Array.isArray(d.time)) return [];
  return d.time.map((t, i) => ({ date: String(t), max: Math.round(d.temperature_2m_max[i]), min: Math.round(d.temperature_2m_min[i]), code: d.weather_code?.[i] ?? 3 }))
    .filter(x => !Number.isNaN(x.max) && !Number.isNaN(x.min)).slice(0, 7);
}

export function parse(j, now) {
  try {
    const c = j.current, d = j.daily;
    if (c.temperature_2m == null) return null;
    return { temp: Math.round(c.temperature_2m), code: c.weather_code, max: Math.round(d.temperature_2m_max[0]), min: Math.round(d.temperature_2m_min[0]), at: now, hours: hoursAfter(j.hourly, now), days: daysOf(d) };
  } catch { return null; }
}

export const isFresh = (w, now) => !!w && now - w.at < 30 * 60000;
export const weatherOn = () => !!load('settings', {}).weather;

// 켜져 있으면 캐시 또는 새로 받아옴, 꺼져 있으면 null (요청 안 함)
export async function getWeather() {
  if (!weatherOn()) return null;
  const cached = load('weather.cache', null);
  if (isFresh(cached, Date.now())) return cached;
  try {
    const res = await fetch(buildUrl(), { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
    const w = parse(await res.json(), Date.now());
    if (w) save('weather.cache', w);
    return w || cached;
  } catch { return cached; }
}

export const WEATHER_ICONS = {
  sun: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="10" fill="#ffcc33"/></svg>',
  moon: '<svg viewBox="0 0 48 48"><path d="M30 10a14 14 0 1 0 8 23 12 12 0 0 1-8-23z" fill="#f2f2f7"/></svg>',
  pmoon: '<svg viewBox="0 0 48 48"><path d="M24 8a10 10 0 1 0 6 16.5A8.5 8.5 0 0 1 24 8z" fill="#f2f2f7"/><path d="M14 38h22a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-1 13z" fill="#fff" stroke="rgba(0,0,0,.08)"/></svg>',
  partly: '<svg viewBox="0 0 48 48"><circle cx="20" cy="18" r="8" fill="#ffcc33"/><path d="M14 38h22a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-1 13z" fill="#fff" stroke="rgba(0,0,0,.08)"/></svg>',
  cloud: '<svg viewBox="0 0 48 48"><path d="M12 36h24a9 9 0 0 0 0-18 12 12 0 0 0-23 3 7.5 7.5 0 0 0-1 15z" fill="#e9ecf2" stroke="rgba(0,0,0,.1)"/></svg>',
  fog: '<svg viewBox="0 0 48 48" stroke="#c7ccd6" stroke-width="4" stroke-linecap="round"><path d="M8 18h32M12 26h28M8 34h26"/></svg>',
  rain: '<svg viewBox="0 0 48 48"><path d="M12 28h24a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-3 13z" fill="#e9ecf2" stroke="rgba(0,0,0,.1)"/><path d="M16 34l-2 6M24 34l-2 6M32 34l-2 6" stroke="#4a9bff" stroke-width="3" stroke-linecap="round"/></svg>',
  snow: '<svg viewBox="0 0 48 48"><path d="M12 28h24a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-3 13z" fill="#e9ecf2" stroke="rgba(0,0,0,.1)"/><g fill="#9cc7ff"><circle cx="16" cy="37" r="2.5"/><circle cx="24" cy="40" r="2.5"/><circle cx="32" cy="37" r="2.5"/></g></svg>',
  storm: '<svg viewBox="0 0 48 48"><path d="M12 28h24a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-3 13z" fill="#d5d9e2"/><path d="M25 28l-5 9h6l-4 8" stroke="#ffb020" stroke-width="3" fill="none" stroke-linejoin="round"/></svg>',
};
