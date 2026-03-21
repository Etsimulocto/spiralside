with open("index.html","r",encoding="utf-8") as f:
    src = f.read()

# The view shell should NOT be overflow:hidden — it needs to scroll itself
# Store view pattern: just overflow-y:auto on the view, no inner wrapper needed
# The char-selector stays sticky at top via position:sticky if needed later

old = '#codex-view { display:flex; flex-direction:column; height:100%; overflow:hidden; }'
new = '#codex-view { display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto; padding:12px 16px calc(80px + var(--safe-bot,0px)); -webkit-overflow-scrolling:touch; }'

if old not in src:
    print("ANCHOR NOT FOUND")
    # show what's there
    idx = src.find('#codex-view')
    print(repr(src[idx:idx+120]))
else:
    with open("index.html","w",encoding="utf-8",newline="\n") as f:
        f.write(src.replace(old, new, 1))
    print("OK — codex-view now scrolls")
    print()
    print('git add . && git commit -m "fix: codex view overflow-y auto, direct scroll" && git push --force origin main')
