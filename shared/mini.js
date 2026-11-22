// 메인 화면 말고 모든 화면: 오른쪽 위 작은 시간
const el = document.createElement('div');
el.className = 'mini-time';
const tick = () => { const d = new Date(); el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
tick();
setInterval(tick, 5000);
document.body.appendChild(el);
