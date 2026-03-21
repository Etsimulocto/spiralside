# ============================================================
# SPIRALSIDE — PATCH: codex view scroll fix
# Problem: #view-codex has no inner scroll container so content
#          gets squished — matches pattern used by vault/build views
# Run ONCE from Git Bash in ~/spiralside
# Nimbis anchor: _patch_codex_scroll.py
# ============================================================

import sys

TARGET = 'index.html'

# ── READ FILE ──────────────────────────────────────────────
with open(TARGET, 'r', encoding='utf-8') as f:
    src = f.read()

# ── PATCH 1: CSS — fix #codex-view and add #codex-inner ──
# Old style has codex-view doing its own overflow/padding (wrong)
# New style: codex-view is just the flex shell, codex-inner scrolls

OLD_CSS = '    /* CODEX */\n    #codex-view { display:flex; flex-direction:column; height:100%; overflow:hidden; }'

NEW_CSS = '''    /* CODEX */
    #codex-view { display:flex; flex-direction:column; height:100%; overflow:hidden; }
    #codex-inner { flex:1; overflow-y:auto; padding:12px 16px calc(16px + var(--safe-bot)); height:100%; -webkit-overflow-scrolling:touch; }'''

if OLD_CSS not in src:
    print('ERROR: CSS anchor not found — checking for alternate form...')
    # Check what's actually there
    idx = src.find('#codex-view')
    if idx >= 0:
        print(f'Found #codex-view at index {idx}:')
        print(repr(src[idx:idx+200]))
    sys.exit(1)

src = src.replace(OLD_CSS, NEW_CSS, 1)
print('OK: patched CSS')

# ── PATCH 2: HTML — wrap codex content in #codex-inner ──
# Find the SHEET VIEW div and wrap its children

OLD_HTML = '''  <!-- SHEET VIEW -->
  <div class="view" id="view-codex">
      <div class="char-selector" id="char-selector"><!-- populated by JS --></div>'''

NEW_HTML = '''  <!-- SHEET VIEW -->
  <div class="view" id="view-codex">
    <div id="codex-inner">
      <div class="char-selector" id="char-selector"><!-- populated by JS --></div>'''

if OLD_HTML not in src:
    print('ERROR: HTML open anchor not found')
    idx = src.find('id="view-codex"')
    if idx >= 0:
        print(repr(src[idx:idx+300]))
    sys.exit(1)

src = src.replace(OLD_HTML, NEW_HTML, 1)
print('OK: patched HTML open — added #codex-inner wrapper')

# ── PATCH 3: HTML — close the #codex-inner wrapper ──
# The closing spacer div and end of view-codex

OLD_CLOSE = '''      <div style="height:100px"></div>
  </div>

  <!-- VAULT VIEW -->'''

NEW_CLOSE = '''      <div style="height:100px"></div>
    </div><!-- end #codex-inner -->
  </div>

  <!-- VAULT VIEW -->'''

if OLD_CLOSE not in src:
    print('ERROR: HTML close anchor not found')
    idx = src.find('height:100px')
    if idx >= 0:
        print(repr(src[idx-20:idx+200]))
    sys.exit(1)

src = src.replace(OLD_CLOSE, NEW_CLOSE, 1)
print('OK: patched HTML close — closed #codex-inner wrapper')

# ── WRITE ──────────────────────────────────────────────────
with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(src)

print()
print('All 3 patches applied to index.html')
print()
print('Run:')
print('  git add . && git commit -m "fix: codex view scroll — add #codex-inner wrapper" && git push --force origin main')
