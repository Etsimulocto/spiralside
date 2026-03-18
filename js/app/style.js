// ============================================================
// SPIRALSIDE — STYLE v1.0
// Theme presets, color pickers, particles, bg types
// Nimbis anchor: js/app/style.js
// ============================================================

const THEMES = [
  { id:'default',  name:'default',    bg:'#08080d', surface:'#0f0f18', surface2:'#151523', border:'#1e1e35', teal:'#00F6D6', pink:'#FF4BCB', purple:'#7B5FFF', text:'#F0F0FF', subtext:'#6060A0' },
  { id:'void',     name:'void',       bg:'#000000', surface:'#0a0a0a', surface2:'#111111', border:'#222222', teal:'#ffffff', pink:'#aaaaaa', purple:'#888888', text:'#ffffff',  subtext:'#555555' },
  { id:'neon',     name:'neon tokyo', bg:'#04040c', surface:'#08081a', surface2:'#0d0d24', border:'#1a1a3a', teal:'#00ffff', pink:'#ff00aa', purple:'#aa00ff', text:'#ffffff',  subtext:'#5566aa' },
  { id:'midnight', name:'midnight',   bg:'#030812', surface:'#070f1e', surface2:'#0c1828', border:'#142238', teal:'#4da3ff', pink:'#7b5fff', purple:'#a066ff', text:'#e0eeff',  subtext:'#405580' },
  { id:'ember',    name:'ember',      bg:'#0d0600', surface:'#170900', surface2:'#200e00', border:'#331800', teal:'#ff6a00', pink:'#ff3355', purple:'#ff9500', text:'#ffe8d0',  subtext:'#805030' },
  { id:'forest',   name:'forest',     bg:'#020a04', surface:'#061008', surface2:'#0a180c', border:'#142818', teal:'#00e676', pink:'#ffd700', purple:'#69f0ae', text:'#e8ffe8',  subtext:'#406040' },
];

const DEFAULT_STYLE = {
  bg:'#08080d', surface:'#0f0f18', surface2:'#151523', border:'#1e1e35',
  teal:'#00F6D6', pink:'#FF4BCB', purple:'#7B5FFF',
  text:'#F0F0FF', subtext:'#6060A0', userbubble:'#7B5FFF',
  bubbleRadius:14, msgSpacing:10,
  fontUi:"'DM Mono',monospace", fontDisplay:"'Syne',sans-serif",
  bgType:'solid', scanlineIntensity:2, particleDensity:30, fontSize:13, subtextSize:11,
};

let pendingStyle = { ...DEFAULT_STYLE };
let styleInited  = false;

// ── BG CONTROL VARS (must be declared before startParticles) ──
let particleSpeed  = 3;
let particleSize   = 2;
let particleColor  = '#00F6D6';
let gridSize       = 32;
let gridOpacity    = 6;
let gridColor      = '#00F6D6';
let bgImageData    = null;
let bgImageOpacity = 80;
let bgImageFit     = 'cover';
let particleAnim = null;
let particles    = [];

// ── STYLE SECTION TOGGLE ─────────────────────────────────────
window.toggleStyleSection = function(id) {
  const body = document.getElementById(`sbody-${id}`);
  const icon = document.getElementById(`sicon-${id}`);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (icon) icon.textContent = open ? '▸' : '▾';
};

// ── FONT SIZE PREVIEW ─────────────────────────────────────────
window.previewFontSize = function(val) {
  pendingStyle.fontSize = parseInt(val);
  document.documentElement.style.setProperty('--font-size-base', val + 'px');
  document.getElementById('font-size-val').textContent = val + 'px';
  // Update preview text size
  const preview = document.getElementById('font-size-preview');
  if (preview) preview.style.fontSize = val + 'px';
};

// ── SUBTEXT SIZE PREVIEW ─────────────────────────────────────
window.previewSubtextSize = function(val) {
  pendingStyle.subtextSize = parseInt(val);
  document.documentElement.style.setProperty('--subtext-size', val + 'px');
  document.getElementById('subtext-size-val').textContent = val + 'px';
};

