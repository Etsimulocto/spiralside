# Fix 1: revert body flex change (broke everything)
# Fix 2: spiral inner wrapper needs flex:1 min-height:0 -- never touch #view-spiral directly

with open('index.html','r',encoding='utf-8') as f:
    content = f.read()

# Revert body flex
bad = "    html, body {\n      height: 100%; background: var(--bg); color: var(--text);\n      font-family: var(--font-ui); overflow: hidden;\n      -webkit-font-smoothing: antialiased;\n      display: flex; flex-direction: column;\n    }"
good = "    html, body {\n      height: 100%; background: var(--bg); color: var(--text);\n      font-family: var(--font-ui); overflow: hidden;\n      -webkit-font-smoothing: antialiased;\n    }"

if bad in content:
    content = content.replace(bad, good, 1)
    print('reverted body flex')
else:
    print('body flex already reverted or not found')

with open('index.html','w',encoding='utf-8') as f:
    f.write(content)

# Fix spiral.js -- inner scroll wrapper gets flex:1 min-height:0
# canvas sits inside a wrapper div, not directly in view
with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    s = f.read()

# Fix injectCSS -- the canvas wrapper needs flex:1 min-height:0
# and the controls get flex-shrink:0
old_canvas = "      '#sp-canvas{display:block;flex-shrink:0;}',\n"
new_canvas  = "      '#sp-canvas{display:block;width:100%;height:100%;}',\n"

# Add a wrapper div around canvas that takes the flex space
old_ctrl = "      '#sp-ctrl{flex-shrink:0;}',\n"
new_ctrl  = "      '#sp-canvas-wrap{flex:1;min-height:0;overflow:hidden;position:relative;}',\n      '#sp-ctrl{flex-shrink:0;}',\n"

if old_canvas in s:
    s = s.replace(old_canvas, new_canvas, 1)
    print('fixed canvas CSS')
else:
    print('canvas CSS anchor not found')

if old_ctrl in s:
    s = s.replace(old_ctrl, new_ctrl, 1)
    print('added canvas-wrap CSS')
else:
    print('ctrl anchor not found')

# Wrap canvas in sp-canvas-wrap in buildDOM
old_dom = "      +'<canvas id=\"sp-canvas\"></canvas>'"
new_dom  = "      +'<div id=\"sp-canvas-wrap\"><canvas id=\"sp-canvas\" style=\"width:100%;height:100%;\"></canvas></div>'"

if old_dom in s:
    s = s.replace(old_dom, new_dom, 1)
    print('wrapped canvas in sp-canvas-wrap')
else:
    print('canvas dom anchor not found')

# Fix setSize to use wrapper dimensions
old_size = "    const v=document.getElementById('view-spiral');\n    canvas.width  = v.offsetWidth  || window.innerWidth;\n    canvas.height = v.offsetHeight - 220;\n    if(canvas.height<100) canvas.height = window.innerHeight - 220;"
new_size  = "    const wrap=document.getElementById('sp-canvas-wrap');\n    if(!wrap)return;\n    canvas.width  = wrap.offsetWidth  || window.innerWidth;\n    canvas.height = wrap.offsetHeight || (window.innerHeight - 220);\n    if(canvas.height<50) canvas.height = window.innerHeight - 220;"

if old_size in s:
    s = s.replace(old_size, new_size, 1)
    print('fixed setSize to use sp-canvas-wrap')
else:
    print('setSize anchor not found')
    idx = s.find('function setSize')
    print(repr(s[idx:idx+200]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(s)
print('wrote spiral.js')
