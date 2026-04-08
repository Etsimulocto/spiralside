#!/usr/bin/env python3
# SPIRALSIDE patch_p18_pass_tb_style_props.py
# Fix: playTimeline maps tb to dialogue but omits custom style props
# borderColor/borderWidth/borderRadius/bgOpacity/fontSize/borderStyle never passed through
# Run: cd ~/spiralside && python patch_p18_pass_tb_style_props.py

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

LIB = 'js/app/library.js'

# ============================================================
# The map in playTimeline only passes speaker/text/style/pos
# Need to spread all tb style properties through to the comic viewer
# ============================================================
patch(LIB,
    "          .map(tb => ({ speaker: tb.speaker || 'narrator', text: tb.text.trim(), style: tb.style, pos: tb.pos }));",
    """          .map(tb => ({
            speaker:      tb.speaker      || 'narrator',
            text:         tb.text.trim(),
            style:        tb.style,
            pos:          tb.pos,
            // custom visual style properties — passed through to _bubbleStyle in comic.js
            borderColor:  tb.borderColor  || null,
            borderWidth:  tb.borderWidth  || null,
            borderStyle:  tb.borderStyle  || null,
            borderRadius: tb.borderRadius || null,
            bgOpacity:    tb.bgOpacity    !== undefined ? tb.bgOpacity : null,
            fontSize:     tb.fontSize     || null,
          }));""",
    'library.js: pass all tb style props through playTimeline')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "fix: pass text box border/radius/opacity/size props through to comic viewer"')
print('  git push --force origin main')
