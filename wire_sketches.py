import re, os

ROOT = os.getcwd()

# ── Wire import into main.js ──────────────────────────────────
with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

print('[main.js] first 3 import lines:')
for line in main.split('\n')[:8]:
    if line.strip(): print(' ', repr(line))

if 'colorSketches' in main:
    print('[main.js] already has colorSketches — skipping import')
else:
    # Add after first import line
    first_import_end = main.find('\n', main.find('import '))
    main = (main[:first_import_end+1] +
            "import { initColorSketches } from './colorSketches.js';\n" +
            main[first_import_end+1:])
    print('[main.js] import added')

# Expose on window so style view inline HTML can call it
if 'window.initColorSketches' in main:
    print('[main.js] window exposure already present')
else:
    # Add after initSky window exposure or any other window. assignment
    anchor = 'window.initSky'
    if anchor not in main:
        anchor = main.find('window.')
        # find end of that line
        idx = main.find('window.')
        eol = main.find('\n', idx)
        main = main[:eol+1] + 'window.initColorSketches = initColorSketches;\n' + main[eol+1:]
    else:
        idx = main.find(anchor)
        eol = main.find('\n', idx)
        main = main[:eol+1] + 'window.initColorSketches = initColorSketches;\n' + main[eol+1:]
    print('[main.js] window.initColorSketches exposed')

with open('js/app/main.js', 'w', encoding='utf-8') as f:
    f.write(main)
print('[main.js] written')

# ── Wire initColorSketches call into the style tab open handler ─
# Style tab is inline in index.html — find the switchView or tab click for style
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find where style tab content is shown — look for 'style' tab activation
# The color rows are static HTML so we just need to call initColorSketches
# after the page loads (DOMContentLoaded) as a one-time init
# AND whenever the style panel/tab is opened

# Add a DOMContentLoaded call so sketches draw on first open
DOM_CALL = """
  document.addEventListener('DOMContentLoaded', () => {
    // Draw color row sketches when style tab is visible
    const styleObserver = new MutationObserver(() => {
      const styleSection = document.querySelector('.color-sketch-canvas');
      if (styleSection && window.initColorSketches) {
        window.initColorSketches();
        styleObserver.disconnect();
      }
    });
    styleObserver.observe(document.body, { childList: true, subtree: true });
  });
"""

if 'color-sketch-canvas' in html and 'styleObserver' not in html:
    # Insert before </body>
    html = html.replace('</body>', DOM_CALL + '\n</body>', 1)
    print('[html] MutationObserver watcher added for sketches')
else:
    print('[html] sketch observer already present or not needed')

# Also: find any onclick for the style tab and add initColorSketches call
# Look for data-view="style" or similar
style_tab_patterns = [
    "data-view=\"view-style\"",
    "data-view='view-style'",
    "switchView('style'",
    'switchView("style"',
    "'style-tab'",
]
for pat in style_tab_patterns:
    if pat in html:
        print(f'[html] found style tab trigger: {repr(pat[:40])}')
        break

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[html] written')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: wire colorSketches into main.js" && git push --force origin main')
