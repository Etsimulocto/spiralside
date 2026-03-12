#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_music_view.py
# Precisely patches index.html and main.js to add music view
# Uses exact strings from the actual files
# Run from ~/spiralside: py fix_music_view.py
# ============================================================

import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    full = os.path.join(BASE, path)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  wrote: {path}')

def patch(path, old, new, label=''):
    content = read(path)
    if old not in content:
        print(f'  WARN: not found in {path} [{label}]')
        print(f'        looking for: {repr(old[:60])}')
        return False
    write(path, content.replace(old, new, 1))
    print(f'  patched: {path} [{label}]')
    return True

print('🔧 Fixing music view wiring...')

# ── 1. Add music view div before FAB in index.html ────────────
patch('index.html',
    '  <!-- FAB -->\n  <div id="fab-container">',
    '  <!-- MUSIC VIEW -->\n  <div class="view" id="view-music"></div>\n\n  <!-- FAB -->\n  <div id="fab-container">',
    'add view-music div')

# ── 2. Patch main.js — add imports ────────────────────────────
patch('js/app/main.js',
    "import { initBuild, loadBotIntoForm }              from './build.js';",
    "import { initBuild, loadBotIntoForm }              from './build.js';\nimport { initMusic }                               from './music.js';\nimport { initMusicView, destroyMusicView }         from './musicview.js';",
    'add music imports')

# ── 3. Expose destroyMusicView on window ──────────────────────
patch('js/app/main.js',
    "window.saveSummarize     = saveSummarize;",
    "window.saveSummarize     = saveSummarize;\nwindow.initMusicView     = initMusicView;\nwindow.destroyMusicView  = destroyMusicView;",
    'expose music view globals')

# ── 4. Call initMusic in onAppReady ───────────────────────────
patch('js/app/main.js',
    "  handlePayPalReturn();\n}",
    "  handlePayPalReturn();\n  initMusic();\n}",
    'call initMusic in onAppReady')

# ── 5. Add music to FAB tabs in state.js ─────────────────────
state_content = read('js/app/state.js')

# Look for the FAB_TABS array
if 'FAB_TABS' in state_content and 'view-music' not in state_content:
    # Find the last entry in FAB_TABS and add music after it
    old_fab = "  { id: 'build',  label: 'build',  icon: '⚙',  color: '#FFD93D', view: 'view-build'  },"
    new_fab = """  { id: 'build',  label: 'build',  icon: '⚙',  color: '#FFD93D', view: 'view-build'  },
  { id: 'music',  label: 'music',  icon: '♪',  color: '#00F6D6', view: 'view-music',
    onOpen: () => window.initMusicView && window.initMusicView(),
    onClose: () => window.destroyMusicView && window.destroyMusicView() },"""
    if patch('js/app/state.js', old_fab, new_fab, 'add music FAB tab'):
        print('  ✓ Music added to FAB_TABS')
    else:
        # Try alternate — show what FAB_TABS looks like
        idx = state_content.find('FAB_TABS')
        if idx >= 0:
            print('  FAB_TABS context:')
            print(repr(state_content[idx:idx+400]))
        else:
            print('  FAB_TABS not found in state.js — checking ui.js for FAB build')
            ui_content = read('js/app/ui.js')
            fab_idx = ui_content.find('buildFAB')
            if fab_idx >= 0:
                print('  buildFAB context in ui.js:')
                print(repr(ui_content[fab_idx:fab_idx+600]))
else:
    if 'view-music' in state_content:
        print('  skip: music FAB already in state.js')
    else:
        print('  FAB_TABS not in state.js — music FAB needs manual add')
        # Show state.js FAB area
        idx = state_content.find('FAB')
        print(f'  FAB context: {repr(state_content[max(0,idx):idx+300])}')

# ── 6. Update musicview.js to use correct view ID ────────────
musicview_content = read('js/app/musicview.js')
if "getElementById('music-view')" in musicview_content:
    write('js/app/musicview.js',
          musicview_content.replace("getElementById('music-view')", "getElementById('view-music')"))
    print('  patched: js/app/musicview.js [fix view ID to view-music]')
else:
    print('  skip: musicview.js already uses correct ID or different pattern')

print()
print('✅ Done! Run:')
print('  git add .')
print('  git commit -m "fix: wire music view into app"')
print('  git push')
