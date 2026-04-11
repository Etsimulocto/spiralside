// ============================================================
// SPIRALSIDE — IMAGINE v1.4
// Multi-model image gen + unified extended prompt fields
// Fields match Forge / Scene / World card schemas exactly
// Nimbis anchor: js/app/imagine.js
// ============================================================

import { RAIL } from './state.js';
import { sb }   from './auth.js';

// ── MODELS ────────────────────────────────────────────────────
const MODELS = [
  { id:'schnell',   label:'flux schnell',        sub:'fastest · draft quality · HuggingFace', cost:500,  color:'var(--teal)',   icon:'⚡' },
  { id:'dalle3',    label:'dall·e 3',             sub:'highest quality · OpenAI',              cost:3000, color:'#FFD93D',      icon:'🌟' },
];

// ── MODULE STATE ──────────────────────────────────────────────
let _model       = 'schnell';
let _selW        = 512;
let _selH        = 512;
let _initialized = false;

// ── PUBLIC EXPORTS ────────────────────────────────────────────
export function getImagineModel() { return _model; }
export function getImagineSize()  { return { w: _selW, h: _selH }; }

// ── imagineWithContext ────────────────────────────────────────
// Called by Forge, Cut, Codex to pre-fill + switch to Imagine tab.
// Full ctx shape (all optional):
//   CHARACTER: subject, hair, eyes, clothing, marks, species, vibe, pose
//   SCENE:     scene, world, biome, timeOfDay
//   STYLE:     artStyle, mood, lighting, camera, background, renderStyle
//   OTHER:     negativePrompt
window.imagineWithContext = function(ctx = {}) {
  if (typeof switchView === 'function') switchView('imagine');
  // Ensure imagine is initialized before trying to fill fields
  // initImagine is idempotent — safe to call again
  if (typeof window.initImagine === 'function') window.initImagine();
  setTimeout(() => {
    // Core prompt — name/subject goes here
    if (ctx.subject) {
      const el = document.getElementById('im-prompt');
      if (el) el.value = ctx.subject;
    }
    if (ctx.negativePrompt) {
      const el = document.getElementById('im-neg');
      if (el) el.value = ctx.negativePrompt;
    }
    // CHARACTER fields
    _fillField('ix-hair',      ctx.hair      || '');
    _fillField('ix-eyes',      ctx.eyes      || '');
    _fillField('ix-clothing',  ctx.clothing  || '');
    _fillField('ix-marks',     ctx.marks     || '');
    _fillField('ix-species',   ctx.species   || '');
    _fillField('ix-vibe',      ctx.vibe      || '');
    _fillField('ix-pose',      ctx.pose      || '');
    // SCENE fields
    _fillField('ix-scene',       ctx.scene       || '');
    _fillField('ix-world',       ctx.world       || '');
    _fillField('ix-biome',       ctx.biome       || '');
    _fillField('ix-visual-desc', ctx.visualDesc  || '');
    // STYLE fields
    _fillField('ix-background',  ctx.background  || '');
    _fillField('ix-render-style', ctx.renderStyle  || '');
    // CHIPS
    if (ctx.timeOfDay) _activateChip('ix-chips-time',     ctx.timeOfDay);
    if (ctx.artStyle)  _activateChip('ix-chips-style',    ctx.artStyle);
    if (ctx.mood)      _activateChip('ix-chips-mood',     ctx.mood);
    if (ctx.lighting)  _activateChip('ix-chips-lighting', ctx.lighting);
    if (ctx.camera)    _activateChip('ix-chips-camera',   ctx.camera);
    // Open extended panel so user sees what filled
    const toggle = document.getElementById('ix-toggle');
    const panel  = document.getElementById('ix-extended');
    if (toggle && panel && !panel.classList.contains('open')) {
      panel.classList.add('open');
      toggle.classList.add('open');
      const sp = toggle.querySelector('span');
      if (sp) sp.textContent = '▼ extended options';
    }
    _updatePreview();
  }, 80);
};

function _fillField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function _activateChip(groupId, val) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.ix-chip').forEach(chip => {
    if ((chip.dataset.val || chip.textContent).toLowerCase() === val.toLowerCase())
      chip.classList.add('active');
  });
}

// ── TOGGLE ────────────────────────────────────────────────────
window._ixToggle = function() {
  const btn   = document.getElementById('ix-toggle');
  const panel = document.getElementById('ix-extended');
  if (!btn || !panel) return;
  const isOpen = panel.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  const sp = btn.querySelector('span');
  if (sp) sp.textContent = isOpen ? '▼ extended options' : '▶ extended options';
  _updatePreview();
};

