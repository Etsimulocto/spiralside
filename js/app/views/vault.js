// ============================================================
// SPIRALSIDE — VAULT VIEW v2.0
// View module shell — stamps HTML, delegates all logic to
// js/app/vault.js which owns IDB + state.vaultFiles
// Follows forge/guide init-guard pattern exactly
// Nimbis anchor: js/app/views/vault.js
// ============================================================

// ── HTML TEMPLATE ─────────────────────────────────────────
// Element IDs must match what js/app/vault.js wires up:
//   #file-input, #open-folder-btn, #vault-list
function vaultViewHTML() {
  return `
    <div id="vault-inner"
      style="flex:1;min-height:0;overflow-y:auto;
             padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));
             -webkit-overflow-scrolling:touch;">

      <!-- ── TOOLBAR ── -->
      <div class="vault-toolbar">
        <button class="vault-btn" id="add-file-btn">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9"  y1="15" x2="15" y2="15"/>
          </svg>
          add file
        </button>
        <button class="vault-btn" id="open-folder-btn">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          folder
        </button>
      </div>

      <!-- ── FILE LIST ── -->
      <div id="vault-list"></div>

      <!-- ── DEVICE FILES (OPFS) ── -->
      <div id="vault-device-section"></div>

      <!-- ── HIDDEN FILE INPUT (wired by vault.js initVault) ── -->
      <input type="file" id="file-input" style="display:none"
        accept=".txt,.md,.pdf,.json,.js,.ts,.py,.html,.css,.csv,.png,.jpg,.jpeg,.webp,.mp3,.wav,.ogg,.flac,.m4a"
        multiple />
    </div>
  `;
}

// ── PUBLIC INIT ───────────────────────────────────────────
// Called by viewInits in ui.js on first visit
export function initVaultView() {
  const el = document.getElementById('view-vault');
  if (!el) return;

  // Init guard — same pattern as forge/guide
  if (el.dataset.initialized) {
    // Revisit — just re-render the list with current state
    window.renderVault && window.renderVault();
    if (window.awardXP) window.awardXP('vault_file_uploaded').then(r => { if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'vault'); });
    return;
  }
  el.dataset.initialized = 'true';

  // Stamp HTML
  el.innerHTML = vaultViewHTML();

  // Wire all vault logic (file input, folder picker, IDB) via existing vault.js
  window.initVault && window.initVault();

  // Render current files
  window.renderVault && window.renderVault();
  // Render OPFS device files
  _injectDeviceStyles();
  renderDeviceFiles();
}

