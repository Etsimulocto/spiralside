# ============================================================
# SPIRALSIDE — STYLE COLOR ROW SKETCHES
# Adds tiny random canvas doodles to each color slot
# Stars, clouds, horizon lines, constellations — seeded per slot
# Run from ~/spiralside
# ============================================================

import os, re, sys

ROOT = os.getcwd()

# ── FIND THE STYLE VIEW FILE ──────────────────────────────────
style_file = None
for dirpath, dirs, files in os.walk(os.path.join(ROOT, 'js')):
    for fn in files:
        if fn.endswith('.js'):
            fp = os.path.join(dirpath, fn)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                src = f.read()
            if 'color-row' in src or 'COLORS' in src and 'background' in src and 'swatch' in src:
                print(f'[found] {fp}')
                style_file = fp
                break

# Also check index.html for inline style rows
if not style_file:
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    if 'color-row' in html:
        print('[found] color rows are inline in index.html')
        style_file = 'index.html'

if not style_file:
    print('ERROR: could not find color-row — dumping JS files with "color" mentions:')
    for dirpath, dirs, files in os.walk(os.path.join(ROOT, 'js')):
        for fn in files:
            if fn.endswith('.js'):
                fp = os.path.join(dirpath, fn)
                with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                    src = f.read()
                if 'color' in src.lower() and 'background' in src.lower():
                    print(f'  {fp}')
    sys.exit(1)

with open(style_file, 'r', encoding='utf-8') as f:
    src = f.read()

# Show context around color-row
idx = src.find('color-row')
print(f'\n[preview] color-row context:')
print(repr(src[max(0,idx-100):idx+300]))
