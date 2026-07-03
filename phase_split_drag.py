# phase_split_drag.py
# ============================================================
# SPIRALSIDE - DRAGGABLE SPLIT DIVIDER
# ============================================================
# Adds a grab bar between the two split panels:
#   - drag left/right to resize (clamped 20% - 80%)
#   - panels autoscale (they are flex - B fills whatever A leaves)
#   - pointer capture keeps the drag alive even over iframes
#     (game maker) - the classic split-pane bug, pre-solved
#   - ratio persists in localStorage (ss_split_ratio)
#   - double-click the bar to reset to 50/50
#   - fires a window resize on release so canvases/views recalc
# Run from ~/spiralside:   python phase_split_drag.py

import sys

PATH = "index.html"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard ------------------------------------------------------------
if "split-divider" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)

# ----------------------------------------------------------------------
# PATCH 1: divider CSS, right after the .split-panel rule
# ----------------------------------------------------------------------
CSS_ANCHOR = "    .split-panel { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }"
CSS_NEW = CSS_ANCHOR + """
    /* draggable divider between the split panels */
    #split-divider {
      width: 6px; flex-shrink: 0; cursor: col-resize;
      background: var(--border); touch-action: none;
      transition: background 0.15s;
    }
    #split-divider:hover, #split-divider.dragging { background: var(--teal); }"""

# ----------------------------------------------------------------------
# PATCH 2: insert the divider element + drag logic between the panels
#          (panel-b loses its border-left - the divider separates now)
# ----------------------------------------------------------------------
OLD_PANELS = """  <div id="split-panel-a" class="split-panel"></div>
  <div id="split-panel-b" class="split-panel" style="border-left:1px solid var(--border)"></div>
</div>"""

NEW_PANELS = """  <div id="split-panel-a" class="split-panel"></div>
  <div id="split-divider" title="drag to resize \u00b7 double-click to reset"></div>
  <div id="split-panel-b" class="split-panel"></div>
</div>
<script>
  // -- SPLIT DIVIDER DRAG -------------------------------------
  (function() {
    const bar  = document.getElementById('split-divider');
    const a    = document.getElementById('split-panel-a');
    const root = document.getElementById('split-root');
    if (!bar || !a || !root) return;

    // restore last saved ratio (panel A width as % of the window)
    const saved = parseFloat(localStorage.getItem('ss_split_ratio'));
    if (saved >= 20 && saved <= 80) a.style.flex = '0 0 ' + saved + '%';

    let dragging = false;

    // compute clamped % from a pointer position
    function pct(e) {
      const rect = root.getBoundingClientRect();
      const p = ((e.clientX - rect.left) / rect.width) * 100;
      return Math.max(20, Math.min(80, p));
    }

    bar.addEventListener('pointerdown', e => {
      dragging = true;
      bar.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);   // keeps events on the bar, even over iframes
      e.preventDefault();
    });

    bar.addEventListener('pointermove', e => {
      if (!dragging) return;
      a.style.flex = '0 0 ' + pct(e) + '%'; // A takes the drag, B autofills the rest
    });

    bar.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      bar.classList.remove('dragging');
      try { localStorage.setItem('ss_split_ratio', pct(e).toFixed(1)); } catch(err) {}
      window.dispatchEvent(new Event('resize'));  // let canvases/views recalc
    });

    // double-click: back to 50/50
    bar.addEventListener('dblclick', () => {
      a.style.flex = '1';
      try { localStorage.removeItem('ss_split_ratio'); } catch(err) {}
      window.dispatchEvent(new Event('resize'));
    });
  })();
</script>"""

for name, anchor in (("split-panel CSS", CSS_ANCHOR), ("split panels markup", OLD_PANELS)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected 1")
        idx = src.find(anchor.strip()[:40])
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+280]))
        sys.exit(1)

src = src.replace(CSS_ANCHOR, CSS_NEW)
src = src.replace(OLD_PANELS, NEW_PANELS)

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
print("patched OK - divider refs:", check.count("split-divider"),
      "| drag logic:", "setPointerCapture" in check)
print('Now run: git add . && git commit -m "split: draggable divider with persistent ratio" && git push origin main')
