// ============================================================
// SPIRALSIDE — GAMES MENU v1.0
// Header "games" button + dropdown window listing the QuarterbitGames
// minigames (Shadow Lag, ...). Sister file to js/app/lab.js.
// Nimbis anchor: js/app/games.js
//
// HOW TO ADD A GAME LATER:
//   1. Copy the game's web files into its own folder under /games/
//      (e.g. /games/my-game/index.html + its audio/ and art/ folders)
//   2. Drop a small 320x180 thumbnail next to it (art/thumb.jpg)
//   3. Add ONE entry to GAMES below. That's it, no other edits.
//
// Loaded by its own <script type="module"> tag in index.html, NOT through
// main.js, so the games menu still works even if main.js fails to boot.
//
// Why games open full page in a NEW TAB instead of inside a Spiralside tab:
//   - gamepads, keyboard focus and sound all just work with no iframe rules
//   - Spiralside's own hotkeys can't fire while you're playing
//   - the game gets the whole screen (they letterbox to 16:9 on their own)
//
// Why the menu is attached to <body> and not inside the header:
//   #app-header has overflow:hidden, which would clip a dropdown.
//   So the panel is position:fixed and placed under the button with JS.
// ============================================================

// ── THE GAME LIST ──────────────────────────────────────────
// Order here = order in the menu.
//   id     : short unique key (used for the element id)
//   name   : label shown in the menu
//   blurb  : one short line describing the game
//   href   : where it opens. Same-site paths like "/games/shadow-lag/".
//   thumb  : small 16:9 picture shown on the left of the row
//   tag    : optional small badge (e.g. "gamepad" = controller supported)
export const GAMES = [
  {
    id: 'shadowlag',
    name: 'shadow lag',
    blurb: 'your shadow replays you 3–6s late. only it can get hurt.',
    href: '/games/shadow-lag/',
    thumb: '/games/shadow-lag/art/thumb.jpg',
    tag: 'gamepad',
  },
  {
    id: 'blink',
    name: 'blink',
    blurb: 'firefly vs spiders on a barn-door web. bonk them off with a flower.',
    href: '/games/blink/',
    thumb: '/games/blink/art/thumb.jpg',   // title screen render, made for this menu
    tag: 'gamepad',
  },
  {
    id: 'spiralrun',
    name: 'spiral city run',
    blurb: '16-bit dash down the spiral to the Core before the clock runs out.',
    href: '/games/spiral-city-run/',
    thumb: '/games/spiral-city-run/art/thumb.jpg',
    tag: 'gamepad',
  },
];

// ── STYLES ─────────────────────────────────────────────────
// Injected once. Uses the site's design tokens so it follows theme changes.
function injectGamesStyles() {
  // Don't inject twice
  if (document.getElementById('games-menu-styles')) return;
  const s = document.createElement('style');
  s.id = 'games-menu-styles';
  s.textContent = `
    /* caret next to the "games" label; flips when the menu is open */
    #games-launch .games-caret { font-size:0.55rem; opacity:0.7; transition:transform 0.2s; }
    #games-launch[aria-expanded="true"] { color:var(--teal); border-color:var(--teal); }
    #games-launch[aria-expanded="true"] .games-caret { transform:rotate(180deg); }

    /* the dropdown window itself, fixed to the viewport (see header note) */
    #games-menu {
      position:fixed; z-index:9999;            /* above header canvas + views */
      width:min(340px, calc(100vw - 16px));    /* never wider than the screen */
      padding:8px;
      background:rgba(12,12,20,0.97);
      border:1px solid var(--border); border-radius:14px;
      box-shadow:0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,246,214,0.06);
      backdrop-filter:blur(10px);
      font-family:var(--font-ui);
      opacity:0; transform:translateY(-6px); pointer-events:none;
      transition:opacity 0.16s, transform 0.16s;
    }
    #games-menu.open { opacity:1; transform:none; pointer-events:auto; }

    /* small heading row */
    #games-menu .games-head {
      padding:4px 8px 8px; font-size:0.58rem; letter-spacing:0.16em;
      text-transform:uppercase; color:var(--subtext);
    }

    /* one row per game */
    #games-menu .games-item {
      display:flex; align-items:center; gap:10px;
      padding:8px; border-radius:10px;
      color:var(--text); text-decoration:none;
      border:1px solid transparent;
      transition:background 0.15s, border-color 0.15s;
    }
    #games-menu .games-item:hover,
    #games-menu .games-item:focus-visible {
      background:rgba(0,246,214,0.07); border-color:rgba(0,246,214,0.35); outline:none;
    }

    /* 16:9 cover thumbnail on the left */
    #games-menu .games-thumb {
      width:96px; aspect-ratio:16/9; flex-shrink:0;
      object-fit:cover; display:block;
      border-radius:7px; border:1px solid var(--border);
      background:#111;                           /* shows while the image loads */
    }
    #games-menu .games-text { flex:1; min-width:0; }
    #games-menu .games-name { font-size:0.76rem; letter-spacing:0.06em; }
    /* blurb may wrap to two lines, then gets cut with "..." */
    #games-menu .games-blurb {
      font-size:0.62rem; color:var(--subtext); margin-top:3px; line-height:1.35;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    }
    #games-menu .games-tag {
      font-size:0.52rem; letter-spacing:0.1em; text-transform:uppercase;
      padding:2px 6px; border-radius:6px; margin-left:6px; vertical-align:1px;
      color:var(--pink); border:1px solid rgba(255,75,203,0.45);
    }
    #games-menu .games-out { color:var(--subtext); font-size:0.7rem; }
  `;
  document.head.appendChild(s);
}

