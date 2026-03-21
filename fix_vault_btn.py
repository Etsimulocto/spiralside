# fix_vault_btn.py — run from ~/spiralside
# Fix 1: wire add-file-btn click -> file-input in vault.js
# Fix 2: rename .vault-tool-btn to .vault-btn in index.html CSS

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# Add click handler wiring for add-file-btn after the file-input change listener
OLD = "  document.getElementById('file-input').addEventListener('change', handleFileInput);"
NEW = ("  document.getElementById('file-input').addEventListener('change', handleFileInput);\n"
       "  // Wire add-file-btn to trigger the hidden file input\n"
       "  const addBtn = document.getElementById('add-file-btn');\n"
       "  if (addBtn) addBtn.addEventListener('click', () => document.getElementById('file-input').click());")

if OLD in v:
    v = v.replace(OLD, NEW, 1)
    open('js/app/vault.js','w',encoding='utf-8').write(v)
    print('PATCHED: vault.js add-file-btn wired')
else:
    print('ANCHOR NOT FOUND in vault.js:')
    idx=v.find('file-input')
    print(repr(v[max(0,idx-20):idx+120]))

# Fix 2: CSS class rename in index.html
with open('index.html','r',encoding='utf-8') as f: h=f.read()

if '.vault-tool-btn' in h:
    h = h.replace('.vault-tool-btn', '.vault-btn', )
    open('index.html','w',encoding='utf-8').write(h)
    print('PATCHED: index.html .vault-tool-btn -> .vault-btn')
else:
    print('SKIP: .vault-tool-btn not found in index.html (may already be .vault-btn)')
    # Check what IS there
    idx=h.find('vault-btn')
    if idx!=-1: print('Found:', repr(h[max(0,idx-20):idx+80]))
