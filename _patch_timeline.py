#!/usr/bin/env python3
# _patch_timeline.py
# Rewrites js/app/library.js with a proper timeline editor
# Replaces the old up/down queue with a horizontal filmstrip timeline
# Each slot: image panel OR text card OR empty + slot
# Slot editor slides up from bottom (no full-screen overlay)

import os

PATH = os.path.expanduser('~/spiralside/js/app/library.js')

NEW = r'''// ============================================================
// SPIRALSIDE — LIBRARY v3.0
// Gallery + Timeline book builder
// Timeline: horizontal filmstrip, image/text slots, slot editor
// Nimbis anchor: js/app/library.js
// ============================================================

import { state }                     from './state.js';
import { dbSet, dbDelete, dbGetAll } from './db.js';

// ── CONSTANTS ─────────────────────────────────────────────────
const CHAR_COLORS = {
  sky: '#00F6D6', monday: '#FF4BCB', cold: '#4DA3FF',
  grit: '#FFD93D', you: '#7B5FFF', none: '#404060',
};

const FILTERS = [
  { id: 'none',     label: 'none',     css: 'none' },
  { id: 'teal',     label: 'teal',     css: 'sepia(1) saturate(3) hue-rotate(130deg) brightness(0.85)' },
  { id: 'pink',     label: 'pink',     css: 'sepia(1) saturate(3) hue-rotate(280deg) brightness(0.85)' },
  { id: 'noir',     label: 'noir',     css: 'grayscale(1) contrast(1.2) brightness(0.8)' },
  { id: 'glitch',   label: 'glitch',   css: 'hue-rotate(90deg) saturate(2) contrast(1.3)' },
  { id: 'vignette', label: 'vignette', css: 'brightness(0.7) contrast(1.1)' },
];

// Slot: { id, type:'image'|'text', panelId?, filter?, tag?, caption?, text?, speaker?, color? }
// Book: { id, title, slots:[], color, createdAt }

// ── STATE ─────────────────────────────────────────────────────
let panels      = [];
let books       = [];
let editingPanelId   = null;   // gallery panel editor
let viewingBookId    = null;   // open book timeline
let editingSlotIdx   = null;   // slot being edited in timeline
let slotEditorMode   = null;   // 'image' | 'text'
let _dragIdx         = null;   // drag source index

// ── STYLES ────────────────────────────────────────────────────
function injectLibraryStyles() {
  if (document.getElementById('library-styles')) return;
  const s = document.createElement('style');
  s.id = 'library-styles';
  s.textContent = `
    #view-library { overflow: hidden; }
    #lib-inner { display:flex; flex-direction:column; height:100%; }

    /* ── tabs ── */
    .lib-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
    .lib-tab {
      flex:1; padding:12px 8px; background:none; border:none;
      border-bottom:2px solid transparent; color:var(--subtext);
      font-size:0.72rem; letter-spacing:0.08em; cursor:pointer;
      transition:all 0.2s; margin-bottom:-1px; font-family:var(--font-ui);
    }
    .lib-tab.active { color:var(--pink); border-bottom-color:var(--pink); }

    /* ── toolbar ── */
    .lib-toolbar { display:flex; gap:8px; padding:12px 16px; flex-shrink:0; }
    .lib-tool-btn {
      flex:1; padding:10px 8px; background:var(--surface2);
      border:1px solid var(--border); border-radius:10px; color:var(--subtext);
      font-size:0.72rem; display:flex; align-items:center; justify-content:center;
      gap:6px; transition:all 0.2s; letter-spacing:0.04em; cursor:pointer;
      font-family:var(--font-ui);
    }
    .lib-tool-btn:hover { border-color:var(--pink); color:var(--pink); }

    /* ── gallery grid ── */
    .lib-gallery-scroll { flex:1; overflow-y:auto; padding:0 16px 80px; }
    #lib-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding-top:4px; }
    .lib-card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:10px; overflow:hidden; cursor:pointer;
      transition:border-color 0.2s, transform 0.15s;
    }
    .lib-card:hover { border-color:var(--pink); transform:translateY(-2px); }
    .lib-card-img-wrap { position:relative; aspect-ratio:3/4; overflow:hidden; background:var(--muted); }
    .lib-card-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
    .lib-card-caption-dot { position:absolute; bottom:6px; right:6px; width:8px; height:8px; border-radius:50%; }
    .lib-card-bar { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; }
    .lib-card-tag { font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; }
    .lib-card-actions { display:flex; gap:4px; }
    .lib-card-actions button {
      background:none; border:none; color:var(--subtext);
      cursor:pointer; font-size:0.8rem; padding:2px 5px;
      border-radius:4px; transition:color 0.2s;
    }
    .lib-card-actions button:hover { color:var(--pink); }
    .lib-empty { text-align:center; padding:48px 20px; color:var(--subtext); font-size:0.78rem; line-height:1.8; }

    /* ── books list ── */
    #lib-books-view { flex:1; overflow-y:auto; padding:12px 16px 80px; display:none; flex-direction:column; }
    .book-title-input {
      flex:1; background:var(--surface2); border:1px solid var(--border);
      border-radius:10px; padding:10px 12px; color:var(--text);
      font-size:0.78rem; outline:none; font-family:var(--font-ui);
    }
    .book-title-input:focus { border-color:var(--pink); }
    .book-create-btn {
      padding:10px 16px; background:var(--pink); border:none; border-radius:10px;
      color:#fff; font-size:0.78rem; cursor:pointer; white-space:nowrap;
      transition:opacity 0.2s; font-family:var(--font-ui);
    }
    .book-create-btn:hover { opacity:0.85; }
    .book-card {
      display:flex; align-items:center; gap:12px;
      background:var(--surface); border:1px solid var(--border);
      border-radius:10px; padding:12px 14px; margin-bottom:8px;
      cursor:pointer; transition:border-color 0.2s;
    }
    .book-card:hover { border-color:var(--pink); }
    .book-card-spine { width:3px; height:36px; border-radius:2px; flex-shrink:0; }
    .book-card-info { flex:1; min-width:0; }
    .book-card-title { font-size:0.82rem; font-weight:600; }
    .book-card-meta { font-size:0.62rem; color:var(--subtext); margin-top:2px; }
    .book-del-btn { background:none; border:none; color:var(--subtext); cursor:pointer; font-size:0.85rem; padding:4px; }
    .book-del-btn:hover { color:var(--pink); }

    /* ── TIMELINE OVERLAY ── */
    #timeline-overlay {
      position:fixed; inset:0; z-index:300;
      background:var(--bg); display:flex; flex-direction:column;
      transform:translateY(100%);
      transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
    }
    #timeline-overlay.open { transform:translateY(0); }

    /* header */
    .tl-header {
      display:flex; align-items:center; gap:10px;
      padding:14px 16px; border-bottom:1px solid var(--border); flex-shrink:0;
    }
    .tl-title { font-size:0.88rem; font-weight:700; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tl-play-btn {
      padding:7px 14px; background:var(--teal); border:none; border-radius:20px;
      color:#0a0a0f; font-size:0.68rem; font-weight:700; cursor:pointer;
      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui);
    }
    .tl-close-btn { background:none; border:none; color:var(--subtext); font-size:1.2rem; cursor:pointer; padding:4px 6px; }

    /* filmstrip */
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
    .tl-slot.drag-over { border-color:var(--teal); transform:scale(1.06); }

    /* ── SLOT EDITOR (bottom sheet) ── */
    #slot-editor {
      flex:1; display:flex; flex-direction:column; overflow:hidden;
      min-height:0;
    }
    .se-empty {
      flex:1; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:16px; padding:20px;
    }
    .se-empty-label { font-size:0.65rem; color:var(--subtext); letter-spacing:0.12em; text-transform:uppercase; }
    .se-type-row { display:flex; gap:12px; }
    .se-type-btn {
      flex:1; padding:16px 8px; background:var(--surface);
      border:1px solid var(--border); border-radius:12px;
      display:flex; flex-direction:column; align-items:center; gap:8px;
      cursor:pointer; transition:all 0.2s; font-family:var(--font-ui);
      color:var(--subtext); font-size:0.7rem; letter-spacing:0.06em;
    }
    .se-type-btn:hover { border-color:var(--teal); color:var(--teal); }
    .se-type-icon { font-size:1.6rem; }

    /* slot editor - active panel */
    .se-panel {
      flex:1; overflow-y:auto; padding:16px 16px 80px;
      display:flex; flex-direction:column; gap:12px;
    }
    .se-row { display:flex; align-items:center; gap:10px; }
    .se-label { font-size:0.6rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }
    .se-preview-wrap {
      width:80px; height:106px; flex-shrink:0; border-radius:8px;
      overflow:hidden; border:1px solid var(--border); background:var(--surface);
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }
    .se-preview-wrap img { width:100%; height:100%; object-fit:cover; }
    .se-preview-wrap.text-card {
      font-size:0.58rem; color:var(--subtext); text-align:center; padding:6px;
    }
    .se-fields { flex:1; display:flex; flex-direction:column; gap:8px; }
    .se-input {
      width:100%; background:var(--surface2); border:1px solid var(--border);
      border-radius:8px; padding:9px 11px; color:var(--text);
      font-size:0.78rem; outline:none; font-family:var(--font-ui);
      transition:border-color 0.2s; resize:none;
    }
    .se-input:focus { border-color:var(--teal); }
    .se-input::placeholder { color:var(--subtext); }
    .se-chips { display:flex; gap:6px; flex-wrap:wrap; }
    .se-chip {
      padding:5px 10px; background:var(--surface2); border:1px solid var(--border);
      border-radius:20px; font-size:0.65rem; cursor:pointer; color:var(--subtext);
      font-family:var(--font-ui); transition:all 0.15s;
    }
    .se-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }
    .se-chip.tag-active { border-color:var(--pink); color:var(--pink); background:rgba(255,75,203,0.08); }
    .se-action-row { display:flex; gap:8px; margin-top:4px; }
    .se-save-btn {
      flex:1; padding:12px; background:linear-gradient(135deg,var(--teal),var(--purple));
      border:none; border-radius:10px; color:#0a0a0f;
      font-family:var(--font-display); font-weight:700; font-size:0.82rem;
      cursor:pointer; transition:opacity 0.2s;
    }
    .se-save-btn:hover { opacity:0.88; }
    .se-del-btn {
      padding:12px 16px; background:transparent; border:1px solid var(--border);
      border-radius:10px; color:var(--subtext); font-family:var(--font-ui);
      font-size:0.78rem; cursor:pointer; transition:all 0.2s;
    }
    .se-del-btn:hover { border-color:var(--pink); color:var(--pink); }

    /* gallery picker inside slot editor */
    .se-gallery-picker {
      flex:1; overflow-y:auto; padding:0 0 60px;
    }
    .se-picker-grid {
      display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px;
    }
    .se-picker-thumb {
      aspect-ratio:3/4; border-radius:6px; overflow:hidden;
      border:2px solid var(--border); cursor:pointer; transition:all 0.15s;
      background:var(--surface);
    }
    .se-picker-thumb:hover { border-color:var(--teal); transform:scale(1.03); }
    .se-picker-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
    .se-picker-upload {
      aspect-ratio:3/4; border-radius:6px;
      border:2px dashed var(--border); cursor:pointer;
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:4px; font-size:0.62rem;
      color:var(--subtext); transition:all 0.15s; background:var(--surface);
    }
    .se-picker-upload:hover { border-color:var(--teal); color:var(--teal); }

    /* panel editor overlay (gallery) */
    #panel-editor-overlay {
      position:fixed; inset:0; z-index:400;
      background:var(--bg); display:flex; flex-direction:column;
      transform:translateY(100%); transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
    }
    #panel-editor-overlay.open { transform:translateY(0); }
    .pe-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border); flex-shrink:0; }
    .pe-header-title { font-size:0.72rem; letter-spacing:0.12em; color:var(--subtext); text-transform:uppercase; }
    .pe-close-btn { background:none; border:none; color:var(--subtext); font-size:1.2rem; cursor:pointer; padding:4px; }
    .pe-body { flex:1; overflow-y:auto; padding:16px 20px 80px; }
    #panel-editor-img-wrap { position:relative; margin-bottom:20px; text-align:center; }
    #panel-editor-img { max-height:38vh; max-width:100%; border-radius:8px; display:block; margin:0 auto; transition:filter 0.3s; }
    .pe-section-label { font-size:0.6rem; color:var(--subtext); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:10px; }
    .pe-filter-row { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; margin-bottom:16px; }
    .filter-chip { flex-shrink:0; padding:6px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:20px; font-size:0.68rem; cursor:pointer; transition:all 0.15s; color:var(--subtext); font-family:var(--font-ui); }
    .filter-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }
    .pe-tag-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
    .tag-chip { padding:6px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:20px; font-size:0.68rem; cursor:pointer; transition:all 0.15s; color:var(--subtext); font-family:var(--font-ui); }
    .tag-chip.active { border-color:var(--pink); color:var(--pink); background:rgba(255,75,203,0.08); }
    .pe-caption-row { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .pe-caption-speaker { background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-size:0.78rem; outline:none; font-family:var(--font-ui); width:100%; }
    .pe-caption-speaker:focus { border-color:var(--teal); }
    .pe-caption-text { background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-size:0.78rem; outline:none; resize:none; min-height:72px; font-family:var(--font-ui); width:100%; }
    .pe-caption-text:focus { border-color:var(--teal); }
    .pe-save-btn { width:100%; padding:13px; background:linear-gradient(135deg,var(--teal),var(--purple)); border:none; border-radius:12px; color:#0a0a0f; font-family:var(--font-display); font-weight:700; font-size:0.88rem; cursor:pointer; letter-spacing:0.04em; transition:opacity 0.2s; }
    .pe-save-btn:hover { opacity:0.88; }
  `;
  document.head.appendChild(s);
}

// ── HTML ──────────────────────────────────────────────────────
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
          <div id="lib-grid"></div>
        </div>
      </div>

      <!-- BOOKS -->
      <div id="lib-books-view" style="display:none;flex-direction:column;flex:1;overflow:hidden">
        <div class="lib-toolbar" style="padding-bottom:0">
          <input class="book-title-input" id="book-title-input" placeholder="new book title..." />
          <button class="book-create-btn" id="book-new-btn">＋ create</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px 16px 80px">
          <div id="lib-books-list"></div>
        </div>
      </div>
    </div>
    <input type="file" id="lib-file-input" style="display:none" accept="image/*" multiple />
    <input type="file" id="lib-slot-file-input" style="display:none" accept="image/*" />
  `;
}

function ensureOverlays() {
  // ── TIMELINE OVERLAY ──────────────────────────────────────
  if (!document.getElementById('timeline-overlay')) {
    const tl = document.createElement('div');
    tl.id = 'timeline-overlay';
    tl.innerHTML = `
      <div class="tl-header">
        <span class="tl-title" id="tl-title">book</span>
        <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
        <button class="tl-close-btn" id="tl-close-btn">✕</button>
      </div>
      <div class="tl-strip-wrap" id="tl-strip"></div>
      <div id="slot-editor">
        <div class="se-empty" id="se-empty">
          <div class="se-empty-label">tap a slot or add a new one</div>
          <div class="se-type-row">
            <button class="se-type-btn" id="se-add-image">
              <span class="se-type-icon">🖼</span>image panel
            </button>
            <button class="se-type-btn" id="se-add-text">
              <span class="se-type-icon">✍</span>text card
            </button>
          </div>
        </div>
        <div class="se-panel" id="se-image-panel" style="display:none">
          <div class="se-label">pick from gallery — or upload</div>
          <div class="se-gallery-picker">
            <div class="se-picker-grid" id="se-picker-grid"></div>
          </div>
        </div>
        <div class="se-panel" id="se-text-panel" style="display:none">
          <div class="se-row">
            <div class="se-preview-wrap text-card" id="se-text-preview">preview</div>
            <div class="se-fields">
              <div class="se-label">speaker (optional)</div>
              <input class="se-input" id="se-speaker" placeholder="Sky / narrator / ..." />
              <div class="se-label" style="margin-top:6px">text</div>
              <textarea class="se-input" id="se-text-body" rows="3" placeholder="dialogue, caption, narration..."></textarea>
            </div>
          </div>
          <div>
            <div class="se-label">text color</div>
            <div class="se-chips" id="se-color-chips">
              <button class="se-chip active" data-color="#F0F0FF">white</button>
              <button class="se-chip" data-color="#00F6D6" style="color:#00F6D6">sky</button>
              <button class="se-chip" data-color="#FF4BCB" style="color:#FF4BCB">monday</button>
              <button class="se-chip" data-color="#4DA3FF" style="color:#4DA3FF">cold</button>
              <button class="se-chip" data-color="#FFD93D" style="color:#FFD93D">grit</button>
            </div>
          </div>
          <div class="se-action-row">
            <button class="se-save-btn" id="se-text-save">save card</button>
            <button class="se-del-btn" id="se-text-del">remove</button>
          </div>
        </div>
        <div class="se-panel" id="se-image-edit-panel" style="display:none">
          <div class="se-row">
            <div class="se-preview-wrap" id="se-img-preview-wrap">
              <img id="se-img-preview" src="" alt="" />
            </div>
            <div class="se-fields">
              <div class="se-label">filter</div>
              <div class="se-chips" id="se-filter-chips">
                ${FILTERS.map(f => `<button class="se-chip ${f.id==='none'?'active':''}" data-filter="${f.id}">${f.label}</button>`).join('')}
              </div>
              <div class="se-label" style="margin-top:6px">tag</div>
              <div class="se-chips" id="se-tag-chips">
                <button class="se-chip tag-active" data-tag="none">none</button>
                <button class="se-chip" data-tag="sky" style="color:#00F6D6">sky</button>
                <button class="se-chip" data-tag="monday" style="color:#FF4BCB">monday</button>
                <button class="se-chip" data-tag="cold" style="color:#4DA3FF">cold</button>
                <button class="se-chip" data-tag="grit" style="color:#FFD93D">grit</button>
              </div>
            </div>
          </div>
          <div class="se-label">caption</div>
          <input class="se-input" id="se-cap-speaker" placeholder="speaker (blank = narrator)" />
          <textarea class="se-input" id="se-cap-text" rows="2" placeholder="dialogue or caption..." style="margin-top:6px"></textarea>
          <div class="se-action-row">
            <button class="se-save-btn" id="se-img-save">save panel</button>
            <button class="se-del-btn" id="se-img-del">remove</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(tl);
  }

  // ── PANEL EDITOR OVERLAY (gallery) ────────────────────────
  if (!document.getElementById('panel-editor-overlay')) {
    const pe = document.createElement('div');
    pe.id = 'panel-editor-overlay';
    pe.innerHTML = `
      <div class="pe-header">
        <span class="pe-header-title">edit panel</span>
        <button class="pe-close-btn" id="panel-editor-close">✕</button>
      </div>
      <div class="pe-body">
        <div id="panel-editor-img-wrap"><img id="panel-editor-img" src="" alt="panel" /></div>
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
          <input class="pe-caption-speaker" id="panel-caption-speaker" placeholder="speaker name" />
          <textarea class="pe-caption-text" id="panel-caption-text" placeholder="dialogue or caption text..."></textarea>
        </div>
        <button class="pe-save-btn" id="panel-editor-save">save panel</button>
      </div>
    `;
    document.body.appendChild(pe);
  }
}

// ── INIT ──────────────────────────────────────────────────────
export async function initLibrary() {
  injectLibraryStyles();
  const el = document.getElementById('view-library');
  if (!el) return;
  el.innerHTML = buildLibraryHTML();
  ensureOverlays();
  panels = await dbGetAll('panels') || [];
  books  = await dbGetAll('books')  || [];
  renderLibrary();
  wireLibraryControls();
  wireTimeline();
}

// ── GALLERY CONTROLS ──────────────────────────────────────────
function wireLibraryControls() {
  document.getElementById('lib-add-btn')
    .addEventListener('click', () => document.getElementById('lib-file-input').click());
  document.getElementById('lib-file-input')
    .addEventListener('change', handleLibraryFileInput);
  document.getElementById('panel-editor-close')
    .addEventListener('click', closePanelEditor);
  document.getElementById('panel-editor-save')
    .addEventListener('click', savePanelEdit);

  document.querySelectorAll('.filter-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const fObj = FILTERS.find(f => f.id === c.dataset.filter) || FILTERS[0];
      document.getElementById('panel-editor-img').style.filter = fObj.css;
    })
  );
  document.querySelectorAll('.tag-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('.tag-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    })
  );

  document.getElementById('book-new-btn')
    .addEventListener('click', createNewBook);

  document.querySelectorAll('.lib-tab').forEach(tab =>
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      document.getElementById('lib-gallery-view').style.display = which === 'gallery' ? 'flex' : 'none';
      document.getElementById('lib-books-view').style.display   = which === 'books'   ? 'flex' : 'none';
    })
  );
}

// ── TIMELINE WIRING ───────────────────────────────────────────
function wireTimeline() {
  document.getElementById('tl-close-btn').addEventListener('click', closeTimeline);
  document.getElementById('tl-play-btn').addEventListener('click', playTimeline);

  // add buttons in empty state
  document.getElementById('se-add-image').addEventListener('click', () => openSlotEditor(null, 'image'));
  document.getElementById('se-add-text').addEventListener('click',  () => openSlotEditor(null, 'text'));

  // gallery picker upload
  document.getElementById('lib-slot-file-input').addEventListener('change', handleSlotUpload);

  // text card chips
  document.querySelectorAll('#se-color-chips .se-chip').forEach(c =>
    c.addEventListener('click', () => {
      document.querySelectorAll('#se-color-chips .se-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      updateTextPreview();
    })
  );
  document.getElementById('se-speaker').addEventListener('input', updateTextPreview);
  document.getElementById('se-text-body').addEventListener('input', updateTextPreview);
  document.getElementById('se-text-save').addEventListener('click', saveTextSlot);
  document.getElementById('se-text-del').addEventListener('click',  deleteCurrentSlot);

  // image edit chips
  document.querySelectorAll('#se-filter-chips .se-chip').forEach(c =>
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
  );
  document.getElementById('se-img-save').addEventListener('click', saveImageSlot);
  document.getElementById('se-img-del').addEventListener('click',  deleteCurrentSlot);
}

// ── GALLERY RENDER ────────────────────────────────────────────
function renderLibrary() {
  const grid = document.getElementById('lib-grid');
  if (!grid) return;
  if (!panels.length) {
    grid.innerHTML = `<div class="lib-empty"><div style="font-size:2.4rem;margin-bottom:12px">🖼</div><div>no images yet</div><div style="font-size:var(--subtext-size);margin-top:6px;opacity:0.6">tap + to add your first image</div></div>`;
    renderBooksView(); return;
  }
  grid.innerHTML = panels.map(p => {
    const color = CHAR_COLORS[p.tag] || CHAR_COLORS.none;
    const fObj  = FILTERS.find(f => f.id === p.filter) || FILTERS[0];
    return `
      <div class="lib-card" onclick="window.openPanelEditor('${p.id}')">
        <div class="lib-card-img-wrap">
          <img src="${p.dataURL}" style="filter:${fObj.css}" loading="lazy" />
          ${p.caption?.text ? `<div class="lib-card-caption-dot" style="background:${color}"></div>` : ''}
        </div>
        <div class="lib-card-bar">
          <div class="lib-card-tag" style="color:${color}">${p.tag}</div>
          <div class="lib-card-actions">
            <button onclick="event.stopPropagation();window.deletePanel('${p.id}')" title="delete">✕</button>
          </div>
        </div>
      </div>`;
  }).join('');
  renderBooksView();
}

// ── BOOKS LIST RENDER ─────────────────────────────────────────
function renderBooksView() {
  const el = document.getElementById('lib-books-list');
  if (!el) return;
  if (!books.length) {
    el.innerHTML = `<div class="lib-empty"><div style="font-size:2rem;margin-bottom:10px">📖</div><div>no books yet</div><div style="font-size:var(--subtext-size);margin-top:6px;opacity:0.6">create one above</div></div>`;
    return;
  }
  el.innerHTML = books.map(b => {
    const count = (b.slots || []).length;
    return `
      <div class="book-card" onclick="window.openBookTimeline('${b.id}')">
        <div class="book-card-spine" style="background:${b.color || '#7B5FFF'}"></div>
        <div class="book-card-info">
          <div class="book-card-title">${b.title}</div>
          <div class="book-card-meta">${count} slot${count !== 1 ? 's' : ''} · tap to edit</div>
        </div>
        <button onclick="event.stopPropagation();window.deleteBook('${b.id}')" class="book-del-btn">✕</button>
      </div>`;
  }).join('');
}

// ── FILMSTRIP RENDER ──────────────────────────────────────────
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
}

// ── TIMELINE OPEN/CLOSE ───────────────────────────────────────
export function openBookTimeline(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  // migrate old panelIds format to slots
  if (!book.slots && book.panelIds) {
    book.slots = book.panelIds.map(pid => ({ id: `slot_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, type: 'image', panelId: pid, filter: 'none', tag: 'none', caption: '' }));
    delete book.panelIds;
    dbSet('books', book);
  }
  if (!book.slots) book.slots = [];
  viewingBookId = id;
  editingSlotIdx = null;
  document.getElementById('tl-title').textContent = book.title;
  renderStrip(book);
  showSlotEmpty();
  document.getElementById('timeline-overlay').classList.add('open');
}

function closeTimeline() {
  document.getElementById('timeline-overlay').classList.remove('open');
  viewingBookId  = null;
  editingSlotIdx = null;
}

// ── SLOT EDITOR PANELS ────────────────────────────────────────
function showSlotEmpty() {
  document.getElementById('se-empty').style.display         = 'flex';
  document.getElementById('se-image-panel').style.display   = 'none';
  document.getElementById('se-text-panel').style.display    = 'none';
  document.getElementById('se-image-edit-panel').style.display = 'none';
}

function showSlotTypeChoice() {
  editingSlotIdx = null;
  refreshStripHighlight();
  showSlotEmpty();
}

function openSlotEditor(idx, type) {
  const book = books.find(b => b.id === viewingBookId);
  if (!book) return;

  if (idx === null) {
    // new slot — show type choice in empty panel
    editingSlotIdx = null;
    refreshStripHighlight();
    showSlotEmpty();
    // but activate appropriate sub-panel
    if (type === 'image') showImagePicker();
    else if (type === 'text') showTextEditor(null);
    return;
  }

  editingSlotIdx = idx;
  refreshStripHighlight();

  const slot = book.slots[idx];
  if (slot.type === 'image') showImageEditPanel(slot);
  else if (slot.type === 'text') showTextEditor(slot);
}

function showImagePicker() {
  document.getElementById('se-empty').style.display         = 'none';
  document.getElementById('se-image-panel').style.display   = 'flex';
  document.getElementById('se-text-panel').style.display    = 'none';
  document.getElementById('se-image-edit-panel').style.display = 'none';
  renderPickerGrid();
}

function showTextEditor(slot) {
  document.getElementById('se-empty').style.display         = 'none';
  document.getElementById('se-image-panel').style.display   = 'none';
  document.getElementById('se-text-panel').style.display    = 'flex';
  document.getElementById('se-image-edit-panel').style.display = 'none';
  document.getElementById('se-speaker').value   = slot?.speaker || '';
  document.getElementById('se-text-body').value = slot?.text    || '';
  // set color chip
  const color = slot?.color || '#F0F0FF';
  document.querySelectorAll('#se-color-chips .se-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.color === color);
  });
  updateTextPreview();
}

function showImageEditPanel(slot) {
  document.getElementById('se-empty').style.display         = 'none';
  document.getElementById('se-image-panel').style.display   = 'none';
  document.getElementById('se-text-panel').style.display    = 'none';
  document.getElementById('se-image-edit-panel').style.display = 'flex';
  const p = panels.find(x => x.id === slot.panelId);
  const img = document.getElementById('se-img-preview');
  if (img && p) img.src = p.dataURL;
  const fObj = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
  if (img) img.style.filter = fObj.css;
  document.querySelectorAll('#se-filter-chips .se-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === (slot.filter || 'none'));
  });
  document.querySelectorAll('#se-tag-chips .se-chip').forEach(c => {
    c.classList.remove('active', 'tag-active');
    if (c.dataset.tag === (slot.tag || 'none')) c.classList.add('tag-active');
  });
  document.getElementById('se-cap-speaker').value = slot.caption?.speaker || slot.speaker || '';
  document.getElementById('se-cap-text').value    = slot.caption?.text    || slot.caption  || '';
}

function renderPickerGrid() {
  const grid = document.getElementById('se-picker-grid');
  if (!grid) return;
  let html = `<div class="se-picker-upload" onclick="document.getElementById('lib-slot-file-input').click()"><span style="font-size:1.4rem">+</span><span>upload</span></div>`;
  html += panels.map(p => {
    const fObj = FILTERS.find(f => f.id === (p.filter || 'none')) || FILTERS[0];
    return `<div class="se-picker-thumb" onclick="window._pickPanelForSlot('${p.id}')"><img src="${p.dataURL}" style="filter:${fObj.css}" /></div>`;
  }).join('');
  grid.innerHTML = html;
  window._pickPanelForSlot = (panelId) => addImageSlot(panelId);
}

// ── SLOT OPERATIONS ───────────────────────────────────────────
function addImageSlot(panelId) {
  const book = books.find(b => b.id === viewingBookId);
  if (!book) return;
  const slot = { id: _sid(), type: 'image', panelId, filter: 'none', tag: 'none', caption: { speaker: '', text: '' } };
  if (editingSlotIdx !== null) {
    book.slots[editingSlotIdx] = slot;
  } else {
    book.slots.push(slot);
    editingSlotIdx = book.slots.length - 1;
  }
  dbSet('books', book);
  renderStrip(book);
  showImageEditPanel(slot);
  refreshStripHighlight();
}

function saveImageSlot() {
  const book = books.find(b => b.id === viewingBookId);
  if (!book || editingSlotIdx === null) return;
  const slot = book.slots[editingSlotIdx];
  if (!slot) return;
  const activeFilter = document.querySelector('#se-filter-chips .se-chip.active');
  slot.filter = activeFilter?.dataset.filter || 'none';
  const activeTag = document.querySelector('#se-tag-chips .se-chip.tag-active');
  slot.tag = activeTag?.dataset.tag || 'none';
  slot.caption = {
    speaker: document.getElementById('se-cap-speaker').value.trim(),
    text:    document.getElementById('se-cap-text').value.trim(),
  };
  dbSet('books', book);
  renderStrip(book);
  refreshStripHighlight();
}

function saveTextSlot() {
  const book = books.find(b => b.id === viewingBookId);
  if (!book) return;
  const activeColor = document.querySelector('#se-color-chips .se-chip.active');
  const slot = {
    id:      _sid(),
    type:    'text',
    speaker: document.getElementById('se-speaker').value.trim(),
    text:    document.getElementById('se-text-body').value.trim(),
    color:   activeColor?.dataset.color || '#F0F0FF',
  };
  if (editingSlotIdx !== null && book.slots[editingSlotIdx]) {
    Object.assign(book.slots[editingSlotIdx], slot);
  } else {
    book.slots.push(slot);
    editingSlotIdx = book.slots.length - 1;
  }
  dbSet('books', book);
  renderStrip(book);
  refreshStripHighlight();
}

function deleteCurrentSlot() {
  const book = books.find(b => b.id === viewingBookId);
  if (!book || editingSlotIdx === null) return;
  book.slots.splice(editingSlotIdx, 1);
  editingSlotIdx = null;
  dbSet('books', book);
  renderStrip(book);
  showSlotEmpty();
}

function updateTextPreview() {
  const prev = document.getElementById('se-text-preview');
  if (!prev) return;
  const speaker = document.getElementById('se-speaker').value.trim();
  const text    = document.getElementById('se-text-body').value.trim();
  const color   = document.querySelector('#se-color-chips .se-chip.active')?.dataset.color || '#F0F0FF';
  prev.style.color = color;
  prev.innerHTML = `${speaker ? `<b>${speaker}</b><br>` : ''}${text || '<span style="opacity:0.4">preview</span>'}`;
}

function refreshStripHighlight() {
  document.querySelectorAll('.tl-slot').forEach((el, idx) => {
    el.classList.toggle('active', idx === editingSlotIdx);
  });
}

// ── PLAY TIMELINE ─────────────────────────────────────────────
function playTimeline() {
  const book = books.find(b => b.id === viewingBookId);
  if (!book || !book.slots?.length) { alert('Add some panels first.'); return; }
  const comicPanels = book.slots.map(slot => {
    if (slot.type === 'image') {
      const p    = panels.find(x => x.id === slot.panelId);
      const fObj = FILTERS.find(f => f.id === (slot.filter || 'none')) || FILTERS[0];
      return {
        image:    p?.dataURL || '',
        dialogue: slot.caption?.text
          ? [{ speaker: slot.caption.speaker || 'narrator', text: slot.caption.text }]
          : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };
    } else {
      return {
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#0a0a1a 0%,#101014 70%)',
        dialogue: slot.text
          ? [{ speaker: slot.speaker || 'narrator', text: slot.text }]
          : [],
        transition: 'fade',
      };
    }
  }).filter(p => p.dialogue?.length || p.image);
  closeTimeline();
  if (window.playCustomComic) window.playCustomComic(comicPanels);
  else alert('Comic engine not ready.');
}

// ── SLOT UPLOAD ───────────────────────────────────────────────
async function handleSlotUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const dataURL = await readAsDataURL(file);
  const panel = {
    id: `panel_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name: file.name, dataURL, tag: 'none', filter: 'none',
    caption: { speaker: '', text: '' }, createdAt: Date.now(),
  };
  panels.push(panel);
  await dbSet('panels', panel);
  addImageSlot(panel.id);
  e.target.value = '';
}

// ── INGEST FILES (gallery) ────────────────────────────────────
async function handleLibraryFileInput(e) {
  for (const file of e.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const dataURL = await readAsDataURL(file);
    const panel = {
      id: `panel_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      name: file.name, dataURL, tag: 'none', filter: 'none',
      caption: { speaker: '', text: '' }, createdAt: Date.now(),
    };
    panels.push(panel);
    await dbSet('panels', panel);
  }
  renderLibrary();
  e.target.value = '';
}

// ── SAVE IMAGE TO LIBRARY (from Imagine tab) ──────────────────
export async function saveImageToLibrary(dataURL, name = 'generated.png') {
  const panel = {
    id: `panel_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name, dataURL, tag: 'none', filter: 'none',
    caption: { speaker: '', text: '' }, createdAt: Date.now(),
  };
  panels.push(panel);
  await dbSet('panels', panel);
  const grid = document.getElementById('lib-grid');
  if (grid) renderLibrary();
  return panel.id;
}

// ── GALLERY PANEL EDITOR ──────────────────────────────────────
export function openPanelEditor(id) {
  const panel = panels.find(p => p.id === id);
  if (!panel) return;
  editingPanelId = id;
  const img = document.getElementById('panel-editor-img');
  img.src = panel.dataURL;
  const fObj = FILTERS.find(f => f.id === panel.filter) || FILTERS[0];
  img.style.filter = fObj.css;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === panel.filter));
  document.querySelectorAll('.tag-chip').forEach(c => c.classList.toggle('active', c.dataset.tag === panel.tag));
  document.getElementById('panel-caption-speaker').value = panel.caption?.speaker || '';
  document.getElementById('panel-caption-text').value    = panel.caption?.text    || '';
  document.getElementById('panel-editor-overlay').classList.add('open');
}

function closePanelEditor() {
  document.getElementById('panel-editor-overlay').classList.remove('open');
  editingPanelId = null;
}

async function savePanelEdit() {
  const panel = panels.find(p => p.id === editingPanelId);
  if (!panel) return;
  panel.filter = document.querySelector('.filter-chip.active')?.dataset.filter || 'none';
  panel.tag    = document.querySelector('.tag-chip.active')?.dataset.tag || 'none';
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
  books.forEach(b => { if (b.slots) b.slots = b.slots.filter(s => s.panelId !== id); });
  for (const b of books) await dbSet('books', b);
  renderLibrary();
}

// ── BOOK CRUD ─────────────────────────────────────────────────
function createNewBook() {
  const input = document.getElementById('book-title-input');
  const title = input?.value.trim() || 'untitled book';
  const book = {
    id: `book_${Date.now()}`, title, slots: [],
    color: ['#7B5FFF','#FF4BCB','#00F6D6','#FFD93D'][books.length % 4],
    createdAt: Date.now(),
  };
  books.push(book);
  dbSet('books', book);
  if (input) input.value = '';
  renderBooksView();
  openBookTimeline(book.id);
}

export async function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  await dbDelete('books', id);
  renderBooksView();
}

// ── HELPERS ───────────────────────────────────────────────────
function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = () => rej(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function _sid() {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
}

// ── LEGACY COMPAT (still exposed on window via main.js) ───────
// These are no-ops now since the book builder was replaced with the timeline
export function openBookBuilder(id) { openBookTimeline(id); }
export function addPanelToBook(panelId) {
  if (!viewingBookId) { alert('Open a book first.'); return; }
  addImageSlot(panelId);
}
export function removePanelFromBook() {}
export function movePanelInBook() {}
'''

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(NEW)

