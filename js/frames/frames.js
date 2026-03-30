// ============================================================
// SPIRALSIDE — FRAMES v1.0
// Frame Maker tab: build SVG frames, import PNG frames,
// save to IDB `frames` store, apply to cards/comics/books/imagine
// Public API: window.openFramePicker(opts), window.applyFrame(el, frame)
// Nimbis anchor: js/frames/frames.js
// ============================================================

// ── IDB HELPERS ───────────────────────────────────────────────────────────────
// Delegate to db.js functions imported at init time.
// _dbFns is populated by initFramesView() once db.js is ready.
let _dbFns = null;

function _ensureDB() {
  if (!_dbFns) throw new Error('[frames] db not ready — call initFramesView first');
}

async function _getAllFrames() {
  _ensureDB();
  return (await _dbFns.getAll('frames')) || [];
}

async function _putFrame(frame) {
  _ensureDB();
  return _dbFns.set('frames', frame);
}

async function _deleteFrame(id) {
  _ensureDB();
  return _dbFns.del('frames', id);
}

// ── BUILT-IN DEFAULT FRAME ─────────────────────────────────────────────────
// One clean Bloomcore default — teal/pink corners, dark field, diamond accents
const BUILTIN_FRAME = {
  id:          'builtin_bloomcore',
  name:        'Bloomcore',
  creator:     'builtin',
  type:        'svg',
  compatibleWith: ['all'],
  svgData: `<svg viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <linearGradient id="bc-teal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00F6D6" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#7B5FFF" stop-opacity="0.7"/>
    </linearGradient>
    <linearGradient id="bc-pink" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF4BCB" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#7B5FFF" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <!-- outer border -->
  <rect x="4" y="4" width="392" height="552" rx="14" ry="14"
        fill="none" stroke="url(#bc-teal)" stroke-width="2" opacity="0.6"/>
  <!-- inner border -->
  <rect x="12" y="12" width="376" height="536" rx="10" ry="10"
        fill="none" stroke="url(#bc-pink)" stroke-width="1" opacity="0.3"/>
  <!-- top-left corner bracket -->
  <path d="M14,40 L14,14 L40,14" fill="none" stroke="#00F6D6" stroke-width="3" stroke-linecap="round"/>
  <!-- top-right corner bracket -->
  <path d="M360,14 L386,14 L386,40" fill="none" stroke="#00F6D6" stroke-width="3" stroke-linecap="round"/>
  <!-- bottom-left corner bracket -->
  <path d="M14,520 L14,546 L40,546" fill="none" stroke="#FF4BCB" stroke-width="3" stroke-linecap="round"/>
  <!-- bottom-right corner bracket -->
  <path d="M360,546 L386,546 L386,520" fill="none" stroke="#FF4BCB" stroke-width="3" stroke-linecap="round"/>
  <!-- top-left diamond -->
  <polygon points="14,8 20,14 14,20 8,14" fill="#00F6D6" opacity="0.85"/>
  <!-- top-right diamond -->
  <polygon points="386,8 392,14 386,20 380,14" fill="#00F6D6" opacity="0.85"/>
  <!-- bottom-left diamond -->
  <polygon points="14,540 20,546 14,552 8,546" fill="#FF4BCB" opacity="0.85"/>
  <!-- bottom-right diamond -->
  <polygon points="386,540 392,546 386,552 380,546" fill="#FF4BCB" opacity="0.85"/>
  <!-- top center line accent -->
  <line x1="80" y1="14" x2="320" y2="14" stroke="#00F6D6" stroke-width="1" opacity="0.25"/>
  <!-- bottom center line accent -->
  <line x1="80" y1="546" x2="320" y2="546" stroke="#FF4BCB" stroke-width="1" opacity="0.25"/>
</svg>`,
  thumbnail: null,  // generated lazily via canvas
  createdAt: 0
};

