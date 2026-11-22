import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNight } from '../shared/night-logic.js';

const at = (h, m) => new Date(2026, 10, 23, h, m);
test('wraps past midnight (22:00-06:00)', () => {
  assert.equal(isNight(at(23, 0), '22:00', '06:00'), true);
  assert.equal(isNight(at(5, 59), '22:00', '06:00'), true);
  assert.equal(isNight(at(6, 0), '22:00', '06:00'), false);
  assert.equal(isNight(at(12, 0), '22:00', '06:00'), false);
});
test('same-day range (00:00-06:00)', () => {
  assert.equal(isNight(at(0, 0), '00:00', '06:00'), true);
  assert.equal(isNight(at(23, 59), '00:00', '06:00'), false);
  assert.equal(isNight(at(6, 0), '00:00', '06:00'), false);
});
test('equal or broken times mean off', () => {
  assert.equal(isNight(at(1, 0), '06:00', '06:00'), false);
  assert.equal(isNight(at(1, 0), 'x', '06:00'), false);
});
