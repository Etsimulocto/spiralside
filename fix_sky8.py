import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the sky CSS block with a clean version that includes transparent bg on canvas
old_block = re.search(
    r'/\* ── LIVING SKY ── \*/.*?#app-header > \*:not\(#sky-canvas\) \{ position: relative; z-index: 1; \}',
    html, re.DOTALL
)

NEW_SKY_CSS = """/* ── LIVING SKY ── */
    #sky-canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
      pointer-events: none;
      display: block;
      background: transparent;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }"""

if old_block:
    html = html[:old_block.start()] + NEW_SKY_CSS + html[old_block.end():]
    print('[1] replaced sky CSS block')
else:
    # Inject after #app-header closing brace
    idx = html.find('#app-header {')
    close = html.find('}', idx)
    html = html[:close+1] + '\n    ' + NEW_SKY_CSS + html[close+1:]
    print('[1] injected sky CSS (fallback)')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[1] index.html written')

# Also patch sky.js — clear to transparent not to black
# clearRect already clears to transparent on a canvas with no bg
# But we need to ensure the canvas context clears properly
with open('js/app/sky.js', 'r', encoding='utf-8') as f:
    sky = f.read()

# Make sure we clear with transparent fill first frame
# Add explicit canvas style in initSky
OLD_INIT_LINE = "  _cvs.style.opacity = SKY_CONFIG.opacity;"
NEW_INIT_LINE = """  _cvs.style.opacity = SKY_CONFIG.opacity;
  _cvs.style.background = 'transparent';"""

if '_cvs.style.background' not in sky:
    sky = sky.replace(OLD_INIT_LINE, NEW_INIT_LINE, 1)
    print('[2] added transparent bg to canvas in initSky')
else:
    print('[2] canvas bg already set')

with open('js/app/sky.js', 'w', encoding='utf-8') as f:
    f.write(sky)
print('[2] sky.js written')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: sky canvas transparent bg, no flash" && git push --force origin main')
