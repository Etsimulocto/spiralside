#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_switchview_music.py
# Patches switchView to call onOpen/onClose lifecycle hooks
# and adds music glow color
# Run from ~/spiralside: py fix_switchview_music.py
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

print('🔧 Patching switchView for music lifecycle...')

# ── 1. Add music to glow colors ──────────────────────────────
patch('js/app/ui.js',
    "const glowColors = { chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D' };",
    "const glowColors = { chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D', music: '#00F6D6' };",
    'add music glow color')

# ── 2. Add onOpen/onClose lifecycle calls to switchView ──────
old_switch = """  // Activate the matching view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');"""

new_switch = """  // Call onClose for previous view
  const prevTab = FAB_TABS.find(t => t.id === state.activeView);
  if (prevTab?.onClose) prevTab.onClose();

  // Activate the matching view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');

  // Call onOpen for new view
  const nextTab = FAB_TABS.find(t => t.id === id);
  if (nextTab?.onOpen) nextTab.onOpen();"""

patch('js/app/ui.js', old_switch, new_switch, 'add lifecycle hooks to switchView')

# ── 3. Fix state.activeView timing — set AFTER finding prevTab ─
# The current code sets state.activeView = id at the TOP,
# so prevTab lookup finds the NEW id not the old one.
# Fix: capture previous id first.
patch('js/app/ui.js',
    """export function switchView(id) {
  state.activeView = id;

  // Close FAB""",
    """export function switchView(id) {
  const prevViewId = state.activeView;
  state.activeView = id;

  // Close FAB""",
    'capture prevViewId before overwrite')

# Also fix the prevTab lookup to use prevViewId
patch('js/app/ui.js',
    "  const prevTab = FAB_TABS.find(t => t.id === state.activeView);",
    "  const prevTab = FAB_TABS.find(t => t.id === prevViewId);",
    'use prevViewId in prevTab lookup')

print()
print('✅ Done! Run:')
print('  git add .')
print('  git commit -m "fix: music view lifecycle hooks in switchView"')
print('  git push')