// ── BUILD ONE MENU ROW ─────────────────────────────────────
// Built with DOM calls (not innerHTML) so game names can't inject markup.
function buildItem(game) {
  // The whole row is a link; every game opens in a new tab
  const a = document.createElement('a');
  a.className = 'games-item';
  a.id = 'games-item-' + game.id;
  a.href = game.href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('role', 'menuitem');

  // Cover thumbnail on the left (lazy so it only downloads when the menu opens)
  const img = document.createElement('img');
  img.className = 'games-thumb';
  img.src = game.thumb;
  img.alt = '';                 // decorative: the name text says what it is
  img.loading = 'lazy';
  img.decoding = 'async';

  // Name + optional tag + blurb in the middle
  const text = document.createElement('span');
  text.className = 'games-text';
  const name = document.createElement('div');
  name.className = 'games-name';
  name.textContent = game.name;
  if (game.tag) {
    const tag = document.createElement('span');
    tag.className = 'games-tag';
    tag.textContent = game.tag;
    name.appendChild(tag);
  }
  const blurb = document.createElement('div');
  blurb.className = 'games-blurb';
  blurb.textContent = game.blurb;
  text.append(name, blurb);

  // "opens in new tab" arrow on the right
  const out = document.createElement('span');
  out.className = 'games-out';
  out.textContent = '↗';

  a.append(img, text, out);
  return a;
}

// ── INIT ───────────────────────────────────────────────────
// Runs by itself (see bottom of file). Wires the #games-launch button in index.html.
export function initGamesMenu() {
  const btn = document.getElementById('games-launch');
  // Button missing (markup changed) or already wired -> do nothing
  if (!btn || btn.dataset.init) return;
  btn.dataset.init = '1';

  injectGamesStyles();

  // Create the panel and fill it from GAMES
  const menu = document.createElement('div');
  menu.id = 'games-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'minigames');
  const head = document.createElement('div');
  head.className = 'games-head';
  head.textContent = 'games · quarterbitgames';
  menu.appendChild(head);
  GAMES.forEach(game => menu.appendChild(buildItem(game)));
  document.body.appendChild(menu);

  // Accessibility wiring on the button
  btn.setAttribute('aria-haspopup', 'menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'games-menu');

  // Place the panel under the button, kept inside the screen edges
  const place = () => {
    const r = btn.getBoundingClientRect();
    const w = menu.offsetWidth;
    // Right-align with the button, then clamp to an 8px screen margin
    let left = r.right - w;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    menu.style.left = left + 'px';
    menu.style.top = (r.bottom + 6) + 'px';
  };

  const isOpen = () => menu.classList.contains('open');

  const open = () => {
    place();
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  };

  // focusBtn: return keyboard focus to the button (used for Escape)
  const close = (focusBtn) => {
    if (!isOpen()) return;
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  };

  // Button toggles the menu
  btn.addEventListener('click', (e) => {
    // Stop the click reaching document, which would close us right away.
    // Side effect (wanted): this also means the lab menu's outside-click
    // handler doesn't see it, so close the lab menu by hand if it's open.
    e.stopPropagation();
    const lab = document.getElementById('lab-menu');
    if (lab && lab.classList.contains('open')) document.body.click();
    isOpen() ? close() : open();
  });

  // Click anywhere outside the panel closes it
  document.addEventListener('click', (e) => {
    if (isOpen() && !menu.contains(e.target)) close();
  });

  // The lab button also stops its clicks from bubbling, so the outside-click
  // handler above never sees it. Listen on it directly: opening lab closes games.
  const labBtn = document.getElementById('lab-launch');
  if (labBtn) labBtn.addEventListener('click', () => close());

  // Picking a game closes the menu (the game opens in a new tab)
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.games-item')) close();
  });

  // Keyboard: Escape closes; arrow keys move between games
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = [...menu.querySelectorAll('.games-item')];
      const i = items.indexOf(document.activeElement);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // From the button (i = -1), Down goes to the first item, Up to the last
      const next = i === -1
        ? (step === 1 ? 0 : items.length - 1)
        : (i + step + items.length) % items.length;
      items[next].focus();
    }
  });

  // Screen size changes or scrolling: just close (simpler than re-tracking)
  window.addEventListener('resize', () => close());
  window.addEventListener('scroll', () => close(), true);
}

// ── AUTO-START ─────────────────────────────────────────────
// Module scripts run after the page is parsed, so the button exists now.
// initGamesMenu() guards itself, so calling it twice is harmless.
initGamesMenu();
