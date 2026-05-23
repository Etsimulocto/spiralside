src = open('js/app/views/account.js', encoding='utf-8').read().replace('\r\n', '\n')

# Fix 1: always re-render the save slot even if initialized
# replace the guard so HTML renders once but save slot always refreshes
old = "  updateAccountView();\n  // Render save slot\n  const _svEl = document.getElementById('acct-save-slot');\n  if (_svEl) renderSaveSlot(_svEl);"
new = "  updateAccountView();\n  // Render save slot — always refresh, not guarded by initialized\n  // iOS: delay slightly so masterLoad has time to populate localStorage\n  const _svEl = document.getElementById('acct-save-slot');\n  if (_svEl) renderSaveSlot(_svEl);\n  setTimeout(() => {\n    const _svEl2 = document.getElementById('acct-save-slot');\n    if (_svEl2) renderSaveSlot(_svEl2);\n  }, 800);"

if old in src:
    open('js/app/views/account.js', 'w', encoding='utf-8').write(src.replace(old, new, 1))
    print('done')
else:
    print('anchor not found — check manually')
    print(repr(src[src.find('updateAccountView'):src.find('updateAccountView')+300]))
