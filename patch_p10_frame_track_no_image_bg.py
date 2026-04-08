#!/usr/bin/env python3
# SPIRALSIDE patch_p10_frame_track_no_image_bg.py
# Frame track slots: show frame SVG on dark bg only (no scene image behind it)
# The scene image behind the frame was confusing users into thinking
# the image was being duplicated/added to the frames row.
# Run: cd ~/spiralside && python patch_p10_frame_track_no_image_bg.py

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
# Remove the scene image bg from frame track slots.
# Frame slots show: dark bg + frame SVG only.
# The composite preview (image + frame) belongs in the slot editor,
# not the filmstrip frame track.
# ============================================================
OLD = """      if (slot.frameSVG) {
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
        fdiv.appendChild(lbl);"""

NEW = """      if (slot.frameSVG) {
        fdiv.classList.add('has-frame');

        // Frame SVG only on dark background — no scene image here
        // (composite preview is in the slot editor, not the filmstrip)
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
        fdiv.appendChild(lbl);"""

patch(LIB, OLD, NEW, 'library.js: frame track — SVG only, no scene image bg')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "fix: frame track shows frame SVG only, not scene image composite"')
print('  git push --force origin main')
