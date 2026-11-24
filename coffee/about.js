// 레시피 설명 (원두·추출법) + 직접 그린 그림. 외부 사진을 불러오지 않음 (밖으로 나가는 요청 없음)

// ---------- 그림 (viewBox 0 0 320 200) ----------
const bg = c => `<rect width="320" height="200" fill="${c}"/>`;
const steam = (x, y) => `<g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"><path d="M${x - 14} ${y}c-6-8 6-14 0-22"/><path d="M${x} ${y - 4}c-6-8 6-14 0-22"/><path d="M${x + 14} ${y}c-6-8 6-14 0-22"/></g>`;
const svg = body => `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

export const ART = {
  // 원뿔 드리퍼 + 유리 서버
  v60: svg(`${bg('#efe4d6')}
    <ellipse cx="160" cy="182" rx="80" ry="8" fill="#000" opacity=".06"/>
    <path d="M112 118h96l-8 58a8 8 0 0 1-8 7h-64a8 8 0 0 1-8-7z" fill="#fff" fill-opacity=".55" stroke="#c9b8a4" stroke-width="3"/>
    <path d="M118 150h84l-4 26a6 6 0 0 1-6 5h-64a6 6 0 0 1-6-5z" fill="#8a5a3b"/>
    <rect x="126" y="108" width="68" height="12" rx="4" fill="#fff" stroke="#c9b8a4" stroke-width="3"/>
    <path d="M100 40h120l-46 70h-28z" fill="#fff" stroke="#c9b8a4" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 46h100l-40 58h-20z" fill="#f6efe6"/>
    <path d="M118 52h84l-32 46h-20z" fill="#6b4329"/>
    <path d="M146 60l6 30M174 60l-6 30M160 58v34" stroke="#c9b8a4" stroke-width="2" opacity=".5"/>
    ${steam(160, 36)}`),
  // 모래시계 모양 유리 + 나무 손잡이
  chemex: svg(`${bg('#e6ebe4')}
    <ellipse cx="160" cy="186" rx="70" ry="7" fill="#000" opacity=".06"/>
    <path d="M112 24h96l-38 76 38 76a6 6 0 0 1-5 8h-86a6 6 0 0 1-5-8l38-76z" fill="#fff" fill-opacity=".6" stroke="#b9c4b6" stroke-width="3" stroke-linejoin="round"/>
    <path d="M120 30h80l-34 66h-12z" fill="#fff"/>
    <path d="M128 36h64l-26 50h-12z" fill="#6b4329"/>
    <path d="M131 150h58l14 28h-86z" fill="#8a5a3b"/>
    <path d="M144 88h32l6 22h-44z" fill="#b07a4f"/>
    <path d="M140 98h40" stroke="#7a5236" stroke-width="3"/>
    <circle cx="160" cy="104" r="4" fill="#7a5236"/>`),
  // 원뿔 드리퍼 아래 얼음 잔
  iced: svg(`${bg('#dfeaf2')}
    <ellipse cx="160" cy="186" rx="70" ry="7" fill="#000" opacity=".06"/>
    <path d="M118 96h84l-10 84a6 6 0 0 1-6 5h-52a6 6 0 0 1-6-5z" fill="#fff" fill-opacity=".5" stroke="#b5c8d6" stroke-width="3"/>
    <path d="M123 128h74l-6 50a5 5 0 0 1-5 4h-52a5 5 0 0 1-5-4z" fill="#8a5a3b" opacity=".85"/>
    <rect x="130" y="112" width="22" height="22" rx="5" transform="rotate(-12 141 123)" fill="#fff" fill-opacity=".85" stroke="#cfe0ec" stroke-width="2"/>
    <rect x="160" y="106" width="22" height="22" rx="5" transform="rotate(10 171 117)" fill="#fff" fill-opacity=".85" stroke="#cfe0ec" stroke-width="2"/>
    <rect x="146" y="140" width="20" height="20" rx="5" transform="rotate(20 156 150)" fill="#fff" fill-opacity=".7" stroke="#cfe0ec" stroke-width="2"/>
    <path d="M104 22h112l-42 64h-28z" fill="#fff" stroke="#b5c8d6" stroke-width="3" stroke-linejoin="round"/>
    <path d="M122 34h76l-30 44h-16z" fill="#6b4329"/>
    <path d="M160 86v10" stroke="#6b4329" stroke-width="4" stroke-linecap="round"/>`),
  // 원두 봉투 + 원두 (로고 없이)
  beans: svg(`${bg('#dde6f3')}
    <ellipse cx="160" cy="184" rx="90" ry="8" fill="#000" opacity=".06"/>
    <path d="M110 40h100l8 140H102z" fill="#1f4e8c"/>
    <path d="M110 40h100l-4 18H114z" fill="#173d6e"/>
    <rect x="128" y="86" width="64" height="44" rx="6" fill="#fff" fill-opacity=".92"/>
    <path d="M140 100h40M140 110h28M140 120h34" stroke="#1f4e8c" stroke-width="4" stroke-linecap="round" opacity=".5"/>
    ${[[70, 168, -20], [92, 176, 25], [232, 170, 10], [254, 178, -30], [214, 182, 40]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="11" ry="8" fill="#5b3a24"/><path d="M-9 0c4-4 14-4 18 0" stroke="#3a2416" stroke-width="2" fill="none"/></g>`).join('')}`),
};

