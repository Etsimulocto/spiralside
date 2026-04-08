#!/usr/bin/env python3
# SPIRALSIDE patch_p6_two_track_filmstrip.py
# Converts single filmstrip into two rows: FRAME track (top) + SCENE track (bottom)
# Run: cd ~/spiralside && python patch_p6_two_track_filmstrip.py

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
# 1. CSS — replace single .tl-strip-wrap with two-track layout
# ============================================================
OLD_CSS = """    /* filmstrip */
    .tl-strip-wrap {
      flex-shrink:0; overflow-x:auto; overflow-y:hidden;
      padding:14px 16px 10px; display:flex; gap:10px;
      border-bottom:1px solid var(--border);
      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);
      -webkit-overflow-scrolling:touch;
    }
    .tl-slot {
      flex-shrink:0; width:72px; height:96px; border-radius:8px;
      border:2px solid var(--border); cursor:pointer;
      position:relative; overflow:hidden;
      transition:border-color 0.15s, transform 0.15s;
      background:var(--surface);
    }
    .tl-slot:hover { border-color:var(--pink); transform:scale(1.04); }
    .tl-slot.active { border-color:var(--teal); box-shadow:0 0 12px rgba(0,246,214,0.4); }
    .tl-slot.tl-add {
      border-style:dashed; border-color:var(--muted);
      display:flex; align-items:center; justify-content:center;
      font-size:1.4rem; color:var(--subtext); flex-shrink:0;
    }
    .tl-slot.tl-add:hover { border-color:var(--teal); color:var(--teal); }
    .tl-slot img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }
    .tl-slot-text {
      width:100%; height:100%; display:flex; align-items:center; justify-content:center;
      padding:6px; font-size:0.58rem; line-height:1.4; text-align:center;
      color:var(--text); word-break:break-word; overflow:hidden;
    }
    .tl-slot-num {
      position:absolute; top:3px; left:4px;
      font-size:0.5rem; color:rgba(255,255,255,0.4); letter-spacing:0.06em;
    }
    .tl-slot-tag {
      position:absolute; bottom:3px; right:3px;
      width:6px; height:6px; border-radius:50%;
    }
    /* drag */
    .tl-slot.dragging { opacity:0.4; transform:scale(0.95); }
    .tl-slot.drag-over { border-color:var(--teal); transform:scale(1.06); }"""

NEW_CSS = """    /* ── TWO-TRACK FILMSTRIP ── */
    .tl-tracks {
      flex-shrink:0; border-bottom:1px solid var(--border);
      display:flex; flex-direction:column;
    }
    .tl-track {
      display:flex; flex-direction:column; gap:0;
    }
    .tl-track-label {
      font-size:0.5rem; letter-spacing:0.14em; text-transform:uppercase;
      color:var(--subtext); padding:5px 16px 2px; flex-shrink:0;
    }
    /* FRAME track (top) — shorter slots */
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
    }
    /* SCENE track (bottom) — full height slots */
    .tl-track.track-scene .tl-strip-wrap {
      padding:4px 16px 10px;
    }
    /* shared strip row */
    .tl-strip-wrap {
      overflow-x:auto; overflow-y:hidden;
      display:flex; gap:10px;
      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);
      -webkit-overflow-scrolling:touch;
    }
    .tl-slot {
      flex-shrink:0; width:72px; height:96px; border-radius:8px;
      border:2px solid var(--border); cursor:pointer;
      position:relative; overflow:hidden;
      transition:border-color 0.15s, transform 0.15s;
      background:var(--surface);
    }
    .tl-slot:hover { border-color:var(--pink); transform:scale(1.04); }
    .tl-slot.active { border-color:var(--teal); box-shadow:0 0 12px rgba(0,246,214,0.4); }
    .tl-slot.tl-add {
      border-style:dashed; border-color:var(--muted);
      display:flex; align-items:center; justify-content:center;
      font-size:1.4rem; color:var(--subtext); flex-shrink:0;
    }
    .tl-slot.tl-add:hover { border-color:var(--teal); color:var(--teal); }
    .tl-slot img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }
    .tl-slot-text {
      width:100%; height:100%; display:flex; align-items:center; justify-content:center;
      padding:6px; font-size:0.58rem; line-height:1.4; text-align:center;
      color:var(--text); word-break:break-word; overflow:hidden;
    }
    .tl-slot-num {
      position:absolute; top:3px; left:4px;
      font-size:0.5rem; color:rgba(255,255,255,0.4); letter-spacing:0.06em;
    }
    .tl-slot-tag {
      position:absolute; bottom:3px; right:3px;
      width:6px; height:6px; border-radius:50%;
    }
    /* drag */
    .tl-slot.dragging { opacity:0.4; transform:scale(0.95); }
    .tl-slot.drag-over { border-color:var(--teal); transform:scale(1.06); }"""

