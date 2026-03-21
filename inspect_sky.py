import re

# Check index.html - show sky canvas injection and header CSS
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Show the sky canvas area
idx = html.find('sky-canvas')
if idx != -1:
    print("=== sky-canvas in HTML ===")
    print(repr(html[max(0,idx-100):idx+200]))
    print()

# Show sky CSS block
idx2 = html.find('LIVING SKY')
if idx2 != -1:
    print("=== sky CSS ===")
    print(repr(html[idx2:idx2+400]))
    print()

# Show app-header CSS
idx3 = html.find('#app-header')
if idx3 != -1:
    print("=== #app-header CSS ===")
    print(repr(html[idx3:idx3+300]))
    print()

# Check main.js for initSky
with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

print(f"initSky import in main.js: {'initSky' in main}")
print(f"initSky() call in main.js: {'initSky()' in main}")

# Show context around initSky call
idx4 = main.find('initSky()')
if idx4 != -1:
    print("=== initSky() call context ===")
    print(repr(main[max(0,idx4-150):idx4+80]))
