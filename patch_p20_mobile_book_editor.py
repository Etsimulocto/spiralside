#!/usr/bin/env python3
# SPIRALSIDE patch_p20_mobile_book_editor.py
# Rearrange book editor timeline overlay for mobile:
# - Compact header (title + buttons row)
# - Shorter filmstrip tracks (56px slots, tighter padding)
# - Slot editor fills remaining space properly
# - Text box controls wrap cleanly on narrow screens
# - Frame/scene labels tighter
# Run: cd ~/spiralside && python patch_p20_mobile_book_editor.py

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

LIB = 'js/app/library.js'

# ============================================================
# 1. CSS — mobile-first timeline layout overhaul
# ============================================================

# A) Header — tighter, wrap-safe
patch(LIB,
    """    /* header */
    .tl-header {
      display:flex; align-items:center; gap:10px;
      padding:14px 16px; border-bottom:1px solid var(--border); flex-shrink:0;
    }
    .tl-title { font-size:0.88rem; font-weight:700; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tl-play-btn {
      padding:7px 14px; background:var(--teal); border:none; border-radius:20px;
      color:#0a0a0f; font-size:0.68rem; font-weight:700; cursor:pointer;
      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui);
    }
    .tl-close-btn { background:none; border:none; color:var(--subtext); font-size:1.2rem; cursor:pointer; padding:4px 6px; }
    .tl-intro-btn {
      padding:6px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.62rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s;
    }
    .tl-intro-btn:hover { border-color:var(--yellow); color:var(--yellow); }
    .tl-intro-btn.is-intro { border-color:var(--yellow); color:var(--yellow); background:rgba(255,217,61,0.1); }
    .tl-export-btn {
      padding:6px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.62rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s;
    }
    .tl-export-btn:hover { border-color:var(--teal); color:var(--teal); }
    .tl-title-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;
      color:var(--text); font-family:var(--font-ui); font-size:0.88rem; font-weight:700;
      outline:none; min-width:0; transition:border-color 0.2s;
    }
    .tl-title-input:focus { border-bottom-color:var(--pink); }""",
    """    /* header — two-row compact mobile layout */
    .tl-header {
      display:flex; flex-direction:column; gap:0;
      border-bottom:1px solid var(--border); flex-shrink:0;
    }
    .tl-header-top {
      display:flex; align-items:center; gap:8px;
      padding:10px 14px 6px;
    }
    .tl-header-btns {
      display:flex; align-items:center; gap:6px;
      padding:0 14px 8px; overflow-x:auto;
      scrollbar-width:none; -webkit-overflow-scrolling:touch;
    }
    .tl-header-btns::-webkit-scrollbar { display:none; }
    .tl-title { font-size:0.88rem; font-weight:700; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tl-play-btn {
      padding:6px 14px; background:var(--teal); border:none; border-radius:20px;
      color:#0a0a0f; font-size:0.65rem; font-weight:700; cursor:pointer;
      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui); flex-shrink:0;
    }
    .tl-close-btn { background:none; border:none; color:var(--subtext); font-size:1.1rem; cursor:pointer; padding:4px; flex-shrink:0; }
    .tl-intro-btn {
      padding:5px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.58rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;
    }
    .tl-intro-btn:hover { border-color:var(--yellow); color:var(--yellow); }
    .tl-intro-btn.is-intro { border-color:var(--yellow); color:var(--yellow); background:rgba(255,217,61,0.1); }
    .tl-export-btn {
      padding:5px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.58rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;
    }
    .tl-export-btn:hover { border-color:var(--teal); color:var(--teal); }
    .tl-title-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;
      color:var(--text); font-family:var(--font-ui); font-size:0.84rem; font-weight:700;
      outline:none; min-width:0; transition:border-color 0.2s;
    }
    .tl-title-input:focus { border-bottom-color:var(--pink); }""",
    'library.js: mobile-first header CSS')

