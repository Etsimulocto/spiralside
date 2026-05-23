import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/sheet.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = "  // Hide edit/delete — archetypes (crew + you) are not editable\n  const actionRow = document.getElementById('print-action-row');"

NEW = """  // Hide edit/delete — archetypes (crew + you) are not editable
  // Also hide yc-edit-forge-btn when not on You card
  const _ycBtn = document.getElementById('yc-edit-forge-btn');
  if (_ycBtn) _ycBtn.style.display = char.isUser ? 'block' : 'none';
  const actionRow = document.getElementById('print-action-row');"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] — found {count} times')
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] yc-edit-forge-btn hidden for all non-user chars')
print('\nRun:')
print('  cd ~/spiralside && git add js/app/sheet.js && git commit -m "fix: hide yc-edit-forge-btn for crew chars" && git push --force origin main')
