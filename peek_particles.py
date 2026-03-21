import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

changed = False

# ── FIX 1: particles canvas — clip to below header ────────────
# Change position:fixed to position:absolute scoped inside #screen-app
# OR just add a top offset to push it below the header
OLD_PARTICLES = """#particles-canvas {
      position: fixed; inset: 0; z-index: -1;
      pointer-events: none;
      opacity: 0;
      transition: opacity 1s ease;
    }"""
NEW_PARTICLES = """#particles-canvas {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 1s ease;
      clip-path: inset(0);
    }"""

# Actually the real fix: particles need to be INSIDE #screen-app
# with position:absolute, not fixed to viewport
# But without restructuring HTML, safest fix is just z-index below tab content
# Let's check what's actually happening — find the particles rule exactly
idx = html.find('#particles-canvas {')
if idx != -1:
    end = html.find('}', idx)
    print('[particles CSS found]:')
    print(repr(html[idx:end+1]))
    print()

# ── FIX 2: wire recolorSketch into previewColor ───────────────
# Find previewColor function
idx2 = html.find('function previewColor(')
if idx2 != -1:
    end2 = html.find('}', idx2)
    print('[previewColor found]:')
    print(repr(html[idx2:end2+20]))
    print()
else:
    # Search differently
    idx2 = html.find('previewColor')
    print('[previewColor context]:')
    print(repr(html[max(0,idx2-20):idx2+200]))

# ── FIX 3: show all oninput=previewColor calls to find pattern ─
print('[previewColor oninput calls]:')
for m in re.finditer(r'oninput="previewColor\([^"]*\)"', html):
    print(' ', repr(m.group()[:80]))
