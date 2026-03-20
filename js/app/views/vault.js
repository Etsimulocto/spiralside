// ============================================================
// SPIRALSIDE — VAULT VIEW v1.0
// Local-first file vault: content in IDB, metadata in Supabase
// Module pattern matches forge/guide/account — init guard,
// stamps HTML once, wires events, reloads on revisit
// Nimbis anchor: js/app/views/vault.js
// ============================================================

import { getDB }    from '../db.js';        // IDB helper used across app
import { getState } from '../state.js';     // { session, user }
import { RAIL }     from '../config.js';    // Railway base URL

// ── MIME HELPERS ──────────────────────────────────────────
// Returns a display emoji for a given mime type
function mimeIcon(mime) {
  if (!mime) return '📄';
  if (mime.startsWith('image/'))       return '🖼️';
  if (mime === 'application/pdf')      return '📕';
  if (mime.includes('markdown'))       return '📝';
  if (mime.includes('javascript') || mime.includes('json')) return '🧩';
  if (mime.includes('python'))         return '🐍';
  if (mime.includes('html'))           return '🌐';
  return '📄';
}

// Human-readable file size
function fmtSize(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// Generate a UUID v4 client-side (so IDB and Supabase share same key)
function uuid4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// ── IDB HELPERS ───────────────────────────────────────────
// IDB store name from db.js schema: 'vault'
// Each record: { id, name, size, mime_type, content, created_at }

async function idbGetAll() {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction('vault', 'readonly');
    const req = tx.objectStore('vault').getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror   = () => rej(req.error);
  });
}

