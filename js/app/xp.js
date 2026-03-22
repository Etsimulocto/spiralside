// ============================================================
// SPIRALSIDE — XP ENGINE v1.0
// Central experience point system — tracks player progression
// across all app activities, enforces daily cap, handles
// level-ups, card theme unlocks, and bot level binding.
//
// Architecture:
//   - XP state lives in IDB ('config' store, key 'xp_state')
//   - Daily cap resets at midnight via date comparison
//   - One level per month max: daily cap = level_xp_needed / 30
//   - Bot level = XP points manually invested by user
//   - Card themes drop monthly with level gates
//
// Usage:
//   import { awardXP, getXPState, initXP } from './xp.js';
//   await awardXP('chat_message');   // anywhere in the app
//
// Nimbis anchor: js/app/xp.js
// ============================================================

import { dbGet, dbSet } from './db.js';

// ── LEVEL CURVE ───────────────────────────────────────────────
// XP required to go FROM this level TO the next.
// Designed so level 1→2 takes ~1 month at daily cap.
// Levels 1-5: gentle on-ramp, 6-15: mid grind, 16+: long haul.
const LEVEL_XP = [
  0,     // placeholder — levels are 1-indexed
  300,   // lv 1 → 2   (~10 xp/day cap = 1 month)
  450,   // lv 2 → 3
  600,   // lv 3 → 4
  600,   // lv 4 → 5
  900,   // lv 5 → 6
  900,   // lv 6 → 7
  900,   // lv 7 → 8
  900,   // lv 8 → 9
  900,   // lv 9 → 10
  1500,  // lv 10 → 11
  1500,  // lv 11 → 12
  1500,  // lv 12 → 13
  1500,  // lv 13 → 14
  1500,  // lv 14 → 15
  1500,  // lv 15 → 16
  1500,  // lv 16 → 17
  1500,  // lv 17 → 18
  1500,  // lv 18 → 19
  1500,  // lv 19 → 20
  2500,  // lv 20 → 21
  2500,  // lv 21 → 22
  2500,  // lv 22 → 23
  2500,  // lv 23 → 24
  2500,  // lv 24 → 25
];

// Max level — beyond 25 the cap stays at 2500 xp/level
const MAX_DEFINED_LEVEL = 25;

// Returns XP needed to go from current level to next
function xpForLevel(level) {
  if (level < 1) return 300;
  if (level <= MAX_DEFINED_LEVEL) return LEVEL_XP[level] || 2500;
  return 2500;
}

// ── DAILY CAP ─────────────────────────────────────────────────
// Cap per day = level XP needed / 30 days (so 1 level = ~1 month)
// Floor at 10, ceiling at 100 so it always feels achievable.
function dailyCapForLevel(level) {
  const needed = xpForLevel(level);
  return Math.max(10, Math.min(100, Math.floor(needed / 30)));
}

// ── XP SOURCES ────────────────────────────────────────────────
// Every action across the app that awards XP.
// Tune these values here — no hunting through modules.
export const XP_SOURCES = {
  chat_message:        3,   // message sent to any bot
  chat_first_today:    5,   // bonus for first message of the day
  chat_streak_bonus:   5,   // bonus for consecutive daily use
  image_generated:     8,   // image created in imagine tab
  codex_card_created:  10,  // new scene/world card saved
  panel_saved:         6,   // comic panel saved to library
  book_completed:      15,  // comic book finished and saved
  quest_completed:     0,   // handled dynamically (quest.xp from template)
  quest_event_added:   5,   // calendar event added to quest board
  vault_file_uploaded: 4,   // file added to vault
  bot_configured:      8,   // bot settings saved in forge
  daily_login:         5,   // first open of the day (any tab)
};

