#!/usr/bin/env python3
# SPIRALSIDE patch_p13_text_boxes.py
# Replace single caption row with multi-text-box composer
# Each slot gets textBoxes:[] — each box has speaker, text, position, style
# Backward compat: old slot.caption migrates to textBoxes[0] on open
# Playback: text boxes render as sequenced typewriter lines
# Run: cd ~/spiralside && python patch_p13_text_boxes.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p,'r',encoding='utf-8') as f: return f.read().replace('\r\n','\n')
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)
def patch(path, old, new, label):
    src = read(path)
    old = old.replace('\r\n','\n'); new = new.replace('\r\n','\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx = src.find(old[:30])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:60])))
        sys.exit(1)
    if src.count(old)>1: print(f'[DUPE] {label}'); sys.exit(1)
    write(path, src.replace(old, new))
    print(f'[OK] {label}')

LIB = 'js/app/library.js'

# ============================================================
# 1. CSS — text box composer styles
# ============================================================
patch(LIB,
    "    .pe-save-btn:hover { opacity:0.88; }\n  `;\n  document.head.appendChild(s);\n}",
    """    .pe-save-btn:hover { opacity:0.88; }

    /* ── TEXT BOX COMPOSER ── */
    .tb-list { display:flex; flex-direction:column; gap:8px; margin-top:4px; }
    .tb-item {
      background:var(--surface2); border:1px solid var(--border);
      border-radius:10px; padding:10px 12px;
      display:flex; flex-direction:column; gap:8px;
      position:relative;
    }
    .tb-item.tb-active { border-color:var(--teal); }
    .tb-item-header {
      display:flex; align-items:center; gap:8px;
    }
    .tb-speaker-dot {
      width:10px; height:10px; border-radius:50%; flex-shrink:0;
      background:var(--subtext);
    }
    .tb-speaker-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid var(--border);
      color:var(--text); font-family:var(--font-ui); font-size:0.72rem;
      outline:none; padding:2px 0; min-width:0;
    }
    .tb-speaker-input:focus { border-bottom-color:var(--teal); }
    .tb-speaker-input::placeholder { color:var(--subtext); }
    .tb-del-btn {
      background:none; border:none; color:var(--subtext); cursor:pointer;
      font-size:0.75rem; padding:2px 4px; line-height:1;
      transition:color 0.15s; flex-shrink:0;
    }
    .tb-del-btn:hover { color:var(--pink); }
    .tb-text-input {
      width:100%; background:var(--bg); border:1px solid var(--border);
      border-radius:6px; padding:8px 10px; color:var(--text);
      font-family:var(--font-ui); font-size:0.78rem; resize:none;
      outline:none; line-height:1.5; min-height:52px;
    }
    .tb-text-input:focus { border-color:var(--teal); }
    .tb-text-input::placeholder { color:var(--subtext); }
    .tb-options { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .tb-pos-grid {
      display:grid; grid-template-columns:repeat(3,18px); gap:2px;
    }
    .tb-pos-cell {
      width:18px; height:14px; border-radius:2px;
      background:var(--border); cursor:pointer; border:none;
      transition:background 0.15s;
    }
    .tb-pos-cell.active { background:var(--teal); }
    .tb-pos-cell:hover { background:var(--subtext); }
    .tb-style-chip {
      padding:3px 8px; border-radius:20px; font-size:0.58rem;
      border:1px solid var(--border); background:var(--surface2);
      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);
      letter-spacing:0.04em; transition:all 0.15s;
    }
    .tb-style-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }
    .tb-add-btn {
      width:100%; padding:10px; background:transparent;
      border:1px dashed var(--border); border-radius:10px;
      color:var(--subtext); font-family:var(--font-ui); font-size:0.72rem;
      cursor:pointer; letter-spacing:0.06em; transition:all 0.2s;
      margin-top:4px;
    }
    .tb-add-btn:hover { border-color:var(--teal); color:var(--teal); }
    /* live text overlays on slot editor preview */
    .se-tb-overlay {
      position:absolute; inset:0; pointer-events:none; z-index:3;
      display:flex; flex-direction:column; justify-content:flex-end;
    }
    .se-tb-bubble {
      background:rgba(16,16,20,0.88); border:1.5px solid var(--teal);
      border-radius:3px 10px 10px 10px; padding:5px 7px; margin:2px 4px;
      font-size:0.52rem; line-height:1.4; color:#F0F0FF;
    }
    .se-tb-bubble .tb-sp { font-size:0.44rem; letter-spacing:0.1em;
      text-transform:uppercase; font-weight:700; margin-bottom:2px; display:block; }
  \`;
  document.head.appendChild(s);
}""",
    'library.js: text box CSS')

# ============================================================
# 2. Replace caption HTML in se-image-edit-panel with text box composer
# ============================================================
patch(LIB,
    """          <div class="se-label">caption</div>
          <input class="se-input" id="se-cap-speaker" placeholder="speaker (blank = narrator)" />
          <textarea class="se-input" id="se-cap-text" rows="2" placeholder="dialogue or caption..." style="margin-top:6px"></textarea>
          <!-- save panel / remove buttons removed — auto-saves on change, use header ↓ save to export -->
          <button class="se-del-btn" id="se-img-del" style="margin-top:4px;width:100%">remove slot</button>""",
    """          <div class="se-label">text boxes</div>
          <div class="tb-list" id="se-tb-list"></div>
          <button class="tb-add-btn" id="se-tb-add">+ add text box</button>
          <button class="se-del-btn" id="se-img-del" style="margin-top:8px;width:100%">remove slot</button>""",
    'library.js: text box composer HTML in slot editor')

# ============================================================
# 3. Remove old caption auto-save wiring (se-cap-speaker / se-cap-text)
#    and replace with text box wiring
# ============================================================
patch(LIB,
    """  // Auto-save image slot on any field change (no manual save button needed)
  ['se-cap-speaker','se-cap-text'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      if (editingSlotIdx !== null) saveImageSlot();
    });
  });
  document.getElementById('se-img-del').addEventListener('click', deleteCurrentSlot);""",
    """  // Text box: add button
  document.getElementById('se-tb-add').addEventListener('click', () => {
    addTextBox();
  });
  document.getElementById('se-img-del').addEventListener('click', deleteCurrentSlot);""",
    'library.js: wire text box add button')

# ============================================================
# 4. Replace showImageEditPanel caption restore with textBoxes restore
# ============================================================
patch(LIB,
    """  // caption can be string (legacy) OR {speaker,text} object — handle both
  const _capObj = (typeof slot.caption === 'object' && slot.caption !== null) ? slot.caption : {};
  const _capStr = typeof slot.caption === 'string' ? slot.caption : '';
  document.getElementById('se-cap-speaker').value = _capObj.speaker || slot.speaker || '';
  document.getElementById('se-cap-text').value    = _capObj.text    || _capStr     || '';

  // Restore frame overlay from slot
  window._pendingFrameId   = slot.frameId   || null;
  window._pendingFrameSVG  = slot.frameSVG  || null;
  window._pendingFrameName = slot.frameName || null;
  _updateFramePreview(slot.frameSVG ? { svgData: slot.frameSVG, name: slot.frameName || 'frame' } : null);
}""",
    """  // Migrate legacy caption to textBoxes
  if (!slot.textBoxes) {
    const _capObj = (typeof slot.caption === 'object' && slot.caption !== null) ? slot.caption : {};
    const _capStr = typeof slot.caption === 'string' ? slot.caption : '';
    const legacyText = _capObj.text || _capStr || '';
    slot.textBoxes = legacyText ? [{
      id: _tbid(), speaker: _capObj.speaker || slot.speaker || '',
      text: legacyText, pos: 'bottom-center', style: 'dialogue'
    }] : [];
  }

  // Restore frame overlay from slot
  window._pendingFrameId   = slot.frameId   || null;
  window._pendingFrameSVG  = slot.frameSVG  || null;
  window._pendingFrameName = slot.frameName || null;
  _updateFramePreview(slot.frameSVG ? { svgData: slot.frameSVG, name: slot.frameName || 'frame' } : null);

  // Render text box list
  renderTextBoxList(slot);
}""",
    'library.js: showImageEditPanel textBoxes restore')

# ============================================================
# 5. Update saveImageSlot to save textBoxes instead of caption
# ============================================================
patch(LIB,
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
}""",
    """  // textBoxes are updated live via renderTextBoxList — just persist current state
  // (slot.textBoxes is already mutated in place by the live editors)
  slot.frameId   = window._pendingFrameId   || null;
  slot.frameSVG  = window._pendingFrameSVG  || null;
  slot.frameName = window._pendingFrameName || null;
  dbSet('books', book);
  renderStrip(book);
  refreshStripHighlight();
}""",
    'library.js: saveImageSlot uses textBoxes')

# ============================================================
# 6. Add text box helpers before renderPickerGrid
# ============================================================
patch(LIB,
    "function renderPickerGrid() {",
    """// ── TEXT BOX HELPERS ─────────────────────────────────────────────
