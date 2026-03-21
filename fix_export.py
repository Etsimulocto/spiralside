with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# Check what's there
import re
fns = re.findall(r'(export\s+)?(?:async\s+)?function\s+(\w+)', v)
print("All functions:", [(e,n) for e,n in fns])

# Export removeFile if not already exported
if 'export function removeFile' in v or 'export async function removeFile' in v:
    print('removeFile already exported — problem is in main.js import')
    # Show main.js import line
    with open('js/app/main.js','r',encoding='utf-8') as f: m=f.read()
    for line in m.split('\n'):
        if 'vault' in line and 'import' in line:
            print('IMPORT LINE:', repr(line))
elif 'async function removeFile' in v:
    v = v.replace('async function removeFile', 'export async function removeFile', 1)
    open('js/app/vault.js','w',encoding='utf-8').write(v)
    print('PATCHED: exported async removeFile')
elif 'function removeFile' in v:
    v = v.replace('function removeFile', 'export function removeFile', 1)
    open('js/app/vault.js','w',encoding='utf-8').write(v)
    print('PATCHED: exported removeFile')
else:
    print('removeFile NOT DEFINED in vault.js — need to add it')
    # Show what main.js imports from vault
    with open('js/app/main.js','r',encoding='utf-8') as f: m=f.read()
    for line in m.split('\n'):
        if 'vault' in line and 'import' in line:
            print('IMPORT LINE:', repr(line))
