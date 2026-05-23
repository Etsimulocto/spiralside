src = open('js/app/mastersave.js', encoding='utf-8').read().replace('\r\n', '\n')

# Fix hydrate() — don't clobber xp_state if local IDB is newer
# Replace the xp_state hydration block
old = """  // XP state -> IDB
  if (save.xp_state) {
    try {
      await dbSet('config', { key: 'xp_state', value: save.xp_state });
      // Reload in-memory XP if module is loaded
      if (window._reloadXPState) await window._reloadXPState();
    } catch(_) {}
  }"""

new = """  // XP state -> IDB
  // Only write cloud xp_state if it has MORE total XP than what's in IDB.
  // This prevents masterLoad from clobbering a freshly-incremented streak
  // that happened AFTER the last cloud save was written.
  if (save.xp_state) {
    try {
      const localXP = await dbGet('config', 'xp_state');
      const localTotal = localXP?.value?.totalXP || 0;
      const cloudTotal = save.xp_state.totalXP || 0;
      const localStreak = localXP?.value?.streakDays || 0;
      const cloudStreak = save.xp_state.streakDays || 0;
      // Merge: take whichever has higher totalXP, but always keep the higher streak
      if (cloudTotal > localTotal) {
        const merged = { ...save.xp_state, streakDays: Math.max(localStreak, cloudStreak) };
        await dbSet('config', { key: 'xp_state', value: merged });
        if (window._reloadXPState) await window._reloadXPState();
      } else if (cloudStreak > localStreak) {
        // Cloud has better streak but less XP — just patch the streak
        const patched = { ...(localXP?.value || {}), streakDays: cloudStreak };
        await dbSet('config', { key: 'xp_state', value: patched });
        if (window._reloadXPState) await window._reloadXPState();
      }
      // else: local is newer/better — don't touch IDB at all
    } catch(_) {}
  }"""

if old in src:
    src = src.replace(old, new, 1)
    print('[OK] xp_state hydration fixed')
else:
    print('[!!] anchor not found')
    # debug
    idx = src.find('// XP state -> IDB')
    print(repr(src[idx:idx+400]))

# Fix quest_deltas hydration — merge instead of overwrite
old2 = "  if (save.quest_deltas) localStorage.setItem('ss_quest_deltas', JSON.stringify(save.quest_deltas));"
new2 = """  // quest_deltas — merge cloud + local (take max absolute value per stat)
  if (save.quest_deltas) {
    try {
      const localRaw = localStorage.getItem('ss_quest_deltas');
      const local = localRaw ? JSON.parse(localRaw) : {};
      const cloud = save.quest_deltas;
      const merged = {};
      const allKeys = new Set([...Object.keys(local), ...Object.keys(cloud)]);
      allKeys.forEach(k => {
        const l = local[k] || 0, c = cloud[k] || 0;
        // Keep whichever has larger absolute value (more battle history)
        merged[k] = Math.abs(l) >= Math.abs(c) ? l : c;
      });
      localStorage.setItem('ss_quest_deltas', JSON.stringify(merged));
    } catch(_) {
      localStorage.setItem('ss_quest_deltas', JSON.stringify(save.quest_deltas));
    }
  }"""

if old2 in src:
    src = src.replace(old2, new2, 1)
    print('[OK] quest_deltas merge fixed')
else:
    print('[!!] quest_deltas anchor not found')

open('js/app/mastersave.js', 'w', encoding='utf-8').write(src)
