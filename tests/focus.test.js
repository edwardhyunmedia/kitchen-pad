import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { focusFromDets, detect } from '../shared/focus.js';
import pico from '../shared/vendor/pico.mjs';

test('no faces → no focus', () => {
  assert.equal(focusFromDets([], 100, 100), null);
  assert.equal(focusFromDets([[50, 50, 20, 1]], 100, 100), null);
});
test('focus follows the bigger face', () => {
  const f = focusFromDets([[30, 80, 40, 20], [70, 10, 10, 20]], 100, 100);
  assert.ok(f[0] > 0.7 && f[1] < 0.45, String(f));
});
test('finds the faces in a real wide photo (they sit on the right)', () => {
  const run = pico.unpack_cascade(new Int8Array(readFileSync(new URL('../shared/vendor/facefinder.bin', import.meta.url))));
  // P5 PGM (흑백) 사진: 왼쪽은 빈 배경, 오른쪽에 사람 얼굴들
  const buf = readFileSync(new URL('./fixtures/faces-wide.pgm', import.meta.url));
  const head = buf.toString('latin1', 0, 32).split(/\s+/);
  const w = Number(head[1]), h = Number(head[2]);
  const gray = new Uint8Array(buf.subarray(buf.length - w * h));
  const f = focusFromDets(detect(gray, w, h, run), w, h);
  assert.ok(f, 'face found');
  assert.ok(f[0] > 0.55, 'focus on right side: ' + f);
});
