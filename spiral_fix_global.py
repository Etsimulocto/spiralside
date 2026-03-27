# Remove window.initSpiralView from inside buyGift, place it at top level

with open('js/app/main.js','r',encoding='utf-8') as f:
    content = f.read()

# Remove the misplaced line
bad = "\nwindow.initSpiralView = initSpiral;"
if content.count(bad) == 1:
    content = content.replace(bad, '', 1)
    print('removed misplaced window.initSpiralView')
else:
    print('found', content.count(bad), 'occurrences')

# Place it right after the import line which we know is line 3
anchor = "import { initSpiral }   from './views/spiral.js';"
if anchor in content:
    idx = content.index(anchor) + len(anchor)
    content = content[:idx] + "\nwindow.initSpiralView = initSpiral;" + content[idx:]
    print('placed window.initSpiralView right after import')
else:
    print('import anchor not found')

with open('js/app/main.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote main.js')
