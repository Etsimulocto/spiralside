# ============================================================
# SPIRALSIDE — SKY NaN FIX
# Defers initSky() to after first paint so canvas has dimensions
# Also cleans up the grey overlay issue with correct z-index stacking
# Run from ~/spiralside
# ============================================================

import re

# ── FIX sky.js — guard against zero-width canvas ─────────────
with open('js/app/sky.js', 'r', encoding='utf-8') as f:
    sky = f.read()

# Replace the resize function to guard against zero dimensions
OLD_RESIZE = '''function resize() {
  if (!_cvs) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  _cvs.width  = Math.round(rect.width);
  _cvs.height = Math.round(rect.height);
}'''

NEW_RESIZE = '''function resize() {
  if (!_cvs) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  // Guard: if parent has no dimensions yet, use offsetWidth fallback
  const w = Math.round(rect.width)  || _cvs.parentElement.offsetWidth  || 320;
  const h = Math.round(rect.height) || _cvs.parentElement.offsetHeight || 48;
  _cvs.width  = w;
  _cvs.height = h;
}'''

if OLD_RESIZE not in sky:
    print('[sky.js] resize anchor not found — patching initSky instead')
else:
    sky = sky.replace(OLD_RESIZE, NEW_RESIZE, 1)
    print('[sky.js] resize guard added')

# Replace initSky to defer to rAF so layout is complete
OLD_INIT = '''export function initSky() {
  _cvs = document.getElementById('sky-canvas');
  if (!_cvs) {
    console.warn('[sky] #sky-canvas not found — skipping');
    return;
  }
  _cvs.style.opacity = SKY_CONFIG.opacity;
  _ctx = _cvs.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  if (_raf) cancelAnimationFrame(_raf);
  frame();
}'''

NEW_INIT = '''export function initSky() {
  _cvs = document.getElementById('sky-canvas');
  if (!_cvs) {
    console.warn('[sky] #sky-canvas not found — skipping');
    return;
  }
  _cvs.style.opacity = SKY_CONFIG.opacity;
  _ctx = _cvs.getContext('2d');
  window.addEventListener('resize', resize);
  if (_raf) cancelAnimationFrame(_raf);
  // Defer first frame to after layout paint so canvas has real dimensions
  requestAnimationFrame(() => {
    resize();
    frame();
  });
}'''

if OLD_INIT not in sky:
    print('[sky.js] initSky anchor not found — check sky.js manually')
else:
    sky = sky.replace(OLD_INIT, NEW_INIT, 1)
    print('[sky.js] initSky deferred to rAF')

with open('js/app/sky.js', 'w', encoding='utf-8') as f:
    f.write(sky)
print('[sky.js] written')

# ── FIX index.html — make sure screen-app is not greyed out ──
# The grey overlay is likely the sky canvas z-index escaping.
# Ensure #screen-app has no unintended positioning context issues.
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Verify sky CSS is correct — replace the whole block cleanly
old_block = re.search(r'/\* ── LIVING SKY ── \*/.*?#app-header > \*:not\(#sky-canvas\) \{ position: relative; z-index: 1; \}', html, re.DOTALL)
CLEAN_CSS = """/* ── LIVING SKY ── */
    #sky-canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
      display: block;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }"""

if old_block:
    html = html[:old_block.start()] + CLEAN_CSS + html[old_block.end():]
    print('[html] sky CSS block replaced cleanly')
else:
    print('[html] sky CSS block not found — no change to html')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[html] index.html written')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: sky NaN guard + rAF defer" && git push --force origin main')