// ── CARD THEME REGISTRY ───────────────────────────────────────
// Monthly drops — each theme has a release month (YYYY-MM),
// minimum level required to unlock, and display metadata.
// Add a new entry each month — no other code changes needed.
export const CARD_THEMES = [
  {
    id:          'default',
    name:        'Signal White',
    description: 'The original. Clean bloom on void.',
    releaseMonth: '2026-03',   // available from launch
    levelRequired: 1,
    palette:     { bg: '#08080d', accent: '#F0F0FF', border: '#1e1e35' },
  },
  {
    id:          'void_static',
    name:        'Void Static',
    description: 'Pure noise. Pure dark. The signal beneath.',
    releaseMonth: '2026-04',   // April drop
    levelRequired: 3,
    palette:     { bg: '#000000', accent: '#00F6D6', border: '#0f0f0f' },
  },
  {
    id:          'chaos_pink',
    name:        'Chaos Pink',
    description: 'Monday\'s frequency. Loud, loyal, undeniable.',
    releaseMonth: '2026-05',   // May drop
    levelRequired: 5,
    palette:     { bg: '#0d0010', accent: '#FF4BCB', border: '#2a0030' },
  },
  {
    id:          'cold_blue',
    name:        'Cold Blue',
    description: 'Cold\'s silence made visible. Before the rain.',
    releaseMonth: '2026-06',   // June drop
    levelRequired: 8,
    palette:     { bg: '#00050d', accent: '#4DA3FF', border: '#001020' },
  },
  {
    id:          'grit_gold',
    name:        'Grit Gold',
    description: 'Calluses and coffee. Built, not given.',
    releaseMonth: '2026-07',   // July drop
    levelRequired: 12,
    palette:     { bg: '#0d0a00', accent: '#FFD93D', border: '#1e1800' },
  },
  {
    id:          'spiral_deep',
    name:        'Spiral Deep',
    description: 'The field at maximum recursion. Rare.',
    releaseMonth: '2026-08',   // August drop
    levelRequired: 16,
    palette:     { bg: '#05001a', accent: '#7B5FFF', border: '#0f0030' },
  },
];

// ── DEFAULT XP STATE ──────────────────────────────────────────
// Shape of the persisted XP state object.
function defaultXPState() {
  return {
    level:          1,       // current player level
    xp:             0,       // XP within current level
    xpNext:         xpForLevel(1),  // XP needed to reach next level
    totalXP:        0,       // lifetime XP accumulated
    dailyXP:        0,       // XP earned today (resets at midnight)
    dailyCap:       dailyCapForLevel(1),  // cap for today
    lastActiveDate: '',      // ISO date string 'YYYY-MM-DD'
    streakDays:     0,       // consecutive active days
    unlockedThemes: ['default'],  // theme IDs unlocked by this player
    activeTheme:    'default',    // currently equipped theme
    botLevels:      {},      // { botId: level } — bot progression
    botXPPool:      0,       // unspent level points to invest in bots
    levelUps:       [],      // history of level-up timestamps
  };
}

// ── IDB PERSISTENCE ───────────────────────────────────────────
// Reads XP state from IDB. Returns default if not found.
async function loadXPState() {
  try {
    const saved = await dbGet('config', 'xp_state');
    if (saved && saved.value) return { ...defaultXPState(), ...saved.value };
    return defaultXPState();
  } catch {
    return defaultXPState();
  }
}

// Writes XP state to IDB.
async function saveXPState(xpState) {
  try {
    await dbSet('config', { key: 'xp_state', value: xpState });
  } catch (e) {
    console.warn('[xp] save failed:', e);
  }
}

// ── IN-MEMORY STATE ───────────────────────────────────────────
// Cached after initXP() — avoids IDB reads on every XP award.
let _state = null;
let _initialized = false;

// ── INIT ──────────────────────────────────────────────────────
// Call once on app boot (in main.js onAppReady).
// Loads state, handles midnight reset, awards daily login XP.
export async function initXP() {
  if (_initialized) return _state;
  _state = await loadXPState();
  _state = _handleDayReset(_state);
  _state = await _awardDailyLogin(_state);
  _initialized = true;
  return _state;
}

// ── DAY RESET ─────────────────────────────────────────────────
// Checks if the stored date is today. If not, resets daily XP
// and updates the streak counter.
function _handleDayReset(s) {
  const today = _todayStr();
  if (s.lastActiveDate === today) return s; // same day, no reset needed

  // New day — check streak continuity
  const wasYesterday = _isYesterday(s.lastActiveDate);
  s.streakDays   = wasYesterday ? (s.streakDays || 0) + 1 : 1;
  s.dailyXP      = 0;
  s.dailyCap     = dailyCapForLevel(s.level);
  s.lastActiveDate = today;
  return s;
}

// Awards daily login bonus XP (first open of the day).
// Separated so it only fires once per day even if initXP is called again.
async function _awardDailyLogin(s) {
  // If we already have dailyXP for today it means login bonus was given
  // (it's always the first XP of the day, so dailyXP > 0 = already awarded)
  // We use a flag instead to be safe.
  if (s._loginBonusGivenToday) return s;
  s = _applyXP(s, XP_SOURCES.daily_login, 'daily_login');
  s._loginBonusGivenToday = true;
  await saveXPState(s);
  return s;
}