# B) Filmstrip — shorter slots for mobile
patch(LIB,
    """    /* ── TWO-TRACK FILMSTRIP ── */
    .tl-tracks {
      flex-shrink:0; border-bottom:1px solid var(--border);
      display:flex; flex-direction:column;
    }
    .tl-track {
      display:flex; flex-direction:column; gap:0;
    }
    .tl-track-label {
      font-size:0.5rem; letter-spacing:0.14em; text-transform:uppercase;
      color:var(--subtext); padding:5px 16px 2px; flex-shrink:0;
    }
    /* FRAME track (top) — same size as scene slots */
    .tl-track.track-frame .tl-strip-wrap {
      padding:4px 16px 4px;
    }
    .tl-track.track-frame .tl-slot {
      border-color:rgba(0,246,214,0.2);
      background:var(--surface2);
    }""",
    """    /* ── TWO-TRACK FILMSTRIP ── */
    .tl-tracks {
      flex-shrink:0; border-bottom:1px solid var(--border);
      display:flex; flex-direction:column;
    }
    .tl-track {
      display:flex; flex-direction:column; gap:0;
    }
    .tl-track-label {
      font-size:0.46rem; letter-spacing:0.12em; text-transform:uppercase;
      color:var(--subtext); padding:3px 12px 1px; flex-shrink:0;
    }
    /* FRAME track (top) — compact for mobile */
    .tl-track.track-frame .tl-strip-wrap {
      padding:3px 12px 3px;
    }
    .tl-track.track-frame .tl-slot {
      border-color:rgba(0,246,214,0.2);
      background:var(--surface2);
    }""",
    'library.js: compact track labels and padding')

# C) Slot size — 60px for mobile instead of 96px
patch(LIB,
    """    .tl-slot {
      flex-shrink:0; width:72px; height:96px; border-radius:8px;
      border:2px solid var(--border); cursor:pointer;
      position:relative; overflow:hidden;
      transition:border-color 0.15s, transform 0.15s;
      background:var(--surface);
    }""",
    """    .tl-slot {
      flex-shrink:0; width:60px; height:80px; border-radius:6px;
      border:2px solid var(--border); cursor:pointer;
      position:relative; overflow:hidden;
      transition:border-color 0.15s, transform 0.15s;
      background:var(--surface);
    }""",
    'library.js: smaller slots for mobile')

# D) Strip wrap — tighter padding
patch(LIB,
    """    /* SCENE track (bottom) — full height slots */
    .tl-track.track-scene .tl-strip-wrap {
      padding:4px 16px 10px;
    }
    /* shared strip row */
    .tl-strip-wrap {
      overflow-x:auto; overflow-y:hidden;
      display:flex; gap:10px;
      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);
      -webkit-overflow-scrolling:touch;
    }""",
    """    /* SCENE track (bottom) */
    .tl-track.track-scene .tl-strip-wrap {
      padding:3px 12px 8px;
    }
    /* shared strip row */
    .tl-strip-wrap {
      overflow-x:auto; overflow-y:hidden;
      display:flex; gap:8px;
      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);
      -webkit-overflow-scrolling:touch;
    }""",
    'library.js: tighter strip padding/gap')

# E) Slot editor — ensure proper flex growth
patch(LIB,
    """    /* ── SLOT EDITOR (bottom sheet) ── */
    #slot-editor {
      flex:1; display:flex; flex-direction:column; overflow:hidden;
      min-height:0;
    }""",
    """    /* ── SLOT EDITOR ── */
    #slot-editor {
      flex:1; display:flex; flex-direction:column; overflow:hidden;
      min-height:0;
    }""",
    'library.js: slot editor flex')

# F) se-panel — less padding on mobile
patch(LIB,
    """    /* slot editor - active panel */
    .se-panel {
      flex:1; overflow-y:auto; padding:16px 16px 80px;
      display:flex; flex-direction:column; gap:12px;
    }""",
    """    /* slot editor - active panel */
    .se-panel {
      flex:1; overflow-y:auto; padding:12px 14px 80px;
      display:flex; flex-direction:column; gap:10px;
    }""",
    'library.js: se-panel tighter mobile padding')

# G) Text box controls — stack style rows better on mobile
patch(LIB,
    """    /* text box style controls */
    .tb-style-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:2px; }""",
    """    /* text box style controls */
    .tb-style-row { display:flex; gap:5px; align-items:center; flex-wrap:wrap; margin-top:2px; }""",
    'library.js: tb-style-row tighter gap')

