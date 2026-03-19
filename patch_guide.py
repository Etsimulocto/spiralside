#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — GUIDE TAB WIRE-UP PATCH
# 1. Copies guide.js into js/app/views/
# 2. Adds guide tab to FAB_TABS in state.js
# 3. Imports + wires initGuide / renderGuide in main.js
# Run from ~/spiralside
# Nimbis anchor: patch_guide.py
# ============================================================

import shutil, re

# ── STEP 1: Copy guide.js ─────────────────────────────────────
shutil.copy('_guide_src.js', 'js/app/views/guide.js')
print('[1/3] guide.js copied to js/app/views/guide.js')

# ── STEP 2: state.js — add guide to FAB_TABS ──────────────────
src = open('js/app/state.js', encoding='utf-8').read()

# Find the FAB_TABS array and inject guide entry
# Looking for the closing bracket pattern of FAB_TABS
# Inject before the last entry that has no comma, OR after the last comma entry

# Strategy: find '{ id: \'account\'' entry and insert guide before it, OR
# find the last }  ] pattern and insert before ]
# We'll search for a known last tab and insert guide tab before closing bracket

OLD = "  { id: 'account',"
NEW = "  { id: 'guide',   icon: '🌀', label: 'guide',   view: 'view-guide'   },\n  { id: 'account',"

if OLD in src:
    src = src.replace(OLD, NEW, 1)
    open('js/app/state.js', 'w', encoding='utf-8').write(src)
    print('[2/3] guide tab added to FAB_TABS in state.js')
else:
    print('[2/3] WARN: FAB_TABS account entry not found — check state.js manually')
    print('      Searching for nearby context...')
    idx = src.find('account')
    if idx >= 0:
        print(repr(src[max(0,idx-80):idx+80]))

# ── STEP 3: main.js — import and wire initGuide / renderGuide ─
src = open('js/app/main.js', encoding='utf-8').read()

# Add import after the last views/ import line
# Find store.js or account.js import and insert after it
OLD2 = "import { initAccount"
NEW2 = "import { initGuide, renderGuide } from './views/guide.js';\nimport { initAccount"

if OLD2 in src:
    src = src.replace(OLD2, NEW2, 1)
    print('[3a/3] import added to main.js')
else:
    # Try alternate — insert after spiralcut or code import
    OLD2b = "import { initCode"
    NEW2b = "import { initGuide, renderGuide } from './views/guide.js';\nimport { initCode"
    if OLD2b in src:
        src = src.replace(OLD2b, NEW2b, 1)
        print('[3a/3] import added (alternate anchor) to main.js')
    else:
        print('[3a/3] WARN: could not find import anchor in main.js')
        print('       Add manually: import { initGuide, renderGuide } from "./views/guide.js";')

# Wire initGuide() call after initAccount() or similar
OLD3 = "initAccount();"
NEW3 = "initAccount();\n  initGuide();"

if OLD3 in src:
    src = src.replace(OLD3, NEW3, 1)
    print('[3b/3] initGuide() wired in main.js')
else:
    print('[3b/3] WARN: initAccount() not found — add initGuide() manually after auth init')

# Wire renderGuide in switchView if present
# switchView calls render functions — find the pattern and add guide
OLD4 = "case 'view-store':    renderStore();    break;"
NEW4 = "case 'view-guide':    renderGuide();    break;\n      case 'view-store':    renderStore();    break;"

if OLD4 in src:
    src = src.replace(OLD4, NEW4, 1)
    print('[3c/3] renderGuide() wired in switchView')
else:
    # Try ui.js instead
    print('[3c/3] NOTE: switchView not in main.js — will check ui.js separately')

open('js/app/main.js', 'w', encoding='utf-8').write(src)

print()
print('Done. Check ui.js if switchView renderGuide warning fired above.')
print('Also add <div id="view-guide" class="view"></div> to index.html if not present.')
