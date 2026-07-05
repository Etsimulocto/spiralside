# sidebar_collapse_patch.py - BloomStudio-style collapse for desktop sidebar
import sys

# read local file, normalize line endings for matching
src = open('index.html', encoding='utf-8').read().replace('\r\n', '\n')

# idempotency guard
if 'sb-collapse-css' in src:
    print('SKIP: sidebar collapse already applied'); sys.exit(0)

# ---- CSS: injected before </head> ----
CSS = '''<style id="sb-collapse-css">
  /* chevron + label hidden on mobile - sidebar only exists >=900px */
  #sb-toggle, #sb-label { display: none; }

  @media (min-width: 900px) {
    /* collapse = shrink the one token the grid already uses */
    body.sb-collapsed { --sidebar-w: 34px; }

    /* chevron button pinned at top of the rail, BloomStudio style */
    #sb-toggle {
      display: flex; align-items: center; justify-content: center;
      order: -1;                       /* first item in the flex column */
      min-height: 26px;
      margin-bottom: 8px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--subtext);
      font-family: var(--font-ui);
      font-size: 0.8rem;
      cursor: pointer;
    }
    #sb-toggle:hover { color: var(--teal); border-color: var(--teal); }

    /* collapsed: hide nav buttons, tighten padding */
    body.sb-collapsed #tab-bar .tab-btn { display: none; }
    body.sb-collapsed #tab-bar { padding-left: 4px; padding-right: 4px; }

    /* rotated wordmark label, visible only while collapsed */
    body.sb-collapsed #sb-label {
      display: block;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      margin: 12px auto 0;
      color: var(--subtext);
      font-family: var(--font-ui);
      font-size: 0.62rem;
      letter-spacing: 0.3em;
      user-select: none;
    }
  }
</style>
</head>'''

# ---- JS: injected before </body> ----
JS = '''<script id="sb-collapse-js">
  (function () {
    var KEY = 'spiralside.sb.collapsed';        // localStorage persist key
    var bar = document.getElementById('tab-bar');
    if (!bar) return;                           // safety: no sidebar, no-op

    // build chevron button (JS-built - no markup anchor needed)
    var btn = document.createElement('button');
    btn.id = 'sb-toggle';
    btn.title = 'collapse sidebar';
    // build rotated label for collapsed state
    var lbl = document.createElement('div');
    lbl.id = 'sb-label';
    lbl.textContent = 'SPIRALSIDE';
    bar.prepend(lbl);
    bar.prepend(btn);

    // apply a state: toggle class, swap chevron glyph, persist
    function setState(collapsed) {
      document.body.classList.toggle('sb-collapsed', collapsed);
      btn.textContent = collapsed ? '>' : '<';
      try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) {}
    }

    // restore saved state on load (default: expanded)
    var saved = '0';
    try { saved = localStorage.getItem(KEY) || '0'; } catch (e) {}
    setState(saved === '1');

    // click chevron OR the rotated label to toggle
    btn.addEventListener('click', function () {
      setState(!document.body.classList.contains('sb-collapsed'));
    });
    lbl.addEventListener('click', function () { setState(false); });
  })();
</script>
</body>'''

# ---- anchor checks: each must appear exactly once ----
for anchor in ['</head>', '</body>']:
    n = src.count(anchor)
    if n != 1:
        print('FAIL: anchor', anchor, 'count =', n); sys.exit(1)

# apply both insertions
src = src.replace('</head>', CSS, 1)
src = src.replace('</body>', JS, 1)

# write back
open('index.html', 'w', encoding='utf-8').write(src)
print('OK: sidebar collapse patch applied')
