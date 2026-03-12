#!/usr/bin/env python3
import os, re

REPO = os.path.expanduser('~/spiralside')
SRC  = os.path.join(REPO, 'index.html')

with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. STYLE CSS ──────────────────────────────────────────────
STYLE_CSS = """
    /* ── PARTICLES CANVAS ── */
    #particles-canvas {
      position: fixed; inset: 0; z-index: 0;
      pointer-events: none; opacity: 0; transition: opacity 1s ease;
    }
    #particles-canvas.active { opacity: 1; }

    /* ── STYLE PANEL ── */
    .style-section { margin-bottom: 28px; }
    .style-section-title {
      font-size: 0.6rem; letter-spacing: 0.14em; color: var(--subtext);
      text-transform: uppercase; margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .style-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .theme-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 4px; }
    .theme-card {
      border-radius: 10px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; transition: border-color 0.2s, transform 0.15s;
    }
    .theme-card:hover { transform: translateY(-2px); }
    .theme-card.active { border-color: var(--teal); }
    .theme-preview { height: 48px; display: flex; align-items: flex-end; padding: 6px; }
    .theme-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 3px; }
    .theme-name { font-size: 0.6rem; letter-spacing: 0.08em; text-align: center; padding: 5px 4px; background: var(--surface2); color: var(--subtext); }
    .color-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); }
    .color-row:last-child { border-bottom: none; }
    .color-label { flex: 1; font-size: 0.75rem; color: var(--subtext); }
    .color-swatch { width: 32px; height: 32px; border-radius: 8px; border: 2px solid var(--border); cursor: pointer; overflow: hidden; position: relative; flex-shrink: 0; }
    .color-swatch-bg { width: 100%; height: 100%; border-radius: 6px; }
    .color-swatch input[type="color"] { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); border: none; cursor: pointer; opacity: 0; }
    .bg-type-row { display: flex; gap: 8px; margin-bottom: 14px; }
    .bg-chip { flex: 1; padding: 9px 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.68rem; cursor: pointer; text-align: center; transition: all 0.15s; }
    .bg-chip.selected { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.07); }
    .scanline-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
    .scanline-label { flex: 1; font-size: 0.72rem; color: var(--subtext); }
    .scanline-row input[type="range"] { flex: 1; accent-color: var(--teal); }
    .scanline-val { font-size: 0.68rem; color: var(--teal); width: 28px; text-align: right; }
    .bubble-shape-row { display: flex; gap: 8px; }
    .shape-chip { flex: 1; padding: 10px 4px; background: var(--surface); border: 1px solid var(--border); cursor: pointer; text-align: center; font-size: 0.68rem; transition: all 0.15s; color: var(--subtext); }
    .shape-chip:nth-child(1) { border-radius: 8px 2px 8px 8px; }
    .shape-chip:nth-child(2) { border-radius: 20px; }
    .shape-chip:nth-child(3) { border-radius: 2px; }
    .shape-chip.selected { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.07); }
    .font-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px; }
    .font-chip { padding: 10px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.15s; font-size: 0.78rem; color: var(--subtext); }
    .font-chip.selected { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.07); }
    .slider-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .slider-label { font-size: 0.72rem; color: var(--subtext); width: 100px; flex-shrink: 0; }
    .slider-row input[type="range"] { flex: 1; accent-color: var(--teal); height: 4px; }
    .slider-val { font-size: 0.68rem; color: var(--teal); width: 28px; text-align: right; flex-shrink: 0; }
    .style-apply-btn { width: 100%; padding: 13px; background: linear-gradient(135deg,var(--teal),var(--pink)); border: none; border-radius: 12px; color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; cursor: pointer; margin-top: 8px; transition: opacity 0.2s; }
    .style-apply-btn:hover { opacity: 0.88; }
    .style-reset-btn { width: 100%; padding: 11px; background: transparent; border: 1px solid var(--border); border-radius: 12px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.78rem; cursor: pointer; margin-top: 8px; transition: all 0.2s; }
    .style-reset-btn:hover { border-color: var(--pink); color: var(--pink); }
"""
html = html.replace('  </style>\n</head>', STYLE_CSS + '  </style>\n</head>', 1)

# ── 2. PARTICLES CANVAS ───────────────────────────────────────
html = html.replace(
    '\n<div class="screen" id="screen-comic">',
    '\n<canvas id="particles-canvas"></canvas>\n<div class="screen" id="screen-comic">'
)

# ── 3. ADD STYLE TAB BUTTON ───────────────────────────────────
html = html.replace(
    '    <button class="panel-tab active" onclick="switchPanelTab(\'store\')">store</button>\n    <button class="panel-tab" onclick="switchPanelTab(\'account\')">account</button>',
    '    <button class="panel-tab active" onclick="switchPanelTab(\'store\')">store</button>\n    <button class="panel-tab" onclick="switchPanelTab(\'style\')">style</button>\n    <button class="panel-tab" onclick="switchPanelTab(\'account\')">account</button>'
)

