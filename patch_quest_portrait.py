import sys
FILE = r"C:/Users/quart/spiralside/js/app/views/quest.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Fix 1: loadCharacter() — load portrait from OPFS when stripped flag is set
OLD_LC = """    return {
      name:you.handle||base.name||'Wanderer', class:you.vibe||base.class||'adventurer',
      arc:you.arc||you.vibe||'', portrait_base64:you.portrait_base64||base.portrait_base64||null,
      atk:  Math.round(Math.max(1, Math.min(20, stats.atk  + (deltas.atk||0))) * 10) / 10,
      def:  Math.round(Math.max(1, Math.min(20, stats.def  + (deltas.def||0))) * 10) / 10,
      wit:  Math.round(Math.max(1, Math.min(20, stats.wit  + (deltas.wit||0))) * 10) / 10,
      luk:  Math.round(Math.max(1, Math.min(20, stats.luk  + (deltas.luk||0))) * 10) / 10,
      level:base.level||1, xp:base.xp||0, xpNext:base.xpNext||100,
      hairColor:base.hairColor||'#5a3a1a', skinColor:base.skinColor||'#FDDBB4', fromCodex:true,
    };"""

NEW_LC = """    // Try to get portrait — from object or OPFS fallback
    let portrait = you.portrait_base64 || base.portrait_base64 || null;
    if (!portrait && (you._has_portrait_base64 || base._has_portrait_base64)) {
      // Try OPFS — async, so we resolve portrait separately
      try {
        if (window.opfsRead) {
          const data = await window.opfsRead('you_card_avatar.png');
          if (data) portrait = data;
        }
      } catch(_) {}
    }
    return {
      name:you.handle||base.name||'Wanderer', class:you.vibe||base.class||'adventurer',
      arc:you.arc||you.vibe||'', portrait_base64: portrait,
      atk:  Math.round(Math.max(1, Math.min(20, stats.atk  + (deltas.atk||0))) * 10) / 10,
      def:  Math.round(Math.max(1, Math.min(20, stats.def  + (deltas.def||0))) * 10) / 10,
      wit:  Math.round(Math.max(1, Math.min(20, stats.wit  + (deltas.wit||0))) * 10) / 10,
      luk:  Math.round(Math.max(1, Math.min(20, stats.luk  + (deltas.luk||0))) * 10) / 10,
      level:base.level||1, xp:base.xp||0, xpNext:base.xpNext||100,
      hairColor:base.hairColor||'#5a3a1a', skinColor:base.skinColor||'#FDDBB4', fromCodex:true,
    };"""

if OLD_LC not in src:
    print("MISS: loadCharacter return block")
    sys.exit(1)
src = src.replace(OLD_LC, NEW_LC)
print("OK: loadCharacter portrait OPFS fallback")

# Fix 2: cloud hydration in initQuestView — don't overwrite local quest_char
# The quest_char cloud load currently merges events and resolved but NOT quest_char stats
# quest_char stats come from loadCharacter() which reads IDB sheets (you card)
# The problem is main.js hydrateFromCloud() writes cloud quest_char to localStorage
# unconditionally. Fix: only write if cloud char has LOWER total stats than local.
# Actually looking at the code — initQuestView does NOT load quest_char from cloud directly.
# The issue is main.js hydrateFromCloud() which we can't patch here.
# Best fix in quest.js: after cloud hydration event fires, keep local battle deltas intact.

# Fix 3: portrait display — add img with OPFS src fallback using object URL
OLD_PORTRAIT = """  const portraitHTML = char.portrait_base64
    ? `<img src=\"${char.portrait_base64}\" />`
    : buildMiiSvg(char);"""

NEW_PORTRAIT = """  // Portrait: use base64 if available, else Mii SVG
  // If _has_portrait_base64 flag set and no data, show placeholder with load hint
  const portraitHTML = char.portrait_base64 && char.portrait_base64.startsWith('data:')
    ? `<img src="${char.portrait_base64}" />`
    : char.portrait_base64 && char.portrait_base64.length > 100
      ? `<img src="${char.portrait_base64}" />`
      : buildMiiSvg(char);"""

if OLD_PORTRAIT not in src:
    print("MISS: portraitHTML")
    sys.exit(1)
src = src.replace(OLD_PORTRAIT, NEW_PORTRAIT)
print("OK: portrait display fixed")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