// ── THUMBNAIL GENERATOR ───────────────────────────────────────────────────────
// Renders a frame's SVG or PNG into an 80×80 canvas thumbnail (data URL)
function _makeThumbnail(frame) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width  = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    // dark background
    ctx.fillStyle = '#0f0f18';
    ctx.fillRect(0, 0, 80, 80);

    if (frame.type === 'svg') {
      // Render SVG string via Blob URL
      const blob = new Blob([frame.svgData], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 80, 80);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL());
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } else if (frame.type === 'png' && frame.pngData) {
      const img = new Image();
      img.onload  = () => { ctx.drawImage(img, 0, 0, 80, 80); resolve(canvas.toDataURL()); };
      img.onerror = () => resolve(null);
      img.src = frame.pngData;
    } else {
      resolve(null);
    }
  });
}

// ── SAVE / DELETE PUBLIC ──────────────────────────────────────────────────────
export async function saveFrame(frame) {
  // Generate id if missing
  if (!frame.id) frame.id = 'frame_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
  if (!frame.createdAt) frame.createdAt = Date.now();
  // Auto-generate thumbnail if missing
  if (!frame.thumbnail) frame.thumbnail = await _makeThumbnail(frame);
  await _putFrame(frame);
  return frame;
}

export async function deleteFrame(id) {
  await _deleteFrame(id);
}

export async function getAllFrames() {
  const stored = await _getAllFrames();
  // Always prepend builtin (not stored in IDB)
  return [BUILTIN_FRAME, ...stored.filter(f => !f.id.startsWith('builtin_'))];
}

// ── APPLY FRAME TO A DOM ELEMENT ─────────────────────────────────────────────
// Wraps el in a position:relative container and overlays the frame as an img/svg
// Returns the wrapper div so callers can use it.
export function applyFrame(el, frame) {
  if (!el || !frame) return;

  // Remove any existing frame overlay on this element
  const existing = el.parentElement?.querySelector('.ss-frame-overlay');
  if (existing) existing.remove();

  // Make sure parent is relative
  const parent = el.parentElement;
  if (parent) parent.style.position = 'relative';

  // Build overlay element
  const overlay = document.createElement('div');
  overlay.className       = 'ss-frame-overlay';
  overlay.dataset.frameId = frame.id;
  overlay.style.cssText   = [
    'position:absolute', 'inset:0', 'pointer-events:none',
    'z-index:10', 'width:100%', 'height:100%'
  ].join(';');

  if (frame.type === 'svg') {
    // Inline SVG scales perfectly at any size
    overlay.innerHTML = frame.svgData;
    const svg = overlay.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    }
  } else if (frame.type === 'png' && frame.pngData) {
    const img = document.createElement('img');
    img.src            = frame.pngData;
    img.style.cssText  = 'position:absolute;inset:0;width:100%;height:100%;object-fit:fill';
    overlay.appendChild(img);
  }

  // Insert overlay after el inside parent
  el.after(overlay);
  return overlay;
}

