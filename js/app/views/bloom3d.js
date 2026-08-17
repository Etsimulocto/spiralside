// ============================================================
// SPIRALSIDE - BLOOM3D v1.0
// 3D engine tab - iframe-embeds the self-contained BLOOM3D
// build served from /bloom3d/index.html (same origin).
// Same-origin matters: the engine keeps its entire save layer
// in localStorage, and a cross-origin frame would get that
// partitioned by tracking prevention with no error.
// Lazy: iframe is built on first tab open, zero cost at boot.
// Nimbis anchor: js/app/views/bloom3d.js
// ============================================================

// remembers whether the iframe already exists (init runs every open)
let _loaded = false;

export function initBloom3D() {
  // only build once - later opens are no-ops
  if (_loaded) return;

  // the view container created in index.html
  const view = document.getElementById('view-bloom3d');
  if (!view) return;
  _loaded = true;

  // NOTE: never set display on #view-bloom3d.
  // The .view / .view.active system owns display.
  const s = document.createElement('style');
  s.textContent = [
    '#view-bloom3d { padding: 0; }',        // edge-to-edge viewport
    '#bloom3d-frame {',
    '  flex: 1;',                           // fill the flex column
    '  min-height: 0;',                     // let flexbox size it
    '  width: 100%;',
    '  border: none;',                      // no iframe chrome
    '  background: #08080d;',               // match app bg while loading
    '}',
  ].join('\n');
  document.head.appendChild(s);

  // the iframe. allow=fullscreen is required: the engine calls
  // requestFullscreen from a HUD button and a viewport control,
  // and without this it silently does nothing.
  const f = document.createElement('iframe');
  f.id = 'bloom3d-frame';
  f.src = '/bloom3d/index.html';
  f.allow = 'fullscreen';
  view.appendChild(f);
}
