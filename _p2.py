with open("index.html","r",encoding="utf-8") as f:
    src = f.read()

errors = []

# Step 1: Remove the padding/scroll from #codex-view CSS — make it just a flex shell
# (same as how .view works for store — the inner div does the scrolling)
old_css = '#codex-view { display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto !important; overflow-x:hidden; padding:12px 16px calc(80px + var(--safe-bot,0px)); -webkit-overflow-scrolling:touch; }'
new_css = '#codex-view { display:flex; flex-direction:column; overflow:hidden; }\n    #codex-scroll { flex:1; overflow-y:auto; overflow-x:hidden; padding:12px 16px calc(80px + var(--safe-bot,0px)); -webkit-overflow-scrolling:touch; min-height:0; }'

if old_css not in src:
    errors.append('CSS anchor not found')
    idx = src.find('#codex-view')
    print('Found:', repr(src[idx:idx+200]))
else:
    src = src.replace(old_css, new_css, 1)
    print('OK step 1: CSS')

# Step 2: Add inner scroll div — wrap the content inside view-codex
old_html = '  <div class="view" id="view-codex">\n      <div class="char-selector" id="char-selector">'
new_html = '  <div class="view" id="view-codex">\n    <div id="codex-scroll">\n      <div class="char-selector" id="char-selector">'

if old_html not in src:
    errors.append('HTML open anchor not found')
    idx = src.find('id="view-codex"')
    print('Found:', repr(src[idx:idx+200]))
else:
    src = src.replace(old_html, new_html, 1)
    print('OK step 2: open div')

# Step 3: Close the scroll div before closing view-codex
old_close = '      <div style="height:100px"></div>\n  </div>\n\n  <!-- VAULT VIEW -->'
new_close = '      <div style="height:100px"></div>\n    </div><!-- /#codex-scroll -->\n  </div>\n\n  <!-- VAULT VIEW -->'

if old_close not in src:
    errors.append('HTML close anchor not found')
    idx = src.find('height:100px')
    print('Found:', repr(src[idx-20:idx+150]))
else:
    src = src.replace(old_close, new_close, 1)
    print('OK step 3: close div')

if errors:
    print('ERRORS:', errors)
else:
    with open("index.html","w",encoding="utf-8",newline="\n") as f:
        f.write(src)
    print('\nAll done. git add index.html && git commit -m "fix: codex inner scroll div" && git push --force origin main')
