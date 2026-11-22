// 드립커피 타이머 계산 (시간 단위: 초, Timer는 ms 단위 시각을 받음)
export const DEFAULT_RECIPES = [
  {
    id: 'basic', name: '기본', dose: 15, water: 250,
    steps: [
      { label: '뜸 들이기', sec: 40, pourTo: 40 },
      { label: '1차 붓기', sec: 40, pourTo: 150 },
      { label: '2차 붓기', sec: 40, pourTo: 250 },
      { label: '추출 기다리기', sec: 60 },
    ],
  },
  {
    id: 'strong', name: '진하게', dose: 18, water: 250,
    steps: [
      { label: '뜸 들이기', sec: 45, pourTo: 45 },
      { label: '1차 붓기', sec: 45, pourTo: 130 },
      { label: '2차 붓기', sec: 45, pourTo: 250 },
      { label: '추출 기다리기', sec: 75 },
    ],
  },
];

export const totalSec = r => r.steps.reduce((a, s) => a + s.sec, 0);

export function timerState(recipe, elapsedSec) {
  const total = totalSec(recipe);
  const e = Math.max(0, Math.floor(elapsedSec));
  if (e >= total) return { stepIndex: recipe.steps.length - 1, stepRemaining: 0, totalRemaining: 0, done: true };
  let acc = 0;
  for (let i = 0; i < recipe.steps.length; i++) {
    const end = acc + recipe.steps[i].sec;
    if (e < end) return { stepIndex: i, stepRemaining: end - e, totalRemaining: total - e, done: false };
    acc = end;
  }
}

export class Timer {
  constructor() { this.reset(); }
  reset() { this.acc = 0; this.since = null; }
  get running() { return this.since !== null; }
  start(now) { if (this.since === null) this.since = now; }
  pause(now) { if (this.since !== null) { this.acc += now - this.since; this.since = null; } }
  elapsed(now) { return this.acc + (this.since !== null ? now - this.since : 0); }
}

// 페이지를 옮겨도 이어지는 커피 실행 상태 (ms 시각 기준, 저장 가능)
// { recipeId, acc: 누적 ms, since: 시작 시각 ms | null(일시정지) }
export function startRun(run, recipeId, now) {
  if (!run || run.recipeId !== recipeId) return { recipeId, acc: 0, since: now };
  return run.since == null ? { ...run, since: now } : { ...run };
}
export function pauseRun(run, now) {
  if (!run || run.since == null) return run;
  return { ...run, acc: run.acc + (now - run.since), since: null };
}
export const runElapsed = (run, now) => (run ? (run.acc + (run.since != null ? now - run.since : 0)) / 1000 : 0);
