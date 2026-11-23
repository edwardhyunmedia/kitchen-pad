// 사진 시계 슬라이드: 두 장을 겹쳐 두고, 다음 사진을 다 받은 뒤에 천천히 바꿈(디졸브)
// 시계 글자를 다시 그려도 사진은 건드리지 않음. 사진은 얼굴 위치를 찾아 그쪽을 중심으로 화면을 채움
import { findFocus, savedFocus } from './focus.js';

// 화면(vw×vh)을 사진(iw×ih)으로 꽉 채우면서 초점 f를 화면 한가운데에 오게 하는 크기와 위치
// 사진 끝에 걸려 가운데로 못 오면 필요한 만큼만 확대 (최대 1.8배)
export function computeFrame(vw, vh, iw, ih, f) {
  const cover = Math.max(vw / iw, vh / ih);
  let w = iw * cover, h = ih * cover, s = 1;
  const fx = f ? f[0] : 0.5, fy = f ? f[1] : 0.42;
  if (f) {
    const need = Math.max(vw / (2 * Math.max(fx, 0.01) * w), vw / (2 * Math.max(1 - fx, 0.01) * w), vh / (2 * Math.max(fy, 0.01) * h), vh / (2 * Math.max(1 - fy, 0.01) * h));
    s = Math.min(1.8, Math.max(1, need));
  }
  w *= s; h *= s;
  const x = Math.min(0, Math.max(vw - w, vw / 2 - fx * w));
  const y = Math.min(0, Math.max(vh - h, vh / 2 - fy * h));
  return { w, h, x, y };
}
const cssUrl = u => `url("${String(u).replace(/["\\\n]/g, encodeURIComponent)}")`;

export function createSlides(root, { onError } = {}) {
  const layers = [...root.querySelectorAll('.sl')];
  let front = 0, cur = null, token = 0;
  const size = new Map(); // 레이어별 사진 원래 크기
  function place(layer, f) {
    const d = size.get(layer);
    if (!d) return;
    const vw = root.clientWidth || innerWidth, vh = root.clientHeight || innerHeight;
    const r = computeFrame(vw, vh, d[0], d[1], f);
    layer.style.backgroundSize = `${r.w.toFixed(1)}px ${r.h.toFixed(1)}px`;
    layer.style.backgroundPosition = `${r.x.toFixed(1)}px ${r.y.toFixed(1)}px`;
  }
  addEventListener('resize', () => layers.forEach(l => place(l, l._f)));
  function show(url) {
    if (!url) { cur = null; token++; layers.forEach(l => l.classList.remove('on')); return; }
    if (url === cur) return;
    const my = ++token;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (my !== token) return;
      const back = layers[1 - front];
      back.style.backgroundImage = cssUrl(url);
      size.set(back, [img.naturalWidth, img.naturalHeight]);
      back._f = savedFocus(url) || null;
      back.style.transition = 'none'; place(back, back._f); back.offsetWidth; back.style.transition = '';
      back.classList.add('on');
      layers[front].classList.remove('on');
      front = 1 - front;
      cur = url;
      if (savedFocus(url) === undefined) {
        findFocus(url).then(f => { if (cur === url) { layers[front]._f = f; place(layers[front], f); } }).catch(() => {});
      }
    };
    img.onerror = () => { if (my === token && onError) onError(url); };
    img.src = url;
  }
  return { show, get current() { return cur; } };
}
