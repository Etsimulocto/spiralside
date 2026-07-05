# gm_fullscreen_patch.py - header-hide on game maker + mobile width clamp
import sys

# read live local file, normalize line endings for matching
src = open('index.html', encoding='utf-8').read().replace('\r\n', '\n')

# idempotency guard - bail cleanly if already patched
if 'gm-full-css' in src:
    print('SKIP: patch already applied'); sys.exit(0)

# ---- block 1: CSS injected before </head> ----
CSS = '''<style id="gm-full-css">
  /* letterbox insurance: over-zoom area paints dark, not white */
  html { background: #08080d; }
  /* game maker fullscreen: hide hero header + ticker, grid rows collapse */
  body.gm-full #app-header { display: none; }
  body.gm-full #skyline-ticker { display: none; }
  /* clamp: game maker view can never push page wider than screen */
  #view-bloomstudio { max-width: 100vw; overflow: hidden; }
  #view-bloomstudio iframe { width: 100%; max-width: 100%; }
</style>
</head>'''

# ---- block 2: JS injected before </body> ----
JS = '''<script id="gm-full-js">
  // delegated listener - survives re-renders, no switchView dependency
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.tab-btn');       // only care about tab clicks
    if (!b) return;                              // not a tab - ignore
    // gm-full on body only while game maker tab is active
    document.body.classList.toggle('gm-full', b.id === 'tab-bloomstudio');
  });
</script>
</body>'''

# ---- anchor checks: each must appear exactly once ----
for anchor in ['</head>', '</body>']:
    n = src.count(anchor)
    if n != 1:
        print('FAIL: anchor', anchor, 'count =', n); sys.exit(1)

# apply both insertions
src = src.replace('</head>', CSS, 1)
src = src.replace('</body>', JS, 1)

# write back
open('index.html', 'w', encoding='utf-8').write(src)
print('OK: gm-full patch applied - header hides on game maker, width clamped')