# ── 4. STYLE PANEL HTML ───────────────────────────────────────
STYLE_HTML = """
    <!-- STYLE -->
    <div class="panel-tab-content" id="panel-style">
      <div class="style-section">
        <div class="style-section-title">themes</div>
        <div class="theme-grid" id="theme-grid"></div>
      </div>
      <div class="style-section">
        <div class="style-section-title">colors</div>
        <div class="color-row"><span class="color-label">background</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-bg" style="background:#08080d"></div><input type="color" value="#08080d" oninput="previewColor('bg',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">surface</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-surface" style="background:#0f0f18"></div><input type="color" value="#0f0f18" oninput="previewColor('surface',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">accent (primary)</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-teal" style="background:#00F6D6"></div><input type="color" value="#00F6D6" oninput="previewColor('teal',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">accent (secondary)</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-pink" style="background:#FF4BCB"></div><input type="color" value="#FF4BCB" oninput="previewColor('pink',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">user bubble</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-userbubble" style="background:#7B5FFF"></div><input type="color" value="#7B5FFF" oninput="previewColor('userbubble',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">text</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-text" style="background:#F0F0FF"></div><input type="color" value="#F0F0FF" oninput="previewColor('text',this.value)" /></div></div>
      </div>
      <div class="style-section">
        <div class="style-section-title">background</div>
        <div class="bg-type-row">
          <div class="bg-chip selected" data-bg="solid" onclick="selectBgType(this,'solid')">solid</div>
          <div class="bg-chip" data-bg="scanlines" onclick="selectBgType(this,'scanlines')">scanlines</div>
          <div class="bg-chip" data-bg="particles" onclick="selectBgType(this,'particles')">particles</div>
          <div class="bg-chip" data-bg="grid" onclick="selectBgType(this,'grid')">grid</div>
        </div>
        <div class="scanline-row" id="scanline-control" style="display:none"><span class="scanline-label">intensity</span><input type="range" min="0" max="6" value="2" oninput="previewScanlines(this.value);document.getElementById('sl-val').textContent=this.value" /><span class="scanline-val" id="sl-val">2</span></div>
        <div class="scanline-row" id="particle-control" style="display:none"><span class="scanline-label">density</span><input type="range" min="10" max="80" value="30" oninput="updateParticleDensity(this.value);document.getElementById('pd-val').textContent=this.value" /><span class="scanline-val" id="pd-val">30</span></div>
      </div>
      <div class="style-section">
        <div class="style-section-title">bubble shape</div>
        <div class="bubble-shape-row">
          <div class="shape-chip selected" data-shape="16" onclick="selectBubbleShape(this,'16')">soft</div>
          <div class="shape-chip" data-shape="24" onclick="selectBubbleShape(this,'24')">pill</div>
          <div class="shape-chip" data-shape="3" onclick="selectBubbleShape(this,'3')">sharp</div>
        </div>
      </div>
      <div class="style-section">
        <div class="style-section-title">typography</div>
        <div style="font-size:0.6rem;color:var(--subtext);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">ui font</div>
        <div class="font-grid" id="font-grid-ui">
          <div class="font-chip selected" data-font="'DM Mono',monospace" style="font-family:'DM Mono',monospace" onclick="selectFont('ui',this)">DM Mono</div>
          <div class="font-chip" data-font="'JetBrains Mono',monospace" style="font-family:'JetBrains Mono',monospace" onclick="selectFont('ui',this)">JetBrains</div>
          <div class="font-chip" data-font="'Space Grotesk',sans-serif" style="font-family:'Space Grotesk',sans-serif" onclick="selectFont('ui',this)">Grotesk</div>
          <div class="font-chip" data-font="'Outfit',sans-serif" style="font-family:'Outfit',sans-serif" onclick="selectFont('ui',this)">Outfit</div>
          <div class="font-chip" data-font="'Raleway',sans-serif" style="font-family:'Raleway',sans-serif" onclick="selectFont('ui',this)">Raleway</div>
          <div class="font-chip" data-font="'Playfair Display',serif" style="font-family:'Playfair Display',serif" onclick="selectFont('ui',this)">Playfair</div>
        </div>
        <div style="font-size:0.6rem;color:var(--subtext);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;margin-top:14px">display font</div>
        <div class="font-grid" id="font-grid-display">
          <div class="font-chip selected" data-font="'Syne',sans-serif" style="font-family:'Syne',sans-serif" onclick="selectFont('display',this)">Syne</div>
          <div class="font-chip" data-font="'Outfit',sans-serif" style="font-family:'Outfit',sans-serif" onclick="selectFont('display',this)">Outfit</div>
          <div class="font-chip" data-font="'Space Grotesk',sans-serif" style="font-family:'Space Grotesk',sans-serif" onclick="selectFont('display',this)">Grotesk</div>
          <div class="font-chip" data-font="'Playfair Display',serif" style="font-family:'Playfair Display',serif" onclick="selectFont('display',this)">Playfair</div>
        </div>
      </div>
      <div class="style-section">
        <div class="style-section-title">spacing</div>
        <div class="slider-row"><span class="slider-label">bubble radius</span><input type="range" min="2" max="28" value="14" oninput="previewSlider('bubble-radius',this.value+'px');document.getElementById('sv-br').textContent=this.value" /><span class="slider-val" id="sv-br">14</span></div>
        <div class="slider-row"><span class="slider-label">message gap</span><input type="range" min="4" max="28" value="10" oninput="previewSlider('msg-spacing',this.value+'px');document.getElementById('sv-mg').textContent=this.value" /><span class="slider-val" id="sv-mg">10</span></div>
      </div>
      <button class="style-apply-btn" onclick="applyAndSaveStyle()">apply + save theme</button>
      <button class="style-reset-btn" onclick="resetStyle()">reset to default</button>
      <div style="height:40px"></div>
    </div>

"""
html = html.replace(
    '    <!-- ACCOUNT -->\n    <div class="panel-tab-content" id="panel-account">',
    STYLE_HTML + '    <!-- ACCOUNT -->\n    <div class="panel-tab-content" id="panel-account">'
)

