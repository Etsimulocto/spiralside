#!/usr/bin/env python3
# SPIRALSIDE PATCH p5 — fix filmstrip frame overlay anchor
# Run: cd ~/spiralside && python patch_p5_filmstrip.py

import sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read().replace('\r\n', '\n')

def write(p, c):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

LIB = 'js/app/library.js'
src = read(LIB)

# ============================================================
# Diagnostic — print actual context around div.appendChild(dot)
# ============================================================
idx = src.find('div.appendChild(dot)')
print('=== filmstrip context ===')
print(repr(src[max(0,idx-20):idx+200]))
print()

# ============================================================
# Patch — insert frame overlay after the closing } of the tag block
# From diagnostic repr:
#   "div.appendChild(dot);\n        }\n      } else {\n"
# So the real anchor is:
#   "          div.appendChild(dot);\n        }\n      } else {"
# ============================================================
OLD = "          div.appendChild(dot);\n        }\n      } else {"
NEW = """          div.appendChild(dot);
        }
        // Frame overlay on filmstrip thumbnail
        if (slot.frameSVG) {
          const fov = document.createElement('div');
          fov.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5';
          fov.innerHTML = slot.frameSVG;
          const svg = fov.querySelector('svg');
          if (svg) svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
          div.appendChild(fov);
        }
      } else {"""

if OLD not in src:
    print('[MISS] filmstrip anchor — printing 200 chars around appendChild(dot)')
    print(repr(src[max(0,idx-60):idx+200]))
    sys.exit(1)
if src.count(OLD) > 1:
    print(f'[DUPE] count={src.count(OLD)}')
    sys.exit(1)

write(LIB, src.replace(OLD, NEW))
print('[OK] library.js: frame overlay in filmstrip')

# ============================================================
# Verify playTimeline frame_svg (should already be patched)
# ============================================================
src2 = read(LIB)
if 'frame_svg:  slot.frameSVG' in src2:
    print('[OK] library.js: frame_svg in playTimeline already present')
else:
    # patch it now
    OLD_P = "        filter_css: filterObj.css,\n        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],"
    NEW_P = "        filter_css: filterObj.css,\n        frame_svg:  slot.frameSVG || null,\n        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],"
    if OLD_P in src2:
        write(LIB, src2.replace(OLD_P, NEW_P))
        print('[OK] library.js: pass frame_svg in playTimeline')
    else:
        print('[MISS] playTimeline filter_css — check manually')

print()
print('Deploy:')
print('  git add js/frames/frames.js js/app/library.js js/app/comic.js')
print('  git commit -m "feat: frames->library; frame overlay in book editor; fix caption bug"')
print('  git push --force origin main')
