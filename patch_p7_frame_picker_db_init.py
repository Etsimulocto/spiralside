#!/usr/bin/env python3
# SPIRALSIDE patch_p7_frame_picker_db_init.py
# Fix: openFramePicker throws "[frames] db not ready" when Frames tab
# has never been visited. Lazy-init the IDB connection in openFramePicker.
# Run: cd ~/spiralside && python patch_p7_frame_picker_db_init.py

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

FRAMES = 'js/frames/frames.js'

# ============================================================
# Fix: lazy-init _dbFns inside openFramePicker so it works
# even if initFramesView has never been called.
# Anchor: the start of openFramePicker's body.
# ============================================================
OLD = """export async function openFramePicker(opts = {}) {
  opts = Object.assign({ surface: null, onSelect: null }, opts);

  // Remove any existing picker
  document.getElementById('ss-frame-picker')?.remove();

  const frames = await getAllFrames();"""

NEW = """export async function openFramePicker(opts = {}) {
  opts = Object.assign({ surface: null, onSelect: null }, opts);

  // ── Lazy-init IDB so this works even if Frames tab was never visited ──
  if (!_dbFns) {
    try {
      const { dbGet, dbSet, dbGetAll, dbDelete } = await import('../app/db.js');
      _dbFns = { get: dbGet, set: dbSet, getAll: dbGetAll, del: dbDelete };
    } catch(e) {
      console.warn('[frames] db lazy-init failed:', e);
    }
  }

  // Remove any existing picker
  document.getElementById('ss-frame-picker')?.remove();

  const frames = await getAllFrames();"""

patch(FRAMES, OLD, NEW, 'frames.js: lazy-init DB in openFramePicker')

print()
print('Deploy:')
print('  git add js/frames/frames.js')
print('  git commit -m "fix: lazy-init frames IDB in openFramePicker so it works without visiting Frames tab"')
print('  git push --force origin main')