# Verify key sections
with open(PATH, 'r', encoding='utf-8') as f:
    c = f.read()

checks = [
    'openBookTimeline', 'renderStrip', 'showImagePicker',
    'showTextEditor', 'saveImageSlot', 'saveTextSlot',
    'deleteCurrentSlot', 'tl-strip', 'se-picker-grid',
    'playTimeline', 'saveImageToLibrary', 'handleSlotUpload',
]
for k in checks:
    print(f'[{"OK" if k in c else "MISSING"}] {k}')

# Also update main.js to expose openBookTimeline
main_path = PATH.replace('js/app/library.js', 'js/app/main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

OLD = "window.openBookBuilder   = openBookBuilder;"
NEW_LINE = "window.openBookBuilder   = openBookBuilder;\nwindow.openBookTimeline  = openBookTimeline;"

if OLD in main and 'openBookTimeline' not in main:
    # also need to import it
    main = main.replace(
        "         deleteBook, saveImageToLibrary }          from './library.js';",
        "         deleteBook, saveImageToLibrary,\n         openBookTimeline }              from './library.js';"
    )
    main = main.replace(OLD, NEW_LINE)
    with open(main_path, 'w', encoding='utf-8') as f:
        f.write(main)
    print('[OK] main.js: openBookTimeline imported + exposed')
else:
    print('[SKIP] main.js already has openBookTimeline or OLD anchor not found')

print('\n[DONE] Push with:')
print('  git add . && git commit -m "feat: timeline book builder v1" && git push --force origin main')
