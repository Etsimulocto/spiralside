import sys
FILE = r"C:/Users/quart/spiralside/js/app/main.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

OLD = """      const id = rec.data.id || rec.data.card_id;
      if (!id) continue;
      const existing = await dbGet('prints', id);
      // Only write if cloud is newer or local has nothing
      if (!existing || (rec.updated_at && existing.updated_at && rec.updated_at > existing.updated_at) || !existing.updated_at) {
        await dbSet('prints', { ...rec.data, id });
      }"""

NEW = """      const id = rec.data.id || rec.data.card_id;
      if (!id) continue;
      const existing = await dbGet('prints', id);
      // Never overwrite local portrait with stripped cloud version
      const cloudStripped = rec.data._has_portrait_base64 || rec.data._images_stripped;
      const localHasPortrait = existing?.portrait_base64 && existing.portrait_base64.length > 100;
      if (cloudStripped && localHasPortrait) continue; // keep local
      // Only write if cloud is newer or local has nothing
      const cloudNewer = rec.updated_at && existing?.updated_at && rec.updated_at > existing.updated_at;
      if (!existing || cloudNewer || !existing.updated_at) {
        await dbSet('prints', { ...rec.data, id });
      }"""

if OLD not in src:
    print("MISS: print hydration block")
    idx = src.find("Only write if cloud is newer or local has nothing")
    print(repr(src[max(0,idx-200):idx+200]))
    sys.exit(1)

src = src.replace(OLD, NEW)
print("OK: print hydration — never strip local portrait")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
