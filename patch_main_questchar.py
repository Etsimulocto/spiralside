import sys
FILE = r"C:/Users/quart/spiralside/js/app/main.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Fix: quest_char hydration should not overwrite local if local has better stats
OLD = """  try {
    if (!localStorage.getItem('ss_quest_char')) {
      const cloudChar = await syncLoad('quest_char');
      if (cloudChar) {
        localStorage.setItem('ss_quest_char', JSON.stringify(cloudChar));
        console.log('[sync] quest_char hydrated from cloud');
      }
    }
  } catch(e) { console.warn('[sync] quest_char hydration failed:', e); }"""

NEW = """  try {
    const cloudChar = await syncLoad('quest_char');
    if (cloudChar) {
      const localRaw = localStorage.getItem('ss_quest_char');
      const localChar = localRaw ? JSON.parse(localRaw) : null;
      // Only write cloud char if local is missing OR cloud has strictly higher total stats
      // This prevents cloud (which may be older/stripped) from overwriting battle progress
      const cloudTotal = (cloudChar.atk||0) + (cloudChar.def||0) + (cloudChar.wit||0) + (cloudChar.luk||0);
      const localTotal = localChar ? ((localChar.atk||0) + (localChar.def||0) + (localChar.wit||0) + (localChar.luk||0)) : -1;
      if (!localChar || cloudTotal > localTotal) {
        localStorage.setItem('ss_quest_char', JSON.stringify(cloudChar));
        console.log('[sync] quest_char hydrated from cloud (stats:', cloudTotal.toFixed(1), ')');
      } else {
        console.log('[sync] quest_char kept local (local stats:', localTotal.toFixed(1), '> cloud:', cloudTotal.toFixed(1), ')');
      }
    }
  } catch(e) { console.warn('[sync] quest_char hydration failed:', e); }"""

if OLD not in src:
    print("MISS: quest_char hydration block")
    idx = src.find('quest_char')
    print(repr(src[max(0,idx-50):idx+200]))
    sys.exit(1)

src = src.replace(OLD, NEW)
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
