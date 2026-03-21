# ============================================================
# SPIRALSIDE — COLOR ROW SKETCHES PATCH
# Adds tiny canvas doodles between label and swatch in each color row
# Sketches: stars, horizon, clouds, constellation, rain, wave
# Seeded per slot so each row always gets the same art
# Run from ~/spiralside
# ============================================================

import re, sys

# ── STEP 1: Write js/app/colorSketches.js ────────────────────

SKETCH_JS = r"""// ============================================================
// SPIRALSIDE — COLOR SKETCHES v1.0
// Tiny seeded canvas doodles for each color row in Style tab
// Each slot gets a deterministic random sketch type
// Nimbis anchor: js/app/colorSketches.js
// ============================================================

// Seeded RNG so each slot always draws the same thing
function rng(seed) {
  let s = seed + 1;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Sketch types — one per slot, assigned by index
const SKETCHES = ['stars', 'horizon', 'clouds', 'constellation', 'rain', 'wave', 'dots', 'aurora'];

// Draw a sketch onto a canvas element
function drawSketch(canvas, type, color, seed) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const r = rng(seed);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = 0.55;

  if (type === 'stars') {
    // Scattered stars — some larger
    for (let i = 0; i < 18; i++) {
      const x  = r() * w;
      const y  = r() * h;
      const sz = r() * 1.8 + 0.4;
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    // 2 cross-star shapes
    for (let i = 0; i < 2; i++) {
      const x = r() * w * 0.8 + w * 0.1;
      const y = r() * h * 0.6 + h * 0.2;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x-4,y); ctx.lineTo(x+4,y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x,y-4); ctx.lineTo(x,y+4); ctx.stroke();
    }
  }

  else if (type === 'horizon') {
    // Layered horizon lines with slight wobble
    for (let i = 0; i < 4; i++) {
      const y = h * 0.3 + i * (h * 0.14);
      ctx.globalAlpha = 0.55 - i * 0.1;
      ctx.lineWidth = i === 0 ? 1.2 : 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y + (r()-0.5)*3);
      for (let x = 0; x <= w; x += 8) {
        ctx.lineTo(x, y + (r()-0.5)*4);
      }
      ctx.stroke();
    }
    // Small sun circle
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(w * (0.2 + r()*0.6), h * 0.25, 5 + r()*3, 0, Math.PI*2);
    ctx.stroke();
  }

  else if (type === 'clouds') {
    // Puffy cloud scribbles
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    for (let c = 0; c < 3; c++) {
      const cx = r() * w * 0.7 + w * 0.1;
      const cy = r() * h * 0.5 + h * 0.15;
      const scale = 0.6 + r() * 0.8;
      ctx.globalAlpha = 0.4 + r() * 0.2;
      ctx.beginPath();
      ctx.arc(cx,           cy,          8*scale, Math.PI, 0);
      ctx.arc(cx + 8*scale, cy - 4*scale, 6*scale, Math.PI, 0);
      ctx.arc(cx + 16*scale,cy,           7*scale, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
    }
  }

  else if (type === 'constellation') {
    // Dots connected by lines
    const pts = [];
    for (let i = 0; i < 7; i++) {
      pts.push([w*0.1 + r()*w*0.8, h*0.1 + r()*h*0.8]);
    }
    // Draw lines between nearby points
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i][0]-pts[i+1][0], dy = pts[i][1]-pts[i+1][1];
      if (Math.sqrt(dx*dx+dy*dy) < w*0.55) {
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[i+1][0], pts[i+1][1]);
        ctx.stroke();
      }
    }
    // Dots on top
    ctx.globalAlpha = 0.7;
    pts.forEach(([x,y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + r(), 0, Math.PI*2);
      ctx.fill();
    });
  }

  else if (type === 'rain') {
    // Diagonal rain streaks
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 22; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = 5 + r() * 8;
      ctx.globalAlpha = 0.3 + r() * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len*0.3, y + len);
      ctx.stroke();
    }
  }

  else if (type === 'wave') {
    // Sine waves stacked
    ctx.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
      const y0   = h * 0.25 + row * h * 0.22;
      const amp  = 3 + r() * 4;
      const freq = 0.06 + r() * 0.05;
      const phase = r() * Math.PI * 2;
      ctx.globalAlpha = 0.5 - row * 0.1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = y0 + Math.sin(x * freq + phase) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  else if (type === 'dots') {
    // Grid of dots with size variation
    ctx.globalAlpha = 0.5;
    const cols = 9, rows = 4;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = (col + 0.5) * (w / cols);
        const y = (row + 0.5) * (h / rows);
        const sz = 0.8 + r() * 2;
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  else if (type === 'aurora') {
    // Flowing vertical lines like aurora borealis
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const x0 = w * (i / 5.5);
      ctx.globalAlpha = 0.2 + r() * 0.3;
      ctx.beginPath();
      ctx.moveTo(x0, h);
      for (let y = h; y >= 0; y -= 4) {
        const xOff = Math.sin(y * 0.08 + r()*2) * 6;
        ctx.lineTo(x0 + xOff, y);
      }
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

// ── PUBLIC: INIT ──────────────────────────────────────────────
// Call after the style view is rendered
// Finds all .color-sketch-canvas elements and draws into them
export function initColorSketches() {
  const canvases = document.querySelectorAll('.color-sketch-canvas');
  canvases.forEach((cvs, i) => {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue('--subtext').trim() || '#6060A0';
    const type = SKETCHES[i % SKETCHES.length];
    drawSketch(cvs, type, color, i * 137 + 42);
  });
}

// Redraw with a given color (call on swatch change preview)
export function recolorSketch(index, color) {
  const canvases = document.querySelectorAll('.color-sketch-canvas');
  const cvs = canvases[index];
  if (!cvs) return;
  const type = SKETCHES[index % SKETCHES.length];
  drawSketch(cvs, type, color, index * 137 + 42);
}
"""

