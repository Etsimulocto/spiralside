#!/usr/bin/env python3
# SPIRALSIDE patch_p22_mobile_scale_up.py
# Scale up the book editor for mobile:
# - Filmstrip slots bigger (80x107)
# - Filter/tag chips bigger tap targets
# - Text box controls bigger
# - se-preview-wrap taller
# - All chip/mini-chip font sizes up
# - Add overflow-x:auto to filter/tag chip rows
# Run: cd ~/spiralside && python patch_p22_mobile_scale_up.py

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

# ── 1. Filmstrip slots — bigger for mobile tapping ──────────────
patch(LIB,
    """    .tl-slot {
      flex-shrink:0; width:60px; height:80px; border-radius:6px;
      border:2px solid var(--border); cursor:pointer;
      position:relative; overflow:hidden;
      transition:border-color 0.15s, transform 0.15s;
      background:var(--surface);
    }""",
    """    .tl-slot {
      flex-shrink:0; width:80px; height:107px; border-radius:8px;
      border:2px solid var(--border); cursor:pointer;
      position:relative; overflow:hidden;
      transition:border-color 0.15s, transform 0.15s;
      background:var(--surface);
    }""",
    'slots: 80x107')

# ── 2. Strip wrap — more padding so slots don't clip ────────────
patch(LIB,
    """    /* FRAME track (compact for mobile */
    .tl-track.track-frame .tl-strip-wrap {
      padding:3px 12px 3px;
    }""",
    """    /* FRAME track */
    .tl-track.track-frame .tl-strip-wrap {
      padding:4px 14px 4px;
    }""",
    'frame strip padding')

patch(LIB,
    """    /* SCENE track */
    .tl-track.track-scene .tl-strip-wrap {
      padding:3px 12px 8px;
    }""",
    """    /* SCENE track */
    .tl-track.track-scene .tl-strip-wrap {
      padding:4px 14px 10px;
    }""",
    'scene strip padding')

# ── 3. Strip gap ─────────────────────────────────────────────────
patch(LIB,
    """    /* shared strip row */
    .tl-strip-wrap {
      overflow-x:auto; overflow-y:hidden;
      display:flex; gap:8px;
      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);
      -webkit-overflow-scrolling:touch;
    }""",
    """    /* shared strip row */
    .tl-strip-wrap {
      overflow-x:auto; overflow-y:hidden;
      display:flex; gap:10px;
      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);
      -webkit-overflow-scrolling:touch;
    }""",
    'strip gap 10px')

# ── 4. Track labels slightly bigger ─────────────────────────────
patch(LIB,
    """    .tl-track-label {
      font-size:0.46rem; letter-spacing:0.12em; text-transform:uppercase;
      color:var(--subtext); padding:3px 12px 1px; flex-shrink:0;
    }""",
    """    .tl-track-label {
      font-size:0.52rem; letter-spacing:0.12em; text-transform:uppercase;
      color:var(--subtext); padding:4px 14px 2px; flex-shrink:0;
    }""",
    'track labels 0.52rem')

# ── 5. se-preview-wrap — bigger on mobile ───────────────────────
patch(LIB,
    """    .se-preview-wrap {
      width:70px; height:93px; flex-shrink:0; border-radius:8px;
      overflow:hidden; border:1px solid var(--border); background:var(--surface);
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }""",
    """    .se-preview-wrap {
      width:88px; height:117px; flex-shrink:0; border-radius:8px;
      overflow:hidden; border:1px solid var(--border); background:var(--surface);
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }""",
    'se-preview-wrap 88x117')

# ── 6. se-chips — scrollable row, bigger tap targets ────────────
patch(LIB,
    "    .se-chips { display:flex; gap:5px; flex-wrap:wrap; }",
    """    .se-chips {
      display:flex; gap:6px; flex-wrap:wrap;
      overflow-x:auto; -webkit-overflow-scrolling:touch;
      scrollbar-width:none; padding-bottom:2px;
    }
    .se-chips::-webkit-scrollbar { display:none; }""",
    'se-chips scrollable')

