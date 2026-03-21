# ============================================================
# SPIRALSIDE — SKY MODULE PATCH v2
# Creates js/app/sky.js and patches index.html
# Run from ~/spiralside in Git Bash
# Nimbis anchor: patch_sky.py
# ============================================================

import os, sys, re

ROOT = os.getcwd()
print(f'[root] {ROOT}')

# ── STEP 1: WRITE js/app/sky.js ──────────────────────────────────────────────

SKY_JS = r"""// ============================================================
// SPIRALSIDE — LIVING SKY v1.0
// Animated gradient canvas behind the header
// Slow drift through Bloomcore night sky color states
// Nimbis anchor: js/app/sky.js
// ============================================================

// ── CONFIG — tweak these freely ──────────────────────────────
const SKY_CONFIG = {
  speed:   0.0015,   // cycle speed — lower = slower drift
  opacity: 0.30,     // canvas opacity over header bg
  // Each state is [left-color, mid-color, right-color]
  states: [
    ['#1a0a2e', '#0d1a3d', '#101014'],   // deep night purple-blue
    ['#0d2a4a', '#1a3a6e', '#0a1520'],   // pre-dawn deep blue
    ['#2a0a3e', '#7c2a8a', '#1a0a2e'],   // dusk violet
    ['#002a2a', '#004a3a', '#101014'],   // teal drift
    ['#1a0a0a', '#3a1a3a', '#0a0a1e'],   // warm magenta night
    ['#0a1a2a', '#1a2a4a', '#0a0a14'],   // cool midnight
  ],
};

// ── STATE ─────────────────────────────────────────────────────
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

// Smooth cubic ease in-out so state transitions feel organic
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
    console.warn('[sky] #sky-canvas not found in DOM');
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
print(f'[1/3] wrote {sky_path}')


# ── STEP 2: PATCH index.html ─────────────────────────────────────────────────

html_path = os.path.join(ROOT, 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Debug: show what the header line actually looks like
header_match = re.search(r'<header[^>]*>', html)
if header_match:
    print(f'[debug] found header tag: {repr(header_match.group())}')
else:
    print('[debug] NO <header> tag found — dumping first 3000 chars:')
    print(repr(html[:3000]))
    sys.exit(1)

# ── 2a: inject <canvas> into <header> ────────────────────────
CANVAS_TAG = '\n  <canvas id="sky-canvas"></canvas>'

if 'id="sky-canvas"' in html:
    print('[2a] sky-canvas already present — skipping')
else:
    old_tag = header_match.group()
    new_tag = old_tag + CANVAS_TAG
    html = html.replace(old_tag, new_tag, 1)
    print('[2a] injected #sky-canvas into <header>')

# ── 2b: inject CSS ────────────────────────────────────────────
SKY_CSS = """
    /* ── LIVING SKY ── */
    header { position:relative; overflow:hidden; }
    #sky-canvas {
      position:absolute; inset:0;
      width:100%; height:100%;
      z-index:0; pointer-events:none;
    }
    header > *:not(#sky-canvas) { position:relative; z-index:1; }
"""

style_close = '</style>'
if 'pointer-events:none;' in html:
    print('[2b] sky CSS already present — skipping')
elif style_close in html:
    html = html.replace(style_close, SKY_CSS + style_close, 1)
    print('[2b] injected sky CSS')
else:
    print('[2b] ERROR: no </style> found')
    sys.exit(1)

# ── 2c: import + initSky() call ──────────────────────────────
module_match = re.search(r'(import \{ init \} from ["\']\.\/js\/comic\/viewer\.js["\'];)', html)
if 'initSky' in html:
    print('[2c-import] already present — skipping')
elif module_match:
    old = module_match.group(1)
    new = old + '\n    import { initSky } from "./js/app/sky.js";'
    html = html.replace(old, new, 1)
    print('[2c-import] injected sky import')
else:
    mod_script = re.search(r'(<script type=["\']module["\'][^>]*>)(.*?)(</script>)', html, re.DOTALL)
    if mod_script:
        inner = mod_script.group(2)
        new_inner = inner.rstrip() + '\n    import { initSky } from "./js/app/sky.js";\n'
        html = html.replace(mod_script.group(0), mod_script.group(1) + new_inner + mod_script.group(3), 1)
        print('[2c-import] injected sky import via fallback')
    else:
        print('[2c-import] WARNING: could not find module script — add import manually')

OLD_SHOW = "document.getElementById('app').classList.add('visible');"
if 'initSky()' in html:
    print('[2c-call] initSky() already present — skipping')
elif OLD_SHOW in html:
    html = html.replace(OLD_SHOW, OLD_SHOW + "\n  initSky();", 1)
    print('[2c-call] injected initSky() in showApp()')
else:
    print('[2c-call] WARNING: could not find showApp anchor — add initSky() manually')

# ── WRITE ─────────────────────────────────────────────────────
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'[3/3] wrote {html_path}')

print()
print('=== PATCH COMPLETE ===')
print('Next:')
print('  git add . && git commit -m "feat: living sky header module" && git push --force origin main')
