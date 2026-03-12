#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — patch_library.py
# Wires up the new Library (image gallery + panel editor + book builder)
# Replaces old vault with split: vault=docs, library=images
# Run from ~/spiralside: py patch_library.py
# ============================================================

import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

def read(p):
    return open(os.path.join(BASE, p), 'r', encoding='utf-8').read()

def write(p, c):
    open(os.path.join(BASE, p), 'w', encoding='utf-8').write(c)
    print(f'  wrote: {p}')

def patch(p, old, new, label=''):
    c = read(p)
    if old not in c:
        print(f'  SKIP (not found): [{label}]')
        return False
    write(p, c.replace(old, new, 1))
    print(f'  patched: [{label}]')
    return True

print('📚 Patching library into Spiralside...\n')

# ════════════════════════════════════════════════════════════
# 1. main.js — add library import + init + window globals
# ════════════════════════════════════════════════════════════
patch('js/app/main.js',
    "import { initBuild, loadBotIntoForm }              from './build.js';",
    "import { initBuild, loadBotIntoForm }              from './build.js';\n"
    "import { initLibrary, openPanelEditor, deletePanel,\n"
    "         openBookBuilder, addPanelToBook,\n"
    "         removePanelFromBook, movePanelInBook,\n"
    "         deleteBook }                              from './library.js';",
    'main.js: add library import')

patch('js/app/main.js',
    "import { initMusicView, destroyMusicView }         from './musicview.js';",
    "import { initMusicView, destroyMusicView }         from './musicview.js';\n",
    'main.js: musicview already imported?')  # may skip — that's fine

# Add musicview import if not present at all
c = read('js/app/main.js')
if 'musicview' not in c:
    patch('js/app/main.js',
        "import { initBuild, loadBotIntoForm }              from './build.js';",
        "import { initBuild, loadBotIntoForm }              from './build.js';\n"
        "import { initMusicView, destroyMusicView }         from './musicview.js';",
        'main.js: add musicview import')

# Expose library globals
patch('js/app/main.js',
    "window.removeFile        = removeFile;",
    "window.removeFile        = removeFile;\n"
    "window.openPanelEditor   = openPanelEditor;\n"
    "window.deletePanel       = deletePanel;\n"
    "window.openBookBuilder   = openBookBuilder;\n"
    "window.addPanelToBook    = addPanelToBook;\n"
    "window.removePanelFromBook = removePanelFromBook;\n"
    "window.movePanelInBook   = movePanelInBook;\n"
    "window.deleteBook        = deleteBook;",
    'main.js: expose library globals')

# Expose music view globals
c = read('js/app/main.js')
if 'initMusicView' in c and 'window.initMusicView' not in c:
    patch('js/app/main.js',
        "window.deleteBook        = deleteBook;",
        "window.deleteBook        = deleteBook;\n"
        "window.initMusicView     = initMusicView;\n"
        "window.destroyMusicView  = destroyMusicView;",
        'main.js: expose music view globals')

# Add initLibrary() call in onAppReady
patch('js/app/main.js',
    "  initChat();\n  initVault();\n  initBuild();",
    "  initChat();\n  initVault();\n  initBuild();\n  initLibrary();",
    'main.js: call initLibrary in onAppReady')

# ════════════════════════════════════════════════════════════
# 2. state.js — add library FAB tab
# ════════════════════════════════════════════════════════════
patch('js/app/state.js',
    "  { id: 'music', label: 'music', icon: '♪',  color: '#00F6D6',",
    "  { id: 'library', label: 'library', icon: '🖼',  color: '#FF4BCB',\n"
    "    onOpen: () => {} },\n"
    "  { id: 'music', label: 'music', icon: '♪',  color: '#00F6D6',",
    'state.js: add library FAB tab')

# ════════════════════════════════════════════════════════════
# 3. ui.js — add library glow color
# ════════════════════════════════════════════════════════════
patch('js/app/ui.js',
    "{ chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D', music: '#00F6D6' }",
    "{ chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D', music: '#00F6D6', library: '#FF4BCB' }",
    'ui.js: add library glow color')

# ════════════════════════════════════════════════════════════
# 4. index.html — inject library CSS + HTML view + overlays
# ════════════════════════════════════════════════════════════

