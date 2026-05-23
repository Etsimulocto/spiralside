import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/sheet.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = "  // Show edit/delete action row for user-made prints\n  var _printActionRow = document.getElementById('print-action-row');\n  if (_printActionRow) {"

NEW = """  // Show edit/delete action row for user-made prints only — not crew archetypes
  var _printActionRow = document.getElementById('print-action-row');
  if (_printActionRow && _isCustomBot) {"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] — found {count} times')
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] edit/delete row hidden for crew archetypes')
print('\nRun:')
print('  cd ~/spiralside && git add js/app/sheet.js && git commit -m "fix: hide edit/delete buttons for crew archetypes" && git push --force origin main')
