# Fix spiral to match the established initXxxView pattern

# ── 1: patch spiral.js — add export function initSpiral() ──
with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

# Add initSpiral export at the bottom before the closing
old_return = "  return { mount, unmount, applyPreset, savePNG };\n\n})();"
new_return = (
    "  return { mount, unmount, applyPreset, savePNG };\n\n"
    "})();\n\n"
    "export function initSpiral() {\n"
    "  const container = document.getElementById('view-spiral');\n"
    "  if (!container) return;\n"
    "  SpiralView.mount(container);\n"
    "}"
)

if old_return in content:
    content = content.replace(old_return, new_return, 1)
    print('added export function initSpiral()')
else:
    print('ANCHOR NOT FOUND in spiral.js')
    print(repr(content[-100:]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')

# ── 2: patch main.js — swap SpiralView import for initSpiral ──
with open('js/app/main.js','r',encoding='utf-8') as f:
    content = f.read()

# Replace import
old_import = "import { SpiralView }   from './views/spiral.js';"
new_import  = "import { initSpiral }   from './views/spiral.js';"
if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print('updated import in main.js')
else:
    print('import anchor not found in main.js')

# Replace window global
old_global = "window.SpiralView = SpiralView;"
new_global  = "window.initSpiralView = initSpiral;"
if old_global in content:
    content = content.replace(old_global, new_global, 1)
    print('updated window global in main.js')
else:
    print('window.SpiralView not found -- appending')
    content += "\nwindow.initSpiralView = initSpiral;"

with open('js/app/main.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote main.js')

# ── 3: patch ui.js — swap viewInits entry ──
with open('js/app/ui.js','r',encoding='utf-8') as f:
    content = f.read()

old_entry = "    spiral:    () => window.SpiralView?.mount(document.getElementById('view-spiral')),"
new_entry  = "    spiral:    () => window.initSpiralView && window.initSpiralView(),"

if old_entry in content:
    content = content.replace(old_entry, new_entry, 1)
    print('updated viewInits entry in ui.js')
else:
    print('viewInits anchor not found -- check ui.js spiral entry')
    import re
    m = re.search(r'spiral.*SpiralView', content)
    if m: print('found:', repr(content[m.start():m.start()+80]))

with open('js/app/ui.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote ui.js')
