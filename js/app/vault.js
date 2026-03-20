// ============================================================
// SPIRALSIDE — VAULT v1.0
// File upload, folder picker, render list, delete
// Files stored in state.vaultFiles + IndexedDB 'vault' store
// Nimbis anchor: js/app/vault.js
// ============================================================

import { state }           from './state.js';
import { dbSet, dbDelete, dbGet } from './db.js';

// Accent colors cycle across vault items
const VAULT_COLORS = ['#00F6D6', '#FF4BCB', '#7B5FFF', '#FFD93D', '#4DA3FF'];

// ── INIT ──────────────────────────────────────────────────────
export function initVault() {
  // Guard — view may not be mounted yet (called at startup before tab visited)
  if (!document.getElementById('file-input')) return;

  // File picker input
  document.getElementById('file-input').addEventListener('change', handleFileInput);
  // Wire add-file-btn to trigger the hidden file input
  const addBtn = document.getElementById('add-file-btn');
  if (addBtn) addBtn.addEventListener('click', () => document.getElementById('file-input').click());
  // Expose file preview opener for grid item clicks — inline overlay, no popups
  window._vaultOpenFile = (i) => {
    const f = state.vaultFiles[i];
    if (!f) return;
    showVaultPreview(f);
  };

  // Folder picker button (uses File System Access API where available)
  document.getElementById('open-folder-btn').addEventListener('click', handleFolderPick);
}

// ── HANDLE FILE INPUT ─────────────────────────────────────────
async function handleFileInput(e) {
  for (const f of e.target.files) {
    // Detect audio files — add to music player instead of reading as text
  const isAudio = f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name);
  if (isAudio) {
    const blobUrl = URL.createObjectURL(f);
    // Dynamically import music module to add track
    import('./music.js').then(m => m.addVaultTrack(f.name, blobUrl));
  }
  const isImage = f.type && f.type.startsWith('image/');
  let content;
  if (isAudio) {
    content = '[audio file — added to music player]';
  } else if (isImage) {
    // Read full dataURL for IDB storage but DON'T keep in state (freeze risk)
    content = await new Promise(res => {
      const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(f);
    });
  } else {
    content = await f.text().catch(() => '[binary]');
  }
  // IDB entry has full content; state entry is lean (no image data)
  const idbEntry   = { name: f.name, size: f.size, content, type: f.type };
  const stateEntry = { name: f.name, size: f.size, content: isImage ? '' : content, type: f.type };
  state.vaultFiles.push(stateEntry);
  await dbSet('vault', idbEntry);
  }
  renderVault();
  e.target.value = ''; // reset so same file can be re-added
}

// ── HANDLE FOLDER PICK ────────────────────────────────────────
async function handleFolderPick() {
  // Prefer native folder picker on supporting browsers
  if ('showDirectoryPicker' in window) {
    try {
      const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file') {
          const f       = await handle.getFile();
          const content = await f.text().catch(() => '[binary]');
          // Skip duplicates
          if (!state.vaultFiles.find(x => x.name === name)) {
            const entry = { name, size: f.size, content, type: f.type };
            state.vaultFiles.push(entry);
            await dbSet('vault', entry);
          }
        }
      }
      renderVault();
    } catch {
      // User cancelled picker — do nothing
    }
  } else {
    // Fallback: open multi-file input
    document.getElementById('file-input').click();
  }
}

// ── RENDER VAULT LIST ─────────────────────────────────────────

// ── VAULT RENDER HELPERS ──────────────────────────────────
function mimeEmoji(type) {
  if (!type) return '📄';
  if (type.startsWith('image/'))        return '🖼️';
  if (type === 'application/pdf')       return '📕';
  if (type.includes('markdown'))        return '📝';
  if (type.includes('javascript') || type.includes('json')) return '🧩';
  if (type.includes('python'))          return '🐍';
  if (type.includes('html'))            return '🌐';
  if (type.startsWith('audio/'))        return '🎵';
  return '📄';
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}

