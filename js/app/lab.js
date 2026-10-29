// ============================================================
// SPIRALSIDE — LAB MENU v1.0
// Header "lab" button + dropdown window listing the standalone
// mini apps (Happy Jarz, BloomCircuit, BloomForge, ...).
// Nimbis anchor: js/app/lab.js
//
// HOW TO ADD AN APP LATER:
//   1. Copy the app's web files into its own folder (e.g. /bloomgyro/)
//   2. Add ONE entry to LAB_APPS below. That's it, no other edits.
//
// Loaded by its own <script type="module"> tag in index.html, NOT through
// main.js, so the lab still works even if main.js fails to boot.
//
// Why the menu is attached to <body> and not inside the header:
//   #app-header has overflow:hidden, which would clip a dropdown.
//   So the panel is position:fixed and placed under the button with JS.
// ============================================================

// ── THE APP LIST ───────────────────────────────────────────
// Order here = order in the menu.
//   id     : short unique key (used for the element id)
//   icon   : one plain-text symbol (︎ forces text style, not emoji)
//   name   : label shown in the menu
//   blurb  : one short line describing the app
//   href   : where it opens. Same-site paths like "/bloomforge/" or full URLs.
//   tag    : optional small badge (e.g. "usb" = needs a plugged-in device)
export const LAB_APPS = [
  {
    id: 'jarz',
    icon: '✦',                  // four-point star
    name: 'happy jarz',
    blurb: 'light + play your Happy Jarz stand',
    href: 'https://jarz.spiralside.com',
    tag: 'usb',
  },
  {
    id: 'circuit',
    icon: '⊶︎',            // wire-and-node glyph
    name: 'bloomcircuit',
    blurb: 'wiring maps → laser-ready SVG',
    href: '/bloomcircuit/',
  },
  {
    id: 'forge',
    icon: '⚒︎',            // hammer and pick
    name: 'bloomforge',
    blurb: 'laser-cut plywood + LEGO-fit drafting',
    href: '/bloomforge/',
  },
];

// ── STYLES ─────────────────────────────────────────────────
// Injected once. Uses the site's design tokens so it follows theme changes.
function injectLabStyles() {
  // Don't inject twice
  if (document.getElementById('lab-menu-styles')) return;
  const s = document.createElement('style');
  s.id = 'lab-menu-styles';
  s.textContent = `
    /* caret next to the "lab" label; flips when the menu is open */
    #lab-launch .lab-caret { font-size:0.55rem; opacity:0.7; transition:transform 0.2s; }
    #lab-launch[aria-expanded="true"] { color:var(--teal); border-color:var(--teal); }
    #lab-launch[aria-expanded="true"] .lab-caret { transform:rotate(180deg); }

    /* the dropdown window itself, fixed to the viewport (see header note) */
    #lab-menu {
      position:fixed; z-index:9999;            /* above header canvas + views */
      width:min(300px, calc(100vw - 16px));    /* never wider than the screen */
      padding:8px;
      background:rgba(12,12,20,0.97);
      border:1px solid var(--border); border-radius:14px;
      box-shadow:0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,246,214,0.06);
      backdrop-filter:blur(10px);
      font-family:var(--font-ui);
      opacity:0; transform:translateY(-6px); pointer-events:none;
      transition:opacity 0.16s, transform 0.16s;
    }
    #lab-menu.open { opacity:1; transform:none; pointer-events:auto; }

    /* small heading row */
    #lab-menu .lab-head {
      padding:4px 8px 8px; font-size:0.58rem; letter-spacing:0.16em;
      text-transform:uppercase; color:var(--subtext);
    }

    /* one row per app */
    #lab-menu .lab-item {
      display:flex; align-items:center; gap:10px;
      padding:9px 10px; border-radius:10px;
      color:var(--text); text-decoration:none;
      border:1px solid transparent;
      transition:background 0.15s, border-color 0.15s;
    }
    #lab-menu .lab-item:hover,
    #lab-menu .lab-item:focus-visible {
      background:rgba(0,246,214,0.07); border-color:rgba(0,246,214,0.35); outline:none;
    }
    #lab-menu .lab-icon {
      width:30px; height:30px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      border-radius:8px; border:1px solid var(--border);
      color:var(--teal); font-size:0.95rem;
    }
    #lab-menu .lab-text { flex:1; min-width:0; }
    #lab-menu .lab-name { font-size:0.76rem; letter-spacing:0.06em; }
    #lab-menu .lab-blurb {
      font-size:0.62rem; color:var(--subtext); margin-top:2px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    #lab-menu .lab-tag {
      font-size:0.52rem; letter-spacing:0.1em; text-transform:uppercase;
      padding:2px 6px; border-radius:6px; margin-left:6px; vertical-align:1px;
      color:var(--pink); border:1px solid rgba(255,75,203,0.45);
    }
    #lab-menu .lab-out { color:var(--subtext); font-size:0.7rem; }
  `;
  document.head.appendChild(s);
}

// ── BUILD ONE MENU ROW ─────────────────────────────────────
// Built with DOM calls (not innerHTML) so app names can't inject markup.
function buildItem(app) {
  // The whole row is a link; every app opens in a new tab
  const a = document.createElement('a');
  a.className = 'lab-item';
  a.id = 'lab-item-' + app.id;
  a.href = app.href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('role', 'menuitem');

  // Icon square on the left
  const icon = document.createElement('span');
  icon.className = 'lab-icon';
  icon.textContent = app.icon;

  // Name + optional tag + blurb in the middle
  const text = document.createElement('span');
  text.className = 'lab-text';
  const name = document.createElement('div');
  name.className = 'lab-name';
  name.textContent = app.name;
  if (app.tag) {
    const tag = document.createElement('span');
    tag.className = 'lab-tag';
    tag.textContent = app.tag;
    name.appendChild(tag);
  }
  const blurb = document.createElement('div');
  blurb.className = 'lab-blurb';
  blurb.textContent = app.blurb;
  text.append(name, blurb);

  // "opens in new tab" arrow on the right
  const out = document.createElement('span');
  out.className = 'lab-out';
  out.textContent = '↗';

  a.append(icon, text, out);
  return a;
}

// ── INIT ───────────────────────────────────────────────────
// Runs by itself (see bottom of file). Wires the #lab-launch button in index.html.
export function initLabMenu() {
  const btn = document.getElementById('lab-launch');
  // Button missing (markup changed) or already wired -> do nothing
  if (!btn || btn.dataset.init) return;
  btn.dataset.init = '1';

  injectLabStyles();

  // Create the panel and fill it from LAB_APPS
  const menu = document.createElement('div');
  menu.id = 'lab-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'lab apps');
  const head = document.createElement('div');
  head.className = 'lab-head';
  head.textContent = 'lab · mini apps';
  menu.appendChild(head);
  LAB_APPS.forEach(app => menu.appendChild(buildItem(app)));
  document.body.appendChild(menu);

  // Accessibility wiring on the button
  btn.setAttribute('aria-haspopup', 'menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'lab-menu');

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
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  // Click anywhere outside the panel closes it
  document.addEventListener('click', (e) => {
    if (isOpen() && !menu.contains(e.target)) close();
  });

  // Picking an app closes the menu (the app opens in a new tab)
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.lab-item')) close();
  });

  // Keyboard: Escape closes; arrow keys move between apps
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = [...menu.querySelectorAll('.lab-item')];
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
// initLabMenu() guards itself, so calling it twice is harmless.
initLabMenu();
