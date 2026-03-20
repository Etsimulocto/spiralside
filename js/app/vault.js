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
  // File picker input
  document.getElementById('file-input').addEventListener('change', handleFileInput);

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
export function renderVault() {
  const list = document.getElementById('vault-list');
  if (!list) return;  // view not mounted yet

  if (!state.vaultFiles.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗂</div>
        No files yet.<br>Add docs and your companion will remember them.
      </div>`;
    return;
  }

  list.innerHTML = state.vaultFiles.map((f, i) => {
    const c    = VAULT_COLORS[i % VAULT_COLORS.length];
    const icon = f.type?.startsWith('image')
      ? '🖼'
      : f.name.endsWith('.md') ? '📜' : '📄';

    return `
      <div class="vault-item">
        <div class="vault-item-accent" style="background:${c}"></div>
        <div class="vault-icon" style="background:${c}22;border:1px solid ${c}44">${icon}</div>
        <div class="vault-info">
          <div class="vault-filename">${f.name}</div>
          <div class="vault-meta" style="color:${c}">
            ${(f.size / 1024).toFixed(1)} KB · visible to companion
          </div>
        </div>
        <button class="vault-del" onclick="removeFile('${f.name}')">✕</button>
      </div>`;
  }).join('');
}

// ── REMOVE FILE ───────────────────────────────────────────────
// Called from inline onclick in renderVault HTML
export async function removeFile(name) {
  state.vaultFiles = state.vaultFiles.filter(f => f.name !== name);
  await dbDelete('vault', name);
  renderVault();
}

// ── LOAD VAULT FROM IDB ───────────────────────────────────────
// Called in onAppReady after initDB — restores persisted files
export function loadVaultFromDB(files) {
  state.vaultFiles = files || [];
  renderVault();
}

