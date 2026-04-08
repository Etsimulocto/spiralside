import sys
FILE = r"C:/Users/quart/spiralside/js/app/sheet.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Silence the expected NotFoundError in chip OPFS fallback
OLD = """        window.opfsRead(_opfsKey).then(data => {
          if (data) { print.portrait_base64 = data; _applyPortrait(data); }
        }).catch(() => {});"""

NEW = """        window.opfsRead(_opfsKey).then(data => {
          if (data) { print.portrait_base64 = data; _applyPortrait(data); }
        }).catch(_e => {
          // NotFoundError is expected for prints saved before OPFS portrait support
          if (!(_e && _e.name === 'NotFoundError')) console.warn('[sheet] OPFS portrait read failed:', _e);
        });"""

if OLD not in src:
    print("MISS: chip OPFS catch")
    sys.exit(1)

src = src.replace(OLD, NEW)
print("OK: silenced expected NotFoundError in chip OPFS fallback")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
