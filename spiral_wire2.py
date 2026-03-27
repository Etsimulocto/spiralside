with open('js/app/main.js','r',encoding='utf-8') as f:
    s = f.read()

# Check specifically for spiral.js import, not spiralcut
if "from './views/spiral.js'" in s:
    print('already wired')
else:
    IMPORT_ANCHOR = 'import { initParticles } from "./particles.js";'
    GLOBAL_ANCHOR = 'window.initGuideView      = initGuide;'
    
    if IMPORT_ANCHOR in s:
        idx = s.index(IMPORT_ANCHOR) + len(IMPORT_ANCHOR)
        s = s[:idx] + "\nimport { initSpiral }      from './views/spiral.js';" + s[idx:]
        print('import added')
    else:
        print('IMPORT ANCHOR NOT FOUND -- check:')
        print(repr(s[60:120]))

    if GLOBAL_ANCHOR in s:
        idx = s.index(GLOBAL_ANCHOR) + len(GLOBAL_ANCHOR)
        s = s[:idx] + "\nwindow.initSpiralView     = initSpiral;" + s[idx:]
        print('global added')
    else:
        print('GLOBAL ANCHOR NOT FOUND')

    with open('js/app/main.js','w',encoding='utf-8') as f:
        f.write(s)
    print('wrote main.js')
