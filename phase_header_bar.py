# phase_header_bar.py
# ============================================================
# SPIRALSIDE - FULL-WIDTH HEADER + UTILITY BUTTONS
# ============================================================
# 1. Header now spans the ENTIRE width (over the sidebar column);
#    the sidebar starts below it. Ticker stays in the content column.
# 2. New #header-utils cluster at the header's left edge holds:
#      [ < tabs ]  - sidebar show/hide (arrow flips, state persists)
#      [ # split ] - split screen toggle, moved out of the tab list
# 3. The old floating toggle button + the split button's tab-bar
#    placement are removed (no more overlap with the first tab).
# Mobile (<900px) untouched.
# Run from ~/spiralside:   python phase_header_bar.py

import sys

PATH = "index.html"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard ------------------------------------------------------------
if "header-utils" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)

# ----------------------------------------------------------------------
# PATCH 1: header spans both grid columns
# ----------------------------------------------------------------------
OLD_AREAS = """        grid-template-areas:
          "sidebar header"
          "sidebar ticker"
          "sidebar main";"""
NEW_AREAS = """        grid-template-areas:
          "header  header"
          "sidebar ticker"
          "sidebar main";"""

# ----------------------------------------------------------------------
# PATCH 2: replace the old collapse CSS with header-utils styles
# ----------------------------------------------------------------------
OLD_CSS = """    /* \u2500\u2500 SIDEBAR COLLAPSE TOGGLE (desktop only) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    @media (min-width: 900px) {
      /* the round toggle button - fixed so it survives collapse */
      #sidebar-toggle {
        position: fixed; top: 12px; left: 10px; z-index: 60;
        width: 30px; height: 30px; border-radius: 50%;
        border: 1px solid var(--border); background: var(--surface2);
        color: var(--subtext); cursor: pointer; font-size: 0.9rem;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      #sidebar-toggle:hover { color: var(--teal); border-color: var(--teal); }
      /* clear space for the toggle above the first tab */
      #tab-bar { padding-top: 52px; }
      /* collapsed state: sidebar column shrinks to nothing */
      #screen-app.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
      #screen-app.sidebar-collapsed #tab-bar { display: none; }
      /* split button: pin to sidebar bottom as a labeled utility row */
      #tab-split { margin-left: 0; margin-top: auto; opacity: 0.7; }
    }
    @media (max-width: 899px) { #sidebar-toggle { display: none; } }"""

NEW_CSS = """    /* \u2500\u2500 HEADER UTILITY BAR (desktop only) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    @media (min-width: 900px) {
      /* button cluster on the header's left edge */
      #header-utils {
        display: flex; gap: 8px; align-items: center;
        margin-right: 12px; position: relative; z-index: 5;
      }
      #header-utils button {
        display: flex; align-items: center; gap: 6px;
        height: 28px; padding: 0 12px; border-radius: 14px;
        border: 1px solid var(--border); background: rgba(15,15,24,0.6);
        color: var(--subtext); cursor: pointer;
        font-family: var(--font-ui); font-size: 0.68rem; letter-spacing: 0.08em;
        transition: all 0.2s;
      }
      #header-utils button:hover { color: var(--teal); border-color: var(--teal); }
      /* neutralize the split button's old tab-bar positioning */
      #header-utils #tab-split { margin-left: 0; opacity: 1; }
      /* collapsed state: sidebar column shrinks to nothing */
      #screen-app.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
      #screen-app.sidebar-collapsed #tab-bar { display: none; }
    }
    @media (max-width: 899px) { #header-utils { display: none; } }"""

