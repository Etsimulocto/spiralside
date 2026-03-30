// ============================================================
// SPIRALSIDE — IMAGINE v1.2
// AI image generation via Railway -> HF FLUX.1-schnell
// Free: 3/day 512x512 | Paid: 5cr, up to 1024x1024
// v1.2 — Extended prompt fields, imagineWithContext API
// Nimbis anchor: js/app/imagine.js
// ============================================================

import { RAIL } from './state.js';

// ── PUBLIC API ────────────────────────────────────────────────
// Called by Forge, SpiralCut, Codex to pre-fill and switch to Imagine tab.
// ctx shape:
//   { subject, appearance, species, scene, world, timeOfDay,
//     style, mood, lighting, camera, negativePrompt }
window.imagineWithContext = function(ctx = {}) {
  // Switch to imagine tab first
  if (typeof switchView === 'function') switchView('imagine');

  // Small defer so the view is rendered before we try to fill fields
  setTimeout(() => {
    // Core prompt: build subject line from ctx
    const parts = [];
    if (ctx.subject)    parts.push(ctx.subject);
    if (ctx.appearance) parts.push(ctx.appearance);
    if (ctx.species)    parts.push(ctx.species);
    const subjectLine = parts.join(', ');
    if (subjectLine) {
      const promptEl = document.getElementById('imagine-prompt');
      if (promptEl) promptEl.value = subjectLine;
    }

    // Negative prompt
    if (ctx.negativePrompt) {
      const negEl = document.getElementById('imagine-neg');
      if (negEl) negEl.value = ctx.negativePrompt;
    }

    // Extended fields — fill text inputs
    _fillField('ix-appearance', ctx.appearance || '');
    _fillField('ix-species',    ctx.species    || '');
    _fillField('ix-scene',      ctx.scene      || '');
    _fillField('ix-world',      ctx.world      || '');

    // Chips — activate matching values
    if (ctx.timeOfDay) _activateChip('ix-chips-time',     ctx.timeOfDay);
    if (ctx.style)     _activateChip('ix-chips-style',    ctx.style);
    if (ctx.mood)      _activateChip('ix-chips-mood',     ctx.mood);
    if (ctx.lighting)  _activateChip('ix-chips-lighting', ctx.lighting);
    if (ctx.camera)    _activateChip('ix-chips-camera',   ctx.camera);

    // Expand the extended options panel so user sees what got filled
    const toggle  = document.getElementById('ix-toggle');
    const content = document.getElementById('ix-extended');
    if (toggle && content && !content.classList.contains('open')) {
      content.classList.add('open');
      toggle.classList.add('open');
    }
  }, 80);
};

function _fillField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function _activateChip(groupId, val) {
  const group = document.getElementById(groupId);
  if (!group) return;
  // Case-insensitive match on data-val or textContent
  group.querySelectorAll('.ix-chip').forEach(chip => {
    const match = (chip.dataset.val || chip.textContent).toLowerCase() === val.toLowerCase();
    if (match) chip.classList.add('active');
  });
}

// ── INIT ──────────────────────────────────────────────────────
export function initImagine() {
  const el = document.getElementById('view-imagine');
  if (!el) return;
  injectImagineStyles();
  el.innerHTML = buildGeneratorHTML();
  wireGenerator();
}

