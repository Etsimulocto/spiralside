import os, re

# Find ui.js
ui_path = None
for dirpath, dirs, files in os.walk('js'):
    for fn in files:
        if fn == 'ui.js':
            ui_path = os.path.join(dirpath, fn)
            break

if not ui_path:
    print('ERROR: ui.js not found')
    exit()

print(f'[found] {ui_path}')

with open(ui_path, 'r', encoding='utf-8') as f:
    ui = f.read()

# Show switchView function
m = re.search(r'(function switchView|switchView\s*=)', ui)
if m:
    print('[switchView context]:')
    print(repr(ui[m.start():m.start()+400]))
else:
    print('[no switchView found] — showing all function names:')
    for fm in re.finditer(r'(?:function\s+\w+|const\s+\w+\s*=)', ui):
        print(' ', repr(ui[fm.start():fm.start()+50]))
