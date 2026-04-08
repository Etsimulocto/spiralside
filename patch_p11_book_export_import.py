#!/usr/bin/env python3
# SPIRALSIDE patch_p11_book_export_import.py
# Add export (download JSON) + import (upload JSON) buttons to book timeline header
# Books already auto-save to IDB on every change — this adds share/backup capability
# Run: cd ~/spiralside && python patch_p11_book_export_import.py

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
# 1. CSS — export/import button styles + title editable style
# ============================================================
patch(LIB,
    "    .tl-intro-btn:hover { border-color:var(--yellow); color:var(--yellow); }\n    .tl-intro-btn.is-intro { border-color:var(--yellow); color:var(--yellow); background:rgba(255,217,61,0.1); }",
    """    .tl-intro-btn:hover { border-color:var(--yellow); color:var(--yellow); }
    .tl-intro-btn.is-intro { border-color:var(--yellow); color:var(--yellow); background:rgba(255,217,61,0.1); }
    .tl-export-btn {
      padding:6px 10px; background:transparent; border:1px solid var(--border);
      border-radius:20px; color:var(--subtext); font-size:0.62rem; font-family:var(--font-ui);
      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s;
    }
    .tl-export-btn:hover { border-color:var(--teal); color:var(--teal); }
    .tl-title-input {
      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;
      color:var(--text); font-family:var(--font-ui); font-size:0.88rem; font-weight:700;
      outline:none; min-width:0; transition:border-color 0.2s;
    }
    .tl-title-input:focus { border-bottom-color:var(--pink); }""",
    'library.js: export/import CSS')

# ============================================================
# 2. HTML — add export + import buttons to tl-header,
#    make title editable input
# ============================================================
OLD_HEADER = """      <div class="tl-header">
        <span class="tl-title" id="tl-title">book</span>
        <button class="tl-intro-btn" id="tl-make-intro" title="play this book on startup">⭐ make intro</button>
        <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
        <button class="tl-close-btn" id="tl-close-btn">✕</button>
      </div>"""

NEW_HEADER = """      <div class="tl-header">
        <input class="tl-title-input" id="tl-title" value="book" />
        <button class="tl-export-btn" id="tl-export-btn" title="download book as JSON">↓ save</button>
        <button class="tl-intro-btn" id="tl-make-intro" title="play this book on startup">⭐ intro</button>
        <button class="tl-play-btn" id="tl-play-btn">▶ play</button>
        <button class="tl-close-btn" id="tl-close-btn">✕</button>
      </div>
      <input type="file" id="tl-import-input" accept=".json" style="display:none" />"""

patch(LIB, OLD_HEADER, NEW_HEADER, 'library.js: header with export + editable title')

# ============================================================
# 3. openBookTimeline — set title as input value + wire title rename
# ============================================================
OLD_TITLE_SET = "  document.getElementById('tl-title').textContent = book.title;"

NEW_TITLE_SET = """  const titleInput = document.getElementById('tl-title');
  if (titleInput) {
    titleInput.value = book.title;
    // Save title on change
    titleInput.oninput = () => {
      const b = books.find(b => b.id === viewingBookId);
      if (b) { b.title = titleInput.value || 'untitled book'; dbSet('books', b); renderBooksView(); }
    };
  }"""

patch(LIB, OLD_TITLE_SET, NEW_TITLE_SET, 'library.js: title input in openBookTimeline')

# ============================================================
# 4. wireTimeline — add export + import wiring
# ============================================================
OLD_WIRE_CLOSE = "  document.getElementById('tl-close-btn').addEventListener('click', closeTimeline);\n  document.getElementById('tl-play-btn').addEventListener('click', playTimeline);\n  document.getElementById('tl-make-intro').addEventListener('click', toggleBookIntro);"