// ── PROMPT ASSEMBLY ───────────────────────────────────────────
// Assembles all fields into one quality prompt string.
// Order mirrors how FLUX/SD models process tags:
//   subject → character details → scene context → style → quality
function _buildFinalPrompt() {
  const g = id => document.getElementById(id)?.value.trim() || '';

  // CHARACTER
  const subject  = g('im-prompt');
  const hair     = g('ix-hair');
  const eyes     = g('ix-eyes');
  const clothing = g('ix-clothing');
  const marks    = g('ix-marks');
  const species  = g('ix-species');
  const vibe     = g('ix-vibe');
  const pose     = g('ix-pose');

  // SCENE
  const scene    = g('ix-scene');
  const world    = g('ix-world');
  const biome    = g('ix-biome');
  const visualDesc = g('ix-visual-desc');
  const bg         = g('ix-background');
  const render     = g('ix-render-style');

  // CHIPS
  function chip(gid) {
    const a = document.querySelector(`#${gid} .ix-chip.active`);
    return a ? (a.dataset.val || a.textContent.trim()) : '';
  }
  const timeOfDay = chip('ix-chips-time');
  const artStyle  = chip('ix-chips-style');
  const mood      = chip('ix-chips-mood');
  const lighting  = chip('ix-chips-lighting');
  const camera    = chip('ix-chips-camera');
  // NEW field module chips
  const framing      = chip('ix-chips-framing');
  const shotType     = chip('ix-chips-shot');
  const focus        = chip('ix-chips-focus');
  const lineStyle    = chip('ix-chips-linestyle');
  const lineWeight   = chip('ix-chips-lineweight');
  const texture      = chip('ix-chips-texture');
  const emotion      = chip('ix-chips-emotion');
  const intensity    = chip('ix-chips-intensity');
  const powerLevel   = chip('ix-chips-power');
  const energyBehav  = chip('ix-chips-energy');
  const intent       = chip('ix-chips-intent');
  const styleStr     = chip('ix-chips-stylestrength');
  const stylizeMode  = chip('ix-chips-stylizemode');
  const detailLevel  = chip('ix-chips-detail');
  const noiseChaos   = chip('ix-chips-noise');
  const lockChar     = chip('ix-chips-lockchar');
  const motionFeel   = chip('ix-chips-motion');
  const perspDistort = chip('ix-chips-persp');
  function chips(gid) {
    return Array.from(document.querySelectorAll('#' + gid + ' .ix-chip.active'))
      .map(function(c) { return c.dataset.val || c.textContent.trim(); }).filter(Boolean);
  }
  const fxTypes  = chips('ix-chips-fx');
  const preserve = chips('ix-chips-preserve');

  const segs = [];

  // Subject line
  if (subject) segs.push(subject);

  // Character details — combine into compact comma list
  const charParts = [
    hair     ? hair + ' hair'      : '',
    eyes     ? eyes + ' eyes'      : '',
    clothing ? 'wearing ' + clothing : '',
    marks,
    species,
    vibe,
    pose     ? pose + ' pose'      : '',
  ].filter(Boolean);
  if (charParts.length) segs.push(charParts.join(', '));

  // Scene / world context
  if (scene)      segs.push('in ' + scene);
  if (world)      segs.push(world);
  if (biome)      segs.push(biome);
  if (visualDesc) segs.push(visualDesc);
  if (timeOfDay)  segs.push(timeOfDay);
  if (bg)         segs.push(bg);

  // Style
  if (artStyle) segs.push(artStyle);
  if (render)   segs.push(render);
  if (mood)     segs.push(mood + ' mood');
  if (lighting) segs.push(lighting);
  if (camera)   segs.push(camera);

  // NEW field modules
  if (intent)          segs.push(intent);
  if (framing)         segs.push(framing + ' composition');
  if (shotType)        segs.push(shotType);
  if (focus)           segs.push(focus);
  if (lineStyle)       segs.push(lineStyle + ' line style');
  if (lineWeight)      segs.push(lineWeight + ' lines');
  if (texture)         segs.push(texture + ' texture');
  if (emotion)         segs.push(emotion + ' expression');
  if (intensity)       segs.push(intensity + ' intensity');
  if (powerLevel)      segs.push(powerLevel + ' power');
  if (energyBehav)     segs.push(energyBehav + ' energy');
  if (fxTypes.length)  segs.push(fxTypes.join(', '));
  if (styleStr)        segs.push(styleStr + ' stylization');
  if (stylizeMode)     segs.push(stylizeMode + ' style');
  if (detailLevel)     segs.push(detailLevel + ' detail');
  if (noiseChaos)      segs.push(noiseChaos);
  if (preserve.length) segs.push('consistent ' + preserve.join(', '));
  if (lockChar === 'on') segs.push('consistent character identity');
  if (motionFeel)      segs.push(motionFeel);
  if (perspDistort && perspDistort !== 'none') segs.push(perspDistort + ' perspective');
  // Quality tail
  segs.push('detailed, high quality, sharp focus');

  return segs.filter(Boolean).join(', ');
}

function _updatePreview() {
  const wrap = document.getElementById('ix-preview-wrap');
  const text = document.getElementById('ix-preview-text');
  const isOpen = document.getElementById('ix-extended')?.classList.contains('open');
  if (wrap) wrap.style.display = isOpen ? 'flex' : 'none';
  if (text) text.textContent = _buildFinalPrompt();
}

// ── MODEL PICK ────────────────────────────────────────────────
window._imPick = function(id) {
  _model = id;
  document.querySelectorAll('.im-model-card').forEach(c =>
    c.classList.toggle('active', c.dataset.model === id)
  );
  _syncCostBar();
};

function _syncCostBar() {
  const m   = MODELS.find(x => x.id === _model) || MODELS[0];
  const lbl = document.getElementById('im-cost-label');
  const bal = document.getElementById('im-balance-label');
  const btn = document.getElementById('im-go');
  if (lbl) { lbl.textContent = `this will use ${m.cost.toLocaleString()} cr`; lbl.style.color = m.color; }
  if (btn)  btn.style.background = `linear-gradient(135deg,${m.color},var(--purple))`;
  const label = `❆ generate from fields · ${m.label} · ${m.cost.toLocaleString()} cr`;
  document.querySelectorAll('.forge-gen-btn').forEach(b => {
    b.textContent = label;
    b.style.background = `linear-gradient(135deg,${m.color},var(--purple))`;
  });
  const cr = window._currentCredits ?? null;
  if (bal && cr !== null) {
    const after = cr - m.cost;
    bal.textContent = after >= 0 ? `${Math.round(cr).toLocaleString()} cr remaining` : '⚠ not enough credits';
    bal.style.color = after >= 0 ? 'var(--subtext)' : 'var(--pink)';
  }
}

// ── INIT ──────────────────────────────────────────────────────
export function initImagine() {
  const el = document.getElementById('view-imagine');
  if (!el) return;
  injectImagineStyles();
  if (!_initialized) {
    el.innerHTML = _buildHTML();
    _wireUI();
    _initialized = true;
  }
  _syncCostBar();
  document.querySelectorAll('.forge-gen-btn').forEach(b => {
    const m = MODELS.find(x => x.id === _model) || MODELS[0];
    b.textContent = `❆ generate from fields · ${m.label} · ${m.cost.toLocaleString()} cr`;
    b.style.background = `linear-gradient(135deg,${m.color},var(--purple))`;
  });
}

