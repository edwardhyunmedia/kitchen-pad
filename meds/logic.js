// 약 알람 계산 (화면과 무관한 순수 로직)
export const DEFAULT_CONFIG = {
  remindAfterMin: 30,
  maxRemind: 2,
  people: [
    { id: 'me', name: '나', meds: [] },
    { id: 'wife', name: '아내', meds: [] },
  ],
};

const pad = n => String(n).padStart(2, '0');
export const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const slotKey = (date, personId, medId, time) => `${date}|${personId}|${medId}|${time}`;

export function todaySlots(config, now) {
  const date = dateKey(now);
  const out = [];
  for (const p of config.people || []) {
    for (const m of p.meds || []) {
      for (const time of m.times || []) {
        const [h, mi] = time.split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(mi)) continue;
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi);
        out.push({ key: slotKey(date, p.id, m.id, time), personId: p.id, personName: p.name, medId: m.id, medName: m.name, time, at });
      }
    }
  }
  return out.sort((a, b) => a.at - b.at || a.personId.localeCompare(b.personId));
}

export function toggleTaken(log, key, now) {
  const next = { ...log };
  if (next[key]) delete next[key];
  else next[key] = now.toISOString();
  return next;
}

export function pendingAlarms(config, log, acks, now, snooze = {}) {
  const step = Math.max(1, Number(config.remindAfterMin) || 30) * 60000;
  const maxR = Math.max(0, Number(config.maxRemind ?? 2));
  const out = [];
  for (const s of todaySlots(config, now)) {
    if (log[s.key] || now < s.at) continue;
    if (snooze[s.key] && snooze[s.key] > now.getTime()) continue; // 10분 뒤 다시
    const round = Math.min(Math.floor((now - s.at) / step), maxR);
    const ackKey = `${s.key}#${round}`;
    if (acks[ackKey]) continue;
    out.push({ key: s.key, ackKey, round, personName: s.personName, medName: s.medName, time: s.time });
  }
  return out;
}

export function pruneLog(obj, today, keepDays = 90) {
  const [y, m, d] = today.split('-').map(Number);
  const cutoff = dateKey(new Date(y, m - 1, d - keepDays));
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (k.slice(0, 10) >= cutoff) out[k] = v;
  return out;
}

// 위젯을 눌렀을 때 체크할 약: 시간 지난 것 중 가장 이른 것, 없으면 다음 예정
export function currentSlotFor(config, log, personId, now) {
  const mine = todaySlots(config, now).filter(s => s.personId === personId && !log[s.key]);
  return mine.find(s => now >= s.at) || mine[0] || null;
}

// 최근 days일 기록 (지금 설정된 약·시간 기준). 오늘은 지난 시간만 due로 셈
export function history(config, log, now, days = 7) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
    const date = dateKey(d);
    const slots = todaySlots(config, d);
    out.push({
      date, day: d.getDay(), dom: d.getDate(),
      people: (config.people || []).map(p => {
        const mine = slots.filter(s => s.personId === p.id).map(s => ({ time: s.time, medName: s.medName, done: !!log[s.key], due: i > 0 || s.at <= now }));
        return { id: p.id, name: p.name, slots: mine, total: mine.length, taken: mine.filter(s => s.done).length, due: mine.filter(s => s.due).length };
      }),
    });
  }
  return out;
}
