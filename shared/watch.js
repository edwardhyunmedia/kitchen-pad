// 모든 화면에 들어가는 약 알람 감시
import { pendingAlarms } from '../meds/logic.js';
import { getConfig, getLog, setLog, getAcks, setAcks, getSnooze, setSnooze, prune, changed } from '../meds/state.js';
import { startAlarm, isAlarmOn } from './alarm.js';
import { load, save } from './store.js';
import { getEvents, dueAlerts, fmtTime } from './calendar.js';

function check() {
  const due = pendingAlarms(getConfig(), getLog(), getAcks(), new Date(), getSnooze());
  if (!due.length) return;
  startAlarm(
    due.map(d => ({ title: `${d.personName} ${d.medName}`, sub: d.round ? `${d.time} 지남` : d.time })),
    () => {
      // 먹었어요: 바로 체크
      const log = getLog();
      const t = new Date().toISOString();
      for (const d of due) if (!log[d.key]) log[d.key] = t;
      setLog(log);
    },
    () => {
      // 10분 뒤 다시
      const sn = getSnooze();
      const until = Date.now() + 10 * 60000;
      for (const d of due) sn[d.key] = until;
      setSnooze(sn);
      changed();
    },
  );
}

const inner = window !== window.top;

// 구글 캘린더 일정 알림 (설정에서 주소를 넣었을 때만)
async function checkCal() {
  if (isAlarmOn() || !load('settings', {}).calUrl) return;
  const min = Number(load('settings', {}).calAlertMin ?? 10);
  if (!min) return;
  const now = new Date();
  const acks = load('cal.acks', {});
  const snooze = load('cal.snooze', {});
  const due = dueAlerts(await getEvents(), now, min, acks).filter(e => !(snooze[e.ackKey] > Date.now()));
  // 미뤄둔 일정 중 시간이 된 것
  for (const [k, v] of Object.entries(snooze)) if (v.until <= Date.now() && !due.find(d => d.ackKey === k)) due.push({ ackKey: k, title: v.title, start: new Date(v.start) });
  if (!due.length) return;
  startAlarm(
    due.map(e => ({ title: e.title, sub: fmtTime(new Date(e.start)) })),
    () => { const a = load('cal.acks', {}); const sn = load('cal.snooze', {}); for (const e of due) { a[e.ackKey] = true; delete sn[e.ackKey]; } save('cal.acks', a); save('cal.snooze', sn); },
    () => { const a = load('cal.acks', {}); const sn = load('cal.snooze', {}); for (const e of due) { a[e.ackKey] = true; sn[e.ackKey] = { until: Date.now() + 10 * 60000, title: e.title, start: new Date(e.start).toISOString() }; } save('cal.acks', a); save('cal.snooze', sn); },
    { title: '곧 일정이 있어요', primary: '확인', later: '10분 뒤 다시', speak: '곧 일정이 있어요' },
  );
}
if (!inner) { prune(); check(); }
if (!inner) { setInterval(check, 20000); setInterval(checkCal, 60000); setTimeout(checkCal, 3000); }
document.addEventListener('visibilitychange', () => { if (!inner && !document.hidden) check(); });
window.addEventListener('kp-meds-changed', () => { if (!inner) setTimeout(check, 0); });

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
