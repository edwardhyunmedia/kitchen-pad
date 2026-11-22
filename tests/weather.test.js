import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codeInfo, buildUrl, parse, isFresh, LOCATION } from '../shared/weather.js';

test('code mapping', () => {
  assert.equal(codeInfo(0).label, '맑음');
  assert.equal(codeInfo(2).icon, 'partly');
  assert.equal(codeInfo(61).icon, 'rain');
  assert.equal(codeInfo(73).icon, 'snow');
  assert.equal(codeInfo(999).icon, 'cloud');
});
test('url sends only fixed area coordinates', () => {
  const u = new URL(buildUrl());
  assert.equal(u.hostname, 'api.open-meteo.com');
  assert.equal(u.searchParams.get('latitude'), String(LOCATION.lat));
  assert.equal(u.searchParams.get('longitude'), String(LOCATION.lon));
  assert.deepEqual([...u.searchParams.keys()].sort(), ['current', 'daily', 'forecast_days', 'latitude', 'longitude', 'timezone']);
});
test('parse', () => {
  const w = parse({ current: { temperature_2m: 11.6, weather_code: 2 }, daily: { temperature_2m_max: [15.2], temperature_2m_min: [5.9] } }, 1000);
  assert.deepEqual(w, { temp: 12, code: 2, max: 15, min: 6, at: 1000 });
  assert.equal(parse({}, 1), null);
});
test('freshness 30 min', () => {
  assert.equal(isFresh({ at: 0 }, 29 * 60000), true);
  assert.equal(isFresh({ at: 0 }, 31 * 60000), false);
  assert.equal(isFresh(null, 0), false);
});
