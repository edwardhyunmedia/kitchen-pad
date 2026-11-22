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
