with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    s = f.read()

# Fix setSize -- it currently uses window.innerWidth and wrong height logic
# Replace entire setSize function content
import re
old = re.search(r'function setSize\(\)\{.*?\}', s, re.DOTALL)
if old:
    print('found setSize at', old.start(), repr(old.group()[:80]))
    new_fn = ("function setSize(){\n"
              "    if(!canvas)return;\n"
              "    const wrap=document.getElementById('sp-canvas-wrap');\n"
              "    if(!wrap)return;\n"
              "    canvas.width  = wrap.offsetWidth  || window.innerWidth;\n"
              "    canvas.height = wrap.offsetHeight || (window.innerHeight-220);\n"
              "    if(canvas.height<50) canvas.height=window.innerHeight-220;\n"
              "  }")
    s = s[:old.start()] + new_fn + s[old.end():]
    print('replaced setSize')
else:
    print('setSize not found via regex')

# Add canvas-wrap CSS -- find sp-ctrl line and insert before it
old_ctrl = "'#sp-ctrl{flex-shrink:0;}'"
new_ctrl  = "'#sp-canvas-wrap{flex:1;min-height:0;overflow:hidden;}','#sp-ctrl{flex-shrink:0;}'"
if old_ctrl in s:
    s = s.replace(old_ctrl, new_ctrl, 1)
    print('added canvas-wrap CSS')
else:
    print('sp-ctrl anchor not found')
    idx = s.find('sp-ctrl')
    print(repr(s[max(0,idx-20):idx+60]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(s)
print('wrote spiral.js')