NEW_WIRE_CLOSE = """  document.getElementById('tl-close-btn').addEventListener('click', closeTimeline);
  document.getElementById('tl-play-btn').addEventListener('click', playTimeline);
  document.getElementById('tl-make-intro').addEventListener('click', toggleBookIntro);

  // Export: download book + panels as self-contained JSON
  document.getElementById('tl-export-btn').addEventListener('click', () => {
    const book = books.find(b => b.id === viewingBookId);
    if (!book) return;
    // Bundle panels referenced by this book's slots inline (dataURL included)
    const usedPanelIds = new Set((book.slots || []).map(s => s.panelId).filter(Boolean));
    const panelBundle  = panels.filter(p => usedPanelIds.has(p.id));
    const bundle = { version: 1, book, panels: panelBundle };
    const blob   = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const a      = document.createElement('a');
    a.href       = URL.createObjectURL(blob);
    a.download   = (book.title || 'book').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.spiralbook.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Import: load a .spiralbook.json into IDB
  document.getElementById('tl-import-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const txt  = await file.text();
      const data = JSON.parse(txt);
      if (!data.book || !data.book.id) { alert('Not a valid .spiralbook file.'); return; }
      // Deduplicate: give new IDs if already exists
      const newBookId = 'book_' + Date.now();
      const idMap     = {};  // old panelId -> new panelId
      for (const p of (data.panels || [])) {
        const newId = 'panel_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
        idMap[p.id] = newId;
        const newPanel = { ...p, id: newId };
        panels.push(newPanel);
        await dbSet('panels', newPanel);
      }
      // Remap slot panelIds
      const importedBook = {
        ...data.book,
        id: newBookId,
        title: data.book.title + ' (imported)',
        slots: (data.book.slots || []).map(s => ({
          ...s,
          panelId: idMap[s.panelId] || s.panelId,
        })),
        createdAt: Date.now(),
      };
      books.push(importedBook);
      await dbSet('books', importedBook);
      renderLibrary();
      openBookTimeline(newBookId);
    } catch(err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  });"""

patch(LIB, OLD_WIRE_CLOSE, NEW_WIRE_CLOSE, 'library.js: wire export + import')

# ============================================================
# 5. Books list — add import button to books view toolbar
# ============================================================
OLD_BOOKS_TOOLBAR = """      <!-- BOOKS -->
      <div id="lib-books-view" style="display:none;flex-direction:column;flex:1;overflow:hidden">
        <div class="lib-toolbar" style="padding-bottom:0">
          <input class="book-title-input" id="book-title-input" placeholder="new book title..." />
          <button class="book-create-btn" id="book-new-btn">＋ create</button>
        </div>"""

NEW_BOOKS_TOOLBAR = """      <!-- BOOKS -->
      <div id="lib-books-view" style="display:none;flex-direction:column;flex:1;overflow:hidden">
        <div class="lib-toolbar" style="padding-bottom:0">
          <input class="book-title-input" id="book-title-input" placeholder="new book title..." />
          <button class="book-create-btn" id="book-new-btn">＋ create</button>
          <button class="book-create-btn" id="book-import-btn" style="background:var(--surface2);border:1px solid var(--border);color:var(--subtext)" title="import .spiralbook.json">↑ import</button>
        </div>"""

patch(LIB, OLD_BOOKS_TOOLBAR, NEW_BOOKS_TOOLBAR, 'library.js: import button in books view')

# ============================================================
# 6. wireLibraryControls — wire the books-view import button
# ============================================================
OLD_WIRE_NEW = "  document.getElementById('book-new-btn')\n    .addEventListener('click', createNewBook);"

NEW_WIRE_NEW = """  document.getElementById('book-new-btn')
    .addEventListener('click', createNewBook);
  document.getElementById('book-import-btn')
    .addEventListener('click', () => document.getElementById('tl-import-input').click());"""

patch(LIB, OLD_WIRE_NEW, NEW_WIRE_NEW, 'library.js: wire books-view import button')

print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "feat: book export/import — download .spiralbook.json, editable title, import from file"')
print('  git push --force origin main')
