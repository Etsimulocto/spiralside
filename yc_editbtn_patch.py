import sys
ROOT = 'C:/Users/quart/spiralside'

fp = ROOT + '/js/app/sheet.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = "    imagineBtn.style.display = 'block';\n  }"

NEW = """    imagineBtn.style.display = 'block';

    // ── EDIT IN FORGE BUTTON (You card only) ──
    let _ycForgeBtn = document.getElementById('yc-edit-forge-btn');
    if (!_ycForgeBtn) {
      _ycForgeBtn = document.createElement('button');
      _ycForgeBtn.id = 'yc-edit-forge-btn';
      _ycForgeBtn.textContent = 'edit in forge';
      _ycForgeBtn.style.cssText = [
        'width:100%','padding:11px','margin-top:6px',
        'background:var(--surface2)','border:1px solid var(--teal)',
        'border-radius:10px','color:var(--teal)',
        'font-family:var(--font-ui)','font-size:0.78rem',
        'cursor:pointer','letter-spacing:0.06em','transition:all 0.2s',
      ].join(';');
      _ycForgeBtn.addEventListener('click', async () => {
        const { initForgeView } = await import('./views/forge.js');
        initForgeView();
        if (window.loadYouCardIntoForge) await window.loadYouCardIntoForge();
        if (window.switchView) window.switchView('forge');
      });
      imagineBtn.parentNode.insertBefore(_ycForgeBtn, imagineBtn.nextSibling);
    }
    _ycForgeBtn.style.display = 'block';
  }"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] anchor found {count} times')
    sys.exit(1)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] yc-edit-forge-btn added to You card path')