// ── APPLY XP ─────────────────────────────────────────────────
// Core mutation — adds XP to state, enforces daily cap,
// handles level-up cascade. Pure function (returns new state).
function _applyXP(s, amount, source) {
  // Enforce daily cap — clamp award to remaining allowance
  const remaining = Math.max(0, s.dailyCap - s.dailyXP);
  const actual = Math.min(amount, remaining);
  if (actual <= 0) return s; // already at daily cap

  s = { ...s };  // shallow copy for immutability feel
  s.dailyXP  += actual;
  s.totalXP  += actual;
  s.xp       += actual;

  // Level-up cascade — handles multi-level jumps
  while (s.xp >= s.xpNext) {
    s.xp    -= s.xpNext;
    s.level += 1;
    s.xpNext = xpForLevel(s.level);
    s.botXPPool += 1;  // one investable point per level-up
    s.levelUps.push({ level: s.level, at: Date.now(), source });

    // Check for newly unlocked card themes
    s = _checkThemeUnlocks(s);

    // Fire level-up event so UI can react
    _emitLevelUp(s.level);
  }

  return s;
}

// ── THEME UNLOCK CHECK ────────────────────────────────────────
// Called after every level-up. Compares current level and date
// against theme registry — unlocks newly eligible themes.
function _checkThemeUnlocks(s) {
  const todayMonth = _todayStr().slice(0, 7); // 'YYYY-MM'
  CARD_THEMES.forEach(theme => {
    if (s.unlockedThemes.includes(theme.id)) return; // already have it
    if (theme.releaseMonth > todayMonth) return;     // not released yet
    if (s.level >= theme.levelRequired) {
      s.unlockedThemes = [...s.unlockedThemes, theme.id];
      _emitThemeUnlock(theme);
    }
  });
  return s;
}

// ── PUBLIC: AWARD XP ─────────────────────────────────────────
// Main entry point for all modules.
// source: key from XP_SOURCES, or pass a raw number for quest XP.
// Returns { xpAwarded, leveledUp, newLevel, atCap }.
export async function awardXP(source, rawAmount = null) {
  if (!_initialized) await initXP();

  const amount = rawAmount !== null
    ? rawAmount                        // quest passes raw XP value
    : (XP_SOURCES[source] ?? 0);

  if (amount <= 0) return { xpAwarded: 0, leveledUp: false, newLevel: _state.level, atCap: true };

  const prevLevel = _state.level;
  const prevDailyXP = _state.dailyXP;

  _state = _applyXP(_state, amount, source);

  const xpAwarded = _state.dailyXP - prevDailyXP;
  const leveledUp = _state.level > prevLevel;
  const atCap     = _state.dailyXP >= _state.dailyCap;

  // Persist after every award
  await saveXPState(_state);

  return { xpAwarded, leveledUp, newLevel: _state.level, atCap };
}

// ── PUBLIC: GET STATE ─────────────────────────────────────────
// Read-only snapshot of current XP state.
// Quest view, UI badges, etc. call this to render progress.
export function getXPState() {
  return _state ? { ..._state } : defaultXPState();
}

// ── PUBLIC: INVEST IN BOT ─────────────────────────────────────
// Spends a level point from botXPPool to level up a specific bot.
// botId: string (e.g. state.botName.toLowerCase() or a bot UUID)
export async function investInBot(botId) {
  if (!_initialized) await initXP();
  if (_state.botXPPool < 1) return { success: false, reason: 'no_points' };

  _state = { ..._state };
  _state.botXPPool -= 1;
  _state.botLevels = { ..._state.botLevels };
  _state.botLevels[botId] = (_state.botLevels[botId] || 0) + 1;

  await saveXPState(_state);
  _emitBotLevelUp(botId, _state.botLevels[botId]);

  return { success: true, botId, botLevel: _state.botLevels[botId] };
}

// ── PUBLIC: GET BOT LEVEL ─────────────────────────────────────
export function getBotLevel(botId) {
  if (!_state) return 0;
  return _state.botLevels[botId] || 0;
}

