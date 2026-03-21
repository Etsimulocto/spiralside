import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1: Remove the scroll-track wrapper, restore flat structure ─
OLD = '''    <div class="header-scroll-track">
      <div class="header-logo-row">
        <div class="app-logo">spiralside</div>
      </div>
      <div class="header-controls-row">
        <div class="version-badge" id="version-badge">'''

# find the actual version
m = re.search(r'id="version-badge">(v[\d.]+)<', html)
ver = m.group(1) if m else 'v0.8.328'

OLD_BLOCK = re.search(
    r'<div class="header-scroll-track">.*?</div>\s*</div>\s*\n\s*</div>(?=\s*\n\s*</div>\s*\n\s*<!-- TAB BAR)',
    html, re.DOTALL
)

NEW_CONTENT = f'''    <div class="header-logo-row">
        <div class="app-logo hdr-float" id="hdr-logo">spiralside</div>
      </div>
      <div class="header-controls-row">
        <div class="version-badge hdr-float" id="hdr-version">{ver}</div>
        <div class="header-right">
          <div class="credits-badge hdr-float" id="hdr-credits" onclick="switchView('store')">∞ free</div>
        </div>
      </div>'''

if OLD_BLOCK:
    html = html[:OLD_BLOCK.start()] + NEW_CONTENT + html[OLD_BLOCK.end():]
    print('[1] unwrapped scroll-track, added hdr-float classes')
else:
    print('[1] WARNING: scroll-track not found — may already be unwrapped')
    # just add hdr-float classes to existing elements
    html = html.replace('<div class="app-logo">', '<div class="app-logo hdr-float" id="hdr-logo">', 1)
    html = html.replace('<div class="version-badge" id="version-badge">', '<div class="version-badge hdr-float" id="hdr-version">', 1)
    html = html.replace('<div class="credits-badge" id="credits-badge"', '<div class="credits-badge hdr-float" id="hdr-credits"', 1)
    print('[1] added hdr-float classes to existing elements')

# ── 2: Remove old scroll CSS ───────────────────────────────────
html = re.sub(r'\s*/\* ── HEADER SCROLL TRACK ── \*/.*?\.header-scroll-track:hover \{[^}]*\}', '', html, flags=re.DOTALL)
html = html.replace('animation: headerDrift 60s ease-in-out infinite;', '')
print('[2] removed old scroll CSS')

# ── 3: Add new float CSS + JS ─────────────────────────────────
FLOAT_CSS = """
    /* ── HEADER FLOATERS ── */
    .header-logo-row, .header-controls-row {
      position: absolute; inset: 0;
      display: flex; align-items: center;
      pointer-events: none;
    }
    .header-logo-row { justify-content: center; }
    .header-controls-row { justify-content: flex-end; padding-right: 14px; gap: 8px; }
    .hdr-float { pointer-events: all; position: relative; z-index: 2; }
"""

FLOAT_JS = """
  // ── HEADER FLOATERS ──────────────────────────────────────────
  // Each element drifts independently, loops across the header
  (function() {
    const floaters = [
      { id: 'hdr-logo',    speed: 0.18,  dir: 1  },
      { id: 'hdr-version', speed: 0.09,  dir: -1 },
      { id: 'hdr-credits', speed: 0.13,  dir: 1  },
    ];
    let headerW = 0;
    let mouseX = null;
    let states = [];

    function init() {
      const header = document.getElementById('app-header');
      if (!header) return;
      headerW = header.offsetWidth;

      states = floaters.map((f, i) => {
        const el = document.getElementById(f.id);
        if (!el) return null;
        // stagger starting positions
        const startX = (headerW / floaters.length) * i + headerW * 0.1;
        return { el, speed: f.speed, dir: f.dir, x: startX, w: 0 };
      }).filter(Boolean);

      // measure widths after render
      requestAnimationFrame(() => {
        states.forEach(s => { s.w = s.el.offsetWidth + 20; });
        tick();
      });

      // touch/mouse push
      header.addEventListener('mousemove', e => { mouseX = e.clientX; });
      header.addEventListener('touchmove', e => {
        mouseX = e.touches[0].clientX;
        e.preventDefault();
      }, { passive: false });
      header.addEventListener('mouseleave', () => { mouseX = null; });

      window.addEventListener('resize', () => { headerW = header.offsetWidth; });
    }

    function tick() {
      states.forEach(s => {
        // drift
        s.x += s.speed * s.dir;

        // mouse repulsion — nudge away from cursor
        if (mouseX !== null) {
          const cx = s.x + s.w / 2;
          const dx = cx - mouseX;
          if (Math.abs(dx) < 80) {
            s.x += dx > 0 ? 1.5 : -1.5;
          }
        }

        // wrap around
        if (s.dir > 0 && s.x > headerW + 20) s.x = -s.w;
        if (s.dir < 0 && s.x < -s.w - 20) s.x = headerW + 20;

        s.el.style.transform = `translateX(${Math.round(s.x)}px)`;
        s.el.style.position  = 'absolute';
        s.el.style.left      = '0';
        s.el.style.top       = '50%';
        s.el.style.transform = `translateX(${Math.round(s.x)}px) translateY(-50%)`;
        s.el.style.whiteSpace = 'nowrap';
      });
      requestAnimationFrame(tick);
    }

    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 600));
  })();
"""

if '/* ── HEADER FLOATERS' in html:
    print('[3] float CSS already present')
else:
    html = html.replace('</style>', FLOAT_CSS + '  </style>', 1)
    print('[3] float CSS injected')

if 'HEADER FLOATERS' in html and 'function tick()' in html:
    print('[3b] float JS already present')
else:
    html = html.replace('</body>', FLOAT_JS + '\n</body>', 1)
    print('[3b] float JS injected')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[done] written')
print()
print('git add index.html && git commit -m "feat: header floaters — independent drift + touch repulsion" && git push --force origin main')
