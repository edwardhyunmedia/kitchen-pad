// 홈 화면 배치: 아이템 id 순서 목록
// app:<이름> = 앱 아이콘(1칸), w:meds = 약 위젯(가로 4칸 x 2줄, 사람별 + 다음 약), w:coffee = 커피 위젯(2x2), w:cal = 다가오는 일정(가로 4칸)
export const APPS = ['app:meds', 'app:coffee', 'app:settings'];

export function allItems() {
  return [...APPS, 'w:meds', 'w:coffee', 'w:cal'];
}

export function itemSize(id) {
  if (id.startsWith('app:')) return 'app';
  if (id === 'w:meds') return 'big';
  if (id === 'w:cal') return 'wide';
  return 'square';
}

export function defaultLayout() {
  return ['app:meds', 'app:coffee', 'w:coffee', 'app:settings', 'w:meds', 'w:cal'];
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

export const removeItem = (layout, id) => layout.filter(x => x !== id);
export const addItem = (layout, id) => (layout.includes(id) ? [...layout] : [...layout, id]);
export const addable = (layout, people) => allItems(people).filter(id => !layout.includes(id));
