// 커피·약 카드 높이: 첫 화면에 2×2(4개)가 아래 버튼에 안 가리고 꼭 맞게.
// 기준은 제목+설명 줄 바로 아래부터 하단 버튼 위까지 — 커피와 약이 같은 크기가 되도록 같은 기준을 씀.
export function tileHeight({ subBottom, gapBelowSub, btnTop, gap }) {
  const top = subBottom + gapBelowSub;
  const bottom = btnTop - gap;
  return Math.max(0, Math.floor((bottom - top - gap) / 2));
}

export function fitTiles() {
  const apply = () => {
    const sub = document.querySelector('.page .subtitle');
    const btn = document.querySelector('.bottombar .icon-btn');
    if (!sub || !btn) return;
    const scroller = document.scrollingElement || document.documentElement;
    const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
    const h = tileHeight({
      subBottom: sub.getBoundingClientRect().bottom + scroller.scrollTop,
      gapBelowSub: parseFloat(getComputedStyle(sub).marginBottom) || 0,
      btnTop: btn.getBoundingClientRect().top,
      gap: 14 * s,
    });
    if (h > 0) document.documentElement.style.setProperty('--tile-h', h + 'px');
  };
  document.body.classList.add('fit4');
  apply();
  addEventListener('resize', apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  return apply;
}
