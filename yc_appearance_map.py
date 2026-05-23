import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/build.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = "  s('forge-vibe')(char.vibe || '');\n  // you-specific fields — canonical names from sheet.js"

NEW = """  s('forge-vibe')(char.vibe || '');
  // also populate appearance section so portrait gen uses your data
  s('forge-hair')(char.hair || '');
  s('forge-eyes')(char.eyes || '');
  s('forge-style')(char.style || '');
  s('forge-marks')(char.marks || '');
  s('forge-appearance')(char.wearing || '');
  // you-specific fields — canonical names from sheet.js"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] — found {count} times')
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] appearance fields now populated from You card data')
print('\nRun:')
print('  cd ~/spiralside && git add js/app/build.js && git commit -m "feat: you_card loads into forge appearance fields for portrait gen" && git push --force origin main')
