import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove any existing broken sky CSS attempts
html = re.sub(r'\s*/\* ── LIVING SKY ──.*?z-index: 1; \}', '', html, flags=re.DOTALL)
print('[1] cleared old sky CSS')

# Find #app-header { ... } block and inject canvas rules + sibling z-index right after
# We inject directly into the #app-header rule so the canvas is scoped by the same block
TARGET = '#app-header {'
idx = html.find(TARGET)
if idx == -1:
    print('ERROR: #app-header { not found'); exit()

# Find closing brace of this CSS rule
close = html.find('}', idx)

SKY_CSS = """
    #sky-canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
      display: block;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }
"""

html = html[:close+1] + SKY_CSS + html[close+1:]
print('[2] sky CSS injected after #app-header block')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[3] done')
print()
print('git add . && git commit -m "fix: sky CSS force-inject" && git push --force origin main')
