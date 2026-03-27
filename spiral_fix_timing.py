with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    s = f.read()

# mount() currently calls setSize() synchronously -- wrap needs layout first
old = ("  function mount(container){\n"
       "    if(!container)return;\n"
       "    buildDOM(container);\n"
       "    initP();\n"
       "    applyPreset('sky');\n"
       "    // Set canvas size after DOM is built using window dims\n"
       "    setSize();\n"
       "    stopLoop(); loop();")

new = ("  function mount(container){\n"
       "    if(!container)return;\n"
       "    buildDOM(container);\n"
       "    initP();\n"
       "    applyPreset('sky');\n"
       "    // Defer setSize so CSS is applied and wrap has dimensions\n"
       "    setTimeout(()=>{ setSize(); stopLoop(); loop(); }, 0);")

if old in s:
    s = s.replace(old, new, 1)
    print('patched mount: deferred setSize+loop to setTimeout(0)')
else:
    print('ANCHOR NOT FOUND -- showing mount:')
    idx = s.find('function mount')
    print(repr(s[idx:idx+250]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(s)
print('wrote spiral.js')
