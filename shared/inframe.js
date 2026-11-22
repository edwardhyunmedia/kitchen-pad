// 앱 화면이 홈 위에 겹쳐 열렸을 때: 홈과 신호 주고받기 (혼자 열렸으면 아무것도 안 함)
export const inner = window !== window.top;
const send = msg => window.parent.postMessage({ kp: true, ...msg }, location.origin);

if (inner) {
  document.documentElement.classList.add('inframe');
  // 홈으로 가는 링크는 페이지 이동 대신 닫기
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    const root = new URL('../', import.meta.url);
    if (url.origin === root.origin && url.pathname === root.pathname) {
      e.preventDefault();
      send(url.searchParams.has('pick') ? { type: 'pick' } : { type: 'close' });
    }
  }, true);
  // 만지는 중이라고 알려서 시계로 돌아가지 않게
  let last = 0;
  document.addEventListener('pointerdown', () => { const n = Date.now(); if (n - last > 1500) { last = n; send({ type: 'activity' }); } }, true);
}
export const tellParent = msg => { if (inner) send(msg); };
