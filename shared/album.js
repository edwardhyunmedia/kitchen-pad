// 아이폰 공유 앨범 사진: 내 구글 스크립트(캘린더와 같은 주소)가 사진 주소 목록을 알려주면,
// 태블릿은 그 주소로 애플 서버에서 사진을 바로 받아서 사진 시계에 몇 분마다 바꿔 보여줌.
// 켜져 있을 때만 요청함. 보내는 건 스크립트 주소(비밀 열쇠 포함)뿐.
import { load, save } from './store.js';
import { isCalUrl } from './calendar.js';

export function albumUrl(base) {
  const u = new URL(base);
  u.searchParams.set('a', 'photos');
  return u.toString();
}

export function pickPhoto(photos, now, minutes = 5) {
  if (!photos || !photos.length) return null;
  return photos[Math.floor(now / (minutes * 60000)) % photos.length];
}

export function cleanPhotos(list) {
  return (Array.isArray(list) ? list : []).filter(p => {
    try { const u = new URL(p.url); return u.protocol === 'https:' && u.hostname.endsWith('.icloud-content.com'); } catch { return false; }
  });
}

// 애플 사진 주소는 20분쯤 뒤 만료됨 → 가장 빨리 만료되는 것보다 3분 앞서 새로 받음
export function freshUntil(photos, at) {
  const exp = Math.min(...(photos || []).map(p => { try { return Number(new URL(p.url).searchParams.get('e')) * 1000 || Infinity; } catch { return Infinity; } }));
  return Math.min(at + 25 * 60000, exp - 3 * 60000);
}

export async function getAlbum(force = false) {
  const st = load('settings', {});
  if (!st.album || !st.calUrl || !isCalUrl(st.calUrl)) return { photos: [] };
  const cache = load('album.cache', null);
  if (!force && cache && Date.now() < freshUntil(cache.photos, cache.at)) return { photos: cleanPhotos(cache.photos) };
  try {
    const res = await fetch(albumUrl(st.calUrl), { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'follow' });
    const data = await res.json();
    if (data.error) return { photos: cache ? cleanPhotos(cache.photos) : [], error: data.detail || data.error };
    const photos = cleanPhotos(data.photos);
    save('album.cache', { at: Date.now(), photos });
    return { photos };
  } catch (e) {
    return { photos: cache ? cleanPhotos(cache.photos) : [], error: String(e) };
  }
}
