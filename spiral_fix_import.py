# Fix: remove the misplaced SpiralView import and re-add it at the very top
# anchored after the first import line we know exists

with open('js/app/main.js','r',encoding='utf-8') as f:
    content = f.read()

# Remove wherever it currently is
bad = "\nimport { SpiralView }   from './views/spiral.js';"
if bad in content:
    content = content.replace(bad, '', 1)
    print('removed misplaced import')
else:
    print('import not found with that exact string -- searching...')
    idx = content.find('SpiralView')
    print(repr(content[max(0,idx-20):idx+60]))

# Also remove window.SpiralView if already there -- we'll re-add cleanly
bad2 = "\nwindow.SpiralView = SpiralView;"
if bad2 in content:
    content = content.replace(bad2, '', 1)
    print('removed misplaced window.SpiralView')

# Insert import after the very first import line in the file
ANCHOR = "import { initParticles } from \"./particles.js\";"
if ANCHOR in content:
    idx = content.index(ANCHOR) + len(ANCHOR)
    content = content[:idx] + "\nimport { SpiralView }   from './views/spiral.js';" + content[idx:]
    print('import added after particles.js import (line 2)')
else:
    # fallback: after first import line whatever it is
    import re
    m = re.search(r'^import .+;', content, re.MULTILINE)
    if m:
        content = content[:m.end()] + "\nimport { SpiralView }   from './views/spiral.js';" + content[m.end():]
        print('import added after first import line')
    else:
        content = "import { SpiralView }   from './views/spiral.js';\n" + content
        print('import prepended to file')

# Add window.SpiralView after last window. assignment
import re
win_matches = list(re.finditer(r'^window\.', content, re.MULTILINE))
if win_matches:
    last_end = content.index('\n', win_matches[-1].start())
    content = content[:last_end] + "\nwindow.SpiralView = SpiralView;" + content[last_end:]
    print('window.SpiralView added')
else:
    content += "\nwindow.SpiralView = SpiralView;"
    print('window.SpiralView appended')

with open('js/app/main.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote js/app/main.js')
print()
print('verify with: sed -n "1,8p" js/app/main.js')
