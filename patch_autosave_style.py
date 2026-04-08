#!/usr/bin/env python
# ============================================================
# SPIRALSIDE — PATCH: autosave style on every change
# Fixes: Ctrl+R loses theme because applyStyleVars only writes
#        to CSS vars (live) but not to localStorage until you
#        explicitly hit "apply + save theme".
#
# FIX: adds a debounced _autoSave() function that writes
#      pendingStyle to localStorage 800ms after any change.
#      applyStyleVars calls it on every update.
#      Now Ctrl+R always restores your last visual state.
#
# RUN FROM: ~/spiralside (Git Bash)
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe patch_autosave_style.py
# ============================================================

import sys, os

def patch(path, old, new, label):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read().replace('\r\n', '\n')
    count = src.count(old)
    if count == 0:
        print(f'MISS [{label}]: anchor not found')
        sys.exit(1)
    if count > 1:
        print(f'DUPE [{label}]: {count} occurrences — unsafe to patch')
        sys.exit(1)
    result = src.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f'OK   [{label}]')

PATH = 'js/app/style.js'

# ── PATCH 1: add debounce timer var + _autoSave() function ──
# Inserts right after the styleInited declaration
patch(PATH,
    'let styleInited  = false;',
    '''let styleInited  = false;
let _autoSaveTimer = null;  // debounce handle for autosave

// Autosave pendingStyle to localStorage on every change (debounced 800ms).
// This means Ctrl+R never loses work -- you don\'t have to hit "apply + save" first.
// Cloud sync still only happens on explicit "apply + save" to avoid hammering the API.
function _autoSave() {
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    try {
      const _save = { ...pendingStyle };
      delete _save.bgImageData;  // never serialize raw image data -- it lives in IDB
      localStorage.setItem(\'ss_style\', JSON.stringify(_save));
    } catch(e) { /* quota exceeded or private mode -- silently skip */ }
  }, 800);
}''',
    'add _autoSave debounce'
)

# ── PATCH 2: call _autoSave() at the end of applyStyleVars ──
patch(PATH,
    "  r.setProperty('--line-height',    s.lineHeight   || '1.55');\n}",
    "  r.setProperty('--line-height',    s.lineHeight   || '1.55');\n  // Autosave every visual change so Ctrl+R never loses work\n  _autoSave();\n}",
    'wire _autoSave into applyStyleVars'
)

print('\nAll patches applied. Now run:')
print('  git add js/app/style.js')
print('  git commit -m "fix: autosave style on every change -- Ctrl+R no longer resets theme"')
print('  git push --force origin main')