LIBRARY_CSS = '''
    /* ── LIBRARY VIEW ───────────────────────────────────────── */
    #lib-inner { display: flex; flex-direction: column; height: 100%; }
    .lib-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .lib-tab {
      flex: 1; padding: 12px 8px; background: none; border: none;
      border-bottom: 2px solid transparent; color: var(--subtext);
      font-size: 0.72rem; letter-spacing: 0.08em; cursor: pointer;
      transition: all 0.2s; margin-bottom: -1px;
    }
    .lib-tab.active { color: var(--pink); border-bottom-color: var(--pink); }
    .lib-toolbar { display: flex; gap: 8px; padding: 12px 16px; flex-shrink: 0; }
    .lib-tool-btn {
      flex: 1; padding: 10px 8px; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 10px; color: var(--subtext);
      font-size: 0.72rem; display: flex; align-items: center; justify-content: center;
      gap: 6px; transition: all 0.2s; letter-spacing: 0.04em; cursor: pointer;
    }
    .lib-tool-btn:hover { border-color: var(--pink); color: var(--pink); }
    .lib-gallery-scroll { flex: 1; overflow-y: auto; padding: 0 16px 80px; }
    #lib-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 4px;
    }
    .lib-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; overflow: hidden; cursor: pointer;
      transition: border-color 0.2s, transform 0.15s;
    }
    .lib-card:hover { border-color: var(--pink); transform: translateY(-2px); }
    .lib-card-img-wrap { position: relative; aspect-ratio: 3/4; overflow: hidden; background: var(--muted); }
    .lib-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lib-card-caption-dot {
      position: absolute; bottom: 6px; right: 6px;
      width: 8px; height: 8px; border-radius: 50%;
    }
    .lib-card-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 8px;
    }
    .lib-card-tag { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; }
    .lib-card-actions { display: flex; gap: 4px; }
    .lib-card-actions button {
      background: none; border: none; color: var(--subtext);
      cursor: pointer; font-size: 0.8rem; padding: 2px 5px;
      border-radius: 4px; transition: color 0.2s;
    }
    .lib-card-actions button:hover { color: var(--pink); }
    .lib-empty { text-align: center; padding: 48px 20px; color: var(--subtext); font-size: 0.78rem; line-height: 1.8; }

    /* books */
    #lib-books-view { flex: 1; overflow-y: auto; padding: 12px 16px 80px; display: none; }
    .book-new-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .book-title-input {
      flex: 1; background: var(--surface2); border: 1px solid var(--border);
      border-radius: 10px; padding: 10px 12px; color: var(--text);
      font-size: 0.78rem; outline: none;
    }
    .book-title-input:focus { border-color: var(--pink); }
    .book-create-btn {
      padding: 10px 16px; background: var(--pink); border: none; border-radius: 10px;
      color: #fff; font-size: 0.78rem; cursor: pointer; white-space: nowrap;
      transition: opacity 0.2s;
    }
    .book-create-btn:hover { opacity: 0.85; }
    .book-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
      cursor: pointer; transition: border-color 0.2s; position: relative; overflow: hidden;
    }
    .book-card:hover { border-color: var(--pink); }
    .book-card-spine { width: 3px; height: 36px; border-radius: 2px; flex-shrink: 0; }
    .book-card-info { flex: 1; min-width: 0; }
    .book-card-title { font-size: 0.82rem; font-weight: 600; }
    .book-card-meta { font-size: 0.62rem; color: var(--subtext); margin-top: 2px; }
    .book-del-btn { background: none; border: none; color: var(--subtext); cursor: pointer; font-size: 0.85rem; padding: 4px; }
    .book-del-btn:hover { color: var(--pink); }

    /* ── PANEL EDITOR OVERLAY ────────────────────────────────── */
    #panel-editor-overlay {
      position: fixed; inset: 0; z-index: 300;
      background: var(--bg); display: flex; flex-direction: column;
      transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.32,0.72,0,1);
    }
    #panel-editor-overlay.open { transform: translateY(0); }
    .pe-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .pe-header-title { font-size: 0.72rem; letter-spacing: 0.12em; color: var(--subtext); text-transform: uppercase; }
    .pe-close-btn { background: none; border: none; color: var(--subtext); font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .pe-close-btn:hover { color: var(--text); }
    .pe-body { flex: 1; overflow-y: auto; padding: 16px 20px 80px; }
    #panel-editor-img-wrap { position: relative; margin-bottom: 20px; text-align: center; }
    #panel-editor-img { max-height: 40vh; max-width: 100%; border-radius: 8px; display: block; margin: 0 auto; transition: filter 0.3s; }
    .pe-section-label { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }
    .pe-filter-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 20px; }
    .filter-chip {
      flex-shrink: 0; padding: 6px 12px; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 20px;
      font-size: 0.68rem; cursor: pointer; transition: all 0.15s; color: var(--subtext);
    }
    .filter-chip.active { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.08); }
    .pe-tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
    .tag-chip {
      padding: 6px 12px; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 20px;
      font-size: 0.68rem; cursor: pointer; transition: all 0.15s; color: var(--subtext);
    }
    .tag-chip.active { border-color: var(--pink); color: var(--pink); background: rgba(255,75,203,0.08); }
    .pe-caption-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .pe-caption-speaker {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px; color: var(--text);
      font-size: 0.78rem; outline: none;
    }
    .pe-caption-speaker:focus { border-color: var(--teal); }
    .pe-caption-text {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px; color: var(--text);
      font-size: 0.78rem; outline: none; resize: none; min-height: 72px;
    }
    .pe-caption-text:focus { border-color: var(--teal); }
    .pe-save-btn {
      width: 100%; padding: 13px; background: linear-gradient(135deg, var(--teal), var(--purple));
      border: none; border-radius: 12px; color: #0a0a0f;
      font-family: var(--font-display); font-weight: 700; font-size: 0.88rem;
      cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s;
    }
    .pe-save-btn:hover { opacity: 0.88; }

    /* ── BOOK BUILDER OVERLAY ────────────────────────────────── */
    #book-builder-overlay {
      position: fixed; inset: 0; z-index: 300;
      background: var(--bg); display: flex; flex-direction: column;
      transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.32,0.72,0,1);
    }
    #book-builder-overlay.open { transform: translateY(0); }
    .bb-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
      gap: 10px;
    }
    .bb-title { font-size: 0.88rem; font-weight: 700; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bb-play-btn {
      padding: 8px 14px; background: var(--teal); border: none; border-radius: 20px;
      color: #0a0a0f; font-size: 0.7rem; font-weight: 700; cursor: pointer;
      letter-spacing: 0.06em; white-space: nowrap; transition: opacity 0.2s;
    }
    .bb-play-btn:hover { opacity: 0.85; }
    .bb-close-btn { background: none; border: none; color: var(--subtext); font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .bb-close-btn:hover { color: var(--text); }
    #book-panel-queue { flex: 1; overflow-y: auto; padding: 12px 20px 80px; }
    .book-queue-item {
      display: flex; align-items: center; gap: 10px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 10px; margin-bottom: 8px;
    }
    .book-queue-thumb { width: 44px; height: 56px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
    .book-queue-info { flex: 1; min-width: 0; }
    .book-queue-name { font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .book-queue-caption { font-size: 0.65rem; color: var(--subtext); margin-top: 3px; line-height: 1.4; }
    .book-queue-btns { display: flex; flex-direction: column; gap: 2px; }
    .book-queue-btns button {
      background: none; border: 1px solid var(--border); border-radius: 4px;
      color: var(--subtext); cursor: pointer; font-size: 0.7rem; padding: 3px 6px;
      transition: color 0.2s;
    }
    .book-queue-btns button:hover { color: var(--pink); border-color: var(--pink); }

    /* ── MUSIC VIEW (inline) ─────────────────────────────────── */
    #view-music { background: var(--bg); }
    #mv-inner {
      display: flex; flex-direction: column; align-items: center;
      height: 100%; overflow-y: auto; padding: 16px 20px 80px;
    }
    #mv-now-label {
      font-size: 0.6rem; letter-spacing: 0.18em; color: var(--subtext);
      text-transform: uppercase; align-self: flex-start; margin-bottom: 8px;
    }
    #mv-canvas-wrap {
      position: relative; width: 220px; height: 220px; flex-shrink: 0; margin-bottom: 16px;
    }
    #mv-canvas { width: 100%; height: 100%; display: block; }
    #mv-note {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      font-size: 1.6rem; color: var(--teal); opacity: 0.7;
    }
    #mv-title {
      font-family: var(--font-display); font-size: 1.1rem; font-weight: 800;
      letter-spacing: 0.04em; text-align: center; margin-bottom: 4px;
    }
    #mv-album { font-size: 0.62rem; color: var(--subtext); letter-spacing: 0.12em; margin-bottom: 16px; }
    #mv-progress-wrap { width: 100%; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    #mv-progress-bg {
      flex: 1; height: 4px; background: var(--muted); border-radius: 2px;
      position: relative; cursor: pointer;
    }
    #mv-progress-fill {
      height: 100%; border-radius: 2px;
      background: linear-gradient(90deg, var(--teal), var(--purple));
      pointer-events: none; transition: width 0.1s linear;
    }
    #mv-seek {
      position: absolute; inset: -8px 0; width: 100%; opacity: 0; cursor: pointer; height: 20px;
    }
    #mv-progress-wrap span { font-size: 0.62rem; color: var(--subtext); width: 32px; flex-shrink: 0; }
    #mv-controls { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
    .mv-btn {
      background: none; border: none; color: var(--subtext);
      font-size: 1rem; cursor: pointer; padding: 8px; transition: color 0.2s;
    }
    .mv-btn:hover { color: var(--text); }
    .mv-btn-main {
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--teal); color: #0a0a0f; font-size: 1.1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .mv-btn-main:hover { opacity: 0.85; color: #0a0a0f; }
    #mv-vol-row { width: 100%; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .mv-vol-icon { font-size: 0.7rem; color: var(--subtext); flex-shrink: 0; }
    #mv-vol { flex: 1; accent-color: var(--teal); height: 4px; }
    #mv-queue-label { font-size: 0.6rem; letter-spacing: 0.14em; color: var(--subtext); text-transform: uppercase; align-self: flex-start; margin-bottom: 10px; }
    #mv-queue { width: 100%; }
    .mv-queue-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px; cursor: pointer;
      transition: background 0.15s; border: 1px solid transparent;
    }
    .mv-queue-item:hover { background: var(--surface); }
    .mv-queue-item.mv-queue-active { background: var(--surface2); border-color: var(--teal); }
    .mv-queue-num { font-size: 0.65rem; color: var(--subtext); width: 16px; flex-shrink: 0; }
    .mv-queue-name { flex: 1; font-size: 0.78rem; }
    .mv-queue-playing { font-size: 0.6rem; color: var(--teal); flex-shrink: 0; }
'''

