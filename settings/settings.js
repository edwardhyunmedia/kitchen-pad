import { icons } from '../shared/icons.js';
import { save, load } from '../shared/store.js';
import { isCalUrl, getEvents } from '../shared/calendar.js';
import { faceById } from '../shared/faces.js';
import { getSettings, setSettings, savePhoto, getPhotoUrl, deletePhoto } from '../shared/settings.js';

const $ = id => document.getElementById(id);
$('home-btn').innerHTML = icons.home;
$('pick-th').innerHTML = icons.plus;
let s = getSettings();
let armedReset = false;

async function draw() {
  s = getSettings();
  $('face-name').textContent = faceById(s.face.id).name;
  $('idle').value = String(s.idleSec);
  $('blur').value = s.bg.blur;
  $('dim').value = s.bg.dim;
  $('weather').classList.toggle('on', !!s.weather);
  $('weather').setAttribute('aria-pressed', !!s.weather);
  const url = await getPhotoUrl();
  $('photo-th').style.backgroundImage = url ? `url('${url}')` : '';
  $('photo-th').innerHTML = url ? '' : icons.photo;
  $('opt-photo').disabled = !url;
  $('del-photo').disabled = !url;
  $('del-photo').style.opacity = url ? 1 : 0.4;
  document.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('sel', b.dataset.bg === (s.bg.type === 'photo' && url ? 'photo' : 'default')));
}

document.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => { setSettings({ bg: { ...s.bg, type: b.dataset.bg } }); draw(); }));
$('file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  await savePhoto(f);
  setSettings({ bg: { ...getSettings().bg, type: 'photo' } });
  draw();
});
$('file2').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { await savePhoto(f); e.target.value = ''; draw(); } });
$('blur').addEventListener('input', e => setSettings({ bg: { ...getSettings().bg, blur: Number(e.target.value) } }));
$('dim').addEventListener('input', e => setSettings({ bg: { ...getSettings().bg, dim: Number(e.target.value) } }));
$('del-photo').addEventListener('click', async () => { await deletePhoto(); setSettings({ bg: { ...getSettings().bg, type: 'default' } }); draw(); });
$('weather').addEventListener('click', () => { setSettings({ weather: !getSettings().weather }); draw(); });
$('idle').addEventListener('change', e => setSettings({ idleSec: Number(e.target.value) }));
$('reset-layout').addEventListener('click', () => {
  if (!armedReset) { armedReset = true; $('reset-layout').textContent = '한 번 더 누르면 처음대로'; return; }
  save('home.layout', null);
  armedReset = false;
  $('reset-layout').textContent = '처음대로 바꿨어요';
});
draw();

// ---------- 구글 캘린더 ----------
async function drawCal(force) {
  const st = getSettings();
  $('cal-url').value = st.calUrl || '';
  $('cal-min').value = String(st.calAlertMin ?? 10);
  if (!st.calUrl) { $('cal-status').textContent = '연결 안 됨'; return; }
  $('cal-status').textContent = '확인하는 중…';
  const ev = await getEvents(force);
  const c = load('cal.cache', null);
  $('cal-status').textContent = c && ev ? `연결됨, 7일 일정 ${ev.length}개` : '연결 실패: 주소나 배포 설정을 확인해 주세요';
}
$('cal-url').addEventListener('change', e => {
  const v = e.target.value.trim();
  if (v && !isCalUrl(v)) { $('cal-status').textContent = 'script.google.com 주소만 넣을 수 있어요'; return; }
  setSettings({ calUrl: v });
  save('cal.cache', null);
  // 처음 연결하면 홈에 "오늘 일정" 위젯 추가
  if (v) { const l = load('home.layout', null); if (Array.isArray(l) && !l.includes('w:cal')) save('home.layout', [...l, 'w:cal']); }
  drawCal(true);
});
$('cal-min').addEventListener('change', e => setSettings({ calAlertMin: Number(e.target.value) }));
$('cal-test').addEventListener('click', () => drawCal(true));
drawCal(false);

// ---------- 야간 모드 ----------
function drawNight() {
  const n = getSettings().night;
  $('night-on').classList.toggle('on', !!n.on);
  $('night-dim').classList.toggle('on', !!n.dimScreen);
  $('night-from').value = n.from;
  $('night-to').value = n.to;
}
const setNight = patch => { setSettings({ night: { ...getSettings().night, ...patch } }); drawNight(); };
$('night-on').addEventListener('click', () => setNight({ on: !getSettings().night.on }));
$('night-dim').addEventListener('click', () => setNight({ dimScreen: !getSettings().night.dimScreen }));
$('night-from').addEventListener('change', e => e.target.value && setNight({ from: e.target.value }));
$('night-to').addEventListener('change', e => e.target.value && setNight({ to: e.target.value }));
drawNight();
