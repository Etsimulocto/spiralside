import os, re

ROOT = os.getcwd()

# Search all JS files for app-header
for dirpath, dirs, files in os.walk(os.path.join(ROOT, 'js')):
    for fn in files:
        if not fn.endswith('.js'): continue
        fp = os.path.join(dirpath, fn)
        with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
            src = f.read()
        if 'app-header' in src:
            rel = os.path.relpath(fp, ROOT)
            # Find the lines around it
            for m in re.finditer(r'app-header', src):
                start = max(0, m.start()-80)
                end   = min(len(src), m.end()+200)
                print(f"\n=== {rel} @ char {m.start()} ===")
                print(repr(src[start:end]))