// ── HTML ──────────────────────────────────────────────────────
function buildGeneratorHTML() {
  return `
  <div id="imagine-inner">

    <!-- ── HEADER ── -->
    <div class="imagine-header">✦ IMAGINE</div>

    <!-- ── CORE PROMPT ── -->
    <div class="imagine-section">
      <div class="imagine-label">✏ prompt</div>
      <textarea class="imagine-input" id="imagine-prompt" rows="4"
        placeholder="Sky floating above a neon city at night, bloomcore art style..."></textarea>
    </div>

    <!-- ── NEGATIVE PROMPT ── -->
    <div class="imagine-section">
      <div class="imagine-label">🚫 negative prompt</div>
      <textarea class="imagine-input" id="imagine-neg" rows="2"
        placeholder="blurry, low quality, realistic photo, ugly, deformed"></textarea>
    </div>

    <!-- ── EXTENDED OPTIONS TOGGLE ── -->
    <button class="ix-toggle-btn" id="ix-toggle" onclick="window._ixToggle()">
      <span>▶ extended options</span>
    </button>

    <!-- ── EXTENDED FIELDS (hidden by default) ── -->
    <div class="ix-extended" id="ix-extended">

      <!-- CHARACTER -->
      <div class="ix-group-label">character</div>

      <div class="imagine-section">
        <div class="imagine-label">appearance</div>
        <input class="imagine-input" id="ix-appearance" type="text"
          placeholder="silver hair, teal eyes, tactical hoodie, spiral tattoo..." />
      </div>

      <div class="imagine-section">
        <div class="imagine-label">species / type</div>
        <input class="imagine-input" id="ix-species" type="text"
          placeholder="human, AI, cryptid, android..." />
      </div>

      <!-- SCENE / WORLD -->
      <div class="ix-group-label">scene / world</div>

      <div class="imagine-section">
        <div class="imagine-label">scene / location</div>
        <input class="imagine-input" id="ix-scene" type="text"
          placeholder="rooftop, server lab, neon alley, forest clearing..." />
      </div>

      <div class="imagine-section">
        <div class="imagine-label">world</div>
        <input class="imagine-input" id="ix-world" type="text"
          placeholder="Spiral City, void space, Bloomcore district..." />
      </div>

      <div class="imagine-section">
        <div class="imagine-label">time of day</div>
        <div class="ix-chips" id="ix-chips-time">
          <div class="ix-chip" data-val="dawn">dawn</div>
          <div class="ix-chip" data-val="midday">midday</div>
          <div class="ix-chip" data-val="dusk">dusk</div>
          <div class="ix-chip" data-val="4am">4am</div>
          <div class="ix-chip" data-val="void">void</div>
        </div>
      </div>

      <!-- STYLE -->
      <div class="ix-group-label">style</div>

      <div class="imagine-section">
        <div class="imagine-label">art style</div>
        <div class="ix-chips" id="ix-chips-style">
          <div class="ix-chip" data-val="anime">anime</div>
          <div class="ix-chip" data-val="painterly">painterly</div>
          <div class="ix-chip" data-val="cinematic">cinematic</div>
          <div class="ix-chip" data-val="pixel art">pixel art</div>
          <div class="ix-chip" data-val="concept art">concept art</div>
          <div class="ix-chip" data-val="illustration">illustration</div>
        </div>
      </div>

      <div class="imagine-section">
        <div class="imagine-label">mood</div>
        <div class="ix-chips" id="ix-chips-mood">
          <div class="ix-chip" data-val="soft">soft</div>
          <div class="ix-chip" data-val="dramatic">dramatic</div>
          <div class="ix-chip" data-val="neon">neon</div>
          <div class="ix-chip" data-val="void">void</div>
          <div class="ix-chip" data-val="golden">golden</div>
          <div class="ix-chip" data-val="melancholic">melancholic</div>
        </div>
      </div>

      <!-- LIGHTING -->
      <div class="imagine-section">
        <div class="imagine-label">lighting</div>
        <div class="ix-chips" id="ix-chips-lighting">
          <div class="ix-chip" data-val="rim light">rim light</div>
          <div class="ix-chip" data-val="soft ambient">soft ambient</div>
          <div class="ix-chip" data-val="harsh">harsh</div>
          <div class="ix-chip" data-val="god rays">god rays</div>
          <div class="ix-chip" data-val="bioluminescent">bioluminescent</div>
          <div class="ix-chip" data-val="neon glow">neon glow</div>
        </div>
      </div>

      <!-- CAMERA -->
      <div class="imagine-section">
        <div class="imagine-label">camera angle</div>
        <div class="ix-chips" id="ix-chips-camera">
          <div class="ix-chip" data-val="portrait close-up">portrait</div>
          <div class="ix-chip" data-val="3/4 view">3/4 view</div>
          <div class="ix-chip" data-val="wide shot">wide shot</div>
          <div class="ix-chip" data-val="overhead">overhead</div>
          <div class="ix-chip" data-val="dutch angle">dutch angle</div>
          <div class="ix-chip" data-val="low angle">low angle</div>
        </div>
      </div>

    </div><!-- /ix-extended -->

    <!-- ── SIZE ── -->
    <div class="imagine-section">
      <div class="imagine-label">size <span style="color:var(--subtext);font-size:var(--subtext-size)">(paid only for larger)</span></div>
      <div class="size-chips">
        <div class="size-chip active" data-w="512"  data-h="512">512 × 512</div>
        <div class="size-chip" data-w="768"  data-h="768">768 × 768 ✦</div>
        <div class="size-chip" data-w="1024" data-h="768">1024 × 768 ✦</div>
        <div class="size-chip" data-w="768"  data-h="1024">768 × 1024 ✦</div>
      </div>
    </div>

    <!-- ── PROMPT PREVIEW (updates live) ── -->
    <div class="ix-preview-wrap" id="ix-preview-wrap" style="display:none">
      <div class="imagine-label">assembled prompt preview</div>
      <div class="ix-preview-text" id="ix-preview-text"></div>
    </div>

    <button class="imagine-btn" id="imagine-go">🎨 generate</button>
    <div class="imagine-error" id="imagine-error"></div>
    <div id="imagine-result"></div>

  </div>`;
}

