#!/usr/bin/env python3
# SPIRALSIDE PATCH v4 — Frames->Library + Frame overlay in book editor
# Run: cd ~/spiralside && python patch_frames_library.py

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
        print(repr(src[max(0,idx-30):idx+len(old)+60] if idx>=0 else '[30-char prefix not found] ' + repr(old[:60])))
        sys.exit(1)
    if src.count(old) > 1:
        print(f'[DUPE] {label} count={src.count(old)}')
        sys.exit(1)
    write(path, src.replace(old, new))
    print(f'[OK] {label}')

FRAMES = 'js/frames/frames.js'
LIB    = 'js/app/library.js'
COMIC  = 'js/app/comic.js'

# ============================================================
# 1. FRAMES.JS
# The _framesSaveCurrent closure is INSIDE initFramesView.
# Anchor: the unique line "    await saveFrame(frame);\n    // \u2500\u2500 OPFS"
# But we need to see the actual dash character — from Vercel source
# it was the Unicode box-drawing char \u2500.
# From disk repr the save button uses literal char \u2736 and \u2713.
# Anchor on the saveFrame call + what follows it.
# ============================================================

frames_src = read(FRAMES)

# Find exact text between saveFrame and OPFS by searching for the OPFS comment
# Vercel source had: "    await saveFrame(frame);\n    // \u2500\u2500 OPFS auto-save"
# Let's find saveFrame(frame) and grab to end of function

save_idx = frames_src.find('    await saveFrame(frame);\n')
if save_idx < 0:
    print('[ERROR] frames.js: saveFrame call not found')
    print(repr(frames_src[frames_src.find('saveFrame'):frames_src.find('saveFrame')+100]))
    sys.exit(1)

# End of the function: find the '  };' that closes _framesSaveCurrent
# It comes after the btn.textContent line
btn_idx = frames_src.find("btn.textContent = '", save_idx)
if btn_idx < 0:
    print('[ERROR] frames.js: btn.textContent not found after saveFrame')
    sys.exit(1)
close_idx = frames_src.find('\n  };', btn_idx) + len('\n  };')

old_fn_body = frames_src[save_idx:close_idx]
print('=== Matched frames.js block ===')
print(repr(old_fn_body))
print()

new_fn_body = """    await saveFrame(frame);

    // \u2500\u2500 Rasterize SVG \u2192 PNG \u2192 save to Library gallery \u2500\u2500
    // Frame appears as a selectable image panel in the book editor gallery.
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 560;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f0f18';
      ctx.fillRect(0, 0, 400, 560);
      await new Promise(resolve => {
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url  = URL.createObjectURL(blob);
        const img  = new Image();
        img.onload  = () => { ctx.drawImage(img, 0, 0, 400, 560); URL.revokeObjectURL(url); resolve(); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        img.src = url;
      });
      if (window.saveImageToLibrary) {
        await window.saveImageToLibrary(canvas.toDataURL('image/png'), name + ' (frame)');
      }
    } catch(e) { console.warn('[frames] library panel save failed:', e); }
""" + old_fn_body[old_fn_body.find('    // '):] # keep the OPFS block + btn line + closing

write(FRAMES, frames_src[:save_idx] + new_fn_body + frames_src[close_idx:])
print('[OK] frames.js: save to library panel')

# ============================================================
# 2. LIBRARY.JS — fix [object Object] caption bug
# From diagnostic: "slot.caption?.speaker || slot.speaker || ''"
# ============================================================
patch(LIB,
    "document.getElementById('se-cap-speaker').value = slot.caption?.speaker || slot.speaker || '';\n  document.getElementById('se-cap-text').value    = slot.caption?.text    || slot.caption  || '';",
    """// caption can be string (legacy) OR {speaker,text} object \u2014 handle both
  const _capObj = (typeof slot.caption === 'object' && slot.caption !== null) ? slot.caption : {};
  const _capStr = typeof slot.caption === 'string' ? slot.caption : '';
  document.getElementById('se-cap-speaker').value = _capObj.speaker || slot.speaker || '';
  document.getElementById('se-cap-text').value    = _capObj.text    || _capStr     || '';""",
    'library.js: fix caption [object Object]')

