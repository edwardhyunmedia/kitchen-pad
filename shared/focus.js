// 사진에서 얼굴 위치를 찾아 화면에 꽉 채울 때 얼굴이 잘리지 않게 할 '초점' 계산
// 태블릿 안에서만 계산함 (사진을 다른 곳으로 보내지 않음). 결과는 사진별로 저장해 두고 다시 쓰지 않음
import pico from './vendor/pico.mjs';
import { load, save } from './store.js';

// 얼굴 후보들 → 초점 [x, y] (0~1). 얼굴이 없으면 null
// dets: [행, 열, 크기, 점수]
export function focusFromDets(dets, w, h, q = 5) {
  const faces = (dets || []).filter(d => d[3] > q);
  if (!faces.length) return null;
  let sx = 0, sy = 0, sw = 0;
  for (const [r, c, s, score] of faces) { const wt = s * s * Math.min(score, 50); sx += c * wt; sy += r * wt; sw += wt; }
  const clamp = v => Math.max(0, Math.min(1, v));
  return [clamp(sx / sw / w), clamp(sy / sw / h)];
}

export const photoKey = url => { try { const u = new URL(url, location.href); return u.protocol === 'blob:' ? '' : u.pathname; } catch { return ''; } };

let classify = null;
async function cascade() {
  if (!classify) {
    const r = await fetch(new URL('./vendor/facefinder.bin', import.meta.url));
    classify = pico.unpack_cascade(new Int8Array(await r.arrayBuffer()));
  }
  return classify;
}

export function grayscale(rgba, w, h) {
  const g = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (2 * rgba[j] + 7 * rgba[j + 1] + rgba[j + 2]) / 10;
  return g;
}

export function detect(gray, w, h, run = cascade) {
  const params = { shiftfactor: 0.1, minsize: Math.max(20, Math.round(Math.min(w, h) * 0.06)), maxsize: Math.max(w, h), scalefactor: 1.1 };
  return pico.cluster_detections(pico.run_cascade({ pixels: gray, nrows: h, ncols: w, ldim: w }, run, params), 0.2);
}

// 저장된 초점 (없으면 undefined, 얼굴 없음은 null)
export const savedFocus = url => { const k = photoKey(url); return k ? load('album.focus', {})[k] : undefined; };

export async function findFocus(url) {
  const k = photoKey(url);
  const all = load('album.focus', {});
  if (k && k in all) return all[k];
  const blob = await fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); });
  const bmp = await createImageBitmap(blob);
  const k2 = Math.min(1, 480 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k2), h = Math.round(bmp.height * k2);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const run = await cascade();
  const f = focusFromDets(detect(grayscale(ctx.getImageData(0, 0, w, h).data, w, h), w, h, run), w, h);
  if (k) {
    const keys = Object.keys(all);
    if (keys.length > 300) delete all[keys[0]];
    all[k] = f;
    save('album.focus', all);
  }
  return f;
}
