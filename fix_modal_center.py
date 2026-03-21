with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# Fix modal: center it (not bottom-anchored) and constrain width to app width
OLD = ("  modal.style.cssText = [\n"
       "    'position:fixed', 'inset:0', 'z-index:9000',\n"
       "    'background:rgba(10,10,15,0.88)', 'backdrop-filter:blur(6px)',\n"
       "    'display:flex', 'align-items:flex-end', 'justify-content:center'\n"
       "  ].join(';');")

NEW = ("  modal.style.cssText = [\n"
       "    'position:fixed', 'inset:0', 'z-index:9000',\n"
       "    'background:rgba(10,10,15,0.88)', 'backdrop-filter:blur(6px)',\n"
       "    'display:flex', 'align-items:center', 'justify-content:center',\n"
       "    'padding:20px'\n"
       "  ].join(';');")

if OLD in v:
    v = v.replace(OLD, NEW, 1)
    print('✓ Fixed modal: centered + padded')
else:
    print('ANCHOR NOT FOUND — trying simpler replace')
    v = v.replace("'align-items:flex-end'", "'align-items:center'", 1)
    v = v.replace("'justify-content:center'\n  ].join(';');",
                  "'justify-content:center',\n    'padding:20px'\n  ].join(';');", 1)
    print('✓ Applied fallback centering fix')

# Also fix panel: remove bottom-only border-radius, add full radius + max-height for centered display
OLD_PANEL = "border-radius:20px 20px 0 0;"
NEW_PANEL = "border-radius:12px;"
v = v.replace(OLD_PANEL, NEW_PANEL, 1)
print('✓ Fixed panel border-radius for centered display')

open('js/app/vault.js','w',encoding='utf-8').write(v)
print('✓ vault.js written')
