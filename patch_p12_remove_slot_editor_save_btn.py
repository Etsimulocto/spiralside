#!/usr/bin/env python3
# SPIRALSIDE patch_p12_remove_slot_editor_save_btn.py
# Remove the "save panel / remove" action row from the image slot editor
# (book header already has ↓ save; slot changes auto-apply on picking/editing)
# Also: auto-save slot on any field change so the row isn't needed at all
# Run: cd ~/spiralside && python patch_p12_remove_slot_editor_save_btn.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read().replace('\r\n', '\n')

def write(p, c):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

def patch(path, old, new, label):
    src = read(path)
    old = old.replace('\r\n', '\n')
    new = new.replace('\r\n', '\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx = src.find(old[:30])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[prefix not found] '+repr(old[:60])))
        sys.exit(1)
    if src.count(old) > 1:
        print(f'[DUPE] {label} count={src.count(old)}')
        sys.exit(1)
    write(path, src.replace(old, new))
    print(f'[OK] {label}')

LIB = 'js/app/library.js'

# ============================================================
# 1. Remove action row HTML from se-image-edit-panel
# ============================================================
patch(LIB,
    """          <div class="se-label">caption</div>
          <input class="se-input" id="se-cap-speaker" placeholder="speaker (blank = narrator)" />
          <textarea class="se-input" id="se-cap-text" rows="2" placeholder="dialogue or caption..." style="margin-top:6px"></textarea>
          <div class="se-action-row">
            <button class="se-save-btn" id="se-img-save">save panel</button>
            <button class="se-del-btn" id="se-img-del">remove</button>
          </div>""",
    """          <div class="se-label">caption</div>
          <input class="se-input" id="se-cap-speaker" placeholder="speaker (blank = narrator)" />
          <textarea class="se-input" id="se-cap-text" rows="2" placeholder="dialogue or caption..." style="margin-top:6px"></textarea>
          <!-- save panel / remove buttons removed — auto-saves on change, use header ↓ save to export -->
          <button class="se-del-btn" id="se-img-del" style="margin-top:4px;width:100%">remove slot</button>""",
    'library.js: remove save panel button from slot editor')

# ============================================================
# 2. Remove the wireTimeline binding for se-img-save
#    and replace with auto-save on input change
# ============================================================
patch(LIB,
    "  document.getElementById('se-img-save').addEventListener('click', saveImageSlot);\n  document.getElementById('se-img-del').addEventListener('click',  deleteCurrentSlot);",
    """  // Auto-save image slot on any field change (no manual save button needed)
  ['se-cap-speaker','se-cap-text'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      if (editingSlotIdx !== null) saveImageSlot();
    });
  });
  document.getElementById('se-img-del').addEventListener('click', deleteCurrentSlot);""",
    'library.js: auto-save slot on input change')

# ============================================================
# 3. Also auto-save when filter or tag chips change
#    (they already have click handlers — append saveImageSlot call)
# ============================================================
patch(LIB,
    """  document.querySelectorAll('#se-filter-chips .se-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('#se-filter-chips .se-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const fObj = FILTERS.find(f => f.id === c.dataset.filter) || FILTERS[0];
      const img = document.getElementById('se-img-preview');
      if (img) img.style.filter = fObj.css;
    })
  );
  document.querySelectorAll('#se-tag-chips .se-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('#se-tag-chips .se-chip').forEach(x => x.classList.remove('active', 'tag-active'));
      c.classList.add('tag-active');
    })
  );""",
    """  document.querySelectorAll('#se-filter-chips .se-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('#se-filter-chips .se-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const fObj = FILTERS.find(f => f.id === c.dataset.filter) || FILTERS[0];
      const img = document.getElementById('se-img-preview');
      if (img) img.style.filter = fObj.css;
      if (editingSlotIdx !== null) saveImageSlot();
    })
  );
  document.querySelectorAll('#se-tag-chips .se-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('#se-tag-chips .se-chip').forEach(x => x.classList.remove('active', 'tag-active'));
      c.classList.add('tag-active');
      if (editingSlotIdx !== null) saveImageSlot();
    })
  );""",
    'library.js: auto-save on filter/tag chip change')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "ux: remove redundant save panel btn; slot editor auto-saves on change"')
print('  git push --force origin main')
