with open('index.html','r',encoding='utf-8') as f:
    content = f.read()

bad  = '<div id="view-spiral" class="view-panel"></div>'
good = '<div id="view-spiral" class="view"></div>'

if bad in content:
    content = content.replace(bad, good, 1)
    print('fixed: view-panel -> view')
else:
    print('ANCHOR NOT FOUND')

with open('index.html','w',encoding='utf-8') as f:
    f.write(content)
print('wrote index.html')
