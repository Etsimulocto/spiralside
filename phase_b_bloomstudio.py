# phase_b_bloomstudio.py
# ============================================================
# SPIRALSIDE - PHASE B: BloomStudio tab
# ============================================================
# What this does, in order:
#   1. Pulls the chosen BloomStudio single-file build from the
#      private repo Etsimulocto/BloomStudio using your gh CLI auth
#   2. Saves it as bloomstudio/index.html (served statically by Vercel)
#   3. Creates js/app/views/bloomstudio.js - a lazy iframe module
#   4. Wires the tab using the standard 4-step pattern:
#        index.html tab button + view div
#        ui.js viewInits entry (+ split-mode support)
#        main.js import + window global
# Every step is idempotent (safe to re-run) and anchor-verified
# (dies loudly instead of guessing).
# Run from ~/spiralside:   python phase_b_bloomstudio.py
# ============================================================

import subprocess, sys, os

# --- CONFIG: which file in the BloomStudio repo is the current build ---
# Change this line and re-run if (6) turns out to be the wrong version.
SOURCE_FILE = "bloomstudio (6).html"

# ------------------------------------------------------------
# helpers
# ------------------------------------------------------------
def read(p):
    return open(p, encoding="utf-8").read()

def write(p, content, crlf):
    # write utf-8; restore CRLF if the original file had it
    out = content.replace("\n", "\r\n") if crlf else content
    open(p, "w", encoding="utf-8", newline="").write(out)

def patch(path, anchor, replacement, label, expect=1):
    # load, normalize, verify anchor count, replace, write back
    raw = read(path)
    crlf = "\r\n" in raw
    src = raw.replace("\r\n", "\n")
    if replacement.replace(anchor, "") in src and anchor not in replacement:
        pass  # not used; kept simple below
    n = src.count(anchor)
    if n != expect:
        print("ANCHOR FAIL [" + label + "]: found", n, "expected", expect)
        probe = anchor.splitlines()[0][:50]
        idx = src.find(probe)
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+240]))
        sys.exit(1)
    src = src.replace(anchor, replacement)
    write(path, src, crlf)
    print("OK  [" + label + "]")

# ------------------------------------------------------------
# STEP 1 - fetch the BloomStudio build from GitHub via gh CLI
# ------------------------------------------------------------
print("[1/6] fetching", SOURCE_FILE, "from Etsimulocto/BloomStudio ...")
# URL-encode the space in the filename; parens are legal in URLs
endpoint = "repos/Etsimulocto/BloomStudio/contents/" + SOURCE_FILE.replace(" ", "%20")
r = subprocess.run(
    ["gh", "api", "-H", "Accept: application/vnd.github.raw", endpoint],
    capture_output=True)
if r.returncode != 0:
    print("gh api FAILED:"); print(r.stderr.decode("utf-8", "replace")); sys.exit(1)
html_bytes = r.stdout
print("      fetched", len(html_bytes), "bytes")
if len(html_bytes) < 100000:
    print("FAIL: suspiciously small - wrong file or API error page."); sys.exit(1)

# ------------------------------------------------------------
# STEP 2 - install as bloomstudio/index.html
# ------------------------------------------------------------
print("[2/6] installing bloomstudio/index.html ...")
os.makedirs("bloomstudio", exist_ok=True)
open("bloomstudio/index.html", "wb").write(html_bytes)   # byte-exact copy
print("      wrote bloomstudio/index.html")

# ------------------------------------------------------------
# STEP 3 - create the view module (lazy iframe)
# ------------------------------------------------------------
print("[3/6] writing js/app/views/bloomstudio.js ...")
MODULE = """// ============================================================
// SPIRALSIDE - BLOOMSTUDIO v1.0
// Game maker tab - iframe-embeds the self-contained BloomStudio
// build served from /bloomstudio/index.html (same origin).
// Lazy: iframe is only created on first tab open, so it adds
// zero cost to app boot. Fully isolated - no style collisions.
// Nimbis anchor: js/app/views/bloomstudio.js
// ============================================================

// remembers whether the iframe already exists (init runs on every tab open)
let _loaded = false;

export function initBloomstudio() {
  // only build the iframe once - later opens are no-ops
  if (_loaded) return;
  // the view container created in index.html
  const view = document.getElementById('view-bloomstudio');
  if (!view) return;
  _loaded = true;

  // inject the tiny bit of CSS this view needs
  // NOTE: never set display on #view-bloomstudio - .view/.view.active own display
  const s = document.createElement('style');
  s.textContent = [
    '#view-bloomstudio { padding: 0; }',                    // edge-to-edge canvas
    '#bloomstudio-frame {',
    '  flex: 1;',                                           // fill the flex column
    '  min-height: 0;',                                     // allow flexbox to size it
    '  width: 100%;',
    '  border: none;',                                      // no iframe chrome
    '  background: #08080d;',                               // match app bg while loading
    '}',
  ].join('\\n');
  document.head.appendChild(s);

  // the iframe itself - same-origin static file, so a future
  // postMessage bridge for auth/credits is a clean upgrade
  const f = document.createElement('iframe');
  f.id = 'bloomstudio-frame';
  f.src = '/bloomstudio/index.html';                        // served by Vercel
  f.allow = 'fullscreen';                                   // let the studio go fullscreen
  view.appendChild(f);
}
"""
os.makedirs("js/app/views", exist_ok=True)
open("js/app/views/bloomstudio.js", "w", encoding="utf-8", newline="").write(MODULE.replace("\n", "\r\n"))
print("      wrote js/app/views/bloomstudio.js")

