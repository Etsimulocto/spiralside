// ============================================================
// SPIRALSIDE — LIBRARY v1.0
// Image gallery, panel editor, book builder
// Replaces old vault image handling
// All data stored in IndexedDB: 'panels' + 'books' stores
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

const CHAR_LABELS = ['none','sky','monday','cold','grit','you'];

const FILTERS = [
  { id: 'none',    label: 'none',    css: 'none' },
  { id: 'teal',    label: 'teal',    css: 'sepia(1) saturate(3) hue-rotate(130deg) brightness(0.85)' },
  { id: 'pink',    label: 'pink',    css: 'sepia(1) saturate(3) hue-rotate(280deg) brightness(0.85)' },
  { id: 'noir',    label: 'noir',    css: 'grayscale(1) contrast(1.2) brightness(0.8)' },
  { id: 'glitch',  label: 'glitch',  css: 'hue-rotate(90deg) saturate(2) contrast(1.3)' },
  { id: 'vignette',label: 'vignette',css: 'brightness(0.7) contrast(1.1)' },
];

// ── STATE ─────────────────────────────────────────────────────
// panels: [{ id, name, dataURL, tag, filter, caption:{speaker,text}, createdAt }]
// books:  [{ id, title, panelIds:[], createdAt }]
let panels      = [];
let books       = [];
let editingId   = null;  // panel being edited
let viewingBook = null;  // book being built

// ── INIT ──────────────────────────────────────────────────────
export async function initLibrary() {
  panels = await dbGetAll('panels') || [];
  books  = await dbGetAll('books')  || [];
  renderLibrary();
  wireLibraryControls();
}

// ── WIRE CONTROLS ─────────────────────────────────────────────
function wireLibraryControls() {
  // Add image button
  document.getElementById('lib-add-btn')
    .addEventListener('click', () => document.getElementById('lib-file-input').click());

  // File input → ingest images
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
      // Live preview
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

  // Book builder: new book
  document.getElementById('book-new-btn')
    .addEventListener('click', createNewBook);

  // Book builder: close
  document.getElementById('book-builder-close')
    .addEventListener('click', closeBookBuilder);

  // Book builder: play as comic
  document.getElementById('book-play-btn')
    .addEventListener('click', playBookAsComic);

  // Library tab toggle: gallery / books
  document.querySelectorAll('.lib-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      document.getElementById('lib-gallery-view').style.display = which === 'gallery' ? '' : 'none';
      document.getElementById('lib-books-view').style.display   = which === 'books'   ? '' : 'none';
    });
  });
}

// ── INGEST FILES ──────────────────────────────────────────────
async function handleLibraryFileInput(e) {
  for (const file of e.target.files) {
    if (!file.type.startsWith('image/')) continue; // images only in library
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

// ── RENDER GALLERY ────────────────────────────────────────────
function renderLibrary() {
  const grid = document.getElementById('lib-grid');

  if (!panels.length) {
    grid.innerHTML = `
      <div class="lib-empty">
        <div style="font-size:2.4rem;margin-bottom:12px">🖼</div>
        <div>no images yet</div>
        <div style="font-size:0.7rem;margin-top:6px;opacity:0.6">tap + to add your first panel</div>
      </div>`;
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

  // Set image
  const img = document.getElementById('panel-editor-img');
  img.src = panel.dataURL;
  const fObj = FILTERS.find(f => f.id === panel.filter) || FILTERS[0];
  img.style.filter = fObj.css;

  // Set filter chips
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === panel.filter);
  });

  // Set tag chips
  document.querySelectorAll('.tag-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tag === panel.tag);
  });

  // Set caption fields
  document.getElementById('panel-caption-speaker').value = panel.caption?.speaker || '';
  document.getElementById('panel-caption-text').value    = panel.caption?.text    || '';

  // Show overlay
  document.getElementById('panel-editor-overlay').classList.add('open');
}

function closePanelEditor() {
  document.getElementById('panel-editor-overlay').classList.remove('open');
  editingId = null;
}

async function savePanelEdit() {
  const panel = panels.find(p => p.id === editingId);
  if (!panel) return;

  // Read filter
  const activeFilter = document.querySelector('.filter-chip.active');
  panel.filter = activeFilter?.dataset.filter || 'none';

  // Read tag
  const activeTag = document.querySelector('.tag-chip.active');
  panel.tag = activeTag?.dataset.tag || 'none';

  // Read caption
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
  // Also remove from any books
  books.forEach(b => { b.panelIds = b.panelIds.filter(pid => pid !== id); });
  for (const b of books) await dbSet('books', b);
  renderLibrary();
}

// ── BOOK BUILDER ──────────────────────────────────────────────
function renderBooksView() {
  const el = document.getElementById('lib-books-view');
  if (!books.length) {
    document.getElementById('lib-books-list').innerHTML = `
      <div class="lib-empty">
        <div style="font-size:2rem;margin-bottom:10px">📖</div>
        <div>no books yet</div>
        <div style="font-size:0.7rem;margin-top:6px;opacity:0.6">create a book and add panels to it</div>
      </div>`;
    return;
  }
  document.getElementById('lib-books-list').innerHTML = books.map(b => `
    <div class="book-card" onclick="window.openBookBuilder('${b.id}')">
      <div class="book-card-spine" style="background:${b.color||'#7B5FFF'}"></div>
      <div class="book-card-info">
        <div class="book-card-title">${b.title}</div>
        <div class="book-card-meta">${b.panelIds.length} panels · tap to edit</div>
      </div>
      <button onclick="event.stopPropagation();window.deleteBook('${b.id}')" class="book-del-btn">✕</button>
    </div>`).join('');
}

function createNewBook() {
  const title = document.getElementById('book-title-input').value.trim() || 'untitled book';
  const book = {
    id:        `book_${Date.now()}`,
    title,
    panelIds:  [],
    color:     ['#7B5FFF','#FF4BCB','#00F6D6','#FFD93D'][books.length % 4],
    createdAt: Date.now(),
  };
  books.push(book);
  dbSet('books', book);
  document.getElementById('book-title-input').value = '';
  renderBooksView();
  openBookBuilder(book.id);
}

export function openBookBuilder(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  viewingBook = id;

  document.getElementById('book-builder-title').textContent = book.title;

  // Render ordered panel list
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
  // If a book is currently open, add there; else use first book or prompt
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
  if (viewingBook) openBookBuilder(viewingBook); // refresh
  else { renderBooksView(); }
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
  const arr = book.panelIds;
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
// Feeds current book's panels into the existing comic engine
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
      image:    p?.dataURL || '',
      filter:   fObj.css,
      dialogue: p?.caption?.text
        ? [{ speaker: p.caption.speaker || 'narrator', text: p.caption.text }]
        : [],
      transition: 'fade',
    };
  });
  closeBookBuilder();
  // Expose to comic engine via window global set in main.js
  if (window.playCustomComic) window.playCustomComic(comicPanels);
  else alert('Comic engine not ready.');
}
