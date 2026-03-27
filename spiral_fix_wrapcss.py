with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    s = f.read()

# The actual sp-ctrl string has padding in it -- use partial match
idx = s.find("'#sp-ctrl{")
if idx >= 0:
    # Find end of this string literal
    end = s.index("',", idx) + 2
    old = s[idx:end]
    new = "'#sp-canvas-wrap{flex:1;min-height:0;overflow:hidden;}'," + old
    s = s[:idx] + new + s[end:]
    print('inserted canvas-wrap CSS before sp-ctrl')
    print('old:', repr(old[:60]))
else:
    print('sp-ctrl not found at all')

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(s)
print('wrote spiral.js')