# ── 5. ADD STYLE FAB ITEM ─────────────────────────────────────
html = html.replace(
    "  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },\n];",
    "  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },\n  { id: 'style', label: 'style', icon: '🎨', color: '#FF4BCB', panel: true },\n];"
)

# Update buildFAB to handle panel:true
html = html.replace(
    "onclick=\"switchView('${tab.id}')\">${tab.icon}</div>",
    "onclick=\"tab.panel ? (openPanel('style'),toggleFAB()) : switchView('${tab.id}')\">${tab.icon}</div>"
)

# ── 6. FIX switchPanelTab for 3 tabs ─────────────────────────
html = html.replace(
    "    const tabs = ['store','account'];",
    "    const tabs = ['store','style','account'];"
)

# ── 7. FIX openPanel to init style panel ─────────────────────
html = html.replace(
    "function openPanel(tab='store') {\n  document.getElementById('panel-overlay').classList.add('open');\n  document.getElementById('slide-panel').classList.add('open');\n  switchPanelTab(tab);\n}",
    "function openPanel(tab='store') {\n  document.getElementById('panel-overlay').classList.add('open');\n  document.getElementById('slide-panel').classList.add('open');\n  switchPanelTab(tab);\n  if (tab === 'style') initStylePanel();\n}"
)

