// ============================================================
// SPIRALSIDE - BLOOMSTUDIO v1.0
// Game maker tab - iframe-embeds the self-contained BloomStudio
// build served from /bloomstudio/index.html (same origin).
// Lazy: iframe is only created on first tab open, so it adds
// zero cost to app boot. Fully isolated - no style collisions.
// Nimbis anchor: js/app/views/bloomstudio.js
// ============================================================

// remembers whether the iframe already exists (init runs on every tab open)
let _loaded = false;

export function initBloomstudio() {
  // only build the iframe once - later opens are no-ops
  if (_loaded) return;
  // the view container created in index.html
  const view = document.getElementById('view-bloomstudio');
  if (!view) return;
  _loaded = true;

  // inject the tiny bit of CSS this view needs
  // NOTE: never set display on #view-bloomstudio - .view/.view.active own display
  const s = document.createElement('style');
  s.textContent = [
    '#view-bloomstudio { padding: 0; }',                    // edge-to-edge canvas
    '#bloomstudio-frame {',
    '  flex: 1;',                                           // fill the flex column
    '  min-height: 0;',                                     // allow flexbox to size it
    '  width: 100%;',
    '  border: none;',                                      // no iframe chrome
    '  background: #08080d;',                               // match app bg while loading
    '}',
  ].join('\n');
  document.head.appendChild(s);

  // the iframe itself - same-origin static file, so a future
  // postMessage bridge for auth/credits is a clean upgrade
  const f = document.createElement('iframe');
  f.id = 'bloomstudio-frame';
  f.src = '/bloomstudio/index.html';                        // served by Vercel
  f.allow = 'fullscreen';                                   // let the studio go fullscreen
  view.appendChild(f);
}
