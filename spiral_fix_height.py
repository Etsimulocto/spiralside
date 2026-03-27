# Fix: view-spiral needs height:100% so canvas parent has dimensions
# The .view class uses flex but screen-app height chain needs to reach it

with open('index.html','r',encoding='utf-8') as f:
    content = f.read()

# Give view-spiral explicit height so canvas can measure it
bad  = '<div id="view-spiral" class="view"></div>'
good = '<div id="view-spiral" class="view" style="height:100%;overflow:hidden;"></div>'

if bad in content:
    content = content.replace(bad, good, 1)
    print('patched view-spiral with height:100%')
else:
    print('ANCHOR NOT FOUND')
    import re
    m = re.search(r'view-spiral[^>]*>', content)
    if m: print('found:', repr(m.group()))

with open('index.html','w',encoding='utf-8') as f:
    f.write(content)
print('wrote index.html')
