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
  assert.deepEqual([...u.searchParams.keys()].sort(), ['current', 'daily', 'forecast_days', 'hourly', 'latitude', 'longitude', 'timezone']);
});
test('parse', () => {
  const w = parse({ current: { temperature_2m: 11.6, weather_code: 2 }, daily: { temperature_2m_max: [15.2], temperature_2m_min: [5.9] } }, 1000);
  assert.deepEqual(w, { temp: 12, code: 2, max: 15, min: 6, at: 1000, hours: [] });
  assert.equal(parse({}, 1), null);
});
test('parse keeps the next 6 hours after now (Seoul local time)', () => {
  const time = Array.from({ length: 30 }, (_, i) => `2026-11-23T${String(i % 24).padStart(2, '0')}:00`.replace(/T(\d\d)/, (m, h) => (i >= 24 ? `T${h}` : m)));
  const days = time.map((t, i) => (i >= 24 ? t.replace('2026-11-23', '2026-11-24') : t));
  const now = new Date('2026-11-23T20:10:00+09:00').getTime();
  const w = parse({ current: { temperature_2m: 5, weather_code: 2 }, daily: { temperature_2m_max: [8], temperature_2m_min: [1] },
    hourly: { time: days, temperature_2m: days.map((_, i) => i), weather_code: days.map(() => 3) } }, now);
  assert.deepEqual(w.hours.map(h => h.h), [21, 22, 23, 0, 1, 2]);
  assert.deepEqual(w.hours.map(h => h.temp), [21, 22, 23, 24, 25, 26]);
  assert.equal(w.hours[0].code, 3);
});
test('freshness 30 min', () => {
  assert.equal(isFresh({ at: 0 }, 29 * 60000), true);
  assert.equal(isFresh({ at: 0 }, 31 * 60000), false);
  assert.equal(isFresh(null, 0), false);
});
