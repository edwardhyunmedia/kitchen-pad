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