const SPEAKER_COLORS = {
  sky:'#00F6D6', monday:'#FF4BCB', cold:'#4DA3FF',
  grit:'#FFD93D', you:'#7B5FFF', narrator:'#F3F7FF',
};
const TB_POSITIONS = [
  'top-left','top-center','top-right',
  'mid-left','mid-center','mid-right',
  'bot-left','bot-center','bot-right',
];
const TB_STYLES = ['dialogue','caption','narration','shout'];

function _tbid() {
  return 'tb_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
}

function _speakerColor(speaker) {
  const key = (speaker||'').toLowerCase().trim();
  return SPEAKER_COLORS[key] || '#F3F7FF';
}

function addTextBox() {
  const book = books.find(b => b.id === viewingBookId);
  if (!book || editingSlotIdx === null) return;
  const slot = book.slots[editingSlotIdx];
  if (!slot) return;
  if (!slot.textBoxes) slot.textBoxes = [];
  slot.textBoxes.push({ id: _tbid(), speaker:'', text:'', pos:'bot-center', style:'dialogue' });
  dbSet('books', book);
  renderTextBoxList(slot);
  saveImageSlot();
}

function renderTextBoxList(slot) {
  const list = document.getElementById('se-tb-list');
  if (!list) return;
  list.innerHTML = '';
  (slot.textBoxes || []).forEach((tb, i) => {
    const item = document.createElement('div');
    item.className = 'tb-item';
    item.dataset.tbid = tb.id;

    // Color dot + speaker input + delete
    const hdr = document.createElement('div');
    hdr.className = 'tb-item-header';

    const dot = document.createElement('div');
    dot.className = 'tb-speaker-dot';
    dot.style.background = _speakerColor(tb.speaker);

    const spk = document.createElement('input');
    spk.className = 'tb-speaker-input';
    spk.placeholder = 'speaker (Sky / narrator / ...)';
    spk.value = tb.speaker || '';
    spk.addEventListener('input', () => {
      tb.speaker = spk.value.trim();
      dot.style.background = _speakerColor(tb.speaker);
      _autoSaveTB();
    });

    const del = document.createElement('button');
    del.className = 'tb-del-btn';
    del.textContent = '✕';
    del.addEventListener('click', () => {
      const book = books.find(b => b.id === viewingBookId);
      if (!book || editingSlotIdx === null) return;
      const sl = book.slots[editingSlotIdx];
      if (!sl) return;
      sl.textBoxes = (sl.textBoxes || []).filter(t => t.id !== tb.id);
      dbSet('books', book);
      renderTextBoxList(sl);
    });

    hdr.appendChild(dot); hdr.appendChild(spk); hdr.appendChild(del);

    // Text textarea
    const txt = document.createElement('textarea');
    txt.className = 'tb-text-input';
    txt.rows = 2;
    txt.placeholder = 'dialogue, caption, narration...';
    txt.value = tb.text || '';
    txt.addEventListener('input', () => { tb.text = txt.value; _autoSaveTB(); });

    // Position grid + style chips
    const opts = document.createElement('div');
    opts.className = 'tb-options';

    // 3x3 position grid
    const grid = document.createElement('div');
    grid.className = 'tb-pos-grid';
    TB_POSITIONS.forEach(pos => {
      const cell = document.createElement('button');
      cell.className = 'tb-pos-cell' + (tb.pos === pos ? ' active' : '');
      cell.title = pos;
      cell.addEventListener('click', () => {
        tb.pos = pos;
        grid.querySelectorAll('.tb-pos-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        _autoSaveTB();
      });
      grid.appendChild(cell);
    });
    opts.appendChild(grid);

    // Style chips
    TB_STYLES.forEach(st => {
      const chip = document.createElement('button');
      chip.className = 'tb-style-chip' + (tb.style === st ? ' active' : '');
      chip.textContent = st;
      chip.addEventListener('click', () => {
        tb.style = st;
        opts.querySelectorAll('.tb-style-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        _autoSaveTB();
      });
      opts.appendChild(chip);
    });

    item.appendChild(hdr);
    item.appendChild(txt);
    item.appendChild(opts);
    list.appendChild(item);
  });
}

function _autoSaveTB() {
  if (editingSlotIdx === null) return;
  const book = books.find(b => b.id === viewingBookId);
  if (!book) return;
  dbSet('books', book);
}

function renderPickerGrid() {""",
    'library.js: text box helpers')

# ============================================================
# 7. Update playTimeline to build dialogue from textBoxes
# ============================================================
patch(LIB,
    """      const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
      const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
      const filterObj  = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
      return {
        image:      p?.dataURL || '',
        filter_css: filterObj.css,
        frame_svg:  slot.frameSVG || null,
        dialogue:   capText ? [{ speaker: capSpeaker, text: capText }] : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };""",
    """      const filterObj = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
      // Build dialogue from textBoxes (new) or fall back to legacy caption
      let dialogue = [];
      if (slot.textBoxes && slot.textBoxes.length) {
        dialogue = slot.textBoxes
          .filter(tb => tb.text?.trim())
          .map(tb => ({ speaker: tb.speaker || 'narrator', text: tb.text.trim(), style: tb.style, pos: tb.pos }));
      } else {
        const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
        const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
        if (capText) dialogue = [{ speaker: capSpeaker, text: capText }];
      }
      return {
        image:      p?.dataURL || '',
        filter_css: filterObj.css,
        frame_svg:  slot.frameSVG || null,
        dialogue,
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };""",
    'library.js: playTimeline uses textBoxes for dialogue')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "feat: multi text box composer in slot editor; replaces single caption row"')
print('  git push --force origin main')
