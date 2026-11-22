import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allItems, itemSize, defaultLayout, normalizeLayout, moveItem, removeItem, addItem, addable } from '../shared/layout.js';

const people = [{ id: 'me', name: '나' }, { id: 'wife', name: '아내' }];

test('all items include apps and widgets per person', () => {
  const ids = allItems(people);
  for (const id of ['app:meds', 'app:coffee', 'app:settings', 'w:person:me', 'w:person:wife', 'w:coffee', 'w:next']) assert.ok(ids.includes(id), id);
});
test('sizes', () => {
  assert.equal(itemSize('app:meds'), 'app');
  assert.equal(itemSize('w:person:me'), 'square');
  assert.equal(itemSize('w:next'), 'wide');
});
test('default layout contains everything once', () => {
  const d = defaultLayout(people);
  assert.deepEqual([...d].sort(), allItems(people).sort());
});
test('normalize drops unknown and duplicates, keeps order', () => {
  const out = normalizeLayout(['w:person:ghost', 'app:coffee', 'app:coffee', 'app:meds'], people);
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
test('a new person shows up as addable, not auto-inserted', () => {
  const saved = normalizeLayout(['app:meds'], people);
  assert.ok(addable(saved, [...people, { id: 'p3', name: '엄마' }]).includes('w:person:p3'));
});
