#!/usr/bin/env python3
# SPIRALSIDE patch_p17_text_box_style_controls.py
# Add per-text-box visual style controls:
#   border color swatch, border width, border style, corner radius, bg opacity, text size
# Run: cd ~/spiralside && python patch_p17_text_box_style_controls.py

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

LIB  = 'js/app/library.js'
COMIC = 'js/app/comic.js'

# ============================================================
# 1. LIBRARY.JS CSS — add text box style controls styles
# ============================================================
patch(LIB,
    "    .tb-add-btn:hover { border-color:var(--teal); color:var(--teal); }",
    """    .tb-add-btn:hover { border-color:var(--teal); color:var(--teal); }
    /* text box style controls */
    .tb-style-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:2px; }
    .tb-swatch {
      width:24px; height:24px; border-radius:6px; border:2px solid var(--border);
      cursor:pointer; overflow:hidden; position:relative; flex-shrink:0;
    }
    .tb-swatch-bg { width:100%; height:100%; }
    .tb-swatch input[type=color] {
      position:absolute; inset:-4px; width:calc(100%+8px);
      height:calc(100%+8px); border:none; cursor:pointer; opacity:0;
    }
    .tb-mini-chip {
      padding:3px 7px; border-radius:4px; font-size:0.55rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      transition:all 0.12s; white-space:nowrap;
    }
    .tb-mini-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }
    .tb-opacity-wrap { display:flex; align-items:center; gap:4px; flex:1; min-width:80px; }
    .tb-opacity-label { font-size:0.5rem; color:var(--subtext); letter-spacing:0.08em; white-space:nowrap; }
    .tb-opacity-slider { flex:1; accent-color:var(--teal); height:3px; }
    .tb-section-divider {
      font-size:0.48rem; letter-spacing:0.14em; text-transform:uppercase;
      color:var(--subtext); opacity:0.6; margin-top:4px;
    }""",
    'library.js: text box style control CSS')

# ============================================================
# 2. LIBRARY.JS — renderTextBoxList: add style controls row after opts
# ============================================================
patch(LIB,
    """    item.appendChild(hdr);
    item.appendChild(txt);
    item.appendChild(opts);
    list.appendChild(item);""",
    """    // ── STYLE CONTROLS ──────────────────────────────────────
    const styleRow1 = document.createElement('div');
    styleRow1.className = 'tb-style-row';

    // Border color swatch
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
    styleRow1.appendChild(colDiv);

    // Border width chips
    [['thin','1px'],['med','2px'],['thick','3px'],['none','0']].forEach(([lbl,val]) => {
      const c = document.createElement('button');
      c.className = 'tb-mini-chip' + ((tb.borderWidth||'2px')===val?' active':'');
      c.textContent = lbl;
      c.addEventListener('click', () => {
        tb.borderWidth = val;
        styleRow1.querySelectorAll('.tb-mini-chip[data-bw]').forEach(x=>x.classList.remove('active'));
        c.classList.add('active');
        _autoSaveTB();
      });
      c.dataset.bw = val;
      styleRow1.appendChild(c);
    });

    // Opacity slider
    const opWrap = document.createElement('div');
    opWrap.className = 'tb-opacity-wrap';
    const opLbl = document.createElement('div');
    opLbl.className = 'tb-opacity-label';
    opLbl.textContent = 'bg';
    const opSlider = document.createElement('input');
    opSlider.type = 'range'; opSlider.min = 0; opSlider.max = 100;
    opSlider.value = tb.bgOpacity !== undefined ? tb.bgOpacity : 88;
    opSlider.className = 'tb-opacity-slider';
    opSlider.addEventListener('input', () => { tb.bgOpacity = parseInt(opSlider.value); _autoSaveTB(); });
    opWrap.appendChild(opLbl); opWrap.appendChild(opSlider);
    styleRow1.appendChild(opWrap);

    const styleRow2 = document.createElement('div');
    styleRow2.className = 'tb-style-row';

    // Corner radius chips
    const corners = [['sharp','0'],['soft','8px'],['pill','20px'],['bubble','3px 12px 12px 12px']];
    corners.forEach(([lbl,val]) => {
      const c = document.createElement('button');
      c.className = 'tb-mini-chip' + ((tb.borderRadius||'3px 12px 12px 12px')===val?' active':'');
      c.textContent = lbl;
      c.addEventListener('click', () => {
        tb.borderRadius = val;
        styleRow2.querySelectorAll('.tb-mini-chip[data-cr]').forEach(x=>x.classList.remove('active'));
        c.classList.add('active');
        _autoSaveTB();
      });
      c.dataset.cr = val;
      styleRow2.appendChild(c);
    });

    // Text size chips
    [['sm','0.72rem'],['md','0.84rem'],['lg','1rem']].forEach(([lbl,val]) => {
      const c = document.createElement('button');
      c.className = 'tb-mini-chip' + ((tb.fontSize||'0.84rem')===val?' active':'');
      c.textContent = lbl;
      c.addEventListener('click', () => {
        tb.fontSize = val;
        styleRow2.querySelectorAll('.tb-mini-chip[data-fs]').forEach(x=>x.classList.remove('active'));
        c.classList.add('active');
        _autoSaveTB();
      });
      c.dataset.fs = val;
      styleRow2.appendChild(c);
    });

    // Border style chips
    [['solid','solid'],['dashed','dashed'],['dotted','dotted']].forEach(([lbl,val]) => {
      const c = document.createElement('button');
      c.className = 'tb-mini-chip' + ((tb.borderStyle||'solid')===val?' active':'');
      c.textContent = lbl;
      c.addEventListener('click', () => {
        tb.borderStyle = val;
        styleRow2.querySelectorAll('.tb-mini-chip[data-bs]').forEach(x=>x.classList.remove('active'));
        c.classList.add('active');
        _autoSaveTB();
      });
      c.dataset.bs = val;
      styleRow2.appendChild(c);
    });

    item.appendChild(hdr);
    item.appendChild(txt);
    item.appendChild(opts);
    item.appendChild(styleRow1);
    item.appendChild(styleRow2);
    list.appendChild(item);""",
    'library.js: text box style controls in renderTextBoxList')