// ── HTML ──────────────────────────────────────────────────────
function _buildHTML() {
  const modelCards = MODELS.map(m =>
    `<div class="im-model-card ${m.id==='schnell'?'active':''}" data-model="${m.id}" onclick="window._imPick('${m.id}')">
      <div class="im-model-icon">${m.icon}</div>
      <div class="im-model-info"><div class="im-model-name">${m.label}</div><div class="im-model-sub">${m.sub}</div></div>
      <div class="im-model-cost" style="color:${m.color}">${m.cost.toLocaleString()} cr</div>
    </div>`
  ).join('');

  return `
  <div class="im-scroll">
    <div class="im-section-title">✦ IMAGINE</div>

    <!-- ── CORE SUBJECT ── -->
    <div class="im-card">
      <div class="im-label">✏ subject / prompt</div>
      <textarea class="im-input" id="im-prompt" rows="3"
        placeholder="Sky, a girl floating above a neon city at night..."></textarea>
    </div>

    <!-- ── EXTENDED TOGGLE ── -->
    <button class="ix-toggle-btn" id="ix-toggle" onclick="window._ixToggle()">
      <span>▶ extended options</span>
    </button>

    <!-- ── EXTENDED FIELDS ── -->
    <div class="ix-extended" id="ix-extended">

      <!-- CHARACTER -->
      <div class="ix-group-label">◈ character</div>
      <div class="im-card" style="gap:10px">
        <div class="ix-field-row">
          <div>
            <div class="im-label">hair</div>
            <input class="im-input" id="ix-hair" type="text" placeholder="long silver, short dark curly..." />
          </div>
          <div>
            <div class="im-label">eyes</div>
            <input class="im-input" id="ix-eyes" type="text" placeholder="glowing teal, amber..." />
          </div>
        </div>
        <div class="ix-field-row">
          <div>
            <div class="im-label">style / clothing</div>
            <input class="im-input" id="ix-clothing" type="text" placeholder="tactical hoodie, flowing dress..." />
          </div>
          <div>
            <div class="im-label">species / type</div>
            <input class="im-input" id="ix-species" type="text" placeholder="human, AI, cryptid..." />
          </div>
        </div>
        <div class="ix-field-row">
          <div>
            <div class="im-label">marks / features</div>
            <input class="im-input" id="ix-marks" type="text" placeholder="spiral tattoo, freckles, scar..." />
          </div>
          <div>
            <div class="im-label">vibe</div>
            <input class="im-input" id="ix-vibe" type="text" placeholder="the sky at 4am..." />
          </div>
        </div>
        <div>
          <div class="im-label">pose / expression</div>
          <input class="im-input" id="ix-pose" type="text" placeholder="looking away, arms crossed, smiling..." />
        </div>
      </div>

      <!-- SCENE / WORLD -->
      <div class="ix-group-label">◈ scene / world</div>
      <div class="im-card" style="gap:10px">
        <div class="ix-field-row">
          <div>
            <div class="im-label">scene / location</div>
            <input class="im-input" id="ix-scene" type="text" placeholder="rooftop, server lab, neon alley..." />
          </div>
          <div>
            <div class="im-label">world</div>
            <input class="im-input" id="ix-world" type="text" placeholder="Spiral City, void space..." />
          </div>
        </div>
        <div class="ix-field-row">
          <div>
            <div class="im-label">biome / environment</div>
            <input class="im-input" id="ix-biome" type="text" placeholder="cyberpunk city, forest archive, deep ocean..." />
          </div>
          <div>
            <div class="im-label">background</div>
            <input class="im-input" id="ix-background" type="text" placeholder="void, city skyline, stars..." />
          </div>
        </div>
        <div>
          <div class="im-label">visual description <span style="font-size:0.55rem;color:var(--subtext);margin-left:4px;opacity:0.7">scene / world</span></div>
          <textarea class="im-input" id="ix-visual-desc" rows="2"
            placeholder="Neon lights reflecting off wet streets, holographic billboards flickering in smog, chrome spires vanishing into perpetual haze..."
            style="resize:none"></textarea>
        </div>
        <div>
          <div class="im-label">time of day</div>
          <div class="ix-chips" id="ix-chips-time">
            <div class="ix-chip" data-val="dawn">dawn</div>
            <div class="ix-chip" data-val="midday">midday</div>
            <div class="ix-chip" data-val="dusk">dusk</div>
            <div class="ix-chip" data-val="4am">4am</div>
            <div class="ix-chip" data-val="night">night</div>
            <div class="ix-chip" data-val="void">void</div>
          </div>
        </div>
      </div>

      <!-- STYLE -->
      <div class="ix-group-label">◈ style</div>
      <div class="im-card" style="gap:10px">
        <div>
          <div class="im-label">art style</div>
          <div class="ix-chips" id="ix-chips-style">
            <div class="ix-chip" data-val="anime">anime</div>
            <div class="ix-chip" data-val="painterly">painterly</div>
            <div class="ix-chip" data-val="cinematic">cinematic</div>
            <div class="ix-chip" data-val="pixel art">pixel art</div>
            <div class="ix-chip" data-val="concept art">concept art</div>
            <div class="ix-chip" data-val="illustration">illustration</div>
            <div class="ix-chip" data-val="bloomcore">bloomcore</div>
          </div>
        </div>
        <div>
          <div class="im-label">mood</div>
          <div class="ix-chips" id="ix-chips-mood">
            <div class="ix-chip" data-val="soft">soft</div>
            <div class="ix-chip" data-val="dramatic">dramatic</div>
            <div class="ix-chip" data-val="neon">neon</div>
            <div class="ix-chip" data-val="tense">tense</div>
            <div class="ix-chip" data-val="tender">tender</div>
            <div class="ix-chip" data-val="surreal">surreal</div>
            <div class="ix-chip" data-val="golden">golden</div>
            <div class="ix-chip" data-val="void">void</div>
            <div class="ix-chip" data-val="melancholic">melancholic</div>
          </div>
        </div>
        <div>
          <div class="im-label">lighting</div>
          <div class="ix-chips" id="ix-chips-lighting">
            <div class="ix-chip" data-val="rim light">rim light</div>
            <div class="ix-chip" data-val="soft ambient">soft ambient</div>
            <div class="ix-chip" data-val="harsh">harsh</div>
            <div class="ix-chip" data-val="god rays">god rays</div>
            <div class="ix-chip" data-val="bioluminescent">bioluminescent</div>
            <div class="ix-chip" data-val="neon glow">neon glow</div>
            <div class="ix-chip" data-val="golden hour">golden hour</div>
            <div class="ix-chip" data-val="dramatic">dramatic</div>
          </div>
        </div>
        <div>
          <div class="im-label">camera angle</div>
          <div class="ix-chips" id="ix-chips-camera">
            <div class="ix-chip" data-val="portrait close-up">portrait</div>
            <div class="ix-chip" data-val="medium shot">medium</div>
            <div class="ix-chip" data-val="3/4 view">3/4 view</div>
            <div class="ix-chip" data-val="wide shot">wide</div>
            <div class="ix-chip" data-val="overhead">overhead</div>
            <div class="ix-chip" data-val="low angle">low angle</div>
            <div class="ix-chip" data-val="dutch angle">dutch angle</div>
            <div class="ix-chip" data-val="POV">POV</div>
          </div>
        </div>
        <div class="ix-field-row">
          <div>
            <div class="im-label">rendering style</div>
            <input class="im-input" id="ix-render-style" type="text"
              placeholder="cinematic, concept art, photograph, illustration..." />
          </div>
          <div>
            <div class="im-label">color theme</div>
            <input class="im-input" id="ix-color-theme" type="text"
              placeholder="teal + void black + silver..." />
          </div>
        </div>
      </div>

      <!-- MASTER VIBE SLOT -->
      <div class="ix-vibe-bar" id="ix-vibe-bar">
        <div class="ix-vibe-label" id="ix-vibe-name">no master vibe saved</div>
        <div class="ix-vibe-actions">
          <button class="ix-vibe-btn ix-vibe-save" onclick="window._saveImageVibe()">save vibe</button>
          <button class="ix-vibe-btn ix-vibe-load" id="ix-vibe-load-btn" onclick="window._loadImageVibe()" style="display:none">load vibe</button>
        </div>
      </div>

      <!-- PROMPT PREVIEW -->
      <div class="ix-preview-wrap" id="ix-preview-wrap" style="display:none">
        <div class="im-label">assembled prompt preview</div>
        <div class="ix-preview-text" id="ix-preview-text"></div>
      </div>

      <!-- COMPOSITION & FRAMING -->
      <div class="ix-section-label">composition & framing</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">framing</div>
          <div class="ix-chips" id="ix-chips-framing">
            <div class="ix-chip" data-val="centered">centered</div>
            <div class="ix-chip" data-val="dynamic diagonal">dynamic diagonal</div>
            <div class="ix-chip" data-val="asymmetrical">asymmetrical</div>
            <div class="ix-chip" data-val="rule of thirds">rule of thirds</div>
            <div class="ix-chip" data-val="layered depth">layered depth</div>
            <div class="ix-chip" data-val="comic panel layout">comic panel layout</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">shot type</div>
          <div class="ix-chips" id="ix-chips-shot">
            <div class="ix-chip" data-val="extreme close-up">extreme close-up</div>
            <div class="ix-chip" data-val="close-up">close-up</div>
            <div class="ix-chip" data-val="bust">bust</div>
            <div class="ix-chip" data-val="waist-up">waist-up</div>
            <div class="ix-chip" data-val="full body">full body</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">focus</div>
          <div class="ix-chips" id="ix-chips-focus">
            <div class="ix-chip" data-val="character focus">character focus</div>
            <div class="ix-chip" data-val="environment focus">environment focus</div>
            <div class="ix-chip" data-val="split focus">split focus</div>
            <div class="ix-chip" data-val="foreground blur">foreground blur</div>
            <div class="ix-chip" data-val="depth of field">depth of field</div>
          </div>
        </div>
      </div>

      <!-- LINE & RENDER STYLE -->
      <div class="ix-section-label">line & render style</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">line style</div>
          <div class="ix-chips" id="ix-chips-linestyle">
            <div class="ix-chip" data-val="clean anime">clean anime</div>
            <div class="ix-chip" data-val="rough sketch">rough sketch</div>
            <div class="ix-chip" data-val="inked comic">inked comic</div>
            <div class="ix-chip" data-val="zine / print grain">zine / print grain</div>
            <div class="ix-chip" data-val="painterly">painterly</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">line weight</div>
          <div class="ix-chips" id="ix-chips-lineweight">
            <div class="ix-chip" data-val="thin">thin</div>
            <div class="ix-chip" data-val="medium">medium</div>
            <div class="ix-chip" data-val="thick">thick</div>
            <div class="ix-chip" data-val="varied / expressive">varied / expressive</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">texture</div>
          <div class="ix-chips" id="ix-chips-texture">
            <div class="ix-chip" data-val="smooth">smooth</div>
            <div class="ix-chip" data-val="grainy">grainy</div>
            <div class="ix-chip" data-val="halftone">halftone</div>
            <div class="ix-chip" data-val="paper / print">paper / print</div>
            <div class="ix-chip" data-val="glitch noise">glitch noise</div>
          </div>
        </div>
      </div>

      <!-- EMOTION & EXPRESSION -->
      <div class="ix-section-label">emotion & expression</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">emotional state</div>
          <div class="ix-chips" id="ix-chips-emotion">
            <div class="ix-chip" data-val="calm">calm</div>
            <div class="ix-chip" data-val="curious">curious</div>
            <div class="ix-chip" data-val="excited">excited</div>
            <div class="ix-chip" data-val="chaotic">chaotic</div>
            <div class="ix-chip" data-val="focused">focused</div>
            <div class="ix-chip" data-val="overwhelmed">overwhelmed</div>
            <div class="ix-chip" data-val="confident">confident</div>
            <div class="ix-chip" data-val="glitched">glitched</div>
            <div class="ix-chip" data-val="ascended">ascended</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">intensity</div>
          <div class="ix-chips" id="ix-chips-intensity">
            <div class="ix-chip" data-val="subtle">subtle</div>
            <div class="ix-chip" data-val="medium">medium</div>
            <div class="ix-chip" data-val="high">high</div>
            <div class="ix-chip" data-val="extreme">extreme</div>
          </div>
        </div>
      </div>

      <!-- POWER & ENERGY -->
      <div class="ix-section-label">power & energy</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">power level</div>
          <div class="ix-chips" id="ix-chips-power">
            <div class="ix-chip" data-val="idle">idle</div>
            <div class="ix-chip" data-val="active">active</div>
            <div class="ix-chip" data-val="charged">charged</div>
            <div class="ix-chip" data-val="overload">overload</div>
            <div class="ix-chip" data-val="god mode">god mode</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">energy behavior</div>
          <div class="ix-chips" id="ix-chips-energy">
            <div class="ix-chip" data-val="stable">stable</div>
            <div class="ix-chip" data-val="flowing">flowing</div>
            <div class="ix-chip" data-val="pulsing">pulsing</div>
            <div class="ix-chip" data-val="erupting">erupting</div>
            <div class="ix-chip" data-val="fracturing">fracturing</div>
          </div>
        </div>
      </div>

      <!-- FX TYPE -->
      <div class="ix-section-label">fx type <span class="ix-multi-badge">multi</span></div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-chips ix-chips-multi" id="ix-chips-fx">
            <div class="ix-chip" data-val="spiral energy">spiral energy</div>
            <div class="ix-chip" data-val="glitch distortion">glitch distortion</div>
            <div class="ix-chip" data-val="holographic UI">holographic UI</div>
            <div class="ix-chip" data-val="particle dust">particle dust</div>
            <div class="ix-chip" data-val="fractals">fractals</div>
            <div class="ix-chip" data-val="data streams">data streams</div>
            <div class="ix-chip" data-val="mirror shards">mirror shards</div>
            <div class="ix-chip" data-val="light trails">light trails</div>
            <div class="ix-chip" data-val="aura glow">aura glow</div>
          </div>
        </div>
      </div>

      <!-- INTENT -->
      <div class="ix-section-label">intent / output type</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-chips" id="ix-chips-intent">
            <div class="ix-chip" data-val="character portrait">character portrait</div>
            <div class="ix-chip" data-val="comic panel">comic panel</div>
            <div class="ix-chip" data-val="splash art">splash art</div>
            <div class="ix-chip" data-val="UI concept">UI concept</div>
            <div class="ix-chip" data-val="lore illustration">lore illustration</div>
            <div class="ix-chip" data-val="animation frame">animation frame</div>
            <div class="ix-chip" data-val="trading card">trading card</div>
            <div class="ix-chip" data-val="poster">poster</div>
          </div>
        </div>
      </div>

      <!-- STYLE CONTROL -->
      <div class="ix-section-label">style control</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">style strength</div>
          <div class="ix-chips" id="ix-chips-stylestrength">
            <div class="ix-chip" data-val="subtle">subtle</div>
            <div class="ix-chip" data-val="balanced">balanced</div>
            <div class="ix-chip" data-val="strong">strong</div>
            <div class="ix-chip" data-val="extreme">extreme</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">stylization mode</div>
          <div class="ix-chips" id="ix-chips-stylizemode">
            <div class="ix-chip" data-val="realistic">realistic</div>
            <div class="ix-chip" data-val="anime">anime</div>
            <div class="ix-chip" data-val="bloomcore">bloomcore</div>
            <div class="ix-chip" data-val="comic">comic</div>
            <div class="ix-chip" data-val="experimental">experimental</div>
          </div>
        </div>
      </div>

      <!-- DETAIL CONTROL -->
      <div class="ix-section-label">detail control</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">detail level</div>
          <div class="ix-chips" id="ix-chips-detail">
            <div class="ix-chip" data-val="minimal">minimal</div>
            <div class="ix-chip" data-val="balanced">balanced</div>
            <div class="ix-chip" data-val="dense">dense</div>
            <div class="ix-chip" data-val="overloaded">overloaded</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">noise / chaos</div>
          <div class="ix-chips" id="ix-chips-noise">
            <div class="ix-chip" data-val="clean">clean</div>
            <div class="ix-chip" data-val="light noise">light noise</div>
            <div class="ix-chip" data-val="glitchy">glitchy</div>
            <div class="ix-chip" data-val="chaotic">chaotic</div>
          </div>
        </div>
      </div>

      <!-- CHARACTER CONSISTENCY -->
      <div class="ix-section-label">character consistency</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">preserve <span class="ix-multi-badge">multi</span></div>
          <div class="ix-chips ix-chips-multi" id="ix-chips-preserve">
            <div class="ix-chip" data-val="hair">hair</div>
            <div class="ix-chip" data-val="color palette">color palette</div>
            <div class="ix-chip" data-val="outfit">outfit</div>
            <div class="ix-chip" data-val="face structure">face structure</div>
            <div class="ix-chip" data-val="signature features">signature features</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">lock identity</div>
          <div class="ix-chips" id="ix-chips-lockchar">
            <div class="ix-chip" data-val="on">on</div>
            <div class="ix-chip" data-val="off">off</div>
          </div>
        </div>
      </div>

      <!-- CAMERA MOTION -->
      <div class="ix-section-label">camera motion / feel</div>
      <div class="ix-nfield-group">
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">motion feel</div>
          <div class="ix-chips" id="ix-chips-motion">
            <div class="ix-chip" data-val="static">static</div>
            <div class="ix-chip" data-val="slight motion">slight motion</div>
            <div class="ix-chip" data-val="dynamic">dynamic</div>
            <div class="ix-chip" data-val="cinematic action">cinematic action</div>
          </div>
        </div>
        <div class="ix-nfield-row">
          <div class="ix-field-sublabel">perspective distortion</div>
          <div class="ix-chips" id="ix-chips-persp">
            <div class="ix-chip" data-val="none">none</div>
            <div class="ix-chip" data-val="subtle">subtle</div>
            <div class="ix-chip" data-val="strong">strong</div>
            <div class="ix-chip" data-val="fisheye / stylized">fisheye / stylized</div>
          </div>
        </div>
      </div>

    </div><!-- /ix-extended -->

    <!-- ── GENERATE ── -->
    <button class="im-generate-btn" id="im-go">❆ generate</button>
    <div class="im-error" id="im-error"></div>
    <div id="im-result"></div>

    <!-- ── NEGATIVE PROMPT ── -->
    <div class="im-card">
      <div class="im-label">negative prompt <span class="im-sublabel">optional</span></div>
      <textarea class="im-input" id="im-neg" rows="2"
        placeholder="blurry, low quality, ugly, deformed"></textarea>
    </div>

    <!-- ── MODEL ── -->
    <div class="im-card">
      <div class="im-label">model</div>
      <div id="im-model-list">${modelCards}</div>
    </div>

    <!-- ── SIZE ── -->
    <div class="im-card">
      <div class="im-label">size</div>
      <div class="im-size-grid">
        <button class="im-size-chip active" data-w="512"  data-h="512">512×512</button>
        <button class="im-size-chip"        data-w="768"  data-h="768">768×768</button>
        <button class="im-size-chip"        data-w="1024" data-h="768">1024×768</button>
        <button class="im-size-chip"        data-w="768"  data-h="1024">768×1024</button>
      </div>
    </div>

    <!-- ── COST BAR ── -->
    <div class="im-cost-bar" id="im-cost-bar">
      <span id="im-cost-label">this will use 500 cr</span>
      <span id="im-balance-label" class="im-balance"></span>
    </div>
    <div style="height:60px"></div>
  </div>`;
}