# ============================================================
# 3. LIBRARY.JS — add frame overlay div to se-img-preview-wrap
# ============================================================
patch(LIB,
    '            <div class="se-preview-wrap" id="se-img-preview-wrap">\n              <img id="se-img-preview" src="" alt="" />\n            </div>',
    """            <div class="se-preview-wrap" id="se-img-preview-wrap" style="position:relative">
              <img id="se-img-preview" src="" alt="" />
              <div id="se-frame-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:2"></div>
            </div>""",
    'library.js: frame overlay div in preview wrap')

# ============================================================
# 4. LIBRARY.JS — add "frame overlay" controls after grit tag chip
# The grit chip is inside se-tag-chips inside se-image-edit-panel
# ============================================================
patch(LIB,
    '                <button class="se-chip" data-tag="grit" style="color:#FFD93D">grit</button>\n              </div>\n            </div>\n          </div>\n          <div class="se-label">caption</div>',
    """                <button class="se-chip" data-tag="grit" style="color:#FFD93D">grit</button>
              </div>
              <div class="se-label" style="margin-top:6px">frame overlay</div>
              <div style="display:flex;gap:6px;align-items:center">
                <button class="se-chip" id="se-frame-pick-btn" style="border-color:var(--teal);color:var(--teal)">&#9635; pick frame</button>
                <button class="se-chip" id="se-frame-clear-btn" style="display:none">&#10005; clear</button>
              </div>
              <div id="se-frame-name" style="font-size:0.58rem;color:var(--subtext);margin-top:3px"></div>
            </div>
          </div>
          <div class="se-label">caption</div>""",
    'library.js: frame overlay controls after grit chip')

# ============================================================
# 5. LIBRARY.JS — wire frame pick/clear buttons in wireTimeline
# ============================================================
patch(LIB,
    "  document.getElementById('se-img-save').addEventListener('click', saveImageSlot);\n  document.getElementById('se-img-del').addEventListener('click',  deleteCurrentSlot);",
    """  document.getElementById('se-img-save').addEventListener('click', saveImageSlot);
  document.getElementById('se-img-del').addEventListener('click',  deleteCurrentSlot);

  // \u2500\u2500 Frame overlay controls \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  document.getElementById('se-frame-pick-btn').addEventListener('click', () => {
    if (!window.openFramePicker) { alert('Frame module not loaded.'); return; }
    window.openFramePicker({
      onSelect: (frame) => {
        window._pendingFrameId   = frame ? frame.id      : null;
        window._pendingFrameSVG  = frame ? frame.svgData : null;
        window._pendingFrameName = frame ? frame.name    : null;
        _updateFramePreview(frame);
      }
    });
  });
  document.getElementById('se-frame-clear-btn').addEventListener('click', () => {
    window._pendingFrameId = window._pendingFrameSVG = window._pendingFrameName = null;
    _updateFramePreview(null);
  });""",
    'library.js: wire frame pick/clear')

# ============================================================
# 6. LIBRARY.JS — add _updateFramePreview helper before renderLibrary
# ============================================================
lib_src = read(LIB)
RENDER_FN = 'function renderLibrary() {'
if RENDER_FN not in lib_src:
    print('[MISS] library.js: renderLibrary function')
    sys.exit(1)
idx = lib_src.find(RENDER_FN)
# walk back to the start of the comment/blank line before renderLibrary
insert_at = lib_src.rfind('\n', 0, idx) + 1
helper = """// \u2500\u2500 FRAME PREVIEW HELPER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function _updateFramePreview(frame) {
  const overlay  = document.getElementById('se-frame-overlay');
  const nameEl   = document.getElementById('se-frame-name');
  const clearBtn = document.getElementById('se-frame-clear-btn');
  if (!overlay) return;
  if (frame && frame.svgData) {
    overlay.innerHTML = frame.svgData;
    const svg = overlay.querySelector('svg');
    if (svg) svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    if (nameEl)   nameEl.textContent = frame.name || 'frame';
    if (clearBtn) clearBtn.style.display = '';
  } else {
    overlay.innerHTML = '';
    if (nameEl)   nameEl.textContent = '';
    if (clearBtn) clearBtn.style.display = 'none';
  }
}

"""
write(LIB, lib_src[:insert_at] + helper + lib_src[insert_at:])
print('[OK] library.js: _updateFramePreview helper')

