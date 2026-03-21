# fix_vault_lazy3.py — run from ~/spiralside
# 1. Alias dbGetOne = dbGet in vault.js (dbGet exists, dbGetOne doesn't)
# 2. Wire lazy thumb loader after list.innerHTML is set in renderVault

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# ── FIX 1: alias dbGetOne to dbGet ──
# Import line already has dbGetOne — just swap to dbGet and add alias
OLD_IMP = "import { dbSet, dbDelete, dbGetOne } from './db.js';"
NEW_IMP = "import { dbSet, dbDelete, dbGet } from './db.js';\nconst dbGetOne = dbGet;  // alias — db.js uses dbGet(store, key)"

if OLD_IMP in v:
    v = v.replace(OLD_IMP, NEW_IMP, 1)
    print('✓ Aliased dbGetOne -> dbGet')
elif "import { dbSet, dbDelete }" in v:
    v = v.replace(
        "import { dbSet, dbDelete } from './db.js';",
        "import { dbSet, dbDelete, dbGet } from './db.js';\nconst dbGetOne = dbGet;",
        1
    )
    print('✓ Added dbGet import + alias')
else:
    print('WARN: db import not found — check manually')

# ── FIX 2: wire lazy thumb loader ──
# Find the .join('') at the end of the grid map in renderVault
# and add the requestAnimationFrame call after it

# The renderVault map ends with .join(''); followed by closing }
# We need to find this specific occurrence inside renderVault

if 'requestAnimationFrame' in v:
    print('SKIP: requestAnimationFrame already in vault.js')
else:
    # Find renderVault's list.innerHTML assignment end
    idx = v.find("export function renderVault()")
    if idx == -1:
        print('ERROR: renderVault not found'); exit(1)

    # Within renderVault, find the .join('') that closes the map
    join_idx = v.find(".join('');", idx)
    if join_idx == -1:
        join_idx = v.find('.join("")', idx)
    if join_idx == -1:
        print('WARN: join not found in renderVault'); 
    else:
        # Insert after the semicolon on that line
        line_end = v.find('\n', join_idx) + 1
        INSERT = '\n  // Lazy-load image thumbnails from IDB after render\n  requestAnimationFrame(() => loadVaultThumbs());\n'
        v = v[:line_end] + INSERT + v[line_end:]
        print('✓ Wired requestAnimationFrame lazy thumb loader')

with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(v)
print('✓ vault.js written')
print('\ngit add js/app/vault.js && git commit -m "fix: vault lazy image load, alias dbGetOne" && git push --force origin main')
