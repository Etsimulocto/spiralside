# Add initSpiral import + global to main.js
# Anchors verified from actual file content

with open('js/app/main.js','r',encoding='utf-8') as f:
    s = f.read()

# Check exact anchor
IMPORT_ANCHOR = 'import { initParticles } from "./particles.js";'
GLOBAL_ANCHOR = 'window.initGuideView      = initGuide;'

if 'initSpiral' in s and 'initSpiralCut' not in s.replace('initSpiralCutView',''):
    print('initSpiral already there')
elif "from './views/spiral.js'" in s:
    print('spiral.js import already present')
else:
    if IMPORT_ANCHOR in s:
        idx = s.index(IMPORT_ANCHOR) + len(IMPORT_ANCHOR)
        s = s[:idx] + "\nimport { initSpiral }      from './views/spiral.js';" + s[idx:]
        print('import added')
    else:
        print('IMPORT ANCHOR NOT FOUND')

    if GLOBAL_ANCHOR in s:
        idx = s.index(GLOBAL_ANCHOR) + len(GLOBAL_ANCHOR)
        s = s[:idx] + "\nwindow.initSpiralView     = initSpiral;" + s[idx:]
        print('global added')
    else:
        print('GLOBAL ANCHOR NOT FOUND')

    with open('js/app/main.js','w',encoding='utf-8') as f:
        f.write(s)
    print('wrote main.js')

# Verify
import subprocess
r = subprocess.run('grep -n "initSpiral" js/app/main.js', shell=True, capture_output=True, text=True)
print(r.stdout)
