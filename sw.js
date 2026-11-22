// 오프라인용 캐시. 배포할 때마다 VERSION 숫자를 올림.
const VERSION = 'kp-v11';
const FILES = [
  "./",
  "meds/",
  "coffee/",
  "settings/",
  "coffee/coffee.js",
  "coffee/index.html",
  "coffee/logic.js",
  "index.html",
  "meds/index.html",
  "meds/logic.js",
  "meds/meds.js",
  "meds/state.js",
  "robots.txt",
  "settings/index.html",
  "settings/settings.js",
  "shared/alarm.js",
  "shared/appicons.js",
  "shared/faces.css",
  "shared/faces.js",
  "shared/fonts/LICENSE-Pretendard.txt",
  "shared/fonts/PretendardVariable.woff2",
  "shared/home.css",
  "shared/home.js",
  "shared/icons.js",
  "shared/inframe.js",
  "shared/ios.css",
  "shared/layout.js",
  "shared/live.js",
  "shared/mini.js",
  "shared/settings.js",
  "shared/store.js",
  "shared/style.css",
  "shared/summary.js",
  "shared/watch.js",
  "shared/weather.js",
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
// 같은 주소의 파일만 다룸. 먼저 인터넷에서 새로 받고, 안 되면 저장해둔 것 사용.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    // 저장해둔 예전 파일 말고 항상 새 파일이 있는지 확인
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        const copy = res.clone();
        if (res.ok) caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