patch(LIB,
    """    .se-chip {
      padding:5px 10px; background:var(--surface2); border:1px solid var(--border);
      border-radius:20px; font-size:0.65rem; cursor:pointer; color:var(--subtext);
      font-family:var(--font-ui); transition:all 0.15s;
    }""",
    """    .se-chip {
      padding:7px 13px; background:var(--surface2); border:1px solid var(--border);
      border-radius:20px; font-size:0.72rem; cursor:pointer; color:var(--subtext);
      font-family:var(--font-ui); transition:all 0.15s; flex-shrink:0;
    }""",
    'se-chip bigger tap target')

# ── 7. se-label bigger ───────────────────────────────────────────
patch(LIB,
    "    .se-label { font-size:0.58rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px; }",
    "    .se-label { font-size:0.64rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }",
    'se-label 0.64rem')

# ── 8. se-input bigger ───────────────────────────────────────────
patch(LIB,
    """    .se-input {
      width:100%; background:var(--surface2); border:1px solid var(--border);
      border-radius:8px; padding:9px 11px; color:var(--text);
      font-size:0.78rem; outline:none; font-family:var(--font-ui);
      transition:border-color 0.2s; resize:none;
    }""",
    """    .se-input {
      width:100%; background:var(--surface2); border:1px solid var(--border);
      border-radius:8px; padding:11px 13px; color:var(--text);
      font-size:0.84rem; outline:none; font-family:var(--font-ui);
      transition:border-color 0.2s; resize:none;
    }""",
    'se-input bigger')

# ── 9. Text box controls — bigger everything ─────────────────────
patch(LIB,
    """    .tb-mini-chip {
      padding:3px 6px; border-radius:4px; font-size:0.52rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      transition:all 0.12s; white-space:nowrap;
    }""",
    """    .tb-mini-chip {
      padding:6px 10px; border-radius:6px; font-size:0.66rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      transition:all 0.12s; white-space:nowrap;
    }""",
    'tb-mini-chip bigger')

patch(LIB,
    """    .tb-style-chip {
      padding:3px 8px; border-radius:20px; font-size:0.58rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      letter-spacing:0.04em; transition:all 0.15s;
    }""",
    """    .tb-style-chip {
      padding:6px 12px; border-radius:20px; font-size:0.68rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      letter-spacing:0.04em; transition:all 0.15s;
    }""",
    'tb-style-chip bigger')

patch(LIB,
    """    .tb-speaker-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid var(--border);
      color:var(--text); font-family:var(--font-ui); font-size:0.72rem;
      outline:none; padding:2px 0; min-width:0;
    }""",
    """    .tb-speaker-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid var(--border);
      color:var(--text); font-family:var(--font-ui); font-size:0.82rem;
      outline:none; padding:4px 0; min-width:0;
    }""",
    'tb-speaker-input bigger')

patch(LIB,
    """    .tb-text-input {
      width:100%; background:var(--bg); border:1px solid var(--border);
      border-radius:6px; padding:8px 10px; color:var(--text);
      font-family:var(--font-ui); font-size:0.78rem; resize:none;
      outline:none; line-height:1.5; min-height:44px;
    }""",
    """    .tb-text-input {
      width:100%; background:var(--bg); border:1px solid var(--border);
      border-radius:6px; padding:10px 12px; color:var(--text);
      font-family:var(--font-ui); font-size:0.86rem; resize:none;
      outline:none; line-height:1.55; min-height:54px;
    }""",
    'tb-text-input bigger')

patch(LIB,
    """    .tb-pos-grid {
      display:grid; grid-template-columns:repeat(3,16px); gap:2px;
    }
    .tb-pos-cell {
      width:16px; height:12px; border-radius:2px;
      background:var(--border); cursor:pointer; border:none;
      transition:background 0.15s;
    }""",
    """    .tb-pos-grid {
      display:grid; grid-template-columns:repeat(3,22px); gap:3px;
    }
    .tb-pos-cell {
      width:22px; height:17px; border-radius:3px;
      background:var(--border); cursor:pointer; border:none;
      transition:background 0.15s;
    }""",
    'pos grid cells bigger')

patch(LIB,
    """    .tb-swatch {
      width:24px; height:24px; border-radius:6px; border:2px solid var(--border);
      cursor:pointer; overflow:hidden; position:relative; flex-shrink:0;
    }""",
    """    .tb-swatch {
      width:32px; height:32px; border-radius:7px; border:2px solid var(--border);
      cursor:pointer; overflow:hidden; position:relative; flex-shrink:0;
    }""",
    'tb-swatch bigger')

