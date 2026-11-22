import { icons } from './icons.js';

// 소리: 브라우저 안에서 직접 만든 비프음 (외부 파일 없음)
let ctx = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
// 브라우저가 첫 터치 전엔 소리를 막을 수 있어서, 첫 터치 때 소리 장치를 깨워둠
window.addEventListener('pointerdown', () => audio(), { once: true, capture: true });

function tone(c, start, freq, dur) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

export function beep(times = 1) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.05;
  for (let i = 0; i < times; i++) tone(c, t + i * 0.28, 1046, 0.2);
}

function chime() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.05;
  tone(c, t, 880, 0.25);
  tone(c, t + 0.3, 1175, 0.35);
}

function fully(fn) {
  try { if (window.fully) fn(window.fully); } catch { /* Fully 기능 없음 */ }
}

let overlay = null;
let loop = null;
let speakLoop = null;

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'alarm';
  overlay.innerHTML = `<div class="alarm-card">
      <div class="alarm-ring">${icons.bell}</div>
      <h2>약 먹을 시간이에요</h2>
      <ul></ul>
      <button class="btn big primary" type="button">확인</button>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const isAlarmOn = () => !!loop;

// items: [{ title, sub }]
export function startAlarm(items, onAck) {
  const el = ensureOverlay();
  el.querySelector('ul').innerHTML = items.map(i => `<li>${esc(i.title)}<small>${esc(i.sub || '')}</small></li>`).join('');
  el.querySelector('button').onclick = () => { stopAlarm(); onAck && onAck(); };
  el.classList.add('open');
  if (loop) return;
  fully(f => f.turnScreenOn());
  const say = () => fully(f => f.textToSpeech('약 먹을 시간이에요', 'ko'));
  chime();
  say();
  loop = setInterval(chime, 1500);
  speakLoop = setInterval(say, 20000);
}

export function stopAlarm() {
  clearInterval(loop);
  clearInterval(speakLoop);
  loop = speakLoop = null;
  if (overlay) overlay.classList.remove('open');
}
