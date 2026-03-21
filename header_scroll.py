import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1: Wrap header content rows in a scrolling track ──────────
OLD_HEADER_CONTENT = '''    <div class="header-logo-row">
      <div class="app-logo">spiralside</div>
    </div>
    <div class="header-controls-row">
      <div class="version-badge" id="version-badge">v0.8.327</div>
      <div class="header-right">
        <div class="credits-badge" id="credits-badge" onclick="switchView(\'store\')">∞ free</div>
      </div>
    </div>'''

# Check exact version number in file
import re as re2
m = re2.search(r'<div class="version-badge" id="version-badge">(v[\d.]+)</div>', html)
ver = m.group(1) if m else 'v0.8.327'

OLD_HEADER_CONTENT = f'''    <div class="header-logo-row">
      <div class="app-logo">spiralside</div>
    </div>
    <div class="header-controls-row">
      <div class="version-badge" id="version-badge">{ver}</div>
      <div class="header-right">
        <div class="credits-badge" id="credits-badge" onclick="switchView(\'store\')">∞ free</div>
      </div>
    </div>'''

NEW_HEADER_CONTENT = f'''    <div class="header-scroll-track">
      <div class="header-logo-row">
        <div class="app-logo">spiralside</div>
      </div>
      <div class="header-controls-row">
        <div class="version-badge" id="version-badge">{ver}</div>
        <div class="header-right">
          <div class="credits-badge" id="credits-badge" onclick="switchView(\'store\')">∞ free</div>
        </div>
      </div>
    </div>'''

if OLD_HEADER_CONTENT not in html:
    print('[wrap] exact match failed — trying flexible match')
    # Find between header-glow div and end of app-header
    old_pat = re2.search(
        r'(<div class="header-logo-row">.*?</div>\s*</div>)\s*\n\s*</div>\s*\n\s*<!-- TAB BAR',
        html, re2.DOTALL
    )
    if old_pat:
        print('[wrap] found via regex')
        print(repr(old_pat.group()[:200]))
    else:
        print('[wrap] ERROR: could not find header content')
        exit()
else:
    html = html.replace(OLD_HEADER_CONTENT, NEW_HEADER_CONTENT, 1)
    print('[1] header content wrapped in .header-scroll-track')

# ── 2: Add CSS for the scroll track ──────────────────────────
SCROLL_CSS = """
    /* ── HEADER SCROLL TRACK ── */
    .header-scroll-track {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      position: relative;
      z-index: 1;
      animation: headerDrift 28s linear infinite;
    }
    @keyframes headerDrift {
      0%   { transform: translateX(0%); }
      40%  { transform: translateX(-8%); }
      60%  { transform: translateX(-8%); }
      100% { transform: translateX(0%); }
    }
    /* pause drift on hover/touch */
    .header-scroll-track:hover { animation-play-state: paused; }
"""

if 'headerDrift' in html:
    print('[2] scroll CSS already present')
else:
    html = html.replace('</style>', SCROLL_CSS + '  </style>', 1)
    print('[2] scroll CSS injected')

# ── 3: Make sure header-glow also has z-index:1 ───────────────
# (it already should from previous patches)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[done] index.html written')
print()
print('git add index.html && git commit -m "feat: header slow drift scroll animation" && git push --force origin main')
