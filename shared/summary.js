// 홈 위젯·시계 페이스에서 쓰는 약 요약
import { todaySlots } from '../meds/logic.js';

export function medsSummary(cfg, log, now) {
  const slots = todaySlots(cfg, now);
  const people = (cfg.people || []).map(p => {
    const mine = slots.filter(s => s.personId === p.id);
    const left = mine.filter(s => !log[s.key]);
    const late = left.filter(s => now >= s.at);
    const upcoming = left.filter(s => now < s.at);
    return {
      id: p.id, name: p.name, total: mine.length, left: left.length, late: late.length,
      lateMed: late[0]?.medName, lateTime: late[0]?.time,
      nextMed: upcoming[0]?.medName, nextTime: upcoming[0]?.time,
      allDone: mine.length > 0 && left.length === 0,
    };
  });
  const next = slots.find(s => !log[s.key] && now < s.at) || null;
  return { people, next, slots };
}
