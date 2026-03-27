with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

old = "    canvas.height = v ? (v.offsetHeight - 220) : (window.innerHeight - 220);\n    if(canvas.height<100) canvas.height = window.innerHeight - 220;"
new = "    canvas.height = window.innerHeight - 220;"

if old in content:
    content = content.replace(old, new, 1)
    print('fixed height')
else:
    print('anchor not found -- searching')
    idx = content.find('canvas.height')
    print(repr(content[idx:idx+120]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
