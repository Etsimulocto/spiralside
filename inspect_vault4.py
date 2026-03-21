# inspect_vault4.py — run from ~/spiralside
with open('js/app/views/vault.js','r',encoding='utf-8') as f: vv=f.read()
with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

print("=== views/vault.js FULL ===")
print(vv)

print("\n=== vault.js: initVault function ===")
idx=v.find('export function initVault')
idx2=v.find('\nexport function',idx+10)
print(v[idx:idx2 if idx2!=-1 else idx+600])

print("\n=== vault.js: onVaultOpen / window. assignments ===")
for line in v.split('\n'):
    if 'window.' in line or 'onVaultOpen' in line:
        print(' ',line)
