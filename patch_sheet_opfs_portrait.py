import sys
FILE = r"C:/Users/quart/spiralside/js/app/sheet.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Find the avatar upload handler and add OPFS save + syncSave after IDB write
OLD = """          // Persist — add portrait to IDB record
          const { dbSet: _dbSet } = await import('./db.js');
          await _dbSet('sheets', {
            id: 'you',
            arc:             char.arc,
            traits:          char.traits,
            handle:          char.handle,
            vibe:            char.vibe,
            song:            char.song,
            portrait_base64: ev.target.result,
          });
          // Feedback"""

NEW = """          // Persist — add portrait to IDB record
          const { dbSet: _dbSet } = await import('./db.js');
          await _dbSet('sheets', {
            id: 'you',
            arc:             char.arc,
            traits:          char.traits,
            handle:          char.handle,
            vibe:            char.vibe,
            song:            char.song,
            portrait_base64: ev.target.result,
          });
          // Save portrait to OPFS — survives cloud hydration overwrites
          try {
            if (window.opfsWrite) {
              const _res  = await fetch(ev.target.result);
              const _blob = await _res.blob();
              await window.opfsWrite('you_card_avatar.png', _blob);
              console.log('[sheet] portrait saved to OPFS');
            }
          } catch(_e) { console.warn('[sheet] OPFS portrait save failed:', _e); }
          // Also sync to cloud (stripped) so text fields update
          const { syncSave: _syncSave } = await import('./sync.js');
          _syncSave('you_card', Object.assign({}, char, {
            id: 'you', portrait_base64: ev.target.result
          })).catch(() => {});
          // Feedback"""

if OLD not in src:
    print("MISS: avatar upload handler")
    idx = src.find('portrait_base64: ev.target.result')
    print(repr(src[max(0,idx-200):idx+100]))
    sys.exit(1)

src = src.replace(OLD, NEW)
print("OK: portrait upload saves to OPFS + cloud")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