// ── LINE HEIGHT PREVIEW ───────────────────────────────────────
window.previewLineHeight = function(val) {
  const lh = (val / 100).toFixed(2);
  pendingStyle.lineHeight = lh;
  document.documentElement.style.setProperty('--line-height', lh);
  document.getElementById('line-height-val').textContent = lh;
};

// ── BUBBLE WIDTH PREVIEW ──────────────────────────────────────
window.previewBubbleWidth = function(val) {
  pendingStyle.bubbleMaxWidth = val;
  document.documentElement.style.setProperty('--bubble-max-width', val + '%');
};

// ── ACCESSIBILITY PRESETS ─────────────────────────────────────
window.applyAccessPreset = function(preset) {
  const presets = {
    large: {
      fontSize: 18, lineHeight: '1.7', bubbleRadius: 18, msgSpacing: 16,
      fontUi: "'Space Grotesk',sans-serif", bubbleMaxWidth: 85,
      subtextSize: 15,
    },
    contrast: {
      bg: '#000000', surface: '#111111', surface2: '#1a1a1a',
      border: '#444444', text: '#ffffff', subtext: '#aaaaaa',
      teal: '#00ffff', pink: '#ff66cc', purple: '#aa88ff',
      fontSize: 16,
    },
    tablet: {
      fontSize: 17, lineHeight: '1.65', msgSpacing: 14,
      bubbleRadius: 20, bubbleMaxWidth: 88,
      fontUi: "'Outfit',sans-serif",
      subtextSize: 14,
    },
    default: null,
  };
  if (preset === 'default') { resetStyle(); return; }
  const p = presets[preset];
  if (!p) return;
  pendingStyle = { ...pendingStyle, ...p };
  applyStyleVars(pendingStyle);
  if (p.fontSize) {
    document.documentElement.style.setProperty('--font-size-base', p.fontSize + 'px');
    const slider = document.getElementById('font-size-slider');
    const val    = document.getElementById('font-size-val');
    if (slider) slider.value = p.fontSize;
    if (val)    val.textContent = p.fontSize + 'px';
  }
  if (p.subtextSize) {
    document.documentElement.style.setProperty('--subtext-size', p.subtextSize + 'px');
    const sslider = document.getElementById('subtext-size-slider');
    const sval    = document.getElementById('subtext-size-val');
    if (sslider) sslider.value = p.subtextSize;
    if (sval)    sval.textContent = p.subtextSize + 'px';
  }
};

export function initStylePanel() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  styleInited = true;
  grid.innerHTML = THEMES.map(t =>
    '<div class="theme-card" data-theme="' + t.id + '" onclick="applyThemePreset(\'' + t.id + '\')">' +
    '<div class="theme-preview" style="background:' + t.bg + '">' +
    '<div class="theme-dot" style="background:' + t.teal + '"></div>' +
    '<div class="theme-dot" style="background:' + t.pink + '"></div>' +
    '<div class="theme-dot" style="background:' + t.purple + '"></div>' +
    '</div><div class="theme-name">' + t.name + '</div></div>'
  ).join('');
  try {
    const saved = localStorage.getItem('ss_style');
    if (saved) { pendingStyle = { ...DEFAULT_STYLE, ...JSON.parse(saved) }; applyStyleVars(pendingStyle); }
  } catch {}
}

export function applyThemePreset(id) {
  const t = THEMES.find(x => x.id === id);
  if (!t) return;
  pendingStyle = { ...pendingStyle, ...t };
  document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.theme === id));
  updateSwatches();
  applyStyleVars(pendingStyle);
}

export function previewColor(key, val) {
  pendingStyle[key] = val;
  // All swatch IDs — panel (old) + view (new)
  const swatchIds = {
    bg:         ['sw-bg',         'sw-bg-v'],
    surface:    ['sw-surface',    'sw-surface-v'],
    teal:       ['sw-teal',       'sw-teal-v'],
    pink:       ['sw-pink',       'sw-pink-v'],
    userbubble: ['sw-userbubble', 'sw-userbubble-v'],
    text:       ['sw-text',       'sw-text-v'],
    subtext:    ['sw-subtext',    'sw-subtext-v'],
    border:     ['sw-border',     'sw-border-v'],
    botbubble:  ['sw-botbubble',  'sw-botbubble-v'],
  };
  (swatchIds[key] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.background = val;
  });
  applyStyleVars(pendingStyle);
}