// ── TOGGLE ────────────────────────────────────────────────────
// Exposed on window so onclick in HTML can reach it
window._ixToggle = function() {
  const btn     = document.getElementById('ix-toggle');
  const content = document.getElementById('ix-extended');
  if (!btn || !content) return;
  const isOpen = content.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.querySelector('span').textContent = isOpen
    ? '▼ extended options'
    : '▶ extended options';
};

// ── PROMPT ASSEMBLY ───────────────────────────────────────────
// Reads all fields and chip selections, builds a single quality prompt string.
function buildFinalPrompt() {
  const core = document.getElementById('imagine-prompt')?.value.trim() || '';

  // Extended text fields
  const appearance = document.getElementById('ix-appearance')?.value.trim() || '';
  const species    = document.getElementById('ix-species')?.value.trim()    || '';
  const scene      = document.getElementById('ix-scene')?.value.trim()      || '';
  const world      = document.getElementById('ix-world')?.value.trim()      || '';

  // Active chips — collect data-val from each group
  function getChip(groupId) {
    const active = document.querySelector(`#${groupId} .ix-chip.active`);
    return active ? (active.dataset.val || active.textContent.trim()) : '';
  }
  const timeOfDay = getChip('ix-chips-time');
  const style     = getChip('ix-chips-style');
  const mood      = getChip('ix-chips-mood');
  const lighting  = getChip('ix-chips-lighting');
  const camera    = getChip('ix-chips-camera');

  // Assemble in semantic order:
  // subject → appearance → scene/world context → style → mood → lighting → camera → quality tail
  const segments = [];

  if (core)       segments.push(core);
  if (appearance) segments.push(appearance);
  if (species)    segments.push(species);
  if (scene)      segments.push(`in ${scene}`);
  if (world)      segments.push(world);
  if (timeOfDay)  segments.push(timeOfDay);
  if (style)      segments.push(style);
  if (mood)       segments.push(`${mood} mood`);
  if (lighting)   segments.push(lighting);
  if (camera)     segments.push(camera);

  // Always append quality tags
  segments.push('detailed, high quality, sharp focus');

  const assembled = segments.filter(Boolean).join(', ');

  // Update live preview if extended panel is open
  const previewWrap = document.getElementById('ix-preview-wrap');
  const previewText = document.getElementById('ix-preview-text');
  if (previewText) {
    previewText.textContent = assembled;
    if (previewWrap) {
      previewWrap.style.display = document.getElementById('ix-extended')?.classList.contains('open')
        ? 'flex' : 'none';
    }
  }

  return assembled;
}

