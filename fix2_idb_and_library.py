#!/usr/bin/env python3
# SPIRALSIDE fix2_idb_and_library.py
# 1. Bump IDB version 2->3 (panels+books stores)
# 2. Fix library add-image button
# 3. Fix tab toggle (display flex vs empty string)
# 4. Redirect images away from vault
# Run from ~/spiralside: py fix2_idb_and_library.py

import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(p):
    return open(os.path.join(BASE, p), encoding='utf-8').read()

def write(p, c):
    open(os.path.join(BASE, p), 'w', encoding='utf-8').write(c)
    print('  wrote: ' + p)

def patch(p, old, new, label):
    c = read(p)
    if old not in c:
        print('  SKIP: ' + label)
        return False
    write(p, c.replace(old, new, 1))
    print('  OK: ' + label)
    return True

print('Fixing IDB + library...')

# 1. Bump IDB version
patch('js/app/db.js',
    "indexedDB.open('spiralside', 2)",
    "indexedDB.open('spiralside', 3)",
    'IDB version 2->3')

# 2. Fix add image button wiring
patch('js/app/library.js',
    "  document.getElementById('lib-add-btn')\n    .addEventListener('click', () => document.getElementById('lib-file-input').click());",
    "  var addBtn = document.getElementById('lib-add-btn');\n  if (addBtn) addBtn.onclick = function() { document.getElementById('lib-file-input').click(); };",
    'library add-image button')

# 3. Fix tab toggle display values
patch('js/app/library.js',
    "document.getElementById('lib-gallery-view').style.display = which === 'gallery' ? '' : 'none';",
    "document.getElementById('lib-gallery-view').style.display = which === 'gallery' ? 'flex' : 'none';",
    'tab toggle gallery display')

patch('js/app/library.js',
    "document.getElementById('lib-books-view').style.display   = which === 'books'   ? '' : 'none';",
    "document.getElementById('lib-books-view').style.display   = which === 'books'   ? 'flex' : 'none';",
    'tab toggle books display')

# 4. Redirect images from vault
patch('js/app/vault.js',
    "async function handleFileInput(e) {\n  for (const f of e.target.files) {\n    const content = await f.text().catch(() => '[binary]');",
    "async function handleFileInput(e) {\n  for (const f of e.target.files) {\n    if (f.type.startsWith('image/')) {\n      alert('Images go in the Library tab.');\n      continue;\n    }\n    const content = await f.text().catch(() => '[binary]');",
    'vault redirect images')

# 5. Remove image types from vault file input accept
patch('index.html',
    'accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp" multiple />',
    'accept=".txt,.md,.pdf" multiple />',
    'vault file input accept')

print()
db  = read('js/app/db.js')
lib = read('js/app/library.js')
v   = read('js/app/vault.js')
print('IDB v3:          ' + ('OK' if "'spiralside', 3" in db else 'FAIL'))
print('panels store:    ' + ('OK' if 'panels' in db else 'FAIL'))
print('add btn fix:     ' + ('OK' if 'addBtn.onclick' in lib else 'FAIL'))
print('tab flex fix:    ' + ('OK' if "'flex'" in lib else 'FAIL'))
print('vault redirect:  ' + ('OK' if 'Library tab' in v else 'FAIL'))
print()
print('Run:')
print('  git add .')
print('  git commit -m "fix: IDB v3, library btn, vault redirect"')
print('  git push')
print()
print('IMPORTANT after deploy:')
print('  F12 > Application > IndexedDB > spiralside > Delete database')
print('  Then hard refresh (Ctrl+Shift+R)')
