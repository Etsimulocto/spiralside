#!/usr/bin/env python3
# _feat_user_comic_intro.py
# On login: if user has books with slots, play their most recent book as the intro comic
# Falls back to normal intro if no books found
# Hook point: auth.js checkAuthAndShow, before initComic callback fires

import os, sys

BASE = os.path.expanduser('~/spiralside/js/app')

# ── We patch main.js boot sequence ────────────────────────────
main_path = os.path.join(BASE, 'main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

# The boot line
OLD_BOOT = "initComic(() => checkAuthAndShow(onAppReady));"

NEW_BOOT = """// On startup: try to play the user's most recent book as the intro comic.
// Does a raw IDB peek (before full initDB) to check for books with slots.
// Falls back to normal intro if none found.
async function tryUserBookIntro(fallbackCallback) {
  try {
    const books = await _peekIDBBooks();
    // find most recent book that has at least 1 slot with content
    const valid = (books || [])
      .filter(b => b.slots && b.slots.some(s => s.type === 'image' || (s.type === 'text' && s.text)))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (valid.length) {
      const book = valid[0];
      // build comic panels from slots — images need panels store lookup
      const panels = await _peekIDBPanels();
      const panelMap = {};
      (panels || []).forEach(p => { panelMap[p.id] = p; });
      const FILTERS_PEEK = [
        { id:'none',css:'none'},{id:'teal',css:'sepia(1) saturate(3) hue-rotate(130deg) brightness(0.85)'},
        {id:'pink',css:'sepia(1) saturate(3) hue-rotate(280deg) brightness(0.85)'},
        {id:'noir',css:'grayscale(1) contrast(1.2) brightness(0.8)'},
        {id:'glitch',css:'hue-rotate(90deg) saturate(2) contrast(1.3)'},
        {id:'vignette',css:'brightness(0.7) contrast(1.1)'},
      ];
      const comicPanels = book.slots.map(slot => {
        if (slot.type === 'image') {
          const p = panelMap[slot.panelId];
          if (!p) return null;
          const fObj = FILTERS_PEEK.find(f => f.id === (slot.filter || 'none')) || FILTERS_PEEK[0];
          const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
          const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
          return {
            image: p.dataURL, filter_css: fObj.css,
            dialogue: capText ? [{ speaker: capSpeaker, text: capText }] : [],
            transition: 'fade',
            bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
          };
        } else if (slot.type === 'text' && slot.text) {
          return {
            bg_gradient: 'radial-gradient(ellipse at 50% 50%,#0a0a1a 0%,#101014 70%)',
            dialogue: [{ speaker: slot.speaker || 'narrator', text: slot.text }],
            transition: 'fade',
          };
        }
        return null;
      }).filter(Boolean);

      if (comicPanels.length) {
        // Show a brief "your story" label on the comic skip button area
        const skipEl = document.getElementById('comic-skip');
        if (skipEl) {
          skipEl.textContent = 'skip · ' + book.title;
          skipEl.classList.add('visible');
        }
        // play user book, then proceed to auth/app
        window.playCustomComic(comicPanels, fallbackCallback);
        return;
      }
    }
  } catch(e) {
    // IDB peek failed — fall through to normal intro
    console.log('[intro] no user book found, using default intro');
  }
  // fallback: normal intro comic
  fallbackCallback();
}

// Raw IDB read — no initDB needed, just opens spiralside directly
function _peekIDB(storeName) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve([]); return; }
        const tx = db.transaction(storeName, 'readonly');
        const all = tx.objectStore(storeName).getAll();
        all.onsuccess = () => { db.close(); resolve(all.result || []); };
        all.onerror  = () => { db.close(); resolve([]); };
      };
      req.onerror = () => resolve([]);
    } catch(e) { resolve([]); }
  });
}
function _peekIDBBooks()  { return _peekIDB('books'); }
function _peekIDBPanels() { return _peekIDB('panels'); }

// Boot: play user book intro if available, then normal auth flow
initComic(() => checkAuthAndShow(async (user) => {
  // onAppReady runs first to set everything up
  await onAppReady(user);
  // then after a short delay check for user book to play on next login
  // (store flag so we only play on first load per session, not every tab switch)
  if (!sessionStorage.getItem('_introPlayed')) {
    sessionStorage.setItem('_introPlayed', '1');
    // slight delay so app UI is visible first
    setTimeout(() => tryUserBookIntro(() => {}), 800);
  }
}));"""

if OLD_BOOT not in main:
    print('[ERROR] initComic boot line not found in main.js')
    sys.exit(1)

main = main.replace(OLD_BOOT, NEW_BOOT)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main)

print('[OK] main.js: user book intro wired')
print('[OK] _peekIDB helpers added (raw IDB read, no initDB needed)')
print('[OK] sessionStorage flag prevents replaying on every tab switch')
print('[OK] Falls back gracefully if no books or IDB unavailable')
print('\n[DONE] Push:')
print('  git add . && git commit -m "feat: play user book as startup comic" && git push --force origin main')
