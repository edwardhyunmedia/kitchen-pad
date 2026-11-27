// 구글 캘린더 (내 구글 계정의 Apps Script를 통해 읽기만 함)
// 설정에 주소를 넣었을 때만 요청. 주소는 script.google.com 것만 받음
import { load, save } from './store.js';

export const isCalUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname === 'script.google.com' && x.pathname.startsWith('/macros/'); } catch { return false; } };

export function normalizeEvents(raw) {
  const list = Array.isArray(raw?.events) ? raw.events : [];
  return list
    .filter(e => e && e.title && e.start && !isNaN(new Date(e.start)))
    .map(e => ({ id: String(e.id ?? e.title + e.start), title: String(e.title).slice(0, 80), start: new Date(e.start), end: new Date(e.end || e.start), allDay: !!e.allDay, cal: e.cal ? String(e.cal) : '' }))
    .sort((a, b) => a.start - b.start);
}
// 아직 안 끝난 일정 (종일 일정은 그날 끝날 때까지)
export const upcoming = (events, now) => events.filter(e => e.end > now);
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const WD = ['일', '월', '화', '수', '목', '금', '토'];
// 오늘 / 내일 / 11/26(목)
export function dayLabel(d, now) {
  if (sameDay(d, now)) return '오늘';
  const t = new Date(now); t.setDate(t.getDate() + 1);
  if (sameDay(d, t)) return '내일';
  return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`;
}
// 다가오는 일정 n개 (오늘이 아니어도)
export const nextEvents = (events, now, n) => upcoming(events, now).sort((a, b) => a.start - b.start).slice(0, n);
// 시계 화면용: 지금부터 7일 안의 남은 일정 (최대 max개)
export const weekEvents = (events, now, max = 6) => {
  const limit = now.getTime() + 7 * 86400000;
  return upcoming(events, now).filter(e => e.start.getTime() < limit).sort((a, b) => a.start - b.start).slice(0, max);
};
export const todayEvents = (events, now) => upcoming(events, now).filter(e => sameDay(e.start, now) || (e.allDay && e.start <= now));

// 시작 minutes분 전부터 시작 후 5분까지 한 번 울림 (종일 일정 제외)
export function dueAlerts(events, now, minutes, acks) {
  return events
    .filter(e => !e.allDay && now >= new Date(e.start - minutes * 60000) && now <= new Date(+e.start + 5 * 60000))
    .map(e => ({ ...e, ackKey: `cal|${e.id}|${e.start.toISOString()}` }))
    .filter(e => !acks[e.ackKey]);
}

export const fmtTime = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// 15분마다 새로 받음. 실패하면 마지막으로 받은 것 사용
export async function getEvents(force = false) {
  const url = load('settings', {}).calUrl;
  if (!url || !isCalUrl(url)) return [];
  const cache = load('cal.cache', null);
  if (!force && cache && Date.now() - cache.at < 15 * 60000) return normalizeEvents(cache.data);
  try {
    const res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'follow' });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    save('cal.cache', { at: Date.now(), data });
    return normalizeEvents(data);
  } catch {
    return cache ? normalizeEvents(cache.data) : [];
  }
}

// 달력 앱: 그 달을 일요일부터 6주(42칸) 또는 필요한 만큼(주 단위)으로. 칸마다 Date (다른 달은 out: true)
export function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + days) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: d, out: d.getMonth() !== month };
  });
}
// 그날에 걸친 일정 (여러 날 종일 일정 포함). 시간 순, 종일 먼저
export function eventsOn(events, day) {
  const s = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
  return events.filter(x => x.start < e && (x.end > s || (+x.end === +x.start && x.start >= s)))
    .sort((a, b) => (b.allDay - a.allDay) || (a.start - b.start));
}
