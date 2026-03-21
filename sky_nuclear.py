import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

before = len(html)
count = html.count('LIVING SKY')
print(f'[check] {count} sky blocks found')

# Nuke every sky CSS block — greedy to catch nested content
html = re.sub(
    r'\n?\s*/\* ── LIVING SKY ── \*/[^/]*?z-index: 1; \}',
    '',
    html,
    flags=re.DOTALL
)
count2 = html.count('LIVING SKY')
print(f'[check] after strip: {count2} sky blocks remain')

# Also strip any orphaned sky-canvas CSS rules
html = re.sub(r'\n?\s*#sky-canvas \{[^}]*\}', '', html)
html = re.sub(r"\n?\s*#app-header > \*:not\(#sky-canvas\) \{[^}]*\}", '', html)
print('[strip] orphaned rules removed')

# Now do ONE clean injection — right inside the #app-header CSS rule itself
# Find the rule and add canvas rules to it
TARGET = '#app-header {'
idx = html.find(TARGET)
if idx == -1:
    print('ERROR: #app-header not found'); exit()

# Find end of the #app-header rule block
close = html.find('}', idx)
print(f'[found] #app-header block at {idx}, closes at {close}')
print(f'[preview] {repr(html[idx:close+1])}')

SKY_ADDITION = """
    #sky-canvas {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
      display: block; background: transparent;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }"""

html = html[:close+1] + SKY_ADDITION + html[close+1:]

after = len(html)
print(f'[size] {before} → {after} chars')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[done] index.html written cleanly')
print()
print('git add index.html && git commit -m "fix: sky CSS clean single inject" && git push --force origin main')
