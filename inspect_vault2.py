# Run from ~/spiralside
# Check: 1) how add-file-btn is wired, 2) where vault CSS lives

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()
with open('js/app/views/vault.js','r',encoding='utf-8') as f: vv=f.read()

print("=== vault.js: add-file-btn wiring ===")
for kw in ['add-file-btn','file-input','addEventListener']:
    idx=v.find(kw)
    if idx!=-1:
        print(f"  [{kw}]:", repr(v[max(0,idx-40):idx+80]))

print("\n=== views/vault.js: button IDs in HTML ===")
for kw in ['add-file-btn','file-input','open-folder-btn']:
    idx=vv.find(kw)
    print(f"  [{kw}]:", 'FOUND' if idx!=-1 else 'MISSING')

print("\n=== CSS: where is vault-toolbar defined? ===")
import os
for root,dirs,files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['node_modules','.git']]
    for fn in files:
        if not (fn.endswith('.css') or fn.endswith('.js') or fn.endswith('.html')): continue
        p = os.path.join(root,fn)
        try:
            s = open(p,'r',encoding='utf-8',errors='ignore').read()
        except: continue
        if 'vault-toolbar' in s or 'vault-btn' in s:
            print(f"  FOUND in {p}")
            idx=s.find('vault-toolbar')
            if idx==-1: idx=s.find('vault-btn')
            print("  ", repr(s[max(0,idx-20):idx+120]))