patch(LIB, OLD_CSS, NEW_CSS, 'library.js: two-track CSS')

# ============================================================
# 2. HTML — replace single tl-strip-wrap div with two-track layout
# ============================================================
OLD_HTML = '      <div class="tl-strip-wrap" id="tl-strip"></div>'

NEW_HTML = """      <div class="tl-tracks" id="tl-tracks">
        <div class="tl-track track-frame">
          <div class="tl-track-label">frames</div>
          <div class="tl-strip-wrap" id="tl-frame-strip"></div>
        </div>
        <div class="tl-track track-scene">
          <div class="tl-track-label">scene</div>
          <div class="tl-strip-wrap" id="tl-strip"></div>
        </div>
      </div>"""

patch(LIB, OLD_HTML, NEW_HTML, 'library.js: two-track HTML')

# ============================================================
# 3. renderStrip — rebuild to also populate the frame track
# ============================================================
OLD_RENDER = """// ── FILMSTRIP RENDER ──────────────────────────────────────────
function renderStrip(book) {
  const strip = document.getElementById('tl-strip');
  if (!strip) return;
  strip.innerHTML = '';

  (book.slots || []).forEach((slot, idx) => {
    const div = document.createElement('div');
    div.className = 'tl-slot';
    div.dataset.idx = idx;

    // number
    div.innerHTML = `<span class="tl-slot-num">${idx + 1}</span>`;

    if (slot.type === 'image') {
      const p = panels.find(x => x.id === slot.panelId);
      if (p) {
        const fObj = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
        const img = document.createElement('img');
        img.src = p.dataURL;
        img.style.filter = fObj.css;
        div.appendChild(img);
        if (slot.tag && slot.tag !== 'none') {
          const dot = document.createElement('div');
          dot.className = 'tl-slot-tag';
          dot.style.background = CHAR_COLORS[slot.tag] || CHAR_COLORS.none;
          div.appendChild(dot);
        }
        // Frame overlay on filmstrip thumbnail
        if (slot.frameSVG) {
          const fov = document.createElement('div');
          fov.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5';
          fov.innerHTML = slot.frameSVG;
          const svg = fov.querySelector('svg');
          if (svg) svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
          div.appendChild(fov);
        }
      } else {
        div.innerHTML += `<div class="tl-slot-text" style="color:var(--subtext)">missing image</div>`;
      }
    } else if (slot.type === 'text') {
      const color = slot.color || '#F0F0FF';
      div.style.background = 'var(--surface2)';
      div.innerHTML += `<div class="tl-slot-text" style="color:${color}">${slot.speaker ? `<b>${slot.speaker}</b><br>` : ''}${slot.text || ''}</div>`;
    }

    // highlight active
    if (idx === editingSlotIdx) div.classList.add('active');

    // click → open slot editor
    div.addEventListener('click', () => openSlotEditor(idx, slot.type));

    // drag & drop reorder
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', () => { _dragIdx = idx; div.classList.add('dragging'); });
    div.addEventListener('dragend',   () => { _dragIdx = null; div.classList.remove('dragging'); });
    div.addEventListener('dragover',  e => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault(); div.classList.remove('drag-over');
      if (_dragIdx === null || _dragIdx === idx) return;
      const book = books.find(b => b.id === viewingBookId);
      if (!book) return;
      const moved = book.slots.splice(_dragIdx, 1)[0];
      const target = _dragIdx < idx ? idx : idx;
      book.slots.splice(target, 0, moved);
      if (editingSlotIdx === _dragIdx) editingSlotIdx = target;
      dbSet('books', book);
      renderStrip(book);
    });

    strip.appendChild(div);
  });

  // add slot button
  const addDiv = document.createElement('div');
  addDiv.className = 'tl-slot tl-add';
  addDiv.textContent = '+';
  addDiv.addEventListener('click', () => showSlotTypeChoice());
  strip.appendChild(addDiv);
}"""

