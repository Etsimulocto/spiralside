// ============================================================
// SPIRALSIDE — VAULT v1.0
// File upload, folder picker, render list, delete
// Files stored in state.vaultFiles + IndexedDB 'vault' store
// Nimbis anchor: js/app/vault.js
// ============================================================

import { state }           from './state.js';
import { dbSet, dbDelete } from './db.js';

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
  // Expose file preview opener for grid item clicks
  window._vaultOpenFile = (i) => {
    const f = state.vaultFiles[i];
    if (!f) return;
    // Simple preview: open image in new tab, show text in alert for now
    if (f.type && f.type.startsWith('image/')) {
      const w = window.open();
      w.document.write(`<img src="${f.content}" style="max-width:100%;background:#000;" />`);
    } else {
      // Could expand to a modal — for now just a peek
      alert(f.name + '\n\n' + (f.content || '').slice(0, 500));
    }
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
  const content = isAudio ? '[audio file — added to music player]' : await f.text().catch(() => '[binary]');
    const entry   = { name: f.name, size: f.size, content, type: f.type };
    state.vaultFiles.push(entry);
    await dbSet('vault', entry);
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

    // Thumbnail: image preview or emoji icon
    const thumb = isImg
      ? `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;margin-bottom:6px;background:var(--muted);">
           <img src="${f.content}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
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
}


export function loadVaultFromDB(files) {
  state.vaultFiles = files || [];
  renderVault();
}

// ── REMOVE FILE ───────────────────────────────────────────
export async function removeFile(i) {
  const file = state.vaultFiles[i];
  if (!file) return;
  state.vaultFiles.splice(i, 1);
  await dbDelete('vault', file.name);
  renderVault();
}
