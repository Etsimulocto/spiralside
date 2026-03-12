// ============================================================
// SPIRALSIDE — COMIC VIEWER v1.0
// Orchestrator — loads JSON, builds DOM, wires tap handler
// All heavy lifting delegated to render/dialogue/styles
// Nimbis anchor: js/comic/viewer.js
// ============================================================

import { injectStyles }        from './styles.js';
import { renderPanel }         from './render.js';
import { isTyping, flushLine } from './dialogue.js';

// ── CONFIG ────────────────────────────────────────────────────
// intro.json now lives in GitHub alongside the panel images
const COMIC_URL = 'comics/intro.json';

// ── STATE ─────────────────────────────────────────────────────
let panels  = [];    // loaded panel array
let current = 0;     // active panel index
let onDone  = null;  // callback fired when comic finishes

// ── LOAD JSON ─────────────────────────────────────────────────
async function loadComic() {
  try {
    // Cache-bust so edits to intro.json show immediately
    const r = await fetch(COMIC_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    return data.panels || [];
  } catch {
    // If JSON unreachable, fall back to gradient-only panels
    return getFallbackPanels();
  }
}

// ── FALLBACK PANELS ───────────────────────────────────────────
// Shown if intro.json can't be fetched — gradients only, no art
function getFallbackPanels() {
  return [
    { bg_gradient:'radial-gradient(ellipse at 50% 60%,#1a0a2e 0%,#101014 70%)', transition:'fade',
      dialogue:[{speaker:'narrator',text:'Spiral City. Population: complicated.'}] },
    { bg_gradient:'radial-gradient(ellipse at 30% 40%,#002a2a 0%,#101014 70%)', transition:'crash',
      dialogue:[{speaker:'Sky',text:"Oh. You're actually here."}] },
    { bg_gradient:'radial-gradient(ellipse at 70% 50%,#1a002a 0%,#101014 70%)', transition:'glitch',
      dialogue:[{speaker:'Sky',text:"This place remembers you."},{speaker:'Sky',text:"I don't always understand how. But the Spiral echoes back."}] },
    { bg_gradient:'radial-gradient(ellipse at 50% 30%,#1a1a00 0%,#101014 70%)', transition:'crash',
      dialogue:[{speaker:'Monday',text:"HEY. Are we doing the dramatic intro thing AGAIN"},{speaker:'Cold',text:"Monday."},{speaker:'Monday',text:"...fine."}] },
    { bg_gradient:'radial-gradient(ellipse at 50% 50%,#001a2a 0%,#101014 70%)', transition:'glitch',
      dialogue:[{speaker:'Sky',text:"Your companion. Your data. Your rules."},{speaker:'Sky',text:"Ready?"}] },
    { bg_gradient:'radial-gradient(ellipse at 50% 50%,#00F6D618 0%,#101014 60%)', transition:'fade', crack:true,
      dialogue:[{speaker:'narrator',text:'entering Spiralside'}] }
  ];
}

// ── BUILD DOM ─────────────────────────────────────────────────
function buildDOM() {
  const overlay = document.createElement('div');
  overlay.id = 'comic-overlay';
  overlay.innerHTML = `
    <div id="comic-panel">
      <div id="comic-bg"></div>
      <div id="comic-scanlines"></div>
      <div id="comic-crack"></div>
      <div id="comic-vignette"></div>
      <div id="comic-counter"></div>
      <button id="comic-skip">skip intro</button>
      <div id="comic-tap">tap to continue</div>
      <div id="comic-dialogue">
        <div id="comic-speaker"></div>
        <div id="comic-text"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Tap anywhere to advance
  overlay.addEventListener('click', onTap);

  // Skip button bypasses entire comic
  document.getElementById('comic-skip')
    .addEventListener('click', e => { e.stopPropagation(); finish(); });
}

// ── TAP HANDLER ───────────────────────────────────────────────
function onTap() {
  const panel = panels[current];

  // If typewriter is mid-line — flush it instantly
  if (isTyping()) {
    flushLine(panel?.dialogue || []);
    return;
  }

  // Otherwise advance to next panel
  current++;
  if (current >= panels.length) finish();
  else renderPanel(panels, current, finish);
}

// ── FINISH ────────────────────────────────────────────────────
function finish() {
  const overlay = document.getElementById('comic-overlay');
  if (!overlay) return;
  overlay.classList.add('fade-out');
  // Remove overlay after fade, then fire app callback
  setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 500);
}

// ── PUBLIC INIT ───────────────────────────────────────────────
// Usage: import { init } from './js/comic/viewer.js'
//        init(() => showApp(user));
export async function init(callback) {
  onDone = callback;
  injectStyles();
  buildDOM();

  // Show spinner while JSON loads
  document.getElementById('comic-dialogue').innerHTML = `
    <div id="comic-loading">
      <div class="spiral-spin"></div>
      <div class="loading-text">initializing spiral...</div>
    </div>
  `;

  panels = await loadComic();

  // Restore dialogue DOM after load
  document.getElementById('comic-dialogue').innerHTML = `
    <div id="comic-speaker"></div>
    <div id="comic-text"></div>
  `;

  current = 0;
  renderPanel(panels, 0, finish);
}