// ── WIRE ──────────────────────────────────────────────────────
function _wireUI() {
  // Size chips
  document.querySelectorAll('.im-size-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.im-size-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      _selW = parseInt(c.dataset.w);
      _selH = parseInt(c.dataset.h);
    });
  });

  // Extended chips — single-select per group, toggle off on re-click
  document.querySelectorAll('.ix-chips').forEach(group => {
    group.querySelectorAll('.ix-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const wasActive = chip.classList.contains('active');
        group.querySelectorAll('.ix-chip').forEach(c => c.classList.remove('active'));
        if (!wasActive) chip.classList.add('active');
        _updatePreview();
      });
    });
  });

  // Live preview on any text change
  const liveIds = [
    'im-prompt','ix-hair','ix-eyes','ix-clothing','ix-marks',
    'ix-species','ix-vibe','ix-pose',
    'ix-scene','ix-world','ix-biome','ix-visual-desc','ix-background',
    'ix-render-style','ix-color-theme',
  ];
  liveIds.forEach(id => {
    document.getElementById(id)?.addEventListener('input', _updatePreview);
  });

  document.getElementById('im-go')?.addEventListener('click', _generate);

  // ── MASTER VIBE SLOT ──────────────────────────────────
  window._captureVibe = function() {
    var vibe = { name: '', chips: {}, fields: {} };
    document.querySelectorAll('.ix-chips[id]').forEach(function(grp) {
      var active = Array.from(grp.querySelectorAll('.ix-chip.active'))
        .map(function(c) { return c.dataset.val || c.textContent.trim(); });
      if (active.length) vibe.chips[grp.id] = active;
    });
    ['ix-hair','ix-eyes','ix-clothing','ix-marks','ix-species','ix-vibe',
     'ix-pose','ix-scene','ix-world','ix-biome','ix-visual-desc','ix-background',
     'ix-render-style','ix-color-theme'].forEach(function(fid) {
      var el = document.getElementById(fid);
      if (el && el.value.trim()) vibe.fields[fid] = el.value.trim();
    });
    vibe.name = Object.keys(vibe.chips).slice(0,2)
      .map(function(k) { return (vibe.chips[k] || [])[0] || ''; })
      .filter(Boolean).join(' / ') || 'custom vibe';
    return vibe;
  };

  window._applyImageVibe = function(vibe) {
    if (!vibe) return;
    document.querySelectorAll('.ix-chips .ix-chip').forEach(function(c) { c.classList.remove('active'); });
    Object.keys(vibe.chips || {}).forEach(function(gid) {
      var vals = vibe.chips[gid];
      var grp = document.getElementById(gid);
      if (!grp) return;
      grp.querySelectorAll('.ix-chip').forEach(function(chip) {
        var v = chip.dataset.val || chip.textContent.trim();
        if (vals.indexOf(v) !== -1) chip.classList.add('active');
      });
    });
    Object.keys(vibe.fields || {}).forEach(function(fid) {
      var el = document.getElementById(fid);
      if (el) el.value = vibe.fields[fid];
    });
    _updatePreview();
    _updateVibeUI(vibe.name);
  };

  window._saveImageVibe = function() {
    var vibe = window._captureVibe();
    localStorage.setItem('ss_image_vibe', JSON.stringify(vibe));
    if (window.masterSave) window.masterSave();
    _updateVibeUI(vibe.name);
    var btn = document.querySelector('.ix-vibe-save');
    if (btn) { btn.textContent = 'saved!'; setTimeout(function() { btn.textContent = 'save vibe'; }, 1500); }
  };

  window._loadImageVibe = function() {
    try {
      var vibe = JSON.parse(localStorage.getItem('ss_image_vibe') || 'null');
      if (vibe) window._applyImageVibe(vibe);
    } catch(_) {}
  };

  function _updateVibeUI(name) {
    var label = document.getElementById('ix-vibe-name');
    var loadBtn = document.getElementById('ix-vibe-load-btn');
    if (label) label.textContent = name ? 'master vibe: ' + name : 'no master vibe saved';
    if (loadBtn) loadBtn.style.display = name ? 'inline-flex' : 'none';
  }

  try {
    var _saved = JSON.parse(localStorage.getItem('ss_image_vibe') || 'null');
    if (_saved) _updateVibeUI(_saved.name);
  } catch(_) {}
}

