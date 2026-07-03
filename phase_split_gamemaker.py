# phase_split_gamemaker.py
# ============================================================
# SPIRALSIDE - SPLIT MODE: surface the game maker
# ============================================================
# Problem: bloomstudio IS in split mode, but at position 17 of a
# scrollable tab strip with no scroll affordance - invisible.
# Fix:
#   1. Move 'bloomstudio' to slot 3 in the _SPLIT_ALL default order
#      (chat, pi, bloomstudio, ...)
#   2. Rotate the saved-order localStorage key (ss_split_order_ ->
#      ss_split_order_v2_) so stale saved orders from before this
#      change are ignored once and the new default actually renders.
#      Users' future drags still persist under the new key.
# Run from ~/spiralside:   python phase_split_gamemaker.py

import sys

PATH = "js/app/ui.js"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard ------------------------------------------------------------
if "'chat','pi','bloomstudio'" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)

# --- patch 1: reorder the split default -------------------------------
OLD_ARR = "const _SPLIT_ALL = ['chat','pi','codex','forge','imagine','frames','cut','studio','quest','spiral','cannonized','library','music','code','bloomslice','bloomengine','bloomstudio','vault','guide','style','store','account'];"
NEW_ARR = "const _SPLIT_ALL = ['chat','pi','bloomstudio','codex','forge','imagine','frames','cut','studio','quest','spiral','cannonized','library','music','code','bloomslice','bloomengine','vault','guide','style','store','account'];"

# --- patch 2: rotate the saved-order key (setItem + getItem = 2 hits) --
OLD_KEY = "'ss_split_order_' + panel"
NEW_KEY = "'ss_split_order_v2_' + panel"

for name, anchor, expect in (("split default order", OLD_ARR, 1),
                             ("saved-order key",     OLD_KEY, 2)):
    n = src.count(anchor)
    if n != expect:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected", expect)
        idx = src.find(anchor[:30])
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-60):idx+220]))
        sys.exit(1)

src = src.replace(OLD_ARR, NEW_ARR).replace(OLD_KEY, NEW_KEY)

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
print("patched OK - new order:", "'chat','pi','bloomstudio'" in check,
      "| v2 key refs:", check.count("ss_split_order_v2_"))
print('Now run: git add . && git commit -m "split: surface game maker at slot 3" && git push origin main')
