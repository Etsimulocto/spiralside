#!/usr/bin/env python3
# _p2.py — gm-launch must set gm-full so the header hides in game maker
# Run from spiralside repo root:  python _p2.py

import io, sys
PATH = "index.html"
OLD = '''id="gm-launch" onclick="switchView('bloomstudio')"'''
NEW = '''id="gm-launch" onclick="switchView('bloomstudio');document.body.classList.add('gm-full')"'''

src = io.open(PATH, encoding="utf-8").read()
if NEW in src:
    print("SKIP  already patched"); sys.exit(0)
n = src.count(OLD)
if n != 1:
    print(f"FAIL  expected exactly one anchor, found {n}"); sys.exit(1)
io.open(PATH, "w", encoding="utf-8").write(src.replace(OLD, NEW))
print("OK    gm-launch now sets gm-full — header hides on entry")
