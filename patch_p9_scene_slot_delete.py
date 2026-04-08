#!/usr/bin/env python3
# SPIRALSIDE patch_p9_scene_slot_delete.py
# Add delete button to scene track slots (same confirm pattern as gallery)
# Run: cd ~/spiralside && python patch_p9_scene_slot_delete.py

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
# 1. CSS — add scene slot delete button style
# ============================================================
OLD_CSS = """    /* delete button on frame slots */
    .tl-frame-del {
      position:absolute; top:2px; right:2px; z-index:20;
      width:16px; height:16px; border-radius:50%;
      background:rgba(0,0,0,0.7); border:none;
      color:rgba(255,255,255,0.6); font-size:0.5rem;
      cursor:pointer; display:flex; align-items:center;
      justify-content:center; line-height:1; padding:0;
      transition:color 0.15s, background 0.15s;
    }
    .tl-frame-del:hover { background:var(--pink); color:#fff; }"""

NEW_CSS = """    /* delete buttons on frame and scene slots */
    .tl-frame-del, .tl-scene-del {
      position:absolute; top:2px; right:2px; z-index:20;
      width:16px; height:16px; border-radius:50%;
      background:rgba(0,0,0,0.7); border:none;
      color:rgba(255,255,255,0.6); font-size:0.5rem;
      cursor:pointer; display:flex; align-items:center;
      justify-content:center; line-height:1; padding:0;
      transition:color 0.15s, background 0.15s;
    }
    .tl-frame-del:hover { background:var(--pink); color:#fff; }
    .tl-scene-del { opacity:0; transition:opacity 0.15s, background 0.15s; }
    .tl-slot:hover .tl-scene-del { opacity:1; }
    .tl-scene-del:hover { background:var(--pink); color:#fff; }
    .tl-scene-del.confirm { background:var(--pink); color:#fff; opacity:1; }"""

patch(LIB, OLD_CSS, NEW_CSS, 'library.js: scene slot delete CSS')

# ============================================================
# 2. renderStrip scene track — add delete button after slot content
#    Anchor: the "// highlight active" comment in scene track
# ============================================================
OLD_SCENE_ACTIVE = """    // highlight active
    if (idx === editingSlotIdx) div.classList.add('active');

    // click → open slot editor
    div.addEventListener('click', () => openSlotEditor(idx, slot.type));"""

NEW_SCENE_ACTIVE = """    // Delete button — appears on hover, requires confirm tap
    const sceneDelBtn = document.createElement('button');
    sceneDelBtn.className = 'tl-scene-del';
    sceneDelBtn.textContent = '\u2715';
    sceneDelBtn.title = 'remove slot';
    sceneDelBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (sceneDelBtn.dataset.confirm === '1') {
        // Confirmed — delete slot
        const b = books.find(b => b.id === viewingBookId);
        if (!b) return;
        b.slots.splice(idx, 1);
        if (editingSlotIdx === idx) {
          editingSlotIdx = null;
          showSlotEmpty();
        } else if (editingSlotIdx !== null && editingSlotIdx > idx) {
          editingSlotIdx--;
        }
        dbSet('books', b);
        renderStrip(b);
      } else {
        // First tap — request confirm
        sceneDelBtn.dataset.confirm = '1';
        sceneDelBtn.classList.add('confirm');
        sceneDelBtn.textContent = '?';
        setTimeout(() => {
          if (sceneDelBtn) {
            delete sceneDelBtn.dataset.confirm;
            sceneDelBtn.classList.remove('confirm');
            sceneDelBtn.textContent = '\u2715';
          }
        }, 2000);
      }
    });
    div.appendChild(sceneDelBtn);

    // highlight active
    if (idx === editingSlotIdx) div.classList.add('active');

    // click → open slot editor
    div.addEventListener('click', () => openSlotEditor(idx, slot.type));"""

patch(LIB, OLD_SCENE_ACTIVE, NEW_SCENE_ACTIVE, 'library.js: scene slot delete button')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "feat: delete button on scene track slots"')
print('  git push --force origin main')
