# Fix spiral CSS to match guide.js pattern exactly:
# #view-spiral.active { display:flex; flex-direction:column; overflow:hidden; flex:1; }
# NOT on #sp-inner

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    s = f.read()

old = "    '#sp-inner{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;}',\n"
new = (
    "    '#view-spiral.active{display:flex;flex-direction:column;overflow:hidden;flex:1;}',\n"
    "    '#sp-inner{display:flex;flex-direction:column;height:100%;}',\n"
)

if old in s:
    s = s.replace(old, new, 1)
    print('fixed: view-spiral.active CSS added, sp-inner simplified')
else:
    print('anchor not found -- showing area:')
    idx = s.find('sp-inner')
    print(repr(s[max(0,idx-5):idx+80]))

with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
    f.write(s)
print('wrote spiral.js')

import subprocess
subprocess.run('git add js/app/views/spiral.js && git commit -m "fix: spiral CSS matches guide.js pattern" && git push --force origin main', shell=True)
