# ============================================================
# SPIRALSIDE — SKY MODULE PATCH v3 (final)
# Targets <div id="app-header"> in index.html
# Run from ~/spiralside in Git Bash
# Nimbis anchor: patch_sky.py
# ============================================================

import os, sys

ROOT = os.getcwd()
print(f'[root] {ROOT}')

# ── STEP 1: WRITE js/app/sky.js ──────────────────────────────

SKY_JS = r"""// ============================================================
// SPIRALSIDE — LIVING SKY v1.0
// Animated gradient canvas behind the header
// Slow drift through Bloomcore night sky color states
// Nimbis anchor: js/app/sky.js
// ============================================================

// ── CONFIG — tweak these freely ──────────────────────────────
const SKY_CONFIG = {
  speed:   0.0015,   // cycle speed — lower = slower drift
  opacity: 0.30,     // canvas opacity layered over header bg
  // Each state: [left-color, mid-color, right-color]
  states: [
    ['#1a0a2e', '#0d1a3d', '#101014'],   // deep night purple-blue
    ['#0d2a4a', '#1a3a6e', '#0a1520'],   // pre-dawn deep blue
    ['#2a0a3e', '#7c2a8a', '#1a0a2e'],   // dusk violet
    ['#002a2a', '#004a3a', '#101014'],   // teal drift
    ['#1a0a0a', '#3a1a3a', '#0a0a1e'],   // warm magenta night
    ['#0a1a2a', '#1a2a4a', '#0a0a14'],   // cool midnight
  ],
};

// ── INTERNAL STATE ────────────────────────────────────────────
let _t   = 0;
let _raf = null;
let _cvs = null;
let _ctx = null;

// ── HELPERS ───────────────────────────────────────────────────
function lerp(a, b, f) { return a + (b - a) * f; }

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpColor(c1, c2, f) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return `rgb(${Math.round(lerp(a[0],b[0],f))},${Math.round(lerp(a[1],b[1],f))},${Math.round(lerp(a[2],b[2],f))})`;
}

// Smooth cubic ease so state transitions feel organic, not linear
function smoothstep(f) {
  return f < 0.5 ? 4*f*f*f : 1 - Math.pow(-2*f + 2, 3) / 2;
}

// ── RESIZE ────────────────────────────────────────────────────
function resize() {
  if (!_cvs) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  _cvs.width  = Math.round(rect.width);
  _cvs.height = Math.round(rect.height);
}

// ── DRAW FRAME ────────────────────────────────────────────────
function frame() {
  if (!_cvs || !_ctx) return;

  const states = SKY_CONFIG.states;
  const n      = states.length;
  const pos    = _t % n;
  const idx    = Math.floor(pos);
  const frac   = pos - idx;
  const sm     = smoothstep(frac);

  const sA = states[idx % n];
  const sB = states[(idx + 1) % n];

  const w = _cvs.width, h = _cvs.height;

  const grad = _ctx.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i <= 4; i++) {
    const p  = i / 4;
    const si = Math.min(Math.floor(p * 2), 1);
    const sf = p * 2 - si;
    const cA = lerpColor(sA[si], sA[Math.min(si + 1, 2)], sf);
    const cB = lerpColor(sB[si], sB[Math.min(si + 1, 2)], sf);
    grad.addColorStop(p, lerpColor(cA, cB, sm));
  }

  _ctx.clearRect(0, 0, w, h);
  _ctx.fillStyle = grad;
  _ctx.fillRect(0, 0, w, h);

  _t += SKY_CONFIG.speed;
  _raf = requestAnimationFrame(frame);
}

// ── PUBLIC: INIT ──────────────────────────────────────────────
export function initSky() {
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
}

// ── PUBLIC: STOP ─────────────────────────────────────────────
export function stopSky() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}
"""

sky_path = os.path.join(ROOT, 'js', 'app', 'sky.js')
os.makedirs(os.path.dirname(sky_path), exist_ok=True)
with open(sky_path, 'w', encoding='utf-8') as f:
    f.write(SKY_JS)
print(f'[1] wrote {sky_path}')


# ── STEP 2: PATCH index.html ──────────────────────────────────

html_path = os.path.join(ROOT, 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 2a — canvas as first child of #app-header
OLD_HEADER_DIV = '<div id="app-header">'
NEW_HEADER_DIV = '<div id="app-header">\n    <canvas id="sky-canvas"></canvas>'

if 'id="sky-canvas"' in html:
    print('[2a] #sky-canvas already present — skipping')
elif OLD_HEADER_DIV not in html:
    print(f'[2a] ERROR: could not find {repr(OLD_HEADER_DIV)}')
    sys.exit(1)
else:
    html = html.replace(OLD_HEADER_DIV, NEW_HEADER_DIV, 1)
    print('[2a] injected #sky-canvas into #app-header')

# 2b — CSS rules for the canvas
# #app-header already has position:relative; overflow:hidden in the live CSS
SKY_CSS = """
    /* ── LIVING SKY ── */
    #sky-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
    }
    #app-header > *:not(#sky-canvas) { position: relative; z-index: 1; }
"""

if 'pointer-events: none' in html:
    print('[2b] sky CSS already present — skipping')
elif '</style>' in html:
    html = html.replace('</style>', SKY_CSS + '  </style>', 1)
    print('[2b] injected sky CSS')
else:
    print('[2b] ERROR: no </style> found')
    sys.exit(1)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'[2] wrote index.html')


# ── STEP 3: WIRE INTO main.js ─────────────────────────────────

main_path = os.path.join(ROOT, 'js', 'app', 'main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main = f.read()

# 3a — import
SKY_IMPORT = "import { initSky } from './sky.js';\n"

if 'initSky' in main:
    print('[3a] sky import already in main.js — skipping')
else:
    first_import = main.find('import ')
    if first_import == -1:
        main = SKY_IMPORT + main
    else:
        eol = main.find('\n', first_import)
        main = main[:eol+1] + SKY_IMPORT + main[eol+1:]
    print('[3a] injected sky import into main.js')

# 3b — call initSky() — try anchors in preference order
SKY_CALL = '\n  initSky(); // living sky'

if 'initSky()' in main:
    print('[3b] initSky() call already present — skipping')
else:
    anchors = [
        "classList.add('visible')",
        'classList.remove("hidden")',
        "classList.remove('hidden')",
        "style.display = 'flex'",
        "style.display='flex'",
        'showApp(',
    ]
    injected = False
    for anchor in anchors:
        idx = main.find(anchor)
        if idx != -1:
            eol = main.find('\n', idx)
            if eol == -1: eol = len(main)
            main = main[:eol] + SKY_CALL + main[eol:]
            print(f'[3b] initSky() injected after: {repr(anchor)}')
            injected = True
            break
    if not injected:
        main += '\ninitSky(); // living sky\n'
        print('[3b] WARNING: appended initSky() at end of main.js — may need manual placement')

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main)
print(f'[3] wrote main.js')

print()
print('=== PATCH COMPLETE ===')
print('Run:')
print('  git add . && git commit -m "feat: living sky header module" && git push --force origin main')
