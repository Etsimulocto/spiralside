// ============================================================
// SPIRALSIDE — SPIRALCUT v0.1
// Clip-based storyboard editor. Reads scene cards + character
// prints from IDB. Clips: scene card + char print + dialogue
// + mood + image + duration. Timeline = per-scene tracks.
// Nimbis anchor: js/app/views/cut.js
// ============================================================

// ── IDB HELPER ─────────────────────────────────────────────
function cutIDB(store, mode) {
  return new Promise((res, rej) => {
    const req = indexedDB.open('spiralside', 6);
    req.onsuccess = e => {
      const db = e.target.result;
      try { res(db.transaction(store, mode).objectStore(store)); }
      catch(err) { rej(err); }
    };
    req.onerror = () => rej(req.error);
  });
}

async function cutIDBGetAll(store) {
  const s = await cutIDB(store, 'readonly');
  return new Promise((res, rej) => {
    const req = s.getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror  = () => rej(req.error);
  });
}

async function cutIDBPut(store, val) {
  const s = await cutIDB(store, 'readwrite');
  return new Promise((res, rej) => {
    const req = s.put(val);
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

async function cutIDBGet(store, key) {
  const s = await cutIDB(store, 'readonly');
  return new Promise((res, rej) => {
    const req = s.get(key);
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

// ── CHARACTERS LOADER (Sky, Monday, Cold, Grit, You + prints) ─
let _cutCharacters = null;
async function getCutCharacters() {
  if (_cutCharacters) return _cutCharacters;
  try {
    const mod = await import('./state.js');
    _cutCharacters = mod.CHARACTERS || {};
  } catch(e) { _cutCharacters = {}; }
  return _cutCharacters;
}

// ── MODULE STATE ───────────────────────────────────────────
let _cutState = {
  scenes: [],
  selectedClip: null,
  binTab: 'scenes',
  sceneCards: [],
  worldCards: [],
  prints: [],
  pickerOpen: false,
  pickerSceneIdx: -1,
};

// ── SPEAKER COLOR MAP ──────────────────────────────────────
const CUT_COLORS = {
  sky:      'var(--teal)',
  monday:   'var(--pink)',
  cold:     'var(--blue)',
  grit:     'var(--yellow)',
  narrator: 'var(--subtext)',
  default:  'var(--purple)',
};
function speakerColor(name) {
  if (!name) return CUT_COLORS.default;
  return CUT_COLORS[name.toLowerCase()] || CUT_COLORS.default;
}

// ── PERSIST TO IDB ─────────────────────────────────────────
async function saveCutScenes() {
  try {
    await cutIDBPut('config', { key: 'cut_scenes', value: _cutState.scenes });
  } catch(e) { console.warn('[cut] save failed', e); }
}

async function loadCutScenes() {
  try {
    const rec = await cutIDBGet('config', 'cut_scenes');
    if (rec && rec.value) _cutState.scenes = rec.value;
  } catch(e) { /* first load */ }
  while (_cutState.scenes.length < 3) {
    _cutState.scenes.push({
      id: Date.now() + _cutState.scenes.length,
      name: `scene ${_cutState.scenes.length + 1}`,
      clips: [],
    });
  }
}

// ── LOAD ASSET BIN DATA ────────────────────────────────────
async function loadBinData() {
  try {
    // Studio saves scenes to 'scenes' store, worlds to 'worlds' store
    // Normalize fields: studio uses .image, .caption; cut expects .imageDataUrl, .dialogue
    const rawScenes = await cutIDBGetAll('scenes');
    _cutState.sceneCards = rawScenes.map(s => ({
      ...s,
      imageDataUrl: s.image || s.imageDataUrl || null,
      dialogue:     s.caption || s.dialogue || '',
    }));
    const rawWorlds = await cutIDBGetAll('worlds');
    _cutState.worldCards = rawWorlds;
    const rawPrints = await cutIDBGetAll('prints');
    const userPrints = rawPrints.map(p => ({
      ...p,
      name:  p.identity?.name  || p.name  || 'character',
      trait: p.identity?.title || p.trait || p.identity?.identity_line || '',
      image: p.portrait_base64 || p.image || null,
    }));
    // Also include built-in characters (Sky, Monday, Cold, Grit, You)
    const CHARS = await getCutCharacters();
    const builtInPrints = Object.entries(CHARS)
      .filter(([id, c]) => !c.isUser)
      .map(([id, c]) => ({
        id: 'builtin_' + id,
        name:  c.name,
        trait: c.trait || '',
        image: c.portrait_base64 || null,
        sourceCard: 'builtin_' + id,
        _isBuiltIn: true,
        _charData: c,
      }));
    _cutState.prints = [...builtInPrints, ...userPrints];
  } catch(e) {
    _cutState.sceneCards = [];
    _cutState.worldCards = [];
    _cutState.prints = [];
  }
}

// ── INJECT CSS ─────────────────────────────────────────────
function injectCutCSS() {
  const old = document.getElementById('cut-css');
  if (old) old.remove();
  const s = document.createElement('style');
  s.id = 'cut-css';
  s.textContent = `
    #view-cut.active {
      display: flex; flex-direction: column; overflow: hidden; position: relative;
    }
    .cut-hdr {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 14px; border-bottom: 1px solid var(--border);
      flex-shrink: 0; gap: 10px;
    }
    .cut-logo {
      font-family: var(--font-display); font-weight: 800; font-size: 1rem;
      color: var(--teal); letter-spacing: -0.02em; flex-shrink: 0;
    }
    .cut-logo span {
      font-size: 0.6rem; color: var(--subtext); border: 1px solid var(--border);
      padding: 1px 5px; border-radius: 3px; margin-left: 5px; font-family: var(--font-ui);
    }
    .cut-hdr-meta { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.06em; flex: 1; }
    .cut-export-btn {
      background: var(--teal); color: #0a0a0f; border: none;
      padding: 5px 12px; border-radius: 5px; font-family: var(--font-ui);
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
      cursor: pointer; flex-shrink: 0; transition: opacity 0.2s;
    }
    .cut-export-btn:hover { opacity: 0.85; }
    .cut-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
    .cut-sidebar {
      width: 168px; border-right: 1px solid var(--border);
      display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
    }
    .cut-bin-tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .cut-bin-tab {
      flex: 1; padding: 7px 2px; text-align: center; font-size: 0.6rem;
      letter-spacing: 0.06em; color: var(--subtext); cursor: pointer;
      border-bottom: 2px solid transparent; background: none;
      border-top: none; border-left: none; border-right: none;
      font-family: var(--font-ui); transition: color 0.15s;
    }
    .cut-bin-tab:hover { color: var(--text); }
    .cut-bin-tab.active { color: var(--teal); border-bottom-color: var(--teal); }
    .cut-bin-scroll { flex: 1; overflow-y: auto; padding: 6px 0; }
    .cut-scene-block { margin: 0 6px 8px; }
    .cut-scene-head {
      font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.1em;
      text-transform: uppercase; padding: 3px 4px 2px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .cut-scene-head-add {
      background: none; border: none; color: var(--subtext);
      font-size: 1rem; line-height: 1; cursor: pointer; padding: 0 2px;
      font-family: var(--font-ui); transition: color 0.15s;
    }
    .cut-scene-head-add:hover { color: var(--teal); }
    .cut-clip-row {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 6px; border-radius: 4px; cursor: pointer;
      transition: background 0.12s; margin-bottom: 2px;
    }
    .cut-clip-row:hover { background: var(--surface); }
    .cut-clip-row.active { background: var(--surface2); outline: 1px solid rgba(0,246,214,0.2); }
    .cut-clip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .cut-clip-info { flex: 1; min-width: 0; }
    .cut-clip-name {
      font-size: 0.65rem; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .cut-clip-dur { font-size: 0.58rem; color: var(--subtext); margin-top: 1px; }
    .cut-add-btn {
      margin: 2px 0 4px; padding: 5px;
      border: 1px dashed var(--border); border-radius: 4px;
      text-align: center; font-size: 0.62rem; color: var(--subtext);
      cursor: pointer; transition: all 0.15s; background: none;
      font-family: var(--font-ui); width: 100%;
    }
    .cut-add-btn:hover { border-color: var(--teal); color: var(--teal); }
    .cut-bin-empty {
      padding: 20px 10px; text-align: center;
      font-size: 0.62rem; color: var(--subtext); line-height: 1.8;
    }
    .cut-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .cut-preview {
      height: 160px; background: #080c12; position: relative;
      display: flex; align-items: flex-end; flex-shrink: 0; overflow: hidden;
    }
    .cut-preview-bg {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, #001a2a 0%, #0a1520 50%, var(--bg) 100%);
    }
    .cut-preview-bg.has-image { background-size: cover; background-position: center; }
    .cut-preview-tag {
      position: absolute; top: 8px; left: 10px; font-size: 0.6rem;
      letter-spacing: 0.1em; padding: 2px 7px; border-radius: 10px;
      background: rgba(0,0,0,0.65); z-index: 2;
    }
    .cut-preview-count {
      position: absolute; top: 8px; right: 10px; font-size: 0.6rem;
      color: var(--subtext); background: rgba(0,0,0,0.5);
      border: 1px solid var(--border); padding: 2px 7px;
      border-radius: 10px; z-index: 2;
    }
    .cut-preview-no-clip {
      position: relative; z-index: 2; display: flex; flex-direction: column;
      align-items: center; justify-content: center; width: 100%;
      gap: 6px; color: var(--subtext); font-size: 0.68rem;
      letter-spacing: 0.08em; opacity: 0.5;
    }
    .cut-preview-dialogue {
      position: relative; z-index: 2; margin: 0 10px 10px;
      background: rgba(8,12,18,0.94); border: 1px solid var(--teal);
      border-radius: 3px 10px 10px 10px; padding: 7px 10px; max-width: 240px;
    }
    .cut-preview-speaker {
      font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase;
      font-weight: 700; margin-bottom: 3px;
    }
    .cut-preview-text { font-size: 0.78rem; color: var(--text); line-height: 1.5; }
    .cut-detail {
      padding: 8px 12px; border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border); background: var(--bg); flex-shrink: 0;
    }
    .cut-detail-fields { display: flex; gap: 10px; margin-bottom: 7px; flex-wrap: wrap; }
    .cut-dfield { flex: 1; min-width: 60px; }
    .cut-dlabel {
      font-size: 0.55rem; color: var(--subtext); letter-spacing: 0.1em;
      text-transform: uppercase; margin-bottom: 2px;
    }
    .cut-dval { font-size: 0.72rem; color: var(--text); }
    .cut-dval.muted { color: var(--subtext); }
    .cut-action-row { display: flex; gap: 6px; }
    .cut-abtn {
      flex: 1; padding: 6px; background: var(--surface);
      border: 1px solid var(--border); border-radius: 4px;
      color: var(--subtext); font-family: var(--font-ui);
      font-size: 0.62rem; cursor: pointer; text-align: center;
      letter-spacing: 0.05em; transition: all 0.15s;
    }
    .cut-abtn:hover { border-color: var(--teal); color: var(--teal); }
    .cut-abtn.go { background: rgba(0,246,214,0.08); border-color: var(--teal); color: var(--teal); }
    .cut-abtn.danger:hover { border-color: var(--pink); color: var(--pink); }
    .cut-abtn.small { flex: 0 0 auto; padding: 6px 10px; }
    .cut-tl-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .cut-tl-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 5px 10px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .cut-tl-label { font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.14em; text-transform: uppercase; }
    .cut-tl-btns { display: flex; gap: 5px; }
    .cut-tl-btn {
      font-size: 0.6rem; color: var(--subtext); background: transparent;
      border: 1px solid var(--border); padding: 3px 8px; border-radius: 10px;
      cursor: pointer; font-family: var(--font-ui); letter-spacing: 0.05em; transition: all 0.15s;
    }
    .cut-tl-btn:hover { border-color: var(--subtext); color: var(--text); }
    .cut-tl-btn.accent { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.06); }
    .cut-tl-btn.accent:hover { background: rgba(0,246,214,0.12); }
    .cut-tl-body { flex: 1; overflow: auto; padding: 8px 10px 12px; background: #080c12; }
    .cut-ruler { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; }
    .cut-ruler-spacer { width: 30px; flex-shrink: 0; }
    .cut-ruler-ticks { flex: 1; display: flex; min-width: 360px; }
    .cut-tick {
      flex: 1; text-align: left; font-size: 0.55rem; color: var(--subtext);
      padding-left: 2px; border-left: 1px solid var(--border);
    }
    .cut-tracks { display: flex; flex-direction: column; gap: 6px; min-width: 360px; }
    .cut-track-row { display: flex; align-items: center; gap: 5px; }
    .cut-track-label {
      font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.08em;
      text-transform: uppercase; width: 30px; flex-shrink: 0; text-align: right;
    }
    .cut-track {
      flex: 1; height: 34px; background: var(--surface); border-radius: 4px;
      border: 1px solid var(--border); position: relative; overflow: hidden;
    }
    .cut-track.empty { border-style: dashed; opacity: 0.35; }
    .cut-tl-clip {
      position: absolute; top: 3px; bottom: 3px; border-radius: 3px;
      display: flex; align-items: center; padding: 0 6px;
      cursor: pointer; transition: opacity 0.15s;
      font-size: 0.58rem; white-space: nowrap; overflow: hidden;
    }
    .cut-tl-clip:hover { opacity: 0.82; }
    .cut-tl-clip.selected { outline: 1px solid rgba(255,255,255,0.4); }
    .cut-tl-clip-name { color: rgba(255,255,255,0.88); overflow: hidden; text-overflow: ellipsis; }
    .cut-tl-footer { font-size: 0.58rem; color: var(--subtext); padding: 5px 0 0; letter-spacing: 0.06em; opacity: 0.7; }
    .cut-picker-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.7);
      z-index: 50; display: flex; align-items: flex-end; justify-content: center;
    }
    .cut-picker-panel {
      width: 100%; max-width: 480px; background: var(--bg);
      border: 1px solid var(--border); border-bottom: none;
      border-radius: 20px 20px 0 0; max-height: 70dvh;
      display: flex; flex-direction: column; overflow: hidden;
      animation: cutPickerIn 0.3s cubic-bezier(0.32,0.72,0,1);
    }
    @keyframes cutPickerIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .cut-picker-handle { width: 36px; height: 4px; background: var(--border); border-radius: 2px; margin: 12px auto 0; }
    .cut-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 0; }
    .cut-picker-title { font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; }
    .cut-picker-close { background: none; border: none; color: var(--subtext); font-size: 1.1rem; cursor: pointer; padding: 4px; }
    .cut-picker-tabs {
      display: flex; padding: 10px 16px 0; gap: 4px;
      border-bottom: 1px solid var(--border); margin-top: 8px;
    }
    .cut-picker-tab {
      flex: 1; padding: 8px 4px; background: none; border: none;
      border-bottom: 2px solid transparent; color: var(--subtext);
      font-size: 0.68rem; cursor: pointer; letter-spacing: 0.06em;
      transition: all 0.15s; margin-bottom: -1px; font-family: var(--font-ui);
    }
    .cut-picker-tab.active { color: var(--teal); border-bottom-color: var(--teal); }
    .cut-picker-body { flex: 1; overflow-y: auto; padding: 12px 16px 30px; }
    .cut-picker-card {
      display: flex; align-items: center; gap: 10px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;
      cursor: pointer; transition: border-color 0.15s;
    }
    .cut-picker-card:hover { border-color: var(--teal); }
    .cut-picker-card-thumb {
      width: 38px; height: 38px; border-radius: 6px; background: var(--muted);
      flex-shrink: 0; overflow: hidden; display: flex; align-items: center;
      justify-content: center; font-size: 1rem; color: var(--subtext);
    }
    .cut-picker-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .cut-picker-card-info { flex: 1; min-width: 0; }
    .cut-picker-card-name { font-size: 0.78rem; color: var(--text); }
    .cut-picker-card-meta { font-size: 0.62rem; color: var(--subtext); margin-top: 2px; }
    .cut-picker-empty { text-align: center; padding: 30px 20px; font-size: 0.72rem; color: var(--subtext); line-height: 1.8; }
    .cut-blank-form { padding: 4px 0; }
    .cut-form-field { margin-bottom: 12px; }
    .cut-form-label { display: block; font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--subtext); margin-bottom: 5px; }
    .cut-form-input {
      width: 100%; background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 9px 12px; color: var(--text);
      font-family: var(--font-ui); font-size: 0.78rem; outline: none; transition: border-color 0.2s;
    }
    .cut-form-input:focus { border-color: var(--teal); }
    .cut-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .cut-form-save-btn {
      width: 100%; padding: 12px; background: linear-gradient(135deg, var(--teal), var(--purple));
      border: none; border-radius: 10px; color: #0a0a0f;
      font-family: var(--font-display); font-weight: 700; font-size: 0.88rem;
      cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s; margin-top: 4px;
    }
    .cut-form-save-btn:hover { opacity: 0.88; }
  `;
  document.head.appendChild(s);
}

// ── HELPERS ────────────────────────────────────────────────
function cutTotalSecs() {
  let total = 0;
  _cutState.scenes.forEach(sc => {
    const max = sc.clips.reduce((m, c) => Math.max(m, c.dur || 5), 0);
    total += max;
  });
  return total;
}

function cutClipCount() {
  return _cutState.scenes.reduce((n, sc) => n + sc.clips.length, 0);
}

// ── RENDER FULL VIEW ──────────────────────────────────────
function renderCutView() {
  const el = document.getElementById('view-cut');
  if (!el) return;
  const totalSecs = cutTotalSecs();
  const clipCount = cutClipCount();
  el.innerHTML = `
    <div class="cut-hdr">
      <div class="cut-logo">SpiralCut <span>v0.1</span></div>
      <div class="cut-hdr-meta">${clipCount} clips &middot; ${totalSecs}s</div>
      <button class="cut-export-btn" onclick="window._cutExport()">export</button>
    </div>
    <div class="cut-body">
      ${renderCutSidebar()}
      <div class="cut-main">
        ${renderCutPreview()}
        ${renderCutDetail()}
        ${renderCutTimeline()}
      </div>
    </div>
    ${renderCutPicker()}
  `;
  // wire bin tab buttons after DOM is written
  el.querySelectorAll('.cut-bin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _cutState.binTab = btn.dataset.tab;
      renderCutView();
    });
  });
}

// ── SIDEBAR ────────────────────────────────────────────────
function renderCutSidebar() {
  const { scenes, binTab, sceneCards, worldCards, prints } = _cutState;

  const scenesList = scenes.map((sc, si) => `
    <div class="cut-scene-block">
      <div class="cut-scene-head">
        <span>scene ${si + 1}</span>
        <button class="cut-scene-head-add" onclick="window._cutOpenPicker(${si})">+</button>
      </div>
      ${sc.clips.map((clip, ci) => {
        const isSel = _cutState.selectedClip &&
          _cutState.selectedClip.sceneIdx === si &&
          _cutState.selectedClip.clipIdx === ci;
        return `
          <div class="cut-clip-row ${isSel ? 'active' : ''}"
               onclick="window._cutSelectClip(${si},${ci})">
            <div class="cut-clip-dot" style="background:${speakerColor(clip.speaker)}"></div>
            <div class="cut-clip-info">
              <div class="cut-clip-name">${clip.name || 'untitled'}</div>
              <div class="cut-clip-dur">${clip.dur || 5}s &middot; ${clip.status || 'no image'}</div>
            </div>
          </div>`;
      }).join('')}
      <button class="cut-add-btn" onclick="window._cutOpenPicker(${si})">+ add clip</button>
    </div>
  `).join('');

  const worldsContent = worldCards.length
    ? worldCards.map(w => {
        const wid = String(w.id || w.name || '').replace(/'/g,'');
        return `
        <div class="cut-clip-row" style="padding:6px 8px;margin:2px 6px;cursor:pointer"
             onclick="window._cutAskAddWorld('${wid}')">
          <div class="cut-clip-info">
            <div class="cut-clip-name">${w.name || 'world'}</div>
            <div class="cut-clip-dur">${w.biome || ''} · tap to add</div>
          </div>
        </div>`;
      }).join('')
    : `<div class="cut-bin-empty">world cards<br>from Codex<br>appear here</div>`;

  const castContent = prints.length
    ? prints.map(p => {
        const pid = String(p.id || p.name || '').replace(/'/g,'');
        return `
        <div class="cut-clip-row" style="padding:6px 8px;margin:2px 6px;cursor:pointer"
             onclick="window._cutAskAddPrint('${pid}')">
          <div class="cut-clip-dot" style="background:${speakerColor(p.name)}"></div>
          <div class="cut-clip-info">
            <div class="cut-clip-name">${p.name || 'character'}</div>
            <div class="cut-clip-dur">${p.trait || ''} · tap to add</div>
          </div>
        </div>`;
      }).join('')
    : `<div class="cut-bin-empty">character prints<br>from Codex<br>appear here</div>`;

  return `
    <div class="cut-sidebar">
      <div class="cut-bin-tabs">
        <button class="cut-bin-tab ${binTab==='scenes'?'active':''}" data-tab="scenes">scenes</button>
        <button class="cut-bin-tab ${binTab==='worlds'?'active':''}" data-tab="worlds">worlds</button>
        <button class="cut-bin-tab ${binTab==='cast'?'active':''}" data-tab="cast">cast</button>
      </div>
      <div class="cut-bin-scroll">
        <div style="${binTab==='scenes'?'':'display:none'}">${scenesList}</div>
        <div style="${binTab==='worlds'?'':'display:none'}">${worldsContent}</div>
        <div style="${binTab==='cast'?'':'display:none'}">${castContent}</div>
      </div>
    </div>`;
}

// ── PREVIEW ────────────────────────────────────────────────
function renderCutPreview() {
  const sel = _cutState.selectedClip;
  const clipCount = cutClipCount();
  const totalSecs = cutTotalSecs();

  if (!sel) {
    return `
      <div class="cut-preview">
        <div class="cut-preview-bg"></div>
        <div class="cut-preview-count">${clipCount} clips</div>
        <div class="cut-preview-no-clip">
          <div style="font-size:1.4rem;opacity:0.3">&#9986;</div>
          no clip selected
        </div>
      </div>`;
  }

  const clip = sel.clip;
  const color = speakerColor(clip.speaker);
  const bgStyle = clip.imageDataUrl
    ? `background-image:url(${clip.imageDataUrl});background-size:cover;background-position:center;`
    : '';

  return `
    <div class="cut-preview">
      <div class="cut-preview-bg has-image" style="${bgStyle}"></div>
      <div class="cut-preview-tag" style="color:${color}">
        ${(clip.speaker || 'narrator').toLowerCase()} &middot; ${clip.name || 'clip'}
      </div>
      <div class="cut-preview-count">${clipCount} clips &middot; ${totalSecs}s</div>
      <div class="cut-preview-dialogue" style="border-color:${color}">
        <div class="cut-preview-speaker" style="color:${color}">${clip.speaker || 'narrator'}</div>
        <div class="cut-preview-text">${clip.dialogue || '&mdash;'}</div>
      </div>
    </div>`;
}

// ── DETAIL ─────────────────────────────────────────────────
function renderCutDetail() {
  const sel = _cutState.selectedClip;

  if (!sel) {
    return `
      <div class="cut-detail">
        <div class="cut-detail-fields">
          <div class="cut-dfield"><div class="cut-dlabel">name</div><div class="cut-dval muted">&mdash;</div></div>
          <div class="cut-dfield"><div class="cut-dlabel">speaker</div><div class="cut-dval muted">&mdash;</div></div>
          <div class="cut-dfield"><div class="cut-dlabel">mood</div><div class="cut-dval muted">&mdash;</div></div>
          <div class="cut-dfield"><div class="cut-dlabel">dur</div><div class="cut-dval muted">&mdash;</div></div>
          <div class="cut-dfield"><div class="cut-dlabel">status</div><div class="cut-dval muted">&mdash;</div></div>
        </div>
        <div class="cut-action-row">
          <button class="cut-abtn" disabled style="opacity:0.3">gen image</button>
          <button class="cut-abtn" disabled style="opacity:0.3">gen clip</button>
          <button class="cut-abtn" disabled style="opacity:0.3">&#8595; export</button>
        </div>
      </div>`;
  }

  const clip = sel.clip;
  const color = speakerColor(clip.speaker);
  const statusColor = clip.imageDataUrl ? 'var(--teal)' : 'var(--subtext)';

  return `
    <div class="cut-detail">
      <div class="cut-detail-fields">
        <div class="cut-dfield">
          <div class="cut-dlabel">name</div>
          <div class="cut-dval">${clip.name || '&mdash;'}</div>
        </div>
        <div class="cut-dfield">
          <div class="cut-dlabel">speaker</div>
          <div class="cut-dval" style="color:${color}">${clip.speaker || '&mdash;'}</div>
        </div>
        <div class="cut-dfield">
          <div class="cut-dlabel">mood</div>
          <div class="cut-dval">${clip.mood || '&mdash;'}</div>
        </div>
        <div class="cut-dfield">
          <div class="cut-dlabel">dur</div>
          <div class="cut-dval">${clip.dur || 5}s</div>
        </div>
        <div class="cut-dfield">
          <div class="cut-dlabel">status</div>
          <div class="cut-dval" style="color:${statusColor}">${clip.status || 'no image'}</div>
        </div>
      </div>
      <div class="cut-action-row">
        <button class="cut-abtn" onclick="window._cutGenImage()">gen image</button>
        <button class="cut-abtn go" onclick="window._cutGenClip()">gen clip</button>
        <button class="cut-abtn" onclick="window._cutExportClip()">&#8595; export</button>
        <button class="cut-abtn small danger" onclick="window._cutRemoveClip()" title="remove clip">&#10005;</button>
      </div>
    </div>`;
}

// ── TIMELINE ───────────────────────────────────────────────
function renderCutTimeline() {
  const { scenes } = _cutState;
  const totalSecs = cutTotalSecs() || 15;
  const MARKS = 6;
  const secPerMark = Math.ceil(totalSecs / MARKS);

  const rulerTicks = Array.from({length: MARKS}, (_, i) =>
    `<div class="cut-tick">${i * secPerMark}s</div>`
  ).join('');

  // Classify a clip: 0=cast, 1=scene, 2=world
  function clipType(clip) {
    if (_cutState.worldCards.some(w => String(w.id||w.name) === clip.sourceCard)) return 2;
    if (_cutState.prints.some(p => String(p.id||p.name) === clip.sourceCard)) return 0;
    return 1;
  }

  function makeRow(label, clips, clipsWithIdx, color) {
    if (!clipsWithIdx.length) {
      return `
        <div class="cut-track-row">
          <div class="cut-track-label" style="color:${color};font-size:0.5rem">${label}</div>
          <div class="cut-track empty"></div>
        </div>`;
    }
    let off = 0;
    const bars = clipsWithIdx.map(({clip, ci}) => {
      const dur = clip.dur || 5;
      const w = Math.max((dur / totalSecs) * 100, 2);
      const left = off; off += w;
      const c = speakerColor(clip.speaker);
      const isSel = _cutState.selectedClip &&
        _cutState.selectedClip.sceneIdx !== undefined &&
        _cutState.selectedClip.clipIdx === ci;
      return `
        <div class="cut-tl-clip ${isSel?'selected':''}"
             style="left:${left}%;width:${Math.min(w,100-left)}%;background:${c}22;border:1px solid ${c}55;"
             onclick="window._cutSelectClip(${si},${ci})">
          <div class="cut-tl-clip-name">${clip.name||'clip'} &middot; ${dur}s</div>
        </div>`;
    }).join('');
    return `
      <div class="cut-track-row">
        <div class="cut-track-label" style="color:${color};font-size:0.5rem">${label}</div>
        <div class="cut-track">${bars}</div>
      </div>`;
  }

  const tracks = scenes.map((sc, si) => {
    const castClips  = sc.clips.map((c,i)=>({clip:c,ci:i})).filter(({clip})=>clipType(clip)===0);
    const sceneClips = sc.clips.map((c,i)=>({clip:c,ci:i})).filter(({clip})=>clipType(clip)===1);
    const worldClips = sc.clips.map((c,i)=>({clip:c,ci:i})).filter(({clip})=>clipType(clip)===2);

    if (!sc.clips.length) {
      return `
        <div style="margin-bottom:4px">
          <div class="cut-track-row">
            <div class="cut-track-label">s${si+1}</div>
            <div class="cut-track empty" style="opacity:0.2"></div>
          </div>
        </div>`;
    }

    return `
      <div style="border-left:2px solid var(--border);padding-left:4px;margin-bottom:6px">
        <div style="font-size:0.55rem;color:var(--subtext);letter-spacing:0.1em;padding:2px 0 3px 2px">S${si+1}</div>
        ${makeRow('cast', castClips, castClips, 'var(--pink)')}
        ${makeRow('scene', sceneClips, sceneClips, 'var(--teal)')}
        ${makeRow('world', worldClips, worldClips, 'var(--blue)')}
      </div>`;
  }).join('');

  const clipCount = cutClipCount();
  const activeScenes = scenes.filter(s => s.clips.length).length;

  return `
    <div class="cut-tl-wrap">
      <div class="cut-tl-header">
        <div class="cut-tl-label">storyboard timeline</div>
        <div class="cut-tl-btns">
          <button class="cut-tl-btn" onclick="window._cutClearAll()">clear</button>
          <button class="cut-tl-btn accent" onclick="window._cutRenderAll()">&#10022; render all</button>
        </div>
      </div>
      <div class="cut-tl-body">
        <div class="cut-ruler">
          <div class="cut-ruler-spacer"></div>
          <div class="cut-ruler-ticks">${rulerTicks}</div>
        </div>
        <div class="cut-tracks">${tracks}</div>
        <div class="cut-tl-footer">
          total: ${cutTotalSecs()}s &middot; ${clipCount} clip${clipCount!==1?'s':''} &middot; ${activeScenes} active scene${activeScenes!==1?'s':''}
        </div>
      </div>
    </div>`;
}

// ── PICKER OVERLAY ─────────────────────────────────────────
function renderCutPicker() {
  if (!_cutState.pickerOpen) return '';
  const { sceneCards, pickerSceneIdx } = _cutState;

  const sceneItems = sceneCards.length
    ? sceneCards.map(card => {
        const cid = String(card.id || card.name || '').replace(/'/g, '');
        return `
          <div class="cut-picker-card" onclick="window._cutPickCard('${cid}')">
            <div class="cut-picker-card-thumb">
              ${card.imageDataUrl ? `<img src="${card.imageDataUrl}" alt="">` : '&#10022;'}
            </div>
            <div class="cut-picker-card-info">
              <div class="cut-picker-card-name">${card.name || 'scene card'}</div>
              <div class="cut-picker-card-meta">${[card.mood, card.time, card.location].filter(Boolean).join(' &middot; ')}</div>
            </div>
          </div>`;
      }).join('')
    : `<div class="cut-picker-empty">No scene cards yet.<br>Create some in Codex first.</div>`;

  return `
    <div class="cut-picker-overlay" onclick="window._cutClosePicker()">
      <div class="cut-picker-panel" onclick="event.stopPropagation()">
        <div class="cut-picker-handle"></div>
        <div class="cut-picker-header">
          <div class="cut-picker-title">add clip &mdash; scene ${pickerSceneIdx + 1}</div>
          <button class="cut-picker-close" onclick="window._cutClosePicker()">&#10005;</button>
        </div>
        <div class="cut-picker-tabs">
          <button class="cut-picker-tab active" id="cpick-tab-cards"
                  onclick="window._cutPickerTab('cards')">from cards</button>
          <button class="cut-picker-tab" id="cpick-tab-blank"
                  onclick="window._cutPickerTab('blank')">blank clip</button>
        </div>
        <div class="cut-picker-body">
          <div id="cpick-body-cards">${sceneItems}</div>
          <div id="cpick-body-blank" style="display:none">
            <div class="cut-blank-form">
              <div class="cut-form-field">
                <label class="cut-form-label">clip name</label>
                <input class="cut-form-input" id="cut-blank-name" placeholder="sky-intro" type="text"/>
              </div>
              <div class="cut-form-row">
                <div class="cut-form-field">
                  <label class="cut-form-label">speaker</label>
                  <input class="cut-form-input" id="cut-blank-speaker" placeholder="Sky" type="text"/>
                </div>
                <div class="cut-form-field">
                  <label class="cut-form-label">mood</label>
                  <input class="cut-form-input" id="cut-blank-mood" placeholder="curious" type="text"/>
                </div>
              </div>
              <div class="cut-form-field">
                <label class="cut-form-label">dialogue</label>
                <input class="cut-form-input" id="cut-blank-dialogue"
                       placeholder="Oh. You're actually here." type="text"/>
              </div>
              <div class="cut-form-row">
                <div class="cut-form-field">
                  <label class="cut-form-label">duration (s)</label>
                  <input class="cut-form-input" id="cut-blank-dur"
                         placeholder="5" type="number" min="1" max="60"/>
                </div>
                <div class="cut-form-field">
                  <label class="cut-form-label">prompt hint</label>
                  <input class="cut-form-input" id="cut-blank-prompt"
                         placeholder="cyberpunk city" type="text"/>
                </div>
              </div>
              <button class="cut-form-save-btn" onclick="window._cutSaveBlankClip()">add clip</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── WINDOW ACTION HANDLERS ─────────────────────────────────
window._cutSelectClip = function(si, ci) {
  const clip = _cutState.scenes[si]?.clips[ci];
  if (!clip) return;
  _cutState.selectedClip = { sceneIdx: si, clipIdx: ci, clip };
  renderCutView();
};

window._cutOpenPicker = function(si) {
  _cutState.pickerOpen = true;
  _cutState.pickerSceneIdx = si;
  renderCutView();
};

window._cutClosePicker = function() {
  _cutState.pickerOpen = false;
  renderCutView();
};

window._cutPickerTab = function(tab) {
  const cards = document.getElementById('cpick-body-cards');
  const blank = document.getElementById('cpick-body-blank');
  const tabC  = document.getElementById('cpick-tab-cards');
  const tabB  = document.getElementById('cpick-tab-blank');
  if (!cards) return;
  if (tab === 'cards') {
    cards.style.display = ''; blank.style.display = 'none';
    tabC.classList.add('active'); tabB.classList.remove('active');
  } else {
    cards.style.display = 'none'; blank.style.display = '';
    tabC.classList.remove('active'); tabB.classList.add('active');
  }
};

window._cutPickCard = function(cardId) {
  const card = _cutState.sceneCards.find(c => String(c.id || c.name) === cardId);
  if (!card) return;
  const clip = {
    id: Date.now(),
    name: card.name || 'clip',
    speaker: card.speaker || card.character || 'narrator',
    mood: card.mood || '',
    dialogue: card.caption || card.dialogue || '',
    dur: 5,
    prompt: [card.mood, card.time, card.location, card.camera].filter(Boolean).join(', '),
    status: card.imageDataUrl ? '&#10022; image' : 'no image',
    imageDataUrl: card.imageDataUrl || null,
    sourceCard: cardId,
  };
  const si = _cutState.pickerSceneIdx;
  _cutState.scenes[si].clips.push(clip);
  _cutState.selectedClip = { sceneIdx: si, clipIdx: _cutState.scenes[si].clips.length - 1, clip };
  _cutState.pickerOpen = false;
  saveCutScenes();
  renderCutView();
  if (window.awardXP) window.awardXP('clip_added');
};

window._cutSaveBlankClip = function() {
  const name     = document.getElementById('cut-blank-name')?.value.trim() || 'clip';
  const speaker  = document.getElementById('cut-blank-speaker')?.value.trim() || 'narrator';
  const mood     = document.getElementById('cut-blank-mood')?.value.trim() || '';
  const dialogue = document.getElementById('cut-blank-dialogue')?.value.trim() || '';
  const dur      = parseInt(document.getElementById('cut-blank-dur')?.value) || 5;
  const prompt   = document.getElementById('cut-blank-prompt')?.value.trim() || '';
  const clip = { id: Date.now(), name, speaker, mood, dialogue, dur, prompt, status: 'no image', imageDataUrl: null };
  const si = _cutState.pickerSceneIdx;
  _cutState.scenes[si].clips.push(clip);
  _cutState.selectedClip = { sceneIdx: si, clipIdx: _cutState.scenes[si].clips.length - 1, clip };
  _cutState.pickerOpen = false;
  saveCutScenes();
  renderCutView();
};

window._cutRemoveClip = function() {
  const sel = _cutState.selectedClip;
  if (!sel) return;
  _cutState.scenes[sel.sceneIdx].clips.splice(sel.clipIdx, 1);
  _cutState.selectedClip = null;
  saveCutScenes();
  renderCutView();
};

window._cutClearAll = function() {
  if (!confirm('Clear all clips from the storyboard?')) return;
  _cutState.scenes.forEach(sc => { sc.clips = []; });
  _cutState.selectedClip = null;
  saveCutScenes();
  renderCutView();
};

window._cutRenderAll = function() {
  alert('Render all — wan 2.2 video pipeline coming soon!');
};

window._cutGenImage = function() {
  const sel = _cutState.selectedClip;
  if (!sel) return;
  const prompt = sel.clip.prompt || sel.clip.name;
  if (window.switchView) window.switchView('imagine');
  setTimeout(() => {
    const inp = document.getElementById('imagine-prompt');
    if (inp) { inp.value = prompt; inp.focus(); }
  }, 200);
};

window._cutGenClip = function() {
  alert('Clip generation — wan 2.2 pipeline coming soon!');
};

window._cutExportClip = function() {
  const sel = _cutState.selectedClip;
  if (!sel || !sel.clip.imageDataUrl) {
    alert('No image to export yet. Generate an image first.');
    return;
  }
  const a = document.createElement('a');
  a.href = sel.clip.imageDataUrl;
  a.download = (sel.clip.name || 'clip') + '.png';
  a.click();
};

window._cutExport = function() {
  const data = JSON.stringify({ scenes: _cutState.scenes }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'spiralcut-storyboard.json';
  a.click();
};


window._cutAddWorldClip = function(worldId, si) {
  const world = _cutState.worldCards.find(w => String(w.id || w.name) === worldId);
  if (!world) return;
  si = (si !== undefined ? si : null) ?? _cutState.selectedClip?.sceneIdx ?? 0;
  const clip = {
    id: Date.now(),
    name: world.name || 'world clip',
    speaker: 'narrator',
    mood: world.biome || '',
    dialogue: world.tagline || world.lore?.slice(0,80) || '',
    dur: 5,
    prompt: [world.biome, world.name].filter(Boolean).join(', '),
    status: world.image ? '✦ image' : 'no image',
    imageDataUrl: world.image || null,
    sourceCard: worldId,
  };
  _cutState.scenes[si].clips.push(clip);
  _cutState.selectedClip = { sceneIdx: si, clipIdx: _cutState.scenes[si].clips.length - 1, clip };
  saveCutScenes();
  renderCutView();
};

window._cutAddPrintClip = function(printId, si) {
  const print = _cutState.prints.find(p => String(p.id || p.name) === printId);
  if (!print) return;
  si = (si !== undefined ? si : null) ?? _cutState.selectedClip?.sceneIdx ?? 0;
  const clip = {
    id: Date.now(),
    name: (print.name || 'character') + ' clip',
    speaker: print.name || 'narrator',
    mood: print.trait || '',
    dialogue: (print.story?.current_arc || print.story?.backstory || print.identity?.vibe || ''),
    dur: 5,
    prompt: [print.name, print.trait].filter(Boolean).join(', '),
    status: (print.portrait_base64 || print.image) ? '✦ image' : 'no image',
    imageDataUrl: print.portrait_base64 || print.image || null,
    sourceCard: printId,
  };
  _cutState.scenes[si].clips.push(clip);
  _cutState.selectedClip = { sceneIdx: si, clipIdx: _cutState.scenes[si].clips.length - 1, clip };
  saveCutScenes();
  renderCutView();
};


window._cutAskAddWorld = function(worldId) {
  const n = _cutState.scenes.length;
  const def = String((_cutState.selectedClip?.sceneIdx ?? 0) + 1);
  const ans = prompt('Add world to scene (1-' + n + '):', def);
  if (ans === null) return;
  const si = Math.min(Math.max((parseInt(ans) || 1) - 1, 0), n - 1);
  window._cutAddWorldClip(worldId, si);
};

window._cutAskAddPrint = function(printId) {
  const n = _cutState.scenes.length;
  const def = String((_cutState.selectedClip?.sceneIdx ?? 0) + 1);
  const ans = prompt('Add character to scene (1-' + n + '):', def);
  if (ans === null) return;
  const si = Math.min(Math.max((parseInt(ans) || 1) - 1, 0), n - 1);
  window._cutAddPrintClip(printId, si);
};

// ── PUBLIC INIT ────────────────────────────────────────────
export async function initCutView() {
  try {
    injectCutCSS();
    await loadCutScenes();
    await loadBinData();
    renderCutView();
  } catch(e) {
    console.error('[cut] init failed', e);
    const el = document.getElementById('view-cut');
    if (el) el.innerHTML = `<div style="padding:20px;color:var(--subtext);font-size:0.78rem">cut error: ${e.message}</div>`;
  }
}
