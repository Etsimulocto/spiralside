#!/usr/bin/env python3
# _patch3_imagine_to_library.py
# Adds "save to library" button to imagine2.js result block

import os

PATH = os.path.expanduser('~/spiralside/js/app/imagine2.js')

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. Add button to result HTML ──────────────────────────────
OLD_HTML = '''      <button class="im-save-btn" id="im-save">💾 save image</button>`;'''

NEW_HTML = '''      <button class="im-save-btn" id="im-save">💾 save image</button>
      <button class="im-save-btn" id="im-to-lib" style="margin-top:6px;border-color:var(--pink);color:var(--pink)">📚 save to library</button>`;'''

# ── 2. Add click handler after existing im-save handler ───────
OLD_WIRE = '''    document.getElementById('im-save')?.addEventListener('click', () => {
      const a = document.createElement('a'); a.href = url; a.download = 'spiralside-gen.png'; a.click();
    });'''

NEW_WIRE = '''    document.getElementById('im-save')?.addEventListener('click', () => {
      const a = document.createElement('a'); a.href = url; a.download = 'spiralside-gen.png'; a.click();
    });
    // Save to library — calls window.saveImageToLibrary from library.js
    document.getElementById('im-to-lib')?.addEventListener('click', async () => {
      const btn = document.getElementById('im-to-lib');
      if (!btn) return;
      btn.textContent = '✓ saved to library!';
      btn.disabled = true;
      if (window.saveImageToLibrary) {
        await window.saveImageToLibrary(url, 'generated-' + Date.now() + '.png');
      }
      setTimeout(() => { if (btn) { btn.textContent = '📚 save to library'; btn.disabled = false; } }, 1800);
    });'''

# Apply both substitutions
if OLD_HTML not in src:
    print('[ERROR] Could not find result HTML anchor')
    print('Looking for:', repr(OLD_HTML))
    import sys; sys.exit(1)

if OLD_WIRE not in src:
    print('[ERROR] Could not find im-save click handler anchor')
    print('Looking for:', repr(OLD_WIRE))
    import sys; sys.exit(1)

src = src.replace(OLD_HTML, NEW_HTML)
src = src.replace(OLD_WIRE, NEW_WIRE)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

print('[OK] imagine2.js patched')
print('[OK] save-to-library button added to result HTML')
print('[OK] im-to-lib click handler wired')
print('\nNow push:')
print('  git add . && git commit -m "feat: imagine->library save button" && git push --force origin main')
