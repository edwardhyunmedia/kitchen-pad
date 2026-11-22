import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medsSummary } from '../shared/summary.js';
import { slotKey } from '../meds/logic.js';

const cfg = { remindAfterMin: 30, maxRemind: 2, people: [
  { id: 'me', name: '나', meds: [{ id: 'a', name: '비타민', times: ['08:00', '18:00'] }, { id: 'b', name: '오메가3', times: ['20:00'] }] },
  { id: 'wife', name: '아내', meds: [{ id: 'c', name: '철분', times: ['08:00'] }] },
  { id: 'kid', name: '엄마', meds: [] }] };
const now = new Date(2026, 10, 22, 19, 0);
const log = { [slotKey('2026-11-22', 'me', 'a', '08:00')]: 'x', [slotKey('2026-11-22', 'wife', 'c', '08:00')]: 'y' };

test('per person', () => {
  const s = medsSummary(cfg, log, now);
  const me = s.people.find(p => p.id === 'me');
  assert.equal(me.total, 3); assert.equal(me.left, 2); assert.equal(me.late, 1);
  assert.equal(me.lateMed, '비타민'); assert.equal(me.lateTime, '18:00');
  assert.equal(me.nextTime, '20:00'); assert.equal(me.nextMed, '오메가3');
  const w = s.people.find(p => p.id === 'wife');
  assert.equal(w.allDone, true);
  assert.equal(s.people.find(p => p.id === 'kid').total, 0);
});
test('next overall upcoming slot', () => {
  const s = medsSummary(cfg, log, now);
  assert.deepEqual([s.next.time, s.next.medName, s.next.personName], ['20:00', '오메가3', '나']);
  assert.equal(medsSummary(cfg, log, new Date(2026, 10, 22, 21, 0)).next, null);
});
