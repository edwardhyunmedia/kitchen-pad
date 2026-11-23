import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allItems, itemSize, defaultLayout, normalizeLayout, moveItem, removeItem, addItem, addable } from '../shared/layout.js';

const people = [{ id: 'me', name: '나' }, { id: 'wife', name: '아내' }];

test('all items: apps plus one meds widget, coffee, calendar', () => {
  assert.deepEqual(allItems(people), ['app:meds', 'app:coffee', 'app:settings', 'w:meds', 'w:coffee', 'w:cal']);
});
test('sizes', () => {
  assert.equal(itemSize('app:meds'), 'app');
  assert.equal(itemSize('w:meds'), 'big');
  assert.equal(itemSize('w:coffee'), 'square');
  assert.equal(itemSize('w:cal'), 'wide');
});
test('old layout with per-person and next-dose widgets becomes the new default', () => {
  const old = ['app:meds', 'app:coffee', 'w:person:me', 'app:settings', 'w:person:wife', 'w:coffee', 'w:cal', 'w:next'];
  assert.deepEqual(normalizeLayout(old, people), defaultLayout(people));
});
test('default layout contains everything once', () => {
  const d = defaultLayout(people);
  assert.deepEqual([...d].sort(), allItems(people).sort());
});
test('normalize drops unknown and duplicates, keeps order', () => {
  const out = normalizeLayout(['w:ghost', 'app:coffee', 'app:coffee', 'app:meds'], people);
  assert.deepEqual(out, ['app:coffee', 'app:meds']);
});
test('normalize of missing/garbage returns default', () => {
  assert.deepEqual(normalizeLayout(null, people), defaultLayout(people));
  assert.deepEqual(normalizeLayout('x', people), defaultLayout(people));
});
test('move takes target slot', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 'd', 'b'), ['a', 'd', 'b', 'c']);
  assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 'a', 'c'), ['b', 'c', 'a', 'd']); // 앞으로 끌면 대상 자리를 차지
  assert.deepEqual(moveItem(['a', 'b'], 'a', null), ['b', 'a']);
  assert.deepEqual(moveItem(['a', 'b'], 'a', 'a'), ['a', 'b']);
});
test('remove and add back', () => {
  const l = removeItem(['app:meds', 'w:coffee'], 'w:coffee');
  assert.deepEqual(l, ['app:meds']);
  assert.ok(addable(l, people).includes('w:coffee'));
  assert.deepEqual(addItem(l, 'w:coffee'), ['app:meds', 'w:coffee']);
  assert.deepEqual(addItem(['app:meds'], 'app:meds'), ['app:meds']);
});
test('a removed meds widget can be added back', () => {
  assert.ok(addable(['app:meds'], people).includes('w:meds'));
});
