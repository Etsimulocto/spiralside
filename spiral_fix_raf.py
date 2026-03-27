# Fix: double-rAF so browser has fully painted .active before resize runs

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

old = (
    "    // defer loop start so .active class is applied and container has dimensions\n"
    "    requestAnimationFrame(() => { resize(); loop(); });"
)
new = (
    "    // double-rAF: first frame applies .active, second frame has real dimensions\n"
    "    requestAnimationFrame(() => requestAnimationFrame(() => { resize(); loop(); }));"
)

if old in content:
    content = content.replace(old, new, 1)
    print('patched: double rAF')
else:
    print('ANCHOR NOT FOUND -- searching...')
    idx = content.find('requestAnimationFrame')
    print(repr(content[idx:idx+120]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
