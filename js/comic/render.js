// ============================================================
// SPIRALSIDE — COMIC RENDER v1.0
// Handles panel background, transitions, crack, and dots
// Imports dialogue module to kick off typewriter per panel
// Nimbis anchor: js/comic/render.js
// ============================================================

import { typeLine } from './dialogue.js';

// Renders a single panel by index into the existing DOM
// Called by viewer.js on init and on each tap advance
export function renderPanel(panels, index, onFinish) {

  const panel = panels[index];

  // No panel at this index — comic is over
  if (!panel) { onFinish(); return; }

  // ── SET BACKGROUND ──
  const bg = document.getElementById('comic-bg');
  bg.className = '';  // Clear previous transition class

  if (panel.image) {
    // Full URL baked into JSON — pass straight through
    bg.style.cssText = `background-image:url(${panel.image});background-size:cover;background-position:center;`;
  } else if (panel.bg_gradient) {
    // Gradient fallback when no art exists yet
    bg.style.cssText = `background:${panel.bg_gradient};`;
  } else {
    // Last resort flat color
    bg.style.cssText = `background:${panel.bg_color || '#101014'};`;
  }

  // Force reflow so animation retriggers cleanly
  void bg.offsetWidth;
  bg.classList.add(panel.transition || 'fade');

  // ── CRACK EFFECT (final panel only) ──
  document.getElementById('comic-crack')
    .classList.toggle('show', !!panel.crack);

  // ── SHOW SKIP AFTER FIRST PANEL ──
  if (index >= 1) {
    document.getElementById('comic-skip').classList.add('visible');
  }

  // ── UPDATE PROGRESS DOTS ──
  const counter = document.getElementById('comic-counter');
  counter.innerHTML = panels.map((_, i) =>
    `<div class="comic-dot ${i === index ? 'active' : i < index ? 'done' : ''}"></div>`
  ).join('');

  // ── START DIALOGUE TYPEWRITER ──
  typeLine(panel.dialogue || [], 0);
}