export function selectBgType(el, type) {
  document.querySelectorAll('.bg-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  pendingStyle.bgType = type;
  document.getElementById('scanline-control').style.display = type === 'scanlines' ? 'block' : 'none';
  document.getElementById('particle-control').style.display = type === 'particles' ? 'block' : 'none';
  document.getElementById('grid-control').style.display    = type === 'grid'      ? 'block' : 'none';
  document.getElementById('image-control').style.display   = type === 'image'     ? 'block' : 'none';
  // handled above
  applyBgType(type);
}

export function applyBgType(type) {
  // Legacy no-op — bg layers now handled by applyAllBgLayers + toggleBgLayer
  // Only handle particles canvas for backward compat
  const canvas = document.getElementById('particles-canvas');
  if (type === 'particles') { canvas.classList.add('active'); startParticles(); }
  if (false && type === 'scanlines') {
    document.body.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,246,214,0.03) 2px,rgba(0,246,214,0.03) 4px)';
    document.body.style.backgroundSize = '';
  } else if (type === 'grid') {
    const gc = gridColor || '#00F6D6';
    const go = (gridOpacity || 6) / 100;
    const gs = (gridSize || 32) + 'px';
    const col = gc + Math.round(go*255).toString(16).padStart(2,'0');
    document.body.style.backgroundImage = 'linear-gradient(' + col + ' 1px,transparent 1px),linear-gradient(90deg,' + col + ' 1px,transparent 1px)';
    document.body.style.backgroundSize = gs + ' ' + gs;
  } else if (type === 'image') {
    if (bgImageData) {
      const op = (bgImageOpacity || 80) / 100;
      document.body.style.backgroundImage    = 'url(' + bgImageData + ')';
      document.body.style.backgroundSize     = bgImageFit === 'repeat' ? 'auto' : bgImageFit;
      document.body.style.backgroundRepeat   = bgImageFit === 'repeat' ? 'repeat' : 'no-repeat';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      // Use a dark overlay via --bg-overlay CSS var so UI stays visible
      document.documentElement.style.setProperty('--bg-overlay-opacity', (1 - op).toFixed(2));
    }
  } else {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize  = '';
    document.body.style.backgroundRepeat = '';
  }
}

export function previewScanlines(val) {
  pendingStyle.scanlineIntensity = parseInt(val);
  if (bgLayers.scanlines) applyAllBgLayers();
  return; // old direct body style removed
  const v = (val / 100).toFixed(3);
  document.body.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,246,214,' + v + ') 2px,rgba(0,246,214,' + v + ') 4px)';
}

