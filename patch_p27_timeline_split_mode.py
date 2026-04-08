#!/usr/bin/env python3
# SPIRALSIDE patch_p27_timeline_split_mode.py
# Fix: timeline-overlay always covers full viewport (position:fixed;inset:0)
# When split mode is active, it should cover only its half of the screen.
# Solution: detect split mode, set timeline-overlay position:absolute
# inside its nearest positioned ancestor (the split panel).
# Run: cd ~/spiralside && python patch_p27_timeline_split_mode.py

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
        idx = src.find(old[:50])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:80])))
        sys.exit(1)
    if src.count(old) > 1:
        print(f'[DUPE] {label}')
        sys.exit(1)
    write(path, src.replace(old, new))
    print(f'[OK] {label}')

# ── library.js ───────────────────────────────────────────────────
LIB = 'js/app/library.js'

# 1. CSS: add position:absolute variant class for split mode
#    The overlay default stays position:fixed for normal mode.
#    When split mode is active we add class 'split-scoped' which
#    switches to position:absolute so it fills only the panel it lives in.
patch(LIB,
    "    /* ── TIMELINE OVERLAY ── */\n    #timeline-overlay {\n      position:fixed; inset:0; z-index:300;\n      background:var(--bg); display:flex; flex-direction:column;\n      transform:translateY(100%);\n      transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);\n    }\n    #timeline-overlay.open { transform:translateY(0); }",
    """    /* ── TIMELINE OVERLAY ── */
    #timeline-overlay {
      position:fixed; inset:0; z-index:300;
      background:var(--bg); display:flex; flex-direction:column;
      transform:translateY(100%);
      transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
    }
    #timeline-overlay.open { transform:translateY(0); }
    /* split mode: overlay scopes to its panel container, not full viewport */
    #timeline-overlay.split-scoped {
      position:absolute;
      /* inset:0 already set, no change needed — absolute fills positioned parent */
    }""",
    'library.js CSS: add split-scoped class for position:absolute in split mode')

# 2. openBookTimeline: after adding 'open' class, scope overlay to split panel if active
patch(LIB,
    "  renderStrip(book);\n  showSlotEmpty();\n  document.getElementById('timeline-overlay').classList.add('open');\n  updateIntroBtn();  // reflect whether this book is the current intro",
    """  renderStrip(book);
  showSlotEmpty();
  const _tlo = document.getElementById('timeline-overlay');
  // ── SPLIT MODE SCOPING ────────────────────────────────────────
  // When split mode is active, the library view lives inside a .split-panel
  // div that is position:relative. Moving the overlay to that parent lets
  // it cover only that half-screen panel instead of the whole viewport.
  const _splitRoot = document.getElementById('split-root');
  const _inSplit   = _splitRoot && _splitRoot.style.display !== 'none';
  if (_inSplit) {
    // Find which split panel contains #view-library
    const _libView = document.getElementById('view-library');
    const _panel   = _libView?.closest('.split-panel');
    if (_panel && _tlo.parentElement !== _panel) {
      _panel.appendChild(_tlo);         // move overlay into the split panel
      _panel.style.position = 'relative'; // ensure panel is positioned ancestor
    }
    _tlo.classList.add('split-scoped');
  } else {
    // Normal mode: ensure overlay is on body
    if (_tlo.parentElement !== document.body) {
      document.body.appendChild(_tlo);
    }
    _tlo.classList.remove('split-scoped');
  }
  _tlo.classList.add('open');
  updateIntroBtn();  // reflect whether this book is the current intro""",
    'library.js openBookTimeline: scope timeline-overlay to split panel when in split mode')

# 3. closeTimeline: remove split-scoped class and restore to body on close
patch(LIB,
    "function closeTimeline() {\n  document.getElementById('timeline-overlay').classList.remove('open');\n  viewingBookId  = null;\n  editingSlotIdx = null;\n}",
    """function closeTimeline() {
  const _tlo = document.getElementById('timeline-overlay');
  _tlo.classList.remove('open', 'split-scoped');
  // Move overlay back to body so it's ready for next open (split or not)
  if (_tlo.parentElement !== document.body) {
    document.body.appendChild(_tlo);
  }
  viewingBookId  = null;
  editingSlotIdx = null;
}""",
    'library.js closeTimeline: remove split-scoped and restore to body')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "fix: timeline overlay scopes to split panel in split mode"')
print('  git push --force origin main')
