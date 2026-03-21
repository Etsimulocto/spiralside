import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── FIX 1: particles canvas z-index — push behind everything ──
old_p = """#particles-canvas {
      position: fixed; inset: 0; z-index: -1;
      pointer-events: none;
      opacity: 0;
      transition: opacity 1s ease;
    }"""
new_p = """#particles-canvas {
      position: fixed; inset: 0; z-index: -2;
      pointer-events: none;
      opacity: 0;
      transition: opacity 1s ease;
    }"""
if old_p in html:
    html = html.replace(old_p, new_p, 1)
    print('[1] particles z-index → -2')
else:
    # try flexible match
    html = re.sub(
        r'(#particles-canvas \{[^}]*z-index\s*:\s*)-1',
        r'\g<1>-2',
        html
    )
    print('[1] particles z-index patched via regex')

# ── FIX 2: wire recolorSketch into previewColor ───────────────
# Find previewColor function and add recolorSketch call
# previewColor(key, val) — we need to know the slot index per key
old_preview = """function previewColor(key, val) {"""
new_preview = """const COLOR_SLOT_MAP = {
  bg:0, surface:1, surface2:1, border:2, teal:3, accent:3,
  pink:4, accent2:4, purple:3, text:5, subtext:6,
  userbubble:7, botbubble:8
};
function previewColor(key, val) {
  // Redraw the sketch for this slot with the new color
  const slotIdx = COLOR_SLOT_MAP[key];
  if (slotIdx !== undefined && window.recolorSketch) {
    window.recolorSketch(slotIdx, val);
  }"""

if 'COLOR_SLOT_MAP' in html:
    print('[2] previewColor already patched — skipping')
elif old_preview in html:
    html = html.replace(old_preview, new_preview, 1)
    print('[2] previewColor patched with recolorSketch call')
else:
    print('[2] WARNING: previewColor not found — searching...')
    idx = html.find('previewColor')
    print(repr(html[max(0,idx-20):idx+200]))

# ── FIX 3: expose recolorSketch on window via main.js ─────────
with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

if 'recolorSketch' in main:
    print('[3] recolorSketch already in main.js')
else:
    main = main.replace(
        "import { initColorSketches } from './colorSketches.js';",
        "import { initColorSketches, recolorSketch } from './colorSketches.js';",
        1
    )
    main = main.replace(
        'window.initColorSketches = initColorSketches;',
        'window.initColorSketches = initColorSketches;\nwindow.recolorSketch = recolorSketch;',
        1
    )
    with open('js/app/main.js', 'w', encoding='utf-8') as f:
        f.write(main)
    print('[3] recolorSketch exposed on window')

# ── FIX 4: sky — make states more dramatic so colors are obvious
with open('js/app/sky.js', 'r', encoding='utf-8') as f:
    sky = f.read()

# Replace states to be more vivid — pure accent over bg, no mixing
old_states = """  return [
    [bg,   teal, bg  ],   // teal sweep
    [bg,   purp, bg  ],   // purple sweep
    [teal, bg,   purp],   // teal → purple cross
    [bg,   pink, bg  ],   // pink sweep
    [purp, bg,   blue],   // purple → blue cross
    [bg,   blue, bg  ],   // blue sweep
  ];"""
new_states = """  return [
    [bg,   teal, bg  ],   // teal center
    [purp, bg,   purp],   // purple wings
    [bg,   pink, bg  ],   // pink center
    [teal, bg,   blue],   // teal→blue sweep
    [bg,   purp, teal],   // purp→teal
    [pink, bg,   purp],   // pink→purple
  ];"""

if old_states in sky:
    sky = sky.replace(old_states, new_states, 1)
    print('[4] sky states updated to more vivid sweeps')
else:
    print('[4] sky states anchor not found — skipping')

with open('js/app/sky.js', 'w', encoding='utf-8') as f:
    f.write(sky)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[done] index.html written')

print()
print('=== DONE ===')
print('git add . && git commit -m "fix: particles z-index, sketch redraw on pick, vivid sky states" && git push --force origin main')
