# ============================================================
# SPIRALSIDE — PRINTS CLOUD SYNC PATCH
# Wires user codex prints to Supabase + hydrates on fresh login
# Run from ~/spiralside in Git Bash
# Nimbis anchor: patch_prints_sync.py
# ============================================================
# TOUCHES:
#   js/app/build.js  — syncSave('print_{card_id}') after dbSet prints
#   js/app/main.js   — hydrate all prints from cloud into IDB on fresh device
# ============================================================

import pathlib

BASE = pathlib.Path('C:/Users/quart/spiralside')
errors = []

def patch(filepath, old, new, label):
    f = BASE / filepath
    src = f.read_text(encoding='utf-8').replace('\r\n', '\n')
    if old not in src:
        errors.append(f'NOT FOUND [{label}] in {filepath}')
        print(f'  x NOT FOUND: {label}')
        return False
    result = src.replace(old, new, 1)
    f.write_text(result, encoding='utf-8')
    print(f'  OK PATCHED: {label}')
    return True


# ── 1. build.js — add syncSave import ────────────────────────────────────────
print('\n[1/3] build.js — add syncSave import')
patch(
    'js/app/build.js',
    '// Nimbis anchor: js/app/build.js',
    "// Nimbis anchor: js/app/build.js\nimport { syncSave } from './sync.js';",
    'build.js — syncSave import'
)


# ── 2. build.js — syncSave after dbSet prints ────────────────────────────────
# Anchor from line 414: await dbSet('prints', { id: printToSave.card_id, ...printToSave });
print('\n[2/3] build.js — syncSave after print dbSet')
patch(
    'js/app/build.js',
    "await dbSet('prints', { id: printToSave.card_id, ...printToSave });\n  print.card_id = printToSave.card_id;",
    "await dbSet('prints', { id: printToSave.card_id, ...printToSave });\n  // Cloud backup — keyed by card_id so each print is its own record\n  syncSave('print_' + printToSave.card_id, { id: printToSave.card_id, ...printToSave }).catch(() => {});\n  print.card_id = printToSave.card_id;",
    'build.js — syncSave after dbSet prints'
)


# ── 3. main.js — add prints hydration to hydrateFromCloud ────────────────────
# Insert before the quest_char block (last block in the function)
print('\n[3/3] main.js — hydrate prints from cloud into IDB on fresh device')
patch(
    'js/app/main.js',
    "  // ── Quest char — seed localStorage if fresh device ───────",
    """  // ── User prints — seed IDB if fresh device ──────────────
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

  // ── Quest char — seed localStorage if fresh device ───────""",
    'main.js — prints hydration block'
)


# ── REPORT ────────────────────────────────────────────────────────────────────
print('\n' + '='*60)
if errors:
    print(f'FINISHED WITH {len(errors)} MISS(ES):')
    for e in errors: print(f'  {e}')
else:
    print('ALL PATCHES APPLIED CLEAN')
    print()
    print('  git add .')
    print('  git commit -m "feat: sync user codex prints to cloud + hydrate on fresh device"')
    print('  git push --force origin main')
print('='*60)
