# ============================================================
# SPIRALSIDE — YOU CARD CLOUD HYDRATION PATCH
# Adds you_card seed into IDB on fresh device login
# Run from ~/spiralside in Git Bash
# Nimbis anchor: patch_you_hydrate.py
# ============================================================
# TOUCHES: js/app/main.js only
# Replaces the hydrateFromCloud function with a version that
# also seeds IDB sheets store with cloud you_card data
# if the device has no existing IDB record for 'you'
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

# Replace the entire hydrateFromCloud function
# Old version only handled style + quest_char via localStorage
# New version also seeds IDB with you_card if fresh device

OLD = '''async function hydrateFromCloud() {
  // Style prefs
  try {
    const cloudStyle = await syncLoad('style_prefs');
    if (cloudStyle) {
      const { setPendingStyle, applyStyleVars } = await import('./style.js');
      setPendingStyle(cloudStyle);
      applyStyleVars(cloudStyle);
      localStorage.setItem('ss_style', JSON.stringify(cloudStyle));
      console.log('[sync] style_prefs hydrated from cloud');
    }
  } catch(e) { console.warn('[sync] style hydration failed:', e); }

  // Quest char — only seed localStorage if this device has nothing saved
  try {
    if (!localStorage.getItem('ss_quest_char')) {
      const cloudChar = await syncLoad('quest_char');
      if (cloudChar) {
        localStorage.setItem('ss_quest_char', JSON.stringify(cloudChar));
        console.log('[sync] quest_char hydrated from cloud');
      }
    }
  } catch(e) { console.warn('[sync] quest_char hydration failed:', e); }
}'''

NEW = '''async function hydrateFromCloud() {
  // ── Style prefs ──────────────────────────────────────────
  try {
    const cloudStyle = await syncLoad('style_prefs');
    if (cloudStyle) {
      const { setPendingStyle, applyStyleVars } = await import('./style.js');
      setPendingStyle(cloudStyle);
      applyStyleVars(cloudStyle);
      localStorage.setItem('ss_style', JSON.stringify(cloudStyle));
      console.log('[sync] style_prefs hydrated from cloud');
    }
  } catch(e) { console.warn('[sync] style hydration failed:', e); }

  // ── You card — seed IDB if fresh device ──────────────────
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
  } catch(e) { console.warn('[sync] you_card hydration failed:', e); }

  // ── Quest char — seed localStorage if fresh device ───────
  try {
    if (!localStorage.getItem('ss_quest_char')) {
      const cloudChar = await syncLoad('quest_char');
      if (cloudChar) {
        localStorage.setItem('ss_quest_char', JSON.stringify(cloudChar));
        console.log('[sync] quest_char hydrated from cloud');
      }
    }
  } catch(e) { console.warn('[sync] quest_char hydration failed:', e); }
}'''

print('[1/1] main.js — replace hydrateFromCloud with IDB-aware version')
patch('js/app/main.js', OLD, NEW, 'main.js — hydrateFromCloud with you_card IDB seed')

print('\n' + '='*60)
if errors:
    print(f'FINISHED WITH {len(errors)} MISS(ES):')
    for e in errors: print(f'  {e}')
else:
    print('ALL PATCHES APPLIED CLEAN')
    print()
    print('  git add .')
    print('  git commit -m "feat: hydrate you_card from cloud into IDB on fresh device login"')
    print('  git push --force origin main')
print('='*60)
