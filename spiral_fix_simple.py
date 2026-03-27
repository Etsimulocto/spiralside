# Simplest possible fix: in initSpiral, after mount, force resize via setTimeout
# This guarantees the browser has done layout before we measure

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

old = (
    "export function initSpiral() {\n"
    "  const container = document.getElementById('view-spiral');\n"
    "  if (!container) return;\n"
    "  SpiralView.mount(container);\n"
    "}"
)
new = (
    "export function initSpiral() {\n"
    "  const container = document.getElementById('view-spiral');\n"
    "  if (!container) return;\n"
    "  SpiralView.mount(container);\n"
    "  // Force resize after browser has finished layout\n"
    "  setTimeout(() => {\n"
    "    const c = document.getElementById('sp-canvas');\n"
    "    if (!c) return;\n"
    "    const wrap = c.parentElement;\n"
    "    c.width  = wrap.offsetWidth  || container.offsetWidth  || window.innerWidth;\n"
    "    c.height = wrap.offsetHeight || container.offsetHeight || (window.innerHeight - 160);\n"
    "  }, 50);\n"
    "}"
)

if old in content:
    content = content.replace(old, new, 1)
    print('patched initSpiral with setTimeout resize')
else:
    print('ANCHOR NOT FOUND')
    idx = content.find('export function initSpiral')
    print(repr(content[idx:idx+150]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
