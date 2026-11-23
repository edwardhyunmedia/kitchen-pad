// 앱 아이콘: 애플 iOS 27 아이콘 템플릿의 모양(스퀘어클)과 리퀴드 글래스 스타일을 따라 그림
const SQ = 'M 1024 651 C 1024 665.2 1024.0 679.5 1023.9 693.7 C 1023.8 705.7 1023.7 717.7 1023.4 729.7 C 1022.7 755.8 1021.1 782.2 1016.5 808.0 C 1011.8 834.3 1004.1 858.7 992.0 882.5 C 980.0 905.9 964.5 927.3 945.9 945.9 C 927.3 964.5 905.9 980.0 882.5 992.0 C 858.7 1004.1 834.3 1011.8 808.0 1016.5 C 782.2 1021.1 755.8 1022.7 729.7 1023.4 C 717.7 1023.7 705.7 1023.8 693.7 1023.9 C 679.5 1024.0 665.2 1024 651 1024 L 373 1024 C 358.8 1024 344.5 1024.0 330.3 1023.9 C 318.3 1023.8 306.3 1023.7 294.3 1023.4 C 268.2 1022.7 241.8 1021.1 216.0 1016.5 C 189.7 1011.8 165.3 1004.1 141.5 992.0 C 118.1 980.0 96.7 964.5 78.1 945.9 C 59.5 927.3 44.0 905.9 32.0 882.5 C 19.9 858.7 12.2 834.3 7.5 808.0 C 2.9 782.2 1.3 755.8 0.6 729.7 C 0.3 717.7 0.2 705.7 0.1 693.7 C -0.0 679.5 0 665.2 0 651 L 0 373 C 0 358.8 -0.0 344.5 0.1 330.3 C 0.2 318.3 0.3 306.3 0.6 294.3 C 1.3 268.2 2.9 241.8 7.5 216.0 C 12.2 189.7 19.9 165.3 32.0 141.5 C 44.0 118.1 59.5 96.7 78.1 78.1 C 96.7 59.5 118.1 44.0 141.5 32.0 C 165.3 19.9 189.7 12.2 216.0 7.5 C 241.8 2.9 268.2 1.3 294.3 0.6 C 306.3 0.3 318.3 0.2 330.3 0.1 C 344.5 -0.0 358.8 0 373 0 L 651 0 C 665.2 0 679.5 -0.0 693.7 0.1 C 705.7 0.2 717.7 0.3 729.7 0.6 C 755.8 1.3 782.2 2.9 808.0 7.5 C 834.3 12.2 858.7 19.9 882.5 32.0 C 905.9 44.0 927.3 59.5 945.9 78.1 C 964.5 96.7 980.0 118.1 992.0 141.5 C 1004.1 165.3 1011.8 189.7 1016.5 216.0 C 1021.1 241.8 1022.7 268.2 1023.4 294.3 C 1023.7 306.3 1023.8 318.3 1023.9 330.3 C 1024.0 344.5 1024 358.8 1024 373 Z';

const defs = (id, glyph) => `<defs>
  <clipPath id="sq-${id}"><path d="${SQ}"/></clipPath>
  <linearGradient id="base-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef1f6"/></linearGradient>
  <filter id="sh-${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="${glyph}" flood-opacity=".38"/></filter>
</defs>`;
const shell = (id, glyph, inner) => `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${defs(id, glyph)}
  <g clip-path="url(#sq-${id})">
    <rect width="1024" height="1024" fill="url(#base-${id})"/>
    <g filter="url(#sh-${id})" transform="translate(512 512) scale(1.32) translate(-512 -512)">${inner}</g>
  </g>
  <path d="${SQ}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="10"/>
  <path d="${SQ}" fill="none" stroke="rgba(0,0,0,.06)" stroke-width="2"/>
</svg>`;
// 유리 조각: 반투명 채움 + 위쪽 밝은 테두리
const glass = (shape, c1, c2, op = 0.86) => `<g opacity="${op}">${shape.replace('/>', ` fill="url(#g-${c1.slice(1)}${c2.slice(1)})"/>`)}</g>
  ${shape.replace('/>', ' fill="none" stroke="rgba(255,255,255,.85)" stroke-width="7"/>')}`;
const grad = (c1, c2) => `<linearGradient id="g-${c1.slice(1)}${c2.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;

export const APP_ICONS = {
  meds: shell('meds', '#ff8a00', `<defs>${grad('#ffd08a', '#ff9500')}${grad('#ffffff', '#ffe2bd')}</defs>
    <g transform="rotate(-40 512 512)">
      ${glass('<rect x="252" y="412" width="300" height="200" rx="100"/>', '#ffffff', '#ffe2bd', 0.95)}
      ${glass('<rect x="472" y="412" width="300" height="200" rx="100"/>', '#ffd08a', '#ff9500', 0.9)}
    </g>`),
  coffee: shell('coffee', '#8f6e49', `<defs>${grad('#e6cba7', '#a2845e')}${grad('#f6e7d3', '#c9a77f')}</defs>
    ${glass('<path d="M690 470h40a90 90 0 0 1 0 180h-40" />'.replace('/>', ' />'), '#f6e7d3', '#c9a77f', 0.9).replace(/fill="url\([^)]*\)"/, 'fill="none" stroke="url(#g-f6e7d3c9a77f)" stroke-width="44" stroke-linecap="round"')}
    ${glass('<path d="M300 430h400v170a150 150 0 0 1-150 150H450a150 150 0 0 1-150-150z"/>', '#e6cba7', '#a2845e', 0.92)}
    <path d="M420 250c-30 40-30 80 0 120M520 230c-30 45-30 90 0 140M620 250c-30 40-30 80 0 120" fill="none" stroke="#c9a77f" stroke-opacity=".7" stroke-width="30" stroke-linecap="round"/>`),
  settings: shell('settings', '#6e6e78', `<defs>${grad('#d9dbe2', '#8e909c')}${grad('#ffffff', '#d5d8e0')}</defs>
    ${glass('<path d="M460.7 333.2L467.0 280.3L557.0 280.3L563.3 333.2A186 186 0 0 1 602.2 349.3L644.0 316.3L707.7 380.0L674.7 421.8A186 186 0 0 1 690.8 460.7L743.7 467.0L743.7 557.0L690.8 563.3A186 186 0 0 1 674.7 602.2L707.7 644.0L644.0 707.7L602.2 674.7A186 186 0 0 1 563.3 690.8L557.0 743.7L467.0 743.7L460.7 690.8A186 186 0 0 1 421.8 674.7L380.0 707.7L316.3 644.0L349.3 602.2A186 186 0 0 1 333.2 563.3L280.3 557.0L280.3 467.0L333.2 460.7A186 186 0 0 1 349.3 421.8L316.3 380.0L380.0 316.3L421.8 349.3A186 186 0 0 1 460.7 333.2Z"/>', '#d9dbe2', '#8e909c', 0.92)}
    ${glass('<circle cx="512" cy="512" r="80"/>', '#ffffff', '#d5d8e0', 0.98)}`),
};
