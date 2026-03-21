# ============================================================
# SPIRALSIDE — PATCH: codex scroll fix v2 (exact anchors)
# Verified against live HTML before writing
# Run ONCE from Git Bash in ~/spiralside
# Nimbis anchor: _patch_codex_scroll2.py
# ============================================================

import sys

TARGET = 'index.html'

with open(TARGET, 'r', encoding='utf-8') as f:
    src = f.read()

errors = []

# ── PATCH 1: CSS — replace the sheet-view / codex-view block ──
# Currently: #codex-view { display:flex; flex-direction:column; height:100%; overflow:hidden; }
# We add #codex-inner right after it
OLD_CSS = '    #codex-view { display:flex; flex-direction:column; height:100%; overflow:hidden; }'
NEW_CSS = ('    #codex-view { display:flex; flex-direction:column; height:100%; overflow:hidden; }\n'
           '    #codex-inner { flex:1; overflow-y:auto; padding:12px 16px calc(80px + var(--safe-bot)); -webkit-overflow-scrolling:touch; }')

if src.count(OLD_CSS) != 1:
    errors.append(f'CSS anchor found {src.count(OLD_CSS)} times (expected 1)')
else:
    src = src.replace(OLD_CSS, NEW_CSS, 1)
    print('OK patch 1: CSS #codex-inner rule added')

# ── PATCH 2: HTML — wrap content in #codex-inner ──
# Open: right after <div class="view" id="view-codex">
OLD_HTML_OPEN = '  <div class="view" id="view-codex">\n      <div class="char-selector" id="char-selector">'
NEW_HTML_OPEN = '  <div class="view" id="view-codex">\n    <div id="codex-inner">\n      <div class="char-selector" id="char-selector">'

if src.count(OLD_HTML_OPEN) != 1:
    errors.append(f'HTML open anchor found {src.count(OLD_HTML_OPEN)} times (expected 1)')
else:
    src = src.replace(OLD_HTML_OPEN, NEW_HTML_OPEN, 1)
    print('OK patch 2: #codex-inner open div added')

# ── PATCH 3: HTML — close #codex-inner before </div> end of view ──
# The spacer div is the last element before the view closes
OLD_HTML_CLOSE = '      <div style="height:100px"></div>\n  </div>\n\n  <!-- VAULT VIEW -->'
NEW_HTML_CLOSE = '      <div style="height:100px"></div>\n    </div><!-- /#codex-inner -->\n  </div>\n\n  <!-- VAULT VIEW -->'

if src.count(OLD_HTML_CLOSE) != 1:
    errors.append(f'HTML close anchor found {src.count(OLD_HTML_CLOSE)} times (expected 1)')
else:
    src = src.replace(OLD_HTML_CLOSE, NEW_HTML_CLOSE, 1)
    print('OK patch 3: #codex-inner close div added')

# ── ABORT if any errors ──
if errors:
    print()
    print('ERRORS — no file written:')
    for e in errors:
        print(' -', e)
    sys.exit(1)

# ── WRITE ──
with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(src)

print()
print('All 3 patches applied successfully.')
print()
print('git add . && git commit -m "fix: codex scroll — #codex-inner wrapper" && git push --force origin main')
