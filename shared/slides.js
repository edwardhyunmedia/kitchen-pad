// 사진 시계 슬라이드: 두 장을 겹쳐 두고, 다음 사진을 다 받은 뒤에 천천히 바꿈(디졸브)
// 시계 글자를 다시 그려도 사진은 건드리지 않음. 사진은 얼굴 위치를 찾아 그쪽을 중심으로 화면을 채움
import { findFocus, savedFocus } from './focus.js';

const pos = f => (f ? `${(f[0] * 100).toFixed(1)}% ${(f[1] * 100).toFixed(1)}%` : '50% 40%');
const cssUrl = u => `url("${String(u).replace(/["\\\n]/g, encodeURIComponent)}")`;

export function createSlides(root, { onError } = {}) {
  const layers = [...root.querySelectorAll('.sl')];
  let front = 0, cur = null, token = 0;
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
      back.style.backgroundPosition = pos(savedFocus(url));
      back.classList.add('on');
      layers[front].classList.remove('on');
      front = 1 - front;
      cur = url;
      if (savedFocus(url) === undefined) {
        findFocus(url).then(f => { if (cur === url) layers[front].style.backgroundPosition = pos(f); }).catch(() => {});
      }
    };
    img.onerror = () => { if (my === token && onError) onError(url); };
    img.src = url;
  }
  return { show, get current() { return cur; } };
}
