import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvents, upcoming, todayEvents, dueAlerts, isCalUrl } from '../shared/calendar.js';

const at = (d, h, m) => new Date(2026, 10, d, h, m);
const raw = { events: [
  { id: 'a', title: '병원', start: at(22, 15, 0).toISOString(), end: at(22, 16, 0).toISOString(), allDay: false, cal: '가족' },
  { id: 'b', title: '장보기', start: at(22, 9, 0).toISOString(), end: at(22, 10, 0).toISOString(), allDay: false },
  { id: 'c', title: '엄마 생신', start: at(23, 0, 0).toISOString(), end: at(24, 0, 0).toISOString(), allDay: true },
  { title: '' }, null,
] };

test('normalize drops broken items and sorts', () => {
  const ev = normalizeEvents(raw);
  assert.deepEqual(ev.map(e => e.id), ['b', 'a', 'c']);
  assert.equal(normalizeEvents({}).length, 0);
  assert.equal(normalizeEvents('x').length, 0);
});
test('upcoming excludes ended timed events, keeps ongoing', () => {
  const ev = normalizeEvents(raw);
  assert.deepEqual(upcoming(ev, at(22, 9, 30)).map(e => e.id), ['b', 'a', 'c']);
  assert.deepEqual(upcoming(ev, at(22, 10, 30)).map(e => e.id), ['a', 'c']);
});
test('today events only today', () => {
  assert.deepEqual(todayEvents(normalizeEvents(raw), at(22, 8, 0)).map(e => e.id), ['b', 'a']);
});
test('alerts N minutes before, once, not for all-day', () => {
  const ev = normalizeEvents(raw);
  assert.deepEqual(dueAlerts(ev, at(22, 14, 49), 10, {}).map(e => e.id), []);
  const d = dueAlerts(ev, at(22, 14, 50), 10, {});
  assert.deepEqual(d.map(e => e.id), ['a']);
  assert.deepEqual(dueAlerts(ev, at(22, 14, 55), 10, { [d[0].ackKey]: true }), []);
  assert.deepEqual(dueAlerts(ev, at(22, 15, 20), 10, {}).map(e => e.id), []); // 이미 시작한 지 오래면 안 울림
  assert.deepEqual(dueAlerts(ev, at(22, 23, 55), 10, {}).map(e => e.id), []);
});
test('only accepts apps script urls', () => {
  assert.equal(isCalUrl('https://script.google.com/macros/s/AKfy123/exec?t=abc'), true);
  assert.equal(isCalUrl('https://evil.example.com/x'), false);
  assert.equal(isCalUrl('javascript:alert(1)'), false);
});

import { dayLabel, nextEvents } from '../shared/calendar.js';
test('day label: today, tomorrow, then date with weekday', () => {
  const now = new Date(2026, 10, 23, 16, 0);
  assert.equal(dayLabel(new Date(2026, 10, 23, 20, 0), now), '오늘');
  assert.equal(dayLabel(new Date(2026, 10, 24, 9, 0), now), '내일');
  assert.equal(dayLabel(new Date(2026, 10, 26, 9, 0), now), '11/26(목)');
});
test('next events skip finished ones and keep order', () => {
  const now = new Date(2026, 10, 23, 16, 0);
  const ev = (h, d = 23, end) => ({ title: 't' + d + h, start: new Date(2026, 10, d, h), end: new Date(2026, 10, d, end ?? h + 1), allDay: false });
  const out = nextEvents([ev(10), ev(15, 23, 17), ev(9, 25), ev(20)], now, 2);
  assert.deepEqual(out.map(e => e.title), ['t2315', 't2320']);
});

import { monthCells, eventsOn } from '../shared/calendar.js';
test('month grid starts on sunday and covers whole weeks', () => {
  const c = monthCells(2026, 10); // 2026년 11월: 1일이 일요일, 30일
  assert.equal(c.length, 35);
  assert.equal(c[0].date.getDate(), 1);
  assert.equal(c[0].out, false);
  assert.equal(c[30].date.getMonth(), 11);
  assert.equal(c[30].out, true);
  const f = monthCells(2026, 1); // 2026년 2월: 1일 일요일, 28일 → 4주
  assert.equal(f.length, 28);
});
test('events on a day include multi-day all-day events, all-day first', () => {
  const ev = (id, s, e, allDay = false) => ({ id, title: id, start: new Date(s), end: new Date(e), allDay });
  const list = [ev('trip', '2026-11-22T00:00:00', '2026-11-25T00:00:00', true), ev('dentist', '2026-11-23T10:00:00', '2026-11-23T11:00:00'), ev('late', '2026-11-24T09:00:00', '2026-11-24T10:00:00')];
  assert.deepEqual(eventsOn(list, new Date(2026, 10, 23)).map(e => e.id), ['trip', 'dentist']);
  assert.deepEqual(eventsOn(list, new Date(2026, 10, 25)).map(e => e.id), []);
});
