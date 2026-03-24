# SPIRALSIDE — XP ENGINE HANDOFF
*Nimbis · March 2026 · Pick up exactly here next session*

---

## WHAT WAS DESIGNED THIS SESSION

Full XP progression system designed and built. Ready to deploy.

**The loop:**
- User earns XP across all app activity (not just quests)
- Daily cap enforces ~1 level per month max
- Level-ups award investable points to spend on bots
- Bot level = points you've invested in it (you choose which bot)
- Monthly card theme drops are level-gated (can't spam to unlock)

---

## FILES BUILT — READY TO DEPLOY

### `xp.js` — the full engine (487 lines)
Lives at: `js/app/xp.js`

What it does:
- Level curve (lv1-25, then infinite at 2500 xp/level)
- Daily cap = level XP needed / 30 (floor 10, ceiling 100)
- IDB persistence via existing db.js pattern (`config` store, key `xp_state`)
- `awardXP(source)` — single function called from every module
- `getXPState()` — read-only snapshot for quest view / UI
- `investInBot(botId)` — spends pool point to level a bot
- `equipTheme(themeId)` — sets active card theme, writes CSS vars to :root
- `getAvailableThemes()` — returns all themes with lock/release status
- Level-up toast (Bloomcore styled, gradient yellow→pink)
- XP gain indicator (+N xp floats up near tab bar)
- Custom DOM events: `xp:levelup`, `xp:theme_unlocked`, `xp:bot_levelup`

### `deploy_xp.sh` — deploy script
Was built but couldn't be run this session (file path issue in Git Bash).
**Solution: do it directly in the project next session.**

---

## XP VALUES (tune here if needed)

| Action | XP |
|---|---|
| chat message sent | 3 |
| first message of day bonus | 5 |
| streak bonus | 5 |
| image generated | 8 |
| codex card created | 10 |
| comic panel saved | 6 |
| book completed | 15 |
| quest event added | 5 |
| quest completed | dynamic (quest.xp from template) |
| vault file uploaded | 4 |
| bot configured | 8 |
| daily login | 5 |

Daily cap: ~10-50 XP depending on level. Resets midnight.

---

## LEVEL CURVE

| Levels | XP per level |
|---|---|
| 1-2 | 300 |
| 2-3 | 450 |
| 3-5 | 600 |
| 5-10 | 900 |
| 10-20 | 1500 |
| 20-25 | 2500 |

---

## CARD THEME DROPS (monthly, level gated)

| Theme | Month | Level req |
|---|---|---|
| Signal White | launch | 1 |
| Void Static | April 2026 | 3 |
| Chaos Pink | May 2026 | 5 |
| Cold Blue | June 2026 | 8 |
| Grit Gold | July 2026 | 12 |
| Spiral Deep | August 2026 | 16 |

Add a new entry to `CARD_THEMES` array in xp.js each month.

---

## WHAT NEEDS TO HAPPEN NEXT SESSION

### Step 1 — Write xp.js into the repo
Nimbis reads the built file and writes it directly using bash in the project.

### Step 2 — Wire main.js (3 changes)
```js
// ADD import:
import { initXP, showLevelUpToast } from './xp.js';

// ADD inside onAppReady() after initDB():
await initXP();

// ADD after onAppReady closes:
window.addEventListener('xp:levelup', (e) => showLevelUpToast(e.detail.level));
```

### Step 3 — Wire chat.js
Add import + call `awardXP('chat_message')` when user sends a message.
Also `awardXP('chat_first_today')` on first message of the day (check against date).

### Step 4 — Wire imagine2.js
Add import + call `awardXP('image_generated')` when image URL is received.

### Step 5 — Wire codex.js
Add import + call `awardXP('codex_card_created')` when scene/world card saves.

### Step 6 — Wire library.js
- `awardXP('panel_saved')` on panel save
- `awardXP('book_completed')` on book complete

### Step 7 — Wire quest.js
- `awardXP('quest_event_added')` on event add (replace localStorage-only save)
- `awardXP(null, quest.xp)` on quest complete (raw XP from template)
- Replace `char.xp / char.xpNext` display with `getXPState()` data

### Step 8 — Wire build.js (forge)
`awardXP('bot_configured')` on bot settings save.

### Step 9 — Quest view reads from getXPState()
Currently quest.js tracks XP in its own localStorage (`ss_quest_char`).
Replace with `getXPState()` so everything is centralized.

### Step 10 — Add theme picker to style panel
`getAvailableThemes()` returns all themes with lock status.
Render locked ones grayed out with level requirement shown.
Unlocked ones are clickable → `equipTheme(themeId)`.

---

## BOT INVESTMENT UI (future session after XP is live)

Quest view or Forge tab shows:
- "You have N unspent level points"
- List of your bots with their current level
- Tap to invest → `investInBot(botId)`
- Bot level unlocks things (TBD — personality depth, tone options, etc.)

---

## WHAT WAS DECIDED THIS SESSION

- Daily cap enforces 1 level per month max — prevents grinding
- Bot level is separate from player level, fed by invested points
- Monthly card theme drops = live service mechanic, creates long-term chase
- XP comes from ALL app activity, not just quests
- Quest system was already well-built — just needs to feed into central XP
- The quest `WILD_QUEST` (empty day = rare quest, +200 XP) exists in template but never triggers — fix this too

---

## REPO / STACK REMINDER

- Frontend: GitHub → Vercel auto-deploy (spiralside.com)
- Backend: Railway
- DB: Supabase
- HF Space: quarterbitgames/spiralside (Python/Gradio backend)
- Local: C:\Users\quart\spiralside (Git Bash)
- IDB name: 'spiralside', version 6
- Config store keyPath: 'key', value stored as `{ key: 'xp_state', value: {...} }`

---

*🌀 Signal intact. Pick up at Step 1.*
