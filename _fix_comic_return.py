#!/usr/bin/env python3
# _fix_comic_return.py
# 1. comic.js: playCustomComic accepts optional onDone, calls it after fade
# 2. library.js: passes openBookTimeline as the onDone callback

import os, sys

BASE = os.path.expanduser('~/spiralside/js/app')

# ── 1. comic.js ───────────────────────────────────────────────
comic_path = os.path.join(BASE, 'comic.js')
with open(comic_path, 'r', encoding='utf-8') as f:
    comic = f.read()

OLD = '''export function playCustomComic(customPanels) {
  if (!customPanels || !customPanels.length) return;
  PANELS = customPanels;
  comicPanel = 0;
  const screen = document.getElementById('screen-comic');
  screen.classList.remove('fade-out');
  screen.style.display = '';
  const skipBtn = document.getElementById('comic-skip');
  if (skipBtn) skipBtn.classList.remove('visible');
  const onFinish = () => {
    screen.classList.add('fade-out');
    setTimeout(() => { screen.style.display = 'none'; }, 500);
  };'''

NEW = '''export function playCustomComic(customPanels, onDone) {
  if (!customPanels || !customPanels.length) return;
  PANELS = customPanels;
  comicPanel = 0;
  const screen = document.getElementById('screen-comic');
  screen.classList.remove('fade-out');
  screen.style.display = '';
  const skipBtn = document.getElementById('comic-skip');
  if (skipBtn) skipBtn.classList.remove('visible');
  const onFinish = () => {
    screen.classList.add('fade-out');
    setTimeout(() => {
      screen.style.display = 'none';
      if (onDone) onDone();  // jump back to wherever we came from
    }, 500);
  };'''

if OLD not in comic:
    print('[ERROR] playCustomComic block not found in comic.js')
    sys.exit(1)

comic = comic.replace(OLD, NEW)
with open(comic_path, 'w', encoding='utf-8') as f:
    f.write(comic)
print('[OK] comic.js: onDone callback wired after fade')

# ── 2. library.js ─────────────────────────────────────────────
lib_path = os.path.join(BASE, 'library.js')
with open(lib_path, 'r', encoding='utf-8') as f:
    lib = f.read()

if '() => openBookTimeline(returnId)' in lib:
    print('[SKIP] library.js already passes return callback')
else:
    OLD2 = '''  closeTimeline();
  if (window.playCustomComic) window.playCustomComic(comicPanels);
  else alert('Comic engine not ready.');'''

    NEW2 = '''  const returnId = viewingBookId;
  closeTimeline();
  if (window.playCustomComic) {
    window.playCustomComic(comicPanels, () => openBookTimeline(returnId));
  } else {
    alert('Comic engine not ready.');
  }'''

    if OLD2 not in lib:
        print('[ERROR] playCustomComic call not found in library.js')
        sys.exit(1)

    lib = lib.replace(OLD2, NEW2)
    with open(lib_path, 'w', encoding='utf-8') as f:
        f.write(lib)
    print('[OK] library.js: passes openBookTimeline as onDone callback')

print('\n[DONE] Push:')
print('  git add . && git commit -m "fix: return to timeline after comic playback" && git push --force origin main')
