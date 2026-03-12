#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_music_final.py
# Fixes the 2 remaining misses from fix_music_view.py
# Run from ~/spiralside: py fix_music_final.py
# ============================================================

import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(os.path.join(BASE, path), 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  wrote: {path}')

def patch(path, old, new, label=''):
    content = read(path)
    if old not in content:
        print(f'  WARN: not found [{label}]: {repr(old[:80])}')
        return False
    write(path, content.replace(old, new, 1))
    print(f'  patched: {path} [{label}]')
    return True

print('🔧 Final music fixes...')

# ── FIX 1: initMusic in onAppReady ───────────────────────────
# The handlePayPalReturn line doesn't end with \n} — check actual ending
main = read('js/app/main.js')
pp_idx = main.find('handlePayPalReturn()')
if pp_idx >= 0:
    snippet = main[pp_idx:pp_idx+60]
    print(f'  handlePayPalReturn context: {repr(snippet)}')

# Try the actual ending from the file
patch('js/app/main.js',
    '  handlePayPalReturn();\n}',
    '  handlePayPalReturn();\n  initMusic();\n}',
    'initMusic in onAppReady')

# If that still missed, try without the closing brace
if 'initMusic()' not in read('js/app/main.js'):
    patch('js/app/main.js',
        'handlePayPalReturn();',
        'handlePayPalReturn();\n  initMusic();',
        'initMusic fallback')

# ── FIX 2: Music FAB tab in state.js ─────────────────────────
# Actual content from debug: no 'view' key, no trailing comma on last item
patch('js/app/state.js',
    "  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },\n];",
    "  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },\n  { id: 'music', label: 'music', icon: '♪',  color: '#00F6D6', view: 'view-music' },\n];",
    'add music to FAB_TABS')

print()

# ── VERIFY ────────────────────────────────────────────────────
main = read('js/app/main.js')
state = read('js/app/state.js')
print('Verification:')
print(f'  initMusic in main.js:    {"✓" if "initMusic()" in main else "✗ STILL MISSING"}')
print(f'  music in FAB_TABS:       {"✓" if "view-music" in state else "✗ STILL MISSING"}')
print(f'  musicview import:        {"✓" if "musicview" in main else "✗ STILL MISSING"}')

print()
print('Run:')
print('  git add .')
print('  git commit -m "fix: wire music view final"')
print('  git push')
