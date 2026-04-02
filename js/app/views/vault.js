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
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <button id="add-file-btn" title="add file for Sky to read"
          style="display:flex;align-items:center;gap:6px;padding:7px 12px;
                 background:var(--surface);border:1px solid var(--border);border-radius:8px;
                 color:var(--subtext);font-family:var(--font-ui);font-size:0.68rem;
                 letter-spacing:0.06em;cursor:pointer;transition:all 0.2s;flex-shrink:0;"
          onmouseenter="this.style.borderColor='var(--teal)';this.style.color='var(--teal)'"
          onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--subtext)'">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          add file
        </button>
        <div style="font-size:0.6rem;color:var(--subtext);letter-spacing:0.06em;opacity:0.6;">
          files added here are visible to Sky in chat
        </div>
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
  renderDeviceFiles();
}

// ── OPFS DEVICE FILES SECTION ────────────────────────────
// Reads from Origin Private File System and renders thumbnails.
// Called on every vault open so list stays fresh.
async function renderDeviceFiles() {
  const wrap = document.getElementById('vault-device-section');
  if (!wrap) return;

  // OPFS not supported — hide section silently
  if (!window.opfsList || !window.opfsSupported || !window.opfsSupported()) {
    wrap.style.display = 'none';
    return;
  }

  // Gather all files across known subdirs
  const dirs  = ['imagine', 'frames', 'cannonized', 'scenes', 'worlds', 'cards', null];
  let   files = [];
  for (const d of dirs) {
    const list = await window.opfsList(d);
    files = files.concat(list);
  }

  if (!files.length) { wrap.innerHTML = ''; return; }

  // Storage estimate for header
  const est     = window.opfsEstimate ? await window.opfsEstimate() : null;
  const estLine = est && est.used > 0 ? `${window.opfsSize(est.used)} used · ${est.pct}% of quota` : '';

  // Accent colors — same cycle as IDB vault
  const COLORS = ['#00F6D6','#FF4BCB','#7B5FFF','#FFD93D','#4DA3FF'];

  // Build cards using the exact same style as renderVault() IDB cards
  const cards = await Promise.all(files.map(async (f, i) => {
    const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name);
    const color = COLORS[i % COLORS.length];
    const subfold = f.path.includes('/') ? f.path.split('/')[0] : '';
    const size    = window.opfsSize ? window.opfsSize(f.size) : '';

    let thumbHtml = '';
    if (isImg) {
      try {
        const fileObj = await f.handle.getFile();
        const url     = URL.createObjectURL(fileObj);
        thumbHtml = `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;margin-bottom:6px;background:var(--muted);">
          <img src="${url}" style="width:100%;height:100%;object-fit:cover;" />
        </div>`;
      } catch(e) {
        thumbHtml = `<div style="width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:6px;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:1.6rem;">🖼️</div>`;
      }
    } else {
      const icon = /\.json$/i.test(f.name) ? '🧩' : /\.svg$/i.test(f.name) ? '◈' : '📄';
      thumbHtml = `<div style="width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:6px;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:1.6rem;">${icon}</div>`;
    }

    const safeName = f.name.replace(/'/g, "\'");
    const safePath = f.path.replace(/'/g, "\'");

    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
                  padding:8px;cursor:pointer;transition:border-color 0.2s;position:relative;
                  display:flex;flex-direction:column;"
           onmouseenter="this.style.borderColor='${color}'"
           onmouseleave="this.style.borderColor='var(--border)'"
           onclick="window._opfsPreview && window._opfsPreview('${safePath}','${safeName}',${isImg})">
        ${thumbHtml}
        <div style="font-size:0.6rem;color:var(--text);white-space:nowrap;overflow:hidden;
                    text-overflow:ellipsis;letter-spacing:0.02em;margin-bottom:2px;" title="${f.name}">
          ${f.name}
        </div>
        <div style="font-size:0.55rem;color:var(--subtext);margin-bottom:6px;">
          ${subfold ? subfold + ' · ' : ''}${size}
        </div>
        <div style="display:flex;gap:4px;margin-top:auto;" onclick="event.stopPropagation()">
          ${isImg || true ? `<button onclick="window._opfsDownload('${safePath}','${safeName}')"
            style="flex:1;padding:4px;background:var(--surface2);border:1px solid var(--border);
                   border-radius:6px;color:var(--subtext);font-size:0.65rem;cursor:pointer;
                   transition:all 0.15s;font-family:var(--font-ui);"
            onmouseenter="this.style.borderColor='var(--teal)';this.style.color='var(--teal)'"
            onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--subtext)'">↓</button>` : ''}
          <button onclick="window._opfsDeleteUI('${safePath}',this)"
            style="flex:1;padding:4px;background:var(--surface2);border:1px solid var(--border);
                   border-radius:6px;color:var(--subtext);font-size:0.65rem;cursor:pointer;
                   transition:all 0.15s;font-family:var(--font-ui);"
            onmouseenter="this.style.borderColor='var(--pink)';this.style.color='var(--pink)'"
            onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--subtext)'">✕</button>
        </div>
      </div>`;
  }));

  // Header label + storage usage — same style as vault-list section dividers
  wrap.innerHTML = `
    <div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;
                color:var(--teal);font-weight:700;margin:16px 0 10px;
                display:flex;align-items:center;gap:8px;">
      📱 on this device
      ${estLine ? `<span style="font-size:0.58rem;color:var(--subtext);font-weight:400;">${estLine}</span>` : ''}
      <span style="flex:1;height:1px;background:var(--border);display:block;"></span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
      ${cards.join('')}
    </div>`;
}

// Preview OPFS file — image lightbox or text modal matching vault preview style
window._opfsPreview = async function(path, name, isImg) {
  if (isImg) {
    const file = await window.opfsRead(path);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ov  = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(10,10,15,0.9);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:20px;';
    ov.innerHTML = `
      <img src="${url}" style="max-width:100%;max-height:75dvh;border-radius:10px;display:block;" />
      <div style="display:flex;gap:10px;">
        <button onclick="window._opfsDownload('${path.replace(/'/g,"\'")}','${name.replace(/'/g,"\'")}');this.closest('div').parentNode.remove();"
          style="padding:9px 18px;background:var(--teal);border:none;border-radius:8px;color:#000;font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;">↓ download</button>
        <button onclick="this.closest('[style]').remove();URL.revokeObjectURL('${url}')"
          style="padding:9px 18px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;">close</button>
      </div>`;
    ov.addEventListener('click', e => { if (e.target === ov) { ov.remove(); URL.revokeObjectURL(url); } });
    document.body.appendChild(ov);
  } else {
    await window._opfsDownload(path, name);
  }
};

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

// _injectDeviceStyles removed — now using inline styles matching vault grid

// onVaultOpen called by ui.js switchView on every revisit
window.onVaultOpen = () => {
  window.renderVault && window.renderVault();
  renderDeviceFiles();
};
