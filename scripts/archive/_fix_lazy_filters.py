#!/usr/bin/env python3
# _fix_lazy_filters.py
# 1. Remove loading="lazy" from ALL images in library.js (data: URLs don't need it)
# 2. Ensure filter_css is passed in playTimeline comic panels

import os, sys

BASE = os.path.expanduser('~/spiralside/js/app')
lib_path = os.path.join(BASE, 'library.js')

with open(lib_path, 'r', encoding='utf-8') as f:
    lib = f.read()

original = lib

# ── 1. Remove loading="lazy" everywhere ───────────────────────
lib = lib.replace(' loading="lazy"', '')
lib = lib.replace(" loading='lazy'", '')

removed = original.count('loading="lazy"') + original.count("loading='lazy'")
print(f'[OK] Removed {removed} lazy loading attribute(s)')

# ── 2. Check filter_css is present in playTimeline ────────────
if 'filter_css' in lib:
    print('[OK] filter_css already present in playTimeline')
else:
    print('[ADDING] filter_css missing — patching playTimeline')
    OLD = '''      const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
      const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
      return {
        image:      p?.dataURL || '',
        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };'''

    NEW = '''      const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
      const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
      const fObj       = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
      return {
        image:      p?.dataURL || '',
        filter_css: fObj.css,
        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };'''

    if OLD in lib:
        lib = lib.replace(OLD, NEW)
        print('[OK] filter_css added to playTimeline')
    else:
        print('[WARN] Could not find exact caption block — filter_css may need manual check')

with open(lib_path, 'w', encoding='utf-8') as f:
    f.write(lib)

# ── 3. Check comic.js has the filter apply line ───────────────
comic_path = os.path.join(BASE, 'comic.js')
with open(comic_path, 'r', encoding='utf-8') as f:
    comic = f.read()

if 'filter_css' in comic:
    print('[OK] comic.js already applies filter_css')
else:
    print('[ADDING] filter_css not in comic.js — patching comicRender')
    OLD_C = '''  bg.style.cssText = p.image
    ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
    : 'background:' + p.bg_gradient + ';';'''

    NEW_C = '''  bg.style.cssText = p.image
    ? 'background-image:url(' + p.image + ');background-size:cover;background-position:center;'
    : 'background:' + p.bg_gradient + ';';
  bg.style.filter = (p.filter_css && p.filter_css !== 'none') ? p.filter_css : '';'''

    if OLD_C in comic:
        comic = comic.replace(OLD_C, NEW_C)
        with open(comic_path, 'w', encoding='utf-8') as f:
            f.write(comic)
        print('[OK] comic.js: filter_css applied to #comic-bg')
    else:
        print('[WARN] Could not find cssText block in comic.js')

print('\n[DONE] Push:')
print('  git add . && git commit -m "fix: remove lazy loading, apply filters in comic playback" && git push --force origin main')
