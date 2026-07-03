# phase_cleanup.py
# ============================================================
# SPIRALSIDE - DEAD CODE CLEANUP (frontend)
# ============================================================
# 1. FIXES A LIVE BUG: chat + menu "cut / edit image" called
#    switchView('spiralcut') - a view that does not exist,
#    leaving a blank screen. Retargets both buttons to 'cut'.
# 2. Deletes support.js (BloomStudio runtime that leaked in,
#    never loaded by index.html)
# 3. Deletes js/comic/ (abandoned second comic viewer -
#    main.js imports comic.js, nothing references this folder)
# 4. Archives root scratch files (_*.py, _*.txt, patch_*.py,
#    phase_*.py, plus known one-offs) into scripts/archive/
#    - moved, not deleted, so everything is reversible
# Run from ~/spiralside:   python phase_cleanup.py

import sys, os, glob, shutil

# ------------------------------------------------------------
# 1. fix the spiralcut ghost-view bug in index.html
# ------------------------------------------------------------
raw = open("index.html", encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

OLD = "switchView('spiralcut');toggleInputMenu()"
NEW = "switchView('cut');toggleInputMenu()"
n = src.count(OLD)
if n == 0:
    print("[1/4] spiralcut bug: already fixed (0 found)")
elif n == 2:
    src = src.replace(OLD, NEW)
    out = src.replace("\n", "\r\n") if had_crlf else src
    open("index.html", "w", encoding="utf-8", newline="").write(out)
    print("[1/4] spiralcut bug: FIXED (2 buttons retargeted to 'cut')")
else:
    print("[1/4] UNEXPECTED: found", n, "occurrences (expected 2) - not touching. Tell Claude.")
    sys.exit(1)

# ------------------------------------------------------------
# 2. delete support.js (verified unreferenced)
# ------------------------------------------------------------
if os.path.exists("support.js"):
    os.remove("support.js")
    print("[2/4] support.js: deleted")
else:
    print("[2/4] support.js: already gone")

# ------------------------------------------------------------
# 3. delete js/comic/ (abandoned viewer, verified unreferenced)
# ------------------------------------------------------------
if os.path.isdir("js/comic"):
    shutil.rmtree("js/comic")
    print("[3/4] js/comic/: deleted")
else:
    print("[3/4] js/comic/: already gone")

# ------------------------------------------------------------
# 4. archive root scratch files into scripts/archive/
# ------------------------------------------------------------
os.makedirs("scripts/archive", exist_ok=True)
ME = os.path.basename(__file__)               # never archive ourself mid-run

# patterns that are historically one-off patch/relay scripts
patterns = ["_*.py", "_*.txt", "patch_*.py", "phase_*.py"]
# known one-off files by exact name
explicit = ["canon_forge.py", "imagine_pipeline.py", "patch_cannonized.js",
            "fix_music_urls.py", "scripts/fix_comic.sh"]

moved = 0
targets = set()
for pat in patterns:
    for f in glob.glob(pat):
        targets.add(f)
for f in explicit:
    if os.path.exists(f):
        targets.add(f)

for f in sorted(targets):
    if os.path.basename(f) == ME:
        continue                               # skip the running script
    if not os.path.isfile(f):
        continue
    dest = os.path.join("scripts/archive", os.path.basename(f))
    # if a file with the same name is already archived, overwrite it
    shutil.move(f, dest)
    moved += 1

print("[4/4] archived", moved, "scratch files -> scripts/archive/")
print()
print("DONE. This script will archive ITSELF on the next run.")
print('Now: git add . && git commit -m "cleanup: fix spiralcut bug, remove dead code, archive scratch" && git push origin main')
