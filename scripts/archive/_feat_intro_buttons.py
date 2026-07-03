#!/usr/bin/env python3
# _feat_intro_buttons.py
# Adds "make intro" + "default intro" buttons to timeline header
# Saves/clears intro_book_id in IDB config store
# tryUserBookIntro in main.js reads config store first

import os, sys

BASE = os.path.expanduser('~/spiralside/js/app')
lib_path  = os.path.join(BASE, 'library.js')
main_path = os.path.join(BASE, 'main.js')

# ── 1. library.js: add buttons to timeline header + wire them ──
with open(lib_path, 'r', encoding='utf-8') as f:
    lib = f.read()

# Add buttons to tl-header HTML
OLD_HEADER = '''      <div class="tl-header">
        <span class="tl-title" id="tl-title">book</span>
        <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
        <button class="tl-close-btn" id="tl-close-btn">✕</button>
      </div>'''

NEW_HEADER = '''      <div class="tl-header">
        <span class="tl-title" id="tl-title">book</span>
        <button class="tl-intro-btn" id="tl-make-intro" title="play this book on startup">⭐ make intro</button>
        <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
        <button class="tl-close-btn" id="tl-close-btn">✕</button>
      </div>'''

if OLD_HEADER not in lib:
    print('[ERROR] tl-header not found in library.js'); sys.exit(1)
lib = lib.replace(OLD_HEADER, NEW_HEADER)

# Add CSS for the intro button (append to existing tl-header styles)
OLD_CSS = '''    .tl-close-btn { background:none; border:none; color:var(--subtext); font-size:1.2rem; cursor:pointer; padding:4px 6px; }'''
NEW_CSS = '''    .tl-close-btn { background:none; border:none; color:var(--subtext); font-size:1.2rem; cursor:pointer; padding:4px 6px; }
    .tl-intro-btn {
      padding:6px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.62rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s;
    }
    .tl-intro-btn:hover { border-color:var(--yellow); color:var(--yellow); }
    .tl-intro-btn.is-intro { border-color:var(--yellow); color:var(--yellow); background:rgba(255,217,61,0.1); }'''

if OLD_CSS not in lib:
    print('[WARN] close-btn CSS not found — skipping CSS patch')
else:
    lib = lib.replace(OLD_CSS, NEW_CSS)
    print('[OK] CSS for intro button added')

# Wire the button in wireTimeline()
OLD_WIRE = '''  document.getElementById('tl-close-btn').addEventListener('click', closeTimeline);
  document.getElementById('tl-play-btn').addEventListener('click', playTimeline);'''

NEW_WIRE = '''  document.getElementById('tl-close-btn').addEventListener('click', closeTimeline);
  document.getElementById('tl-play-btn').addEventListener('click', playTimeline);
  document.getElementById('tl-make-intro').addEventListener('click', toggleBookIntro);'''

if OLD_WIRE not in lib:
    print('[ERROR] wireTimeline close/play not found'); sys.exit(1)
lib = lib.replace(OLD_WIRE, NEW_WIRE)
print('[OK] tl-make-intro button wired')

# Add toggleBookIntro + updateIntroBtn functions before closeTimeline
OLD_CLOSE = '''function closeTimeline() {
  document.getElementById('timeline-overlay').classList.remove('open');
  viewingBookId  = null;
  editingSlotIdx = null;
}'''

NEW_CLOSE = '''// ── INTRO BOOK SETTING ───────────────────────────────────────
// Saves/clears intro_book_id in IDB config store
// Read by _peekIDBConfig in main.js tryUserBookIntro

function _setIDBConfig(key, value) {
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('config')) { db.close(); resolve(); return; }
        const tx = db.transaction('config', 'readwrite');
        tx.objectStore('config').put({ key, value });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror    = () => { db.close(); resolve(); };
      };
      req.onerror = () => resolve();
    } catch(e) { resolve(); }
  });
}

function _getIDBConfig(key) {
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('config')) { db.close(); resolve(null); return; }
        const tx  = db.transaction('config', 'readonly');
        const get = tx.objectStore('config').get(key);
        get.onsuccess = () => { db.close(); resolve(get.result?.value ?? null); };
        get.onerror   = () => { db.close(); resolve(null); };
      };
      req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
  });
}

async function updateIntroBtn() {
  const btn = document.getElementById('tl-make-intro');
  if (!btn) return;
  const currentIntroId = await _getIDBConfig('intro_book_id');
  const isIntro = currentIntroId === viewingBookId;
  btn.classList.toggle('is-intro', isIntro);
  btn.textContent = isIntro ? '⭐ is intro' : '⭐ make intro';
  btn.title = isIntro ? 'tap to restore default intro' : 'play this book on startup';
}

async function toggleBookIntro() {
  const currentIntroId = await _getIDBConfig('intro_book_id');
  if (currentIntroId === viewingBookId) {
    // already set — clear it (restore default intro)
    await _setIDBConfig('intro_book_id', null);
    updateIntroBtn();
    // brief feedback
    const btn = document.getElementById('tl-make-intro');
    if (btn) { btn.textContent = '✓ restored default'; setTimeout(() => updateIntroBtn(), 1200); }
  } else {
    // set this book as intro
    await _setIDBConfig('intro_book_id', viewingBookId);
    updateIntroBtn();
    const btn = document.getElementById('tl-make-intro');
    if (btn) { btn.textContent = '✓ set as intro!'; setTimeout(() => updateIntroBtn(), 1200); }
  }
}

function closeTimeline() {
  document.getElementById('timeline-overlay').classList.remove('open');
  viewingBookId  = null;
  editingSlotIdx = null;
}'''

