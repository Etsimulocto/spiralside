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

export function playCustomComic(customPanels, onDone) {
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
    setTimeout(() => {
      screen.style.display = 'none';
      if (onDone) onDone();  // jump back to wherever we came from
    }, 500);
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
  // apply filter effect if panel has one (from timeline slot editor)
  bg.style.filter = (p.filter_css && p.filter_css !== 'none') ? p.filter_css : '';

  void bg.offsetWidth;
  bg.classList.add(p.transition || 'fade');

  document.getElementById('comic-crack').classList.toggle('show', !!p.crack);

  // ── FRAME SVG OVERLAY ─────────────────────────────────────
  // Panel carries frame_svg from the book timeline frame track
  let _frmEl = document.getElementById('comic-frame-svg-overlay');
  if (p.frame_svg) {
    if (!_frmEl) {
      _frmEl = document.createElement('div');
      _frmEl.id = 'comic-frame-svg-overlay';
      _frmEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;width:100%;height:100%';
      document.getElementById('comic-panel')?.appendChild(_frmEl);
    }
    _frmEl.innerHTML = p.frame_svg;
    const _fsvg = _frmEl.querySelector('svg');
    if (_fsvg) _fsvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    _frmEl.style.display = '';
  } else if (_frmEl) {
    _frmEl.innerHTML = '';
    _frmEl.style.display = 'none';
  }
  if (idx >= 1) document.getElementById('comic-skip').classList.add('visible');

  const counter = document.getElementById('comic-counter');
  counter.innerHTML = PANELS.map((_, i) =>
    '<div class="comic-dot ' + (i === idx ? 'active' : i < idx ? 'done' : '') + '"></div>'
  ).join('');

  // Clear positioned text overlays from previous panel
  _clearPositionedOverlays();
  // Reset dialogue box visibility
  const _dlg = document.getElementById('comic-dialogue');
  if (_dlg) _dlg.style.visibility = '';
  // If all lines have pos, hide dialogue box preemptively
  const _lines = p.dialogue || [];
  if (_lines.length && _lines.every(l => l.pos)) {
    if (_dlg) _dlg.style.visibility = 'hidden';
  }

  comicLineIdx = 0;
  comicTypeLine(_lines, 0, onFinish);
}

// ── SPEAKER COLOR MAP ─────────────────────────────────────────
const COMIC_SPEAKER_COLORS = {
  sky:'#00F6D6', monday:'#FF4BCB', cold:'#4DA3FF',
  grit:'#FFD93D', you:'#7B5FFF', narrator:'rgba(243,247,255,0.85)',
};

// ── POSITION MAP ───────────────────────────────────────────────
// pos string → CSS for the overlay bubble container
function _posCSS(pos) {
  const map = {
    'top-left':    'top:8%;left:4%;right:auto;bottom:auto;',
    'top-center':  'top:8%;left:50%;transform:translateX(-50%);right:auto;bottom:auto;',
    'top-right':   'top:8%;right:4%;left:auto;bottom:auto;',
    'mid-left':    'top:50%;transform:translateY(-50%);left:4%;right:auto;bottom:auto;',
    'mid-center':  'top:50%;left:50%;transform:translate(-50%,-50%);right:auto;bottom:auto;',
    'mid-right':   'top:50%;transform:translateY(-50%);right:4%;left:auto;bottom:auto;',
    'bot-left':    'bottom:14%;left:4%;right:auto;top:auto;',
    'bot-center':  'bottom:14%;left:50%;transform:translateX(-50%);right:auto;top:auto;',
    'bot-right':   'bottom:14%;right:4%;left:auto;top:auto;',
  };
  return map[pos] || map['bot-center'];
}