// ---------- 설명 ----------
// title 줄, 문단, 출처. art: 위 그림 이름
export const ABOUT = {
  'dbl-india': {
    art: 'beans', kind: '원두', origin: '딥블루레이크 · 서울 망원동',
    text: [
      '딥블루레이크는 망원동의 로스터리 카페로, 원두를 아주 약하게 볶는 북유럽식(노르딕) 로스팅으로 유명한 곳이에요.',
      '인디아 블렌드는 인도 원두를 중심으로 섞은 블렌드예요. 이 레시피는 얼음 위로 진하게 내려서 차갑게 마시는 방식이라 원두 20g에 물 180g으로 짧게 내려요.',
      '3분을 목표로 하되 2분 50초까지는 괜찮아요. 너무 빨리 끝나면 분쇄를 조금 더 곱게, 늦게 끝나면 조금 더 굵게 해 보세요.',
    ],
  },
  basic: {
    art: 'v60', kind: '추출법', origin: '기본 레시피',
    text: [
      '원두 15g에 물 250g, 세 번에 나눠 붓는 가장 무난한 드립이에요. 어떤 원두든 처음 내려볼 때 기준으로 쓰기 좋아요.',
      '맛이 연하면 분쇄를 곱게, 쓰거나 텁텁하면 굵게 바꿔 보세요.',
    ],
  },
  strong: {
    art: 'v60', kind: '추출법', origin: '기본 레시피',
    text: [
      '같은 물 250g에 원두를 18g으로 늘려 더 진하게 내리는 레시피예요. 우유를 섞거나 진한 맛을 좋아할 때 좋아요.',
    ],
  },
  'hoffmann-v60': {
    art: 'v60', kind: '추출법', origin: '제임스 호프만 · 2007 월드 바리스타 챔피언',
    text: [
      '유튜브로 가장 널리 알려진 V60 방법이에요. 숟가락으로 젓는 대신 드리퍼를 살살 돌려서(스월) 누구나 비슷한 맛을 내기 쉽게 만든 게 핵심이에요.',
      '원두 양의 두세 배 물로 뜸을 들이고, 나머지 물을 두 번에 나눠 부은 뒤 한 번 젓고 돌려서 커피 층을 평평하게 만들어요. 깔끔하고 단맛이 좋은 컵이 나와요.',
      '물은 뜨거울수록 좋다고 해요. 특히 약하게 볶은 원두는 끓는 물을 그대로 써도 돼요.',
    ],
  },
  'hoffmann-1cup': {
    art: 'v60', kind: '추출법', origin: '제임스 호프만 · Better 1 Cup',
    text: [
      '원두를 적게 쓰는 한 잔짜리는 물이 금방 빠져서 맛이 덜 나오기 쉬워요. 그래서 50g씩 다섯 번 나눠 붓고 사이사이 쉬어서 물이 원두에 머무는 시간을 늘린 방법이에요.',
      '한 번에 붓는 양이 적어 물줄기가 흔들려도 맛이 크게 달라지지 않아요.',
    ],
  },
  'kasuya-46': {
    art: 'v60', kind: '추출법', origin: '테츠 카스야 · 2016 월드 브루어스컵 우승',
    text: [
      '물을 4:6으로 나눠서 생각하는 방법이에요. 처음 40%(두 번 붓기)는 맛의 균형을, 나머지 60%(세 번 붓기)는 진하기를 정해요.',
      '첫 붓기를 줄이고 두 번째를 늘리면 더 달게, 첫 붓기를 늘리면 더 새콤하게 나와요. 뒤쪽을 세 번이 아니라 두 번에 부으면 연하게, 네 번이면 진하게 돼요.',
      '분쇄는 프렌치프레스처럼 굵게 해요. 매번 물이 45초 안에 빠지는 정도가 좋아요. 3분 30초가 되면 드리퍼를 빼요.',
    ],
  },
  'hoffmann-chemex': {
    art: 'chemex', kind: '추출법', origin: '제임스 호프만 · 케멕스',
    text: [
      '케멕스는 1941년에 나온 모래시계 모양 유리 드리퍼예요. 필터가 두꺼워서 기름기와 미분을 잘 걸러 아주 깨끗한 맛이 나요.',
      '두 잔 분량(30g, 500g)을 내려요. 필터의 세 겹 쪽을 따르는 주둥이 쪽에 대야 공기가 잘 빠져 막히지 않아요.',
      '필터가 두꺼운 만큼 V60보다 오래 걸려요. 4분 15초쯤 끝나면 적당해요.',
    ],
  },
  'iced-v60': {
    art: 'iced', kind: '추출법', origin: '일본식 아이스 드립',
    text: [
      '뜨거운 물로 진하게 내려서 바로 얼음 위로 떨어뜨려 식히는 방법이에요. 차갑게 우리는 콜드브루보다 향과 과일 같은 맛이 훨씬 잘 살아요.',
      '물의 일부를 얼음으로 바꿨기 때문에 뜨거운 물은 적게 붓고, 분쇄는 평소보다 조금 곱게 해요. 다 내려오면 서버를 돌려 남은 얼음을 녹여요.',
    ],
  },
};

// 사용자가 만든 레시피는 숫자로 짧은 설명
export function aboutOf(r) {
  if (ABOUT[r.id]) return ABOUT[r.id];
  const ratio = r.dose && r.water ? `1:${(r.water / r.dose).toFixed(1).replace(/\.0$/, '')}` : '';
  return {
    art: r.ice ? 'iced' : 'v60', kind: '내 레시피', origin: '직접 만든 레시피',
    text: [`원두 ${r.dose}g에 물 ${r.water}g${ratio ? `(${ratio})` : ''}로 내리는 레시피예요.${r.note ? ` ${r.note}` : ''}`],
  };
}
