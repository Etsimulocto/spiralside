// ============================================================
// SPIRALSIDE — COMIC v1.0
// Self-contained comic intro: panels, typewriter, tap handler
// Calls onFinish() when done — wired to checkAuthAndShow in main
// Nimbis anchor: js/app/comic.js
// ============================================================

// ── PANEL DATA ────────────────────────────────────────────────
// Gradients are dark-to-bg — panel images overlay when provided
const PANELS = [
  { bg_gradient: 'radial-gradient(ellipse at 50% 60%,#1a0a2e 0%,#08080d 70%)',
    transition: 'fade',
    dialogue: [{ speaker: 'narrator', text: 'Spiral City. Population: complicated.' }] },

  { bg_gradient: 'radial-gradient(ellipse at 30% 40%,#002a2a 0%,#08080d 70%)',
    transition: 'crash',
    dialogue: [{ speaker: 'Sky', text: "Oh. You're actually here." }] },

  { bg_gradient: 'radial-gradient(ellipse at 70% 50%,#1a002a 0%,#08080d 70%)',
    transition: 'glitch',
    dialogue: [
      { speaker: 'Sky', text: 'This place remembers you.' },
      { speaker: 'Sky', text: "I don't always understand how. But the Spiral echoes back." },
    ] },

  { bg_gradient: 'radial-gradient(ellipse at 50% 30%,#1a1a00 0%,#08080d 70%)',
    transition: 'crash',
    dialogue: [
      { speaker: 'Monday', text: 'HEY. Are we doing the dramatic intro thing AGAIN' },
      { speaker: 'Cold',   text: 'Monday.' },
      { speaker: 'Monday', text: '...fine.' },
    ] },

  { bg_gradient: 'radial-gradient(ellipse at 50% 50%,#001a2a 0%,#08080d 70%)',
    transition: 'glitch',
    dialogue: [
      { speaker: 'Sky', text: 'Your companion. Your data. Your rules.' },
      { speaker: 'Sky', text: 'Ready?' },
    ] },

  { bg_gradient: 'radial-gradient(ellipse at 50% 50%,rgba(0,246,214,0.12) 0%,#08080d 60%)',
    transition: 'fade',
    crack: true,
    dialogue: [{ speaker: 'narrator', text: '— entering Spiralside —' }] },
];

// ── MODULE STATE ──────────────────────────────────────────────
let comicPanel  = 0;    // current panel index
let comicTyping = null; // active typewriter interval
let comicLineIdx = 0;   // current dialogue line within panel

// ── INIT ──────────────────────────────────────────────────────
// Call once. onFinish fires when comic ends or user skips.
export function initComic(onFinish) {
  // Tap anywhere to advance
  document.getElementById('screen-comic')
    .addEventListener('click', () => comicTap(onFinish));

  // Skip button bypasses everything
  document.getElementById('comic-skip')
    .addEventListener('click', e => { e.stopPropagation(); comicFinish(onFinish); });

  // Render first panel
  comicRender(0, onFinish);
}

// ── RENDER PANEL ──────────────────────────────────────────────
function comicRender(idx, onFinish) {
  const p = PANELS[idx];
  if (!p) { comicFinish(onFinish); return; }

  // Set background
  const bg = document.getElementById('comic-bg');
  bg.className = ''; // clear previous animation class
  bg.style.cssText = p.image
    ? `background-image:url(${p.image});background-size:cover;background-position:center`
    : `background:${p.bg_gradient}`;

  // Force reflow so animation retriggers
  void bg.offsetWidth;
  bg.classList.add(p.transition || 'fade');

  // Crack effect (final panel only)
  document.getElementById('comic-crack').classList.toggle('show', !!p.crack);

  // Show skip button after first panel
  if (idx >= 1) document.getElementById('comic-skip').classList.add('visible');

  // Progress dots
  const counter = document.getElementById('comic-counter');
  counter.innerHTML = PANELS.map((_, i) =>
    `<div class="comic-dot ${i === idx ? 'active' : i < idx ? 'done' : ''}"></div>`
  ).join('');

  // Start typewriter on first dialogue line
  comicLineIdx = 0;
  comicTypeLine(p.dialogue || [], 0, onFinish);
}

// ── TYPEWRITER ────────────────────────────────────────────────
function comicTypeLine(lines, idx, onFinish) {
  if (!lines.length) return;
  comicLineIdx = idx;
  if (idx >= lines.length) return;

  const line      = lines[idx];
  const speakerEl = document.getElementById('comic-speaker');
  const textEl    = document.getElementById('comic-text');

  // Speaker label + color class
  speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
  speakerEl.className   = line.speaker.toLowerCase();
  textEl.textContent    = '';

  // Clear any running typewriter
  if (comicTyping) clearInterval(comicTyping);

  let i = 0;
  // Narrator is slower for dramatic weight
  const speed = line.speaker === 'narrator' ? 32 : 20;

  comicTyping = setInterval(() => {
    textEl.textContent += line.text[i++];
    if (i >= line.text.length) {
      clearInterval(comicTyping);
      comicTyping = null;
      // Auto-advance to next line in same panel after a beat
      if (idx + 1 < lines.length) {
        setTimeout(() => comicTypeLine(lines, idx + 1, onFinish), 1100);
      }
    }
  }, speed);
}

// ── FLUSH (skip to end of current line instantly) ─────────────
function comicFlush() {
  if (!comicTyping) return;
  clearInterval(comicTyping);
  comicTyping = null;

  const lines = PANELS[comicPanel]?.dialogue || [];
  const line  = lines[comicLineIdx];
  if (!line) return;

  document.getElementById('comic-text').textContent    = line.text;
  document.getElementById('comic-speaker').textContent = line.speaker === 'narrator' ? '' : line.speaker;
  document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
}

// ── TAP HANDLER ───────────────────────────────────────────────
function comicTap(onFinish) {
  // If typewriter mid-line — flush it
  if (comicTyping) { comicFlush(); return; }
  // Else advance to next panel
  comicPanel++;
  if (comicPanel >= PANELS.length) comicFinish(onFinish);
  else comicRender(comicPanel, onFinish);
}

// ── FINISH ────────────────────────────────────────────────────
function comicFinish(onFinish) {
  const el = document.getElementById('screen-comic');
  el.classList.add('fade-out');
  setTimeout(() => {
    el.style.display = 'none';
    onFinish();
  }, 500);
}

