#!/usr/bin/env python3
# SPIRALSIDE patch_p8_frame_track_fixes.py
# 1. Frame track slots same size as scene slots (96px)
# 2. Frame slots show the image WITH frame overlay on top
# 3. Delete button on each frame slot to clear the frame
# Run: cd ~/spiralside && python patch_p8_frame_track_fixes.py

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
# 1. CSS — remove the frame track height override (44px),
#    let all slots be 96px. Add delete button style.
# ============================================================
OLD_CSS = """    /* FRAME track (top) — shorter slots */
    .tl-track.track-frame .tl-strip-wrap {
      padding:4px 16px 4px;
    }
    .tl-track.track-frame .tl-slot {
      height:44px;
      border-color:rgba(0,246,214,0.2);
      background:var(--surface2);
    }
    .tl-track.track-frame .tl-slot:hover { border-color:var(--teal); transform:scale(1.04); }
    .tl-track.track-frame .tl-slot.has-frame { border-color:rgba(0,246,214,0.5); }
    .tl-track.track-frame .tl-slot.tl-frame-empty {
      border-style:dashed; border-color:rgba(0,246,214,0.15);
      display:flex; align-items:center; justify-content:center;
      font-size:0.65rem; color:rgba(0,246,214,0.25);
    }
    .tl-track.track-frame .tl-slot.tl-frame-empty:hover {
      border-color:var(--teal); color:var(--teal);
    }"""

