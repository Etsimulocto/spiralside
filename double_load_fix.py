import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/sheet.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = """      _ycForgeBtn.addEventListener('click', async () => {
        const { initForgeView } = await import('./views/forge.js');
        initForgeView();
        if (window.loadYouCardIntoForge) await window.loadYouCardIntoForge();
        if (window.switchView) window.switchView('forge');
      });"""

NEW = """      _ycForgeBtn.addEventListener('click', async () => {
        // Set activePrintId first — onForgeOpen will handle the load
        const { state } = await import('./state.js');
        state.activePrintId = 'you_card';
        const { initForgeView } = await import('./views/forge.js');
        initForgeView();
        if (window.switchView) window.switchView('forge');
      });"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] — found {count} times')
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] button sets activePrintId, lets onForgeOpen handle load — no double call')
print('\nRun:')
print('  cd ~/spiralside && git add js/app/sheet.js && git commit -m "fix: you_card button sets activePrintId, onForgeOpen handles load" && git push --force origin main')
