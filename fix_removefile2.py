# fix_removefile2.py — run from ~/spiralside

# Step 1: show exact main.js line 17 and full vault import
with open('js/app/main.js','r',encoding='utf-8') as f: lines=f.readlines()
print("=== main.js lines 14-20 ===")
for i,l in enumerate(lines[13:20],14): print(f"{i}: {repr(l)}")

# Step 2: add removeFile export to vault.js
with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

REMOVE_FN = """
// ── REMOVE FILE ───────────────────────────────────────────
export async function removeFile(i) {
  const file = state.vaultFiles[i];
  if (!file) return;
  state.vaultFiles.splice(i, 1);
  try { await dbDelete('vault', file.name); } catch {}
  renderVault();
}
"""

if 'export async function removeFile' in v or 'export function removeFile' in v:
    print('removeFile already exported in vault.js')
else:
    # Append before last line
    v = v.rstrip() + '\n' + REMOVE_FN
    with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(v)
    print('✓ Added export async function removeFile to vault.js')

# Step 3: fix main.js import — remove removeFile from vault import if it's there
# and ensure it's not imported from a non-exporting location
with open('js/app/main.js','r',encoding='utf-8') as f: m=f.read()

# Show the problematic import line
import re
vault_imports = re.findall(r'import\s*\{[^}]+\}\s*from\s*[\'"].*vault.*[\'"];?', m)
print("=== vault import lines ===")
for vi in vault_imports: print(' ', repr(vi))

# If removeFile is imported from vault.js but wasn't exported, it crashes
# Now that we added the export, it should work — just verify the import matches
for vi in vault_imports:
    if 'removeFile' in vi and 'views/vault' not in vi:
        print('  -> removeFile imported from vault.js ✓ (now exported, should work)')
    elif 'removeFile' in vi and 'views/vault' in vi:
        print('  -> removeFile imported from views/vault.js (WRONG — need to fix)')
        # Fix: remove removeFile from views/vault import, it lives in vault.js
        fixed = re.sub(r',?\s*removeFile', '', vi)
        fixed = re.sub(r'removeFile\s*,?\s*', '', fixed)
        m = m.replace(vi, fixed, 1)
        with open('js/app/main.js','w',encoding='utf-8') as f: f.write(m)
        print('  -> Removed removeFile from views/vault import')
