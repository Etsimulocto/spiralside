#!/usr/bin/env python3
# SPIRALSIDE patch_p10_comic_frame_overlay.py
# Add frame_svg overlay rendering inside comicRender in comic.js
# Run: cd ~/spiralside && python patch_p10_comic_frame_overlay.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read().replace('\r\n', '\n')

def write(p, c):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

def patch(path, old, new, label):
    src = read(path)
    old = old.replace('\r\n', '\n')
    new = new.replace('\r\n', '\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx = src.find(old[:30])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[prefix not found] '+repr(old[:60])))
        sys.exit(1)
    if src.count(old) > 1:
        print(f'[DUPE] {label} count={src.count(old)}')
        sys.exit(1)
    write(path, src.replace(old, new))
    print(f'[OK] {label}')

COMIC = 'js/app/comic.js'

# ============================================================
# Anchor: the crack toggle line — unique and stable
# Insert frame_svg overlay right after it
# ============================================================
patch(COMIC,
    "  document.getElementById('comic-crack').classList.toggle('show', !!p.crack);",
    """  document.getElementById('comic-crack').classList.toggle('show', !!p.crack);

  // ── FRAME SVG OVERLAY ─────────────────────────────────────
  // Panel carries frame_svg from the book timeline frame track
  let _frmEl = document.getElementById('comic-frame-svg-overlay');
  if (p.frame_svg) {
    if (!_frmEl) {
      _frmEl = document.createElement('div');
      _frmEl.id = 'comic-frame-svg-overlay';
      _frmEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;width:100%;height:100%';
      document.getElementById('comic-panel')?.appendChild(_frmEl);
    }
    _frmEl.innerHTML = p.frame_svg;
    const _fsvg = _frmEl.querySelector('svg');
    if (_fsvg) _fsvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    _frmEl.style.display = '';
  } else if (_frmEl) {
    _frmEl.innerHTML = '';
    _frmEl.style.display = 'none';
  }""",
    'comic.js: frame_svg overlay in comicRender')

print()
print('Deploy:')
print('  git add js/app/comic.js')
print('  git commit -m "fix: render frame_svg overlay during comic playback"')
print('  git push --force origin main')
