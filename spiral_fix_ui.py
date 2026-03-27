# Fix ui.js: remove bad spiral entry at line 117, add it inside viewInits

with open('js/app/ui.js','r',encoding='utf-8') as f:
    content = f.read()

bad = "\n  'spiral':     () => window.SpiralView?.mount(document.getElementById('view-spiral')),"
if bad in content:
    content = content.replace(bad, '', 1)
    print('removed bad entry')
else:
    print('bad line not found')

ANCHOR = "    pi:        () => window.initPiView       && window.initPiView(),\n  };"
REPLACEMENT = "    pi:        () => window.initPiView       && window.initPiView(),\n    spiral:    () => window.SpiralView?.mount(document.getElementById('view-spiral')),\n  };"

if 'spiral' in content:
    print('spiral already in viewInits, skipping')
elif ANCHOR in content:
    content = content.replace(ANCHOR, REPLACEMENT, 1)
    print('spiral entry added inside viewInits')
else:
    print('ANCHOR NOT FOUND -- paste output of: grep -n "pi:" js/app/ui.js')

with open('js/app/ui.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote js/app/ui.js')