// ── WIRE ──────────────────────────────────────────────────────
function wireGenerator() {
  let selW = 512, selH = 512;

  // Size chip selection
  document.querySelectorAll('.size-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.size-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      selW = parseInt(c.dataset.w);
      selH = parseInt(c.dataset.h);
    });
  });

  // Extended chips — single-select per group (toggle off if clicked again)
  document.querySelectorAll('.ix-chips').forEach(group => {
    group.querySelectorAll('.ix-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const wasActive = chip.classList.contains('active');
        group.querySelectorAll('.ix-chip').forEach(c => c.classList.remove('active'));
        if (!wasActive) chip.classList.add('active');
        // Live-update preview
        buildFinalPrompt();
      });
    });
  });

  // Live preview on core prompt typing
  document.getElementById('imagine-prompt')?.addEventListener('input', buildFinalPrompt);
  document.getElementById('ix-appearance')?.addEventListener('input', buildFinalPrompt);
  document.getElementById('ix-species')?.addEventListener('input',    buildFinalPrompt);
  document.getElementById('ix-scene')?.addEventListener('input',      buildFinalPrompt);
  document.getElementById('ix-world')?.addEventListener('input',      buildFinalPrompt);

  // Generate button
  document.getElementById('imagine-go')?.addEventListener('click', async () => {
    const prompt   = buildFinalPrompt();
    const neg      = document.getElementById('imagine-neg')?.value.trim();
    const errEl    = document.getElementById('imagine-error');
    const resultEl = document.getElementById('imagine-result');
    const btn      = document.getElementById('imagine-go');

    if (!prompt || prompt === 'detailed, high quality, sharp focus') {
      errEl.textContent = 'Write a prompt first.';
      return;
    }
    errEl.textContent  = '';
    btn.textContent    = '🌀 generating...';
    btn.disabled       = true;
    resultEl.innerHTML = '<div class="imagine-spinner"></div>';

    try {
      const { data: { session } } = await window._sb.auth.getSession();
      const authToken = session?.access_token;
      if (!authToken) throw new Error('Not signed in.');

      const r = await fetch(`${RAIL}/generate-image`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, negative_prompt: neg, width: selW, height: selH }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `Error ${r.status}`);

      const url  = `data:image/png;base64,${data.image}`;
      const modelLabel = 'FLUX SCHNELL';
      const tier = data.is_paid
        ? `${modelLabel} · ${data.width}×${data.height} · ${data.credits_used || 5} CR USED`
        : `${modelLabel} · 512×512 · ${data.free_images_used}/${data.free_images_limit} today`;

      resultEl.innerHTML = `
        <div class="imagine-tier">${tier}</div>
        <img class="imagine-result-img" src="${url}" alt="generated" />
        <div class="imagine-result-actions">
          <button class="imagine-btn-sm" id="imagine-save">💾 save</button>
          <button class="imagine-btn-sm" id="imagine-reuse">↻ reuse prompt</button>
        </div>`;

      document.getElementById('imagine-save')?.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'spiralside-gen.png'; a.click();
      });

      // Reuse: copy assembled prompt back to core textarea
      document.getElementById('imagine-reuse')?.addEventListener('click', () => {
        const el = document.getElementById('imagine-prompt');
        if (el) el.value = prompt;
      });

    } catch(e) {
      errEl.textContent  = e.message;
      resultEl.innerHTML = '';
    } finally {
      btn.textContent = '🎨 generate';
      btn.disabled    = false;
    }
  });
}