// ── OPFS DEVICE FILES SECTION ────────────────────────────
// Reads from Origin Private File System and renders thumbnails.
// Called on every vault open so list stays fresh.
async function renderDeviceFiles() {
  const wrap = document.getElementById('vault-device-section');
  if (!wrap) return;

  // OPFS not available (Firefox, older Safari)
  if (!window.opfsList || !window.opfsSupported || !window.opfsSupported()) {
    wrap.style.display = 'none';
    return;
  }

  // Gather all files across known subdirs + root
  const dirs  = ['imagine', 'frames', 'cannonized', null];
  let   files = [];
  for (const d of dirs) {
    const list = await window.opfsList(d);
    files = files.concat(list);
  }

  if (!files.length) {
    wrap.innerHTML = `
      <div class="vault-device-header">📱 on this device</div>
      <div style="font-size:0.68rem;color:var(--subtext);padding:8px 0 4px;">
        nothing saved yet — generate an image to auto-save here
      </div>`;
    return;
  }

  // Storage estimate
  const est     = window.opfsEstimate ? await window.opfsEstimate() : null;
  const estLine = est ? `${window.opfsSize(est.used)} used · ${est.pct}% of quota` : '';

  const cards = await Promise.all(files.map(async f => {
    const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name);
    let   thumb = '';
    if (isImg) {
      try {
        const file = await f.handle.getFile();
        const url  = URL.createObjectURL(file);
        thumb = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px 6px 0 0;" onload="URL.revokeObjectURL(this.src)" />`;
      } catch(e) {}
    }
    const icon    = isImg ? '' : '📄';
    const subfold = f.path.includes('/') ? f.path.split('/')[0] : 'root';
    const date    = new Date(f.lastModified).toLocaleDateString();
    const size    = window.opfsSize ? window.opfsSize(f.size) : '';
    return `
      <div class="vault-device-card" data-path="${f.path}">
        <div class="vault-device-thumb">${thumb || '<div style="font-size:1.6rem;display:flex;align-items:center;justify-content:center;height:100%">' + icon + '</div>'}</div>
        <div class="vault-device-info">
          <div class="vault-device-name" title="${f.name}">${f.name}</div>
          <div class="vault-device-meta">${subfold} · ${size} · ${date}</div>
        </div>
        <div style="display:flex;gap:6px;padding:0 8px 8px;">
          ${isImg ? `<button class="vault-device-btn" onclick="window._opfsDownload('${f.path}','${f.name}')">↓</button>` : ''}
          <button class="vault-device-btn" style="color:var(--pink);border-color:rgba(255,75,203,0.3);" onclick="window._opfsDeleteUI('${f.path}',this)">✕</button>
        </div>
      </div>`;
  }));

  wrap.innerHTML = `
    <div class="vault-device-header">📱 on this device
      ${estLine ? `<span style="font-size:0.58rem;color:var(--subtext);margin-left:8px;font-weight:400;">${estLine}</span>` : ''}
    </div>
    <div class="vault-device-grid">${cards.join('')}</div>`;
}

// Download a file from OPFS
window._opfsDownload = async function(path, name) {
  const file = await window.opfsRead(path);
  if (!file) return;
  const url = URL.createObjectURL(file);
  const a   = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// Delete with inline confirm
window._opfsDeleteUI = async function(path, btn) {
  if (btn.dataset.confirm !== '1') {
    btn.textContent = '?'; btn.dataset.confirm = '1';
    setTimeout(() => { if (btn) { btn.textContent = '✕'; delete btn.dataset.confirm; } }, 2000);
    return;
  }
  await window.opfsDelete(path);
  btn.closest('.vault-device-card')?.remove();
};

// Inject device section CSS once
function _injectDeviceStyles() {
  if (document.getElementById('vault-device-styles')) return;
  const s = document.createElement('style');
  s.id = 'vault-device-styles';
  s.textContent = `
    .vault-device-header {
      font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;
      color:var(--teal);font-weight:700;margin:20px 0 10px;
      display:flex;align-items:center;gap:6px;
    }
    .vault-device-header::after { content:'';flex:1;height:1px;background:var(--border); }
    .vault-device-grid {
      display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;
    }
    .vault-device-card {
      background:var(--surface);border:1px solid var(--border);
      border-radius:8px;overflow:hidden;display:flex;flex-direction:column;
      transition:border-color 0.2s;
    }
    .vault-device-card:hover { border-color:var(--teal); }
    .vault-device-thumb {
      width:100%;aspect-ratio:1;background:var(--muted);overflow:hidden;
    }
    .vault-device-info { padding:6px 8px 2px;flex:1; }
    .vault-device-name {
      font-size:0.62rem;color:var(--text);overflow:hidden;
      text-overflow:ellipsis;white-space:nowrap;
    }
    .vault-device-meta { font-size:0.55rem;color:var(--subtext);margin-top:2px; }
    .vault-device-btn {
      flex:1;padding:5px;background:var(--surface2);
      border:1px solid var(--border);border-radius:6px;
      color:var(--subtext);font-size:0.7rem;cursor:pointer;
      transition:all 0.15s;font-family:var(--font-ui);
    }
    .vault-device-btn:hover { border-color:var(--teal);color:var(--teal); }
  `;
  document.head.appendChild(s);
}

// onVaultOpen called by ui.js switchView on every revisit
window.onVaultOpen = () => {
  window.renderVault && window.renderVault();
  _injectDeviceStyles();
  renderDeviceFiles();
};
