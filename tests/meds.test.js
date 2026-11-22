import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, dateKey, slotKey, todaySlots, toggleTaken, pendingAlarms, pruneLog } from '../meds/logic.js';

const cfg = {
  remindAfterMin: 30, maxRemind: 2,
  people: [{ id: 'me', name: '나', meds: [{ id: 'm1', name: '약A', times: ['20:00', '08:00'] }] }, { id: 'wife', name: '아내', meds: [] }],
};
const at = (h, m, day = 22) => new Date(2026, 10, day, h, m);
const k8 = slotKey('2026-11-22', 'me', 'm1', '08:00');

test('defaults', () => {
  assert.equal(DEFAULT_CONFIG.remindAfterMin, 30);
  assert.deepEqual(DEFAULT_CONFIG.people.map(p => p.name), ['나', '아내']);
});
test('dateKey local', () => assert.equal(dateKey(at(0, 5)), '2026-11-22'));
test('todaySlots sorted by time', () => {
  const s = todaySlots(cfg, at(9, 0));
  assert.deepEqual(s.map(x => x.time), ['08:00', '20:00']);
  assert.equal(s[0].key, k8);
  assert.equal(s[0].medName, '약A');
});
test('before time: nothing', () => assert.deepEqual(pendingAlarms(cfg, {}, {}, at(7, 59)), []));
test('at time: round 0', () => {
  const p = pendingAlarms(cfg, {}, {}, at(8, 0));
  assert.equal(p.length, 1); assert.equal(p[0].round, 0); assert.equal(p[0].ackKey, k8 + '#0');
});
test('acked round 0 silent until remind', () => {
  const acks = { [k8 + '#0']: true };
  assert.deepEqual(pendingAlarms(cfg, {}, acks, at(8, 10)), []);
  const p = pendingAlarms(cfg, {}, acks, at(8, 30));
  assert.equal(p.length, 1); assert.equal(p[0].round, 1);
});
test('taken right after time: no remind', () => {
  const log = toggleTaken({}, k8, at(8, 5));
  assert.deepEqual(pendingAlarms(cfg, log, {}, at(8, 40)), []);
});
test('long offline: one alarm per slot, capped round', () => {
  const p = pendingAlarms(cfg, {}, {}, at(15, 0));
  assert.equal(p.length, 1); assert.equal(p[0].round, 2);
});
test('after midnight: yesterday log does not carry over', () => {
  const log = toggleTaken({}, k8, at(8, 1));
  const p = pendingAlarms(cfg, log, {}, at(8, 10, 23));
  assert.equal(p.length, 1); assert.ok(p[0].key.startsWith('2026-11-23'));
  assert.deepEqual(pendingAlarms(cfg, {}, {}, at(0, 10, 23)), []);
});
test('toggle twice restores', () => {
  const a = toggleTaken({}, k8, at(8, 1));
  assert.ok(a[k8]);
  assert.deepEqual(toggleTaken(a, k8, at(8, 2)), {});
});
test('pruneLog keeps 90 days', () => {
  const old = slotKey('2026-08-23', 'me', 'm1', '08:00'); // 91일 전
  const keep = slotKey('2026-08-25', 'me', 'm1', '08:00'); // 89일 전
  const out = pruneLog({ [old]: 'x', [keep + '#0']: true }, '2026-11-22');
  assert.deepEqual(Object.keys(out), [keep + '#0']);
});
