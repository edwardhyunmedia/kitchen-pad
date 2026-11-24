import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tileHeight } from '../shared/fit.js';

test('실기기(533×853)에서 두 줄이 하단 버튼 위에 딱 맞음', () => {
  const h = tileHeight({ subBottom: 135, gapBelowSub: 18, btnTop: 766, gap: 16.5 });
  assert.equal(h, 290);
  assert.ok(153 + h * 2 + 16.5 <= 766 - 16.5);
});
test('공간이 없으면 0', () => {
  assert.equal(tileHeight({ subBottom: 500, gapBelowSub: 0, btnTop: 400, gap: 10 }), 0);
});
