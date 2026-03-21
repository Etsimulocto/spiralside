# ============================================================
# SPIRALSIDE — SKY FIX
# 1) Adds sky CSS to index.html (canvas positioning)
# 2) Adds initSky() call to main.js showApp
# Run from ~/spiralside
# ============================================================

import os, sys, re

# ── FIX 1: index.html — add sky CSS ──────────────────────────
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

SKY_CSS = """
    /* ── LIVING SKY ── */
    #sky-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
      display: block;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }
"""

if '/* ── LIVING SKY' in html:
    print('[1] sky CSS already present — skipping')
else:
    # Find the #app-header CSS block and insert sky CSS right after it
    anchor = '#app-header {'
    idx = html.find(anchor)
    if idx == -1:
        print('[1] ERROR: could not find #app-header CSS block')
        sys.exit(1)
    # Find the closing } of that block
    close = html.find('}', idx)
    if close == -1:
        print('[1] ERROR: could not find closing brace')
        sys.exit(1)
    # Insert sky CSS right after that closing brace + newline
    insert_at = close + 1
    html = html[:insert_at] + SKY_CSS + html[insert_at:]
    print('[1] sky CSS injected after #app-header block')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[1] index.html written')

# ── FIX 2: main.js — add initSky() call ──────────────────────
with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

if 'initSky()' in main:
    print('[2] initSky() already present — skipping')
else:
    # Find showApp function — look for the function definition
    patterns = [
        r'function showApp\s*\([^)]*\)\s*\{',
        r'(export\s+)?function showApp',
        r'showApp\s*=\s*(?:async\s*)?\([^)]*\)\s*(?:=>)?\s*\{',
        r'const showApp',
    ]
    found_idx = -1
    for pat in patterns:
        m = re.search(pat, main)
        if m:
            found_idx = m.start()
            print(f'[2] found showApp via pattern: {repr(pat)}')
            break

    if found_idx == -1:
        print('[2] ERROR: could not find showApp — showing main.js function list:')
        for m in re.finditer(r'(function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()', main):
            print(f'  {repr(main[m.start():m.start()+60])}')
        sys.exit(1)

    # Find the opening brace of the function body
    brace = main.find('{', found_idx)
    if brace == -1:
        print('[2] ERROR: no opening brace found after showApp')
        sys.exit(1)

    # Insert initSky() as first line of function body
    main = main[:brace+1] + '\n  initSky(); // living sky' + main[brace+1:]
    print('[2] initSky() inserted at start of showApp body')

    with open('js/app/main.js', 'w', encoding='utf-8') as f:
        f.write(main)
    print('[2] main.js written')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: sky CSS + wire initSky call" && git push --force origin main')
