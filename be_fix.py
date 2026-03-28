import os, re

ROOT = os.path.expanduser("~/spiralside")
path = os.path.join(ROOT, "js/app/views/bloomengine.js")

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = "    '#be-bloom-btn:hover{background:#FF4BCB22;}',\n  ].join('');"
new = "    '#be-bloom-btn:hover{background:#FF4BCB22;}',\n    '#view-bloomengine.active{display:flex;flex-direction:column;overflow:hidden;flex:1;}',\n  ].join('');"

if "#view-bloomengine.active" in src:
    print("already patched")
else:
    count = src.count(old)
    print("anchor matches:", count)
    assert count == 1, "anchor not found"
    src = src.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)
    print("OK patched bloomengine.js")
