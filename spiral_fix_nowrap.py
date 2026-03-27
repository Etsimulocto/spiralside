# Fix: remove #sp-wrap, inject directly into container
# The .view shell handles all sizing -- module just needs display:flex;flex-direction:column;overflow:hidden
# Pattern from handoffs: same as cut.js, account.js etc

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    s = f.read()

# Replace sp-wrap in buildDOM innerHTML
s = s.replace(
    "    container.innerHTML=\n      '<div id=\"sp-wrap\">'",
    "    container.innerHTML=\n      ''"
)
s = s.replace(
    "      +'</div></div>';",
    "      +'</div>';"
)

# Fix CSS -- remove sp-wrap rule, add view rule
s = s.replace(
    "      '#sp-wrap{display:flex;flex-direction:column;flex:1;min-height:0;background:var(--bg,#0a0a0f);overflow:hidden;}',",
    "      '#view-spiral{display:flex;flex-direction:column;overflow:hidden;background:var(--bg,#0a0a0f);}',\n      '#sp-presets{flex-shrink:0;}',\n      '#sp-canvas{flex:1;min-height:0;display:block;width:100%;}',\n      '#sp-ctrl{flex-shrink:0;}',",
)

# Fix setSize to use container dimensions properly
s = s.replace(
    "    canvas.width  = window.innerWidth;\n    canvas.height = window.innerHeight - 220;\n    // Also set CSS size so the element actually takes up space\n    canvas.style.width  = canvas.width  + 'px';\n    canvas.style.height = canvas.height + 'px';",
    "    const v=document.getElementById('view-spiral');\n    canvas.width  = v.offsetWidth  || window.innerWidth;\n    canvas.height = v.offsetHeight - 220;\n    if(canvas.height<100) canvas.height = window.innerHeight - 220;"
)

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(s)
print('wrote spiral.js')
