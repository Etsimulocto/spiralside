with open("index.html","r",encoding="utf-8") as f:
    src = f.read()

# Root cause: .view { overflow:hidden } beats #codex-view's overflow-y:auto
# Fix: !important on overflow-y to override the .view class rule

old = '#codex-view { display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto; padding:12px 16px calc(80px + var(--safe-bot,0px)); -webkit-overflow-scrolling:touch; }'
new = '#codex-view { display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto !important; overflow-x:hidden; padding:12px 16px calc(80px + var(--safe-bot,0px)); -webkit-overflow-scrolling:touch; }'

if old not in src:
    print("ANCHOR NOT FOUND")
    idx = src.find('#codex-view')
    print(repr(src[idx:idx+200]))
else:
    with open("index.html","w",encoding="utf-8",newline="\n") as f:
        f.write(src.replace(old, new, 1))
    print("OK")
