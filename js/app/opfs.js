// ============================================================
// SPIRALSIDE — OPFS.JS
// Origin Private File System — silent device storage.
// No permission popups. Works on iOS Safari, Android, Desktop.
// The browser gives spiralside.com its own private folder.
//
// Usage from any module:
//   import { opfsWrite, opfsRead, opfsList } from './opfs.js';
//   await opfsWrite('imagine/sky-portrait.png', blob);
//
// window.opfsWrite / window.opfsRead / window.opfsList also
// available globally so tabs don't need to import.
// Nimbis anchor: js/app/opfs.js
// ============================================================

const SUPPORTED = 'storage' in navigator && 'getDirectory' in navigator.storage;

// ── Get the root OPFS directory ───────────────────────────────
async function _root() {
  return await navigator.storage.getDirectory();
}

// ── Get or create a subfolder ─────────────────────────────────
async function _dir(subdir) {
  const root = await _root();
  if (!subdir) return root;
  return await root.getDirectoryHandle(subdir, { create: true });
}

// ── Write a file ──────────────────────────────────────────────
// path: 'imagine/portrait.png' or just 'portrait.png'
// data: Blob | ArrayBuffer | string
export async function opfsWrite(path, data) {
  if (!SUPPORTED) return false;
  try {
    const parts   = path.split('/');
    const filename = parts.pop();
    const subdir   = parts.join('/') || null;
    const dir      = await _dir(subdir);
    const fh       = await dir.getFileHandle(filename, { create: true });
    const w        = await fh.createWritable();
    await w.write(data);
    await w.close();
    console.log('[opfs] saved:', path);
    _toast('Saved: ' + filename);
    return true;
  } catch(e) {
    console.warn('[opfs] write failed:', path, e);
    return false;
  }
}

// ── Read a file back as a Blob ────────────────────────────────
export async function opfsRead(path) {
  if (!SUPPORTED) return null;
  try {
    const parts    = path.split('/');
    const filename = parts.pop();
    // For nested subdirs like 'a/b', walk each level
    const root = await _root();
    let   dir  = root;
    for (const part of parts) {
      if (part) dir = await dir.getDirectoryHandle(part, { create: false });
    }
    const fh = await dir.getFileHandle(filename);
    return await fh.getFile();
  } catch(e) {
    console.warn('[opfs] read failed:', path, e);
    return null;
  }
}

// ── List files in a subfolder ─────────────────────────────────
// Returns array of { name, size, lastModified, path }
export async function opfsList(subdir) {
  if (!SUPPORTED) return [];
  try {
    const dir   = await _dir(subdir || null);
    const files = [];
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        files.push({
          name,
          size:         file.size,
          lastModified: file.lastModified,
          path:         subdir ? subdir + '/' + name : name,
          handle,
        });
      }
    }
    // Newest first
    return files.sort((a, b) => b.lastModified - a.lastModified);
  } catch(e) {
    console.warn('[opfs] list failed:', subdir, e);
    return [];
  }
}

// ── List all subdirs at root ──────────────────────────────────
export async function opfsListDirs() {
  if (!SUPPORTED) return [];
  try {
    const root = await _root();
    const dirs = [];
    for await (const [name, handle] of root.entries()) {
      if (handle.kind === 'directory') dirs.push(name);
    }
    return dirs;
  } catch(e) { return []; }
}

// ── Delete a file ─────────────────────────────────────────────
export async function opfsDelete(path) {
  if (!SUPPORTED) return false;
  try {
    const parts   = path.split('/');
    const filename = parts.pop();
    const subdir   = parts.join('/') || null;
    const dir      = await _dir(subdir);
    await dir.removeEntry(filename);
    return true;
  } catch(e) { return false; }
}

// ── Estimate storage used ─────────────────────────────────────
export async function opfsEstimate() {
  try {
    const est = await navigator.storage.estimate();
    return {
      used:  est.usage  || 0,
      quota: est.quota  || 0,
      pct:   est.quota  ? Math.round((est.usage / est.quota) * 100) : 0,
    };
  } catch(e) { return { used: 0, quota: 0, pct: 0 }; }
}

// ── Is OPFS available? ────────────────────────────────────────
export function opfsSupported() { return SUPPORTED; }

// ── Friendly size string ──────────────────────────────────────
export function opfsSize(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

// ── Toast ──────────────────────────────────────────────────────
function _toast(msg) {
  let t = document.getElementById('opfs-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'opfs-toast';
    t.style.cssText = [
      'position:fixed;bottom:76px;left:50%;transform:translateX(-50%)',
      'background:var(--surface);border:1px solid var(--teal)',
      'color:var(--teal);font-family:var(--font-ui);font-size:0.65rem',
      'letter-spacing:0.08em;padding:6px 14px;border-radius:20px',
      'z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.3s',
      'white-space:nowrap;max-width:88vw;overflow:hidden;text-overflow:ellipsis',
      'box-shadow:0 0 20px rgba(0,246,214,0.2)',
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

// ── Globals ───────────────────────────────────────────────────
window.opfsWrite     = opfsWrite;
window.opfsRead      = opfsRead;
window.opfsList      = opfsList;
window.opfsListDirs  = opfsListDirs;
window.opfsDelete    = opfsDelete;
window.opfsEstimate  = opfsEstimate;
window.opfsSupported = opfsSupported;
window.opfsSize      = opfsSize;

// Log support status on load
if (SUPPORTED) {
  console.log('[opfs] Origin Private File System available');
} else {
  console.warn('[opfs] OPFS not supported in this browser');
}
