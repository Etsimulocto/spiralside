# ============================================================
# SPIRALSIDE — SKY FINAL FIX
# Wires initSky() into onAppReady in main.js
# Run from ~/spiralside
# ============================================================

import re

# ── main.js: add initSky() call inside onAppReady ────────────
with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

if 'initSky()' in main:
    print('[main] initSky() already present — skipping')
else:
    # Find onAppReady function opening brace
    m = re.search(r'function onAppReady\s*\([^)]*\)\s*\{', main)
    if not m:
        # try async version
        m = re.search(r'async function onAppReady\s*\([^)]*\)\s*\{', main)
    if not m:
        print('[main] ERROR: could not find onAppReady — dumping all function names:')
        for fm in re.finditer(r'(?:async\s+)?function\s+(\w+)', main):
            print(f'  {fm.group()}')
        # try to find where the app UI becomes visible as fallback
        import sys; sys.exit(1)

    brace_pos = main.find('{', m.start())
    main = main[:brace_pos+1] + '\n  initSky(); // living sky — Nimbis' + main[brace_pos+1:]
    print('[main] initSky() injected into onAppReady')

    with open('js/app/main.js', 'w', encoding='utf-8') as f:
        f.write(main)
    print('[main] main.js written')

# ── index.html: fix sky CSS to be rock-solid contained ───────
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace whatever sky CSS exists with the correct version
OLD_SKY_CSS = re.search(
    r'/\* ── LIVING SKY ──.*?#app-header > \*:not\(#sky-canvas\) \{[^}]*\}',
    html, re.DOTALL
)

CORRECT_SKY_CSS = """/* ── LIVING SKY ── */
    #sky-canvas {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
      display: block;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }"""

if OLD_SKY_CSS:
    html = html[:OLD_SKY_CSS.start()] + CORRECT_SKY_CSS + html[OLD_SKY_CSS.end():]
    print('[html] sky CSS replaced with clean version')
else:
    print('[html] sky CSS not found — checking if needs injection')
    if 'sky-canvas' not in html:
        print('[html] ERROR: no sky-canvas in html at all')
    else:
        print('[html] canvas tag present, CSS missing — injecting after #app-header block')
        anchor = html.find('#app-header {')
        close = html.find('}', anchor)
        html = html[:close+1] + '\n    ' + CORRECT_SKY_CSS + html[close+1:]
        print('[html] injected')

# Also make sure #app-header has position:relative (safety check)
if 'position: relative' not in html[html.find('#app-header {'):html.find('#app-header {')+300]:
    html = html.replace(
        '#app-header {',
        '#app-header { position: relative; overflow: hidden;',
        1
    )
    print('[html] added position:relative to #app-header')
else:
    print('[html] #app-header position:relative OK')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[html] index.html written')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: wire initSky into onAppReady" && git push --force origin main')
