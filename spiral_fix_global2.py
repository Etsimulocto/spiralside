with open('js/app/main.js','r',encoding='utf-8') as f:
    content = f.read()

# Remove from wrong spot (right after import)
bad = "\nwindow.initSpiralView = initSpiral;"
count = content.count(bad)
print(f'found {count} occurrences')
content = content.replace(bad, '', 1)

# Place after window.initGuideView which is the known anchor
anchor = "window.initGuideView      = initGuide;"
if anchor in content:
    idx = content.index(anchor) + len(anchor)
    content = content[:idx] + "\nwindow.initSpiralView     = initSpiral;" + content[idx:]
    print('placed after window.initGuideView')
else:
    print('ANCHOR NOT FOUND')

with open('js/app/main.js','w',encoding='utf-8') as f:
    f.write(content)
print('wrote main.js')
