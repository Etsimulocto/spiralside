#!/usr/bin/env python3
# add_noopener.py
# -----------------------------------------------------------------------------
# PURPOSE
#   Close the "tabnabbing" security hole on spiralside.com.
#
#   Any  <a ... target="_blank">  that opens a new tab WITHOUT rel="noopener"
#   lets the page it opens reach back through window.opener and quietly
#   redirect your ORIGINAL tab -- e.g. swap your sign-in screen for a phishing
#   clone while the user is looking at the new tab. Adding rel="noopener"
#   severs that window.opener link; "noreferrer" also strips the Referer header.
#
#   This script finds every external new-tab anchor that is missing a rel and
#   adds  rel="noopener noreferrer".
#
#   It is SAFE to run more than once: any anchor that already has ANY rel=
#   attribute is left untouched, so nothing ever gets double-patched.
#
# USAGE (Git Bash, run from your ~/spiralside repo root)
#   Point it at your entry HTML file:
#     "C:/Users/quart/AppData/Local/Programs/Python/Python313/python.exe" add_noopener.py index.html
#   With no path it defaults to ./index.html:
#     "C:/Users/quart/AppData/Local/Programs/Python/Python313/python.exe" add_noopener.py
#   You can also run it on the other pages (they may have the same issue):
#     ... add_noopener.py forge/index.html
#     ... add_noopener.py bloomstudio/index.html
#
# AFTER RUNNING
#   Eyeball the printed BEFORE/AFTER list, then deploy the normal way:
#     git add -A
#     git commit -m "security: add rel=noopener to external _blank links"
#     git push origin main        # plain push -- NEVER --force (breaks Vercel webhook)
# -----------------------------------------------------------------------------

import re        # regex engine: used to locate anchor tags and read their attributes
import sys       # to read the target file path off the command line
import shutil    # to make a backup copy before we change anything
import datetime  # to timestamp that backup filename
from pathlib import Path  # tidy, cross-platform file path handling


# ---- 1. Work out which file to patch ----------------------------------------
# First command-line argument is the target file. If none given, use index.html
# in the current directory.
target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("index.html")

# Fail early with a readable message instead of a raw traceback if it's missing.
if not target.exists():
    print("[STOP] File not found:", target.resolve())
    print("       Pass the correct path, e.g.  add_noopener.py path/to/index.html")
    sys.exit(1)


# ---- 2. Read the file EXACTLY as it is on disk ------------------------------
# encoding="utf-8" : your HTML is full of emoji (game maker, spiral, forge...).
#                    Reading/writing as UTF-8 keeps every one of them intact.
# newline=""       : tells Python NOT to translate line endings. We only want
#                    to change the anchor tags we touch -- not flip every
#                    CRLF/LF in the file, which would make a huge, noisy git diff.
with open(target, "r", encoding="utf-8", newline="") as f:
    html = f.read()


# ---- 3. Back up before changing anything ------------------------------------
# Archive-not-delete: a timestamped copy means any bad run is always reversible.
stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")   # e.g. 20260811_143012
backup = target.with_name(target.name + "." + stamp + ".bak")
shutil.copy2(target, backup)                                # copy2 keeps file metadata


# ---- 4. Define what "needs fixing" looks like -------------------------------
# Matches target=_blank with optional quotes/spacing:
#   target="_blank"  target='_blank'  target = _blank
# re.I = case-insensitive.
has_blank = re.compile(r'target\s*=\s*["\']?_blank["\']?', re.I)

# Matches an existing rel= attribute anywhere in the tag. If a tag already has
# ANY rel, we leave it alone: idempotent, and we never clobber your own intent.
has_rel = re.compile(r'\brel\s*=', re.I)


# ---- 5. Counters + a change log so you can see exactly what happened ---------
scanned = 0       # how many <a ...> opening tags we looked at
patched = 0       # how many we actually modified
changes = []      # list of (before, after) tuples for the printed report


# ---- 6. The per-tag transform -----------------------------------------------
# For each opening <a ...> tag handed to us by the regex in step 7, decide
# whether to inject rel="noopener noreferrer" right after the "<a".
def fix_tag(match):
    global scanned, patched          # we increment the outer counters
    tag = match.group(0)             # the full matched "<a ...>" string
    scanned += 1

    # Only touch anchors that (a) open a new tab and (b) have no rel yet.
    if has_blank.search(tag) and not has_rel.search(tag):
        # Insert the attribute immediately after "<a". tag[2:] still starts with
        # the original whitespace that followed "<a", so spacing stays clean:
        #   <a href="..." target="_blank">
        #   -> <a rel="noopener noreferrer" href="..." target="_blank">
        new_tag = '<a rel="noopener noreferrer"' + tag[2:]
        patched += 1
        changes.append((tag, new_tag))   # remember for the report
        return new_tag

    # Anything else is returned unchanged.
    return tag


# ---- 7. Run the transform over every opening anchor tag ---------------------
# <a\b[^>]*>  means: "<a" as a whole word, then anything up to the first ">".
# Each opening anchor is handled on its own. (Anchor tags never nest, and a
# literal ">" inside an href is vanishingly rare in hand-written HTML.)
new_html = re.sub(r"<a\b[^>]*>", fix_tag, html)


# ---- 8. Write back only if something actually changed -----------------------
if patched == 0:
    print("[OK] Scanned", scanned, "anchor(s). Nothing needed patching.")
    print("     Backup written to", backup.name, "-- safe to delete.")
    sys.exit(0)

# Same encoding + newline settings as the read, so the ONLY byte differences
# are the anchor tags we deliberately changed.
with open(target, "w", encoding="utf-8", newline="") as f:
    f.write(new_html)


# ---- 9. Report exactly what was done ----------------------------------------
print("[DONE] Scanned", scanned, "anchor(s); patched", patched, ".")
print("       Backup:", backup.name)
print("       Changed tags:")
for before, after in changes:
    print("         - BEFORE:", before)
    print("           AFTER :", after)
print("")
print('Next: git add -A && git commit -m "security: rel=noopener on _blank links" && git push origin main')
print("      (plain push -- never --force)")