// ── BAKE FRAME TO PNG (canvas composite) ────────────────────────────────────
// Merges content element + frame into a single PNG download
export async function bakeFrameToPNG(contentEl, frame, filename) {
  filename = filename || 'spiralside-frame.png';
  const rect = contentEl.getBoundingClientRect();
  const w    = Math.round(rect.width)  || 400;
  const h    = Math.round(rect.height) || 560;

  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Draw content element as image via html2canvas fallback: just draw bg color + placeholder
  // Real implementation: draw contentEl screenshot then frame on top
  ctx.fillStyle = '#0f0f18';
  ctx.fillRect(0, 0, w, h);

  // Draw frame on top
  await new Promise(resolve => {
    if (frame.type === 'svg') {
      const blob = new Blob([frame.svgData], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); resolve(); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    } else if (frame.type === 'png' && frame.pngData) {
      const img = new Image();
      img.onload  = () => { ctx.drawImage(img, 0, 0, w, h); resolve(); };
      img.onerror = () => resolve();
      img.src = frame.pngData;
    } else {
      resolve();
    }
  });

  // Trigger download
  const a    = document.createElement('a');
  a.href     = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

// ── FRAME PICKER OVERLAY ─────────────────────────────────────────────────────
// Opens a modal grid of available frames; calls opts.onSelect(frame) on pick
// opts: { surface: 'card'|'comic'|'book'|'imagine'|null, onSelect: fn }
export async function openFramePicker(opts = {}) {
  opts = Object.assign({ surface: null, onSelect: null }, opts);

  // Remove any existing picker
  document.getElementById('ss-frame-picker')?.remove();

  const frames = await getAllFrames();

  const overlay = document.createElement('div');
  overlay.id            = 'ss-frame-picker';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9000',
    'background:rgba(0,0,0,0.75)',
    'display:flex', 'align-items:flex-end', 'justify-content:center',
    'animation:fpFadeIn 0.2s ease'
  ].join(';');

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.innerHTML = `
    <style>
      @keyframes fpFadeIn { from{opacity:0} to{opacity:1} }
      #ss-fp-panel {
        background:var(--bg,#08080d);
        border:1px solid var(--border,#1e1e35);
        border-bottom:none;
        border-radius:20px 20px 0 0;
        width:100%; max-width:min(480px,100vw);
        max-height:80dvh; display:flex; flex-direction:column;
        box-shadow:0 -20px 60px rgba(0,0,0,0.6);
      }
      #ss-fp-handle {
        width:40px; height:4px; background:var(--border,#1e1e35);
        border-radius:2px; margin:14px auto 0; flex-shrink:0;
      }
      #ss-fp-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:14px 20px 0; flex-shrink:0;
      }
      #ss-fp-title {
        font-family:var(--font-display,'Syne',sans-serif);
        font-weight:700; font-size:0.95rem; color:var(--text,#F0F0FF);
      }
      #ss-fp-close {
        background:none; border:none; color:var(--subtext,#6060A0);
        font-size:1.2rem; cursor:pointer; padding:4px;
      }
      #ss-fp-grid {
        display:grid; grid-template-columns:repeat(3,1fr);
        gap:10px; padding:16px 20px 80px; overflow-y:auto;
        -webkit-overflow-scrolling:touch;
      }
      .ss-fp-card {
        background:var(--surface,#0f0f18);
        border:1px solid var(--border,#1e1e35);
        border-radius:10px; overflow:hidden; cursor:pointer;
        transition:border-color 0.2s, transform 0.15s;
      }
      .ss-fp-card:hover { border-color:var(--teal,#00F6D6); transform:translateY(-2px); }
      .ss-fp-thumb {
        width:100%; aspect-ratio:5/7;
        background:var(--muted,#1a1a2e);
        display:flex; align-items:center; justify-content:center;
        overflow:hidden; position:relative;
      }
      .ss-fp-thumb img { width:100%; height:100%; object-fit:cover; }
      .ss-fp-thumb svg { width:100%; height:100%; }
      .ss-fp-name {
        font-size:0.6rem; letter-spacing:0.1em; text-align:center;
        padding:5px 4px; color:var(--subtext,#6060A0);
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .ss-fp-new {
        background:rgba(0,246,214,0.06);
        border:1px dashed rgba(0,246,214,0.3) !important;
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; gap:6px; cursor:pointer;
        padding:12px 8px; border-radius:10px;
        min-height:120px; color:var(--teal,#00F6D6);
        font-size:0.68rem; letter-spacing:0.08em;
        transition:background 0.2s;
      }
      .ss-fp-new:hover { background:rgba(0,246,214,0.1); }
    </style>
    <div id="ss-fp-panel">
      <div id="ss-fp-handle"></div>
      <div id="ss-fp-header">
        <div id="ss-fp-title">▣ choose frame</div>
        <button id="ss-fp-close">✕</button>
      </div>
      <div id="ss-fp-grid"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wire close button
  overlay.querySelector('#ss-fp-close').addEventListener('click', () => overlay.remove());

  // Populate grid
  const grid = overlay.querySelector('#ss-fp-grid');

  // "No frame" option
  const noneCard = document.createElement('div');
  noneCard.className = 'ss-fp-card';
  noneCard.innerHTML = `
    <div class="ss-fp-thumb" style="align-items:center;justify-content:center;opacity:0.3;">
      <svg viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="36" height="52" rx="3" stroke="#888" stroke-width="1" stroke-dasharray="4 3"/>
        <line x1="2" y1="2" x2="38" y2="54" stroke="#888" stroke-width="1"/>
      </svg>
    </div>
    <div class="ss-fp-name">none</div>
  `;
  noneCard.addEventListener('click', () => {
    if (opts.onSelect) opts.onSelect(null);
    overlay.remove();
  });
  grid.appendChild(noneCard);

  // Frame cards
  for (const frame of frames) {
    const card = document.createElement('div');
    card.className = 'ss-fp-card';

    // Thumbnail area
    const thumb = document.createElement('div');
    thumb.className = 'ss-fp-thumb';

    if (frame.thumbnail) {
      const img = document.createElement('img');
      img.src = frame.thumbnail;
      img.alt = frame.name;
      thumb.appendChild(img);
    } else if (frame.type === 'svg') {
      // Inline SVG preview
      thumb.innerHTML = frame.svgData;
      const svg = thumb.querySelector('svg');
      if (svg) svg.style.cssText = 'width:100%;height:100%';
    } else {
      thumb.textContent = '▣';
    }

    const nameEl = document.createElement('div');
    nameEl.className   = 'ss-fp-name';
    nameEl.textContent = frame.name || 'frame';

    card.appendChild(thumb);
    card.appendChild(nameEl);

    card.addEventListener('click', () => {
      if (opts.onSelect) opts.onSelect(frame);
      overlay.remove();
    });

    grid.appendChild(card);
  }

  // "Create new" shortcut
  const newCard = document.createElement('div');
  newCard.className = 'ss-fp-new';
  newCard.innerHTML = `<span style="font-size:1.5rem">+</span><span>new frame</span>`;
  newCard.addEventListener('click', () => {
    overlay.remove();
    if (window.switchView) window.switchView('frames');
  });
  grid.appendChild(newCard);
}

// ── FRAME MAKER UI ────────────────────────────────────────────────────────────
// Renders the full Frame Maker interface into #view-frames
// Called by window.initFramesView() from main.js viewInits
export async function initFramesView() {
  const view = document.getElementById('view-frames');
  if (!view) return;

  // Guard against double-init
  if (view.dataset.init) return;
  view.dataset.init = '1';

  // Wire db.js functions into frames module
  const { dbGet, dbSet, dbGetAll, dbDelete } = await import('../app/db.js');
  _dbFns = { get: dbGet, set: dbSet, getAll: dbGetAll, del: dbDelete };

  // Inject tab-specific styles
  _injectStyles();

  // Render shell
  view.innerHTML = `
    <div id="frames-inner">

      <!-- ── TABS ── -->
      <div class="frames-tabs">
        <button class="frames-tab active" id="ftab-make"    onclick="window._framesSwitchTab('make')">✦ make</button>
        <button class="frames-tab"        id="ftab-library" onclick="window._framesSwitchTab('library')">▣ my frames</button>
      </div>

      <!-- ── MAKE TAB ── -->
      <div class="frames-pane active" id="fpane-make">

        <!-- LIVE PREVIEW -->
        <div class="frames-preview-wrap">
          <div class="frames-preview-bg">
            <img id="fp-preview-img" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:10px;"/>
            <div id="fp-preview-placeholder">◈</div>
          </div>
          <div class="frames-preview-frame" id="fp-preview-frame"></div>
        </div>

        <!-- NAME -->
        <div class="frames-field">
          <label class="frames-label">frame name</label>
          <input class="frames-input" type="text" id="fp-name" placeholder="my bloomcore frame" />
        </div>

        <!-- HOLE SIZE -->
        <div class="frames-section-title">window / hole</div>
        <div class="frames-row">
          <div class="frames-field">
            <label class="frames-label">inset (px)</label>
            <input class="frames-input" type="range" id="fp-inset" min="4" max="40" value="14"
              oninput="window._framesPreview();document.getElementById('fp-inset-val').textContent=this.value" />
          </div>
          <div class="frames-val" id="fp-inset-val">14</div>
        </div>
        <div class="frames-row">
          <div class="frames-field">
            <label class="frames-label">corner radius</label>
            <input class="frames-input" type="range" id="fp-radius" min="0" max="32" value="10"
              oninput="window._framesPreview();document.getElementById('fp-radius-val').textContent=this.value" />
          </div>
          <div class="frames-val" id="fp-radius-val">10</div>
        </div>

        <!-- BORDER -->
        <div class="frames-section-title">border</div>
        <div class="frames-row">
          <div class="frames-field">
            <label class="frames-label">thickness</label>
            <input class="frames-input" type="range" id="fp-bthick" min="1" max="10" value="3"
              oninput="window._framesPreview();document.getElementById('fp-bthick-val').textContent=this.value" />
          </div>
          <div class="frames-val" id="fp-bthick-val">3</div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0">primary color</label>
          <div class="frames-swatch">
            <div class="frames-swatch-bg" id="fp-col1-bg" style="background:#00F6D6"></div>
            <input type="color" value="#00F6D6" id="fp-col1"
              oninput="document.getElementById('fp-col1-bg').style.background=this.value;window._framesPreview()" />
          </div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0">secondary color</label>
          <div class="frames-swatch">
            <div class="frames-swatch-bg" id="fp-col2-bg" style="background:#FF4BCB"></div>
            <input type="color" value="#FF4BCB" id="fp-col2"
              oninput="document.getElementById('fp-col2-bg').style.background=this.value;window._framesPreview()" />
          </div>
        </div>

        <!-- CORNERS -->
        <div class="frames-section-title">corners</div>
        <div class="frames-chip-row" id="fp-corner-chips">
          <button class="frames-chip active" data-corner="diamond" onclick="window._framesSelectCorner(this,'diamond')">◆ diamond</button>
          <button class="frames-chip"        data-corner="bracket" onclick="window._framesSelectCorner(this,'bracket')">⌐ bracket</button>
          <button class="frames-chip"        data-corner="dot"     onclick="window._framesSelectCorner(this,'dot')">● dot</button>
          <button class="frames-chip"        data-corner="none"    onclick="window._framesSelectCorner(this,'none')">none</button>
        </div>

        <!-- GLOW -->
        <div class="frames-row" style="margin-top:12px">
          <label class="frames-label" style="margin-bottom:0">outer glow</label>
          <div class="s-toggle" id="fp-glow-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
        </div>

        <!-- SAVE SVG BUTTON -->
        <button class="frames-save-btn" id="fp-save-btn" onclick="window._framesSaveCurrent()">
          ✦ save frame
        </button>

        <!-- IMPORT PNG SECTION -->
        <div class="frames-section-title" style="margin-top:20px">import PNG frame</div>
        <div class="frames-import-hint">
          Upload a transparent PNG (max 1024×768 / 2MB). The transparent area becomes the content window.
        </div>
        <button class="frames-import-btn" onclick="document.getElementById('fp-png-input').click()">
          ↑ import PNG
        </button>
        <input type="file" id="fp-png-input" accept="image/png" style="display:none"
          onchange="window._framesImportPNG(this)" />
      </div>

      <!-- ── LIBRARY TAB ── -->
      <div class="frames-pane" id="fpane-library">
        <div id="fp-lib-grid" class="fp-lib-grid">
          <!-- populated by _framesRenderLibrary() -->
        </div>
      </div>

    </div>
  `;

  // ── MODULE-LEVEL STATE ──
  let _cornerStyle = 'diamond';

  // Expose tab switcher globally (called from inline onclick)
  window._framesSwitchTab = function(tab) {
    document.querySelectorAll('.frames-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.frames-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('ftab-' + tab).classList.add('active');
    document.getElementById('fpane-' + tab).classList.add('active');
    if (tab === 'library') _framesRenderLibrary();
  };

  // Expose corner selector globally
  window._framesSelectCorner = function(el, val) {
    document.querySelectorAll('#fp-corner-chips .frames-chip')
      .forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    _cornerStyle = val;
    window._framesPreview();
  };

  // Build SVG from current controls
  function _buildSVG() {
    const inset  = parseInt(document.getElementById('fp-inset').value)  || 14;
    const radius = parseInt(document.getElementById('fp-radius').value) || 10;
    const thick  = parseInt(document.getElementById('fp-bthick').value) || 3;
    const col1   = document.getElementById('fp-col1').value             || '#00F6D6';
    const col2   = document.getElementById('fp-col2').value             || '#FF4BCB';
    const glow   = document.getElementById('fp-glow-toggle')?.classList.contains('on');
    const corner = _cornerStyle;

    // Outer rect dimensions (400×560 canonical)
    const W = 400, H = 560;
    const x = inset, y = inset;
    const w = W - inset * 2, h = H - inset * 2;
    const cs = 8; // corner symbol size

    // Corner decorations
    let cornerSVG = '';
    if (corner === 'diamond') {
      // Four diamonds at corners of the inner rect
      const pts = [
        [x, y], [x + w, y], [x, y + h], [x + w, y + h]
      ];
      pts.forEach(([cx, cy]) => {
        cornerSVG += `<polygon points="${cx},${cy-cs} ${cx+cs},${cy} ${cx},${cy+cs} ${cx-cs},${cy}" fill="${col1}" opacity="0.9"/>`;
      });
    } else if (corner === 'bracket') {
      const arm = 20;
      // TL
      cornerSVG += `<path d="M${x},${y+arm} L${x},${y} L${x+arm},${y}" fill="none" stroke="${col1}" stroke-width="${thick}" stroke-linecap="round"/>`;
      // TR
      cornerSVG += `<path d="M${x+w-arm},${y} L${x+w},${y} L${x+w},${y+arm}" fill="none" stroke="${col1}" stroke-width="${thick}" stroke-linecap="round"/>`;
      // BL
      cornerSVG += `<path d="M${x},${y+h-arm} L${x},${y+h} L${x+arm},${y+h}" fill="none" stroke="${col2}" stroke-width="${thick}" stroke-linecap="round"/>`;
      // BR
      cornerSVG += `<path d="M${x+w-arm},${y+h} L${x+w},${y+h} L${x+w},${y+h-arm}" fill="none" stroke="${col2}" stroke-width="${thick}" stroke-linecap="round"/>`;
    } else if (corner === 'dot') {
      const dots = [[x,y,col1],[x+w,y,col1],[x,y+h,col2],[x+w,y+h,col2]];
      dots.forEach(([cx,cy,c]) => {
        cornerSVG += `<circle cx="${cx}" cy="${cy}" r="${cs*0.7}" fill="${c}" opacity="0.9"/>`;
      });
    }

    // Glow filter
    const filterDef = glow
      ? `<filter id="fp-glow"><feGaussianBlur stdDeviation="4" result="blur"/>
         <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
      : '';
    const filterAttr = glow ? 'filter="url(#fp-glow)"' : '';

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <linearGradient id="fp-g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${col1}"/>
      <stop offset="100%" stop-color="${col2}"/>
    </linearGradient>
    ${filterDef}
  </defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ry="${radius}"
    fill="none" stroke="url(#fp-g1)" stroke-width="${thick}" ${filterAttr}/>
  ${cornerSVG}
</svg>`;
  }

  // Preview: inject SVG into the preview frame div
  window._framesPreview = function() {
    const previewEl = document.getElementById('fp-preview-frame');
    if (!previewEl) return;
    const svg = _buildSVG();
    previewEl.innerHTML = svg;
    const svgEl = previewEl.querySelector('svg');
    if (svgEl) svgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  };

  // Initial preview render
  window._framesPreview();

  // Save current SVG frame
  window._framesSaveCurrent = async function() {
    const nameEl = document.getElementById('fp-name');
    const name   = nameEl?.value.trim() || 'My Frame';
    const svg    = _buildSVG();
    const frame  = {
      id:             null,
      name,
      creator:        'user',
      type:           'svg',
      svgData:        svg,
      compatibleWith: ['all'],
      thumbnail:      null,
      createdAt:      0
    };
    const saved = await saveFrame(frame);
    // Flash success
    const btn = document.getElementById('fp-save-btn');
    if (btn) { btn.textContent = '✓ saved!'; setTimeout(() => btn.textContent = '✦ save frame', 1800); }
    // Clear name
    if (nameEl) nameEl.value = '';
  };

  // Import PNG handler
  window._framesImportPNG = async function(input) {
    const file = input?.files?.[0];
    if (!file) return;
    // Size guard: 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('PNG must be under 2MB');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async e => {
      // Dimension guard via Image element
      const img = new Image();
      img.onload = async () => {
        if (img.width > 1024 || img.height > 768) {
          alert('PNG max size is 1024×768');
          return;
        }
        const frame = {
          id:             null,
          name:           file.name.replace(/\.[^.]+$/, ''),
          creator:        'user',
          type:           'png',
          pngData:        e.target.result,
          compatibleWith: ['all'],
          thumbnail:      null,
          createdAt:      0
        };
        await saveFrame(frame);
        // Switch to library to see it
        window._framesSwitchTab('library');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  // Render the library grid
  async function _framesRenderLibrary() {
    const grid = document.getElementById('fp-lib-grid');
    if (!grid) return;
    const frames = await getAllFrames();

    if (!frames.length) {
      grid.innerHTML = `<div class="frames-empty">No frames yet. Make one in the ✦ Make tab.</div>`;
      return;
    }

    grid.innerHTML = '';
    frames.forEach(frame => {
      const card = document.createElement('div');
      card.className = 'fp-lib-card';

      const thumb = document.createElement('div');
      thumb.className = 'fp-lib-thumb';

      if (frame.thumbnail) {
        const img = document.createElement('img');
        img.src = frame.thumbnail;
        img.alt = frame.name;
        thumb.appendChild(img);
      } else if (frame.type === 'svg') {
        thumb.innerHTML = frame.svgData;
        const svg = thumb.querySelector('svg');
        if (svg) svg.style.cssText = 'width:100%;height:100%';
      }

      const nameEl = document.createElement('div');
      nameEl.className   = 'fp-lib-name';
      nameEl.textContent = frame.name;

      // Delete button (not for builtins)
      const delBtn = document.createElement('button');
      delBtn.className   = 'fp-lib-del';
      delBtn.textContent = '✕';
      delBtn.style.display = frame.creator === 'builtin' ? 'none' : '';
      delBtn.addEventListener('click', async e => {
        e.stopPropagation();
        await deleteFrame(frame.id);
        _framesRenderLibrary();
      });

      card.appendChild(thumb);
      card.appendChild(nameEl);
      card.appendChild(delBtn);
      grid.appendChild(card);
    });
  }
}

// ── CSS INJECTION ─────────────────────────────────────────────────────────────
function _injectStyles() {
  if (document.getElementById('frames-styles')) return;
  const s = document.createElement('style');
  s.id = 'frames-styles';
  s.textContent = `
    /* ── FRAMES VIEW SHELL ── */
    #view-frames { overflow-y:auto; -webkit-overflow-scrolling:touch; }
    #frames-inner { padding:12px 16px calc(80px + var(--safe-bot,0px)); display:flex; flex-direction:column; gap:14px; }

    /* ── TABS ── */
    .frames-tabs { display:flex; gap:0; border-bottom:1px solid var(--border); flex-shrink:0; }
    .frames-tab {
      flex:1; padding:12px 8px; background:none; border:none;
      border-bottom:2px solid transparent; color:var(--subtext);
      font-family:var(--font-ui); font-size:0.72rem; letter-spacing:0.08em;
      cursor:pointer; transition:all 0.2s; margin-bottom:-1px;
    }
    .frames-tab.active { color:var(--teal); border-bottom-color:var(--teal); }

    /* ── PANES ── */
    .frames-pane { display:none; flex-direction:column; gap:12px; padding-top:14px; }
    .frames-pane.active { display:flex; }

    /* ── PREVIEW ── */
    .frames-preview-wrap {
      position:relative; width:100%; aspect-ratio:5/7; max-height:260px;
      margin:0 auto; border-radius:10px; overflow:hidden;
      background:var(--surface); border:1px solid var(--border);
    }
    .frames-preview-bg {
      position:absolute; inset:0; display:flex;
      align-items:center; justify-content:center;
    }
    #fp-preview-placeholder {
      font-size:3rem; opacity:0.12; pointer-events:none;
    }
    .frames-preview-frame {
      position:absolute; inset:0; pointer-events:none;
    }
    .frames-preview-frame svg { position:absolute; inset:0; width:100%; height:100%; }

    /* ── FIELDS ── */
    .frames-field { display:flex; flex-direction:column; gap:4px; flex:1; }
    .frames-label { font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--subtext); }
    .frames-input[type=text], .frames-input[type=number] {
      background:var(--surface); border:1px solid var(--border); border-radius:8px;
      padding:9px 12px; color:var(--text); font-family:var(--font-ui);
      font-size:0.78rem; outline:none; width:100%; transition:border-color 0.2s;
    }
    .frames-input[type=text]:focus { border-color:var(--teal); }
    .frames-input[type=range] { width:100%; accent-color:var(--teal); }
    .frames-row { display:flex; align-items:center; gap:12px; }
    .frames-val { font-size:0.68rem; color:var(--teal); width:28px; text-align:right; flex-shrink:0; }

    /* ── SECTION TITLE ── */
    .frames-section-title {
      font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase;
      color:var(--subtext); display:flex; align-items:center; gap:8px;
    }
    .frames-section-title::after { content:''; flex:1; height:1px; background:var(--border); }

    /* ── CHIPS ── */
    .frames-chip-row { display:flex; gap:8px; flex-wrap:wrap; }
    .frames-chip {
      padding:6px 12px; background:var(--surface); border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-family:var(--font-ui);
      font-size:0.68rem; letter-spacing:0.06em; cursor:pointer; transition:all 0.15s;
    }
    .frames-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }

    /* ── SWATCH ── */
    .frames-swatch {
      width:32px; height:32px; border-radius:8px;
      border:2px solid var(--border); cursor:pointer;
      overflow:hidden; position:relative; flex-shrink:0;
    }
    .frames-swatch-bg { width:100%; height:100%; border-radius:6px; }
    .frames-swatch input[type=color] {
      position:absolute; inset:-4px; width:calc(100%+8px);
      height:calc(100%+8px); border:none; cursor:pointer; opacity:0;
    }

    /* ── TOGGLE (reuse .s-toggle from main CSS) ── */

    /* ── BUTTONS ── */
    .frames-save-btn {
      width:100%; padding:13px;
      background:linear-gradient(135deg,var(--teal),var(--purple,#7B5FFF));
      border:none; border-radius:12px; color:#0a0a0f;
      font-family:var(--font-display); font-weight:700;
      font-size:0.88rem; cursor:pointer; letter-spacing:0.04em;
      transition:opacity 0.2s;
    }
    .frames-save-btn:hover { opacity:0.88; }
    .frames-import-hint {
      font-size:0.68rem; color:var(--subtext); line-height:1.5;
    }
    .frames-import-btn {
      width:100%; padding:11px; background:transparent;
      border:1px solid var(--border); border-radius:10px; color:var(--subtext);
      font-family:var(--font-ui); font-size:0.78rem; cursor:pointer;
      letter-spacing:0.04em; transition:all 0.2s;
    }
    .frames-import-btn:hover { border-color:var(--teal); color:var(--teal); }

    /* ── LIBRARY GRID ── */
    .fp-lib-grid {
      display:grid; grid-template-columns:repeat(3,1fr); gap:10px;
    }
    .fp-lib-card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:10px; overflow:hidden; cursor:pointer;
      transition:border-color 0.2s, transform 0.15s; position:relative;
    }
    .fp-lib-card:hover { border-color:var(--teal); transform:translateY(-2px); }
    .fp-lib-thumb {
      width:100%; aspect-ratio:5/7;
      background:var(--muted,#1a1a2e);
      overflow:hidden; position:relative;
      display:flex; align-items:center; justify-content:center;
    }
    .fp-lib-thumb img  { width:100%; height:100%; object-fit:cover; }
    .fp-lib-thumb svg  { width:100%; height:100%; }
    .fp-lib-name {
      font-size:0.6rem; letter-spacing:0.08em; text-align:center;
      padding:5px 4px 2px; color:var(--subtext);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .fp-lib-del {
      position:absolute; top:4px; right:4px;
      background:rgba(0,0,0,0.5); border:none;
      border-radius:50%; width:18px; height:18px;
      color:var(--subtext); font-size:0.5rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:color 0.2s; line-height:1; padding:0;
    }
    .fp-lib-del:hover { color:var(--pink,#FF4BCB); }
    .frames-empty {
      grid-column:1/-1; text-align:center; padding:40px 20px;
      color:var(--subtext); font-size:0.78rem; line-height:1.7;
    }
  `;
  document.head.appendChild(s);
}

// ── EXPOSE PUBLIC API ON WINDOW ───────────────────────────────────────────────
// So other modules can call window.openFramePicker / window.applyFrame without imports
window.openFramePicker = openFramePicker;
window.applyFrame      = applyFrame;
window.bakeFrameToPNG  = bakeFrameToPNG;
