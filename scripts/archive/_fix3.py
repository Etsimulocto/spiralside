import pathlib
f = pathlib.Path("js/app/card.js")
src = f.read_text(encoding="utf-8").replace("\r\n","\n")
OLD = "                 || (typeof CHARACTERS !== 'undefined' && CHARACTERS.you?.handle)\n                 || 'you';"
NEW = "                 || (typeof window !== 'undefined' && window._youHandle)\n                 || 'unknown';"
if OLD in src:
    f.write_text(src.replace(OLD,NEW,1),encoding="utf-8")
    print("OK: card.js")
else:
    print("NOT FOUND")
    idx = src.find("_youHandle")
    print(repr(src[max(0,idx-50):idx+80]))