// ── PUBLIC: EQUIP THEME ───────────────────────────────────────
// Sets the active card theme if the player has unlocked it.
export async function equipTheme(themeId) {
  if (!_initialized) await initXP();
  if (!_state.unlockedThemes.includes(themeId)) {
    return { success: false, reason: 'locked' };
  }
  _state = { ..._state, activeTheme: themeId };
  await saveXPState(_state);
  _applyThemeToDOM(themeId);
  return { success: true, themeId };
}

// ── PUBLIC: GET AVAILABLE THEMES ─────────────────────────────
// Returns all themes with lock status for the current player.
export function getAvailableThemes() {
  if (!_state) return CARD_THEMES.map(t => ({ ...t, unlocked: t.id === 'default' }));
  const todayMonth = _todayStr().slice(0, 7);
  return CARD_THEMES.map(t => ({
    ...t,
    unlocked:   _state.unlockedThemes.includes(t.id),
    released:   t.releaseMonth <= todayMonth,
    canUnlock:  _state.level >= t.levelRequired && t.releaseMonth <= todayMonth,
  }));
}

// ── DOM: APPLY THEME ─────────────────────────────────────────
// Writes CSS variables to :root so the entire UI recolors.
function _applyThemeToDOM(themeId) {
  const theme = CARD_THEMES.find(t => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--bg',     theme.palette.bg);
  root.style.setProperty('--border', theme.palette.border);
  // accent maps to the primary color (teal by default)
  root.style.setProperty('--teal',   theme.palette.accent);
}

// ── EVENT EMITTERS ────────────────────────────────────────────
// Dispatch custom DOM events so any module can listen without
// tight coupling. pattern: window.addEventListener('xp:levelup', ...)

function _emitLevelUp(level) {
  window.dispatchEvent(new CustomEvent('xp:levelup', { detail: { level } }));
}

function _emitThemeUnlock(theme) {
  window.dispatchEvent(new CustomEvent('xp:theme_unlocked', { detail: { theme } }));
}

function _emitBotLevelUp(botId, botLevel) {
  window.dispatchEvent(new CustomEvent('xp:bot_levelup', { detail: { botId, botLevel } }));
}

// ── TOAST NOTIFICATION ────────────────────────────────────────
// Injects a Bloomcore-styled level-up toast — no external deps.
// Called by UI listeners on xp:levelup event.
export function showLevelUpToast(level) {
  // Inject styles once
  if (!document.getElementById('xp-toast-styles')) {
    const s = document.createElement('style');
    s.id = 'xp-toast-styles';
    s.textContent = `
      .xp-toast {
        position: fixed; bottom: calc(90px + var(--safe-bot,0px)); left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, #FFD93D, #FF4BCB);
        color: #08080d; font-family: var(--font-display);
        font-weight: 700; font-size: 0.82rem;
        padding: 10px 20px; border-radius: 20px;
        letter-spacing: 0.06em; text-transform: uppercase;
        opacity: 0; pointer-events: none; z-index: 9999;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        white-space: nowrap; box-shadow: 0 4px 24px rgba(255,211,61,0.4);
      }
      .xp-toast.visible {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(s);
  }

  const toast = document.createElement('div');
  toast.className = 'xp-toast';
  toast.textContent = `⬆ level ${level} unlocked`;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });

  // Animate out and remove
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// ── XP GAIN TOAST ─────────────────────────────────────────────
// Subtle +XP indicator that appears near the tab bar.
// Shows briefly then fades — doesn't interrupt flow.
export function showXPGain(amount, source) {
  if (amount <= 0) return;

  if (!document.getElementById('xp-gain-styles')) {
    const s = document.createElement('style');
    s.id = 'xp-gain-styles';
    s.textContent = `
      .xp-gain {
        position: fixed; bottom: calc(86px + var(--safe-bot,0px)); right: 16px;
        color: #FFD93D; font-family: var(--font-ui);
        font-size: 0.65rem; letter-spacing: 0.08em;
        opacity: 0; pointer-events: none; z-index: 9998;
        transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.8s ease;
      }
      .xp-gain.visible { opacity: 1; transform: translateY(-8px); }
    `;
    document.head.appendChild(s);
  }

  const el = document.createElement('div');
  el.className = 'xp-gain';
  el.textContent = `+${amount} xp`;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('visible'));
  });

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, 1200);
}

// ── HELPERS ───────────────────────────────────────────────────
function _todayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function _isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10) === dateStr;
}
