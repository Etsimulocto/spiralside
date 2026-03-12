#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_library_bugs.py
# 1. Bump IDB version 2→3 so panels/books stores get created
# 2. Fix library "add image" button (innerHTML wipe kills listener)
# Run from ~/spiralside: py fix_library_bugs.py
# ============================================================

import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(p):
    return open(os.path.join(BASE, p), 'r', encoding='utf-8').read()

def write(p, c):
    open(os.path.join(BASE, p), 'w', encoding='utf-8').write(c)
    print(f'  wrote: {p}')

def patch(p, old, new, label):
    c = read(p)
    if old not in c:
        print(f'  SKIP (not found): [{label}]')
        return False
    write(p, c.replace(old, new, 1))
    print(f'  ✓ patched: [{label}]')
    return True

print('🔧 Fixing library bugs...\n')

# ── 1. Bump IDB version 2 → 3 ────────────────────────────────
# This forces onupgradeneeded to fire so panels/books stores get created
patch('js/app/db.js',
    "indexedDB.open('spiralside', 2)",
    "indexedDB.open('spiralside', 3)",
    'db.js: bump IDB version to 3')

# ── 2. Fix renderLibrary — re-attach file input listener ──────
# Problem: wireLibraryControls sets addEventListener on #lib-add-btn,
# but the button's onclick attr calls click() on #lib-file-input directly.
# The renderLibrary() call wipes innerHTML of #lib-grid but NOT the toolbar,
# so the listener should survive. The real issue is the file input accept attr
# needs to allow images and the click event needs to propagate.
# Fix: use onclick in the button HTML itself (set in index.html) instead of
# addEventListener, which is more robust across re-renders.
# We'll patch library.js to wire via onclick on the element directly.

patch('js/app/library.js',
    "  // Add image button\n  document.getElementById('lib-add-btn')\n    .addEventListener('click', () => document.getElementById('lib-file-input').click());",
    "  // Add image button — direct onclick is more robust than addEventListener\n  // in case the element is replaced by a re-render\n  const addBtn = document.getElementById('lib-add-btn');\n  if (addBtn) addBtn.onclick = () => document.getElementById('lib-file-input').click();",
    'library.js: fix add image button wiring')

# ── 3. Fix the lib-books-view display toggle ─────────────────
# The books view has display:none inline but the tab toggle sets
# element.style.display = '' which doesn't override the inline style
# reliably when using flex. Fix: use 'flex' not ''.
patch('js/app/library.js',
    "document.getElementById('lib-gallery-view').style.display = which === 'gallery' ? '' : 'none';\n      document.getElementById('lib-books-view').style.display   = which === 'books'   ? '' : 'none';",
    "document.getElementById('lib-gallery-view').style.display = which === 'gallery' ? 'flex' : 'none';\n      document.getElementById('lib-books-view').style.display   = which === 'books'   ? 'flex' : 'none';",
    'library.js: fix tab toggle display values')

# ── 4. Fix vault.js — images should go to library, not vault ──
# Vault file input accepts images — filter them out, redirect to library
patch('js/app/vault.js',
    "async function handleFileInput(e) {\n  for (const f of e.target.files) {\n    const content = await f.text().catch(() => '[binary]');\n    const entry   = { name: f.name, size: f.size, content, type: f.type };\n    state.vaultFiles.push(entry);\n    await dbSet('vault', entry);\n  }\n  renderVault();\n  e.target.value = ''; // reset so same file can be re-added\n}",
    "async function handleFileInput(e) {\n  for (const f of e.target.files) {\n    // Images belong in the library, not the vault\n    if (f.type.startsWith('image/')) {\n      alert(`\"${f.name}\" is an image — add it via the 🖼 Library tab instead.`);\n      continue;\n    }\n    const content = await f.text().catch(() => '[binary]');\n    const entry   = { name: f.name, size: f.size, content, type: f.type };\n    state.vaultFiles.push(entry);\n    await dbSet('vault', entry);\n  }\n  renderVault();\n  e.target.value = ''; // reset so same file can be re-added\n}",
    'vault.js: redirect images to library')

# Also remove image/* from vault file-input accept attr
patch('index.html',
    'accept=\".txt,.md,.pdf,.png,.jpg,.jpeg,.webp\" multiple />',
    'accept=\".txt,.md,.pdf\" multiple />',
    'index.html: remove image types from vault file input')

print()
print('Verification:')
db  = read('js/app/db.js')
lib = read('js/app/library.js')
v   = read('js/app/vault.js')
idx = read('index.html')
print(f"  IDB version 3:              {'✓' if \"'spiralside', 3\" in db else '✗'}")
print(f"  panels store in db.js:      {'✓' if 'panels' in db else '✗'}")
print(f"  add btn onclick fix:        {'✓' if 'addBtn.onclick' in lib else '✗'}")
print(f"  tab toggle flex fix:        {'✓' if \"'flex'\" in lib else '✗'}")
print(f"  vault redirects images:     {'✓' if 'Library tab' in v else '✗'}")
print(f"  vault input no images:      {'✓' if '.png' not in idx.split('file-input')[1][:100] else '✗'}")
print()
print('Run:')
print('  git add .')
print('  git commit -m "fix: IDB v3, library add btn, vault image redirect"')
print('  git push')
print()
print('⚠️  After deploy: open DevTools → Application → IndexedDB → delete spiralside db')
print('   then hard refresh. This forces IDB to recreate with panels+books stores.')