LIBRARY_HTML = '''
  <!-- LIBRARY VIEW -->
  <div class="view" id="view-library">
    <div id="lib-inner">
      <div class="lib-tabs">
        <button class="lib-tab active" data-tab="gallery">gallery</button>
        <button class="lib-tab" data-tab="books">books</button>
      </div>
      <!-- GALLERY -->
      <div id="lib-gallery-view" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
        <div class="lib-toolbar">
          <button class="lib-tool-btn" id="lib-add-btn">🖼 add image</button>
        </div>
        <div class="lib-gallery-scroll">
          <div id="lib-grid">
            <div class="lib-empty">
              <div style="font-size:2.4rem;margin-bottom:12px">🖼</div>
              <div>no images yet</div>
              <div style="font-size:0.7rem;margin-top:6px;opacity:0.6">tap + to add your first panel</div>
            </div>
          </div>
        </div>
      </div>
      <!-- BOOKS -->
      <div id="lib-books-view" style="display:none;flex-direction:column;flex:1;overflow:hidden">
        <div class="lib-toolbar" style="padding-bottom:0">
          <input class="book-title-input" id="book-title-input" placeholder="new book title..." />
          <button class="book-create-btn" id="book-new-btn">＋ create</button>
        </div>
        <div id="lib-books-scroll" style="flex:1;overflow-y:auto;padding:12px 16px 80px">
          <div id="lib-books-list">
            <div class="lib-empty">
              <div style="font-size:2rem;margin-bottom:10px">📖</div>
              <div>no books yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <input type="file" id="lib-file-input" style="display:none" accept="image/*" multiple />
  </div>

  <!-- MUSIC VIEW -->
  <div class="view" id="view-music"></div>

  <!-- PANEL EDITOR OVERLAY -->
  <div id="panel-editor-overlay">
    <div class="pe-header">
      <span class="pe-header-title">edit panel</span>
      <button class="pe-close-btn" id="panel-editor-close">✕</button>
    </div>
    <div class="pe-body">
      <div id="panel-editor-img-wrap">
        <img id="panel-editor-img" src="" alt="panel" />
      </div>

      <div class="pe-section-label">filter</div>
      <div class="pe-filter-row">
        <button class="filter-chip active" data-filter="none">none</button>
        <button class="filter-chip" data-filter="teal">teal</button>
        <button class="filter-chip" data-filter="pink">pink</button>
        <button class="filter-chip" data-filter="noir">noir</button>
        <button class="filter-chip" data-filter="glitch">glitch</button>
        <button class="filter-chip" data-filter="vignette">vignette</button>
      </div>

      <div class="pe-section-label">tag character</div>
      <div class="pe-tag-row">
        <button class="tag-chip active" data-tag="none">none</button>
        <button class="tag-chip" data-tag="sky" style="color:#00F6D6">sky</button>
        <button class="tag-chip" data-tag="monday" style="color:#FF4BCB">monday</button>
        <button class="tag-chip" data-tag="cold" style="color:#4DA3FF">cold</button>
        <button class="tag-chip" data-tag="grit" style="color:#FFD93D">grit</button>
        <button class="tag-chip" data-tag="you" style="color:#7B5FFF">you</button>
      </div>

      <div class="pe-section-label">caption</div>
      <div class="pe-caption-row">
        <input class="pe-caption-speaker" id="panel-caption-speaker" placeholder="speaker name (or leave blank for narrator)" />
        <textarea class="pe-caption-text" id="panel-caption-text" placeholder="dialogue or caption text..."></textarea>
      </div>

      <button class="pe-save-btn" id="panel-editor-save">save panel</button>
    </div>
  </div>

  <!-- BOOK BUILDER OVERLAY -->
  <div id="book-builder-overlay">
    <div class="bb-header">
      <span class="bb-title" id="book-builder-title">book</span>
      <button class="bb-play-btn" id="book-play-btn">▶ play as comic</button>
      <button class="bb-close-btn" id="book-builder-close">✕</button>
    </div>
    <div id="book-panel-queue">
      <div class="lib-empty">add panels from the gallery</div>
    </div>
  </div>
'''

