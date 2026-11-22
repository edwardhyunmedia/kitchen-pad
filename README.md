# kitchen-pad

주방 태블릿용 개인 웹앱 모음 (Fully Kiosk Browser에서 열어서 씀).

- 홈: 시계, 약 상태 요약, 앱 아이콘
- 약: 사람별 복용 체크, 정시 알람, 안 먹으면 다시 알림
- 커피: 드립 레시피 단계별 타이머

데이터는 전부 그 기기 브라우저(localStorage)에만 저장됨. 외부로 보내는 요청 없음.

새 앱 추가: 폴더 하나 만들고 `shared/home.js`의 `APPS`에 한 줄 추가, 페이지에 `../shared/watch.js` 포함.
배포할 때는 `sw.js`의 `VERSION` 숫자 올리기.

테스트: `npm test`

폰트: Pretendard (SIL OFL 1.1, `shared/fonts/LICENSE-Pretendard.txt`)
