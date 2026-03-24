import pathlib

f = pathlib.Path('C:/Users/quart/spiralside/js/app/main.js')
src = f.read_text(encoding='utf-8').replace('\r\n', '\n')

# Strategy change: don't fight IDB timing at all.
# Move you_card + prints hydration to AFTER loadSavedSheets runs.
# Write directly into CHARACTERS + IDB together so both are in sync.
# hydrateFromCloud now only handles style (before render) + queues data hydration.
# A new hydrateDataFromCloud() runs after loadSavedSheets in onAppReady.

# Step 1: Strip you_card + prints blocks out of hydrateFromCloud
old_you = """  // ── You card — always write cloud data into IDB ─────────
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
  } catch(e) { console.warn('[sync] you_card hydration failed:', e); }

  // ── User prints — seed IDB if fresh device ──────────────
  // Each print is stored as 'print_{card_id}' in user_data
  // Only hydrate if this device has no prints at all in IDB
  try {
    const hasPrints = await new Promise(resolve => {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('prints')) { db.close(); resolve(false); return; }
        const tx  = db.transaction('prints', 'readonly');
        const req2 = tx.objectStore('prints').count();
        req2.onsuccess = () => { db.close(); resolve(req2.result > 0); };
        req2.onerror   = () => { db.close(); resolve(false); };
      };
      req.onerror = () => resolve(false);
    });

    if (!hasPrints) {
      // Pull all records, filter for print_ keys
      const { syncLoadAll } = await import('./sync.js');
      const allRecords = await syncLoadAll();
      const printRecords = allRecords.filter(r => r.record_type.startsWith('print_'));

      if (printRecords.length > 0) {
        await new Promise(resolve => {
          const req = indexedDB.open('spiralside');
          req.onsuccess = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('prints')) { db.close(); resolve(); return; }
            const tx = db.transaction('prints', 'readwrite');
            const store = tx.objectStore('prints');
            for (const rec of printRecords) {
              // Skip builtin archetypes — they're seeded by seedBuiltInPrints()
              if (rec.data?.metadata?.is_archetype) continue;
              store.put({ ...rec.data, id: rec.data.id || rec.data.card_id });
            }
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror    = () => { db.close(); resolve(); };
          };
          req.onerror = () => resolve();
        });
        console.log('[sync] ' + printRecords.length + ' prints hydrated from cloud into IDB');
      }
    }
  } catch(e) { console.warn('[sync] prints hydration failed:', e); }

  // ── Quest char — seed localStorage if fresh device ───────"""

new_you = """  // ── Quest char — seed localStorage if fresh device ───────"""

if old_you not in src:
    print('NOT FOUND: you+prints block in hydrateFromCloud')
else:
    src = src.replace(old_you, new_you, 1)
    print('OK: stripped you+prints from hydrateFromCloud')

# Step 2: Add hydrateDataFromCloud() call AFTER loadSavedSheets in onAppReady
old_after = "  // 4. Load saved character sheet overrides\n  await loadSavedSheets(dbGet);"
new_after = """  // 4. Load saved character sheet overrides
  await loadSavedSheets(dbGet);
  // 4b. Overlay cloud data on top of IDB — cloud wins for you_card + prints
  // Runs after loadSavedSheets so CHARACTERS is already populated,
  // we just overwrite with fresher cloud data if available
  await hydrateDataFromCloud(dbSet, dbGet);"""

if old_after not in src:
    print('NOT FOUND: loadSavedSheets anchor')
else:
    src = src.replace(old_after, new_after, 1)
    print('OK: injected hydrateDataFromCloud after loadSavedSheets')

# Step 3: Add hydrateDataFromCloud function before onAppReady
new_fn = """// ── DATA HYDRATION (runs after loadSavedSheets) ──────────────────────────────
// Overlays cloud you_card + prints onto already-loaded CHARACTERS + IDB.
// No race conditions — IDB is open, CHARACTERS is populated.
async function hydrateDataFromCloud(dbSet, dbGet) {
  // ── You card ──
  try {
    const cloudYou = await syncLoad('you_card');
    if (cloudYou && cloudYou.handle) {
      // Write into IDB via the already-open connection
      await dbSet('sheets', { ...cloudYou, id: 'you' });
      // Also patch CHARACTERS.you directly so UI reflects it immediately
      const { CHARACTERS } = await import('./sheet.js');
      if (CHARACTERS && CHARACTERS.you) {
        Object.assign(CHARACTERS.you, cloudYou);
        window._youHandle = cloudYou.handle || window._youHandle;
      }
      console.log('[sync] you_card overlaid from cloud');
    }
  } catch(e) { console.warn('[sync] you_card overlay failed:', e); }

  // ── User prints ──
  try {
    const { syncLoadAll } = await import('./sync.js');
    const allRecords = await syncLoadAll();
    const printRecords = allRecords.filter(r => r.record_type.startsWith('print_'));
    for (const rec of printRecords) {
      if (rec.data?.metadata?.is_archetype) continue;
      const id = rec.data.id || rec.data.card_id;
      if (!id) continue;
      const existing = await dbGet('prints', id);
      // Only write if cloud is newer or local has nothing
      if (!existing || (rec.updated_at && existing.updated_at && rec.updated_at > existing.updated_at) || !existing.updated_at) {
        await dbSet('prints', { ...rec.data, id });
      }
    }
    if (printRecords.length > 0) {
      console.log('[sync] ' + printRecords.length + ' prints synced from cloud');
      // Rebuild char selector so new chips appear
      const { buildCharSelector, renderActiveChar } = await import('./sheet.js');
      buildCharSelector();
    }
  } catch(e) { console.warn('[sync] prints overlay failed:', e); }
}

async function onAppReady() {"""

old_fn = "async function onAppReady() {"

if old_fn not in src:
    print('NOT FOUND: onAppReady anchor for function insert')
else:
    src = src.replace(old_fn, new_fn, 1)
    print('OK: added hydrateDataFromCloud function')

f.write_text(src, encoding='utf-8')
print('\nDONE — check above for any NOT FOUND errors')
