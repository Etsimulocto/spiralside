#!/usr/bin/env python3
# SPIRALSIDE patch_p19_tb_bg_color_swatch.py
# Add BG color swatch to text box style controls (next to border color swatch)
# Also pass bgColor through playTimeline and apply in _bubbleStyle
# Run: cd ~/spiralside && python patch_p19_tb_bg_color_swatch.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p,'r',encoding='utf-8') as f: return f.read().replace('\r\n','\n')
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)
def patch(path, old, new, label):
    src = read(path); old=old.replace('\r\n','\n'); new=new.replace('\r\n','\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx=src.find(old[:30])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:60])))
        sys.exit(1)
    if src.count(old)>1: print(f'[DUPE] {label}'); sys.exit(1)
    write(path, src.replace(old, new)); print(f'[OK] {label}')

LIB   = 'js/app/library.js'
COMIC = 'js/app/comic.js'

# ============================================================
# 1. LIBRARY.JS — add BG color swatch after border color swatch
# ============================================================
patch(LIB,
    """    // Border color swatch
    const colDiv = document.createElement('div');
    colDiv.className = 'tb-swatch';
    const colBg = document.createElement('div');
    colBg.className = 'tb-swatch-bg';
    const defaultCol = tb.borderColor || _speakerColor(tb.speaker);
    colBg.style.background = defaultCol;
    const colInput = document.createElement('input');
    colInput.type = 'color';
    colInput.value = defaultCol;
    colInput.addEventListener('input', () => {
      tb.borderColor = colInput.value;
      colBg.style.background = colInput.value;
      _autoSaveTB();
    });
    colDiv.appendChild(colBg); colDiv.appendChild(colInput);
    styleRow1.appendChild(colDiv);""",
    """    // Border color swatch
    const colDiv = document.createElement('div');
    colDiv.className = 'tb-swatch';
    colDiv.title = 'border color';
    const colBg = document.createElement('div');
    colBg.className = 'tb-swatch-bg';
    const defaultCol = tb.borderColor || _speakerColor(tb.speaker);
    colBg.style.background = defaultCol;
    const colInput = document.createElement('input');
    colInput.type = 'color';
    colInput.value = defaultCol;
    colInput.addEventListener('input', () => {
      tb.borderColor = colInput.value;
      colBg.style.background = colInput.value;
      _autoSaveTB();
    });
    colDiv.appendChild(colBg); colDiv.appendChild(colInput);
    styleRow1.appendChild(colDiv);

    // BG color swatch
    const bgColDiv = document.createElement('div');
    bgColDiv.className = 'tb-swatch';
    bgColDiv.title = 'background color';
    // Checkerboard indicator for transparent
    bgColDiv.style.backgroundImage = 'linear-gradient(45deg,#333 25%,transparent 25%,transparent 75%,#333 75%),linear-gradient(45deg,#333 25%,transparent 25%,transparent 75%,#333 75%)';
    bgColDiv.style.backgroundSize = '6px 6px';
    bgColDiv.style.backgroundPosition = '0 0,3px 3px';
    const bgColBg = document.createElement('div');
    bgColBg.className = 'tb-swatch-bg';
    const defaultBgCol = tb.bgColor || '#0a0a0f';
    bgColBg.style.background = defaultBgCol;
    bgColBg.style.opacity = tb.bgOpacity !== undefined ? tb.bgOpacity / 100 : 0.88;
    const bgColInput = document.createElement('input');
    bgColInput.type = 'color';
    bgColInput.value = defaultBgCol;
    bgColInput.addEventListener('input', () => {
      tb.bgColor = bgColInput.value;
      bgColBg.style.background = bgColInput.value;
      _autoSaveTB();
    });
    bgColDiv.appendChild(bgColBg); bgColDiv.appendChild(bgColInput);
    styleRow1.appendChild(bgColDiv);""",
    'library.js: add BG color swatch to text box style row')

# ============================================================
# 2. LIBRARY.JS — pass bgColor through playTimeline
# ============================================================
patch(LIB,
    """            bgOpacity:    tb.bgOpacity    !== undefined ? tb.bgOpacity : null,
            fontSize:     tb.fontSize     || null,""",
    """            bgOpacity:    tb.bgOpacity    !== undefined ? tb.bgOpacity : null,
            bgColor:      tb.bgColor      || null,
            fontSize:     tb.fontSize     || null,""",
    'library.js: pass bgColor through playTimeline')

# ============================================================
# 3. COMIC.JS — use bgColor in _bubbleStyle
# ============================================================
patch(COMIC,
    """  if (line.borderColor || line.borderWidth || line.borderRadius || line.bgOpacity !== undefined) {
    const bg = 'rgba(10,10,14,' + (bgOp !== null ? bgOp : 0.88) + ')';""",
    """  if (line.borderColor || line.borderWidth || line.borderRadius || line.bgOpacity !== undefined || line.bgColor) {
    // Parse bgColor into rgba with opacity, or use default dark
    let bg;
    if (line.bgColor) {
      // Convert hex to rgb + apply opacity
      const hex = line.bgColor.replace('#','');
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      const a = bgOp !== null ? bgOp : 0.88;
      bg = 'rgba('+r+','+g+','+b+','+a+')';
    } else {
      bg = 'rgba(10,10,14,' + (bgOp !== null ? bgOp : 0.88) + ')';
    }""",
    'comic.js: use bgColor in _bubbleStyle')

# ============================================================
# 4. COMIC.JS — also declare bgOp before the condition check
#    (it's used inside the block, must be declared before)
# ============================================================
patch(COMIC,
    """  const bColor  = line.borderColor  || speakerColor || '#00F6D6';
  const bWidth  = line.borderWidth  || '2px';
  const bStyle  = line.borderStyle  || 'solid';
  const bRadius = line.borderRadius || null;  // null = use style preset default
  const bgOp    = line.bgOpacity    !== undefined ? line.bgOpacity / 100 : null;
  const fSize   = line.fontSize     || null;""",
    """  const bColor  = line.borderColor  || speakerColor || '#00F6D6';
  const bWidth  = line.borderWidth  || '2px';
  const bStyle  = line.borderStyle  || 'solid';
  const bRadius = line.borderRadius || null;  // null = use style preset default
  const bgOp    = line.bgOpacity    !== undefined ? line.bgOpacity / 100 : null;
  const fSize   = line.fontSize     || null;
  // bgColor is handled inside the custom block below""",
    'comic.js: comment noting bgColor usage')

print()
print('Deploy:')
print('  git add js/app/library.js js/app/comic.js')
print('  git commit -m "feat: bg color swatch on text boxes; passes through to comic viewer"')
print('  git push --force origin main')