patch(LIB,
    """    .tb-opacity-label { font-size:0.5rem; color:var(--subtext); letter-spacing:0.08em; white-space:nowrap; }""",
    """    .tb-opacity-label { font-size:0.6rem; color:var(--subtext); letter-spacing:0.08em; white-space:nowrap; }""",
    'tb-opacity-label bigger')

# ── 10. tb-item padding more generous ───────────────────────────
patch(LIB,
    """    .tb-item {
      background:var(--surface2); border:1px solid var(--border);
      border-radius:10px; padding:9px 10px;
      display:flex; flex-direction:column; gap:7px;
      position:relative;
    }""",
    """    .tb-item {
      background:var(--surface2); border:1px solid var(--border);
      border-radius:12px; padding:12px 13px;
      display:flex; flex-direction:column; gap:10px;
      position:relative;
    }""",
    'tb-item more padding')

# ── 11. tb-add-btn bigger ────────────────────────────────────────
patch(LIB,
    """    .tb-add-btn {
      width:100%; padding:10px; background:transparent;
      border:1px dashed var(--border); border-radius:10px;
      color:var(--subtext); font-family:var(--font-ui); font-size:0.72rem;
      cursor:pointer; letter-spacing:0.06em; transition:all 0.2s;
      margin-top:4px;
    }""",
    """    .tb-add-btn {
      width:100%; padding:14px; background:transparent;
      border:1px dashed var(--border); border-radius:10px;
      color:var(--subtext); font-family:var(--font-ui); font-size:0.8rem;
      cursor:pointer; letter-spacing:0.06em; transition:all 0.2s;
      margin-top:6px;
    }""",
    'tb-add-btn bigger')

# ── 12. se-del-btn bigger ────────────────────────────────────────
patch(LIB,
    """    .se-del-btn {
      padding:12px 16px; background:transparent; border:1px solid var(--border);
      border-radius:10px; color:var(--subtext); font-family:var(--font-ui);
      font-size:0.78rem; cursor:pointer; transition:all 0.2s;
    }""",
    """    .se-del-btn {
      padding:14px 18px; background:transparent; border:1px solid var(--border);
      border-radius:10px; color:var(--subtext); font-family:var(--font-ui);
      font-size:0.82rem; cursor:pointer; transition:all 0.2s;
    }""",
    'se-del-btn bigger')

# ── 13. Header title input bigger ───────────────────────────────
patch(LIB,
    """    .tl-title-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;
      color:var(--text); font-family:var(--font-ui); font-size:0.84rem; font-weight:700;
      outline:none; min-width:0; transition:border-color 0.2s;
    }""",
    """    .tl-title-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;
      color:var(--text); font-family:var(--font-ui); font-size:0.96rem; font-weight:700;
      outline:none; min-width:0; transition:border-color 0.2s;
    }""",
    'tl-title-input bigger')

# ── 14. Header buttons bigger ────────────────────────────────────
patch(LIB,
    """    .tl-play-btn {
      padding:6px 14px; background:var(--teal); border:none; border-radius:20px;
      color:#0a0a0f; font-size:0.65rem; font-weight:700; cursor:pointer;
      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui); flex-shrink:0;
    }""",
    """    .tl-play-btn {
      padding:8px 18px; background:var(--teal); border:none; border-radius:20px;
      color:#0a0a0f; font-size:0.72rem; font-weight:700; cursor:pointer;
      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui); flex-shrink:0;
    }""",
    'tl-play-btn bigger')

patch(LIB,
    """    .tl-intro-btn {
      padding:5px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.58rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;
    }""",
    """    .tl-intro-btn {
      padding:7px 14px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.68rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;
    }""",
    'tl-intro-btn bigger')

patch(LIB,
    """    .tl-export-btn {
      padding:5px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.58rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;
    }""",
    """    .tl-export-btn {
      padding:7px 14px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.68rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;
    }""",
    'tl-export-btn bigger')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "ux: scale up book editor for mobile — bigger slots, chips, controls, text"')
print('  git push --force origin main')
