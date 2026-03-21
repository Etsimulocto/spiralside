#!/usr/bin/env python3
# _patch1_library_modular.py
# Rewrites js/app/library.js to inject its own HTML + styles.
# Leaves view-library as an empty div in index.html.
# Also exposes window.saveImageToLibrary for Imagine tab wiring.

import os, sys

LIBRARY_PATH = os.path.expanduser('~/spiralside/js/app/library.js')

NEW_CONTENT = r'''// ============================================================
// SPIRALSIDE — LIBRARY v2.0
// Image gallery, panel editor, book builder
// Self-contained: stamps own HTML + styles, overlays managed here
// Nimbis anchor: js/app/library.js
// ============================================================

import { state }                        from './state.js';
import { dbSet, dbDelete, dbGetAll }    from './db.js';

// ── CONSTANTS ─────────────────────────────────────────────────
const CHAR_COLORS = {
  sky:      '#00F6D6',
  monday:   '#FF4BCB',
  cold:     '#4DA3FF',
  grit:     '#FFD93D',
  you:      '#7B5FFF',
  none:     '#404060',
};

const FILTERS = [
  { id: 'none',     label: 'none',     css: 'none' },
  { id: 'teal',     label: 'teal',     css: 'sepia(1) saturate(3) hue-rotate(130deg) brightness(0.85)' },
  { id: 'pink',     label: 'pink',     css: 'sepia(1) saturate(3) hue-rotate(280deg) brightness(0.85)' },
  { id: 'noir',     label: 'noir',     css: 'grayscale(1) contrast(1.2) brightness(0.8)' },
  { id: 'glitch',   label: 'glitch',   css: 'hue-rotate(90deg) saturate(2) contrast(1.3)' },
  { id: 'vignette', label: 'vignette', css: 'brightness(0.7) contrast(1.1)' },
];

// ── STATE ─────────────────────────────────────────────────────
let panels      = [];  // { id, name, dataURL, tag, filter, caption, createdAt }
let books       = [];  // { id, title, panelIds[], color, createdAt }
let editingId   = null;
let viewingBook = null;

// ── INJECT STYLES ─────────────────────────────────────────────
function injectLibraryStyles() {
  if (document.getElementById('library-styles')) return;
  const s = document.createElement('style');
  s.id = 'library-styles';
  s.textContent = `
    /* ── LIBRARY VIEW ─────────────────────────────────────── */
    #view-library { overflow: hidden; }
    #lib-inner { display: flex; flex-direction: column; height: 100%; }

    /* tabs */
    .lib-tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .lib-tab {
      flex: 1; padding: 12px 8px; background: none; border: none;
      border-bottom: 2px solid transparent; color: var(--subtext);
      font-size: 0.72rem; letter-spacing: 0.08em; cursor: pointer;
      transition: all 0.2s; margin-bottom: -1px; font-family: var(--font-ui);
    }
    .lib-tab.active { color: var(--pink); border-bottom-color: var(--pink); }

    /* toolbar */
    .lib-toolbar { display: flex; gap: 8px; padding: 12px 16px; flex-shrink: 0; }
    .lib-tool-btn {
      flex: 1; padding: 10px 8px; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 10px; color: var(--subtext);
      font-size: 0.72rem; display: flex; align-items: center; justify-content: center;
      gap: 6px; transition: all 0.2s; letter-spacing: 0.04em; cursor: pointer;
      font-family: var(--font-ui);
    }
    .lib-tool-btn:hover { border-color: var(--pink); color: var(--pink); }

    /* gallery scroll */
    .lib-gallery-scroll { flex: 1; overflow-y: auto; padding: 0 16px 80px; }
    #lib-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 4px; }

    /* card */
    .lib-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; overflow: hidden; cursor: pointer;
      transition: border-color 0.2s, transform 0.15s;
    }
    .lib-card:hover { border-color: var(--pink); transform: translateY(-2px); }
    .lib-card-img-wrap { position: relative; aspect-ratio: 3/4; overflow: hidden; background: var(--muted); }
    .lib-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lib-card-caption-dot { position: absolute; bottom: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; }
    .lib-card-bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; }
    .lib-card-tag { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; }
    .lib-card-actions { display: flex; gap: 4px; }
    .lib-card-actions button {
      background: none; border: none; color: var(--subtext);
      cursor: pointer; font-size: 0.8rem; padding: 2px 5px;
      border-radius: 4px; transition: color 0.2s;
    }
    .lib-card-actions button:hover { color: var(--pink); }
    .lib-empty { text-align: center; padding: 48px 20px; color: var(--subtext); font-size: 0.78rem; line-height: 1.8; }

    /* books tab */
    #lib-books-view { flex: 1; overflow-y: auto; padding: 12px 16px 80px; display: none; flex-direction: column; }
    .book-new-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .book-title-input {
      flex: 1; background: var(--surface2); border: 1px solid var(--border);
      border-radius: 10px; padding: 10px 12px; color: var(--text);
      font-size: 0.78rem; outline: none; font-family: var(--font-ui);
    }
    .book-title-input:focus { border-color: var(--pink); }
    .book-create-btn {
      padding: 10px 16px; background: var(--pink); border: none; border-radius: 10px;
      color: #fff; font-size: 0.78rem; cursor: pointer; white-space: nowrap;
      transition: opacity 0.2s; font-family: var(--font-ui);
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

    /* panel editor overlay */
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
      font-family: var(--font-ui);
    }
    .filter-chip.active { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.08); }
    .pe-tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
    .tag-chip {
      padding: 6px 12px; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 20px;
      font-size: 0.68rem; cursor: pointer; transition: all 0.15s; color: var(--subtext);
      font-family: var(--font-ui);
    }
    .tag-chip.active { border-color: var(--pink); color: var(--pink); background: rgba(255,75,203,0.08); }
    .pe-caption-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .pe-caption-speaker {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px; color: var(--text);
      font-size: 0.78rem; outline: none; font-family: var(--font-ui); width: 100%;
    }
    .pe-caption-speaker:focus { border-color: var(--teal); }
    .pe-caption-text {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px; color: var(--text);
      font-size: 0.78rem; outline: none; resize: none; min-height: 72px;
      font-family: var(--font-ui); width: 100%;
    }
    .pe-caption-text:focus { border-color: var(--teal); }
    .pe-save-btn {
      width: 100%; padding: 13px; background: linear-gradient(135deg, var(--teal), var(--purple));
      border: none; border-radius: 12px; color: #0a0a0f;
      font-family: var(--font-display); font-weight: 700; font-size: 0.88rem;
      cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s;
    }
    .pe-save-btn:hover { opacity: 0.88; }

    /* book builder overlay */
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
      font-family: var(--font-ui);
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
      transition: color 0.2s; font-family: var(--font-ui);
    }
    .book-queue-btns button:hover { color: var(--pink); border-color: var(--pink); }
  `;
  document.head.appendChild(s);
}

// ── BUILD HTML ────────────────────────────────────────────────
function buildLibraryHTML() {
  return `
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
  `;
}

// ── BUILD OVERLAY HTML ────────────────────────────────────────
// Overlays are body-level so they're not clipped by view overflow
function ensureOverlays() {
  if (document.getElementById('panel-editor-overlay')) return; // already present

  // Panel editor overlay
  const pe = document.createElement('div');
  pe.id = 'panel-editor-overlay';
  pe.innerHTML = `
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
  `;
  document.body.appendChild(pe);

  // Book builder overlay
  const bb = document.createElement('div');
  bb.id = 'book-builder-overlay';
  bb.innerHTML = `
    <div class="bb-header">
      <span class="bb-title" id="book-builder-title">book</span>
      <button class="bb-play-btn" id="book-play-btn">▶ play as comic</button>
      <button class="bb-close-btn" id="book-builder-close">✕</button>
    </div>
    <div id="book-panel-queue">
      <div class="lib-empty">add panels from the gallery</div>
    </div>
  `;
  document.body.appendChild(bb);
}

// ── INIT ──────────────────────────────────────────────────────
export async function initLibrary() {
  // 1. Inject styles
  injectLibraryStyles();

  // 2. Stamp HTML into view
  const el = document.getElementById('view-library');
  if (!el) return;
  el.innerHTML = buildLibraryHTML();

  // 3. Ensure overlays exist in body
  ensureOverlays();

  // 4. Load data
  panels = await dbGetAll('panels') || [];
  books  = await dbGetAll('books')  || [];

  // 5. Render
  renderLibrary();

  // 6. Wire controls
  wireLibraryControls();
}

// ── WIRE CONTROLS ─────────────────────────────────────────────
function wireLibraryControls() {
  // Add image button
  document.getElementById('lib-add-btn')
    .addEventListener('click', () => document.getElementById('lib-file-input').click());

  // File input
  document.getElementById('lib-file-input')
    .addEventListener('change', handleLibraryFileInput);

  // Close panel editor
  document.getElementById('panel-editor-close')
    .addEventListener('click', closePanelEditor);

  // Save panel from editor
  document.getElementById('panel-editor-save')
    .addEventListener('click', savePanelEdit);

  // Filter chips in editor
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const fObj = FILTERS.find(f => f.id === chip.dataset.filter) || FILTERS[0];
      document.getElementById('panel-editor-img').style.filter = fObj.css;
    });
  });

  // Tag chips in editor
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Book new
  document.getElementById('book-new-btn')
    .addEventListener('click', createNewBook);

  // Book builder close
  document.getElementById('book-builder-close')
    .addEventListener('click', closeBookBuilder);

  // Book play
  document.getElementById('book-play-btn')
    .addEventListener('click', playBookAsComic);

  // Library tab toggle
  document.querySelectorAll('.lib-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      const galleryView = document.getElementById('lib-gallery-view');
      const booksView   = document.getElementById('lib-books-view');
      if (galleryView) galleryView.style.display = which === 'gallery' ? 'flex' : 'none';
      if (booksView)   booksView.style.display   = which === 'books'   ? 'flex' : 'none';
    });
  });
}

// ── INGEST FILES ──────────────────────────────────────────────
async function handleLibraryFileInput(e) {
  for (const file of e.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const dataURL = await readAsDataURL(file);
    const panel = {
      id:        `panel_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      name:      file.name,
      dataURL,
      tag:       'none',
      filter:    'none',
      caption:   { speaker: '', text: '' },
      createdAt: Date.now(),
    };
    panels.push(panel);
    await dbSet('panels', panel);
  }
  renderLibrary();
  e.target.value = '';
}

function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = () => rej(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

// ── SAVE IMAGE TO LIBRARY (called from Imagine tab) ───────────
// Exposed on window by main.js as window.saveImageToLibrary
export async function saveImageToLibrary(dataURL, name = 'generated.png') {
  const panel = {
    id:        `panel_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name,
    dataURL,
    tag:       'none',
    filter:    'none',
    caption:   { speaker: '', text: '' },
    createdAt: Date.now(),
  };
  panels.push(panel);
  await dbSet('panels', panel);
  // Re-render if library view is currently active
  const grid = document.getElementById('lib-grid');
  if (grid) renderLibrary();
  return panel.id;
}

// ── RENDER GALLERY ────────────────────────────────────────────
function renderLibrary() {
  const grid = document.getElementById('lib-grid');
  if (!grid) return;

  if (!panels.length) {
    grid.innerHTML = `
      <div class="lib-empty">
        <div style="font-size:2.4rem;margin-bottom:12px">🖼</div>
        <div>no images yet</div>
        <div style="font-size:var(--subtext-size);margin-top:6px;opacity:0.6">tap + to add your first panel</div>
      </div>`;
    renderBooksView();
    return;
  }

  grid.innerHTML = panels.map(p => {
    const color  = CHAR_COLORS[p.tag] || CHAR_COLORS.none;
    const fObj   = FILTERS.find(f => f.id === p.filter) || FILTERS[0];
    const hasCap = p.caption?.text;
    return `
      <div class="lib-card" onclick="window.openPanelEditor('${p.id}')">
        <div class="lib-card-img-wrap">
          <img src="${p.dataURL}" alt="${p.name}"
               style="filter:${fObj.css}" loading="lazy" />
          ${hasCap ? `<div class="lib-card-caption-dot" style="background:${color}"></div>` : ''}
        </div>
        <div class="lib-card-bar">
          <div class="lib-card-tag" style="color:${color}">${p.tag}</div>
          <div class="lib-card-actions">
            <button onclick="event.stopPropagation();window.addPanelToBook('${p.id}')" title="add to book">＋</button>
            <button onclick="event.stopPropagation();window.deletePanel('${p.id}')" title="delete">✕</button>
          </div>
        </div>
      </div>`;
  }).join('');

  renderBooksView();
}

// ── PANEL EDITOR ──────────────────────────────────────────────
export function openPanelEditor(id) {
  const panel = panels.find(p => p.id === id);
  if (!panel) return;
  editingId = id;

  const img  = document.getElementById('panel-editor-img');
  img.src    = panel.dataURL;
  const fObj = FILTERS.find(f => f.id === panel.filter) || FILTERS[0];
  img.style.filter = fObj.css;

  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === panel.filter);
  });
  document.querySelectorAll('.tag-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tag === panel.tag);
  });

  document.getElementById('panel-caption-speaker').value = panel.caption?.speaker || '';
  document.getElementById('panel-caption-text').value    = panel.caption?.text    || '';

  document.getElementById('panel-editor-overlay').classList.add('open');
}

function closePanelEditor() {
  document.getElementById('panel-editor-overlay').classList.remove('open');
  editingId = null;
}

async function savePanelEdit() {
  const panel = panels.find(p => p.id === editingId);
  if (!panel) return;

  const activeFilter = document.querySelector('.filter-chip.active');
  panel.filter = activeFilter?.dataset.filter || 'none';

  const activeTag = document.querySelector('.tag-chip.active');
  panel.tag = activeTag?.dataset.tag || 'none';

  panel.caption = {
    speaker: document.getElementById('panel-caption-speaker').value.trim(),
    text:    document.getElementById('panel-caption-text').value.trim(),
  };

  await dbSet('panels', panel);
  closePanelEditor();
  renderLibrary();
}

export async function deletePanel(id) {
  panels = panels.filter(p => p.id !== id);
  await dbDelete('panels', id);
  books.forEach(b => { b.panelIds = b.panelIds.filter(pid => pid !== id); });
  for (const b of books) await dbSet('books', b);
  renderLibrary();
}

// ── BOOK BUILDER ──────────────────────────────────────────────
function renderBooksView() {
  const listEl = document.getElementById('lib-books-list');
  if (!listEl) return;

  if (!books.length) {
    listEl.innerHTML = `
      <div class="lib-empty">
        <div style="font-size:2rem;margin-bottom:10px">📖</div>
        <div>no books yet</div>
        <div style="font-size:var(--subtext-size);margin-top:6px;opacity:0.6">create a book and add panels</div>
      </div>`;
    return;
  }

  listEl.innerHTML = books.map(b => `
    <div class="book-card" onclick="window.openBookBuilder('${b.id}')">
      <div class="book-card-spine" style="background:${b.color || '#7B5FFF'}"></div>
      <div class="book-card-info">
        <div class="book-card-title">${b.title}</div>
        <div class="book-card-meta">${b.panelIds.length} panels · tap to edit</div>
      </div>
      <button onclick="event.stopPropagation();window.deleteBook('${b.id}')" class="book-del-btn">✕</button>
    </div>`).join('');
}

function createNewBook() {
  const input = document.getElementById('book-title-input');
  const title = input?.value.trim() || 'untitled book';
  const book = {
    id:        `book_${Date.now()}`,
    title,
    panelIds:  [],
    color:     ['#7B5FFF','#FF4BCB','#00F6D6','#FFD93D'][books.length % 4],
    createdAt: Date.now(),
  };
  books.push(book);
  dbSet('books', book);
  if (input) input.value = '';
  renderBooksView();
  openBookBuilder(book.id);
}

export function openBookBuilder(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  viewingBook = id;

  document.getElementById('book-builder-title').textContent = book.title;

  const queue = document.getElementById('book-panel-queue');
  if (!book.panelIds.length) {
    queue.innerHTML = `<div class="lib-empty" style="padding:24px">tap ＋ on any image to add it here</div>`;
  } else {
    queue.innerHTML = book.panelIds.map((pid, idx) => {
      const p = panels.find(x => x.id === pid);
      if (!p) return '';
      return `
        <div class="book-queue-item">
          <img src="${p.dataURL}" class="book-queue-thumb" />
          <div class="book-queue-info">
            <div class="book-queue-name">${p.name}</div>
            ${p.caption?.text ? `<div class="book-queue-caption">${p.caption.speaker ? `<b>${p.caption.speaker}:</b> ` : ''}${p.caption.text}</div>` : ''}
          </div>
          <div class="book-queue-btns">
            ${idx > 0 ? `<button onclick="window.movePanelInBook('${id}',${idx},-1)">↑</button>` : ''}
            ${idx < book.panelIds.length-1 ? `<button onclick="window.movePanelInBook('${id}',${idx},1)">↓</button>` : ''}
            <button onclick="window.removePanelFromBook('${id}','${pid}')">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  document.getElementById('book-builder-overlay').classList.add('open');
}

function closeBookBuilder() {
  document.getElementById('book-builder-overlay').classList.remove('open');
  viewingBook = null;
}

export function addPanelToBook(panelId) {
  if (!books.length) {
    alert('Create a book first in the Books tab.');
    return;
  }
  const targetId = viewingBook || books[books.length - 1].id;
  const book = books.find(b => b.id === targetId);
  if (!book) return;
  if (!book.panelIds.includes(panelId)) {
    book.panelIds.push(panelId);
    dbSet('books', book);
  }
  if (viewingBook) openBookBuilder(viewingBook);
  else renderBooksView();
}

export function removePanelFromBook(bookId, panelId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  book.panelIds = book.panelIds.filter(id => id !== panelId);
  dbSet('books', book);
  openBookBuilder(bookId);
}

export function movePanelInBook(bookId, idx, dir) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  const arr  = book.panelIds;
  const swap = idx + dir;
  if (swap < 0 || swap >= arr.length) return;
  [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
  dbSet('books', book);
  openBookBuilder(bookId);
}

export async function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  await dbDelete('books', id);
  renderBooksView();
}

// ── PLAY BOOK AS COMIC ────────────────────────────────────────
function playBookAsComic() {
  const book = books.find(b => b.id === viewingBook);
  if (!book || !book.panelIds.length) {
    alert('Add some panels to the book first.');
    return;
  }
  const comicPanels = book.panelIds.map(pid => {
    const p    = panels.find(x => x.id === pid);
    const fObj = FILTERS.find(f => f.id === p?.filter) || FILTERS[0];
    return {
      image:      p?.dataURL || '',
      filter:     fObj.css,
      dialogue:   p?.caption?.text
        ? [{ speaker: p.caption.speaker || 'narrator', text: p.caption.text }]
        : [],
      transition: 'fade',
    };
  });
  closeBookBuilder();
  if (window.playCustomComic) window.playCustomComic(comicPanels);
  else alert('Comic engine not ready.');
}
'''.lstrip()

# Write the file
with open(LIBRARY_PATH, 'w', encoding='utf-8') as f:
    f.write(NEW_CONTENT)

# Verify
with open(LIBRARY_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

print(f'[OK] library.js written: {len(content)} bytes')
print(f'[OK] saveImageToLibrary exported: {"saveImageToLibrary" in content}')
print(f'[OK] ensureOverlays present: {"ensureOverlays" in content}')
print(f'[OK] injectLibraryStyles present: {"injectLibraryStyles" in content}')
print(f'[OK] buildLibraryHTML present: {"buildLibraryHTML" in content}')