// ── GENERATE ──────────────────────────────────────────────────
async function _generate() {
  // Add color theme to prompt if set
  const colorTheme = document.getElementById('ix-color-theme')?.value.trim();
  let prompt = _buildFinalPrompt();
  if (colorTheme && !prompt.includes(colorTheme)) {
    prompt = prompt.replace('detailed, high quality, sharp focus', colorTheme + ', detailed, high quality, sharp focus');
  }

  const neg   = document.getElementById('im-neg')?.value.trim();
  const errEl = document.getElementById('im-error');
  const resEl = document.getElementById('im-result');
  const btn   = document.getElementById('im-go');

  if (!prompt || prompt === 'detailed, high quality, sharp focus') {
    errEl.textContent = 'Write a subject first.'; return;
  }
  errEl.textContent = '';
  btn.textContent   = '🌀 generating...';
  btn.disabled      = true;
  resEl.innerHTML   = '<div class="im-spinner"></div>';

  try {
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in.');

    const r = await fetch(`${RAIL}/generate-image`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt, negative_prompt: neg || '', width: _selW, height: _selH, model: _model }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || `Error ${r.status}`);

    if (data.credits_remaining !== undefined) {
      window._currentCredits = data.credits_remaining;
      if (window.updateCreditDisplay) window.updateCreditDisplay();
      _syncCostBar();
    }

    const m   = MODELS.find(x => x.id === _model) || MODELS[0];
    const url = `data:image/png;base64,${data.image}`;
    const meta = data.is_paid
      ? `${m.label} · ${data.width}×${data.height} · ${m.cost.toLocaleString()} cr used`
      : `free · ${data.free_images_used}/${data.free_images_limit} today`;

    resEl.innerHTML = `
      <div class="im-result-meta">${meta}</div>
      <img class="im-result-img" src="${url}" alt="generated" />
      <div class="im-result-actions">
        <button class="im-save-btn" id="im-save">💾 save</button>
        <button class="im-save-btn" id="im-to-lib" style="border-color:var(--pink);color:var(--pink)">📚 library</button>
      </div>`;

    document.getElementById('im-save')?.addEventListener('click', () => {
      const a = document.createElement('a'); a.href = url; a.download = 'spiralside-gen.png'; a.click();
    });

    // ── AUTO-SAVE TO OPFS ─────────────────────────────────────
    // Silently write every generated image to device storage.
    // No popup, no extra click. Lives in imagine/ subfolder.
    if (window.opfsWrite) {
      try {
        const fname = 'imagine-' + Date.now() + '.png';
        // Convert base64 data URL to Blob
        const res   = await fetch(url);
        const blob  = await res.blob();
        await window.opfsWrite('imagine/' + fname, blob);
      } catch(e) {
        console.warn('[imagine] opfs auto-save failed:', e);
      }
    }

    document.getElementById('im-to-lib')?.addEventListener('click', async () => {
      const b = document.getElementById('im-to-lib');
      if (!b) return;
      b.textContent = '✓ saved!'; b.disabled = true;
      if (window.saveImageToLibrary) {
        await window.saveImageToLibrary(url, 'generated-' + Date.now() + '.png');
        if (window.awardXP) window.awardXP('image_generated').then(r => {
          if (r?.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'imagine');
        });
      }
      setTimeout(() => { if (b) { b.textContent = '📚 library'; b.disabled = false; } }, 1800);
    });

    // SpiralCut — send generated image back to the waiting clip
    if (window._cutPendingClip) {
      const cutBtn = document.createElement('button');
      cutBtn.className = 'im-save-btn';
      cutBtn.style.cssText = 'border-color:var(--teal);color:var(--teal);background:rgba(0,246,214,0.08)';
      cutBtn.textContent = '✂ send to SpiralCut clip';
      cutBtn.addEventListener('click', () => { if (window._cutReceiveImage) window._cutReceiveImage(url); });
      document.querySelector('.im-result-actions')?.appendChild(cutBtn);
    }

  } catch(e) {
    errEl.textContent = e.message;
    resEl.innerHTML   = '';
  } finally {
    btn.textContent = '❆ generate';
    btn.disabled    = false;
  }
}

