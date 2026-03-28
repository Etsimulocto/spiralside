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

# viewInits entry
if "bloomengine" not in src:
    m = re.search(r"bloomslice\s*:\s*\(\)\s*=>[^\n]+", src)
    if not m:
        m = re.search(r"spiral\s*:\s*\(\)\s*=>[^\n]+", src)
    assert m, "ERROR: viewInits anchor not found"
    ins = "\n      bloomengine: () => window.initBloomEngineView && window.initBloomEngineView(),"
    src = src[:m.end()] + ins + src[m.end():]
    print("viewInits inserted")
else:
    print("viewInits already present")

# split mode case
if src.count("bloomengine") < 2:
    m2 = re.search(r"case\s*['\"]bloomslice['\"][^\n]*", src)
    if m2:
        ins2 = "\n      case 'bloomengine': window.initBloomEngineView && window.initBloomEngineView(); break;"
        line_end = src.find("\n", m2.end())
        src = src[:line_end] + ins2 + src[line_end:]
        print("split mode case inserted")
    else:
        print("WARNING: split bloomslice case not found, skipping")
else:
    print("split mode already present")

with open(ui_path, "w", encoding="utf-8") as f:
    f.write(src)
print("OK patched", ui_path)