# ── 8. STYLE + PARTICLES JS ───────────────────────────────────
STYLE_JS = """
// ══════════════════════════════════════════════════════════════
// STYLE SYSTEM + PARTICLES
// ══════════════════════════════════════════════════════════════

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
  bgType:'solid', scanlineIntensity:2, particleDensity:30,
};
let pendingStyle = { ...DEFAULT_STYLE };
let styleInited  = false;

window.initStylePanel = function() {
  // Only build the grid once
  const grid = document.getElementById('theme-grid');
  if (!grid || styleInited) return;
  styleInited = true;

  grid.innerHTML = THEMES.map(t =>
    '<div class="theme-card" data-theme="' + t.id + '" onclick="applyThemePreset(\\'' + t.id + '\\')">' +
    '<div class="theme-preview" style="background:' + t.bg + '">' +
    '<div class="theme-dot" style="background:' + t.teal + '"></div>' +
    '<div class="theme-dot" style="background:' + t.pink + '"></div>' +
    '<div class="theme-dot" style="background:' + t.purple + '"></div>' +
    '</div><div class="theme-name">' + t.name + '</div></div>'
  ).join('');

  // Load saved
  try {
    const saved = localStorage.getItem('ss_style');
    if (saved) { pendingStyle = { ...DEFAULT_STYLE, ...JSON.parse(saved) }; applyStyleVars(pendingStyle); }
  } catch {}
}

window.applyThemePreset = function(id) {
  const t = THEMES.find(x => x.id === id);
  if (!t) return;
  pendingStyle = { ...pendingStyle, ...t };
  document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.theme === id));
  updateSwatches();
  applyStyleVars(pendingStyle);
}

window.previewColor = function(key, val) {
  pendingStyle[key] = val;
  const map = { bg:'sw-bg', surface:'sw-surface', teal:'sw-teal', pink:'sw-pink', userbubble:'sw-userbubble', text:'sw-text' };
  const el = document.getElementById(map[key]);
  if (el) el.style.background = val;
  applyStyleVars(pendingStyle);
}

window.selectBgType = function(el, type) {
  document.querySelectorAll('.bg-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  pendingStyle.bgType = type;
  document.getElementById('scanline-control').style.display = type === 'scanlines' ? 'flex' : 'none';
  document.getElementById('particle-control').style.display = type === 'particles'  ? 'flex' : 'none';
  applyBgType(type);
}

window.applyBgType = function(type) {
  const canvas = document.getElementById('particles-canvas');
  if (type === 'particles') { canvas.classList.add('active'); startParticles(); }
  else { canvas.classList.remove('active'); stopParticles(); }
  if (type === 'scanlines') {
    document.body.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,246,214,0.03) 2px,rgba(0,246,214,0.03) 4px)';
    document.body.style.backgroundSize = '';
  } else if (type === 'grid') {
    document.body.style.backgroundImage = 'linear-gradient(rgba(0,246,214,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,246,214,0.04) 1px,transparent 1px)';
    document.body.style.backgroundSize = '32px 32px';
  } else {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize  = '';
  }
}

window.previewScanlines = function(val) {
  const v = (val / 100).toFixed(3);
  document.body.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,246,214,' + v + ') 2px,rgba(0,246,214,' + v + ') 4px)';
}

window.selectBubbleShape = function(el, val) {
  document.querySelectorAll('.shape-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  pendingStyle.bubbleRadius = parseInt(val);
  applyStyleVars(pendingStyle);
}

window.selectFont = function(type, el) {
  document.getElementById('font-grid-' + type).querySelectorAll('.font-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  if (type === 'ui')      pendingStyle.fontUi      = el.dataset.font;
  if (type === 'display') pendingStyle.fontDisplay = el.dataset.font;
  applyStyleVars(pendingStyle);
}

window.previewSlider = function(key, val) {
  if (key === 'bubble-radius') pendingStyle.bubbleRadius = parseInt(val);
  if (key === 'msg-spacing')   pendingStyle.msgSpacing   = parseInt(val);
  applyStyleVars(pendingStyle);
}

window.applyStyleVars = function(s) {
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
  r.setProperty('--bubble-radius', (s.bubbleRadius || 14) + 'px');
  r.setProperty('--msg-spacing',   (s.msgSpacing   || 10)  + 'px');
  r.setProperty('--font-ui',       s.fontUi      || "'DM Mono',monospace");
  r.setProperty('--font-display',  s.fontDisplay || "'Syne',sans-serif");
}

window.updateSwatches = function() {
  const map = { bg:'sw-bg', surface:'sw-surface', teal:'sw-teal', pink:'sw-pink', userbubble:'sw-userbubble', text:'sw-text' };
  Object.entries(map).forEach(([k,id]) => { const el=document.getElementById(id); if(el) el.style.background = pendingStyle[k]||''; });
}

window.applyAndSaveStyle = function() {
  applyStyleVars(pendingStyle);
  applyBgType(pendingStyle.bgType || 'solid');
  localStorage.setItem('ss_style', JSON.stringify(pendingStyle));
  closePanel();
}

window.resetStyle = function() {
  pendingStyle = { ...DEFAULT_STYLE };
  applyStyleVars(pendingStyle);
  applyBgType('solid');
  localStorage.removeItem('ss_style');
  updateSwatches();
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
}

// Load saved style on boot
(function() {
  try {
    const saved = localStorage.getItem('ss_style');
    if (saved) { const s = { ...DEFAULT_STYLE, ...JSON.parse(saved) }; applyStyleVars(s); applyBgType(s.bgType||'solid'); }
  } catch {}
})();

// ── PARTICLES ─────────────────────────────────────────────────
let particleAnim = null;
let particles    = [];

window.startParticles = function() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const count = parseInt(pendingStyle.particleDensity) || 30;
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.4,
    vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
    life: Math.random(),
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = pendingStyle.teal || '#00F6D6';
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.003;
      if (p.life <= 0 || p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + 5; p.life = 0.6 + Math.random() * 0.4; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = color + Math.floor(p.life * 180).toString(16).padStart(2, '0');
      ctx.fill();
    });
    particleAnim = requestAnimationFrame(draw);
  }
  if (particleAnim) cancelAnimationFrame(particleAnim);
  draw();
}

window.stopParticles = function() {
  if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
}

window.updateParticleDensity = function(val) {
  pendingStyle.particleDensity = parseInt(val);
  if (pendingStyle.bgType === 'particles') { stopParticles(); startParticles(); }
}
"""

html = html.replace('</script>\n</body>', STYLE_JS + '\n</script>\n</body>')

with open(SRC, 'w', encoding='utf-8') as f:
    f.write(html)

print("Done! index.html patched cleanly.")
