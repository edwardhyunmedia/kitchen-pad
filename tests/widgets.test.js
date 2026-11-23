import { test } from 'node:test';
import assert from 'node:assert/strict';
import { widgetBody, widgetBox, medRows, skyOf, WIDGET_INFO } from '../shared/widgets.js';
import { medsSummary } from '../shared/summary.js';

const now = new Date(2026, 10, 23, 20, 0);
const cfg = { people: [
  { id: 'me', name: '나', meds: [{ id: 'a', name: '비타민', times: ['19:00', '21:30'] }] },
  { id: 'wife', name: '아내', meds: [{ id: 'b', name: '철분', times: ['22:00'] }] }] };
const summary = medsSummary(cfg, {}, now);
const key = (p, m, t) => `2026-11-23|${p}|${m}|${t}`;
const base = { now, meds: { summary, log: {} }, cal: { state: 'off', events: [] }, wx: { state: 'off' }, coffee: { recipes: [] } };

test('meds rows: late first, then upcoming', () => {
  const r = medRows(summary, {}, now);
  assert.deepEqual(r.todo.map(s => s.time), ['19:00', '21:30', '22:00']);
  assert.equal(r.late.length, 1);
});
test('small meds widget shows the late dose with its own check button', () => {
  const h = widgetBody('w:meds', 's', base);
  assert.match(h, /안 먹은 약/);
  assert.match(h, /19:00/);
  assert.ok(h.includes(`data-slot="${key('me', 'a', '19:00')}"`));
});
test('medium meds widget lists up to 3 doses each with a toggle', () => {
  const h = widgetBody('w:meds', 'm', base);
  assert.equal((h.match(/data-slot=/g) || []).length, 3);
  assert.match(h, /남은 약/);
});
test('large meds widget keeps taken doses as filled checks', () => {
  const log = { [key('me', 'a', '19:00')]: 'x' };
  const h = widgetBody('w:meds', 'l', { ...base, meds: { summary: medsSummary(cfg, log, now), log } });
  assert.match(h, /w-tg\s+on|w-tg  on|class="w-tg  on/);
  assert.match(h, /1\/2/);
});
test('meds widget with nothing set up says what to do', () => {
  const h = widgetBody('w:meds', 's', { ...base, meds: { summary: medsSummary({ people: [] }, {}, now), log: {} } });
  assert.match(h, /약 앱에서/);
});
test('calendar: not connected explains how, loading shows placeholders', () => {
  assert.match(widgetBody('w:cal', 'm', base), /구글 캘린더를 연결/);
  assert.match(widgetBody('w:cal', 'm', { ...base, cal: { state: 'loading', events: [] } }), /w-ph/);
});
test('calendar shows upcoming events with day labels and marks birthdays', () => {
  const ev = (id, title, d, h) => ({ id, title, start: new Date(2026, 10, d, h), end: new Date(2026, 10, d, h + 1), allDay: false });
  const events = [ev('1', '치과', 24, 10), ev('2', '엄마 생신', 23, 21)];
  const h = widgetBody('w:cal', 's', { ...base, cal: { state: 'ok', events, at: +now } });
  assert.ok(h.indexOf('엄마 생신') < h.indexOf('치과'));
  assert.match(h, /오늘 21:00/);
  assert.match(h, /내일 10:00/);
  assert.match(h, /w-cake/);
});
test('calendar says when data is old', () => {
  const h = widgetBody('w:cal', 'm', { ...base, cal: { state: 'ok', events: [], at: +now - 3 * 3600000 } });
  assert.match(h, /3시간 전 업데이트/);
});
test('weather: off asks to turn on, on shows temp, high/low, and hours in medium', () => {
  assert.match(widgetBody('w:wx', 's', base), /날씨를 켜면/);
  const w = { temp: 5, code: 2, max: 8, min: 1, hours: [{ h: 21, temp: 4, code: 3 }] };
  const s = widgetBody('w:wx', 's', { ...base, wx: { state: 'ok', w } });
  assert.match(s, /5°/); assert.match(s, /최고:8° 최저:1°/);
  assert.match(widgetBody('w:wx', 'm', { ...base, wx: { state: 'ok', w } }), /21시/);
});
test('weather sky follows day/night and condition', () => {
  assert.equal(skyOf(0, 12), 'sky-day');
  assert.equal(skyOf(0, 22), 'sky-night');
  assert.equal(skyOf(61, 12), 'sky-wet');
  assert.equal(skyOf(3, 3), 'sky-ncloud');
  assert.match(widgetBox('w:wx', 's', { ...base, wx: { state: 'ok', w: { temp: 1, code: 0, max: 2, min: 0 } } }), /sky-night/);
});
test('coffee: beans and water are the big numbers, last used recipe first', () => {
  const recipes = [{ id: 'r1', name: '기본', dose: 15, water: 250, steps: [{ sec: 180 }] }, { id: 'r2', name: '인디아', dose: 20, water: 180, temp: 93, grind: '11', ice: 150, steps: [{ sec: 60 }] }];
  const s = widgetBody('w:coffee', 's', { ...base, coffee: { recipes, current: recipes[1] } });
  assert.match(s, /20<i>g<\/i>/);
  assert.match(s, /180<i>ml<\/i>/);
  assert.match(s, /인디아/);
  assert.match(s, /93° · 분쇄 11</);
  assert.match(s, /data-play="r2"/);
  // 원두·물은 한 줄에 (FigCraft에서 고친 모양), 머리의 컵은 큰 컵
  assert.equal((s.match(/class="w-big/g) || []).length, 1);
  assert.match(s, /20<i>g<\/i>.*180<i>ml<\/i>/);
  assert.match(s, /w-cup/);
  // 온도·분쇄도가 없는 레시피는 아래 줄 없음 (숫자만 깔끔하게)
  assert.ok(!widgetBody('w:coffee', 's', { ...base, coffee: { recipes } }).includes('w-sub'));
  const m = widgetBody('w:coffee', 'm', { ...base, coffee: { recipes, current: recipes[1] } });
  assert.equal((m.match(/data-play=/g) || []).length, 2);
  assert.match(m, /15g · 250ml/);
  assert.match(m, /93° · 분쇄 11</);
});
test('coffee while brewing shows the step, pour target and time left', () => {
  const recipes = [{ id: 'r1', name: '기본', dose: 15, water: 250, steps: [{ sec: 180 }] }];
  const h = widgetBody('w:coffee', 's', { ...base, coffee: { recipes, running: { name: '기본', step: { label: '1차 붓기', pourTo: 150 }, remain: 130, done: false } } });
  assert.match(h, /150<i>ml까지/);
  assert.match(h, /1차 붓기/);
  assert.match(h, /남은 시간 2:10/);
  assert.match(h, /data-open-coffee/);
});
test('names are escaped', () => {
  const evil = { people: [{ id: 'x', name: '<b>', meds: [{ id: 'm', name: '<img>', times: ['21:00'] }] }] };
  const h = widgetBody('w:meds', 'm', { ...base, meds: { summary: medsSummary(evil, {}, now), log: {} } });
  assert.ok(!h.includes('<img>') && !h.includes('<b><'));
});
test('every widget has a gallery description ending with an action', () => {
  for (const i of Object.values(WIDGET_INFO)) assert.match(i.desc, /(세요|보세요)\.$/);
});
