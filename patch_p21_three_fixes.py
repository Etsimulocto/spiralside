#!/usr/bin/env python3
# SPIRALSIDE patch_p21_three_fixes.py
# Fix 1: empty textBoxes still shows old dialogue box — hide it when no lines
# Fix 2: positioned overlays accumulate across panels — clear on EVERY panel change
# Fix 3: playTimeline filters out p.image panels with no dialogue — keep all image panels
# Run: cd ~/spiralside && python patch_p21_three_fixes.py

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

LIB   = 'js/app/library.js'
COMIC = 'js/app/comic.js'

# ============================================================
# FIX 1 (library.js) — playTimeline: keep ALL image panels
# regardless of whether they have dialogue
# Was: .filter(p => p.dialogue?.length || p.image)
# Bug: image panels with empty textBoxes have dialogue=[] so they get dropped
# Fix: keep all image panels; only filter out text-card panels with no text
# ============================================================
patch(LIB,
    "  }).filter(p => p.dialogue?.length || p.image);",
    "  }).filter(p => p.image || p.dialogue?.length);  // keep all image panels even with no dialogue",
    'library.js: keep image panels with no dialogue in playTimeline')

# ============================================================
# FIX 2 (comic.js) — clear positioned overlays on EVERY panel
# render, not just when switching panels (was only in comicRender
# but overlays from prior panel can leak if not cleared first)
# Also: always clear overlays at the TOP of comicRender before
# doing anything else
# ============================================================
patch(COMIC,
    """  // Clear positioned text overlays from previous panel
  _clearPositionedOverlays();
  // Reset dialogue box visibility
  const _dlg = document.getElementById('comic-dialogue');
  if (_dlg) _dlg.style.visibility = '';
  // If all lines have pos, hide dialogue box preemptively
  const _lines = p.dialogue || [];
  if (_lines.length && _lines.every(l => l.pos)) {
    if (_dlg) _dlg.style.visibility = 'hidden';
  }

  comicLineIdx = 0;
  comicTypeLine(_lines, 0, onFinish);""",
    """  // Always clear positioned overlays from any previous panel first
  _clearPositionedOverlays();

  const _dlg = document.getElementById('comic-dialogue');
  const _lines = p.dialogue || [];

  if (!_lines.length) {
    // No dialogue at all — hide dialogue box, nothing to type
    if (_dlg) _dlg.style.visibility = 'hidden';
    comicLineIdx = 0;
    return;
  }

  if (_lines.every(l => l.pos)) {
    // All lines are positioned overlays — hide standard dialogue box
    if (_dlg) _dlg.style.visibility = 'hidden';
  } else {
    // At least one line uses the standard box — show it, clear contents
    if (_dlg) {
      _dlg.style.visibility = '';
      const _sp = document.getElementById('comic-speaker');
      const _tx = document.getElementById('comic-text');
      if (_sp) _sp.textContent = '';
      if (_tx) _tx.textContent = '';
    }
  }

  comicLineIdx = 0;
  comicTypeLine(_lines, 0, onFinish);""",
    'comic.js: always clear overlays; hide dialogue box when no lines or all positioned')

# ============================================================
# FIX 3 (comic.js) — comicTypeLine positioned branch:
# don't hide dialogue box mid-sequence if some lines use it
# (only hide if ALL lines for this panel are positioned)
# ============================================================
patch(COMIC,
    """  if (line.pos) {
    // ── POSITIONED TEXT BOX ─────────────────────────────────
    // Clear previous overlays for this panel, then render at position
    // (keep overlays from earlier lines — accumulate them)
    const textEl = _renderPositionedBubble(line);
    if (!textEl) { comicTyping = null; return; }

    // Hide the standard dialogue box for positioned lines
    const dlg = document.getElementById('comic-dialogue');
    if (dlg) dlg.style.visibility = 'hidden';""",
    """  if (line.pos) {
    // ── POSITIONED TEXT BOX ─────────────────────────────────
    // Accumulate overlays within this panel (do NOT clear between lines)
    const textEl = _renderPositionedBubble(line);
    if (!textEl) { comicTyping = null; return; }
    // Dialogue box visibility already set correctly in comicRender — don't touch it here""",
    'comic.js: positioned branch — stop re-hiding dialogue box per line')

print()
print('Deploy:')
print('  git add js/app/library.js js/app/comic.js')
print('  git commit -m "fix: keep image panels with no dialogue; clear overlays properly; hide dialogue box when empty"')
print('  git push --force origin main')
