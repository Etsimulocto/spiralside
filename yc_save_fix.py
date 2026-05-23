import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/build.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = "    state.activePrintId = null;\n    hideYouSection();\n    // Switch back to the You card view\n    if (window.switchView) window.switchView('sheet');\n    console.log('[forge] you_card saved back to sheets IDB');\n    return;"

NEW = "    // Refresh codex chip row so You card shows new data\n    import('./sheet.js').then(({ buildCharSelector }) => buildCharSelector()).catch(() => {});\n    console.log('[forge] you_card saved back to sheets IDB');\n    return;"

count = src.count(OLD)
if count != 1:
    print(f'[MISS] anchor found {count} times — repr below')
    idx = src.find('activePrintId = null')
    print(repr(src[idx:idx+200]))
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] you_card save fix applied')
