import sys
ROOT = 'C:/Users/quart/spiralside'

def patch(fp, old, new, label):
    full = ROOT + '/' + fp
    with open(full, 'r', encoding='utf-8') as f:
        src = f.read()
    src = src.replace('\r\n', '\n')
    count = src.count(old)
    if count != 1:
        print(f'[MISS] {label} — found {count} times')
        sys.exit(1)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new, 1))
    print(f'[OK]   {label}')

# ── PATCH 1: sheet.js — hide yc-edit-forge-btn for non-user chars ──
patch('js/app/sheet.js',
"    _ycForgeBtn.style.display = 'block';",
"    _ycForgeBtn.style.display = char.isUser ? 'block' : 'none';",
'sheet.js — hide edit in forge for crew/archetypes')

# ── PATCH 2: build.js — debounce onForgeOpen ──
patch('js/app/build.js',
"  window.onForgeOpen = async () => {",
"""  let _forgeOpenBusy = false;
  window.onForgeOpen = async () => {
    if (_forgeOpenBusy) return;
    _forgeOpenBusy = true;
    setTimeout(() => { _forgeOpenBusy = false; }, 800);""",
'build.js — debounce onForgeOpen')

print('\nRun:')
print('  cd ~/spiralside && git add js/app/sheet.js js/app/build.js && git commit -m "fix: hide forge button for crew archetypes + debounce onForgeOpen" && git push --force origin main')