export function selectBubbleShape(el, val) {
  document.querySelectorAll('.shape-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  pendingStyle.bubbleRadius = parseInt(val);
  applyStyleVars(pendingStyle);
}

export function selectFont(type, el) {
  document.querySelectorAll('#font-grid-' + type + ', #font-grid-' + type + '-v').forEach(g => g.querySelectorAll('.font-chip').forEach(c => c.classList.remove('selected')));
  el.classList.add('selected');
  if (type === 'ui')      pendingStyle.fontUi      = el.dataset.font;
  if (type === 'display') pendingStyle.fontDisplay = el.dataset.font;
  applyStyleVars(pendingStyle);
}

export function previewSlider(key, val) {
  if (key === 'bubble-radius') pendingStyle.bubbleRadius = parseInt(val);
  if (key === 'msg-spacing')   pendingStyle.msgSpacing   = parseInt(val);
  applyStyleVars(pendingStyle);
}

export function applyStyleVars(s) {
  const r = document.documentElement.style;
  r.setProperty('--bg',            s.bg);
  r.setProperty('--surface',       s.surface);
  r.setProperty('--surface2',      s.surface2   || s.surface);
  r.setProperty('--border',        s.border     || '#1e1e35');
  r.setProperty('--teal',          s.teal);
  r.setProperty('--pink',          s.pink);
  r.setProperty('--purple',        s.purple     || s.userbubble || '#7B5FFF');
  r.setProperty('--text',          s.text);
  r.setProperty('--subtext',       s.subtext    || '#6060A0');
  r.setProperty('--user-bubble',   s.userbubble || s.purple || '#7B5FFF');
  r.setProperty('--bubble-user-bg', s.userbubble || s.purple || '#7B5FFF');
  r.setProperty('--bubble-radius', (s.bubbleRadius || 14) + 'px');
  r.setProperty('--msg-spacing',   (s.msgSpacing   || 10)  + 'px');
  r.setProperty('--font-ui',       s.fontUi      || "'DM Mono',monospace");
  r.setProperty('--font-display',  s.fontDisplay || "'Syne',sans-serif");
  r.setProperty('--font-size-base', (s.fontSize    || 13) + 'px');
  r.setProperty('--subtext-size',   (s.subtextSize || 11) + 'px');
}

function updateSwatches() {
  const map  = { bg:'sw-bg', surface:'sw-surface', teal:'sw-teal', pink:'sw-pink', userbubble:'sw-userbubble', text:'sw-text' };
  const mapV = { bg:'sw-bg-v', surface:'sw-surface-v', teal:'sw-teal-v', pink:'sw-pink-v', userbubble:'sw-userbubble-v', text:'sw-text-v' };
  Object.entries(map).forEach(([k,id])  => { const el=document.getElementById(id);  if(el) el.style.background = pendingStyle[k]||''; });
  Object.entries(mapV).forEach(([k,id]) => { const el=document.getElementById(id);  if(el) el.style.background = pendingStyle[k]||''; });
}

export function applyAndSaveStyle() {
  const btn = document.querySelector('[onclick="applyAndSaveStyle()"]');
  if (btn) { btn.textContent = '✓ saved'; btn.style.opacity = '0.7'; setTimeout(() => { btn.textContent = 'apply + save theme'; btn.style.opacity = '1'; }, 1200); }
  applyStyleVars(pendingStyle);
  applyBgType(pendingStyle.bgType || 'solid');
  localStorage.setItem('ss_style', JSON.stringify(pendingStyle));
}

export function resetStyle() {
  pendingStyle = { ...DEFAULT_STYLE };
  applyStyleVars(pendingStyle);
  applyBgType('solid');
  localStorage.removeItem('ss_style');
  updateSwatches();
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
}

export function updateParticleDensity(val) {
  pendingStyle.particleDensity = parseInt(val);
  if (pendingStyle.bgType === 'particles') { stopParticles(); startParticles(); }
}

export function loadSavedStyle() {
  try {
    const saved = localStorage.getItem('ss_style');
    if (saved) { const s = { ...DEFAULT_STYLE, ...JSON.parse(saved) }; applyStyleVars(s); applyBgType(s.bgType||'solid'); }
  } catch {}
}

function startParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const count = parseInt(pendingStyle.particleDensity) || 30;
  const spd   = (particleSpeed || 3) * 0.1;
  const sz    = particleSize  || 2;
  const col   = particleColor || pendingStyle.teal || '#00F6D6';
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * sz + 0.4,
    vx: (Math.random() - 0.5) * spd, vy: -Math.random() * spd - spd * 0.3,
    life: Math.random(),
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.003;
      if (p.life <= 0 || p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + 5; p.life = 0.6 + Math.random() * 0.4; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col + Math.floor(p.life * 180).toString(16).padStart(2, '0');
      ctx.fill();
    });
    particleAnim = requestAnimationFrame(draw);
  }
  if (particleAnim) cancelAnimationFrame(particleAnim);
  draw();
}

function stopParticles() {
  if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
}

