# run from ~/spiralside
with open('js/app/main.js','r',encoding='utf-8') as f: m=f.read()
with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

print("=== main.js vault imports ===")
import re
for line in m.split('\n'):
    if 'vault' in line.lower() and 'import' in line:
        print(' ', line)

print("\n=== vault.js exports ===")
for line in v.split('\n'):
    if line.startswith('export'):
        print(' ', line[:80])

print("\n=== main.js vault window exposures ===")
for line in m.split('\n'):
    if 'vault' in line.lower() and 'window' in line:
        print(' ', line)
