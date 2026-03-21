import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1: Nuke the float JS block ────────────────────────────────
html = re.sub(
    r'\s*// ── HEADER FLOATERS ─+.*?\}\)\(\);',
    '',
    html, flags=re.DOTALL
)
print('[1] float JS removed')

# ── 2: Nuke float CSS ─────────────────────────────────────────
html = re.sub(
    r'\s*/\* ── HEADER FLOATERS ── \*/.*?\.hdr-float \{ pointer-events: all; position: relative; z-index: 2; \}',
    '',
    html, flags=re.DOTALL
)
print('[2] float CSS removed')

# ── 3: Restore header rows to normal flow ─────────────────────
# Remove hdr-float classes and extra IDs we added
html = html.replace(' hdr-float" id="hdr-logo"', '"')
html = html.replace(' hdr-float" id="hdr-version"', '" id="version-badge"')
html = html.replace(' hdr-float" id="hdr-credits"', '" id="credits-badge"')
print('[3] restored normal classes')

# Also fix credits-badge onclick if it got mangled
html = re.sub(
    r'<div class="credits-badge" id="credits-badge"(?! onclick)',
    '<div class="credits-badge" id="credits-badge" onclick="switchView(\'store\')"',
    html
)
print('[3b] credits onclick restored')

# ── 4: Add pure CSS drift animations per element ──────────────
# Each element gets its own keyframe — logo right, version left, credits right (faster)
DRIFT_CSS = """
    /* ── HEADER ELEMENT DRIFT ── */
    @keyframes driftRight {
      0%   { transform: translateX(-30px); }
      50%  { transform: translateX(30px);  }
      100% { transform: translateX(-30px); }
    }
    @keyframes driftLeft {
      0%   { transform: translateX(20px);  }
      50%  { transform: translateX(-20px); }
      100% { transform: translateX(20px);  }
    }
    @keyframes driftRightFast {
      0%   { transform: translateX(-15px); }
      50%  { transform: translateX(15px);  }
      100% { transform: translateX(-15px); }
    }
    .app-logo      { animation: driftRight      18s ease-in-out infinite; display: inline-block; }
    .version-badge { animation: driftLeft       24s ease-in-out infinite; display: inline-block; }
    .credits-badge { animation: driftRightFast  14s ease-in-out infinite; display: inline-block; }
"""

if 'driftRight' in html:
    print('[4] drift CSS already present — replacing')
    html = re.sub(r'\s*/\* ── HEADER ELEMENT DRIFT ── \*/.*?\.credits-badge \{ animation:[^}]+\}', '', html, flags=re.DOTALL)

html = html.replace('</style>', DRIFT_CSS + '  </style>', 1)
print('[4] drift CSS injected')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[done] written')
print()
print('git add index.html && git commit -m "feat: header element CSS drift animations" && git push --force origin main')
