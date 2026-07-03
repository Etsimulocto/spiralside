# phase_a_patch.py
# SPIRALSIDE Phase A — desktop sidebar shell + token refresh
# Applies the responsive-shell CSS patch directly to the LOCAL index.html.
# Run from ~/spiralside:  python phase_a_patch.py
# Safe: verifies anchors before writing, verifies result after.

import sys

PATH = "index.html"

# --- read local file (utf-8, normalize CRLF for matching) ---------------
raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard: already patched? --------------------------------------------
if "DESKTOP SHELL" in src:
    print("Already patched — DESKTOP SHELL block present. Nothing to do.")
    sys.exit(0)

# --- anchor 1: token block ----------------------------------------------
OLD_TOKENS = """      --text:     #F0F0FF;
      --subtext:  #6060A0;"""

NEW_TOKENS = '      --text:     #F0F0FF;\n      --subtext:  #7373B3;          /* was #6060A0 — bumped for legibility on dark bg */\n      --sidebar-w: 220px;           /* desktop sidebar nav width (>=900px shell) */\n      --radius-sm: 8px;             /* token refresh — shared corner radii */\n      --radius-md: 12px;\n      --radius-lg: 16px;\n      --space-1: 4px;               /* token refresh — spacing scale for Phase C */\n      --space-2: 8px;\n      --space-3: 14px;\n      --space-4: 20px;\n      --glow-teal: 0 0 30px rgba(0,246,214,0.25);  /* reusable neon glow */'

# --- anchor 2: breakpoint ladder ----------------------------------------
OLD_SHELL = """    #screen-app { max-width: min(480px, 100vw); margin: 0 auto; position: relative; overflow-x: hidden; display:flex; flex-direction:column; flex:1; min-height:0; }
    @media (min-width: 600px)  { #screen-app { max-width: min(600px, 100vw); } }
    @media (min-width: 900px)  { #screen-app { max-width: min(740px, 100vw); } }
    @media (min-width: 1200px) { #screen-app { max-width: min(900px, 100vw); } }"""

NEW_SHELL = '    /* Mobile-first: phone column, flex stack (unchanged) */\n    #screen-app { max-width: min(480px, 100vw); margin: 0 auto; position: relative; overflow-x: hidden; display:flex; flex-direction:column; flex:1; min-height:0; }\n    @media (min-width: 600px)  { #screen-app { max-width: min(600px, 100vw); } }\n\n    /* ── DESKTOP SHELL (>=900px) ─────────────────────────────\n       The single #tab-bar is repositioned as a left sidebar via\n       CSS grid — no HTML duplication, switchView() untouched.\n       Areas:  sidebar | header\n               sidebar | ticker\n               sidebar | main (all .view share this cell)      */\n    @media (min-width: 900px) {\n      #screen-app {\n        max-width: min(1100px, 100vw);\n        display: grid;                                   /* overrides mobile flex */\n        grid-template-columns: var(--sidebar-w) minmax(0, 1fr);\n        grid-template-rows: auto auto minmax(0, 1fr);\n        grid-template-areas:\n          "sidebar header"\n          "sidebar ticker"\n          "sidebar main";\n        border-left: 1px solid var(--border);            /* frame the shell in the gutters */\n        border-right: 1px solid var(--border);\n      }\n      #app-header         { grid-area: header; }\n      #skyline-ticker     { grid-area: ticker; }\n      #screen-app > .view { grid-area: main; min-width: 0; }  /* all views stack in one cell; .view.active owns display */\n      #fab-container      { grid-area: main; }           /* hidden anyway, but keep it placed */\n\n      /* tab strip -> vertical sidebar nav */\n      #tab-bar {\n        grid-area: sidebar;\n        flex-direction: column;                          /* still flex, now a column */\n        align-items: stretch;\n        overflow-y: auto;                                /* scrolls if 20+ tabs overflow */\n        overflow-x: hidden;\n        border-bottom: none;\n        border-right: 1px solid var(--border);\n        padding: 14px 10px calc(14px + var(--safe-bot));\n        gap: 2px;\n        scrollbar-width: thin;\n      }\n      .tab-btn {\n        text-align: left;                                /* row items, not centered pills */\n        padding: 9px 12px;\n        font-size: 0.74rem;\n        border-bottom: none;                             /* kill mobile underline indicator */\n        border-left: 2px solid transparent;              /* left rail indicator instead */\n        border-radius: 0 var(--radius-sm) var(--radius-sm) 0;\n        margin-bottom: 0;\n      }\n      .tab-btn:hover  { background: rgba(255,255,255,0.03); }\n      .tab-btn.active {\n        border-bottom-color: transparent;                /* neutralize base .active underline */\n        border-left-color: var(--teal);\n        background: rgba(0,246,214,0.07);\n      }\n    }\n    @media (min-width: 1200px) { #screen-app { max-width: min(1280px, 100vw); } }\n    @media (min-width: 1600px) { #screen-app { max-width: min(1440px, 100vw); } }'

# --- verify anchors, loud failure with context ---------------------------
for name, anchor in (("tokens", OLD_TOKENS), ("shell", OLD_SHELL)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL:", name, "found", n, "times (need exactly 1).")
        probe = anchor.splitlines()[0]
        idx = src.find(probe)
        if idx >= 0:
            print("Context near first line of anchor:")
            print(repr(src[idx:idx+300]))
        else:
            print("First line of anchor not found at all — wrong base file?")
        sys.exit(1)

# --- apply ----------------------------------------------------------------
src = src.replace(OLD_TOKENS, NEW_TOKENS).replace(OLD_SHELL, NEW_SHELL)

# --- write back, preserving CRLF for the Windows repo ---------------------
out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

# --- post-verify -----------------------------------------------------------
check = open(PATH, encoding="utf-8").read()
ok1 = check.count("DESKTOP SHELL")
ok2 = check.count("--sidebar-w")
print("patched OK — DESKTOP SHELL:", ok1, "| sidebar-w refs:", ok2, "| bytes:", len(check.encode("utf-8")))
print("Now run: git add . && git commit -m \"phase A: desktop sidebar shell\" && git push origin main")
