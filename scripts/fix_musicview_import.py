#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_musicview_import.py
# Restores the accidentally removed musicview.js import
# Run from ~/spiralside: py fix_musicview_import.py
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
        print(f'  WARN: not found [{label}]')
        return False
    write(path, content.replace(old, new, 1))
    print(f'  patched: {path} [{label}]')
    return True

print('🔧 Restoring musicview import...')

# Add musicview import right after the music.js import
patch('js/app/main.js',
    "import { initMusic }          from './music.js';",
    "import { initMusic }          from './music.js';\nimport { initMusicView, destroyMusicView } from './musicview.js';",
    'restore musicview import')

# Verify
main = read('js/app/main.js')
print()
print('Verification:')
print(f'  initMusic import:    {"✓" if "initMusic" in main and "from \'./music.js\'" in main else "✗"}')
print(f'  musicview import:    {"✓" if "musicview" in main else "✗"}')
print(f'  window.initMusicView: {"✓" if "window.initMusicView" in main else "✗"}')

print()
print('Run:')
print('  git add .')
print('  git commit -m "fix: restore musicview import"')
print('  git push')
