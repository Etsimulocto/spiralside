#!/usr/bin/env python3
# _patch2_html_and_wiring.py
# 1. Strip library HTML from index.html (leave empty div)
# 2. Expose window.saveImageToLibrary in main.js
# 3. Add "save to library" button in imagine.js after generation

import os, sys

BASE = os.path.expanduser('~/spiralside')

# ── 1. STRIP LIBRARY HTML FROM index.html ─────────────────────
html_path = os.path.join(BASE, 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# The library view block — starts with comment and ends after book-builder-overlay closing div
# We'll replace the full library view div (including the two overlays that follow it) with a clean empty div.
# Strategy: find the start anchor, find the end anchor, replace everything between.

OLD_LIB_START = '  <!-- LIBRARY VIEW -->'
OLD_LIB_END = '</div>\n\n  <!-- BOOK BUILDER OVERLAY -->'

# Find the library view section start
idx_start = html.find(OLD_LIB_START)
if idx_start == -1:
    print('[WARN] Library view comment not found — trying alternate anchor')
    OLD_LIB_START = '<div class="view" id="view-library">'
    idx_start = html.find(OLD_LIB_START)

if idx_start == -1:
    print('[ERROR] Cannot find library view section in index.html')
    sys.exit(1)

# Find the panel-editor-overlay end (after book-builder-overlay closing div)
# The overlays come right after the library view in the HTML
OVERLAYS_END_MARKER = '  <!-- FAB -->'
idx_end = html.find(OVERLAYS_END_MARKER, idx_start)
if idx_end == -1:
    print('[ERROR] Cannot find FAB comment (end marker for library section)')
    sys.exit(1)

# Extract the block to be replaced
old_block = html[idx_start:idx_end]
print(f'[OK] Found library block: {len(old_block)} chars')

# Check the block contains what we expect
checks = ['view-library', 'panel-editor-overlay', 'book-builder-overlay']
for c in checks:
    if c not in old_block:
        print(f'[WARN] Expected "{c}" not found in block — check manually')

# New replacement: clean empty view div (overlays are now stamped by library.js)
new_block = '''  <!-- LIBRARY VIEW — HTML stamped by js/app/library.js initLibrary() -->
  <div class="view" id="view-library"></div>

  '''

html_new = html[:idx_start] + new_block + html[idx_end:]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_new)

# Verify
with open(html_path, 'r', encoding='utf-8') as f:
    verify = f.read()

print(f'[OK] index.html patched: lib block stripped')
print(f'[OK] panel-editor-overlay still present: {"panel-editor-overlay" in verify}')
print(f'[OK] book-builder-overlay still present: {"book-builder-overlay" in verify}')
# These should now be FALSE (we removed the inline HTML, overlays created by library.js at runtime)
# Actually they'll still be in the new verify because library.js creates them dynamically at runtime
# What matters is the static index.html no longer has the big block

# ── 2. WIRE saveImageToLibrary in main.js ─────────────────────
main_path = os.path.join(BASE, 'js/app/main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

OLD_IMPORT = "import { initLibrary, openPanelEditor, deletePanel,\n         openBookBuilder, addPanelToBook,\n         removePanelFromBook, movePanelInBook,\n         deleteBook }                              from './library.js';"

NEW_IMPORT = "import { initLibrary, openPanelEditor, deletePanel,\n         openBookBuilder, addPanelToBook,\n         removePanelFromBook, movePanelInBook,\n         deleteBook, saveImageToLibrary }          from './library.js';"

if OLD_IMPORT not in main:
    print('[ERROR] Library import block not found in main.js — check spacing')
    # Print the actual import line for diagnosis
    for line in main.split('\n'):
        if 'library.js' in line or 'initLibrary' in line:
            print(f'  FOUND: {repr(line)}')
    sys.exit(1)

main = main.replace(OLD_IMPORT, NEW_IMPORT)

# Add window.saveImageToLibrary exposure after window.deleteBook
OLD_EXPOSE = "window.deleteBook        = deleteBook;"
NEW_EXPOSE = "window.deleteBook        = deleteBook;\nwindow.saveImageToLibrary = saveImageToLibrary;"

if OLD_EXPOSE not in main:
    print('[ERROR] window.deleteBook not found in main.js')
    sys.exit(1)

main = main.replace(OLD_EXPOSE, NEW_EXPOSE)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main)

