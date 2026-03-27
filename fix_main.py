# Fix: remove the bad injected import line from inside the style import block
import re

with open('js/app/main.js','r',encoding='utf-8') as f:
    content = f.read()

bad = "\nimport { SpiralView }   from './views/spiral.js';"

# Remove the bad inline injection
if bad in content:
    content = content.replace(bad, '', 1)
    print('removed bad inline import')
else:
    print('bad line not found -- check manually')

# Now find the last top-level import (before any function/IIFE code)
# Top-level imports must be before any non-import code
# Find all import statements at start of lines
import_matches = list(re.finditer(r'^import\b', content, re.MULTILINE))
if not import_matches:
    print('no imports found!')
else:
    # Walk matches to find the last one that is actually top-level
    # (not inside a block -- crude check: no unmatched { before it)
    last_top = None
    for m in import_matches:
        before = content[:m.start()]
        # count braces before this import
        opens  = before.count('{')
        closes = before.count('}')
        if opens == closes:
            last_top = m
    
    if last_top is None:
        print('could not find top-level import -- appending at top')
        content = "import { SpiralView } from './views/spiral.js';\n" + content
    else:
        end = content.index('\n', last_top.start())
        # find end of that full import statement (may span lines)
        # scan forward until we hit the semicolon or closing }
        scan = end
        while scan < len(content):
            if content[scan] == ';':
                insert_at = scan + 1
                break
            scan += 1
        else:
            insert_at = end
        
        IMPORT = "\nimport { SpiralView }   from './views/spiral.js';"
        content = content[:insert_at] + IMPORT + content[insert_at:]
        print('import inserted after last top-level import at pos', insert_at)

# Also add window.SpiralView if missing
if 'window.SpiralView' not in content:
    win_matches = list(re.finditer(r'^window\.', content, re.MULTILINE))
    GLOBAL = "\nwindow.SpiralView = SpiralView;"
    if win_matches:
        last_w_end = content.index('\n', win_matches[-1].start())
        content = content[:last_w_end] + GLOBAL + content[last_w_end:]
        print('window.SpiralView added')
    else:
        content += GLOBAL
        print('window.SpiralView appended at end')
else:
    print('window.SpiralView already present')

with open('js/app/main.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote js/app/main.js')
