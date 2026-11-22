// 모든 화면에 들어가는 약 알람 감시
import { pendingAlarms } from '../meds/logic.js';
import { getConfig, getLog, getAcks, setAcks, prune, changed } from '../meds/state.js';
import { startAlarm } from './alarm.js';

function check() {
  const due = pendingAlarms(getConfig(), getLog(), getAcks(), new Date());
  if (!due.length) return;
  startAlarm(
    due.map(d => ({ title: `${d.personName} ${d.medName}`, sub: d.round ? `${d.time} 지남` : d.time })),
    () => {
      const acks = getAcks();
      for (const d of due) acks[d.ackKey] = true;
      setAcks(acks);
      changed();
    },
  );
}

prune();
check();
setInterval(check, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
window.addEventListener('kp-meds-changed', () => setTimeout(check, 0));

// 오프라인 캐시 등록 + 새 버전 자동 적용
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' })
    .then(reg => setInterval(() => reg.update().catch(() => {}), 10 * 60 * 1000))
    .catch(() => {});
  // 새 버전이 들어오면, 타이머·알람·설정 창이 열려 있지 않을 때 화면을 새로 고침
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }
    const tryReload = () => {
      if (document.querySelector('.sheet-back.open, .alarm.open')) return setTimeout(tryReload, 30000);
      location.reload();
    };
    tryReload();
  });
}