# ============================================================
# 3. COMIC.JS — _bubbleStyle: use per-box style properties when present
#    tb style object fields: borderColor, borderWidth, borderStyle,
#    borderRadius, bgOpacity, fontSize
# ============================================================
patch(COMIC,
    """function _bubbleStyle(style, speakerColor) {
  // No position here — positioning is on the wrap div
  const borderColor = speakerColor || '#00F6D6';
  switch(style) {
    case 'caption':
      return 'background:rgba(10,10,14,0.88);border:none;border-top:2px solid '+borderColor+';padding:8px 12px;font-size:0.82rem;color:#F3F7FF;';
    case 'narration':
      return 'background:rgba(10,10,14,0.82);border:1px solid rgba(243,247,255,0.2);border-radius:4px;padding:8px 12px;font-size:0.78rem;color:#F3F7FF;font-style:italic;';
    case 'shout':
      return 'background:rgba(255,75,203,0.12);border:2px solid '+borderColor+';border-radius:4px;padding:10px 14px;font-size:0.96rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.04em;';
    case 'dialogue':
    default:
      return 'background:rgba(10,10,14,0.88);border:2px solid '+borderColor+';border-radius:3px 12px 12px 12px;padding:10px 14px;';
  }
}""",
    """function _bubbleStyle(line, speakerColor) {
  // If line has explicit style properties (from text box composer), use them directly
  const bColor  = line.borderColor  || speakerColor || '#00F6D6';
  const bWidth  = line.borderWidth  || '2px';
  const bStyle  = line.borderStyle  || 'solid';
  const bRadius = line.borderRadius || null;  // null = use style preset default
  const bgOp    = line.bgOpacity    !== undefined ? line.bgOpacity / 100 : null;
  const fSize   = line.fontSize     || null;

  const style   = line.style || 'dialogue';

  // If user has customized border/radius/opacity, build fully custom style
  if (line.borderColor || line.borderWidth || line.borderRadius || line.bgOpacity !== undefined) {
    const bg = 'rgba(10,10,14,' + (bgOp !== null ? bgOp : 0.88) + ')';
    const radius = bRadius || '3px 12px 12px 12px';
    const border = bWidth === '0' ? 'none' : bWidth + ' ' + bStyle + ' ' + bColor;
    const fs = fSize || '0.84rem';
    return 'background:'+bg+';border:'+border+';border-radius:'+radius+';padding:10px 14px;font-size:'+fs+';color:#F3F7FF;';
  }

  // Otherwise use style presets
  const fs = fSize || null;
  switch(style) {
    case 'caption':
      return 'background:rgba(10,10,14,0.88);border:none;border-top:2px solid '+bColor+';padding:8px 12px;font-size:'+(fs||'0.82rem')+';color:#F3F7FF;';
    case 'narration':
      return 'background:rgba(10,10,14,0.82);border:1px solid rgba(243,247,255,0.2);border-radius:4px;padding:8px 12px;font-size:'+(fs||'0.78rem')+';color:#F3F7FF;font-style:italic;';
    case 'shout':
      return 'background:rgba(255,75,203,0.12);border:2px solid '+bColor+';border-radius:4px;padding:10px 14px;font-size:'+(fs||'0.96rem')+';font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.04em;';
    case 'dialogue':
    default:
      return 'background:rgba(10,10,14,0.88);border:2px solid '+bColor+';border-radius:3px 12px 12px 12px;padding:10px 14px;font-size:'+(fs||'0.84rem')+';';
  }
}""",
    'comic.js: _bubbleStyle uses per-box style properties')

# ============================================================
# 4. COMIC.JS — _renderPositionedBubble: pass full line to _bubbleStyle
# ============================================================
patch(COMIC,
    "  bubble.style.cssText = _bubbleStyle(line.style, speakerColor);",
    "  bubble.style.cssText = _bubbleStyle(line, speakerColor);",
    'comic.js: pass full line object to _bubbleStyle')

print()
print('Deploy:')
print('  git add js/app/library.js js/app/comic.js')
print('  git commit -m "feat: per-text-box style controls — border color/width/style, corner radius, bg opacity, text size"')
print('  git push --force origin main')
