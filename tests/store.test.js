import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save, setStorage } from '../shared/store.js';

function fake() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; }

test('save then load', () => { setStorage(fake()); save('a', { x: 1 }); assert.deepEqual(load('a', null), { x: 1 }); });
test('missing key returns fallback', () => { setStorage(fake()); assert.deepEqual(load('none', { d: 1 }), { d: 1 }); });
test('broken json returns fallback', () => { const s = fake(); s.setItem('kp.b', '{깨짐'); setStorage(s); assert.equal(load('b', 7), 7); });
test('fallback is not shared', () => { setStorage(fake()); const fb = { list: [] }; load('z', fb).list.push(1); assert.deepEqual(load('z', fb), { list: [] }); });
test('storage throwing returns fallback', () => { setStorage({ getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } }); assert.equal(load('q', 3), 3); save('q', 1); });