# ------------------------------------------------------------
# STEP 4 - index.html: tab button + view div
# ------------------------------------------------------------
print("[4/6] patching index.html ...")
idx = read("index.html").replace("\r\n", "\n")
if "tab-bloomstudio" in idx:
    print("      tab already present - skipping index.html")
else:
    # 4a. tab button, right after the bloom engine tab
    TAB_ANCHOR = """<button class="tab-btn" id="tab-bloomengine" onclick="switchView('bloomengine')">&#8756; bloom engine</button>"""
    TAB_NEW = TAB_ANCHOR + """
    <button class="tab-btn" id="tab-bloomstudio" onclick="switchView('bloomstudio')">&#128377; game maker</button>"""
    # 4b. view div, right after the bloom engine view
    VIEW_ANCHOR = """<div class="view" id="view-bloomengine"></div>"""
    VIEW_NEW = VIEW_ANCHOR + """
<div class="view" id="view-bloomstudio"></div>"""
    patch("index.html", TAB_ANCHOR, TAB_NEW, "index.html tab button")
    patch("index.html", VIEW_ANCHOR, VIEW_NEW, "index.html view div")

# ------------------------------------------------------------
# STEP 5 - ui.js: viewInits entry + split-mode support
# ------------------------------------------------------------
print("[5/6] patching js/app/ui.js ...")
ui = read("js/app/ui.js").replace("\r\n", "\n")
if "bloomstudio" in ui:
    print("      ui.js already patched - skipping")
else:
    # 5a. viewInits (the lazy-init map inside switchView).
    # NOTE: single-line "bloomengine:" anchors collide as substrings between
    # the two maps (4-space vs 6-space indent), so we anchor on TWO lines -
    # the bloomslice line + the bloomengine line - which differ per map.
    VI_ANCHOR = ("    bloomslice: () => window.initBloomsliceView && window.initBloomsliceView(),\n"
                 "    bloomengine: () => window.initBloomEngineView && window.initBloomEngineView(),")
    VI_NEW = VI_ANCHOR + "\n    bloomstudio: () => window.initBloomstudioView && window.initBloomstudioView(),"
    patch("js/app/ui.js", VI_ANCHOR, VI_NEW, "ui.js viewInits entry")
    # 5b. split-mode I map - bloomengine line has 6-space indent here
    SP_ANCHOR = ("    bloomslice: () => window.initBloomsliceView && window.initBloomsliceView(),\n"
                 "      bloomengine: () => window.initBloomEngineView && window.initBloomEngineView(),")
    SP_NEW = SP_ANCHOR + "\n      bloomstudio: () => window.initBloomstudioView && window.initBloomstudioView(),"
    patch("js/app/ui.js", SP_ANCHOR, SP_NEW, "ui.js split-mode init map")
    # 5c. both split tab arrays (_TABS and _SPLIT_ALL) list bloomengine -
    #     the same substring appears in each, so expect exactly 2 hits
    ARR_ANCHOR = "'bloomslice','bloomengine'"
    ARR_NEW = "'bloomslice','bloomengine','bloomstudio'"
    patch("js/app/ui.js", ARR_ANCHOR, ARR_NEW, "ui.js split tab arrays", expect=2)

# ------------------------------------------------------------
# STEP 6 - main.js: import + window global
# ------------------------------------------------------------
print("[6/6] patching js/app/main.js ...")
mainjs = read("js/app/main.js").replace("\r\n", "\n")
if "bloomstudio" in mainjs:
    print("      main.js already patched - skipping")
else:
    # 6a. module import, next to the bloomengine import
    IMP_ANCHOR = 'import { initBloomEngine } from "./views/bloomengine.js";'
    IMP_NEW = IMP_ANCHOR + '\nimport { initBloomstudio } from "./views/bloomstudio.js";'
    patch("js/app/main.js", IMP_ANCHOR, IMP_NEW, "main.js import")
    # 6b. window global, next to the bloomengine global
    GLB_ANCHOR = "window.initBloomEngineView = initBloomEngine;"
    GLB_NEW = GLB_ANCHOR + "\nwindow.initBloomstudioView = initBloomstudio;"
    patch("js/app/main.js", GLB_ANCHOR, GLB_NEW, "main.js window global")

# ------------------------------------------------------------
# final verification
# ------------------------------------------------------------
print()
checks = [
    ("bloomstudio/index.html exists", os.path.exists("bloomstudio/index.html")),
    ("module file exists",            os.path.exists("js/app/views/bloomstudio.js")),
    ("index.html tab",                "tab-bloomstudio"  in read("index.html")),
    ("index.html view",               "view-bloomstudio" in read("index.html")),
    ("ui.js wired",                   read("js/app/ui.js").count("bloomstudio") >= 3),
    ("main.js wired",                 read("js/app/main.js").count("initBloomstudio") >= 2),
]
ok = all(v for _, v in checks)
for label, v in checks:
    print(("PASS  " if v else "FAIL  ") + label)
print()
if ok:
    print("ALL GOOD. Test locally first:")
    print("  start bloomstudio/index.html      (opens the studio in your browser)")
    print("If it is the right version, push:")
    print('  git add . && git commit -m "phase B: BloomStudio game maker tab" && git push origin main')
    print("If it is the WRONG version: edit SOURCE_FILE at the top of this script and re-run.")
else:
    print("Something failed above - do not push. Paste this output to Claude.")
