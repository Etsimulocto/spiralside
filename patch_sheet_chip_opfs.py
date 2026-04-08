import sys
FILE = r"C:/Users/quart/spiralside/js/app/sheet.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# When building chips, load portrait from OPFS if stripped
OLD = """      if (print.portrait_base64) {
        chip.style.backgroundImage    = `url(${print.portrait_base64})`;
        chip.style.backgroundSize     = 'cover';
        chip.style.backgroundPosition = 'center top';
        chip.style.color              = '#fff';
        chip.style.textShadow         = '0 1px 3px rgba(0,0,0,0.8)';
        chip.style.border             = `2px solid ${color}`;
        chip.style.minWidth           = '72px';
        chip.style.height             = '48px';
        chip.style.borderRadius       = '8px';
        chip.style.display            = 'flex';
        chip.style.alignItems         = 'flex-end';
        chip.style.padding            = '4px 6px';
        chip.style.fontSize           = '0.6rem';
      }"""

NEW = """      // Load portrait — from IDB or OPFS fallback
      const _applyPortrait = (b64) => {
        chip.style.backgroundImage    = `url(${b64})`;
        chip.style.backgroundSize     = 'cover';
        chip.style.backgroundPosition = 'center top';
        chip.style.color              = '#fff';
        chip.style.textShadow         = '0 1px 3px rgba(0,0,0,0.8)';
        chip.style.border             = `2px solid ${color}`;
        chip.style.minWidth           = '72px';
        chip.style.height             = '48px';
        chip.style.borderRadius       = '8px';
        chip.style.display            = 'flex';
        chip.style.alignItems         = 'flex-end';
        chip.style.padding            = '4px 6px';
        chip.style.fontSize           = '0.6rem';
      };
      if (print.portrait_base64) {
        _applyPortrait(print.portrait_base64);
      } else if (print._has_portrait_base64 && window.opfsRead) {
        const _opfsKey = 'prints/' + print.id + '_portrait.png';
        window.opfsRead(_opfsKey).then(data => {
          if (data) { print.portrait_base64 = data; _applyPortrait(data); }
        }).catch(() => {});
      }"""

if OLD not in src:
    print("MISS: chip portrait block")
    idx = src.find('chip.style.backgroundImage')
    print(repr(src[max(0,idx-100):idx+200]))
    sys.exit(1)

src = src.replace(OLD, NEW)
print("OK: chip portrait loads from OPFS fallback")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
