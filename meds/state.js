import { load, save } from '../shared/store.js';
import { DEFAULT_CONFIG, dateKey, pruneLog } from './logic.js';

export const getConfig = () => load('meds.config', DEFAULT_CONFIG);
export const setConfig = c => { save('meds.config', c); changed(); };
export const getLog = () => load('meds.log', {});
export const setLog = l => { save('meds.log', l); changed(); };
export const getAcks = () => load('meds.acks', {});
export const setAcks = a => save('meds.acks', a);

export function prune(now = new Date()) {
  const today = dateKey(now);
  save('meds.log', pruneLog(getLog(), today));
  save('meds.acks', pruneLog(getAcks(), today, 2));
}

// 같은 화면 안의 다른 부분에 "약 데이터 바뀜" 알림
export const changed = () => window.dispatchEvent(new Event('kp-meds-changed'));
