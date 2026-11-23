// 직접 그린 단순 아이콘 (24x24, 선 굵기 2)
const s = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const icons = {
  pill: s('<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.7 8.8l4.6 6.4"/>'),
  cup: s('<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5"/>'),
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  gear: s('<path d="M10.11 4.95L10.32 2.45L13.68 2.45L13.89 4.95A7.3 7.3 0 0 1 15.65 5.68L17.56 4.05L19.95 6.44L18.32 8.35A7.3 7.3 0 0 1 19.05 10.11L21.55 10.32L21.55 13.68L19.05 13.89A7.3 7.3 0 0 1 18.32 15.65L19.95 17.56L17.56 19.95L15.65 18.32A7.3 7.3 0 0 1 13.89 19.05L13.68 21.55L10.32 21.55L10.11 19.05A7.3 7.3 0 0 1 8.35 18.32L6.44 19.95L4.05 17.56L5.68 15.65A7.3 7.3 0 0 1 4.95 13.89L2.45 13.68L2.45 10.32L4.95 10.11A7.3 7.3 0 0 1 5.68 8.35L4.05 6.44L6.44 4.05L8.35 5.68A7.3 7.3 0 0 1 10.11 4.95Z"/><circle cx="12" cy="12" r="3"/>'),
  bell: s('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  check: s('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  close: s('<path d="M6 6l12 12M18 6L6 18"/>'),
  play: s('<path d="M8 5.5v13l10-6.5-10-6.5z" fill="currentColor"/>'),
  pause: s('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  reset: s('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>'),
  minus: s('<path d="M6 12h12" stroke-width="3"/>'),
  photo: s('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 15l-5-5-8 8"/>'),
  home: s('<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>'),
  trash: s('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
};
