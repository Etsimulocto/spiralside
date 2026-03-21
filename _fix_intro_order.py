#!/usr/bin/env python3
# _fix_intro_order.py
# Fixes the boot order so user book REPLACES Sky's intro, not plays after it
# New flow:
#   1. peek IDB for intro_book_id / most recent book
#   2a. If found → skip initComic, play user book instead, then auth
#   2b. If not found → normal initComic → auth

import os, sys

main_path = os.path.expanduser('~/spiralside/js/app/main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

OLD_BOOT = '''// Boot: play user book intro if available, then normal auth flow
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
}));'''

NEW_BOOT = '''// Boot: user book REPLACES Sky intro if one exists
// Flow: peek IDB → if book found play it then auth, else normal initComic then auth
const _authCallback = () => checkAuthAndShow(onAppReady);

(async () => {
  // peek IDB before anything plays — no initDB needed
  let playedUserBook = false;
  try {
    const books  = await _peekIDBBooks();
    const introId = await _peekIDBConfig('intro_book_id');
    const valid  = (books || [])
      .filter(b => b.slots && b.slots.some(s => s.type==='image' || (s.type==='text' && s.text)))
      .sort((a, b) => {
        if (introId) {
          if (a.id === introId) return -1;
          if (b.id === introId) return  1;
        }
        return (b.createdAt||0) - (a.createdAt||0);
      });

    if (valid.length) {
      const book   = valid[0];
      const panels = await _peekIDBPanels();
      const panelMap = {};
      (panels||[]).forEach(p => { panelMap[p.id] = p; });
      const FILTERS_PEEK = [
        {id:'none',css:'none'},{id:'teal',css:'sepia(1) saturate(3) hue-rotate(130deg) brightness(0.85)'},
        {id:'pink',css:'sepia(1) saturate(3) hue-rotate(280deg) brightness(0.85)'},
        {id:'noir',css:'grayscale(1) contrast(1.2) brightness(0.8)'},
        {id:'glitch',css:'hue-rotate(90deg) saturate(2) contrast(1.3)'},
        {id:'vignette',css:'brightness(0.7) contrast(1.1)'},
      ];
      const comicPanels = book.slots.map(slot => {
        if (slot.type === 'image') {
          const p = panelMap[slot.panelId];
          if (!p) return null;
          const fObj = FILTERS_PEEK.find(f => f.id===(slot.filter||'none')) || FILTERS_PEEK[0];
          const capText    = typeof slot.caption==='string' ? slot.caption : slot.caption?.text||'';
          const capSpeaker = typeof slot.caption==='string' ? 'narrator'   : slot.caption?.speaker||'narrator';
          return {
            image: p.dataURL, filter_css: fObj.css,
            dialogue: capText ? [{speaker:capSpeaker,text:capText}] : [],
            transition:'fade',
            bg_gradient:'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
          };
        } else if (slot.type==='text' && slot.text) {
          return {
            bg_gradient:'radial-gradient(ellipse at 50% 50%,#0a0a1a 0%,#101014 70%)',
            dialogue:[{speaker:slot.speaker||'narrator',text:slot.text}],
            transition:'fade',
          };
        }
        return null;
      }).filter(Boolean);

      if (comicPanels.length) {
        // label the skip button with the book title
        const skipEl = document.getElementById('comic-skip');
        if (skipEl) { skipEl.textContent='skip · '+book.title; skipEl.classList.add('visible'); }
        // show the comic screen (initComic normally does this)
        const screen = document.getElementById('screen-comic');
        if (screen) { screen.classList.remove('fade-out'); screen.style.display=''; }
        // play user book — on finish run normal auth
        window.playCustomComic(comicPanels, _authCallback);
        playedUserBook = true;
      }
    }
  } catch(e) {
    console.log('[intro] IDB peek failed, using default intro', e);
  }

  // no user book — run Sky's intro normally
  if (!playedUserBook) {
    initComic(_authCallback);
  }
})();'''

if OLD_BOOT not in main:
    print('[ERROR] Boot block not found in main.js')
    # show what we have near the end
    idx = main.find('initComic(')
    print('Found initComic at:', idx)
    print(main[idx:idx+200])
    sys.exit(1)

main = main.replace(OLD_BOOT, NEW_BOOT)

# Also remove the now-redundant tryUserBookIntro function and old _peekIDB helpers
# since they're now inlined in the boot IIFE — but keep _peekIDB helpers since
# tryUserBookIntro still references them. Just remove tryUserBookIntro itself.
OLD_TRY = '''async function tryUserBookIntro(fallbackCallback) {
  try {
    const books = await _peekIDBBooks();
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

// Raw IDB read — no initDB needed, just opens spiralside directly'''

NEW_TRY = '// Raw IDB read — no initDB needed, just opens spiralside directly'

if OLD_TRY in main:
    main = main.replace(OLD_TRY, NEW_TRY)
    print('[OK] removed redundant tryUserBookIntro function')
else:
    print('[WARN] tryUserBookIntro not found to remove — may already be clean')

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main)

print('[OK] main.js: boot order fixed — user book now REPLACES Sky intro')
print('[OK] playCustomComic called before initComic if user book found')
print('\n[DONE] Push:')
print('  git add . && git commit -m "fix: user book replaces Sky intro, not plays after" && git push --force origin main')
