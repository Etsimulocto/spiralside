with open('js/app/vault.js','r',encoding='utf-8') as f: s=f.read()

OLD = "export function renderVault() {\n  const list = document.getElementById('vault-list');\n\n  if (!state.vaultFiles.length) {"
NEW = "export function renderVault() {\n  const list = document.getElementById('vault-list');\n  if (!list) return;  // view not mounted yet\n\n  if (!state.vaultFiles.length) {"

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    open('js/app/vault.js','w',encoding='utf-8').write(s)
    print('PATCHED')
else:
    # show what we got so we can adjust
    idx = s.find('export function renderVault')
    print('ANCHOR NOT FOUND. Got:')
    print(repr(s[idx:idx+180]))
