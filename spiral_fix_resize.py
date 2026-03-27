# Fix: spiral mount fires before view is visible, canvas gets 0x0
# Solution: defer mount via requestAnimationFrame so .active is set first,
# OR just call resize() after a short delay in the mount function.
# Cleanest fix: patch switchView to call SpiralView.resize after activating view.

# Actually simpler: patch spiral.js mount() to do resize after rAF

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

# Find the mount function and defer the loop start until after paint
bad  = "  function mount(container){\n    if(!container)return;\n    buildDOM(container); initParticles(); applyPreset('sky'); stopLoop(); loop();"
good = "  function mount(container){\n    if(!container)return;\n    buildDOM(container); initParticles(); applyPreset('sky'); stopLoop();\n    // defer loop start so .active class is applied and container has dimensions\n    requestAnimationFrame(() => { resize(); loop(); });"

if bad in content:
    content = content.replace(bad, good, 1)
    print('patched: mount defers loop to rAF')
else:
    print('ANCHOR NOT FOUND -- showing mount area:')
    idx = content.find('function mount')
    print(repr(content[idx:idx+200]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
