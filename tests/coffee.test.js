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
test('seeds added once, deep blue lake first, not re-added after delete', () => {
  const saved = [{ id: 'mine', name: '내 것', dose: 15, water: 250, steps: [{ label: 'a', sec: 10 }] }];
  const a = mergeSeeds(saved, [], SEED_RECIPES);
  assert.equal(a.recipes[0].id, 'dbl-india');
  assert.deepEqual(a.recipes.map(r => r.id).sort(), ['mine', ...SEED_RECIPES.map(r => r.id)].sort());
  const b = mergeSeeds(a.recipes.filter(r => r.id !== 'kasuya-46'), a.seeded, SEED_RECIPES); // 사용자가 지운 뒤
  assert.ok(!b.recipes.some(r => r.id === 'kasuya-46'));
  assert.equal(b.changed, false);
  // 사용자가 순서를 바꿔도 다시 정렬하지 않음
  const moved = [a.recipes[1], a.recipes[0], ...a.recipes.slice(2)];
  assert.equal(mergeSeeds(moved, a.seeded, SEED_RECIPES).recipes[0].id, a.recipes[1].id);
});
test('online recipes: pours add up and end at the brew water', () => {
  for (const r of SEED_RECIPES) {
    const pours = r.steps.filter(s => s.pourTo).map(s => s.pourTo);
    assert.deepEqual(pours, [...pours].sort((x, y) => x - y), r.id);
    assert.equal(pours.at(-1), r.water, r.id);
  }
  assert.equal(totalSec(SEED_RECIPES.find(r => r.id === 'hoffmann-v60')), 210); // 3:30
  assert.equal(totalSec(SEED_RECIPES.find(r => r.id === 'hoffmann-1cup')), 180); // 3:00
  assert.equal(totalSec(SEED_RECIPES.find(r => r.id === 'kasuya-46')), 210); // 3:30
});

test('딥블루레이크 이름은 "인디아 블렌드"로 한 번만 바뀜 (사용자가 고친 이름은 그대로)', () => {
  const old = { id: 'dbl-india', name: '딥블루레이크 인디아 블랜드', dose: 20, water: 180, steps: [{ name: 'a', sec: 10 }] };
  const r1 = mergeSeeds([old], []);
  assert.equal(r1.recipes.find(x => x.id === 'dbl-india').name, '인디아 블렌드');
  assert.ok(r1.changed);
  const mine = { ...old, name: '내가 바꾼 이름' };
  const r2 = mergeSeeds([mine], []);
  assert.equal(r2.recipes.find(x => x.id === 'dbl-india').name, '내가 바꾼 이름');
  const again = mergeSeeds(r1.recipes, r1.seeded);
  assert.equal(again.changed, false);
  assert.equal(SEED_RECIPES.find(x => x.id === 'dbl-india').name, '인디아 블렌드');
});

import { TIMEMORE_CLICKS, grindLabel } from '../coffee/logic.js';
test('분쇄는 타임모어 C3 클릭 기준: 모든 기본·시드 레시피에 온도와 클릭', () => {
  for (const r of [...DEFAULT_RECIPES, ...SEED_RECIPES]) {
    assert.match(r.grind, /^\d+클릭$/, r.id);
    assert.ok(r.temp > 0, r.id);
  }
  const c = id => parseInt([...DEFAULT_RECIPES, ...SEED_RECIPES].find(r => r.id === id).grind);
  assert.ok(c('iced-v60') < c('hoffmann-v60') && c('hoffmann-v60') < c('hoffmann-chemex') && c('hoffmann-chemex') < c('kasuya-46'));
  assert.equal(c('dbl-india'), 11);
});
test('저장된 레시피의 옛 분쇄 표기는 한 번만 클릭으로 (사용자가 고친 값은 그대로)', () => {
  const saved = [
    { id: 'basic', name: '기본', dose: 15, water: 250, steps: [{ label: 'a', sec: 10 }] },
    { id: 'dbl-india', name: '인디아 블렌드', dose: 20, water: 180, temp: 93, grind: '11~11.3', steps: [{ label: 'a', sec: 10 }] },
    { id: 'kasuya-46', name: '카스야', dose: 20, water: 300, temp: 92, grind: '내 설정', steps: [{ label: 'a', sec: 10 }] },
  ];
  const a = mergeSeeds(saved, SEED_RECIPES.map(r => r.id).concat('order:dbl-first', 'rename:dbl-short'));
  const g = id => a.recipes.find(r => r.id === id);
  assert.equal(g('basic').grind, TIMEMORE_CLICKS.basic);
  assert.equal(g('basic').temp, 93);
  assert.equal(g('dbl-india').grind, '11클릭');
  assert.equal(g('kasuya-46').grind, '내 설정');
  assert.ok(a.changed);
  assert.equal(mergeSeeds(a.recipes, a.seeded).changed, false);
});
test('분쇄 칸 이름: 클릭이면 타임모어 C3 기준이라고 표시', () => {
  assert.equal(grindLabel('16클릭'), '분쇄 · 타임모어 C3');
  assert.equal(grindLabel('굵게'), '분쇄');
  assert.equal(grindLabel(undefined), '분쇄');
});

import { photoOf } from '../coffee/about.js';
import { existsSync } from 'node:fs';
test('카드 사진: 모든 기본·시드 레시피에 실제 사진 파일, 내 레시피는 얼음 여부로 대체', () => {
  for (const r of [...DEFAULT_RECIPES, ...SEED_RECIPES]) assert.ok(existsSync(new URL(`../coffee/${photoOf(r)}`, import.meta.url)), r.id);
  assert.equal(photoOf({ id: 'mine', ice: 100 }), photoOf({ id: 'iced-v60' }));
  assert.equal(photoOf({ id: 'mine' }), photoOf({ id: 'basic' }));
});
