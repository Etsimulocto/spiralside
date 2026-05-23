import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/build.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = """  window.onForgeOpen = async () => {
    if (state.activePrintId) {
      // Load the specific print from IDB by ID
      const { dbGet } = await import('./db.js');
      const print = await dbGet('prints', state.activePrintId);
      if (print) {
        await _loadPrintDataIntoForm(print);
      } else {
        clearForgeForm();
      }
    } else {"""

NEW = """  window.onForgeOpen = async () => {
    if (state.activePrintId) {
      // you_card lives in sheets store — bypass normal print lookup
      if (state.activePrintId === 'you_card') {
        if (window.loadYouCardIntoForge) await window.loadYouCardIntoForge();
        return;
      }
      // Load the specific print from IDB by ID
      const { dbGet } = await import('./db.js');
      const print = await dbGet('prints', state.activePrintId);
      if (print) {
        await _loadPrintDataIntoForm(print);
      } else {
        clearForgeForm();
      }
    } else {"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] — found {count} times')
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] onForgeOpen now handles you_card correctly')
print('\nRun:')
print('  cd ~/spiralside && git add js/app/build.js && git commit -m "fix: onForgeOpen you_card uses sheets store not prints" && git push --force origin main')
