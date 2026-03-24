
f = open('C:/Users/quart/spiralside/js/app/views/quest.js','r',encoding='utf-8')
s = f.read(); f.close()

OLD = "  if (_initialized) return;\n  _initialized = true;\n\n  injectQuestStyles();"
NEW = "  _initialized = true;\n\n  injectQuestStyles();"

if '_initialized) return' not in s:
    print('SKIP: guard already removed')
elif OLD not in s:
    print('ERR: anchor not found')
    idx = s.find('_initialized')
    print(repr(s[idx:idx+120]))
else:
    s = s.replace(OLD, NEW, 1)
    open('C:/Users/quart/spiralside/js/app/views/quest.js','w',encoding='utf-8').write(s)
    print('OK: _initialized guard removed — quest re-renders on every tab open')
