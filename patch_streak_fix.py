#!/usr/bin/env python
# ============================================================
# SPIRALSIDE — PATCH: fix streak reset on Ctrl+R
#
# BUG: initXP() calls _handleDayReset() which increments streakDays
#      and updates lastActiveDate, but doesn't save to IDB.
#      saveXPState() only happens inside _awardDailyLogin() after.
#      Fast Ctrl+R during that async gap = streak never written =
#      next load sees stale lastActiveDate = streak resets to 1.
#
# FIX: save state immediately after _handleDayReset() in initXP()
#      so streakDays and lastActiveDate are durable right away.
#
# RUN FROM: ~/spiralside
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe patch_streak_fix.py
# ============================================================

import sys

def patch(path, old, new, label):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read().replace('\r\n', '\n')
    count = src.count(old)
    if count == 0:
        print(f'MISS [{label}]: anchor not found')
        sys.exit(1)
    if count > 1:
        print(f'DUPE [{label}]: {count} occurrences — unsafe')
        sys.exit(1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new))
    print(f'OK   [{label}]')

PATH = 'js/app/xp.js'

# ── PATCH: save state right after day reset in initXP() ──
# Old: day reset result passed straight to _awardDailyLogin without saving
# New: if the day reset actually changed something (new day), save immediately
patch(PATH,
    '''export async function initXP() {
  _state = await loadXPState();
  _state = _handleDayReset(_state);
  _state = await _awardDailyLogin(_state);
  _initialized = true;
  return _state;
}''',
    '''export async function initXP() {
  _state = await loadXPState();
  const _prevDate = _state.lastActiveDate;
  _state = _handleDayReset(_state);
  // Save immediately after day reset so streak + lastActiveDate are
  // durable before the async login bonus write. Ctrl+R during the
  // login bonus gap no longer resets the streak.
  if (_state.lastActiveDate !== _prevDate) {
    await saveXPState(_state);
  }
  _state = await _awardDailyLogin(_state);
  _initialized = true;
  return _state;
}''',
    'save state after day reset to protect streak'
)

print('\nPatch applied. Run:')
print('  git add js/app/xp.js')
print('  git commit -m "fix: save XP state after day reset so streak survives Ctrl+R"')
print('  git push --force origin main')
