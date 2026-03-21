#!/usr/bin/env python3
# _fix_filters.py
# Makes panel filters show during comic playback
# 1. library.js playTimeline: pass filter css in each panel object
# 2. comic.js comicRender: apply filter to #comic-bg element

import os, sys

BASE = os.path.expanduser('~/spiralside/js/app')

# ── 1. library.js: pass filter in comicPanels ─────────────────
lib_path = os.path.join(BASE, 'library.js')
with open(lib_path, 'r', encoding='utf-8') as f:
    lib = f.read()

OLD_LIB = '''      const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
      const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
      return {
        image:    p?.dataURL || '',
        dialogue: capText ? [{ speaker: capSpeaker, text: capText }] : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };'''

NEW_LIB = '''      const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
      const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
      const fObj       = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
      return {
        image:      p?.dataURL || '',
        filter_css: fObj.css,
        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };'''

if OLD_LIB not in lib:
    print('[ERROR] comicPanels image block not found in library.js')
    sys.exit(1)

lib = lib.replace(OLD_LIB, NEW_LIB)
with open(lib_path, 'w', encoding='utf-8') as f:
    f.write(lib)
print('[OK] library.js: filter_css passed in each comic panel')

# ── 2. comic.js: apply filter to #comic-bg ────────────────────
comic_path = os.path.join(BASE, 'comic.js')
with open(comic_path, 'r', encoding='utf-8') as f:
    comic = f.read()

OLD_COMIC = '''  const bg = document.getElementById('comic-bg');
  bg.className = '';
  bg.style.cssText = p.image
    ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
    : 'background:' + p.bg_gradient + ';';'''

NEW_COMIC = '''  const bg = document.getElementById('comic-bg');
  bg.className = '';
  bg.style.cssText = p.image
    ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
    : 'background:' + p.bg_gradient + ';';
  // apply filter effect if panel has one (from timeline slot editor)
  bg.style.filter = (p.filter_css && p.filter_css !== 'none') ? p.filter_css : '';'''

if OLD_COMIC not in comic:
    print('[ERROR] comic-bg cssText block not found in comic.js')
    sys.exit(1)

comic = comic.replace(OLD_COMIC, NEW_COMIC)
with open(comic_path, 'w', encoding='utf-8') as f:
    f.write(comic)
print('[OK] comic.js: filter applied to #comic-bg during render')

print('\n[DONE] Push:')
print('  git add . && git commit -m "fix: panel filters apply during comic playback" && git push --force origin main')
