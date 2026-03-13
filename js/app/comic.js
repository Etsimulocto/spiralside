// ============================================================
// SPIRALSIDE — COMIC v1.1
// Fetches intro.json from GitHub for panel art
// Falls back to gradient-only panels if fetch fails
// Nimbis anchor: js/app/comic.js
// ============================================================

const COMIC_URL = 'https://raw.githubusercontent.com/Etsimulocto/spiralside/main/comics/intro.json';

const FALLBACK_PANELS = [
  { bg_gradient: 'radial-gradient(ellipse at 50% 60%,#1a0a2e 0%,#08080d 70%)', transition: 'fade',
    dialogue: [{ speaker: 'narrator', text: 'Spiral City. Population: complicated.' }] },
  { bg_gradient: 'radial-gradient(ellipse at 30% 40%,#002a2a 0%,#08080d 70%)', transition: 'crash',
    dialogue: [{ speaker: 'Sky', text: "Oh. You're actually here." }] },
  { bg_gradient: 'radial-gradient(ellipse at 70% 50%,#1a002a 0%,#08080d 70%)', transition: 'glitch',
    dialogue: [{ speaker: 'Sky', text: 'This place remembers you.' },
               { speaker: 'Sky', text: "I don't always understand how. But the Spiral echoes back." }] },
  { bg_gradient: 'radial-gradient(ellipse at 50% 30%,#1a1a00 0%,#08080d 70%)', transition: 'crash',
    dialogue: [{ speaker: 'Monday', text: 'HEY. Are we doing the dramatic intro thing AGAIN' },
               { speaker: 'Cold', text: 'Monday.' },
               { speaker: 'Monday', text: '...fine.' }] },
  { bg_gradient: 'radial-gradient(ellipse at 50% 50%,#001a2a 0%,#08080d 70%)', transition: 'glitch',
    dialogue: [{ speaker: 'Sky', text: 'Your companion. Your data. Your rules.' },
               { speaker: 'Sky', text: 'Ready?' }] },
  { bg_gradient: 'radial-gradient(ellipse at 50% 50%,rgba(0,246,214,0.12) 0%,#08080d 60%)', transition: 'fade', crack: true,
    dialogue: [{ speaker: 'narrator', text: '-- entering Spiralside --' }] },
];

let PANELS       = [];
let comicPanel   = 0;
let comicTyping  = null;
let comicLineIdx = 0;

export function playCustomComic(customPanels) {
  if (!customPanels || !customPanels.length) return;
  PANELS = customPanels;
  comicPanel = 0;
  const screen = document.getElementById('screen-comic');
  screen.classList.remove('fade-out');
  screen.style.display = '';
  const skipBtn = document.getElementById('comic-skip');
  if (skipBtn) skipBtn.classList.remove('visible');
  const onFinish = () => {
    screen.classList.add('fade-out');
    setTimeout(() => { screen.style.display = 'none'; }, 500);
  };
  if (screen._customTap) screen.removeEventListener('click', screen._customTap);
  screen._customTap = () => comicTap(onFinish);
  screen.addEventListener('click', screen._customTap);
  if (skipBtn) skipBtn.onclick = e => { e.stopPropagation(); comicFinish(onFinish); };
  comicRender(0, onFinish);
}

export async function initComic(onFinish) {
  document.getElementById('screen-comic')
    .addEventListener('click', () => comicTap(onFinish));
  document.getElementById('comic-skip')
    .addEventListener('click', e => { e.stopPropagation(); comicFinish(onFinish); });

  try {
    const r = await fetch(COMIC_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    PANELS = data.panels || FALLBACK_PANELS;
  } catch (err) {
    PANELS = FALLBACK_PANELS;
  }

  comicPanel = 0;
  comicRender(0, onFinish);
}

function comicRender(idx, onFinish) {
  const p = PANELS[idx];
  if (!p) { comicFinish(onFinish); return; }

  const bg = document.getElementById('comic-bg');
  bg.className = '';
  bg.style.cssText = p.image
    ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
    : 'background:' + p.bg_gradient + ';';

  void bg.offsetWidth;
  bg.classList.add(p.transition || 'fade');

  document.getElementById('comic-crack').classList.toggle('show', !!p.crack);
  if (idx >= 1) document.getElementById('comic-skip').classList.add('visible');

  const counter = document.getElementById('comic-counter');
  counter.innerHTML = PANELS.map((_, i) =>
    '<div class="comic-dot ' + (i === idx ? 'active' : i < idx ? 'done' : '') + '"></div>'
  ).join('');

  comicLineIdx = 0;
  comicTypeLine(p.dialogue || [], 0, onFinish);
}

function comicTypeLine(lines, idx, onFinish) {
  if (!lines.length) return;
  comicLineIdx = idx;
  if (idx >= lines.length) return;

  const line      = lines[idx];
  const speakerEl = document.getElementById('comic-speaker');
  const textEl    = document.getElementById('comic-text');

  speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
  speakerEl.className   = line.speaker.toLowerCase();
  textEl.textContent    = '';

  if (comicTyping) clearInterval(comicTyping);

  let i = 0;
  const speed = line.speaker === 'narrator' ? 32 : 20;

  comicTyping = setInterval(function() {
    textEl.textContent += line.text[i++];
    if (i >= line.text.length) {
      clearInterval(comicTyping);
      comicTyping = null;
      if (idx + 1 < lines.length) {
        setTimeout(function() { comicTypeLine(lines, idx + 1, onFinish); }, 1100);
      }
    }
  }, speed);
}

function comicFlush() {
  if (!comicTyping) return;
  clearInterval(comicTyping);
  comicTyping = null;

  const lines = PANELS[comicPanel] ? PANELS[comicPanel].dialogue || [] : [];
  const line  = lines[comicLineIdx];
  if (!line) return;

  document.getElementById('comic-text').textContent    = line.text;
  document.getElementById('comic-speaker').textContent = line.speaker === 'narrator' ? '' : line.speaker;
  document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
}

function comicTap(onFinish) {
  if (comicTyping) { comicFlush(); return; }
  comicPanel++;
  if (comicPanel >= PANELS.length) comicFinish(onFinish);
  else comicRender(comicPanel, onFinish);
}

function comicFinish(onFinish) {
  const el = document.getElementById('screen-comic');
  el.classList.add('fade-out');
  setTimeout(function() { el.style.display = 'none'; onFinish(); }, 500);
}
