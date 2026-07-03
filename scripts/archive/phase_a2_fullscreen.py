# phase_a2_fullscreen.py
# SPIRALSIDE Phase A.2 — desktop shell goes fullscreen
# Removes the 1100/1280/1440px width caps and the gutter framing borders
# so the sidebar + content span the entire browser window on PC.
# Mobile (<900px) untouched. Split mode untouched (already fullscreen).
# Run from ~/spiralside:  python phase_a2_fullscreen.py

import sys

PATH = "index.html"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard: needs Phase A in place, and not already applied ---------------
if "DESKTOP SHELL" not in src:
    print("FAIL: Phase A block not found. Run phase_a_patch.py first.")
    sys.exit(1)
if "max-width: none;" in src and "min(1280px" not in src:
    print("Already fullscreen. Nothing to do.")
    sys.exit(0)

# --- patch 1: uncap the 900px shell ---------------------------------------
OLD_1 = """        max-width: min(1100px, 100vw);"""
NEW_1 = """        max-width: none;                                 /* fullscreen: span the whole viewport */
        width: 100%;"""

# --- patch 2: drop the gutter-framing borders (no gutters anymore) --------
OLD_2 = """        border-left: 1px solid var(--border);            /* frame the shell in the gutters */
        border-right: 1px solid var(--border);
"""
NEW_2 = ""

# --- patch 3: remove the wider-cap breakpoints -----------------------------
OLD_3 = """    @media (min-width: 1200px) { #screen-app { max-width: min(1280px, 100vw); } }
    @media (min-width: 1600px) { #screen-app { max-width: min(1440px, 100vw); } }"""
NEW_3 = """    /* 1200px / 1600px caps removed — desktop shell is fullscreen */"""

# --- verify anchors, loud failure ------------------------------------------
for name, anchor in (("cap-1100", OLD_1), ("gutter-borders", OLD_2), ("wide-caps", OLD_3)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL:", name, "found", n, "times (need exactly 1).")
        probe = anchor.splitlines()[0]
        idx = src.find(probe.strip()[:40])
        if idx >= 0:
            print("Context:")
            print(repr(src[max(0,idx-80):idx+260]))
        sys.exit(1)

# --- apply ------------------------------------------------------------------
src = src.replace(OLD_1, NEW_1).replace(OLD_2, NEW_2).replace(OLD_3, NEW_3)

# --- write back, preserve CRLF ----------------------------------------------
out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

# --- post-verify --------------------------------------------------------------
check = open(PATH, encoding="utf-8").read()
ok = ("max-width: none;" in check) and ("min(1280px" not in check) and ("min(1440px" not in check)
print("patched OK — fullscreen:", ok, "| bytes:", len(check.encode("utf-8")))
print('Now run: git add . && git commit -m "phase A.2: fullscreen desktop shell" && git push origin main')