NEW_CSS = """    /* FRAME track (top) — same size as scene slots */
    .tl-track.track-frame .tl-strip-wrap {
      padding:4px 16px 4px;
    }
    .tl-track.track-frame .tl-slot {
      border-color:rgba(0,246,214,0.2);
      background:var(--surface2);
    }
    .tl-track.track-frame .tl-slot:hover { border-color:var(--teal); transform:scale(1.04); }
    .tl-track.track-frame .tl-slot.has-frame { border-color:rgba(0,246,214,0.5); }
    .tl-track.track-frame .tl-slot.tl-frame-empty {
      border-style:dashed; border-color:rgba(0,246,214,0.15);
      display:flex; align-items:center; justify-content:center;
      font-size:0.65rem; color:rgba(0,246,214,0.25);
    }
    .tl-track.track-frame .tl-slot.tl-frame-empty:hover {
      border-color:var(--teal); color:var(--teal);
    }
    /* delete button on frame slots */
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

patch(LIB, OLD_CSS, NEW_CSS, 'library.js: frame track CSS fixes')

# ============================================================
# 2. renderStrip — frame track slot: show image + frame overlay,
#    add delete button, remove inline height override
# ============================================================
OLD_FRAME_SLOT = """    if (frameStrip) {
      const fdiv = document.createElement('div');
      fdiv.className = 'tl-slot';
      fdiv.dataset.idx = idx;
      fdiv.style.height = '44px';

      if (slot.frameSVG) {
        // Show frame SVG preview
        fdiv.classList.add('has-frame');
        fdiv.innerHTML = slot.frameSVG;
        const svg = fdiv.querySelector('svg');
        if (svg) svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        // Frame name tooltip
        const lbl = document.createElement('div');
        lbl.style.cssText = 'position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:0.4rem;color:rgba(0,246,214,0.7);letter-spacing:0.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px';
        lbl.textContent = slot.frameName || '';
        fdiv.appendChild(lbl);
      } else {
        // Empty placeholder — click to pick a frame for this slot
        fdiv.classList.add('tl-frame-empty');
        fdiv.textContent = '\u25a3';  // ▣
      }

      // Click frame slot → open frame picker for this scene slot
      fdiv.addEventListener('click', () => {
        if (!window.openFramePicker) return;
        // First select the scene slot so editingSlotIdx is set
        editingSlotIdx = idx;
        refreshStripHighlight();
        window.openFramePicker({
          onSelect: (frame) => {
            // Apply frame directly to slot and save
            const b = books.find(b => b.id === viewingBookId);
            if (!b) return;
            const s = b.slots[idx];
            if (!s) return;
            s.frameId   = frame ? frame.id      : null;
            s.frameSVG  = frame ? frame.svgData : null;
            s.frameName = frame ? frame.name    : null;
            // Sync pending state so se-img-save also has it
            window._pendingFrameId   = s.frameId;
            window._pendingFrameSVG  = s.frameSVG;
            window._pendingFrameName = s.frameName;
            dbSet('books', b);
            renderStrip(b);
            // If slot editor is open on this slot, refresh frame preview
            if (editingSlotIdx === idx) {
              _updateFramePreview(frame);
            }
          }
        });
      });

      frameStrip.appendChild(fdiv);
    }"""

NEW_FRAME_SLOT = """    if (frameStrip) {
      const fdiv = document.createElement('div');
      fdiv.className = 'tl-slot';
      fdiv.dataset.idx = idx;

      if (slot.frameSVG) {
        fdiv.classList.add('has-frame');

        // Show the scene image as background (if image slot)
        if (slot.type === 'image') {
          const p = panels.find(x => x.id === slot.panelId);
          if (p) {
            const fObj = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
            const bgImg = document.createElement('img');
            bgImg.src = p.dataURL;
            bgImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none';
            bgImg.style.filter = fObj.css;
            fdiv.appendChild(bgImg);
          }
        }

        // Frame SVG overlay on top
        const fovEl = document.createElement('div');
        fovEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2';
        fovEl.innerHTML = slot.frameSVG;
        const fsvg = fovEl.querySelector('svg');
        if (fsvg) fsvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        fdiv.appendChild(fovEl);

        // Frame name label
        const lbl = document.createElement('div');
        lbl.style.cssText = 'position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:0.4rem;color:rgba(0,246,214,0.9);letter-spacing:0.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px;z-index:3;text-shadow:0 1px 3px #000';
        lbl.textContent = slot.frameName || '';
        fdiv.appendChild(lbl);

        // Delete button — clears frame from slot
        const delBtn = document.createElement('button');
        delBtn.className = 'tl-frame-del';
        delBtn.textContent = '\u2715';  // ✕
        delBtn.title = 'remove frame';
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          const b = books.find(b => b.id === viewingBookId);
          if (!b) return;
          const s = b.slots[idx];
          if (!s) return;
          s.frameId = s.frameSVG = s.frameName = null;
          if (editingSlotIdx === idx) {
            window._pendingFrameId = window._pendingFrameSVG = window._pendingFrameName = null;
            _updateFramePreview(null);
          }
          dbSet('books', b);
          renderStrip(b);
        });
        fdiv.appendChild(delBtn);

      } else {
        // Empty placeholder — click to pick a frame for this slot
        fdiv.classList.add('tl-frame-empty');
        fdiv.textContent = '\u25a3';  // ▣
      }

      // Click frame slot → open frame picker
      fdiv.addEventListener('click', () => {
        if (!window.openFramePicker) return;
        editingSlotIdx = idx;
        refreshStripHighlight();
        window.openFramePicker({
          onSelect: (frame) => {
            const b = books.find(b => b.id === viewingBookId);
            if (!b) return;
            const s = b.slots[idx];
            if (!s) return;
            s.frameId   = frame ? frame.id      : null;
            s.frameSVG  = frame ? frame.svgData : null;
            s.frameName = frame ? frame.name    : null;
            window._pendingFrameId   = s.frameId;
            window._pendingFrameSVG  = s.frameSVG;
            window._pendingFrameName = s.frameName;
            dbSet('books', b);
            renderStrip(b);
            if (editingSlotIdx === idx) {
              _updateFramePreview(frame);
            }
          }
        });
      });

      frameStrip.appendChild(fdiv);
    }"""

patch(LIB, OLD_FRAME_SLOT, NEW_FRAME_SLOT, 'library.js: frame slot — image+overlay+delete')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "fix: frame track slots match scene size, show image+frame overlay, add delete button"')
print('  git push --force origin main')
