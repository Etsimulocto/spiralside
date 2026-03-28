import os

ROOT = os.path.expanduser("~/spiralside")
path = os.path.join(ROOT, "js/app/views/bloomengine.js")

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# Fix: make panel grid single column, each module full width
# Also fix be-panel overflow and be-row label width for mobile
old = "    '#be-panel-inner{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#1a1a22;}',\n    '.be-mod{background:#0e0e16;padding:10px;}'"
new = "    '#be-panel-inner{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#1a1a22;}',\n    '@media(max-width:540px){#be-panel-inner{grid-template-columns:1fr;}}',\n    '.be-mod{background:#0e0e16;padding:10px;}'"

if "@media(max-width:540px)" in src:
    print("already patched")
else:
    count = src.count(old)
    print("anchor matches:", count)
    assert count == 1, "anchor not found"
    src = src.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)
    print("OK patched — single column on mobile")
