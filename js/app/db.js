// ============================================================
// SPIRALSIDE — DB v1.0
// All IndexedDB operations — init, get, set, getAll, delete
// Stores: 'sheets' (keyPath:id), 'vault' (keyPath:name), 'config' (keyPath:key)
// Nimbis anchor: js/app/db.js
// ============================================================

let db = null; // single shared IDB connection
let _dbReady = null; // promise that resolves when db is open

// Returns db, waiting for initDB if not yet ready
async function _getDB() {
  if (db) return db;
  if (_dbReady) return _dbReady;
  // initDB hasn't been called yet — wait up to 3s
  return new Promise((resolve, reject) => {
    let waited = 0;
    const t = setInterval(() => {
      if (db) { clearInterval(t); resolve(db); return; }
      waited += 50;
      if (waited > 3000) { clearInterval(t); reject(new Error('[db] timeout waiting for initDB')); }
    }, 50);
  });
}

// ── INIT ──────────────────────────────────────────────────────
// Open the database. Must be called before any other db* fn.
export async function initDB() {
  if (db) return db;  // already open — skip re-init
  _dbReady = new Promise((res, rej) => {
    const req = indexedDB.open('spiralside', 7); // v7 adds frames store

    req.onupgradeneeded = e => {
      const d = e.target.result;
      // Create stores if they don't exist yet
      if (!d.objectStoreNames.contains('sheets')) d.createObjectStore('sheets', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('vault'))  d.createObjectStore('vault',  { keyPath: 'name' });
      if (!d.objectStoreNames.contains('config')) d.createObjectStore('config', { keyPath: 'key' });
      if (!d.objectStoreNames.contains('panels')) d.createObjectStore('panels', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('books'))  d.createObjectStore('books',  { keyPath: 'id' });
      if (!d.objectStoreNames.contains('prints')) d.createObjectStore('prints', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('scenes')) d.createObjectStore('scenes', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('worlds')) d.createObjectStore('worlds', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('frames')) d.createObjectStore('frames', { keyPath: 'id' });
    };

    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror   = ()  => rej(req.error);
  });
  return _dbReady;
}

// ── SET (upsert) ───────────────────────────────────────────────
export async function dbSet(store, val) {
  const _db = await _getDB();
  return new Promise((res, rej) => {
    const tx  = _db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(val);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

// ── GET (by key) ───────────────────────────────────────────────
export async function dbGet(store, key) {
  const _db = await _getDB();
  return new Promise((res, rej) => {
    const tx  = _db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ── GET ALL ────────────────────────────────────────────────────
export async function dbGetAll(store) {
  const _db = await _getDB();
  return new Promise((res, rej) => {
    const tx  = _db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ── DELETE (by key) ────────────────────────────────────────────
export async function dbDelete(store, key) {
  const _db = await _getDB();
  return new Promise((res, rej) => {
    const tx  = _db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

