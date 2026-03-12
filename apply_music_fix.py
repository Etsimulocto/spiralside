#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — apply_music_fix.py
# Applies music FAB entry + switchView lifecycle hooks
# Run from ~/spiralside: py apply_music_fix.py
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
        print(f'  SKIP (already done or not found): [{label}]')
        return False
    write(path, content.replace(old, new, 1))
    print(f'  patched: {path} [{label}]')
    return True

print('🎵 Applying music fixes...')

# ── 1. Add music to FAB_TABS in state.js ─────────────────────
patch('js/app/state.js',
    "  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },\n];",
    "  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },\n"
    "  { id: 'music', label: 'music', icon: '♪',  color: '#00F6D6',\n"
    "    onOpen:  () => window.initMusicView   && window.initMusicView(),\n"
    "    onClose: () => window.destroyMusicView && window.destroyMusicView() },\n"
    "];",
    'add music to FAB_TABS')

# ── 2. Patch switchView in ui.js ─────────────────────────────
patch('js/app/ui.js',
    "export function switchView(id) {\n  state.activeView = id;\n\n  // Close FAB",
    "export function switchView(id) {\n"
    "  const prevId = state.activeView;\n"
    "  state.activeView = id;\n\n"
    "  // Call onClose for previous view\n"
    "  const prevTab = FAB_TABS.find(t => t.id === prevId);\n"
    "  if (prevTab?.onClose) prevTab.onClose();\n\n"
    "  // Close FAB",
    'add onClose to switchView')

patch('js/app/ui.js',
    "  document.getElementById(`view-${id}`)?.classList.add('active');\n\n"
    "  // Header glow color per view",
    "  document.getElementById(`view-${id}`)?.classList.add('active');\n\n"
    "  // Call onOpen for new view\n"
    "  const nextTab = FAB_TABS.find(t => t.id === id);\n"
    "  if (nextTab?.onOpen) nextTab.onOpen();\n\n"
    "  // Header glow color per view",
    'add onOpen to switchView')

patch('js/app/ui.js',
    "{ chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D' }",
    "{ chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D', music: '#00F6D6' }",
    'add music glow color')

# ── VERIFY ────────────────────────────────────────────────────
state = read('js/app/state.js')
ui    = read('js/app/ui.js')
print()
print('Verification:')
print(f"  music in FAB_TABS:   {'✓' if 'id: .music.' in state else '✗'}")
print(f"  onOpen in FAB_TABS:  {'✓' if 'onOpen' in state else '✗'}")
print(f"  onClose in ui.js:    {'✓' if 'prevTab?.onClose' in ui else '✗'}")
print(f"  onOpen in ui.js:     {'✓' if 'nextTab?.onOpen' in ui else '✗'}")
print(f"  music glow:          {'✓' if 'music:' in ui else '✗'}")
print()
print('Run:')
print('  git add .')
print('  git commit -m "fix: music FAB + switchView lifecycle"')
print('  git push')
