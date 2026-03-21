with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Show sky CSS block
i = html.find('LIVING SKY')
if i != -1:
    print("=== SKY CSS ===")
    print(repr(html[i:i+500]))
    print()

# Show #app-header CSS
i2 = html.find('#app-header {')
if i2 != -1:
    print("=== #app-header CSS ===")
    print(repr(html[i2:i2+400]))
    print()

# Show the canvas HTML in context
i3 = html.find('sky-canvas')
while i3 != -1:
    tag_start = html.rfind('<', 0, i3)
    print(f"=== sky-canvas HTML @ {i3} ===")
    print(repr(html[tag_start:i3+200]))
    print()
    i3 = html.find('sky-canvas', i3+1)

# Show screen-app CSS
i4 = html.find('#screen-app')
if i4 != -1:
    print("=== #screen-app CSS ===")
    print(repr(html[i4:i4+300]))
