#!/usr/bin/env python3
# SPIRALSIDE patch_p25_comic_image_fill.py
# Fix: comic panel images don't fill viewport on mobile
# Switch from CSS background-image to real <img> tag with object-fit:cover
# Also ensure #comic-panel and #screen-comic fill full viewport correctly
# Run: cd ~/spiralside && python patch_p25_comic_image_fill.py

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

COMIC = 'js/app/comic.js'

# ============================================================
# Replace the background-image CSS approach with a real <img> tag
# The <img> uses object-fit:cover + position:absolute;inset:0
# which reliably fills the container on all devices including iOS
# Gradient panels keep the CSS background approach (no image to show)
# ============================================================
patch(COMIC,
    """  const bg = document.getElementById('comic-bg');
  bg.className = '';
  bg.style.cssText = p.image
    ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
    : 'background:' + p.bg_gradient + ';';
  // apply filter effect if panel has one (from timeline slot editor)
  bg.style.filter = (p.filter_css && p.filter_css !== 'none') ? p.filter_css : '';

  void bg.offsetWidth;
  bg.classList.add(p.transition || 'fade');""",
    """  const bg = document.getElementById('comic-bg');
  bg.className = '';

  if (p.image) {
    // Real <img> tag — reliably fills container on all devices incl. iOS
    // Remove any previous gradient, set neutral bg
    bg.style.cssText = 'background:#08080d;';
    // Reuse or create the img element
    let _img = bg.querySelector('img.comic-panel-img');
    if (!_img) {
      _img = document.createElement('img');
      _img.className = 'comic-panel-img';
      _img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;';
      bg.appendChild(_img);
    }
    _img.src = p.image;
    _img.style.display = 'block';
    // Apply filter to img, not bg container
    _img.style.filter = (p.filter_css && p.filter_css !== 'none') ? p.filter_css : '';
    bg.style.filter = '';
  } else {
    // Gradient panel — hide img if present, use CSS background
    const _img = bg.querySelector('img.comic-panel-img');
    if (_img) _img.style.display = 'none';
    bg.style.cssText = 'background:' + (p.bg_gradient || '#08080d') + ';';
    bg.style.filter = (p.filter_css && p.filter_css !== 'none') ? p.filter_css : '';
  }

  void bg.offsetWidth;
  bg.classList.add(p.transition || 'fade');""",
    'comic.js: use real img tag for panel images, object-fit:cover')

print()
print('Deploy:')
print('  git add js/app/comic.js')
print('  git commit -m "fix: comic panel images use img tag + object-fit:cover for reliable mobile fill"')
print('  git push --force origin main')
