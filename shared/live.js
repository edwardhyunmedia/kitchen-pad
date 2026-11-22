// 커피 타이머가 돌고 있으면 어느 화면이든 아래쪽에 알약 표시 + 단계 바뀔 때 소리
import { load } from './store.js';
import { icons } from './icons.js';
import { beep } from './alarm.js';
import { DEFAULT_RECIPES, timerState, runElapsed, totalSec } from '../coffee/logic.js';

// 겹친 앱 안에서는 바깥 홈이 알약을 보여줌
if (window === window.top) {
const base = new URL('../', import.meta.url);
const el = document.createElement('a');
el.className = 'live-pill';
el.href = new URL('coffee/?run', base).href;
document.body.appendChild(el);
let lastStep = null;

function tick() {
  const run = load('coffee.run', null);
  const recipe = run && load('coffee.recipes', DEFAULT_RECIPES).find(r => r.id === run.recipeId);
  const hide = !recipe || window.kpCoffeeOpen;
  if (!recipe) { el.classList.remove('on'); lastStep = null; return; }
  const el2 = runElapsed(run, Date.now());
  const st = timerState(recipe, el2);
  // 끝나고 1분 지나면 알약 숨김
  if (st.done && el2 - totalSec(recipe) > 60) { el.classList.remove('on'); lastStep = 'done'; return; }
  if (!window.kpCoffeeOpen && run.since != null && lastStep != null) {
    if (st.done && lastStep !== 'done') beep(3);
    else if (!st.done && st.stepIndex !== lastStep) beep(2);
  }
  lastStep = st.done ? 'done' : st.stepIndex;
  const label = st.done ? '추출 완료' : recipe.steps[st.stepIndex].label;
  const sec = st.done ? '' : `${Math.floor(st.stepRemaining / 60)}:${String(st.stepRemaining % 60).padStart(2, '0')}`;
  el.innerHTML = `<span class="lp-ico">${icons.cup}</span>${label}${sec ? `<b>${run.since == null ? '일시정지' : sec}</b>` : ''}`;
  el.classList.toggle('on', !hide);
}
tick();
setInterval(tick, 500);
}
