
path = "js/app/sheet.js"
src = open(path, encoding="utf-8").read()

# Move download to fire immediately at top of saveSummarize, before any early returns
OLD = """export async function saveSummarize() {"""

NEW = """export async function saveSummarize() {
  // ── DOWNLOAD FIRES IMMEDIATELY — before any early-return checks ──
  // This way the user always gets their backup regardless of chat state
  const _youChar = CHARACTERS['you'];
  if (_youChar) _downloadYouCard(_youChar);"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    # Also remove the old call at the end of the AI step so it doesn't double-fire
    OLD2 = "      if (id === 'you') _downloadYouCard(char);"
    if OLD2 in src:
        src = src.replace(OLD2, "      // download already fired at top of saveSummarize", 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK — download fires immediately on button press")
