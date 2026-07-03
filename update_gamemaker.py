# update_gamemaker.py
# ============================================================
# SPIRALSIDE - GAME MAKER DEPLOY TOOL (permanent, lives in repo)
# ============================================================
# The Design -> Spiralside pipeline, one command:
#   1. Finds the NEWEST Bloom-ish HTML in Downloads (by mtime,
#      so browser (1)(2)(3) rename chaos is irrelevant)
#   2. Identity gates: must look like the game maker, must NOT
#      be a stray spiralside shell, must be a real build size
#   3. Installs it byte-exact as bloomstudio/index.html
#   4. Prints old vs new size + the push command + the ritual
# Optional: python update_gamemaker.py "C:/full/path/to/file.html"
# Run from ~/spiralside.
# NOTE: named update_* on purpose - the phase_* cleanup glob
# must never archive this file.

import sys, os, glob, shutil

DOWNLOADS = "C:/Users/quart/Downloads"
TARGET    = "bloomstudio/index.html"

# ------------------------------------------------------------
# 1. pick the source file
# ------------------------------------------------------------
if len(sys.argv) > 1:
    # explicit path wins
    src_path = sys.argv[1]
    if not os.path.isfile(src_path):
        print("FAIL: file not found:", src_path); sys.exit(1)
else:
    # newest bloom-ish html in Downloads by modification time
    candidates = []
    for pat in ("BloomMaker*.html", "bloomstudio*.html", "BloomStudio*.html", "bloom*.html"):
        candidates += glob.glob(os.path.join(DOWNLOADS, pat))
    candidates = sorted(set(candidates), key=os.path.getmtime, reverse=True)
    if not candidates:
        print("FAIL: no Bloom-ish .html files found in Downloads.")
        print("      Export from Design first, or pass an explicit path.")
        sys.exit(1)
    src_path = candidates[0]
    print("newest candidate:", os.path.basename(src_path))

# ------------------------------------------------------------
# 2. identity gates
# ------------------------------------------------------------
data = open(src_path, "rb").read()
text = data.decode("utf-8", "replace").lower()
size = len(data)

gates = [
    ("looks like the game maker (bloomstudio marker)", ("bloomstudio" in text) or ("bloommaker" in text) or ("bloomdesktop" in text)),
    ("is NOT a spiralside shell (no screen-app)",       "screen-app" not in text),
    ("is a real build (> 200 KB)",                      size > 200000),
]
ok = True
for label, passed in gates:
    print(("PASS  " if passed else "FAIL  ") + label)
    ok = ok and passed
if not ok:
    print()
    print("GATES FAILED - nothing was installed. Wrong file? Pass the path explicitly.")
    sys.exit(1)

# ------------------------------------------------------------
# 3. install (byte-exact copy)
# ------------------------------------------------------------
old_size = os.path.getsize(TARGET) if os.path.exists(TARGET) else 0
os.makedirs("bloomstudio", exist_ok=True)
shutil.copyfile(src_path, TARGET)
print()
print("installed:", os.path.basename(src_path))
print("old build:", old_size, "bytes  ->  new build:", size, "bytes",
      "(+" + str(size - old_size) + ")" if size >= old_size else "(SMALLER - double-check this is right)")

# ------------------------------------------------------------
# 4. next steps
# ------------------------------------------------------------
print()
print("Test locally first:  start bloomstudio/index.html")
print("Check the console version line matches the Design build.")
print()
print("Then ship it:")
print('  git add . && git commit -m "gamemaker: <what changed>" && git push origin main')
print()
print("RITUAL: prepend an entry to updates.json so the whats-new")
print("panel announces it. Periodically archive the same file to the")
print("BloomStudio repo as canonical bloomstudio.html.")