async function idbPut(record) {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction('vault', 'readwrite');
    const req = tx.objectStore('vault').put(record);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function idbDelete(id) {
  const db = await getDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction('vault', 'readwrite');
    const req = tx.objectStore('vault').delete(id);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

// ── SUPABASE SYNC HELPERS ─────────────────────────────────
// Syncs a file's metadata (no content) to Supabase vault_files table
// Silently fails — IDB is source of truth
async function sbAdd(meta) {
  try {
    const { session } = getState();
    const token = session?.access_token;
    if (!token) return;
    await fetch(`${RAIL}/vault/add`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify({ id: meta.id, name: meta.name, size: meta.size, mime_type: meta.mime_type })
    });
  } catch { /* silent — IDB is source of truth */ }
}

// Removes metadata from Supabase; silently fails
async function sbDelete(id) {
  try {
    const { session } = getState();
    const token = session?.access_token;
    if (!token) return;
    await fetch(`${RAIL}/vault/delete/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch { /* silent */ }
}

// ── MODULE STATE ──────────────────────────────────────────
// Module-level files array — reloaded from IDB on each init
let _files = [];

// ── HTML TEMPLATE ─────────────────────────────────────────
function vaultHTML() {
  return `
    <div id="vault-inner"
      style="flex:1;min-height:0;overflow-y:auto;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch;">

      <!-- ── TOOLBAR ── -->
      <div class="vault-toolbar">
        <button class="vault-btn" id="vault-add-btn">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9"  y1="15" x2="15" y2="15"/>
          </svg>
          add file
        </button>
        <button class="vault-btn" id="vault-folder-btn">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          folder
        </button>
      </div>

      <!-- ── CONTEXT BANNER ── -->
      <div id="vault-context-bar"
        style="display:none;background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.3);
               border-radius:8px;padding:8px 12px;margin-bottom:12px;
               font-size:0.68rem;color:var(--subtext);letter-spacing:0.04em;">
        <span id="vault-context-label">✦ 0 files visible to companion</span>
      </div>

      <!-- ── FILE LIST ── -->
      <div id="vault-list"></div>

      <!-- ── HIDDEN FILE INPUT ── -->
      <input type="file" id="vault-file-input" style="display:none"
        accept=".txt,.md,.pdf,.json,.js,.ts,.py,.html,.css,.csv,.png,.jpg,.jpeg,.webp"
        multiple />
    </div>

    <!-- ── PREVIEW OVERLAY ── -->
    <div id="vault-preview-overlay"
      style="display:none;position:fixed;inset:0;z-index:500;
             background:rgba(10,10,15,0.92);backdrop-filter:blur(8px);
             flex-direction:column;align-items:center;justify-content:flex-end;">
      <div id="vault-preview-panel"
        style="width:100%;max-width:480px;background:var(--surface);
               border:1px solid var(--border);border-radius:20px 20px 0 0;
               max-height:80dvh;display:flex;flex-direction:column;overflow:hidden;">

        <!-- header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:16px 20px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
          <div>
            <div id="preview-fname"
              style="font-size:0.85rem;font-weight:600;color:var(--text);word-break:break-all;"></div>
            <div id="preview-fmeta"
              style="font-size:0.62rem;color:var(--subtext);margin-top:2px;letter-spacing:0.06em;"></div>
          </div>
          <button id="vault-preview-close"
            style="background:var(--muted);border:none;border-radius:50%;width:32px;height:32px;
                   color:var(--subtext);font-size:1rem;cursor:pointer;display:flex;
                   align-items:center;justify-content:center;flex-shrink:0;">✕</button>
        </div>

        <!-- content area -->
        <div id="preview-content"
          style="flex:1;min-height:0;overflow-y:auto;padding:16px 20px;-webkit-overflow-scrolling:touch;">
        </div>

        <!-- footer: toggle companion visibility -->
        <div style="padding:12px 20px calc(12px + env(safe-area-inset-bottom,0px));
                    border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;">
          <button id="preview-toggle-ctx"
            style="flex:1;padding:10px;background:var(--accent);border:none;border-radius:10px;
                   color:#fff;font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;
                   letter-spacing:0.06em;transition:opacity 0.2s;">
            ✦ visible to companion
          </button>
          <button id="preview-delete"
            style="padding:10px 14px;background:transparent;border:1px solid var(--border);
                   border-radius:10px;color:var(--subtext);font-family:var(--font-ui);
                   font-size:0.72rem;cursor:pointer;transition:all 0.2s;">
            delete
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── RENDER FILE LIST ──────────────────────────────────────
function renderList() {
  const list = document.getElementById('vault-list');
  const bar  = document.getElementById('vault-context-bar');
  const lbl  = document.getElementById('vault-context-label');
  if (!list) return;

  if (!_files.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon" style="font-size:2rem;margin-bottom:12px">🗂️</div>
        <div style="font-size:0.78rem;line-height:1.7;color:var(--subtext)">
          No files yet.<br>Add docs and your companion will remember them.
        </div>
      </div>`;
    if (bar) bar.style.display = 'none';
    return;
  }

  // Context banner
  const ctxCount = _files.filter(f => f.in_context !== false).length;
  if (bar) {
    bar.style.display = 'block';
    lbl.textContent   = `✦ ${ctxCount} of ${_files.length} file${_files.length !== 1 ? 's' : ''} visible to companion`;
  }

  // File rows
  list.innerHTML = _files.map(f => `
    <div class="vault-item" data-id="${f.id}"
      style="cursor:pointer;user-select:none;transition:border-color 0.2s;"
      onclick="window._vaultPreview('${f.id}')">
      <div class="vault-icon">${mimeIcon(f.mime_type)}</div>
      <div class="vault-info">
        <div class="vault-filename">${escHtml(f.name)}</div>
        <div class="vault-meta">${fmtSize(f.size)} · ${f.in_context === false ? '⊘ hidden' : '✦ in context'}</div>
      </div>
      <button class="vault-del" title="delete"
        onclick="event.stopPropagation();window._vaultDelete('${f.id}')">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── ADD FILES ─────────────────────────────────────────────
async function addFiles(fileList) {
  for (const f of fileList) {
    // Read content — images as dataURL, text as string
    const content = await readFile(f);
    const record  = {
      id:         uuid4(),
      name:       f.name,
      size:       f.size,
      mime_type:  f.type || 'text/plain',
      content,
      in_context: true,
      created_at: new Date().toISOString()
    };
    await idbPut(record);    // save to IDB
    await sbAdd(record);     // sync metadata to Supabase (fire-and-forget)
    _files.push(record);
  }
  renderList();
  updateVaultContext();
}

// Reads a File as text or dataURL depending on type
function readFile(f) {
  return new Promise(res => {
    const reader = new FileReader();
    if (f.type.startsWith('image/') || f.type === 'application/pdf') {
      reader.onload  = e => res(e.target.result); // base64 dataURL
      reader.readAsDataURL(f);
    } else {
      reader.onload  = e => res(e.target.result); // plain text
      reader.onerror = () => res('[unreadable]');
      reader.readAsText(f);
    }
  });
}

// ── DELETE ────────────────────────────────────────────────
async function deleteFile(id) {
  await idbDelete(id);   // remove from IDB
  await sbDelete(id);    // remove from Supabase
  _files = _files.filter(f => f.id !== id);
  renderList();
  updateVaultContext();
}

// ── PREVIEW OVERLAY ───────────────────────────────────────
let _previewId = null;

function openPreview(id) {
  const f = _files.find(x => x.id === id);
  if (!f) return;
  _previewId = id;

  const overlay = document.getElementById('vault-preview-overlay');
  document.getElementById('preview-fname').textContent = f.name;
  document.getElementById('preview-fmeta').textContent =
    `${fmtSize(f.size)} · ${f.mime_type}`;

  // Render content based on type
  const contentEl = document.getElementById('preview-content');
  if (f.mime_type.startsWith('image/')) {
    contentEl.innerHTML = `<img src="${f.content}"
      style="max-width:100%;border-radius:8px;display:block;margin:0 auto;" />`;
  } else if (typeof f.content === 'string' && f.content.startsWith('data:')) {
    // PDF or other binary dataURL
    contentEl.innerHTML = `<div style="text-align:center;color:var(--subtext);padding:32px 0;font-size:0.8rem;">
      Binary file — preview not available.<br>File is in vault context for companion.
    </div>`;
  } else {
    // Text — show with monospace formatting, truncated at 10k chars
    const preview = f.content?.slice(0, 10000) || '';
    const truncated = f.content?.length > 10000
      ? `\n\n... [truncated — full content in context]` : '';
    contentEl.innerHTML = `<pre style="font-family:var(--font-ui);font-size:0.72rem;
      line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;
      margin:0;">${escHtml(preview + truncated)}</pre>`;
  }

  // Toggle button state
  const toggleBtn = document.getElementById('preview-toggle-ctx');
  syncToggleBtn(f, toggleBtn);

  // Show overlay (flex so it lays out correctly)
  overlay.style.display = 'flex';
}

function syncToggleBtn(f, btn) {
  if (!btn) return;
  if (f.in_context === false) {
    btn.textContent = '⊘ hidden from companion';
    btn.style.background = 'var(--muted)';
    btn.style.color = 'var(--subtext)';
  } else {
    btn.textContent = '✦ visible to companion';
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
  }
}

function closePreview() {
  const overlay = document.getElementById('vault-preview-overlay');
  if (overlay) overlay.style.display = 'none';
  _previewId = null;
}

// Toggle whether file is injected into chat context
async function toggleContext(id) {
  const f = _files.find(x => x.id === id);
  if (!f) return;
  f.in_context = f.in_context === false ? true : false;
  await idbPut(f); // persist toggle state
  syncToggleBtn(f, document.getElementById('preview-toggle-ctx'));
  renderList();
  updateVaultContext();
}

// ── EXPOSE VAULT CONTEXT TO CHAT ─────────────────────────
// Called after any add/delete/toggle — builds context string on window
// Chat system reads window._vaultContext to inject into prompts
function updateVaultContext() {
  const activeFiles = _files.filter(f => f.in_context !== false);
  window._vaultContext = activeFiles
    .map(f => {
      if (f.content?.startsWith('data:')) return `[file:${f.name}] [binary — not inlined]`;
      return `[file:${f.name}]\n${f.content}`;
    })
    .join('\n\n---\n\n');
}

// ── WIRE EVENTS ───────────────────────────────────────────
function wireEvents() {
  // Add file button → file picker
  const addBtn = document.getElementById('vault-add-btn');
  const input  = document.getElementById('vault-file-input');
  if (addBtn) addBtn.addEventListener('click', () => input?.click());

  // File input change
  if (input) {
    input.addEventListener('change', async e => {
      if (e.target.files?.length) await addFiles(e.target.files);
      e.target.value = '';
    });
  }

  // Folder picker
  const folderBtn = document.getElementById('vault-folder-btn');
  if (folderBtn) {
    folderBtn.addEventListener('click', async () => {
      if ('showDirectoryPicker' in window) {
        try {
          const dir = await window.showDirectoryPicker({ mode: 'read' });
          const picked = [];
          for await (const [, handle] of dir.entries()) {
            if (handle.kind === 'file') picked.push(await handle.getFile());
          }
          if (picked.length) await addFiles(picked);
        } catch { /* user cancelled */ }
      } else {
        // Fallback for browsers without File System API
        input?.click();
      }
    });
  }

  // Preview overlay close
  const closeBtn = document.getElementById('vault-preview-close');
  if (closeBtn) closeBtn.addEventListener('click', closePreview);

  // Close on overlay backdrop click
  const overlay = document.getElementById('vault-preview-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closePreview();
    });
  }

  // Toggle context button
  const toggleBtn = document.getElementById('preview-toggle-ctx');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (_previewId) toggleContext(_previewId);
    });
  }

  // Delete from preview
  const delBtn = document.getElementById('preview-delete');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!_previewId) return;
      closePreview();
      await deleteFile(_previewId);
    });
  }

  // Expose global handlers for inline onclick (list items)
  window._vaultPreview = openPreview;
  window._vaultDelete  = deleteFile;
}

// ── PUBLIC INIT ───────────────────────────────────────────
// Called by viewInits in ui.js on first visit to vault tab
// Subsequent visits call window.onVaultOpen() (set below)
export async function initVaultView() {
  const el = document.getElementById('view-vault');
  if (!el) return;

  // ── INIT GUARD (same pattern as forge/guide) ──
  if (!el.dataset.initialized) {
    el.dataset.initialized = 'true';
    el.innerHTML = vaultHTML();
    wireEvents();
  }

  // ── LOAD FROM IDB EVERY VISIT ──
  _files = await idbGetAll();
  renderList();
  updateVaultContext();
}

// Register onVaultOpen for revisits via switchView
window.onVaultOpen = () => {
  idbGetAll().then(files => {
    _files = files;
    renderList();
    updateVaultContext();
  });
};
