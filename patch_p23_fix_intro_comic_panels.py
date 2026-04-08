#!/usr/bin/env python3
# SPIRALSIDE patch_p23_fix_intro_comic_panels.py
# Fix: intro comic (main.js IDB peek) uses old caption system
# Update to match playTimeline: textBoxes[], frame_svg, all style props
# Run: cd ~/spiralside && python patch_p23_fix_intro_comic_panels.py

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
        idx=src.find(old[:40])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:80])))
        sys.exit(1)
    if src.count(old)>1: print(f'[DUPE] {label}'); sys.exit(1)
    write(path, src.replace(old, new)); print(f'[OK] {label}')

MAIN = 'js/app/main.js'

# ============================================================
# Replace the entire comicPanels build block in the IDB peek
# Old: reads slot.caption only, no textBoxes, no frame_svg
# New: reads slot.textBoxes (with all style props) + frame_svg, falls back to caption
# ============================================================
patch(MAIN,
    """      const comicPanels = book.slots.map(slot => {
        if (slot.type === 'image') {
          const p = panelMap[slot.panelId];
          if (!p) return null;
          const fObj = FILTERS_PEEK.find(f => f.id===(slot.filter||'none')) || FILTERS_PEEK[0];
          const capText    = typeof slot.caption==='string' ? slot.caption : slot.caption?.text||'';
          const capSpeaker = typeof slot.caption==='string' ? 'narrator'   : slot.caption?.speaker||'narrator';
          return {
            image: p.dataURL, filter_css: fObj.css,
            dialogue: capText ? [{speaker:capSpeaker,text:capText}] : [],
            transition:'fade',
            bg_gradient:'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
          };
        } else if (slot.type==='text' && slot.text) {
          return {
            bg_gradient:'radial-gradient(ellipse at 50% 50%,#0a0a1a 0%,#101014 70%)',
            dialogue:[{speaker:slot.speaker||'narrator',text:slot.text}],
            transition:'fade',
          };
        }
        return null;
      }).filter(Boolean);""",
    """      const comicPanels = book.slots.map(slot => {
        if (slot.type === 'image') {
          const p = panelMap[slot.panelId];
          if (!p) return null;
          const fObj = FILTERS_PEEK.find(f => f.id===(slot.filter||'none')) || FILTERS_PEEK[0];

          // Build dialogue — textBoxes (new) or legacy caption fallback
          let dialogue = [];
          if (slot.textBoxes && slot.textBoxes.length) {
            dialogue = slot.textBoxes
              .filter(tb => tb.text && tb.text.trim())
              .map(tb => ({
                speaker:      tb.speaker      || 'narrator',
                text:         tb.text.trim(),
                style:        tb.style        || 'dialogue',
                pos:          tb.pos          || null,
                borderColor:  tb.borderColor  || null,
                borderWidth:  tb.borderWidth  || null,
                borderStyle:  tb.borderStyle  || null,
                borderRadius: tb.borderRadius || null,
                bgOpacity:    tb.bgOpacity    !== undefined ? tb.bgOpacity : null,
                bgColor:      tb.bgColor      || null,
                fontSize:     tb.fontSize     || null,
              }));
          } else {
            const capText    = typeof slot.caption==='string' ? slot.caption : slot.caption?.text||'';
            const capSpeaker = typeof slot.caption==='string' ? 'narrator'   : slot.caption?.speaker||'narrator';
            if (capText) dialogue = [{speaker:capSpeaker, text:capText}];
          }

          return {
            image:      p.dataURL,
            filter_css: fObj.css,
            frame_svg:  slot.frameSVG || null,
            dialogue,
            transition: 'fade',
            bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
          };
        } else if (slot.type==='text' && slot.text) {
          return {
            bg_gradient: 'radial-gradient(ellipse at 50% 50%,#0a0a1a 0%,#101014 70%)',
            dialogue: [{speaker:slot.speaker||'narrator', text:slot.text}],
            transition: 'fade',
          };
        }
        return null;
      }).filter(p => p !== null && (p.image || p.dialogue?.length));""",
    'main.js: intro IDB peek uses textBoxes + frame_svg + style props')

print()
print('Deploy:')
print('  git add js/app/main.js')
print('  git commit -m "fix: intro comic reads textBoxes + frame_svg from IDB, not legacy caption"')
print('  git push --force origin main')
