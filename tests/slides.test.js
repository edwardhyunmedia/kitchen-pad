import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFrame } from '../shared/slides.js';

const center = (r, f, iw, ih) => [r.x + f[0] * r.w, r.y + f[1] * r.h];

test('a face in the middle of a wide photo lands in the screen centre without zoom', () => {
  const r = computeFrame(800, 1280, 1400, 934, [0.5, 0.5]);
  const [cx, cy] = center(r, [0.5, 0.5]);
  assert.ok(Math.abs(cx - 400) < 1 && Math.abs(cy - 640) < 1);
  assert.ok(Math.abs(r.h - 1280) < 1, 'cover only');
});
test('a face near the right edge of a wide photo is still centred (photo slides over)', () => {
  const f = [0.8, 0.45];
  const r = computeFrame(800, 1280, 1400, 934, f);
  const [cx] = center(r, f);
  assert.ok(Math.abs(cx - 400) < 1, `x ${cx}`);
  assert.ok(r.x <= 0 && r.x + r.w >= 800, 'screen stays covered');
});
test('a face at the very top of a tall photo zooms in a little to centre it, never above 1.8x', () => {
  const f = [0.5, 0.1];
  const r = computeFrame(800, 1280, 900, 1350, f);
  const cover = Math.max(800 / 900, 1280 / 1350);
  assert.ok(r.w / (900 * cover) <= 1.8 + 1e-9);
  assert.ok(r.y <= 0 && r.y + r.h >= 1280, 'screen stays covered');
});
test('no face → plain cover, slightly above middle', () => {
  const r = computeFrame(800, 1280, 1400, 934, null);
  assert.ok(Math.abs(r.h - 1280) < 1);
});
