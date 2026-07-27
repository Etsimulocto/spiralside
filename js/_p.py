#!/usr/bin/env python3
# _p.py — add a game maker launch button to the spiralside.com header
# Run from the spiralside repo root:  python _p.py
# Idempotent: safe to run twice.

import io, sys

PATH = "index.html"

BTN = ('<button id="gm-launch" onclick="switchView(\'bloomstudio\')" '
       'title="open the game maker">&#128377; '
       '<span class="gm-launch-label">game maker</span></button>\n        ')

MARK_HTML = 'id="gm-launch"'
ANCHOR_HTML = '<div id="header-utils">'

CSS = """
    /* ── GAME MAKER header launch ── */
    #gm-launch {
      display:flex; align-items:center; gap:6px;
      height:28px; padding:0 12px; border-radius:14px;
      border:1px solid var(--border); background:rgba(15,15,24,0.6);
      color:var(--subtext); cursor:pointer;
      font-family:var(--font-ui); font-size:0.68rem; letter-spacing:0.08em;
      transition:all 0.2s; margin-right:8px; position:relative; z-index:5; flex-shrink:0;
    }
    #gm-launch:hover { color:var(--teal); border-color:var(--teal); }
    /* stays visible on mobile (unlike #header-utils) — icon only to save width */
    @media (max-width:899px){
      #gm-launch .gm-launch-label { display:none; }
      #gm-launch { padding:0 9px; }
    }
"""

MARK_CSS = "#gm-launch {"
ANCHOR_CSS = "@media (max-width: 899px) { #header-utils { display: none; } }"

def die(msg):
    print("FAIL  " + msg); sys.exit(1)

src = io.open(PATH, encoding="utf-8").read()

changed = False

# 1) button markup — insert immediately before the header-utils div
if MARK_HTML in src:
    print("SKIP  button already present")
else:
    if src.count(ANCHOR_HTML) != 1:
        die(f"expected exactly one {ANCHOR_HTML!r}, found {src.count(ANCHOR_HTML)}")
    src = src.replace(ANCHOR_HTML, BTN + ANCHOR_HTML)
    changed = True
    print("OK    button inserted before #header-utils")

# 2) CSS — insert right after the header-utils mobile-hide rule
if MARK_CSS in src:
    print("SKIP  css already present")
else:
    if src.count(ANCHOR_CSS) != 1:
        die(f"expected exactly one header-utils mobile rule, found {src.count(ANCHOR_CSS)}")
    src = src.replace(ANCHOR_CSS, ANCHOR_CSS + "\n" + CSS)
    changed = True
    print("OK    css inserted after header-utils mobile rule")

if changed:
    io.open(PATH, "w", encoding="utf-8").write(src)
    print("DONE  index.html written — commit and push")
else:
    print("DONE  nothing to do")