NEW_RENDER = """// ── FILMSTRIP RENDER ──────────────────────────────────────────
function renderStrip(book) {
  const strip      = document.getElementById('tl-strip');
  const frameStrip = document.getElementById('tl-frame-strip');
  if (!strip) return;
  strip.innerHTML = '';
  if (frameStrip) frameStrip.innerHTML = '';

  (book.slots || []).forEach((slot, idx) => {
    // ── FRAME TRACK slot ──────────────────────────────────
    if (frameStrip) {
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
    }

    // ── SCENE TRACK slot ──────────────────────────────────
    const div = document.createElement('div');
    div.className = 'tl-slot';
    div.dataset.idx = idx;

    // number
    div.innerHTML = `<span class="tl-slot-num">${idx + 1}</span>`;

    if (slot.type === 'image') {
      const p = panels.find(x => x.id === slot.panelId);
      if (p) {
        const fObj = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
        const img = document.createElement('img');
        img.src = p.dataURL;
        img.style.filter = fObj.css;
        div.appendChild(img);
        if (slot.tag && slot.tag !== 'none') {
          const dot = document.createElement('div');
          dot.className = 'tl-slot-tag';
          dot.style.background = CHAR_COLORS[slot.tag] || CHAR_COLORS.none;
          div.appendChild(dot);
        }
      } else {
        div.innerHTML += `<div class="tl-slot-text" style="color:var(--subtext)">missing image</div>`;
      }
    } else if (slot.type === 'text') {
      const color = slot.color || '#F0F0FF';
      div.style.background = 'var(--surface2)';
      div.innerHTML += `<div class="tl-slot-text" style="color:${color}">${slot.speaker ? `<b>${slot.speaker}</b><br>` : ''}${slot.text || ''}</div>`;
    }

    // highlight active
    if (idx === editingSlotIdx) div.classList.add('active');

    // click → open slot editor
    div.addEventListener('click', () => openSlotEditor(idx, slot.type));

    // drag & drop reorder (scene track only — frames follow automatically)
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', () => { _dragIdx = idx; div.classList.add('dragging'); });
    div.addEventListener('dragend',   () => { _dragIdx = null; div.classList.remove('dragging'); });
    div.addEventListener('dragover',  e => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault(); div.classList.remove('drag-over');
      if (_dragIdx === null || _dragIdx === idx) return;
      const book = books.find(b => b.id === viewingBookId);
      if (!book) return;
      const moved = book.slots.splice(_dragIdx, 1)[0];
      const target = _dragIdx < idx ? idx : idx;
      book.slots.splice(target, 0, moved);
      if (editingSlotIdx === _dragIdx) editingSlotIdx = target;
      dbSet('books', book);
      renderStrip(book);
    });

    strip.appendChild(div);
  });

  // add slot button (scene track only)
  const addDiv = document.createElement('div');
  addDiv.className = 'tl-slot tl-add';
  addDiv.textContent = '+';
  addDiv.addEventListener('click', () => showSlotTypeChoice());
  strip.appendChild(addDiv);

  // Sync frame strip scroll to scene strip scroll
  const sceneWrap = strip.parentElement;
  const frameWrap = frameStrip?.parentElement;
  if (sceneWrap && frameWrap) {
    sceneWrap.onscroll = () => { frameWrap.scrollLeft = sceneWrap.scrollLeft; };
    frameWrap.onscroll = () => { sceneWrap.scrollLeft = frameWrap.scrollLeft; };
  }
}"""

patch(LIB, OLD_RENDER, NEW_RENDER, 'library.js: two-track renderStrip')

# ============================================================
# 4. refreshStripHighlight — also highlight frame track slot
# ============================================================
OLD_HIGHLIGHT = """function refreshStripHighlight() {
  document.querySelectorAll('.tl-slot').forEach((el, idx) => {
    el.classList.toggle('active', idx === editingSlotIdx);
  });
}"""

NEW_HIGHLIGHT = """function refreshStripHighlight() {
  // Scene track — highlight by dataset.idx
  document.querySelectorAll('#tl-strip .tl-slot').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.idx) === editingSlotIdx);
  });
  // Frame track — highlight matching idx
  document.querySelectorAll('#tl-frame-strip .tl-slot').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.idx) === editingSlotIdx);
  });
}"""

patch(LIB, OLD_HIGHLIGHT, NEW_HIGHLIGHT, 'library.js: refreshStripHighlight two-track')

print()
print('=' * 54)
print('patch_p6 done.')
print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "feat: two-track filmstrip — frame row on top, scene row below"')
print('  git push --force origin main')
print('=' * 54)
