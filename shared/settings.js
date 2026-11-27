// 전체 설정 + 배경 사진 (사진은 태블릿 브라우저의 IndexedDB에만 저장, 밖으로 안 나감)
import { load, save } from './store.js';
import { DEFAULT_FACE } from './faces.js';

export const DEFAULT_SETTINGS = { weather: false, album: false, albumSec: 60, idleSec: 30, face: DEFAULT_FACE, bg: { type: 'default', blur: 18, dim: 0.18 }, night: { on: true, from: '00:00', to: '06:00', dimScreen: true, idleDim: 120 } };

export function getSettings() {
  const s = load('settings', {});
  return { ...DEFAULT_SETTINGS, ...s, face: { ...DEFAULT_FACE, ...(s.face || {}) }, bg: { ...DEFAULT_SETTINGS.bg, ...(s.bg || {}) }, night: { ...DEFAULT_SETTINGS.night, ...(s.night || {}) } };
}
export function setSettings(patch) {
  const next = { ...getSettings(), ...patch };
  save('settings', next);
  window.dispatchEvent(new Event('kp-settings-changed'));
  return next;
}

function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('kp', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idb(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction('files', mode);
    const req = fn(tx.objectStore('files'));
    tx.oncomplete = () => res(req?.result);
    tx.onerror = () => rej(tx.error);
  });
}

// 사진을 max px 이하 JPEG로 줄여서 저장 (기기 안 IndexedDB에만)
export async function savePhotoAs(key, file, max = 1600) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.86));
  await idb('readwrite', s => s.put(blob, key));
  if (urls[key]) URL.revokeObjectURL(urls[key]);
  delete urls[key];
  return getPhotoUrlFor(key);
}
const urls = {};
export async function getPhotoUrlFor(key) {
  if (urls[key]) return urls[key];
  try {
    const blob = await idb('readonly', s => s.get(key));
    if (blob) urls[key] = URL.createObjectURL(blob);
  } catch { /* 사진 없음 */ }
  return urls[key] || null;
}
export async function deletePhotoFor(key) {
  try { await idb('readwrite', s => s.delete(key)); } catch { /* 없음 */ }
  if (urls[key]) URL.revokeObjectURL(urls[key]);
  delete urls[key];
}
export async function savePhoto(file) { photoUrl = null; return savePhotoAs('bg', file); }
let photoUrl = null;
export async function getPhotoUrl() {
  if (photoUrl) return photoUrl;
  photoUrl = await getPhotoUrlFor('bg');
  return photoUrl;
}
export async function deletePhoto() {
  await deletePhotoFor('bg');
  photoUrl = null;
}
