# ============================================================
# SPIRALSIDE — CLOUD SYNC PATCH v2
# Wires style_prefs to Supabase + hydrates on login
# Run from ~/spiralside in Git Bash
# Nimbis anchor: patch_cloud_sync.py
# ============================================================
# TOUCHES:
#   js/app/style.js  — syncSave('style_prefs') on applyAndSaveStyle
#                    — export setPendingStyle for external hydration
#   js/app/main.js   — hydrateFromCloud() injected into onAppReady
# DOES NOT TOUCH: sync.js, sheet.js, account.js (already correct)
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


# ── 1. style.js — add syncSave import ────────────────────────────────────────
print('\n[1/5] style.js — add syncSave import')
patch(
    'js/app/style.js',
    '// Nimbis anchor: js/app/style.js',
    "// Nimbis anchor: js/app/style.js\nimport { syncSave } from './sync.js';",
    'style.js — syncSave import'
)


# ── 2. style.js — syncSave call in applyAndSaveStyle ─────────────────────────
# Real anchor from grep line 289: localStorage.setItem('ss_style', JSON.stringify(_save));
print('\n[2/5] style.js — syncSave on applyAndSaveStyle')
patch(
    'js/app/style.js',
    "localStorage.setItem('ss_style', JSON.stringify(_save));",
    "localStorage.setItem('ss_style', JSON.stringify(_save));\n  syncSave('style_prefs', _save).catch(() => {});  // cloud backup",
    'style.js — syncSave after localStorage write'
)


# ── 3. style.js — export setPendingStyle ─────────────────────────────────────
# Insert right before applyStyleVars (line 253 in original)
print('\n[3/5] style.js — export setPendingStyle')
patch(
    'js/app/style.js',
    'export function applyStyleVars(s) {',
    '''// Lets main.js hydrateFromCloud push a style object without triggering a save
export function setPendingStyle(s) {
  pendingStyle = { ...DEFAULT_STYLE, ...s };
}

export function applyStyleVars(s) {''',
    'style.js — export setPendingStyle'
)


# ── 4. main.js — add syncLoad import ─────────────────────────────────────────
print('\n[4/5] main.js — add syncLoad import')
patch(
    'js/app/main.js',
    '// Nimbis anchor: js/app/main.js',
    "// Nimbis anchor: js/app/main.js\nimport { syncLoad } from './sync.js';",
    'main.js — syncLoad import'
)


# ── 5. main.js — inject hydrateFromCloud into onAppReady ─────────────────────
# Real signature from grep line 160: async function onAppReady() {
print('\n[5/5] main.js — inject hydrateFromCloud into onAppReady')
patch(
    'js/app/main.js',
    'async function onAppReady() {',
    '''// ── CLOUD HYDRATION ──────────────────────────────────────────────────────
// On every login, pull style_prefs + quest_char from Supabase.
// Runs before UI renders so the user sees their real theme immediately.
// Fully silent on failure — localStorage / defaults win if cloud unreachable.
async function hydrateFromCloud() {
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
}

async function onAppReady() {
  // Hydrate from cloud before anything else renders
  await hydrateFromCloud();''',
    'main.js — hydrateFromCloud injected into onAppReady'
)


# ── REPORT ────────────────────────────────────────────────────────────────────
print('\n' + '='*60)
if errors:
    print(f'FINISHED WITH {len(errors)} ANCHOR MISS(ES):')
    for e in errors:
        print(f'  {e}')
    print('\nFor each miss: grep the file for the real text and paste it back.')
else:
    print('ALL PATCHES APPLIED CLEAN')
    print()
    print('  git add .')
    print('  git commit -m "feat: cloud sync hydration on login (style + quest char)"')
    print('  git push --force origin main')
print('='*60)
