// 직접 그린 단순 아이콘 (24x24, 선 굵기 2)
const s = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const icons = {
  pill: s('<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.7 8.8l4.6 6.4"/>'),
  cup: s('<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5"/>'),
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  gear: s('<path d="M10.3 3h3.4l.5 2.4 1.7.9 2.3-.9 1.7 2.9-1.8 1.6v2.2l1.8 1.6-1.7 2.9-2.3-.9-1.7.9-.5 2.4h-3.4l-.5-2.4-1.7-.9-2.3.9-1.7-2.9 1.8-1.6v-2.2L3.9 8.3l1.7-2.9 2.3.9 1.7-.9z"/><circle cx="12" cy="12" r="3"/>'),
  bell: s('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  check: s('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  close: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  play: s('<path d="M8 5.5v13l10-6.5-10-6.5z" fill="currentColor"/>'),
  pause: s('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  reset: s('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>'),
  trash: s('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
};
