with open('js/app/vault.js','r',encoding='utf-8') as f: s=f.read()

# Guard initVault — if DOM not ready yet, just return silently.
# Event wiring happens again inside initVaultView when view is mounted.
OLD = "export function initVault() {\n  // File picker input\n  document.getElementById('file-input').addEventListener('change', handleFileInput);\n\n  // Folder picker button (uses File System Access API where"
NEW = "export function initVault() {\n  // Guard — view may not be mounted yet (called at startup before tab visited)\n  if (!document.getElementById('file-input')) return;\n\n  // File picker input\n  document.getElementById('file-input').addEventListener('change', handleFileInput);\n\n  // Folder picker button (uses File System Access API where"

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    open('js/app/vault.js','w',encoding='utf-8').write(s)
    print('PATCHED')
else:
    idx = s.find('export function initVault')
    print('ANCHOR NOT FOUND. Got:')
    print(repr(s[idx:idx+250]))
