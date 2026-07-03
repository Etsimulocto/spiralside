# phase_update_notes.py
# ============================================================
# SPIRALSIDE - VERSION UPDATE NOTES IN HEADER
# ============================================================
# 1. The version badge (v0.8.9xx) becomes clickable - opens a
#    "what's new" panel with version notes, tips and features.
# 2. Notes live in updates.json at the repo root - adding future
#    notes = edit that JSON, no code patch ever again.
# 3. A small teal dot appears on the badge when the newest entry
#    hasn't been seen yet (tracked in localStorage).
# REQUIRES: phase_header_bar.py applied first (guard below).
# Run from ~/spiralside:   python phase_update_notes.py

import sys, os, json

PATH = "index.html"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guards -------------------------------------------------------------
if "update-notes-panel" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)
if "header-utils" not in src:
    print("FAIL: header utility bar not found - run phase_header_bar.py first.")
    sys.exit(1)

# ------------------------------------------------------------------------
# PATCH 1: make the version badge clickable + add the unseen dot
# ------------------------------------------------------------------------
OLD_BADGE = '<div class="version-badge" id="version-badge">'
NEW_BADGE = '<div class="version-badge" id="version-badge" onclick="window._toggleUpdateNotes()" title="what\u2019s new" style="cursor:pointer">'

# ------------------------------------------------------------------------
# PATCH 2: panel markup + styles + logic, inserted after the sidebar
#          toggle script block (known exact text from phase_header_bar)
# ------------------------------------------------------------------------
SCRIPT_ANCHOR = """    // restore saved state once the header (and its button) exist
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

NOTES_BLOCK = SCRIPT_ANCHOR + """
  <!-- WHAT'S NEW - version update notes panel (fed by updates.json) -->
  <div id="update-notes-panel">
    <div id="un-header">what\u2019s new</div>
    <div id="update-notes-body"><div class="un-empty">loading\u2026</div></div>
  </div>
  <style>
    /* fixed panel dropping below the header - works desktop + mobile */
    #update-notes-panel {
      position: fixed; top: 72px; left: 12px; z-index: 200;
      width: min(380px, calc(100vw - 24px)); max-height: 60vh; overflow-y: auto;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 14px; display: none;
      box-shadow: 0 10px 40px rgba(0,0,0,0.55);
    }
    #update-notes-panel.open { display: block; }
    #un-header {
      font-family: var(--font-display); font-size: 0.9rem; font-weight: 700;
      color: var(--teal); margin-bottom: 6px; letter-spacing: 0.05em;
    }
    .un-entry { border-bottom: 1px solid var(--border); padding: 10px 0; }
    .un-entry:last-child { border-bottom: none; }
    .un-head { display: flex; justify-content: space-between; font-size: 0.7rem; }
    .un-ver  { color: var(--teal); font-weight: 700; }
    .un-date { color: var(--subtext); }
    .un-title { font-family: var(--font-display); font-size: 0.82rem; margin: 4px 0 0; }
    .un-entry ul { margin: 6px 0 0 16px; padding: 0; font-size: 0.74rem;
                   line-height: 1.55; color: var(--text); }
    .un-entry li { margin-bottom: 3px; }
    .un-empty { color: var(--subtext); font-size: 0.75rem; }
    /* unseen-update dot rides the corner of the version badge */
    #version-badge { position: relative; }
    #version-badge.has-update::after {
      content: ''; position: absolute; top: -2px; right: -4px;
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--teal); box-shadow: 0 0 8px var(--teal);
    }
  </style>
  <script>
    // -- WHAT'S NEW PANEL ----------------------------------------
    // Notes come from updates.json (repo root, served by Vercel).
    // Newest entry first. Opening the panel marks it as seen.
    window._toggleUpdateNotes = async function() {
      const panel = document.getElementById('update-notes-panel');
      if (panel.classList.contains('open')) { panel.classList.remove('open'); return; }
      panel.classList.add('open');
      const body = document.getElementById('update-notes-body');
      if (body.dataset.loaded) return;           // fetch once per page load
      try {
        const r = await fetch('updates.json?t=' + Date.now());   // cache-bust
        const data = await r.json();
        const entries = data.entries || [];
        body.innerHTML = entries.map(e => `
          <div class="un-entry">
            <div class="un-head"><span class="un-ver">${e.version || ''}</span><span class="un-date">${e.date || ''}</span></div>
            ${e.title ? '<div class="un-title">' + e.title + '</div>' : ''}
            <ul>${(e.notes || []).map(n => '<li>' + n + '</li>').join('')}</ul>
          </div>`).join('') || '<div class="un-empty">no notes yet</div>';
        body.dataset.loaded = '1';
        // mark newest entry as seen - clears the dot
        const latest = entries[0]?.version || '';
        if (latest) { try { localStorage.setItem('ss_seen_update', latest); } catch(e2) {} }
        document.getElementById('version-badge')?.classList.remove('has-update');
      } catch (err) {
        body.innerHTML = '<div class="un-empty">could not load notes</div>';
      }
    };
    // click anywhere outside closes the panel
    document.addEventListener('click', e => {
      const panel = document.getElementById('update-notes-panel');
      if (!panel || !panel.classList.contains('open')) return;
      const badge = document.getElementById('version-badge');
      if (!panel.contains(e.target) && !(badge && badge.contains(e.target))) {
        panel.classList.remove('open');
      }
    });
    // on load: show the dot if the newest entry hasn't been seen
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const r = await fetch('updates.json?t=' + Date.now());
        const data = await r.json();
        const latest = data.entries?.[0]?.version || '';
        if (latest && localStorage.getItem('ss_seen_update') !== latest) {
          document.getElementById('version-badge')?.classList.add('has-update');
        }
      } catch (e) {}
    });
  </script>"""

for name, anchor in (("version badge", OLD_BADGE), ("sidebar script block", SCRIPT_ANCHOR)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected 1")
        idx = src.find(anchor.strip()[:40])
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+280]))
        sys.exit(1)

src = src.replace(OLD_BADGE, NEW_BADGE)
src = src.replace(SCRIPT_ANCHOR, NOTES_BLOCK)

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

# ------------------------------------------------------------------------
# STEP 3: seed updates.json with today's changelog (skip if it exists)
# ------------------------------------------------------------------------
if not os.path.exists("updates.json"):
    seed = {
      "entries": [
        {
          "version": "v0.9.0",
          "date": "2026-07-03",
          "title": "Makeover Day",
          "notes": [
            "Desktop redesign: sidebar navigation, fullscreen layout",
            "New tab: game maker - build games right inside Spiralside",
            "Split screen: drag the divider to resize, double-click to reset",
            "Header buttons: hide/show tabs, split screen",
            "New minimal startup screen - straight into the app",
            "Chat: comfortable reading width on big monitors",
            "Tip: drag tabs in the sidebar to reorder them - it saves"
          ]
        }
      ]
    }
    with open("updates.json", "w", encoding="utf-8", newline="") as f:
        json.dump(seed, f, indent=2)
    print("seeded updates.json with today's changelog")

check = open(PATH, encoding="utf-8").read()
print("patched OK - panel:", "update-notes-panel" in check,
      "| badge clickable:", "_toggleUpdateNotes()" in check)
print('Now run: git add . && git commit -m "header: whats-new panel fed by updates.json" && git push origin main')
