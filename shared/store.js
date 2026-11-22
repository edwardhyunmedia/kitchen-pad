// 태블릿 브라우저 안(localStorage)에만 저장. 밖으로 보내는 코드 없음.
const PREFIX = 'kp.';
let storage = typeof localStorage !== 'undefined' ? localStorage : null;

export function setStorage(s) { storage = s; }

const copy = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function load(key, fallback) {
  try {
    const raw = storage && storage.getItem(PREFIX + key);
    if (raw == null) return copy(fallback);
    return JSON.parse(raw);
  } catch {
    return copy(fallback);
  }
}

export function save(key, value) {
  try { storage && storage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* 저장 실패는 무시 */ }
}
