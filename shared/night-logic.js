// 야간 모드 시간 계산 (자정을 넘는 구간도 처리)
const mins = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
export function isNight(now, from, to) {
  const f = mins(from), t = mins(to);
  if (f == null || t == null || f === t) return false;
  const n = now.getHours() * 60 + now.getMinutes();
  return f < t ? n >= f && n < t : n >= f || n < t;
}
// 야간에 after초 동안 안 만지면 더 어둡게 (알람 울릴 땐 안 어둡게, after 0 = 끔)
export const shouldIdleDim = ({ night, idleMs, after, alarm = false }) => !!night && !alarm && Number(after) > 0 && idleMs >= Number(after) * 1000;
