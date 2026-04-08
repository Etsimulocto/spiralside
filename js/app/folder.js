// ============================================================
// SPIRALSIDE — FOLDER.JS
// File System Access API — pick a local folder once,
// then auto-save all generated assets into it silently.
// window._ssFolder  : active FileSystemDirectoryHandle
// window.ssWrite()  : write a file to the folder
// window.ssFolderReady() : returns true if folder is set
// Nimbis anchor: js/app/folder.js
// ============================================================

import { dbSet, dbGet } from './db.js';

const IDB_KEY  = 'spiralside_folder_handle';
const STORE_KEY = 'config';

// ── Restore handle from IDB on load ──────────────────────
export async function initFolder() {
  try {
    const rec = await dbGet(STORE_KEY, IDB_KEY);
    if (rec?.data) {
      window._ssFolder = rec.data;
      console.log('[folder] restored handle:', window._ssFolder.name);
      _updateFolderUI(window._ssFolder.name);
    }
  } catch(e) {
    console.warn('[folder] restore failed:', e);
  }
}

// ── Pick folder — called by button ───────────────────────
export async function pickFolder() {
  if (!('showDirectoryPicker' in window)) {
    alert('Your browser does not support folder access.\nTry Chrome or Edge on desktop.');
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
    window._ssFolder = handle;
    // Persist handle to IDB so it survives tab navigation within session
    await dbSet(STORE_KEY, { key: IDB_KEY, data: handle });
    _updateFolderUI(handle.name);
    console.log('[folder] set:', handle.name);
    _toast('Spiralside folder set: ' + handle.name);
  } catch(e) {
    if (e.name !== 'AbortError') console.warn('[folder] pick failed:', e);
  }
}

// ── Clear folder ─────────────────────────────────────────
export async function clearFolder() {
  window._ssFolder = null;
  try { await dbSet(STORE_KEY, { key: IDB_KEY, data: null }); } catch(e) {}
  _updateFolderUI(null);
}

// ── Write a file to the folder ───────────────────────────
// filename : string  e.g. 'imagine-2026-04-02.png'
// blob     : Blob
// subdir   : optional subfolder name e.g. 'frames'
export async function ssWrite(filename, blob, subdir) {
  if (!window._ssFolder) return false;  // no folder set — caller should fallback to download
  try {
    // Verify permission is still granted (may lapse across reloads)
    const perm = await window._ssFolder.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') { window._ssFolder = null; return false; }

    let dir = window._ssFolder;

    // Optionally write into a subfolder (created if missing)
    if (subdir) {
      dir = await window._ssFolder.getDirectoryHandle(subdir, { create: true });
    }

    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable   = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    console.log('[folder] saved:', (subdir ? subdir + '/' : '') + filename);
    _toast('Saved to folder: ' + filename);
    return true;
  } catch(e) {
    console.warn('[folder] write failed:', e);
    return false;
  }
}

// ── Convenience: returns true if folder is active ────────
export function ssFolderReady() {
  return !!window._ssFolder;
}

// ── Update the folder UI badge wherever it lives ─────────
function _updateFolderUI(name) {
  const btn = document.getElementById('ss-folder-btn');
  const badge = document.getElementById('ss-folder-badge');
  if (btn) btn.textContent = name ? '📁 ' + name : '📁 set spiralside folder';
  if (badge) {
    badge.textContent = name ? '📁 ' + name : '';
    badge.style.display = name ? 'block' : 'none';
  }
}

// ── Small toast notification ──────────────────────────────
function _toast(msg) {
  let t = document.getElementById('ss-folder-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'ss-folder-toast';
    t.style.cssText = [
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%)',
      'background:var(--surface);border:1px solid var(--teal)',
      'color:var(--teal);font-family:var(--font-ui);font-size:0.68rem',
      'letter-spacing:0.08em;padding:8px 16px;border-radius:20px',
      'z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.3s',
      'white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = '0', 2400);
}

// ── Expose globals so other modules skip the import ──────
window.ssWrite       = ssWrite;
window.ssFolderReady = ssFolderReady;
window.pickFolder    = pickFolder;
window.clearFolder   = clearFolder;