// ── STYLES ────────────────────────────────────────────────────
export function injectImagineStyles() {
  if (document.getElementById('imagine-styles-v2')) return;
  const s = document.createElement('style');
  s.id = 'imagine-styles-v2';
  s.textContent = `
    /* ── VIEW SCROLL ── */
    #view-imagine { overflow-y: auto; padding: 16px 16px calc(80px + var(--safe-bot, 0px)); }
    #imagine-inner { display: flex; flex-direction: column; gap: 20px; max-width: 600px; margin: 0 auto; }

    /* ── HEADER ── */
    .imagine-header { font-family: var(--font-display); font-weight: 800; font-size: 1rem; letter-spacing: 0.12em; color: var(--teal); padding-top: 8px; }

    /* ── SECTIONS ── */
    .imagine-section { display: flex; flex-direction: column; gap: 8px; }
    .imagine-label { font-size: var(--subtext-size); letter-spacing: 0.1em; color: var(--subtext); text-transform: uppercase; }

    /* ── INPUTS ── */
    .imagine-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; color: var(--text); font-family: var(--font-ui); font-size: 0.82rem; outline: none; resize: none; transition: border-color 0.2s; box-sizing: border-box; }
    .imagine-input:focus { border-color: var(--teal); }
    .imagine-input::placeholder { color: var(--subtext); }

    /* ── TOGGLE BUTTON ── */
    .ix-toggle-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.72rem; letter-spacing: 0.08em; cursor: pointer; text-align: left; transition: border-color 0.2s, color 0.2s; }
    .ix-toggle-btn:hover, .ix-toggle-btn.open { border-color: var(--teal); color: var(--teal); }

    /* ── EXTENDED PANEL ── */
    .ix-extended { display: none; flex-direction: column; gap: 20px; padding: 16px; background: rgba(0,246,214,0.03); border: 1px solid rgba(0,246,214,0.12); border-radius: 10px; }
    .ix-extended.open { display: flex; }

    /* ── GROUP LABELS ── */
    .ix-group-label { font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--teal); opacity: 0.7; padding-bottom: 2px; border-bottom: 1px solid rgba(0,246,214,0.15); }

    /* ── CHIPS ── */
    .ix-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .ix-chip { padding: 6px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; font-size: 0.68rem; color: var(--subtext); cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em; user-select: none; }
    .ix-chip:hover { border-color: rgba(0,246,214,0.4); color: var(--text); }
    .ix-chip.active { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.08); }

    /* ── SIZE CHIPS ── */
    .size-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .size-chip { padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: var(--subtext-size); color: var(--subtext); cursor: pointer; transition: all 0.15s; }
    .size-chip.active { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.08); }

    /* ── PROMPT PREVIEW ── */
    .ix-preview-wrap { display: flex; flex-direction: column; gap: 6px; }
    .ix-preview-text { font-size: 0.72rem; color: var(--subtext); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; line-height: 1.6; font-style: italic; }

    /* ── GENERATE BUTTON ── */
    .imagine-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--teal), var(--purple)); border: none; border-radius: 12px; color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s; }
    .imagine-btn:hover { opacity: 0.88; }
    .imagine-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── ERROR ── */
    .imagine-error { font-size: 0.72rem; color: var(--pink); min-height: 18px; text-align: center; }

    /* ── SPINNER ── */
    .imagine-spinner { width: 40px; height: 40px; margin: 30px auto; border: 3px solid rgba(0,246,214,0.15); border-top-color: var(--teal); border-radius: 50%; animation: spin 0.85s linear infinite; }

    /* ── RESULT ── */
    .imagine-tier { font-size: var(--subtext-size); letter-spacing: 0.1em; color: var(--subtext); text-align: center; text-transform: uppercase; margin-bottom: 8px; }
    .imagine-result-img { width: 100%; border-radius: 12px; border: 1px solid var(--border); display: block; margin-bottom: 12px; }
    .imagine-result-actions { display: flex; gap: 8px; }
    .imagine-btn-sm { flex: 1; padding: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: var(--font-ui); font-size: 0.72rem; cursor: pointer; letter-spacing: 0.04em; transition: border-color 0.2s; }
    .imagine-btn-sm:hover { border-color: var(--teal); color: var(--teal); }
  `;
  document.head.appendChild(s);
}