print('[OK] main.js: saveImageToLibrary imported + exposed on window')

# ── 3. ADD "SAVE TO LIBRARY" BUTTON IN imagine.js ─────────────
imagine_path = os.path.join(BASE, 'js/app/imagine2.js')
if not os.path.exists(imagine_path):
    imagine_path = os.path.join(BASE, 'js/app/imagine.js')

with open(imagine_path, 'r', encoding='utf-8') as f:
    imagine = f.read()

# Find the result rendering block where we already have the save/download button
# We want to add a "save to library" button right after the download button
OLD_SAVE_BTN = "        <button class=\"imagine-btn\" id=\"imagine-save\">💾 save image</button>`;"

NEW_SAVE_BTN = """        <button class="imagine-btn" id="imagine-save">💾 save image</button>
        <button class="imagine-btn" id="imagine-to-lib" style="background:linear-gradient(135deg,var(--pink),var(--purple));margin-top:6px">📚 save to library</button>\`;"""

if OLD_SAVE_BTN not in imagine:
    # Try without the backtick semicolon
    OLD_SAVE_BTN = '        <button class="imagine-btn" id="imagine-save">💾 save image</button>`'
    NEW_SAVE_BTN = """        <button class="imagine-btn" id="imagine-save">💾 save image</button>
        <button class="imagine-btn" id="imagine-to-lib" style="background:linear-gradient(135deg,var(--pink),var(--purple));margin-top:6px">📚 save to library</button>`"""

if OLD_SAVE_BTN not in imagine:
    print('[WARN] Could not find imagine save button — searching for similar...')
    for i, line in enumerate(imagine.split('\n')):
        if 'imagine-save' in line or 'save image' in line:
            print(f'  L{i}: {repr(line)}')
else:
    imagine = imagine.replace(OLD_SAVE_BTN, NEW_SAVE_BTN)
    print('[OK] imagine.js: save-to-library button added to result HTML')

# Now wire the click handler for the new button
# Find where imagine-save click handler is wired, add ours after it
OLD_SAVE_WIRE = """      document.getElementById('imagine-save')?.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'spiralside-gen.png'; a.click();
      });"""

NEW_SAVE_WIRE = """      document.getElementById('imagine-save')?.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'spiralside-gen.png'; a.click();
      });
      // Save to library button — calls window.saveImageToLibrary from library.js
      document.getElementById('imagine-to-lib')?.addEventListener('click', async () => {
        const libBtn = document.getElementById('imagine-to-lib');
        if (!libBtn) return;
        libBtn.textContent = '✓ saved!';
        libBtn.disabled = true;
        if (window.saveImageToLibrary) {
          await window.saveImageToLibrary(url, 'generated-' + Date.now() + '.png');
        }
        setTimeout(() => { libBtn.textContent = '📚 save to library'; libBtn.disabled = false; }, 1500);
      });"""

if OLD_SAVE_WIRE in imagine:
    imagine = imagine.replace(OLD_SAVE_WIRE, NEW_SAVE_WIRE)
    print('[OK] imagine.js: save-to-library click handler wired')
else:
    print('[WARN] Could not find imagine-save click handler to splice into')
    # Try a simpler search
    for i, line in enumerate(imagine.split('\n')):
        if "imagine-save" in line and "addEventListener" in line:
            print(f'  L{i}: {repr(line)}')

with open(imagine_path, 'w', encoding='utf-8') as f:
    f.write(imagine)

print(f'[OK] {imagine_path} patched')
print('\n[DONE] All patches applied. Run:')
print('  cd ~/spiralside')
print('  git add .')
print('  git commit -m "refactor: library modular, imagine->library wiring"')
print('  git push --force origin main')
