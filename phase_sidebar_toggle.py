# phase_sidebar_toggle.py
# ============================================================
# SPIRALSIDE - SIDEBAR COLLAPSE + LABELED SPLIT BUTTON
# ============================================================
# 1. Adds a small round toggle (top-left, desktop only) that
#    collapses/expands the left sidebar. State persists in
#    localStorage (ss_sidebar_collapsed) across reloads.
# 2. The split-mode button gets a text label ("split screen")
#    and is pinned to the bottom of the sidebar as a utility row.
# Mobile (<900px) completely unaffected.
# Run from ~/spiralside:   python phase_sidebar_toggle.py

import sys

PATH = "index.html"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard ------------------------------------------------------------
if "sidebar-toggle" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)

# --- patch 1: CSS, inserted right after the A.2 marker comment ---------
CSS_ANCHOR = "    /* 1200px / 1600px caps removed \u2014 desktop shell is fullscreen */"
CSS_NEW = CSS_ANCHOR + """

    /* \u2500\u2500 SIDEBAR COLLAPSE TOGGLE (desktop only) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

# --- patch 2: toggle button + restore script, just inside #screen-app --
BTN_ANCHOR = '<div class="screen" id="screen-app">'
BTN_NEW = BTN_ANCHOR + """
  <!-- sidebar collapse toggle - desktop only, position:fixed so it
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

# --- patch 3: give the split button its label + clearer tooltip --------
SPLIT_ANCHOR = '<button id="tab-split" class="tab-btn" onclick="window.toggleSplitMode()" title="split view"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2"/><line x1="7" y1="1" x2="7" y2="13"/></svg></button>'
SPLIT_NEW   = '<button id="tab-split" class="tab-btn" onclick="window.toggleSplitMode()" title="split screen \u2014 view two tabs side by side"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2"/><line x1="7" y1="1" x2="7" y2="13"/></svg> split screen</button>'

for name, anchor in (("A.2 CSS marker", CSS_ANCHOR),
                     ("screen-app open div", BTN_ANCHOR),
                     ("split button", SPLIT_ANCHOR)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected 1")
        idx = src.find(anchor[:40])
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+240]))
        sys.exit(1)

src = src.replace(CSS_ANCHOR, CSS_NEW)
src = src.replace(BTN_ANCHOR, BTN_NEW)
src = src.replace(SPLIT_ANCHOR, SPLIT_NEW)

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
print("patched OK - toggle refs:", check.count("sidebar-toggle"),
      "| split label:", "split screen</button>" in check)
print('Now run: git add . && git commit -m "ui: sidebar collapse toggle + labeled split button" && git push origin main')
