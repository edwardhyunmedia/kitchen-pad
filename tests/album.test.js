import { test } from 'node:test';
import assert from 'node:assert/strict';
import { albumUrl, pickPhoto, cleanPhotos } from '../shared/album.js';

test('album url adds a=photos and keeps the key', () => {
  const u = new URL(albumUrl('https://script.google.com/macros/s/X/exec?t=abc'));
  assert.equal(u.searchParams.get('t'), 'abc');
  assert.equal(u.searchParams.get('a'), 'photos');
});
test('pick rotates every N minutes and wraps', () => {
  const ps = [{ url: 'a' }, { url: 'b' }, { url: 'c' }];
  const m = 60000;
  assert.equal(pickPhoto(ps, 0, 5).url, 'a');
  assert.equal(pickPhoto(ps, 5 * m, 5).url, 'b');
  assert.equal(pickPhoto(ps, 15 * m, 5).url, 'a');
  assert.equal(pickPhoto([], 0, 5), null);
});
test('only https apple photo addresses are kept', () => {
  const out = cleanPhotos([{ url: 'https://cvws.icloud-content.com/x' }, { url: 'http://cvws.icloud-content.com/y' }, { url: 'https://evil.com/z' }, null, { url: 'javascript:1' }]);
  assert.deepEqual(out.map(p => p.url), ['https://cvws.icloud-content.com/x']);
});
import { freshUntil } from '../shared/album.js';
test('album list is refreshed 3 minutes before the first photo address expires', () => {
  const at = 1_000_000_000_000;
  const exp = Math.floor(at / 1000) + 20 * 60;
  const ps = [{ url: `https://cvws.icloud-content.com/a?e=${exp}` }, { url: `https://cvws.icloud-content.com/b?e=${exp + 600}` }];
  assert.equal(freshUntil(ps, at), exp * 1000 - 3 * 60000);
  assert.equal(freshUntil([{ url: 'https://cvws.icloud-content.com/c' }], at), at + 25 * 60000);
});
