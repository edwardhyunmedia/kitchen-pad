import { icons } from '../shared/icons.js';
import { save } from '../shared/store.js';
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
