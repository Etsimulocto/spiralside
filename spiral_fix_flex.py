with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

# Fix spiral-root: height:100% -> flex:1, and sp-canvas-wrap needs flex:1 min-height:0
old = "'#spiral-root{display:flex;flex-direction:column;height:100%;background:var(--bg,#0a0a0f);overflow:hidden;}'"
new = "'#spiral-root{display:flex;flex-direction:column;flex:1;min-height:0;background:var(--bg,#0a0a0f);overflow:hidden;}'"

if old in content:
    content = content.replace(old, new, 1)
    print('fixed spiral-root: height:100% -> flex:1 min-height:0')
else:
    print('ANCHOR NOT FOUND -- trying partial match')
    idx = content.find('spiral-root{display:flex')
    if idx >= 0:
        print(repr(content[idx:idx+80]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote spiral.js')
