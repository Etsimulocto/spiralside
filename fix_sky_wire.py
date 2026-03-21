# ============================================================
# SPIRALSIDE — SKY WIRE FIX
# Checks main.js for initSky and adds it if missing
# Also verifies canvas is in index.html
# Run from ~/spiralside in Git Bash
# ============================================================

import os, sys

ROOT = os.getcwd()

# ── CHECK index.html for canvas ───────────────────────────────
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'sky-canvas' in html:
    print('[html] canvas OK — #sky-canvas found in index.html')
else:
    print('[html] MISSING — injecting canvas into #app-header')
    OLD = '<div id="app-header">'
    NEW = '<div id="app-header">\n    <canvas id="sky-canvas"></canvas>'
    if OLD not in html:
        print('[html] ERROR: #app-header not found')
        sys.exit(1)
    html = html.replace(OLD, NEW, 1)

# ── CHECK index.html for sky CSS ─────────────────────────────
if 'sky-canvas' in html and 'pointer-events: none' not in html:
    SKY_CSS = """
    /* ── LIVING SKY ── */
    #sky-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }
"""
    html = html.replace('</style>', SKY_CSS + '  </style>', 1)
    print('[html] injected sky CSS')
else:
    print('[html] CSS OK')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# ── CHECK main.js ─────────────────────────────────────────────
main_path = os.path.join('js', 'app', 'main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

print(f'[main.js] initSky import present: {"initSky" in main}')
print(f'[main.js] initSky() call present: {"initSky()" in main}')

changed = False

# Add import if missing
if 'initSky' not in main:
    first_import = main.find('import ')
    if first_import != -1:
        eol = main.find('\n', first_import)
        main = main[:eol+1] + "import { initSky } from './sky.js';\n" + main[eol+1:]
    else:
        main = "import { initSky } from './sky.js';\n" + main
    print('[main.js] added initSky import')
    changed = True

# Add call if missing — try several anchors
if 'initSky()' not in main:
    anchors = [
        "classList.add('visible')",
        'classList.add("visible")',
        "classList.remove('hidden')",
        'classList.remove("hidden")',
        "style.display = 'flex'",
        "style.display='flex'",
    ]
    injected = False
    for anchor in anchors:
        idx = main.find(anchor)
        if idx != -1:
            eol = main.find('\n', idx)
            if eol == -1: eol = len(main)
            main = main[:eol] + '\n  initSky(); // living sky' + main[eol:]
            print(f'[main.js] added initSky() call after: {repr(anchor[:50])}')
            injected = True
            changed = True
            break
    if not injected:
        # Last resort: find showApp function body opening
        idx = main.find('function showApp')
        if idx == -1:
            idx = main.find('showApp =')
        if idx != -1:
            brace = main.find('{', idx)
            if brace != -1:
                main = main[:brace+1] + '\n  initSky(); // living sky' + main[brace+1:]
                print('[main.js] added initSky() at start of showApp body')
                changed = True
        if not changed:
            print('[main.js] WARNING: could not find anchor — paste this line manually after app becomes visible:')
            print('  initSky();')

if changed:
    with open(main_path, 'w', encoding='utf-8') as f:
        f.write(main)
    print('[main.js] written')
else:
    print('[main.js] no changes needed')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: wire initSky into main.js" && git push --force origin main')
