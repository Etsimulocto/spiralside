import sys
FILE = r"C:/Users/quart/spiralside/js/app/views/quest.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

OLD = """      } catch(_) {}"""

# There are potentially multiple — find the one right after opfsRead
idx = src.find("window.opfsRead('you_card_avatar.png')")
if idx < 0:
    print("MISS: opfsRead call")
    sys.exit(1)
catch_idx = src.find("} catch(_) {}", idx)
if catch_idx < 0:
    print("MISS: catch block")
    sys.exit(1)

OLD_SPECIFIC = src[catch_idx:catch_idx+15]
NEW_SPECIFIC = "} catch(_e) { if (_e && _e.name !== 'NotFoundError') console.warn('[quest] OPFS portrait read failed:', _e); }"

src = src[:catch_idx] + NEW_SPECIFIC + src[catch_idx+15:]
print("OK: silenced NotFoundError in quest.js OPFS fallback")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
