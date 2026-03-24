# ============================================================
# SPIRALSIDE — QUEST + SCENE + WORLD SYNC PATCH
# 1. studio.js — syncSave for scenes and worlds
# 2. main.js   — hydrate scenes + worlds in hydrateDataFromCloud
# 3. quest.js  — re-render quest char after cloud hydration lands
# Run from ~/spiralside in Git Bash
# Nimbis anchor: patch_quest_scene_world.py
# ============================================================

import pathlib

BASE = pathlib.Path('C:/Users/quart/spiralside')
errors = []

def patch(filepath, old, new, label):
    f = BASE / filepath
    src = f.read_text(encoding='utf-8').replace('\r\n', '\n')
    if old not in src:
        errors.append(f'NOT FOUND [{label}] in {filepath}')
        print(f'  x NOT FOUND: {label}')
        return False
    result = src.replace(old, new, 1)
    f.write_text(result, encoding='utf-8')
    print(f'  OK PATCHED: {label}')
    return True


# ── 1. studio.js — add syncSave import ───────────────────────────────────────
print('\n[1/5] studio.js — add syncSave import')
patch(
    'js/app/views/studio.js',
    '// Nimbis anchor: js/app/views/studio.js',
    "// Nimbis anchor: js/app/views/studio.js\nimport { syncSave } from '../sync.js';",
    'studio.js — syncSave import'
)


# ── 2. studio.js — syncSave after dbSet scenes ───────────────────────────────
print('\n[2/5] studio.js — syncSave after scene save')
patch(
    'js/app/views/studio.js',
    "await dbSet('scenes', scene);\n    if (_sceneEditId) scenes = scenes.map(s => s.id === _sceneEditId ? scene : s);",
    "await dbSet('scenes', scene);\n    syncSave('scene_' + scene.id, scene).catch(() => {});  // cloud backup\n    if (_sceneEditId) scenes = scenes.map(s => s.id === _sceneEditId ? scene : s);",
    'studio.js — syncSave after scene dbSet'
)


# ── 3. studio.js — syncSave after dbSet worlds ───────────────────────────────
print('\n[3/5] studio.js — syncSave after world save')
patch(
    'js/app/views/studio.js',
    "await dbSet('worlds', world);\n    if (_worldEditId) worlds = worlds.map(w => w.id === _worldEditId ? world : w);",
    "await dbSet('worlds', world);\n    syncSave('world_' + world.id, world).catch(() => {});  // cloud backup\n    if (_worldEditId) worlds = worlds.map(w => w.id === _worldEditId ? world : w);",
    'studio.js — syncSave after world dbSet'
)


# ── 4. main.js — add scenes + worlds hydration to hydrateDataFromCloud ────────
print('\n[4/5] main.js — add scene + world hydration blocks')
patch(
    'js/app/main.js',
    "  // ── User prints ──",
    """  // ── Scenes ──
  try {
    const { syncLoadAll } = await import('./sync.js');
    const allRecs = await syncLoadAll();
    const sceneRecs = allRecs.filter(r => r.record_type.startsWith('scene_'));
    for (const rec of sceneRecs) {
      const id = rec.data?.id;
      if (!id) continue;
      const existing = await dbGet('scenes', id);
      if (!existing || !existing.created_at) {
        await dbSet('scenes', { ...rec.data, id });
      }
    }
    if (sceneRecs.length) console.log('[sync] ' + sceneRecs.length + ' scenes synced from cloud');
  } catch(e) { console.warn('[sync] scenes hydration failed:', e); }

  // ── Worlds ──
  try {
    const { syncLoadAll: _sla } = await import('./sync.js');
    const allRecs2 = await _sla();
    const worldRecs = allRecs2.filter(r => r.record_type.startsWith('world_'));
    for (const rec of worldRecs) {
      const id = rec.data?.id;
      if (!id) continue;
      const existing = await dbGet('worlds', id);
      if (!existing || !existing.created_at) {
        await dbSet('worlds', { ...rec.data, id });
      }
    }
    if (worldRecs.length) console.log('[sync] ' + worldRecs.length + ' worlds synced from cloud');
  } catch(e) { console.warn('[sync] worlds hydration failed:', e); }

  // ── User prints ──""",
    'main.js — scene + world hydration blocks'
)


# ── 5. main.js — re-render quest after hydrateDataFromCloud ──────────────────
# After cloud data lands, the quest view may already be rendered with stale data.
# Fire a custom event that quest.js can listen for to re-render the char.
print('\n[5/5] main.js — fire quest-refresh event after hydrateDataFromCloud')
patch(
    'js/app/main.js',
    "    if (printRecords.length > 0) {\n      console.log('[sync] ' + printRecords.length + ' prints synced from cloud');\n      // Rebuild char selector so new chips appear\n      const { buildCharSelector, renderActiveChar } = await import('./sheet.js');\n      buildCharSelector();\n    }\n  } catch(e) { console.warn('[sync] prints overlay failed:', e); }\n}",
    """    if (printRecords.length > 0) {
      console.log('[sync] ' + printRecords.length + ' prints synced from cloud');
      // Rebuild char selector so new chips appear
      const { buildCharSelector, renderActiveChar } = await import('./sheet.js');
      buildCharSelector();
    }
  } catch(e) { console.warn('[sync] prints overlay failed:', e); }

  // Fire event so quest view re-renders char with fresh You card data
  window.dispatchEvent(new CustomEvent('cloud:hydrated'));
}""",
    'main.js — dispatch cloud:hydrated event'
)


# ── 6. quest.js — listen for cloud:hydrated and re-render char ───────────────
print('\n[6/6] quest.js — re-render char on cloud:hydrated')
patch(
    'js/app/views/quest.js',
    'export async function initQuestView() {',
    """export async function initQuestView() {
  // Re-render quest char when cloud hydration lands (may bring You card data)
  window.addEventListener('cloud:hydrated', async () => {
    const fresh = await loadCharacter();
    if (fresh) {
      // Re-render the mii + stats without reiniting the whole view
      const { renderChar } = await import('./quest.js').catch(() => ({}));
      // Fallback: just re-call the render portion directly
      try {
        const miiEl = document.getElementById('quest-mii');
        const nameEl = document.getElementById('quest-char-name');
        const classEl = document.getElementById('quest-char-class');
        if (nameEl) nameEl.textContent = fresh.name || 'Wanderer';
        if (classEl) classEl.textContent = fresh.class || '';
        if (miiEl && fresh.portrait_base64) {
          miiEl.innerHTML = '<img src="' + fresh.portrait_base64 + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
        }
        // Update stat badges
        ['atk','def','wit','luk'].forEach(stat => {
          const el = document.getElementById('quest-stat-' + stat);
          if (el) el.textContent = fresh[stat] || 0;
        });
      } catch(e) { console.warn('[quest] re-render failed:', e); }
    }
  }, { once: true });
""",
    'quest.js — re-render on cloud:hydrated'
)


# ── REPORT ────────────────────────────────────────────────────────────────────
print('\n' + '='*60)
if errors:
    print(f'FINISHED WITH {len(errors)} MISS(ES):')
    for e in errors: print(f'  {e}')
else:
    print('ALL PATCHES APPLIED CLEAN')
    print()
    print('  git add .')
    print('  git commit -m "feat: sync scenes+worlds to cloud, fix quest char refresh after hydration"')
    print('  git push --force origin main')
print('='*60)