// ── STYLE MAP ─────────────────────────────────────────────────
function _bubbleStyle(style, speakerColor) {
  const base = 'position:absolute;z-index:11;max-width:80%;pointer-events:none;';
  const borderColor = speakerColor || '#00F6D6';
  switch(style) {
    case 'caption':
      return base + 'background:rgba(10,10,14,0.82);border:none;border-top:2px solid '+borderColor+';padding:8px 12px;font-size:0.82rem;color:#F3F7FF;';
    case 'narration':
      return base + 'background:rgba(10,10,14,0.75);border:1px solid rgba(243,247,255,0.2);border-radius:4px;padding:8px 12px;font-size:0.78rem;color:#F3F7FF;font-style:italic;';
    case 'shout':
      return base + 'background:rgba(255,75,203,0.12);border:2px solid '+borderColor+';border-radius:4px;padding:10px 14px;font-size:0.96rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.04em;';
    case 'dialogue':
    default:
      return base + 'background:rgba(10,10,14,0.88);border:2px solid '+borderColor+';border-radius:3px 12px 12px 12px;padding:10px 14px;';
  }
}

// Clear all positioned text overlays on the panel
function _clearPositionedOverlays() {
  document.querySelectorAll('.comic-tb-overlay').forEach(el => el.remove());
}

// Render a positioned text box (typewriter) — returns the bubble el
function _renderPositionedBubble(line) {
  const panel = document.getElementById('comic-panel');
  if (!panel) return null;

  const speakerColor = COMIC_SPEAKER_COLORS[(line.speaker||'').toLowerCase()] || '#F3F7FF';

  const wrap = document.createElement('div');
  wrap.className = 'comic-tb-overlay';
  wrap.style.cssText = _posCSS(line.pos || 'bot-center');

  // Apply bubble style
  const bubble = document.createElement('div');
  bubble.style.cssText = _bubbleStyle(line.style, speakerColor);

  // Speaker label (not for narrator or empty)
  if (line.speaker && line.speaker !== 'narrator') {
    const spk = document.createElement('div');
    spk.style.cssText = 'font-size:0.56rem;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:'+speakerColor+';margin-bottom:4px;';
    spk.textContent = line.speaker;
    bubble.appendChild(spk);
  }

  const textEl = document.createElement('div');
  textEl.style.cssText = 'font-size:0.84rem;line-height:1.55;color:#F3F7FF;';
  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  panel.appendChild(wrap);

  return textEl;
}

function comicTypeLine(lines, idx, onFinish) {
  if (!lines.length) return;
  comicLineIdx = idx;
  if (idx >= lines.length) return;

  const line = lines[idx];

  if (comicTyping) clearInterval(comicTyping);

  if (line.pos) {
    // ── POSITIONED TEXT BOX ─────────────────────────────────
    // Clear previous overlays for this panel, then render at position
    // (keep overlays from earlier lines — accumulate them)
    const textEl = _renderPositionedBubble(line);
    if (!textEl) { comicTyping = null; return; }

    // Hide the standard dialogue box for positioned lines
    const dlg = document.getElementById('comic-dialogue');
    if (dlg) dlg.style.visibility = 'hidden';

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

  } else {
    // ── STANDARD DIALOGUE BOX (Sky intro compat) ─────────────
    const dlg = document.getElementById('comic-dialogue');
    if (dlg) dlg.style.visibility = '';
    const speakerEl = document.getElementById('comic-speaker');
    const textEl    = document.getElementById('comic-text');

    speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
    speakerEl.className   = line.speaker.toLowerCase();
    textEl.textContent    = '';

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
}

function comicFlush() {
  if (!comicTyping) return;
  clearInterval(comicTyping);
  comicTyping = null;

  const lines = PANELS[comicPanel] ? PANELS[comicPanel].dialogue || [] : [];
  const line  = lines[comicLineIdx];
  if (!line) return;

  if (line.pos) {
    // Flush to the last positioned overlay's text element
    const overlays = document.querySelectorAll('.comic-tb-overlay');
    const last = overlays[overlays.length - 1];
    if (last) {
      const textEl = last.querySelector('div:last-child');
      if (textEl) textEl.textContent = line.text;
    }
  } else {
    document.getElementById('comic-text').textContent    = line.text;
    document.getElementById('comic-speaker').textContent = line.speaker === 'narrator' ? '' : line.speaker;
    document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
  }
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