# H) tb-mini-chip — smaller for mobile
patch(LIB,
    """    .tb-mini-chip {
      padding:3px 7px; border-radius:4px; font-size:0.55rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      transition:all 0.12s; white-space:nowrap;
    }""",
    """    .tb-mini-chip {
      padding:3px 6px; border-radius:4px; font-size:0.52rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      transition:all 0.12s; white-space:nowrap;
    }""",
    'library.js: smaller tb-mini-chip')

# I) se-row — stack on very narrow screens
patch(LIB,
    """    .se-row { display:flex; align-items:center; gap:10px; }
    .se-label { font-size:0.6rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }
    .se-preview-wrap {
      width:80px; height:106px; flex-shrink:0; border-radius:8px;
      overflow:hidden; border:1px solid var(--border); background:var(--surface);
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }""",
    """    .se-row { display:flex; align-items:flex-start; gap:10px; }
    .se-label { font-size:0.58rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px; }
    .se-preview-wrap {
      width:70px; height:93px; flex-shrink:0; border-radius:8px;
      overflow:hidden; border:1px solid var(--border); background:var(--surface);
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }""",
    'library.js: se-row and preview-wrap smaller')

# ============================================================
# 2. HTML — split tl-header into two rows (top + btns)
# ============================================================
patch(LIB,
    """      <div class="tl-header">
        <input class="tl-title-input" id="tl-title" value="book" />
        <button class="tl-export-btn" id="tl-export-btn" title="download book as JSON">↓ save</button>
        <button class="tl-intro-btn" id="tl-make-intro" title="play this book on startup">⭐ intro</button>
        <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
        <button class="tl-close-btn" id="tl-close-btn">✕</button>
      </div>""",
    """      <div class="tl-header">
        <div class="tl-header-top">
          <input class="tl-title-input" id="tl-title" value="book" />
          <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
          <button class="tl-close-btn" id="tl-close-btn">✕</button>
        </div>
        <div class="tl-header-btns">
          <button class="tl-export-btn" id="tl-export-btn" title="download book as JSON">↓ save</button>
          <button class="tl-intro-btn" id="tl-make-intro" title="play this book on startup">⭐ intro</button>
        </div>
      </div>""",
    'library.js: two-row header HTML')

# ============================================================
# 3. CSS — se-chips wrap tighter, se-fields gaps tighter
# ============================================================
patch(LIB,
    "    .se-chips { display:flex; gap:6px; flex-wrap:wrap; }",
    "    .se-chips { display:flex; gap:5px; flex-wrap:wrap; }",
    'library.js: se-chips tighter gap')

patch(LIB,
    "    .se-fields { flex:1; display:flex; flex-direction:column; gap:8px; }",
    "    .se-fields { flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; }",
    'library.js: se-fields min-width:0 for flex overflow')

# ============================================================
# 4. CSS — tb-pos-grid slightly smaller cells on mobile
# ============================================================
patch(LIB,
    """    .tb-pos-grid {
      display:grid; grid-template-columns:repeat(3,18px); gap:2px;
    }
    .tb-pos-cell {
      width:18px; height:14px; border-radius:2px;
      background:var(--border); cursor:pointer; border:none;
      transition:background 0.15s;
    }""",
    """    .tb-pos-grid {
      display:grid; grid-template-columns:repeat(3,16px); gap:2px;
    }
    .tb-pos-cell {
      width:16px; height:12px; border-radius:2px;
      background:var(--border); cursor:pointer; border:none;
      transition:background 0.15s;
    }""",
    'library.js: smaller pos grid cells')

# ============================================================
# 5. CSS — tb-text-input smaller min-height
# ============================================================
patch(LIB,
    "      outline:none; line-height:1.5; min-height:52px;",
    "      outline:none; line-height:1.5; min-height:44px;",
    'library.js: tb-text-input smaller min-height')

# ============================================================
# 6. CSS — tb-item padding tighter
# ============================================================
patch(LIB,
    """    .tb-item {
      background:var(--surface2); border:1px solid var(--border);
      border-radius:10px; padding:10px 12px;
      display:flex; flex-direction:column; gap:8px;
      position:relative;
    }""",
    """    .tb-item {
      background:var(--surface2); border:1px solid var(--border);
      border-radius:10px; padding:9px 10px;
      display:flex; flex-direction:column; gap:7px;
      position:relative;
    }""",
    'library.js: tb-item tighter padding')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "ux: mobile-first book editor layout — compact header, smaller slots, tighter controls"')
print('  git push --force origin main')
