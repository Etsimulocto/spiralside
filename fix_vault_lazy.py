# fix_vault_lazy.py — run from ~/spiralside
# The freeze: renderVault inlines full base64 dataURLs for every image
# in the grid HTML. 2MB+ strings in innerHTML = browser lock.
#
# Fix:
# 1. renderVault grid uses a placeholder for images (no src= inline)
# 2. After render, load images lazily from IDB via blob URLs
# 3. handleFileInput stores images in IDB but keeps state entry lean
#    (content = '' for images, type flagged for lazy load)
# 4. showVaultPreview loads full content from IDB on demand

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()
with open('js/app/db.js','r',encoding='utf-8') as f: db=f.read()

# Check what dbGet looks like
print("=== db.js exports (first 20 lines) ===")
for i,l in enumerate(db.split('\n')[:20]): print(f"{i+1}: {l}")

# Check how dbSet is called currently
print("\n=== vault.js dbSet calls ===")
for line in v.split('\n'):
    if 'dbSet' in line or 'dbGet' in line or 'dbDelete' in line:
        print(' ', line.strip())