// ── VAULT PREVIEW OVERLAY ─────────────────────────────────
// Slide-up panel — safe, no window.open, no alert, no freeze
// Close: ✕ button OR tap backdrop
async function showVaultPreview(f) {
  // Remove any existing preview first
  const existing = document.getElementById('vault-preview-modal');
  if (existing) existing.remove();

  const isImg = f.type && f.type.startsWith('image/');

  // Build a placeholder modal immediately — don't block on IDB
  const modal = document.createElement('div');
  modal.id = 'vault-preview-modal';
  modal.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9000',
    'background:rgba(10,10,15,0.88)', 'backdrop-filter:blur(6px)',
    'display:flex', 'align-items:flex-end', 'justify-content:center'
  ].join(';');

  modal.innerHTML = `
    <div id="vault-preview-panel" style="
      width:100%;max-width:600px;background:var(--surface);
      border:1px solid var(--border);border-radius:20px 20px 0 0;
      max-height:85dvh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:16px 20px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <div>
          <div style="font-size:0.85rem;font-weight:600;color:var(--text);
                      word-break:break-all;">${escHtml(f.name)}</div>
          <div style="font-size:0.62rem;color:var(--subtext);margin-top:2px;">
            ${fmtSize(f.size)} · ${f.type || 'unknown'}</div>
        </div>
        <button id="vp-close-btn" style="
          background:var(--muted);border:1px solid var(--border);border-radius:50%;
          width:32px;height:32px;color:var(--text);font-size:0.9rem;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          flex-shrink:0;line-height:1;">✕</button>
      </div>
      <div id="vp-body" style="
        flex:1;min-height:0;overflow-y:auto;padding:16px 20px;
        -webkit-overflow-scrolling:touch;display:flex;align-items:center;
        justify-content:center;">
        <div style="color:var(--subtext);font-size:0.72rem;">loading…</div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // ── CLOSE HANDLERS ── wire by direct reference, not getElementById
  const closeBtn = modal.querySelector('#vp-close-btn');
  const closeModal = () => modal.remove();
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // ── LOAD CONTENT ──
  const body = modal.querySelector('#vp-body');
  try {
    if (isImg) {
      // Load dataURL from IDB
      const record = await dbGet('vault', f.name);
      const src = record?.content || '';
      if (src && src.startsWith('data:')) {
        body.innerHTML = `<img src="${src}"
          style="max-width:100%;max-height:60dvh;border-radius:8px;display:block;" />`;
      } else {
        body.innerHTML = `<div style="color:var(--subtext);font-size:0.78rem;text-align:center;">
          Image not available locally.<br>Re-upload to view.</div>`;
      }
    } else {
      // Load text from IDB
      const record = await dbGet('vault', f.name);
      const text = record?.content || f.content || '[no content]';
      if (text.startsWith('data:')) {
        // Binary file stored as dataURL — not previewable as text
        body.innerHTML = `<div style="color:var(--subtext);font-size:0.78rem;text-align:center;">
          Binary file — not previewable as text.</div>`;
      } else {
        const safe = text.slice(0, 3000)
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const trunc = text.length > 3000 ? '\n… [truncated]' : '';
        body.innerHTML = `<pre style="font-size:0.72rem;line-height:1.6;color:var(--text);
          white-space:pre-wrap;word-break:break-word;margin:0;
          font-family:var(--font-ui);width:100%;">${safe}${trunc}</pre>`;
      }
    }
  } catch (err) {
    body.innerHTML = `<div style="color:var(--subtext);font-size:0.78rem;">
      Error loading file: ${err.message}</div>`;
  }
}


// ── LAZY THUMBNAIL LOADER ─────────────────────────────────
// Loads image content from IDB after grid is rendered
// so the main thread isn't blocked by base64 strings
async function loadVaultThumbs() {
  const imgs = document.querySelectorAll('.vault-thumb');
  for (const img of imgs) {
    const name = img.dataset.vaultName;
    if (!name) continue;
    try {
      // dbGet from IDB vault store by name (keyPath)
      const record = await dbGet('vault', name);
      if (record && record.content && record.content.startsWith('data:')) {
        img.src = record.content;
        img.style.opacity = '1';
      }
    } catch { /* skip if not found */ }
  }
}

export function renderVault() {
  const list = document.getElementById('vault-list');
  if (!list) return;  // view not mounted yet

  if (!state.vaultFiles.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="font-size:2rem;margin-bottom:12px">🗂️</div>
        <div style="font-size:0.78rem;line-height:1.7;color:var(--subtext)">
          No files yet.<br>Add docs and your companion will remember them.
        </div>
      </div>`;
    return;
  }

  // ── 4-wide grid ──
  list.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;';

  list.innerHTML = state.vaultFiles.map((f, i) => {
    const isImg = f.type && f.type.startsWith('image/');
    const color = VAULT_COLORS[i % VAULT_COLORS.length];

    // Thumbnail: lazy-loaded image or emoji icon
    // Images use a placeholder — src loaded async after render to avoid freeze
    const thumb = isImg
      ? `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;
                     margin-bottom:6px;background:var(--muted);">
           <img data-vault-name="${escHtml(f.name)}"
                style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s;"
                loading="lazy" class="vault-thumb" />
         </div>`
      : `<div style="width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:6px;
                     background:var(--muted);display:flex;align-items:center;
                     justify-content:center;font-size:1.6rem;">
           ${mimeEmoji(f.type)}
         </div>`;

    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
                  padding:8px;cursor:pointer;transition:border-color 0.2s;position:relative;"
           onmouseenter="this.style.borderColor='${color}'"
           onmouseleave="this.style.borderColor='var(--border)'"
           onclick="window._vaultOpenFile && window._vaultOpenFile(${i})">
        ${thumb}
        <div style="font-size:0.6rem;color:var(--text);white-space:nowrap;overflow:hidden;
                    text-overflow:ellipsis;letter-spacing:0.02em;" title="${escHtml(f.name)}">
          ${escHtml(f.name)}
        </div>
        <div style="font-size:0.55rem;color:var(--subtext);margin-top:2px;">
          ${fmtSize(f.size)}
        </div>
        <button onclick="event.stopPropagation();window.removeFile(${i})"
          style="position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;
                 background:rgba(10,10,15,0.75);border:1px solid var(--border);
                 color:var(--subtext);font-size:0.6rem;cursor:pointer;display:flex;
                 align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;"
          onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"
          class="vault-del-btn">✕</button>
      </div>`;
  }).join('');

  // Lazy-load image thumbnails from IDB after render
  requestAnimationFrame(() => loadVaultThumbs());
}


export function loadVaultFromDB(files) {
  // Strip image content from state — images stay in IDB, loaded lazily for preview
  state.vaultFiles = files.map(f => ({
    ...f,
    content: (f.type && f.type.startsWith('image/')) ? '' : f.content
  }));
}

// ── REMOVE FILE ───────────────────────────────────────────
export async function removeFile(i) {
  const file = state.vaultFiles[i];
  if (!file) return;
  state.vaultFiles.splice(i, 1);
  try { await dbDelete('vault', file.name); } catch {}
  renderVault();
}
