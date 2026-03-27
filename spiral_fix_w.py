with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

old = "    canvas.width  = v ? v.offsetWidth  : window.innerWidth;"
new = "    canvas.width  = window.innerWidth;"

if old in content:
    content = content.replace(old, new, 1)
    print('fixed width to window.innerWidth')
else:
    print('anchor not found')

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
