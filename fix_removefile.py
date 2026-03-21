# fix_removefile.py — run from ~/spiralside
# 1. Export removeFile from vault.js
# 2. Expose window.removeFile in main.js
# 3. Fix grid onclick to use window.removeFile

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# Fix 1: export removeFile
if 'export function removeFile' in v:
    print('SKIP: removeFile already exported')
elif 'async function removeFile' in v:
    v = v.replace('async function removeFile', 'export async function removeFile', 1)
    print('✓ Exported async removeFile')
elif 'function removeFile' in v:
    v = v.replace('function removeFile', 'export function removeFile', 1)
    print('✓ Exported removeFile')
else:
    # Not defined at all — add it
    # Find end of file and append
    REMOVE_FN = """
// ── REMOVE FILE ───────────────────────────────────────────
export async function removeFile(i) {
  const file = state.vaultFiles[i];
  if (!file) return;
  state.vaultFiles.splice(i, 1);
  await dbDelete('vault', file.name);
  renderVault();
}
"""
    v = v.rstrip() + '\n' + REMOVE_FN
    print('✓ Added + exported removeFile')

# Fix 3: fix grid onclick — use window.removeFile(i)
# The grid currently has onclick="removeFile(${i})" — needs window.
v = v.replace("onclick=\"event.stopPropagation();removeFile(${i})\"",
              "onclick=\"event.stopPropagation();window.removeFile(${i})\"")
print('✓ Fixed grid onclick to window.removeFile')

with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(v)
print('✓ vault.js written')

# Fix 2: expose window.removeFile in main.js
with open('js/app/main.js','r',encoding='utf-8') as f: m=f.read()

# Check imports — add removeFile to vault import line if missing
if 'removeFile' not in m:
    # Find the vault import line and add removeFile
    OLD_IMP = 'import { initVault, renderVault,'
    if OLD_IMP in m:
        m = m.replace(OLD_IMP, 'import { initVault, renderVault, removeFile,', 1)
        print('✓ Added removeFile to vault import in main.js')
    else:
        print('WARN: vault import line not found — check main.js import manually')

# Expose on window
if 'window.removeFile' not in m:
    ANCHOR = 'window.renderVault  = renderVault;'
    if ANCHOR in m:
        m = m.replace(ANCHOR, ANCHOR + '\nwindow.removeFile   = removeFile;', 1)
        print('✓ Exposed window.removeFile in main.js')
    else:
        print('WARN: renderVault window anchor not found — add manually:')
        print('  window.removeFile = removeFile;')
else:
    print('SKIP: window.removeFile already in main.js')

with open('js/app/main.js','w',encoding='utf-8') as f: f.write(m)
print('✓ main.js written')

print('\n✅ Done!')
print('git add js/app/vault.js js/app/main.js && git commit -m "fix: export removeFile, expose on window" && git push --force origin main')
