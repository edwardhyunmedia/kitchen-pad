// 홈 화면 배치: 아이템 id 순서 목록
// app:<이름> = 앱 아이콘(1칸). 위젯은 애플 위젯 크기 그대로: 작게 s(2x2), 중간 m(4x2), 크게 l(4x4)
export const APPS = ['app:meds', 'app:coffee', 'app:cal', 'app:wx', 'app:settings'];
export const WIDGETS = ['w:meds', 'w:coffee', 'w:cal', 'w:wx'];
// 위젯마다 쓸모 있는 크기만 (애플 지침: 유용한 경우에만 여러 크기)
export const WIDGET_SIZES = { 'w:meds': ['s', 'm', 'l'], 'w:cal': ['s', 'm', 'l'], 'w:wx': ['s', 'm'], 'w:coffee': ['s', 'm'] };
export const DEFAULT_SIZES = { 'w:meds': 's', 'w:cal': 'm', 'w:wx': 's', 'w:coffee': 's' };

export function allItems() {
  return [...APPS, ...WIDGETS];
}

export function itemSize(id, sizes = {}) {
  if (id.startsWith('app:')) return 'app';
  const ok = WIDGET_SIZES[id] || ['s'];
  return ok.includes(sizes?.[id]) ? sizes[id] : DEFAULT_SIZES[id] || ok[0];
}
// 편집 모드에서 크기 바꾸기: 다음 크기로 (마지막이면 처음으로)
export function nextSize(id, sizes = {}) {
  const ok = WIDGET_SIZES[id];
  if (!ok) return 'app';
  return ok[(ok.indexOf(itemSize(id, sizes)) + 1) % ok.length];
}

export function defaultLayout() {
  return ['app:meds', 'app:coffee', 'w:wx', 'app:cal', 'app:settings', 'w:coffee', 'w:meds', 'w:cal'];
}

// 약 중간 위젯 줄을 반으로: 왼쪽 날씨(작게), 오른쪽 약(작게). 저장된 배치에 한 번만 적용
export function splitMedsWithWeather(layout, sizes = {}) {
  if (!Array.isArray(layout) || !layout.includes('w:meds')) return { layout, sizes };
  const out = layout.filter(id => id !== 'w:wx');
  out.splice(out.indexOf('w:meds'), 0, 'w:wx');
  return { layout: out, sizes: { ...sizes, 'w:meds': 's', 'w:wx': 's' } };
}

// 예전 배치(사람별 약 위젯, 다음 약 위젯)는 약 위젯 하나로 합쳐진 새 기본 배치로 바꿈
const OLD = id => typeof id === 'string' && (id.startsWith('w:person:') || id === 'w:next');

export function normalizeLayout(layout, people) {
  if (!Array.isArray(layout) || layout.some(OLD)) return defaultLayout(people);
  const ok = new Set(allItems(people));
  const seen = new Set();
  return layout.filter(id => typeof id === 'string' && ok.has(id) && !seen.has(id) && seen.add(id));
}

// dragged를 target 앞으로 (target이 없으면 맨 뒤)
export function moveItem(layout, dragged, target) {
  if (dragged === target) return [...layout];
  const out = layout.filter(id => id !== dragged);
  const i = target == null ? -1 : out.indexOf(target);
  if (i < 0) out.push(dragged);
  else {
    // 뒤쪽으로 옮길 때는 대상 뒤에 놓아야 자연스러움
    const from = layout.indexOf(dragged), to = layout.indexOf(target);
    out.splice(from < to ? i + 1 : i, 0, dragged);
  }
  return out;
}

// 두 아이템 자리 맞바꾸기 (하나라도 없으면 그대로)
export function swapItems(layout, a, b) {
  const i = layout.indexOf(a), j = layout.indexOf(b);
  if (i < 0 || j < 0) return [...layout];
  const out = [...layout];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export const removeItem = (layout, id) => layout.filter(x => x !== id);
export const addItem = (layout, id) => (layout.includes(id) ? [...layout] : [...layout, id]);
export const addable = (layout, people) => allItems(people).filter(id => !layout.includes(id));
