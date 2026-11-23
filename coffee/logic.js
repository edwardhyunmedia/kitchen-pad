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

// 사용자가 준 레시피 (기존 저장 목록에도 한 번만 추가됨)
export const SEED_RECIPES = [
  {
    id: 'dbl-india', name: '딥블루레이크 인디아 블랜드', dose: 20, water: 180, temp: 93, grind: '11~11.3', ice: 150, ratio: '1:10',
    note: '3분 타겟 (2:50까지 OK). 얼음 컵 위에 서빙',
    steps: [
      { label: '뜸 들이기', sec: 40, pourTo: 40 },
      { label: '1차 붓기', sec: 20, pourTo: 110 },
      { label: '기다리기', sec: 20 },
      { label: '2차 붓기', sec: 30, pourTo: 180 },
      { label: '기다리기', sec: 50 },
    ],
  },
  // 온라인에 공개된 유명 드립 레시피 (원두 g · 물 g · 시간은 각 출처 그대로, 단계 시간 = 다음 단계 시작까지)
  {
    id: 'hoffmann-v60', name: '호프만 V60', dose: 15, water: 250, temp: 100, grind: '중간-가늘게', ratio: '1:16.7',
    note: '제임스 호프만 Ultimate V60. 뜸 들일 때 살살 돌리고, 다 부은 뒤 한 번 젓고 돌려서 평평하게. 3:30에 끝',
    steps: [
      { label: '뜸 들이기 (살살 돌리기)', sec: 45, pourTo: 50 },
      { label: '1차 붓기', sec: 30, pourTo: 150 },
      { label: '2차 붓기', sec: 30, pourTo: 250 },
      { label: '한 번 젓고 살짝 돌리기', sec: 15 },
      { label: '다 내려오길 기다리기', sec: 90 },
    ],
  },
  {
    id: 'hoffmann-1cup', name: '호프만 1잔 V60', dose: 15, water: 250, temp: 100, grind: '중간-가늘게', ratio: '1:16.7',
    note: '제임스 호프만 Better 1 Cup. 50g씩 나눠 붓고 사이사이 10초 쉼. 3:00쯤 끝',
    steps: [
      { label: '뜸 들이기 (살살 돌리기)', sec: 45, pourTo: 50 },
      { label: '2차 붓기', sec: 15, pourTo: 100 },
      { label: '쉬기', sec: 10 },
      { label: '3차 붓기', sec: 10, pourTo: 150 },
      { label: '쉬기', sec: 10 },
      { label: '4차 붓기', sec: 10, pourTo: 200 },
      { label: '쉬기', sec: 10 },
      { label: '5차 붓기', sec: 10, pourTo: 250 },
      { label: '살짝 돌리고 기다리기', sec: 60 },
    ],
  },
  {
    id: 'kasuya-46', name: '카스야 4:6', dose: 20, water: 300, temp: 92, grind: '굵게', ratio: '1:15',
    note: '테츠 카스야 4:6 (2016 월드 브루어스컵 우승). 첫 붓기를 줄이면 더 달고, 늘리면 더 새콤. 3:30에 드리퍼 빼기',
    steps: [
      { label: '1차 붓기', sec: 45, pourTo: 50 },
      { label: '2차 붓기', sec: 45, pourTo: 120 },
      { label: '3차 붓기', sec: 40, pourTo: 180 },
      { label: '4차 붓기', sec: 30, pourTo: 240 },
      { label: '5차 붓기', sec: 50, pourTo: 300 },
    ],
  },
  {
    id: 'hoffmann-chemex', name: '호프만 케멕스', dose: 30, water: 500, temp: 100, grind: '중간', ratio: '1:16.7',
    note: '제임스 호프만 케멕스 (2잔). 다 부은 뒤 한 번 젓기. 4:15쯤 끝',
    steps: [
      { label: '뜸 들이기 (살살 돌리기)', sec: 45, pourTo: 60 },
      { label: '1차 붓기', sec: 30, pourTo: 300 },
      { label: '2차 붓기', sec: 30, pourTo: 500 },
      { label: '한 번 젓기', sec: 10 },
      { label: '다 내려오길 기다리기', sec: 140 },
    ],
  },
  {
    id: 'iced-v60', name: '아이스 드립 (일본식)', dose: 30, water: 330, ice: 170, temp: 100, grind: '평소보다 조금 가늘게', ratio: '1:16.7 (얼음 포함)',
    note: '서버에 얼음 170g 먼저 담고 그 위로 내리기. 다 내려오면 서버를 돌려 얼음 녹이기',
    steps: [
      { label: '뜸 들이기', sec: 30, pourTo: 60 },
      { label: '1차 붓기', sec: 45, pourTo: 200 },
      { label: '2차 붓기', sec: 30, pourTo: 330 },
      { label: '다 내려오길 기다리기', sec: 60 },
    ],
  },
];
// 맨 앞에 둘 레시피 (한 번만 정렬 — 그 뒤 사용자가 바꾼 순서는 건드리지 않음)
export const FIRST_ID = 'dbl-india';
const ORDER_FLAG = 'order:dbl-first';
export function mergeSeeds(recipes, seeded, seeds = SEED_RECIPES) {
  let out = [...recipes];
  const done = [...seeded];
  let changed = false;
  for (const r of seeds) {
    if (done.includes(r.id)) continue;
    if (!out.some(x => x.id === r.id)) out.push(JSON.parse(JSON.stringify(r)));
    done.push(r.id);
    changed = true;
  }
  if (!done.includes(ORDER_FLAG)) {
    const i = out.findIndex(x => x.id === FIRST_ID);
    if (i > 0) out = [out[i], ...out.slice(0, i), ...out.slice(i + 1)];
    done.push(ORDER_FLAG);
    changed = true;
  }
  return { recipes: out, seeded: done, changed };
}

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
