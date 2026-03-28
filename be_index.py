import os, re

ROOT = os.path.expanduser("~/spiralside")
path = os.path.join(ROOT, "index.html")
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

if "tab-bloomengine" not in src:
    m = re.search(r'id="tab-bloomslice"[^>]*>[^<]*</button>', src)
    assert m, "ERROR: tab-bloomslice anchor not found"
    src = src[:m.end()] + '\n    <button class="tab-btn" id="tab-bloomengine" onclick="switchView(\'bloomengine\')">&#8756; bloom engine</button>' + src[m.end():]
    print("tab button inserted")
else:
    print("tab button already present")

if "view-bloomengine" not in src:
    m2 = re.search(r'<div class="view" id="view-bloomslice"[^>]*></div>', src)
    assert m2, "ERROR: view-bloomslice anchor not found"
    src = src[:m2.end()] + '\n<div class="view" id="view-bloomengine"></div>' + src[m2.end():]
    print("view div inserted")
else:
    print("view div already present")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("OK patched index.html")
