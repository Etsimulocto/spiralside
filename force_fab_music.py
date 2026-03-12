#!/usr/bin/env python3
# SPIRALSIDE — force_fab_music.py
# Replaces the bare music FAB entry with one that has onOpen/onClose hooks
# Run from ~/spiralside: py force_fab_music.py

import os, re

BASE  = os.path.dirname(os.path.abspath(__file__))
path  = os.path.join(BASE, 'js/app/state.js')

content = open(path, 'r', encoding='utf-8').read()

# ── Old entry (no hooks, just a view: property) ───────────────
OLD = "  { id: 'music', label: 'music', icon: '♪',  color: '#00F6D6', view: 'view-music' },"

# ── New entry (with onOpen / onClose lifecycle hooks) ─────────
NEW = ("  { id: 'music', label: 'music', icon: '♪',  color: '#00F6D6',\n"
       "    onOpen:  () => window.initMusicView   && window.initMusicView(),\n"
       "    onClose: () => window.destroyMusicView && window.destroyMusicView() },")

if OLD not in content:
    print('❌ Exact string not found — printing music line from file:')
    for i, line in enumerate(content.splitlines(), 1):
        if 'music' in line:
            print(f'  line {i}: {repr(line)}')
    print('\nPaste this output to Claude for a precise fix.')
else:
    result = content.replace(OLD, NEW, 1)
    open(path, 'w', encoding='utf-8').write(result)
    print('✓ music FAB entry updated with onOpen/onClose hooks')
    print()
    print('Now run:')
    print('  git add .')
    print('  git commit -m "fix: music FAB lifecycle hooks"')
    print('  git push')