// ── UNIFIED FONT PICKER ───────────────────────────────────────
let activeFontRole = 'display';
const ROLE_LABELS = {
  display: 'display — logo & section headers',
  ui:      'ui — tabs, buttons, labels',
  body:    'body — chat text & inputs',
};
export function setFontRole(role) {
  activeFontRole = role;
  ['display','ui','body'].forEach(r => {
    const btn = document.getElementById('font-role-' + r);
    if (!btn) return;
    const on = r === role;
    btn.style.background  = on ? 'var(--teal)' : 'var(--surface)';
    btn.style.borderColor = on ? 'var(--teal)' : 'var(--border)';
    btn.style.color       = on ? '#000' : 'var(--subtext)';
  });
  const lbl = document.getElementById('font-role-label');
  if (lbl) lbl.textContent = ROLE_LABELS[role] || '';
  const cur = role === 'display' ? pendingStyle.fontDisplay
            : role === 'ui'      ? pendingStyle.fontUi
            :                     (pendingStyle.fontBody || "'Inter',sans-serif");
  document.querySelectorAll('#font-grid-unified .font-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.font === cur);
  });
}
export function selectFontUnified(el) {
  document.querySelectorAll('#font-grid-unified .font-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const font = el.dataset.font;
  if (activeFontRole === 'display')      pendingStyle.fontDisplay = font;
  else if (activeFontRole === 'ui')      pendingStyle.fontUi = font;
  else { pendingStyle.fontBody = font; document.documentElement.style.setProperty('--font-body', font); }
  applyStyleVars(pendingStyle);
}

// ── CUSTOM THEME SLOTS ────────────────────────────────────────
export function initSlots() {
  for (let i = 0; i < 4; i++) renderSlot(i);
}
function renderSlot(i) {
  const raw = localStorage.getItem('ss_slot_' + i);
  const nameEl    = document.getElementById('slot-name-' + i);
  const previewEl = document.getElementById('slot-preview-' + i);
  const slotEl    = document.getElementById('slot-' + i);
  if (!nameEl) return;
  if (!raw) { nameEl.textContent = 'empty'; previewEl.innerHTML = ''; return; }
  const s = JSON.parse(raw);
  nameEl.textContent = s._name || ('preset ' + (i+1));
  nameEl.style.color = 'var(--text)';
  previewEl.innerHTML = [s.bg, s.teal, s.pink, s.purple].map(c =>
    '<div style="width:12px;height:12px;border-radius:50%;background:' + (c||'#333') + '"></div>'
  ).join('');
  if (slotEl) slotEl.style.borderColor = s.teal || 'var(--border)';
}
export function saveSlot(i) {
  const slotEl = document.getElementById('slot-' + i);
  if (!slotEl) return;
  // Remove any existing input
  const existing = slotEl.querySelector('.slot-input');
  if (existing) { existing.remove(); return; }
  const inp = document.createElement('input');
  inp.className = 'slot-input';
  inp.value = 'preset ' + (i+1);
  inp.style.cssText = 'width:100%;background:var(--surface2);border:1px solid var(--teal);border-radius:6px;padding:4px 8px;color:var(--text);font-family:var(--font-ui);font-size:var(--subtext-size);margin-top:4px;outline:none;box-sizing:border-box';
  slotEl.appendChild(inp);
  inp.focus(); inp.select();
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const name = inp.value.trim() || ('preset ' + (i+1));
      const data = { ...pendingStyle, _name: name };
      localStorage.setItem('ss_slot_' + i, JSON.stringify(data));
      inp.remove();
      renderSlot(i);
    }
    if (e.key === 'Escape') inp.remove();
  });
  inp.addEventListener('blur', () => setTimeout(() => inp.remove(), 200));
}
export function loadSlot(i) {
  const raw = localStorage.getItem('ss_slot_' + i);
  if (!raw) return;
  pendingStyle = { ...DEFAULT_STYLE, ...JSON.parse(raw) };
  applyStyleVars(pendingStyle);
  applyBgType(pendingStyle.bgType || 'solid');
  updateSwatches();
}

// ── BACKGROUND EXTENDED CONTROLS ─────────────────────────────
// particle/grid/image vars moved to top

export function updateParticleSpeed(v) { particleSpeed = parseInt(v); stopParticles(); startParticles(); }
export function updateParticleSize(v)  { particleSize  = parseFloat(v); stopParticles(); startParticles(); }
export function updateParticleColor(v) { particleColor = v; stopParticles(); startParticles(); }