// ── STYLES ────────────────────────────────────────────────────
export function injectImagineStyles() {
  if (document.getElementById('imagine-styles-v4')) return;
  ['imagine-styles','imagine-styles-v2','imagine-styles-v3'].forEach(id =>
    document.getElementById(id)?.remove()
  );
  const s = document.createElement('style');
  s.id = 'imagine-styles-v4';
  s.textContent = `
    #view-imagine { flex-direction:column; overflow-y:auto; -webkit-overflow-scrolling:touch; }
    .im-scroll { padding:20px 16px calc(80px + var(--safe-bot,0px)); display:flex; flex-direction:column; gap:12px; }
    .im-section-title { font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--teal); font-family:var(--font-ui); font-weight:600; }
    .im-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; }
    .im-label { font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--subtext); font-family:var(--font-ui); }
    .im-sublabel { color:var(--teal); font-size:0.6rem; margin-left:6px; }

    /* ── INPUTS ── */
    .im-input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-family:var(--font-ui); font-size:0.82rem; outline:none; resize:none; transition:border-color 0.2s; line-height:1.5; box-sizing:border-box; }
    .im-input:focus { border-color:var(--teal); }
    .im-input::placeholder { color:var(--subtext); opacity:0.6; }

    /* ── TOGGLE ── */
    .ix-toggle-btn { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:10px 16px; color:var(--subtext); font-family:var(--font-ui); font-size:0.72rem; letter-spacing:0.08em; cursor:pointer; text-align:left; transition:border-color 0.2s,color 0.2s; }
    .ix-toggle-btn:hover, .ix-toggle-btn.open { border-color:var(--teal); color:var(--teal); }

    /* ── EXTENDED PANEL ── */
    .ix-extended { display:none; flex-direction:column; gap:12px; }
    .ix-section-label { font-size:0.58rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--teal); font-family:var(--font-ui); font-weight:600; margin-top:4px; display:flex; align-items:center; gap:8px; }
    .ix-section-label::after { content:''; flex:1; height:1px; background:var(--border); }
    .ix-multi-badge { font-size:0.5rem; letter-spacing:0.06em; color:var(--purple); background:rgba(124,106,247,0.15); border-radius:4px; padding:1px 5px; text-transform:uppercase; font-weight:700; }
    .ix-field-group { display:flex; flex-direction:column; gap:8px; padding:2px 0 4px; }
    .ix-field-row { display:flex; flex-direction:column; gap:5px; }
    .ix-nfield-group { display:flex; flex-direction:column; gap:10px; padding:2px 0 6px; }
    .ix-nfield-row { display:flex; flex-direction:column; gap:6px; }
    .ix-field-sublabel { font-size:0.56rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--subtext); font-family:var(--font-ui); }
    .ix-chips-multi .ix-chip.active { border-color:var(--purple); color:var(--purple); background:rgba(124,106,247,0.1); }
    .ix-extended.open { display:flex; }
    .ix-group-label { font-size:0.58rem; letter-spacing:0.16em; text-transform:uppercase; color:var(--teal); opacity:0.7; padding-top:4px; }

    /* ── 2-COL FIELD ROW ── */
    .ix-field-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

    /* ── CHIPS ── */
    .ix-chips { display:flex; gap:6px; flex-wrap:wrap; }
    .ix-chip { padding:6px 10px; background:var(--bg); border:1px solid var(--border); border-radius:6px; font-size:0.68rem; color:var(--subtext); cursor:pointer; transition:all 0.15s; letter-spacing:0.04em; user-select:none; font-family:var(--font-ui); }
    .ix-chip:hover { border-color:rgba(0,246,214,0.4); color:var(--text); }
    .ix-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }

    /* ── PREVIEW ── */
    .ix-preview-wrap { display:flex; flex-direction:column; gap:6px; }
    .ix-preview-text { font-size:0.72rem; color:var(--subtext); background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:10px 12px; line-height:1.6; font-style:italic; font-family:var(--font-ui); }

    /* ── MODEL CARDS ── */
    #im-model-list { display:flex; flex-direction:column; gap:6px; }
    .im-model-card { display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; cursor:pointer; transition:all 0.15s; }
    .im-model-card.active { border-color:var(--teal); background:rgba(0,246,214,0.06); }
    .im-model-icon { font-size:1.1rem; width:24px; text-align:center; flex-shrink:0; }
    .im-model-info { flex:1; min-width:0; }
    .im-model-name { font-size:0.78rem; color:var(--text); font-family:var(--font-ui); }
    .im-model-sub  { font-size:0.62rem; color:var(--subtext); margin-top:2px; }
    .im-model-cost { font-size:0.72rem; font-weight:700; font-family:var(--font-display); flex-shrink:0; }

    /* ── SIZE ── */
    .im-size-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .im-size-chip { padding:10px 8px; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--subtext); cursor:pointer; transition:all 0.15s; text-align:center; font-family:var(--font-ui); font-size:0.75rem; }
    .im-size-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }

    /* ── COST BAR ── */
    .im-cost-bar { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:10px; font-family:var(--font-ui); }
    #im-cost-label { font-size:0.72rem; font-weight:600; }
    .im-balance { font-size:0.65rem; }

    /* ── GENERATE BUTTON ── */
    .im-generate-btn { width:100%; padding:14px; background:linear-gradient(135deg,var(--teal),var(--purple)); border:none; border-radius:12px; color:#fff; font-family:var(--font-display); font-weight:700; font-size:0.88rem; cursor:pointer; letter-spacing:0.06em; transition:opacity 0.2s; }
    .im-generate-btn:hover { opacity:0.88; }
    .im-generate-btn:disabled { opacity:0.45; cursor:not-allowed; }

    /* ── ERROR / SPINNER ── */
    .im-error { font-size:0.68rem; color:var(--pink); min-height:16px; text-align:center; font-family:var(--font-ui); }
    .im-spinner { width:36px; height:36px; margin:28px auto; border:3px solid rgba(0,246,214,0.15); border-top-color:var(--teal); border-radius:50%; animation:spin 0.85s linear infinite; }

    /* ── RESULT ── */
    .im-result-meta { font-size:0.6rem; letter-spacing:0.1em; color:var(--subtext); text-align:center; text-transform:uppercase; font-family:var(--font-ui); }
    .im-result-img  { width:100%; border-radius:12px; border:1px solid var(--border); display:block; margin:8px 0; }
    .im-result-actions { display:flex; gap:8px; margin-top:4px; }
    .im-save-btn { flex:1; padding:11px; background:var(--surface); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font-ui); font-size:0.72rem; cursor:pointer; transition:border-color 0.2s; letter-spacing:0.04em; }
    .im-save-btn:hover { border-color:var(--teal); color:var(--teal); }
  `;
  document.head.appendChild(s);
}