if OLD_CLOSE not in lib:
    print('[ERROR] closeTimeline not found'); sys.exit(1)
lib = lib.replace(OLD_CLOSE, NEW_CLOSE)
print('[OK] toggleBookIntro + _setIDBConfig + _getIDBConfig added')

# Call updateIntroBtn when timeline opens
OLD_OPEN = '''  document.getElementById('tl-title').textContent = book.title;
  renderStrip(book);
  showSlotEmpty();
  document.getElementById('timeline-overlay').classList.add('open');'''

NEW_OPEN = '''  document.getElementById('tl-title').textContent = book.title;
  renderStrip(book);
  showSlotEmpty();
  document.getElementById('timeline-overlay').classList.add('open');
  updateIntroBtn();  // reflect whether this book is the current intro'''

if OLD_OPEN not in lib:
    print('[WARN] timeline open sequence not found — updateIntroBtn not wired on open')
else:
    lib = lib.replace(OLD_OPEN, NEW_OPEN)
    print('[OK] updateIntroBtn called when timeline opens')

with open(lib_path, 'w', encoding='utf-8') as f:
    f.write(lib)

# ── 2. main.js: read intro_book_id config before peeking books ─
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

# Update tryUserBookIntro to check config store first
OLD_PEEK = '''    const books = await _peekIDBBooks();
    // find most recent book that has at least 1 slot with content
    const valid = (books || [])
      .filter(b => b.slots && b.slots.some(s => s.type === 'image' || (s.type === 'text' && s.text)))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (valid.length) {
      const book = valid[0];'''

NEW_PEEK = '''    const books = await _peekIDBBooks();
    const introId = await _peekIDBConfig('intro_book_id');
    // prefer explicitly set intro book, then fall back to most recent with content
    const valid = (books || [])
      .filter(b => b.slots && b.slots.some(s => s.type === 'image' || (s.type === 'text' && s.text)))
      .sort((a, b) => {
        if (introId) {
          if (a.id === introId) return -1;
          if (b.id === introId) return  1;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    if (valid.length) {
      const book = valid[0];'''

if OLD_PEEK not in main:
    print('[ERROR] _peekIDBBooks block not found in main.js'); sys.exit(1)
main = main.replace(OLD_PEEK, NEW_PEEK)

# Add _peekIDBConfig helper alongside the existing _peekIDB helpers
OLD_PEEK_FN = '''function _peekIDBBooks()  { return _peekIDB('books'); }
function _peekIDBPanels() { return _peekIDB('panels'); }'''

NEW_PEEK_FN = '''function _peekIDBBooks()  { return _peekIDB('books'); }
function _peekIDBPanels() { return _peekIDB('panels'); }
function _peekIDBConfig(key) {
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('config')) { db.close(); resolve(null); return; }
        const tx  = db.transaction('config', 'readonly');
        const get = tx.objectStore('config').get(key);
        get.onsuccess = () => { db.close(); resolve(get.result?.value ?? null); };
        get.onerror   = () => { db.close(); resolve(null); };
      };
      req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
  });
}'''

if OLD_PEEK_FN not in main:
    print('[ERROR] _peekIDBBooks/Panels not found in main.js'); sys.exit(1)
main = main.replace(OLD_PEEK_FN, NEW_PEEK_FN)
print('[OK] main.js: _peekIDBConfig added + tryUserBookIntro reads intro_book_id')

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main)

print('\n[DONE] Push:')
print('  git add . && git commit -m "feat: make intro / default intro buttons in timeline" && git push --force origin main')