export function updateGridSize(v) {
  gridSize = parseInt(v);
  applyAllBgLayers();
}
export function updateGridOpacity(v) {
  gridOpacity = parseInt(v);
  applyAllBgLayers();
}
export function updateGridColor(v) {
  gridColor = v;
  applyAllBgLayers();
}

export function loadBgImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    bgImageData = e.target.result;
    const prev = document.getElementById('bg-image-preview');
    if (prev) { prev.style.backgroundImage = 'url(' + bgImageData + ')'; prev.textContent = ''; }
    applyBgType('image');
  };
  reader.readAsDataURL(file);
}
export function updateBgImageOpacity(v) { bgImageOpacity = parseInt(v); applyAllBgLayers(); }
export function updateBgImageFit(fit) {
  bgImageFit = fit;
  ['cover','contain','repeat'].forEach(f => {
    const el = document.getElementById('fit-' + f);
    if (el) el.classList.toggle('selected', f === fit);
  });
  applyAllBgLayers();
}

// ── STACKABLE BG LAYERS ───────────────────────────────────────
const bgLayers = { image:false, particles:false, grid:false, scanlines:false };

export function toggleBgLayer(layer) {
  bgLayers[layer] = !bgLayers[layer];
  const tog = document.getElementById('toggle-' + layer);
  if (tog) {
    tog.style.background = bgLayers[layer] ? 'var(--teal)' : 'var(--muted)';
    tog.querySelector('div').style.transform = bgLayers[layer] ? 'translateX(18px)' : 'translateX(0)';
  }
  // Show/hide controls
  const ctrls = { image:'image-control', particles:'particle-control', grid:'grid-control', scanlines:'scanline-control' };
  const el = document.getElementById(ctrls[layer]);
  if (el) el.style.display = bgLayers[layer] ? 'block' : 'none';
  applyAllBgLayers();
}

export function applyAllBgLayers() {
  const canvas = document.getElementById('particles-canvas');
  // Particles
  if (bgLayers.particles) { canvas.classList.add('active'); startParticles(); }
  else { canvas.classList.remove('active'); stopParticles(); }
  // Image
  if (bgLayers.image && bgImageData) {
    const op = (bgImageOpacity || 80) / 100;
    document.body.style.backgroundImage    = 'url(' + bgImageData + ')';
    document.body.style.backgroundSize     = bgImageFit === 'repeat' ? 'auto' : bgImageFit;
    document.body.style.backgroundRepeat   = bgImageFit === 'repeat' ? 'repeat' : 'no-repeat';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.documentElement.style.setProperty('--bg-overlay-opacity', (1 - op).toFixed(2));
  } else {
    document.body.style.backgroundImage = '';
    document.documentElement.style.setProperty('--bg-overlay-opacity', '0');
  }
  // Grid layer div
  let gridEl = document.getElementById('grid-layer');
  if (!gridEl) {
    gridEl = document.createElement('div');
    gridEl.id = 'grid-layer';
    gridEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;';
    document.body.appendChild(gridEl);
  }
  if (bgLayers.grid) {
    const gc = gridColor || '#00F6D6';
    const go = (gridOpacity || 6) / 100;
    const gs = (gridSize || 32) + 'px';
    gridEl.style.backgroundImage = 'linear-gradient(' + gc + Math.round(go*255).toString(16).padStart(2,'0') + ' 1px,transparent 1px),linear-gradient(90deg,' + gc + Math.round(go*255).toString(16).padStart(2,'0') + ' 1px,transparent 1px)';
    gridEl.style.backgroundSize = gs + ' ' + gs;
    gridEl.style.display = 'block';
  } else { gridEl.style.display = 'none'; }
  // Scanlines layer div
  let slEl = document.getElementById('scanline-layer');
  if (!slEl) {
    slEl = document.createElement('div');
    slEl.id = 'scanline-layer';
    slEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;';
    document.body.appendChild(slEl);
  }
  if (bgLayers.scanlines) {
    const v = (pendingStyle.scanlineIntensity || 2) / 100;
    slEl.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,246,214,' + v + ') 2px,rgba(0,246,214,' + v + ') 4px)';
    slEl.style.display = 'block';
  } else { slEl.style.display = 'none'; }
}
