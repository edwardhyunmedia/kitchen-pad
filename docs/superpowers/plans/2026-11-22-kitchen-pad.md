# 주방 홈패드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully Kiosk로 여는 주방 태블릿용 정적 웹앱 — 홈 런처 + 약 복용 기록(알람·재알림) + 드립커피 레시피 타이머.

**Architecture:** 빌드 없는 순수 HTML/CSS/ES 모듈. 판단 로직(약 알람 계산, 커피 타이머 진행)은 DOM 없는 `logic.js`로 분리해 `node --test`로 검증. 모든 페이지에 `shared/watch.js`를 넣어 어느 화면에 있든 약 알람이 울림. 데이터는 localStorage, 오프라인은 서비스워커.

**Tech Stack:** HTML, CSS, vanilla JS (ES modules), node:test (Node 22), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-22-kitchen-pad-design.md`

## Global Constraints

- 외부 요청 0개: CDN·외부 폰트·분석·fetch 금지. 모든 자원은 같은 출처 상대경로.
- 사용자 데이터는 localStorage에만. 코드·커밋·저장소 설명에 개인정보(이름, 약 이름) 금지. 기본 사람 이름은 "나", "아내".
- 검색 차단: 모든 HTML에 `<meta name="robots" content="noindex,nofollow">`, 루트 `robots.txt` = `User-agent: *` / `Disallow: /`.
- 아이콘 버튼은 정사각형(`aspect-ratio: 1`).
- 모든 UI 문구는 한국어.
- Fully Kiosk JS 객체(`window.fully`)는 있으면 쓰고 없으면 건너뜀. 없어도 모든 기능 동작.
- GitHub Pages 하위 경로(`/kitchen-pad/`)에서 동작해야 하므로 절대경로(`/`로 시작) 금지.

## Review Focus

1. 자정을 넘길 때: 날짜가 바뀌면 어제 체크가 오늘로 이어지지 않아야 함 → Task 2 `pendingAlarms` 날짜 키 테스트.
2. 알람 시간 직후 체크하면 재알림이 안 울려야 함 → Task 2 테스트.
3. 태블릿이 몇 시간 꺼졌다 켜졌을 때 지난 알람이 한꺼번에 여러 번 울리면 안 됨 — 슬롯당 현재 라운드 하나만 → Task 2 테스트.
4. localStorage가 비었거나 깨진 JSON일 때 앱이 죽지 않고 기본값으로 시작 → Task 1 테스트.
5. 커피 타이머 일시정지 후 재개 시 남은 시간이 이어져야 함 → Task 4 테스트.

---

### Task 1: 뼈대 — 공용 저장소, 스타일, 홈 런처, 검색 차단

**Files:**
- Create: `package.json` (`{"type":"module","scripts":{"test":"node --test tests/"}}`)
- Create: `shared/store.js`, `shared/style.css`, `index.html`, `robots.txt`, `.nojekyll`
- Test: `tests/store.test.js`

**Interfaces:**
- Produces: `load(key: string, fallback: any): any`, `save(key: string, value: any): void` — localStorage JSON, 접두사 `kp.`. `load`는 없음·파싱 실패·storage 예외 시 `fallback`의 깊은 복사 반환. 테스트용으로 `setStorage(obj)`로 storage 주입 가능.
- Produces: CSS 변수/클래스 `.app-grid`, `.app-icon`(정사각), `.btn`, `.btn-big`, `.topbar`(← 홈 버튼 포함). 큰 글씨 기본(본문 22px).

- [ ] Step 1: `tests/store.test.js` — 가짜 storage로 `save('a',{x:1})` 후 `load('a',null)` → `{x:1}`; 키 없음 → fallback; 값 `"{깨짐"` → fallback; fallback 변경이 다음 호출에 새지 않음.
- [ ] Step 2: `npm test` → FAIL (모듈 없음)
- [ ] Step 3: `shared/store.js` 구현.
- [ ] Step 4: `npm test` → PASS
- [ ] Step 5: `index.html` — 시계(큰 시:분, 날짜·요일) + `.app-grid`에 아이콘 2개(💊 약 → `meds/`, ☕ 커피 → `coffee/`). 새 앱은 배열 한 줄 추가로 늘어나게 `APPS` 배열로 렌더. robots 메타, `robots.txt`, `.nojekyll`.
- [ ] Step 6: Commit `feat: 홈 런처와 공용 저장소`

### Task 2: 약 로직

**Files:**
- Create: `meds/logic.js`
- Test: `tests/meds.test.js`

**Interfaces:**
- Config: `{ remindAfterMin: number, maxRemind: number, people: [{ id, name, meds: [{ id, name, times: ["HH:MM"] }] }] }`. `DEFAULT_CONFIG` = remindAfterMin 30, maxRemind 2, people 나(`me`)/아내(`wife`), meds 빈 배열.
- Log: `{ [slotKey]: isoString }` (복용 체크 시각). Acks: `{ [slotKey + '#' + round]: true }`.
- `dateKey(d: Date): 'YYYY-MM-DD'` (로컬 시간)
- `slotKey(date: string, personId, medId, time): string` = `${date}|${personId}|${medId}|${time}`
- `todaySlots(config, now: Date): [{ key, personId, personName, medId, medName, time, at: Date }]` 시간순
- `toggleTaken(log, key, now: Date): Log` — 새 객체 반환, 있으면 제거·없으면 추가
- `pendingAlarms(config, log, acks, now: Date): [{ key, ackKey, round, personName, medName, time }]` — 미체크이고 `now >= at`인 오늘 슬롯. `round = min(floor((now-at)/remindAfterMin분), maxRemind)`. `ackKey`가 acks에 있으면 제외. 슬롯당 최대 1개.
- `pruneLog(obj, today: string, keepDays = 90): obj` — 키 앞 날짜가 keepDays보다 오래된 항목 제거 (log·acks 공용)

- [ ] Step 1: 테스트 작성 (now는 `new Date(2026,10,22,H,M)`), 약 1개 times `["08:00","20:00"]`:
  - 07:59 → pendingAlarms 빈 배열
  - 08:00 → 1개, round 0
  - 08:00 ack 후 08:10 → 빈 배열; 08:30 → round 1
  - 08:05에 toggleTaken 후 08:40 → 빈 배열 (Review 2)
  - 15:00, ack 없음 → 08:00 슬롯 1개만, round 2 (Review 3)
  - 11/23 00:10에 11/22 체크 로그가 있어도 11/23 슬롯은 체크 안 된 상태, 11/22 슬롯은 대상 아님 (Review 1)
  - toggleTaken 두 번 → 원래대로; pruneLog 91일 전 키 제거·89일 전 유지
- [ ] Step 2: `npm test` → FAIL
- [ ] Step 3: `meds/logic.js` 구현
- [ ] Step 4: `npm test` → PASS
- [ ] Step 5: Commit `feat: 약 알람 계산 로직`

### Task 3: 알람과 약 화면

**Files:**
- Create: `shared/alarm.js`, `shared/watch.js`, `meds/index.html`, `meds/meds.js`
- Modify: `index.html` (watch.js 포함)

**Interfaces:**
- Consumes: Task 1 `load/save`, Task 2 전부. 저장 키: `meds.config`, `meds.log`, `meds.acks`.
- Produces: `startAlarm(lines: string[], onAck: () => void)`, `stopAlarm()` in `shared/alarm.js` — 전체화면 배너(빨간 띠, 큰 글씨 목록, "확인" 큰 버튼) + WebAudio 비프 반복(1초 간격, 확인까지). `window.fully` 있으면 `fully.turnScreenOn()`, `fully.textToSpeech('약 먹을 시간이에요', 'ko')`.
- Produces: `shared/watch.js` — 불러오면 20초마다 `pendingAlarms` 검사, 있으면 `startAlarm`; 확인 시 모든 ackKey 저장. 이미 울리는 중이면 중복 시작 안 함. 시작 시 log·acks `pruneLog`. 모든 페이지가 `<script type="module" src="../shared/watch.js">`(홈은 `shared/watch.js`)로 포함.
- 첫 터치 전엔 브라우저가 소리를 막을 수 있음: 페이지 첫 터치 때 AudioContext `resume()`.

- [ ] Step 1: `meds/index.html` + `meds.js` — 상단바(← 홈, "약"), 사람별 카드 열, 각 슬롯 버튼 `08:00 약이름` → 체크 시 초록 + 체크 시각 표시, 다시 누르면 취소. 시간 지났는데 미체크면 빨간 테두리. 30초마다 다시 그림.
- [ ] Step 2: 설정 화면(같은 페이지 ⚙ 정사각 버튼 → 패널): 사람 이름 수정, 약 추가(이름, 시간 여러 개 `<input type="time">`), 약 삭제, 재알림 간격(분). 저장 즉시 반영.
- [ ] Step 3: `shared/alarm.js`, `shared/watch.js` 구현, 세 페이지에 포함.
- [ ] Step 4: 검증 — `python3 -m http.server`로 띄우고 headless 브라우저(Playwright)에서 테스트용 설정(가짜 약, 현재 시각 1분 전) 주입 → 배너 표시 스크린샷 확인 → 확인 클릭 → 배너 사라짐 → 슬롯 체크 → 저장 유지. 네트워크 요청이 전부 localhost인지 확인.
- [ ] Step 5: Commit `feat: 약 화면과 알람`

### Task 4: 커피 레시피 타이머

**Files:**
- Create: `coffee/logic.js`, `coffee/index.html`, `coffee/coffee.js`
- Test: `tests/coffee.test.js`

**Interfaces:**
- Recipe: `{ id, name, dose: number(g), water: number(g), steps: [{ label, sec, pourTo?: number(g) }] }`
- `DEFAULT_RECIPES` (제 기본값):
  - `basic` "기본 (15g · 250g)": 뜸 들이기 40s→40g, 1차 붓기 40s→150g, 2차 붓기 40s→250g, 추출 기다리기 60s
  - `strong` "진하게 (18g · 250g)": 뜸 들이기 45s→45g, 1차 붓기 45s→130g, 2차 붓기 45s→250g, 추출 기다리기 75s
- `timerState(recipe, elapsedSec: number): { stepIndex, stepRemaining, totalRemaining, done }`
- `Timer` 클래스: `start(now)`, `pause(now)`, `elapsed(now): number` — 일시정지 누적 (Review 5)
- 저장 키: `coffee.recipes` (없으면 DEFAULT_RECIPES)

- [ ] Step 1: 테스트 — basic에서 elapsed 0 → stepIndex 0, stepRemaining 40; 40 → stepIndex 1; 179 → stepIndex 3, totalRemaining 1; 180 이상 → done true; Timer start(0)·pause(10)·start(100)·elapsed(105) = 15.
- [ ] Step 2: `npm test` → FAIL
- [ ] Step 3: `coffee/logic.js` 구현
- [ ] Step 4: `npm test` → PASS
- [ ] Step 5: 화면 — 레시피 목록(큰 카드) → 선택 시 타이머 화면: 현재 단계 이름, 큰 남은 초, "○○g까지 붓기", 다음 단계 미리보기, 시작/일시정지/처음부터 버튼. 단계가 바뀔 때 비프 2번, 끝나면 3번(`shared/alarm.js`에 `beep(times: number)` 추가). 레시피 추가·수정·삭제 패널. watch.js 포함.
- [ ] Step 6: headless 브라우저로 레시피 선택 → 시작 → 단계 넘어감 확인
- [ ] Step 7: Commit `feat: 커피 레시피 타이머`

### Task 5: 오프라인 캐시와 배포

**Files:**
- Create: `sw.js`, `README.md`(설치 방법만, 개인정보 없음)
- Modify: 모든 HTML (sw 등록)

**Interfaces:**
- `sw.js`: 캐시 이름 `kp-v1`(배포마다 숫자 올림), 설치 시 모든 정적 파일 캐시, 요청은 네트워크 우선 → 실패 시 캐시.

- [ ] Step 1: `sw.js` 작성, 각 페이지에서 `navigator.serviceWorker.register('<상대경로>sw.js')`.
- [ ] Step 2: headless 브라우저에서 한 번 연 뒤 오프라인 전환 → 새로고침 → 홈·약·커피 모두 열림 확인.
- [ ] Step 3: 전체 파일 `grep -rnE "https?://"` → 외부 주소 0개 확인 (README 제외).
- [ ] Step 4: 사용자가 만든 GitHub 저장소 `kitchen-pad`(Public)에 push, Pages를 main 브랜치 루트로 켬, `https://<아이디>.github.io/kitchen-pad/` 열림 확인.
- [ ] Step 5: 사용자에게 Fully Kiosk 설정 안내: 시작 URL, 화면 항상 켜기, 소리 자동재생 허용(웹 콘텐츠 설정), "새로고침 시 캐시 지우기" 끄기(기록 보존).
