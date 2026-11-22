// 야간 모드 시간 계산 (자정을 넘는 구간도 처리)
const mins = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
export function isNight(now, from, to) {
  const f = mins(from), t = mins(to);
  if (f == null || t == null || f === t) return false;
  const n = now.getHours() * 60 + now.getMinutes();
  return f < t ? n >= f && n < t : n >= f || n < t;
}