# ============================================================
# 7. LIBRARY.JS — showImageEditPanel: restore frame from slot
# From diagnostic: function ends with "}\n\nfunction renderPickerGrid"
# ============================================================
patch(LIB,
    "  document.getElementById('se-cap-speaker').value = _capObj.speaker || slot.speaker || '';\n  document.getElementById('se-cap-text').value    = _capObj.text    || _capStr     || '';\n}\n\nfunction renderPickerGrid",
    """  document.getElementById('se-cap-speaker').value = _capObj.speaker || slot.speaker || '';
  document.getElementById('se-cap-text').value    = _capObj.text    || _capStr     || '';

  // Restore frame overlay from slot
  window._pendingFrameId   = slot.frameId   || null;
  window._pendingFrameSVG  = slot.frameSVG  || null;
  window._pendingFrameName = slot.frameName || null;
  _updateFramePreview(slot.frameSVG ? { svgData: slot.frameSVG, name: slot.frameName || 'frame' } : null);
}

function renderPickerGrid""",
    'library.js: restore frame in showImageEditPanel')

# ============================================================
# 8. LIBRARY.JS — saveImageSlot: persist frame data
# ============================================================
patch(LIB,
    "  slot.caption = {\n    speaker: document.getElementById('se-cap-speaker').value.trim(),\n    text:    document.getElementById('se-cap-text').value.trim(),\n  };\n  dbSet('books', book);\n  renderStrip(book);\n  refreshStripHighlight();\n}\n\nfunction saveTextSlot",
    """  slot.caption = {
    speaker: document.getElementById('se-cap-speaker').value.trim(),
    text:    document.getElementById('se-cap-text').value.trim(),
  };
  // Persist frame overlay (null = cleared)
  slot.frameId   = window._pendingFrameId   || null;
  slot.frameSVG  = window._pendingFrameSVG  || null;
  slot.frameName = window._pendingFrameName || null;
  dbSet('books', book);
  renderStrip(book);
  refreshStripHighlight();
}

function saveTextSlot""",
    'library.js: persist frame in saveImageSlot')

# ============================================================
# 9. LIBRARY.JS — renderStrip: frame overlay on thumbnails
# ============================================================
patch(LIB,
    "          div.appendChild(dot);\n        }\n      } else if (slot.type === 'text') {",
    """          div.appendChild(dot);
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
      } else if (slot.type === 'text') {""",
    'library.js: frame overlay in filmstrip')

# ============================================================
# 10. LIBRARY.JS — playTimeline: pass frame_svg
# ============================================================
patch(LIB,
    "        filter_css: filterObj.css,\n        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],",
    "        filter_css: filterObj.css,\n        frame_svg:  slot.frameSVG || null,\n        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],",
    'library.js: pass frame_svg in playTimeline')

# ============================================================
# 11. COMIC.JS — frame_svg overlay in renderPanel
# ============================================================
if os.path.exists(COMIC):
    src = read(COMIC)
    CRACK = "classList.toggle('show', !!panel.crack);"
    if CRACK in src:
        idx = src.find(CRACK)
        eol = src.find('\n', idx)
        insert = """

  // \u2500\u2500 FRAME SVG OVERLAY \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  let _frmEl = document.getElementById('comic-frame-svg-overlay');
  if (panel.frame_svg) {
    if (!_frmEl) {
      _frmEl = document.createElement('div');
      _frmEl.id = 'comic-frame-svg-overlay';
      _frmEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;width:100%;height:100%';
      document.getElementById('comic-panel')?.appendChild(_frmEl);
    }
    _frmEl.innerHTML = panel.frame_svg;
    const _fsvg = _frmEl.querySelector('svg');
    if (_fsvg) _fsvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    _frmEl.style.display = '';
  } else if (_frmEl) {
    _frmEl.innerHTML = '';
    _frmEl.style.display = 'none';
  }"""
        write(COMIC, src[:eol] + insert + src[eol:])
        print('[OK] comic.js: frame_svg overlay')
    else:
        print('[INFO] comic.js: crack anchor not found \u2014 skipping')
else:
    print('[INFO] comic.js not found \u2014 skipping')

print()
print('=' * 54)
print('All patches applied.')
print()
print('Deploy:')
print('  git add js/frames/frames.js js/app/library.js js/app/comic.js')
print('  git commit -m "feat: frames->library; frame overlay in book editor; fix caption bug"')
print('  git push --force origin main')
print('=' * 54)
