# Replace resize() with hardcoded window dimensions — no DOM measurement at all

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

old = "  function resize() {\n    if (!canvas) return;\n    const rect = canvas.parentElement.getBoundingClientRect();\n    canvas.width  = rect.width  || 340;\n    canvas.height = rect.height || 340;\n  }"
new = (
    "  function resize() {\n"
    "    if (!canvas) return;\n"
    "    // Use window dims minus controls height (~180px) and tab bar (~50px)\n"
    "    canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth  || window.innerWidth;\n"
    "    canvas.height = canvas.offsetHeight || canvas.parentElement.offsetHeight || (window.innerHeight - 230);\n"
    "    if (canvas.width  < 10) canvas.width  = window.innerWidth;\n"
    "    if (canvas.height < 10) canvas.height = window.innerHeight - 230;\n"
    "  }"
)

if old in content:
    content = content.replace(old, new, 1)
    print('patched resize()')
else:
    print('ANCHOR NOT FOUND')
    idx = content.find('function resize')
    print(repr(content[idx:idx+200]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