with open('js/app/colorSketches.js', 'w', encoding='utf-8') as f:
    f.write(SKETCH_JS)
print('[1] wrote js/app/colorSketches.js')


# ── STEP 2: Patch index.html ──────────────────────────────────
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 2a: Add CSS for sketch canvas (insert before </style>)
SKETCH_CSS = """
    /* ── COLOR ROW SKETCHES ── */
    .color-sketch-canvas {
      flex: 1;
      height: 32px;
      display: block;
      opacity: 0.7;
    }
"""

if 'color-sketch-canvas' in html:
    print('[2a] sketch CSS already present — skipping')
else:
    html = html.replace('</style>', SKETCH_CSS + '  </style>', 1)
    print('[2a] sketch CSS injected')

# 2b: Add canvas element inside each .color-row
# Find all color-row HTML instances — they look like:
# <div class="color-row">
#   <span class="color-label">background</span>
#   <div class="color-swatch" ...>
# We insert <canvas class="color-sketch-canvas" width="120" height="32"></canvas>
# between the label and the swatch

CANVAS_EL = '<canvas class="color-sketch-canvas" width="120" height="32"></canvas>\n'

# Find each color-row and inject canvas after the color-label span/div
# Pattern: after </span> or closing tag of color-label, before color-swatch
old_count = html.count('color-sketch-canvas')

# Replace each color-label closing tag followed by swatch
# color-label ends with </span> or </div>, then whitespace, then color-swatch
pattern = re.compile(
    r'(class="color-label"[^<]*</(?:span|div|label)>)(\s*)(.*?class="color-swatch")',
    re.DOTALL
)

if old_count > 0:
    print('[2b] sketch canvases already injected — skipping')
else:
    new_html, n_subs = pattern.subn(
        lambda m: m.group(1) + m.group(2) + CANVAS_EL + m.group(3),
        html
    )
    if n_subs == 0:
        # Try alternate: inject after color-label text node closes
        pattern2 = re.compile(r'(class="color-label">)(.*?)(</(?:span|div|label)>)(\s*)', re.DOTALL)
        new_html2 = html
        count2 = 0
        # simpler: find each .color-swatch and insert canvas before it
        new_html = re.sub(
            r'(\s*)(<div class="color-swatch")',
            r'\1' + CANVAS_EL + r'\2',
            html
        )
        n_subs = new_html.count('color-sketch-canvas')
        print(f'[2b] fallback injection: {n_subs} canvases added')
    else:
        print(f'[2b] injected {n_subs} sketch canvases')
    html = new_html

# 2c: Add import + initColorSketches() call
# Add to the module script block
if 'colorSketches' in html:
    print('[2c] sketch import already present')
else:
    old_imp = "import { init } from \"./js/comic/viewer.js\";"
    if old_imp not in html:
        old_imp = "import { init } from './js/comic/viewer.js';"
    if old_imp in html:
        html = html.replace(old_imp,
            old_imp + "\n    import { initColorSketches } from \"./js/app/colorSketches.js\";",
            1)
        print('[2c] import added to module script')
    else:
        print('[2c] WARNING: could not find module import anchor — add manually:')
        print("  import { initColorSketches } from './js/app/colorSketches.js';")

# 2d: expose initColorSketches on window so style view can call it
# Add after the import line
if 'window.initColorSketches' in html:
    print('[2d] window exposure already present')
else:
    html = html.replace(
        'import { initColorSketches } from "./js/app/colorSketches.js";',
        'import { initColorSketches } from "./js/app/colorSketches.js";\n    window.initColorSketches = initColorSketches;',
        1
    )
    print('[2d] exposed on window')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[2] index.html written')


# ── STEP 3: Wire initColorSketches into the style view ────────
# Find the style view JS file and add call after it renders
style_view = None
for dirpath, dirs, files in os.walk('js'):
    for fn in files:
        if 'style' in fn.lower() and fn.endswith('.js'):
            fp = os.path.join(dirpath, fn)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                src = f.read()
            if 'color' in src.lower():
                style_view = fp
                print(f'[3] found style view: {fp}')
                break

if style_view:
    with open(style_view, 'r', encoding='utf-8') as f:
        sv = f.read()
    if 'initColorSketches' not in sv:
        # Find where the view finishes rendering (after innerHTML assignment)
        # Add initColorSketches call after the last innerHTML or render call
        anchor = sv.rfind('innerHTML')
        if anchor != -1:
            eol = sv.find('\n', anchor)
            sv = sv[:eol] + '\n  if (window.initColorSketches) window.initColorSketches();' + sv[eol:]
            with open(style_view, 'w', encoding='utf-8') as f:
                f.write(sv)
            print('[3] wired initColorSketches into style view')
        else:
            print('[3] WARNING: no innerHTML found in style view — add manually:')
            print('  if (window.initColorSketches) window.initColorSketches();')
    else:
        print('[3] already wired')
else:
    print('[3] no style view JS file found — style view may be inline in index.html')
    print('[3] add this after the style section renders:')
    print('  initColorSketches()')

print()
print('=== DONE ===')
print('git add . && git commit -m "feat: color row sketches in style tab" && git push --force origin main')
