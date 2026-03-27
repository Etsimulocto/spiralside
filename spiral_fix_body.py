with open('index.html','r',encoding='utf-8') as f:
    content = f.read()

old = "    html, body {\n      height: 100%; background: var(--bg); color: var(--text);\n      font-family: var(--font-ui); overflow: hidden;\n      -webkit-font-smoothing: antialiased;\n    }"
new = "    html, body {\n      height: 100%; background: var(--bg); color: var(--text);\n      font-family: var(--font-ui); overflow: hidden;\n      -webkit-font-smoothing: antialiased;\n      display: flex; flex-direction: column;\n    }"

if old in content:
    content = content.replace(old, new, 1)
    print('patched body to display:flex flex-direction:column')
else:
    print('ANCHOR NOT FOUND')
    idx = content.find('html, body')
    print(repr(content[idx:idx+150]))

with open('index.html','w',encoding='utf-8') as f:
    f.write(content)
print('wrote index.html')
