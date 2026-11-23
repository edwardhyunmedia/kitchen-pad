import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RECIPES, timerState, totalSec, Timer } from '../coffee/logic.js';

const basic = DEFAULT_RECIPES.find(r => r.id === 'basic');

test('defaults', () => {
  assert.deepEqual(DEFAULT_RECIPES.map(r => r.id), ['basic', 'strong']);
  assert.equal(totalSec(basic), 180);
});
test('start', () => assert.deepEqual(timerState(basic, 0), { stepIndex: 0, stepRemaining: 40, totalRemaining: 180, done: false }));
test('step 2 begins at 40', () => assert.equal(timerState(basic, 40).stepIndex, 1));
test('near end', () => {
  const s = timerState(basic, 179);
  assert.equal(s.stepIndex, 3); assert.equal(s.totalRemaining, 1); assert.equal(s.done, false);
});
test('done', () => { assert.equal(timerState(basic, 180).done, true); assert.equal(timerState(basic, 999).totalRemaining, 0); });
test('pause and resume continues', () => {
  const t = new Timer(); t.start(0); t.pause(10); assert.equal(t.elapsed(50), 10);
  t.start(100); assert.equal(t.elapsed(105), 15); assert.equal(t.running, true);
});
test('reset', () => { const t = new Timer(); t.start(0); t.reset(); assert.equal(t.elapsed(99), 0); assert.equal(t.running, false); });

import { runElapsed, startRun, pauseRun } from '../coffee/logic.js';
test('persisted run survives page change', () => {
  let r = startRun(null, 'basic', 1000);
  assert.equal(runElapsed(r, 6000), 5);
  r = pauseRun(r, 11000);
  assert.equal(runElapsed(r, 99000), 10);
  r = startRun(r, 'basic', 20000);
  assert.equal(runElapsed(r, 22000), 12);
  assert.equal(startRun(r, 'strong', 30000).recipeId, 'strong');
  assert.equal(runElapsed(startRun(r, 'strong', 30000), 30000), 0);
});

import { SEED_RECIPES, mergeSeeds } from '../coffee/logic.js';
test('deep blue lake recipe timing', () => {
  const r = SEED_RECIPES.find(x => x.id === 'dbl-india');
  assert.equal(r.dose, 20); assert.equal(r.water, 180); assert.equal(r.temp, 93); assert.equal(r.ice, 150);
  assert.deepEqual(r.steps.map(s => s.sec), [40, 20, 20, 30, 50]);
  assert.deepEqual(r.steps.map(s => s.pourTo ?? null), [40, 110, null, 180, null]);
  assert.equal(totalSec(r), 160); // 2:40에 끝
  assert.equal(timerState(r, 85).stepIndex, 3); // 1:25 = 2차 붓기
});
test('seed added once to saved recipes, not again after delete', () => {
  const saved = [{ id: 'mine', name: '내 것', dose: 15, water: 250, steps: [{ label: 'a', sec: 10 }] }];
  const a = mergeSeeds(saved, [], SEED_RECIPES);
  assert.deepEqual(a.recipes.map(r => r.id), ['mine', 'dbl-india']);
  assert.deepEqual(a.seeded, ['dbl-india']);
  const b = mergeSeeds([saved[0]], a.seeded, SEED_RECIPES); // 사용자가 지운 뒤
  assert.deepEqual(b.recipes.map(r => r.id), ['mine']);
  assert.equal(b.changed, false);
});
