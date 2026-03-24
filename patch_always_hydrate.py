import pathlib, re

f = pathlib.Path('C:/Users/quart/spiralside/js/app/main.js')
src = f.read_text(encoding='utf-8').replace('\r\n', '\n')

# Replace the entire you_card hydration block
# Old version: only writes if IDB has no 'you' record (causes stale data)
# New version: always writes cloud data to IDB — cloud is source of truth

old = """  // ── You card — seed IDB if fresh device ──────────────────
  // loadSavedSheets runs after this and reads from IDB,
  // so writing here means the You card loads correctly on first login
  try {
    const cloudYou = await syncLoad('you_card');
    if (cloudYou) {
      // Check if IDB already has a you record on this device
      // initDB hasn't run yet so open IDB directly
      const hasLocal = await new Promise(resolve => {
        const req = indexedDB.open('spiralside');
        req.onsuccess = e => {
          const db = e.target.result;
          // If sheets store doesn't exist yet, definitely fresh
          if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(false); return; }
          const tx = db.transaction('sheets', 'readonly');
          const get = tx.objectStore('sheets').get('you');
          get.onsuccess = () => { db.close(); resolve(!!get.result); };
          get.onerror  = () => { db.close(); resolve(false); };
        };
        req.onerror = () => resolve(false);
      });

      if (!hasLocal) {
        // Write cloud data into IDB so loadSavedSheets picks it up
        await new Promise(resolve => {
          const req = indexedDB.open('spiralside');
          req.onsuccess = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(); return; }
            const tx = db.transaction('sheets', 'readwrite');
            tx.objectStore('sheets').put({ ...cloudYou, id: 'you' });
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror    = () => { db.close(); resolve(); };
          };
          req.onerror = () => resolve();
        });
        console.log('[sync] you_card hydrated from cloud into IDB');
      }
    }
  } catch(e) { console.warn('[sync] you_card hydration failed:', e); }"""

new = """  // ── You card — always write cloud data into IDB ─────────
  // Cloud is source of truth. IDB is just a cache.
  // Overwrite on every login so cross-device changes always land.
  // loadSavedSheets runs after this and reads from IDB.
  try {
    const cloudYou = await syncLoad('you_card');
    if (cloudYou && cloudYou.handle) {
      await new Promise(resolve => {
        const req = indexedDB.open('spiralside');
        req.onsuccess = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(); return; }
          const tx = db.transaction('sheets', 'readwrite');
          tx.objectStore('sheets').put({ ...cloudYou, id: 'you' });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror    = () => { db.close(); resolve(); };
        };
        req.onerror = () => resolve();
      });
      console.log('[sync] you_card written to IDB from cloud');
    }
  } catch(e) { console.warn('[sync] you_card hydration failed:', e); }"""

if old not in src:
    print('NOT FOUND')
else:
    f.write_text(src.replace(old, new, 1), encoding='utf-8')
    print('FIXED')
