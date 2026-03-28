import os, re

ROOT = os.path.expanduser("~/spiralside")
main_path = None
for r, d, files in os.walk(ROOT):
    for f in files:
        if f == "main.js":
            main_path = os.path.join(r, f)
            break

assert main_path, "ERROR: main.js not found"
with open(main_path, "r", encoding="utf-8") as f:
    src = f.read()

# import
if "bloomengine" not in src:
    m = re.search(r'import[^;]*bloomslice[^;]*;', src)
    if not m:
        m = re.search(r'import[^;]*particles[^;]*;', src)
    assert m, "ERROR: import anchor not found"
    src = src[:m.end()] + '\nimport { initBloomEngine } from "./views/bloomengine.js";' + src[m.end():]
    print("import inserted")
else:
    print("import already present")

# global
if "initBloomEngineView" not in src:
    m2 = re.search(r'window\.initBloomsliceView\s*=[^\n]+', src)
    if not m2:
        m2 = re.search(r'window\.initGuideView\s*=[^\n]+', src)
    assert m2, "ERROR: global anchor not found"
    src = src[:m2.end()] + '\nwindow.initBloomEngineView = initBloomEngine;' + src[m2.end():]
    print("global inserted")
else:
    print("global already present")

with open(main_path, "w", encoding="utf-8") as f:
    f.write(src)
print("OK patched", main_path)