# ----------------------------------------------------------------------
# PATCH 3: replace old floating button + script with script-only block
#          (restore now waits for DOMContentLoaded - the button lives in
#           the header, which is parsed AFTER this script)
# ----------------------------------------------------------------------
OLD_BTN_BLOCK = """  <!-- sidebar collapse toggle - desktop only, position:fixed so it
       stays reachable when the sidebar is hidden -->
  <button id="sidebar-toggle" title="hide sidebar" onclick="window._toggleSidebar()">\u2039</button>
  <script>
    // toggle the sidebar, remember the choice, flip the arrow + tooltip
    window._toggleSidebar = function() {
      const app = document.getElementById('screen-app');
      const btn = document.getElementById('sidebar-toggle');
      const collapsed = app.classList.toggle('sidebar-collapsed');
      try { localStorage.setItem('ss_sidebar_collapsed', collapsed ? '1' : ''); } catch(e) {}
      btn.textContent = collapsed ? '\u203a' : '\u2039';
      btn.title = collapsed ? 'show sidebar' : 'hide sidebar';
    };
    // restore saved state on load (before first paint of the app screen)
    (function() {
      try {
        if (localStorage.getItem('ss_sidebar_collapsed') === '1') {
          document.getElementById('screen-app').classList.add('sidebar-collapsed');
          const btn = document.getElementById('sidebar-toggle');
          btn.textContent = '\u203a';
          btn.title = 'show sidebar';
        }
      } catch(e) {}
    })();
  </script>"""

NEW_SCRIPT_BLOCK = """  <script>
    // sidebar show/hide - button lives in #header-utils in the header
    window._toggleSidebar = function() {
      const app = document.getElementById('screen-app');
      const btn = document.getElementById('sidebar-toggle');
      const collapsed = app.classList.toggle('sidebar-collapsed');
      try { localStorage.setItem('ss_sidebar_collapsed', collapsed ? '1' : ''); } catch(e) {}
      if (btn) {
        btn.textContent = collapsed ? '\u203a tabs' : '\u2039 tabs';
        btn.title = collapsed ? 'show sidebar' : 'hide sidebar';
      }
    };
    // restore saved state once the header (and its button) exist
    document.addEventListener('DOMContentLoaded', () => {
      try {
        if (localStorage.getItem('ss_sidebar_collapsed') === '1') {
          document.getElementById('screen-app').classList.add('sidebar-collapsed');
          const btn = document.getElementById('sidebar-toggle');
          if (btn) { btn.textContent = '\u203a tabs'; btn.title = 'show sidebar'; }
        }
      } catch(e) {}
    });
  </script>"""

# ----------------------------------------------------------------------
# PATCH 4: insert the utils cluster into the header controls row
#          (anchor avoids the version number, which changes every push)
# ----------------------------------------------------------------------
HDR_ANCHOR = """      <div class="header-controls-row">
        <div class="version-badge" id="version-badge">"""
HDR_NEW = """      <div class="header-controls-row">
        <div id="header-utils">
          <button id="sidebar-toggle" title="hide sidebar" onclick="window._toggleSidebar()">\u2039 tabs</button>
          <button id="tab-split" onclick="window.toggleSplitMode()" title="split screen \u2014 view two tabs side by side"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2"/><line x1="7" y1="1" x2="7" y2="13"/></svg> split</button>
        </div>
        <div class="version-badge" id="version-badge">"""

# ----------------------------------------------------------------------
# PATCH 5: remove the split button from the tab bar
# ----------------------------------------------------------------------
OLD_SPLIT_TAB = """
    <button id="tab-split" class="tab-btn" onclick="window.toggleSplitMode()" title="split screen \u2014 view two tabs side by side"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2"/><line x1="7" y1="1" x2="7" y2="13"/></svg> split screen</button>"""

# --- verify all anchors -------------------------------------------------
for name, anchor in (("grid areas", OLD_AREAS), ("old collapse CSS", OLD_CSS),
                     ("old button block", OLD_BTN_BLOCK), ("header row", HDR_ANCHOR),
                     ("split tab button", OLD_SPLIT_TAB)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected 1")
        idx = src.find(anchor.strip()[:40])
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+280]))
        sys.exit(1)

src = src.replace(OLD_AREAS, NEW_AREAS)
src = src.replace(OLD_CSS, NEW_CSS)
src = src.replace(OLD_BTN_BLOCK, NEW_SCRIPT_BLOCK)
src = src.replace(HDR_ANCHOR, HDR_NEW)
src = src.replace(OLD_SPLIT_TAB, "")

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
print("patched OK - header-utils:", check.count("header-utils") >= 3,
      "| split in tab-bar removed:", 'class="tab-btn" onclick="window.toggleSplitMode' not in check,
      "| full-width header:", '"header  header"' in check)
print('Now run: git add . && git commit -m "ui: full-width header bar with tabs/split buttons" && git push origin main')
