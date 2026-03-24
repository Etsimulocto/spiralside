
path = "js/app/sheet.js"
src = open(path, encoding="utf-8").read()

OLD = "    const thread = Array.from(messages).map(m => {"
NEW = "    const thread = Array.from(messages).filter(m => m && m.querySelector).map(m => {"

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK")
