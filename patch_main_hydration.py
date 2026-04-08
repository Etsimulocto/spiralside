import sys
FILE = r"C:/Users/quart/spiralside/js/app/main.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Fix you_card hydration — only overwrite local if cloud is newer
OLD_YOU = """  // ── You card ──
  try {
    const cloudYou = await syncLoad('you_card');
    if (cloudYou && cloudYou.handle) {
      // Write into IDB via the already-open connection
      await dbSet('sheets', { ...cloudYou, id: 'you' });
      // Also patch CHARACTERS.you directly so UI reflects it immediately
      const { CHARACTERS: _C } = await import('./state.js');
      if (_C && _C.you) {
        Object.assign(_C.you, cloudYou);
        window._youHandle = cloudYou.handle || window._youHandle;
        try { renderActiveChar('you'); } catch(_) {}
      }
      console.log('[sync] you_card overlaid from cloud');
    }
  } catch(e) { console.warn('[sync] you_card overlay failed:', e); }"""

NEW_YOU = """  // ── You card ──
  try {
    const cloudYou = await syncLoad('you_card');
    if (cloudYou && cloudYou.handle) {
      // Only overwrite local if cloud is newer or local is missing/empty
      const localYou = await dbGet('sheets', 'you');
      const cloudTs = cloudYou.updated_at || cloudYou.created_at || '';
      const localTs = localYou?.updated_at || localYou?.created_at || '';
      // Skip if local has portrait and cloud doesn't (stripped), unless cloud is significantly newer
      const cloudStripped = cloudYou._images_stripped || cloudYou._has_portrait_base64;
      const localHasPortrait = localYou?.portrait_base64 && localYou.portrait_base64.length > 100;
      const cloudIsNewer = cloudTs > localTs;
      const shouldWrite = !localYou || !localYou.handle ||
        (cloudIsNewer && !(cloudStripped && localHasPortrait));
      if (shouldWrite) {
        // Preserve local portrait if cloud has none
        const merged = { ...cloudYou, id: 'you' };
        if (cloudStripped && localHasPortrait) {
          merged.portrait_base64 = localYou.portrait_base64;
          delete merged._has_portrait_base64;
          delete merged._images_stripped;
        }
        await dbSet('sheets', merged);
        const { CHARACTERS: _C } = await import('./state.js');
        if (_C && _C.you) {
          Object.assign(_C.you, merged);
          window._youHandle = merged.handle || window._youHandle;
          try { renderActiveChar('you'); } catch(_) {}
        }
        console.log('[sync] you_card overlaid from cloud (newer)');
      } else {
        // Cloud older or stripped — still patch CHARACTERS from local IDB
        if (localYou) {
          const { CHARACTERS: _C } = await import('./state.js');
          if (_C && _C.you) {
            Object.assign(_C.you, localYou);
            window._youHandle = localYou.handle || window._youHandle;
            try { renderActiveChar('you'); } catch(_) {}
          }
        }
        console.log('[sync] you_card kept local (local is newer or has portrait)');
      }
    }
  } catch(e) { console.warn('[sync] you_card overlay failed:', e); }"""

if OLD_YOU not in src:
    print("MISS: you_card hydration block")
    idx = src.find('you_card overlaid')
    print(repr(src[max(0,idx-200):idx+50]))
    sys.exit(1)
src = src.replace(OLD_YOU, NEW_YOU)
print("OK: you_card hydration — local portrait preserved, timestamp check")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
