#!/usr/bin/env python3
# SPIRALSIDE patch_p26_comic_bg_fill.py
# Fix: comic images not filling panel — add explicit width/height to #comic-bg
# Also set object-position to top-center so portraits show the face, not feet
# Run: cd ~/spiralside && python patch_p26_comic_bg_fill.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p,'r',encoding='utf-8') as f: return f.read().replace('\r\n','\n')
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)
def patch(path, old, new, label):
    src = read(path)
    old = old.replace('\r\n','\n')
    new = new.replace('\r\n','\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx = src.find(old[:40])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:80])))
        sys.exit(1)
    if src.count(old) > 1:
        print(f'[DUPE] {label}')
        sys.exit(1)
    write(path, src.replace(old, new))
    print(f'[OK] {label}')

COMIC = 'js/app/comic.js'

# ============================================================
# Fix: give the img tag `width:100%;height:100%` via explicit style
# AND set object-position to `center top` so portrait art shows
# the important top half (face/character), not the bottom (feet)
# ============================================================
patch(COMIC,
    "_img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;';",
    "_img.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block;';",
    'comic.js: use top/left/width/height instead of inset, object-position center top')

print()
print('Deploy:')
print('  git add js/app/comic.js')
print('  git commit -m "fix: comic img uses explicit top/left/w/h, object-position center top"')
print('  git push --force origin main')
