import urllib.request, os

with urllib.request.urlopen("https://raw.githubusercontent.com/Etsimulocto/spiralside/main/main.py") as r:
    src = r.read().decode("utf-8").replace("\r\n", "\n")
print("fetched", len(src), "bytes")

OLD = "    system = character_prompt if character_prompt else req.system_prompt"
NEW = "    if character_prompt:\n        system = req.system_prompt.rstrip() + \"\\n\\n---\\n\\n\" + character_prompt\n    else:\n        system = req.system_prompt"

if OLD not in src:
    idx = src.find("bot_name_lower")
    print("ANCHOR NOT FOUND, context:", repr(src[idx:idx+200]))
else:
    src = src.replace(OLD, NEW, 1)
    print("replaced")
    out = os.path.join(os.path.expanduser("~"), "spiralside", "main.py")
    open(out, "w", newline="\n").write(src)
    print("done - written to", out)