# ── Inject CSS before closing </style> ────────────────────────
patch('index.html',
    '  </style>\n</head>',
    LIBRARY_CSS + '\n  </style>\n</head>',
    'index.html: inject library CSS')

# ── Inject HTML before <!-- FAB --> ───────────────────────────
patch('index.html',
    '  <!-- FAB -->',
    LIBRARY_HTML + '\n  <!-- FAB -->',
    'index.html: inject library HTML')

# ════════════════════════════════════════════════════════════
# 5. db.js — ensure 'panels' and 'books' object stores exist
# ════════════════════════════════════════════════════════════
db = read('js/app/db.js')
if "'panels'" not in db and '"panels"' not in db:
    patch('js/app/db.js',
        "db.createObjectStore('vault',   { keyPath: 'name' });",
        "db.createObjectStore('vault',   { keyPath: 'name' });\n"
        "        db.createObjectStore('panels',  { keyPath: 'id' });\n"
        "        db.createObjectStore('books',   { keyPath: 'id' });",
        'db.js: add panels + books stores')
else:
    print('  SKIP: panels/books stores already in db.js')

# ════════════════════════════════════════════════════════════
# VERIFY
# ════════════════════════════════════════════════════════════
print()
print('Verification:')
main  = read('js/app/main.js')
state = read('js/app/state.js')
ui    = read('js/app/ui.js')
idx   = read('index.html')
db_c  = read('js/app/db.js')

print(f"  library import in main.js:    {'✓' if 'initLibrary' in main else '✗'}")
print(f"  window globals in main.js:    {'✓' if 'openPanelEditor' in main else '✗'}")
print(f"  musicview import in main.js:  {'✓' if 'musicview' in main else '✗'}")
print(f"  library tab in state.js:      {'✓' if 'id: .library.' in state else '✗'}")
print(f"  library glow in ui.js:        {'✓' if 'library' in ui else '✗'}")
print(f"  library CSS in index.html:    {'✓' if 'lib-grid' in idx else '✗'}")
print(f"  library HTML in index.html:   {'✓' if 'view-library' in idx else '✗'}")
print(f"  panel editor in index.html:   {'✓' if 'panel-editor-overlay' in idx else '✗'}")
print(f"  book builder in index.html:   {'✓' if 'book-builder-overlay' in idx else '✗'}")
print(f"  music view div in index.html: {'✓' if 'view-music' in idx else '✗'}")
print(f"  panels store in db.js:        {'✓' if 'panels' in db_c else '✗'}")
print()
print('Run:')
print('  git add .')
print('  git commit -m "feat: library — image gallery, panel editor, book builder"')
print('  git push')
