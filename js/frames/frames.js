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

  // Render shell — full comic frame builder
  view.innerHTML = `
    <div id="frames-inner">
      <div class="frames-tabs">
        <button class="frames-tab active" id="ftab-make"    onclick="window._framesSwitchTab('make')">✦ make</button>
        <button class="frames-tab"        id="ftab-library" onclick="window._framesSwitchTab('library')">▣ my frames</button>
      </div>

      <!-- ── MAKE TAB ── -->
      <div class="frames-pane active" id="fpane-make">

        <!-- STICKY PREVIEW (outside scroll) -->
        <div class="frames-preview-wrap">
          <div class="frames-preview-bg">
            <div id="fp-preview-placeholder" style="font-size:3rem;opacity:0.1;pointer-events:none">◈</div>
          </div>
          <div class="frames-preview-frame" id="fp-preview-frame"></div>
        </div>

        <!-- SCROLLABLE CONTROLS -->
        <div class="frames-controls-scroll">

        <!-- NAME -->
        <div class="frames-field">
          <label class="frames-label">frame name</label>
          <input class="frames-input" type="text" id="fp-name" placeholder="my comic frame" />
        </div>

        <!-- ── OUTER STROKE ── -->
        <div class="frames-section-title">outer stroke</div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">thickness</label>
            <input class="frames-input" type="range" id="fp-out-thick" min="0" max="20" value="6"
              oninput="window._framesPreview();document.getElementById('fp-out-thick-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-out-thick-v">6</div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0">color</label>
          <div class="frames-swatch"><div class="frames-swatch-bg" id="fp-out-col-bg" style="background:#ffffff"></div>
            <input type="color" value="#ffffff" id="fp-out-col"
              oninput="document.getElementById('fp-out-col-bg').style.background=this.value;window._framesPreview()"/></div>
          <label class="frames-label" style="margin-bottom:0;margin-left:8px">opacity</label>
          <input class="frames-input" type="range" id="fp-out-op" min="0" max="100" value="100" style="width:80px"
            oninput="window._framesPreview();document.getElementById('fp-out-op-v').textContent=this.value"/>
          <div class="frames-val" id="fp-out-op-v">100</div>
        </div>

        <!-- ── BORDER FILL ── -->
        <div class="frames-section-title">border / fill</div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">width (each side)</label>
            <input class="frames-input" type="range" id="fp-border-w" min="4" max="60" value="18"
              oninput="window._framesPreview();document.getElementById('fp-border-w-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-border-w-v">18</div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0">fill color</label>
          <div class="frames-swatch"><div class="frames-swatch-bg" id="fp-fill-col-bg" style="background:#0a0a0f"></div>
            <input type="color" value="#0a0a0f" id="fp-fill-col"
              oninput="document.getElementById('fp-fill-col-bg').style.background=this.value;window._framesPreview()"/></div>
          <label class="frames-label" style="margin-bottom:0;margin-left:8px">opacity</label>
          <input class="frames-input" type="range" id="fp-fill-op" min="0" max="100" value="95" style="width:80px"
            oninput="window._framesPreview();document.getElementById('fp-fill-op-v').textContent=this.value"/>
          <div class="frames-val" id="fp-fill-op-v">95</div>
        </div>
        <!-- Per-side offsets -->
        <div class="frames-label" style="margin-top:6px">per-side offset</div>
        <div class="fp-4side">
          <div class="frames-row">
            <div class="frames-field"><label class="frames-label">top</label>
              <input class="frames-input" type="range" min="-60" max="200" value="0" id="fp-off-top"
                oninput="window._framesPreview();document.getElementById('fp-off-top-v').textContent=this.value"/></div>
            <div class="frames-val" id="fp-off-top-v">0</div>
          </div>
          <div class="frames-row">
            <div class="frames-field"><label class="frames-label">right</label>
              <input class="frames-input" type="range" min="-60" max="200" value="0" id="fp-off-right"
                oninput="window._framesPreview();document.getElementById('fp-off-right-v').textContent=this.value"/></div>
            <div class="frames-val" id="fp-off-right-v">0</div>
          </div>
          <div class="frames-row">
            <div class="frames-field"><label class="frames-label">bottom</label>
              <input class="frames-input" type="range" min="-60" max="200" value="0" id="fp-off-bottom"
                oninput="window._framesPreview();document.getElementById('fp-off-bottom-v').textContent=this.value"/></div>
            <div class="frames-val" id="fp-off-bottom-v">0</div>
          </div>
          <div class="frames-row">
            <div class="frames-field"><label class="frames-label">left</label>
              <input class="frames-input" type="range" min="-60" max="200" value="0" id="fp-off-left"
                oninput="window._framesPreview();document.getElementById('fp-off-left-v').textContent=this.value"/></div>
            <div class="frames-val" id="fp-off-left-v">0</div>
          </div>
        </div>

        <!-- ── INNER STROKE ── -->
        <div class="frames-section-title">inner stroke</div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">thickness</label>
            <input class="frames-input" type="range" id="fp-in-thick" min="0" max="12" value="2"
              oninput="window._framesPreview();document.getElementById('fp-in-thick-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-in-thick-v">2</div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0">color</label>
          <div class="frames-swatch"><div class="frames-swatch-bg" id="fp-in-col-bg" style="background:#00F6D6"></div>
            <input type="color" value="#00F6D6" id="fp-in-col"
              oninput="document.getElementById('fp-in-col-bg').style.background=this.value;window._framesPreview()"/></div>
          <label class="frames-label" style="margin-bottom:0;margin-left:8px">accent</label>
          <div class="frames-swatch"><div class="frames-swatch-bg" id="fp-acc-col-bg" style="background:#FF4BCB"></div>
            <input type="color" value="#FF4BCB" id="fp-acc-col"
              oninput="document.getElementById('fp-acc-col-bg').style.background=this.value;window._framesPreview()"/></div>
        </div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">inner inset gap</label>
            <input class="frames-input" type="range" id="fp-in-gap" min="2" max="20" value="4"
              oninput="window._framesPreview();document.getElementById('fp-in-gap-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-in-gap-v">4</div>
        </div>

        <!-- ── SHAPE ── -->
        <div class="frames-section-title">shape</div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">corner radius</label>
            <input class="frames-input" type="range" id="fp-radius" min="0" max="32" value="0"
              oninput="window._framesPreview();document.getElementById('fp-radius-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-radius-v">0</div>
        </div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">skew X (deg)</label>
            <input class="frames-input" type="range" id="fp-skew-x" min="-15" max="15" value="0"
              oninput="window._framesPreview();document.getElementById('fp-skew-x-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-skew-x-v">0</div>
        </div>
        <div class="frames-row">
          <div class="frames-field"><label class="frames-label">skew Y (deg)</label>
            <input class="frames-input" type="range" id="fp-skew-y" min="-15" max="15" value="0"
              oninput="window._framesPreview();document.getElementById('fp-skew-y-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-skew-y-v">0</div>
        </div>

        <!-- ── CORNERS ── -->
        <div class="frames-section-title">corner style</div>
        <div class="frames-chip-row" id="fp-corner-chips">
          <button class="frames-chip active" data-corner="bracket"  onclick="window._framesSelectCorner(this,'bracket')">⌐ bracket</button>
          <button class="frames-chip"        data-corner="diamond"  onclick="window._framesSelectCorner(this,'diamond')">◆ diamond</button>
          <button class="frames-chip"        data-corner="dot"      onclick="window._framesSelectCorner(this,'dot')">● dot</button>
          <button class="frames-chip"        data-corner="rivet"    onclick="window._framesSelectCorner(this,'rivet')">⊙ rivet</button>
          <button class="frames-chip"        data-corner="slash"    onclick="window._framesSelectCorner(this,'slash')">/ slash</button>
          <button class="frames-chip"        data-corner="none"     onclick="window._framesSelectCorner(this,'none')">none</button>
        </div>
        <div class="frames-row" style="margin-top:8px">
          <div class="frames-field"><label class="frames-label">corner arm length</label>
            <input class="frames-input" type="range" id="fp-corner-arm" min="8" max="60" value="24"
              oninput="window._framesPreview();document.getElementById('fp-corner-arm-v').textContent=this.value"/></div>
          <div class="frames-val" id="fp-corner-arm-v">24</div>
        </div>

        <!-- ── FX ── -->
        <div class="frames-section-title">fx</div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0;flex:1">outer glow</label>
          <div class="s-toggle" id="fp-glow-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0;flex:1">halftone dots</label>
          <div class="s-toggle" id="fp-halftone-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0;flex:1">scanlines</label>
          <div class="s-toggle" id="fp-scan-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0;flex:1">panel badge</label>
          <div class="s-toggle" id="fp-badge-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
          <input class="frames-input" type="text" id="fp-badge-text" value="01"
            style="width:48px;padding:4px 6px;margin-left:8px;text-align:center"
            oninput="window._framesPreview()" placeholder="01"/>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0;flex:1">speed lines</label>
          <div class="s-toggle" id="fp-speed-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
        </div>
        <div class="frames-row">
          <label class="frames-label" style="margin-bottom:0;flex:1">ripped edge</label>
          <div class="s-toggle" id="fp-rip-toggle" onclick="this.classList.toggle('on');window._framesPreview()"></div>
        </div>

        <!-- SAVE -->
        <button class="frames-save-btn" id="fp-save-btn" onclick="window._framesSaveCurrent()">✦ save frame</button>
        <button class="frames-reset-btn" onclick="window._framesReset()">↺ reset to defaults</button>

        <!-- IMPORT PNG -->
        <div class="frames-section-title" style="margin-top:4px">import PNG frame</div>
        <div class="frames-import-hint">Upload transparent PNG (max 1024×768 / 2MB).</div>
        <button class="frames-import-btn" onclick="document.getElementById('fp-png-input').click()">↑ import PNG</button>
        <input type="file" id="fp-png-input" accept="image/png" style="display:none" onchange="window._framesImportPNG(this)" />

        </div><!-- /frames-controls-scroll -->
      </div>

      <!-- ── LIBRARY TAB ── -->
      <div class="frames-pane" id="fpane-library">
        <div id="fp-lib-grid" class="fp-lib-grid"></div>
      </div>
    </div>
  `;

  // ── STATE ──
  let _cornerStyle = 'bracket';

  window._framesSwitchTab = function(tab) {
    document.querySelectorAll('.frames-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.frames-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('ftab-' + tab).classList.add('active');
    document.getElementById('fpane-' + tab).classList.add('active');
    if (tab === 'library') _framesRenderLibrary();
  };

  window._framesSelectCorner = function(el, val) {
    document.querySelectorAll('#fp-corner-chips .frames-chip').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    _cornerStyle = val;
    window._framesPreview();
  };

  // ── READ ALL CONTROLS ──
  function _ctrl(id) { return document.getElementById(id); }
  function _val(id, def) { const el = _ctrl(id); return el ? (el.type === 'range' || el.type === 'number' ? parseFloat(el.value) : el.value) : def; }
  function _on(id) { return _ctrl(id)?.classList.contains('on') ?? false; }

  // ── BUILD SVG ──
  function _buildSVG() {
    const W = 400, H = 560;

    // Border/fill widths per side (base + per-side offset)
    const bw   = _val('fp-border-w', 18);
    const oTop    = bw + _val('fp-off-top',    0);
    const oRight  = bw + _val('fp-off-right',  0);
    const oBottom = bw + _val('fp-off-bottom', 0);
    const oLeft   = bw + _val('fp-off-left',   0);

    // Inner window polygon (content hole) — four points with per-side offsets
    const wx0 = oLeft,        wy0 = oTop;
    const wx1 = W - oRight,   wy1 = oTop;
    const wx2 = W - oRight,   wy2 = H - oBottom;
    const wx3 = oLeft,        wy3 = H - oBottom;
    const ww = wx1 - wx0, wh = wy2 - wy0;

    // Stroke values
    const outThick = _val('fp-out-thick', 6);
    const outCol   = _val('fp-out-col', '#ffffff');
    const outOp    = _val('fp-out-op', 100) / 100;
    const fillCol  = _val('fp-fill-col', '#0a0a0f');
    const fillOp   = _val('fp-fill-op', 95) / 100;
    const inThick  = _val('fp-in-thick', 2);
    const inCol    = _val('fp-in-col', '#00F6D6');
    const accCol   = _val('fp-acc-col', '#FF4BCB');
    const inGap    = _val('fp-in-gap', 4);
    const radius   = _val('fp-radius', 0);
    const skewX    = _val('fp-skew-x', 0);
    const skewY    = _val('fp-skew-y', 0);
    const cornerArm = _val('fp-corner-arm', 24);
    const corner   = _cornerStyle;
    const glow     = _on('fp-glow-toggle');
    const halftone = _on('fp-halftone-toggle');
    const scanlines= _on('fp-scan-toggle');
    const badge    = _on('fp-badge-toggle');
    const badgeTxt = _val('fp-badge-text', '01') || '01';
    const speed    = _on('fp-speed-toggle');
    const rip      = _on('fp-rip-toggle');

    // Skew transform on the whole frame group
    const skewTransform = (skewX !== 0 || skewY !== 0)
      ? `transform="skewX(${skewX}) skewY(${skewY})"`
      : '';

    // The "frame body" polygon — full canvas minus the window hole
    // Rendered as a path with even-odd fill rule (hole in middle)
    const windowPath = radius > 0
      ? `M${wx0+radius},${wy0} L${wx1-radius},${wy0} Q${wx1},${wy0} ${wx1},${wy0+radius} L${wx1},${wy2-radius} Q${wx1},${wy2} ${wx1-radius},${wy2} L${wx0+radius},${wy2} Q${wx0},${wy2} ${wx0},${wy2-radius} L${wx0},${wy0+radius} Q${wx0},${wy0} ${wx0+radius},${wy0} Z`
      : `M${wx0},${wy0} L${wx1},${wy1} L${wx2},${wy2} L${wx3},${wy3} Z`;

    const outerPath = `M0,0 L${W},0 L${W},${H} L0,${H} Z`;

    // Fill rect (border area) using clip-path / even-odd rule
    const fillPath = `<path d="${outerPath} ${windowPath}" fill="${fillCol}" fill-opacity="${fillOp}" fill-rule="evenodd"/>`;

    // Outer stroke — strokes the outer boundary
    const outStrokeSVG = outThick > 0
      ? `<rect x="${outThick/2}" y="${outThick/2}" width="${W-outThick}" height="${H-outThick}" rx="${radius+outThick/2}" ry="${radius+outThick/2}" fill="none" stroke="${outCol}" stroke-opacity="${outOp}" stroke-width="${outThick}"/>`
      : '';

    // Inner stroke — strokes the window edge
    const inStrokeSVG = inThick > 0 ? (() => {
      const ix0 = wx0 - inGap, iy0 = wy0 - inGap;
      const iw  = ww + inGap*2, ih = wh + inGap*2;
      const ir  = Math.max(0, radius - 1);
      return `<rect x="${ix0}" y="${iy0}" width="${iw}" height="${ih}" rx="${ir}" ry="${ir}" fill="none" stroke="url(#fp-grad-in)" stroke-width="${inThick}"/>`;
    })() : '';

    // Corner decorations
    let cornerSVG = '';
    const cx0 = wx0, cy0 = wy0, cx1 = wx1, cy1 = wy1, cx2 = wx2, cy2 = wy2, cx3 = wx3, cy3 = wy3;
    const arm = cornerArm;
    if (corner === 'bracket') {
      cornerSVG = `
        <path d="M${cx0},${cy0+arm} L${cx0},${cy0} L${cx0+arm},${cy0}" fill="none" stroke="${inCol}" stroke-width="3" stroke-linecap="square"/>
        <path d="M${cx1-arm},${cy1} L${cx1},${cy1} L${cx1},${cy1+arm}" fill="none" stroke="${inCol}" stroke-width="3" stroke-linecap="square"/>
        <path d="M${cx3},${cy3-arm} L${cx3},${cy3} L${cx3+arm},${cy3}" fill="none" stroke="${accCol}" stroke-width="3" stroke-linecap="square"/>
        <path d="M${cx2-arm},${cy2} L${cx2},${cy2} L${cx2},${cy2-arm}" fill="none" stroke="${accCol}" stroke-width="3" stroke-linecap="square"/>`;
    } else if (corner === 'diamond') {
      const cs = 7;
      [[cx0,cy0,inCol],[cx1,cy1,inCol],[cx3,cy3,accCol],[cx2,cy2,accCol]].forEach(([px,py,c]) => {
        cornerSVG += `<polygon points="${px},${py-cs} ${px+cs},${py} ${px},${py+cs} ${px-cs},${py}" fill="${c}"/>`;
      });
    } else if (corner === 'dot') {
      [[cx0,cy0,inCol],[cx1,cy1,inCol],[cx3,cy3,accCol],[cx2,cy2,accCol]].forEach(([px,py,c]) => {
        cornerSVG += `<circle cx="${px}" cy="${py}" r="5" fill="${c}"/>`;
      });
    } else if (corner === 'rivet') {
      [[cx0,cy0,inCol],[cx1,cy1,inCol],[cx3,cy3,accCol],[cx2,cy2,accCol]].forEach(([px,py,c]) => {
        cornerSVG += `<circle cx="${px}" cy="${py}" r="7" fill="none" stroke="${c}" stroke-width="2"/>
                      <circle cx="${px}" cy="${py}" r="3" fill="${c}"/>`;
      });
    } else if (corner === 'slash') {
      [[cx0,cy0,inCol],[cx1,cy1,inCol],[cx3,cy3,accCol],[cx2,cy2,accCol]].forEach(([px,py,c]) => {
        cornerSVG += `<line x1="${px-arm*0.6}" y1="${py+arm*0.6}" x2="${px+arm*0.6}" y2="${py-arm*0.6}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
      });
    }

    // Halftone pattern in border area
    const halftoneDef = halftone ? `
      <pattern id="fp-ht" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1.5" fill="${inCol}" opacity="0.25"/>
      </pattern>` : '';
    const halftoneLayer = halftone
      ? `<path d="${outerPath} ${windowPath}" fill="url(#fp-ht)" fill-rule="evenodd"/>`
      : '';

    // Scanlines pattern in border area
    const scanDef = scanlines ? `
      <pattern id="fp-scan" x="0" y="0" width="1" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="400" y2="0" stroke="${inCol}" stroke-width="0.5" opacity="0.15"/>
      </pattern>` : '';
    const scanLayer = scanlines
      ? `<path d="${outerPath} ${windowPath}" fill="url(#fp-scan)" fill-rule="evenodd"/>`
      : '';

    // Speed lines in corners (emanating from top-right)
    let speedSVG = '';
    if (speed) {
      const cx = W, cy = 0;
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI / 2) + (i / 12) * (Math.PI * 0.7);
        const len = 80 + (i % 3) * 30;
        const ex = cx + Math.cos(angle) * len;
        const ey = cy + Math.sin(angle) * len;
        speedSVG += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${inCol}" stroke-width="${1 + (i%2)*0.5}" opacity="0.3" stroke-linecap="round"/>`;
      }
    }

    // Ripped edge along top
    let ripSVG = '';
    if (rip) {
      let d = `M0,${oTop} `;
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const px = (W / steps) * i;
        const py = oTop + (Math.sin(i * 2.3) * 3) + (Math.cos(i * 5.1) * 2);
        d += `L${px.toFixed(1)},${py.toFixed(1)} `;
      }
      d += `L${W},0 L0,0 Z`;
      ripSVG = `<path d="${d}" fill="${fillCol}" fill-opacity="${fillOp}"/>`;
    }

    // Panel badge (bottom-left corner of border area)
    let badgeSVG = '';
    if (badge) {
      const bx = oLeft + 4, by = H - oBottom + 3;
      badgeSVG = `
        <rect x="${bx-2}" y="${by}" width="${badgeTxt.length * 10 + 10}" height="18" rx="2" fill="${inCol}" opacity="0.9"/>
        <text x="${bx+3}" y="${by+13}" font-family="monospace" font-size="11" font-weight="700" fill="#0a0a0f">${badgeTxt}</text>`;
    }

    // Glow filter
    const glowDef = glow
      ? `<filter id="fp-glow-f" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
           <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
         </filter>`
      : '';
    const glowAttr = glow ? 'filter="url(#fp-glow-f)"' : '';

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <linearGradient id="fp-grad-in" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${inCol}"/>
      <stop offset="100%" stop-color="${accCol}"/>
    </linearGradient>
    ${halftoneDef}${scanDef}${glowDef}
  </defs>
  <g ${skewTransform} ${glowAttr}>
    ${fillPath}
    ${halftoneLayer}
    ${scanLayer}
    ${speedSVG}
    ${outStrokeSVG}
    ${inStrokeSVG}
    ${cornerSVG}
    ${ripSVG}
    ${badgeSVG}
  </g>
</svg>`;
  }

  window._framesPreview = function() {
    const el = document.getElementById('fp-preview-frame');
    if (!el) return;
    el.innerHTML = _buildSVG();
    const svg = el.querySelector('svg');
    if (svg) svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  };
  window._framesPreview();

  window._framesSaveCurrent = async function() {
    const nameEl = document.getElementById('fp-name');
    const name   = nameEl?.value.trim() || 'My Frame';
    const frame  = { id:null, name, creator:'user', type:'svg', svgData:_buildSVG(), compatibleWith:['all'], thumbnail:null, createdAt:0 };
    await saveFrame(frame);
    const btn = document.getElementById('fp-save-btn');
    if (btn) { btn.textContent = '✓ saved!'; setTimeout(() => btn.textContent = '✦ save frame', 1800); }
    if (nameEl) nameEl.value = '';
  };

  window._framesImportPNG = async function(input) {
    const file = input?.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('PNG must be under 2MB'); input.value=''; return; }
    const reader = new FileReader();
    reader.onload = async e => {
      const img = new Image();
      img.onload = async () => {
        if (img.width > 1024 || img.height > 768) { alert('PNG max size is 1024x768'); return; }
        const frame = { id:null, name:file.name.replace(/\.[^.]+$/,''), creator:'user', type:'png', pngData:e.target.result, compatibleWith:['all'], thumbnail:null, createdAt:0 };
        await saveFrame(frame);
        window._framesSwitchTab('library');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  async function _framesRenderLibrary() {
    const grid = document.getElementById('fp-lib-grid');
    if (!grid) return;
    const frames = await getAllFrames();
    if (!frames.length) { grid.innerHTML = `<div class="frames-empty">No frames yet.</div>`; return; }
    grid.innerHTML = '';
    frames.forEach(frame => {
      const card = document.createElement('div');
      card.className = 'fp-lib-card';
      const thumb = document.createElement('div');
      thumb.className = 'fp-lib-thumb';
      if (frame.thumbnail) {
        const img = document.createElement('img'); img.src=frame.thumbnail; img.alt=frame.name; thumb.appendChild(img);
      } else if (frame.type === 'svg') {
        thumb.innerHTML = frame.svgData;
        const svg = thumb.querySelector('svg');
        if (svg) svg.style.cssText = 'width:100%;height:100%';
      }
      const nameEl = document.createElement('div'); nameEl.className='fp-lib-name'; nameEl.textContent=frame.name;
      const delBtn = document.createElement('button'); delBtn.className='fp-lib-del'; delBtn.textContent='✕';
      delBtn.style.display = frame.creator==='builtin' ? 'none' : '';
      delBtn.addEventListener('click', async e => { e.stopPropagation(); await deleteFrame(frame.id); _framesRenderLibrary(); });
      card.appendChild(thumb); card.appendChild(nameEl); card.appendChild(delBtn);
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
    #view-frames { display:flex; flex-direction:column; overflow:hidden; }
    #frames-inner { display:flex; flex-direction:column; flex:1; min-height:0; gap:0; }

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
    .frames-pane { display:none; flex-direction:column; flex:1; min-height:0; }
    .frames-pane.active { display:flex; }

    /* ── CONTROLS SCROLL ── */
    .frames-controls-scroll {
      flex:1; min-height:0; overflow-y:auto; -webkit-overflow-scrolling:touch;
      padding:12px 16px calc(80px + var(--safe-bot,0px));
      display:flex; flex-direction:column; gap:12px;
    }

    /* ── LIBRARY PANE scroll ── */
    #fpane-library { overflow-y:auto; -webkit-overflow-scrolling:touch;
      padding:12px 16px calc(80px + var(--safe-bot,0px)); gap:12px; }

    /* ── PREVIEW — sticky at top, fixed height ── */
    .frames-preview-wrap {
      position:relative; width:100%; height:180px; flex-shrink:0;
      background:var(--surface); border-bottom:1px solid var(--border);
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
    .frames-reset-btn {
      width:100%; padding:11px; background:transparent;
      border:1px solid var(--border); border-radius:10px; color:var(--subtext);
      font-family:var(--font-ui); font-size:0.78rem; cursor:pointer;
      letter-spacing:0.04em; transition:all 0.2s; margin-top:-4px;
    }
    .frames-reset-btn:hover { border-color:var(--pink,#FF4BCB); color:var(--pink,#FF4BCB); }

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
// Safe stubs — real implementations assigned inside initFramesView on first visit
window._framesReset       = () => {};
window._framesPreview     = () => {};
window._framesSaveCurrent = async () => {};
window._framesSwitchTab   = () => {};
window._framesSelectCorner= () => {};
window._framesImportPNG   = () => {};
