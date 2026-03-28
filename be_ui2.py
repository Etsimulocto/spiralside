import os, re

ROOT = os.path.expanduser("~/spiralside")
ui_path = None
for r, d, files in os.walk(ROOT):
    for f in files:
        if f == "ui.js":
            ui_path = os.path.join(r, f)
            break

assert ui_path, "ERROR: ui.js not found"
with open(ui_path, "r", encoding="utf-8") as f:
    src = f.read()

if "bloomengine" in src and src.count("bloomengine") >= 2:
    print("bloomengine already in viewInits, count:", src.count("bloomengine"))
else:
    old = "    bloomslice: () => window.initBloomsliceView && window.initBloomsliceView(),\n  };"
    new = "    bloomslice: () => window.initBloomsliceView && window.initBloomsliceView(),\n    bloomengine: () => window.initBloomEngineView && window.initBloomEngineView(),\n  };"
    count = src.count(old)
    print("anchor matches:", count)
    assert count == 1, "anchor not found - check ui.js manually"
    src = src.replace(old, new)
    with open(ui_path, "w", encoding="utf-8") as f:
        f.write(src)
    print("OK patched viewInits in", ui_path)
