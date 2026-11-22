// 홈 화면 배치: 아이템 id 순서 목록
// app:<이름> = 앱 아이콘(1칸), w:person:<id> = 사람 약 위젯(2x2), w:coffee = 커피 위젯(2x2), w:next = 다음 약(가로 4칸)
export const APPS = ['app:meds', 'app:coffee', 'app:settings'];

export function allItems(people) {
  return [...APPS, ...(people || []).map(p => `w:person:${p.id}`), 'w:coffee', 'w:next'];
}

export function itemSize(id) {
  if (id.startsWith('app:')) return 'app';
  if (id === 'w:next') return 'wide';
  return 'square';
}

export function defaultLayout(people) {
  const ps = (people || []).map(p => `w:person:${p.id}`);
  return ['app:meds', 'app:coffee', ...ps.slice(0, 1), 'app:settings', ...ps.slice(1), 'w:coffee', 'w:next'];
}

export function normalizeLayout(layout, people) {
  if (!Array.isArray(layout)) return defaultLayout(people);
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
