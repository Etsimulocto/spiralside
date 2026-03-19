# BLOOMCORE SCRIPT TEMPLATE — UNIVERSAL
# Version: 1.0
# Works for: JavaScript, Python, Lua, TypeScript, Bash, any language
# Replace comment syntax with what your language uses:
#   JS/TS:   //  or  /* */
#   Python:  #   or  """ """
#   Lua:     --  or  --[[ ]]
#   Bash:    #

---

## HEADER BLOCK
Every file starts with this. Fill every field. No exceptions.

```
============================================================
 Script Name    : [FileName.ext]
 Placement      : [Where this lives — e.g. js/app/views/, ServerScriptService, src/utils/]
 Type           : [Module / Script / LocalScript / Component / Endpoint / Utility]
 Purpose        : [One sentence. What does this file DO?]
 Version        : 1.0
 Dependencies   : [What does this import/require? List them.]
 Linked Objects : [Any external refs — RemoteEvents, DOM IDs, API endpoints, etc.]
 Last Updated   : YYYY-MM-DD
============================================================
```

**JS example:**
```js
// ============================================================
// Script Name    : chat.js
// Placement      : js/app/
// Type           : Module
// Purpose        : Handles all chat message sending and rendering
// Version        : 2.1
// Dependencies   : state.js, ui.js, db.js
// Linked Objects : #chat-messages, #msg-input, POST /chat
// Last Updated   : 2026-03-19
// ============================================================
```

**Lua example:**
```lua
--[[
============================================================
 Script Name    : RoundService.lua
 Placement      : ServerScriptService
 Type           : Script
 Purpose        : Manages round start, end, and player scoring
 Version        : 1.0
 Dependencies   : ReplicatedStorage.RemoteEvents, PlayerService
 Linked Objects : RoundStarted, RoundEnded RemoteEvents
 Last Updated   : 2026-03-19
============================================================
]]
```

**Python example:**
```python
# ============================================================
# Script Name    : main.py
# Placement      : root / Railway backend
# Type           : FastAPI app entry point
# Purpose        : All API endpoints for Spiralside backend
# Version        : 3.0
# Dependencies   : fastapi, httpx, supabase, pydantic
# Linked Objects : Supabase DB, Anthropic API, PayPal API
# Last Updated   : 2026-03-19
# ============================================================
```

---

## SECTION DIVIDERS
Use these to separate major blocks inside any file.
Always UPPERCASE. Always padded to ~60 chars.

```
// ── SECTION NAME ─────────────────────────────────────────
```

Standard section order (use what applies, skip what doesn't):

```
// ── CONFIG ────────────────────────────────────────────────
// ── IMPORTS / SERVICES ────────────────────────────────────
// ── STATE ─────────────────────────────────────────────────
// ── TYPES / MODELS ────────────────────────────────────────
// ── HELPERS ───────────────────────────────────────────────
// ── CORE LOGIC ────────────────────────────────────────────
// ── EVENT HANDLERS ────────────────────────────────────────
// ── RENDER ────────────────────────────────────────────────
// ── EXPORTS ───────────────────────────────────────────────
```

---

## INLINE COMMENTS
Comment the WHY, not the WHAT. If the code is obvious, skip the comment.

```js
// BAD — states the obvious
const x = x + 1; // increment x by 1

// GOOD — explains the why
typing = null; // clear handle so isTyping() returns false cleanly
```

Comment non-obvious values:
```js
const speed = line.speaker === 'narrator' ? 32 : 20; // narrator types slower for dramatic effect
```

Comment anything that will bite someone later:
```js
void bg.offsetWidth; // force reflow so animation retriggers cleanly — do not remove
```

---

## NAMING CONVENTIONS

| Thing | Convention | Example |
|---|---|---|
| Variables | camelCase | `userName`, `isLoaded` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `RAIL_URL` |
| Functions | camelCase verb | `renderPanel()`, `loadComic()` |
| Classes | PascalCase | `ComicViewer`, `RoundService` |
| Files | kebab-case or camelCase | `chat.js`, `RoundService.lua` |
| IDs (DOM/Roblox) | kebab-case | `comic-overlay`, `chat-input` |
| Boolean vars | is/has/can prefix | `isTyping`, `hasLoaded`, `canRun` |

---

## FILE SKELETON — JS/TS MODULE

```js
// ============================================================
// Script Name    : [name].js
// Placement      : [path]
// Type           : Module
// Purpose        : [one sentence]
// Version        : 1.0
// Dependencies   : [imports]
// Linked Objects : [DOM IDs, endpoints, etc.]
// Last Updated   : YYYY-MM-DD
// ============================================================

// ── CONFIG ────────────────────────────────────────────────
const MAX_ITEMS = 50;                     // hard cap on list size
const API_URL   = 'https://example.com'; // base URL for all requests

// ── STATE ─────────────────────────────────────────────────
let isLoading = false; // debounce flag — prevents double-submit
let items     = [];    // in-memory item list, populated on init

// ── HELPERS ───────────────────────────────────────────────

// Returns true if the item passes basic validation
function isValidItem(item) {
  return item && typeof item.id === 'string' && item.id.length > 0;
}

// ── CORE LOGIC ────────────────────────────────────────────

// Loads items from the API and populates state
async function loadItems() {
  if (isLoading) return;         // prevent concurrent calls
  isLoading = true;
  try {
    const resp = await fetch(`${API_URL}/items`);
    const data = await resp.json();
    items = data.filter(isValidItem); // drop malformed entries
  } catch (err) {
    console.error('[loadItems] fetch failed:', err);
  } finally {
    isLoading = false;           // always release lock
  }
}

// ── EXPORTS ───────────────────────────────────────────────
export { loadItems, items };
```

---

## FILE SKELETON — PYTHON MODULE

```python
# ============================================================
# Script Name    : [name].py
# Placement      : [path]
# Type           : [FastAPI router / utility / model / etc.]
# Purpose        : [one sentence]
# Version        : 1.0
# Dependencies   : [imports]
# Linked Objects : [endpoints, DB tables, etc.]
# Last Updated   : YYYY-MM-DD
# ============================================================

# ── IMPORTS ───────────────────────────────────────────────
import os                         # environment variable access
from fastapi import HTTPException # standard error raising

# ── CONFIG ────────────────────────────────────────────────
MAX_RETRIES = 3                   # max attempts before failing hard
BASE_URL    = os.environ.get("API_URL", "https://example.com")

# ── HELPERS ───────────────────────────────────────────────

def is_valid(item: dict) -> bool:
    """Returns True if item has a non-empty string id."""
    return bool(item.get("id") and isinstance(item["id"], str))

# ── CORE LOGIC ────────────────────────────────────────────

async def load_items() -> list:
    """Fetches items from upstream API, filters malformed entries."""
    # ... implementation
    pass
```

---

## FILE SKELETON — LUA (ROBLOX)

```lua
--[[
============================================================
 Script Name    : [Name].lua
 Placement      : [ServerScriptService / StarterPlayerScripts / etc.]
 Type           : [Script / LocalScript / ModuleScript]
 Purpose        : [one sentence]
 Version        : 1.0
 Dependencies   : [services, modules, remotes]
 Linked Objects : [Parts, GUIs, RemoteEvents]
 Last Updated   : YYYY-MM-DD
============================================================
]]

-- ── SERVICES ──────────────────────────────────────────────
local Players           = game:GetService("Players")           -- player management
local ReplicatedStorage = game:GetService("ReplicatedStorage") -- shared assets
local TweenService      = game:GetService("TweenService")      -- smooth animations

-- ── CONFIG ────────────────────────────────────────────────
local MAX_PLAYERS = 8   -- hard cap per round
local ROUND_TIME  = 120 -- seconds per round

-- ── STATE ─────────────────────────────────────────────────
local roundActive = false  -- true while a round is running
local activePlayers = {}   -- players currently in the round

-- ── HELPERS ───────────────────────────────────────────────

-- Returns true if the player is in the active round
local function isInRound(player)
    return activePlayers[player.UserId] ~= nil
end

-- ── CORE LOGIC ────────────────────────────────────────────

-- Starts a new round, locks out late joiners
local function startRound()
    if roundActive then return end  -- prevent double-start
    roundActive = true
    -- ... round logic here
end

-- ── EVENT CONNECTIONS ─────────────────────────────────────

Players.PlayerRemoving:Connect(function(player)
    activePlayers[player.UserId] = nil  -- clean up on disconnect
end)
```

---

## WHAT NOT TO DO

```js
// ❌ No header — nobody knows what this is or why it exists
// ❌ No sections — walls of code with no navigation
// ❌ Obvious comments
x = x + 1 // add 1 to x

// ❌ Magic numbers with no explanation
setTimeout(fn, 1100)

// ✅ Explained magic number
setTimeout(fn, 1100) // 1.1s pause after line finishes — feels natural, not rushed

// ❌ Inconsistent naming
let user_name = ""
let UserAge = 0
let isactive = false

// ✅ Consistent
let userName  = ""
let userAge   = 0
let isActive  = false
```

---

## QUICK REFERENCE — SECTION HEADER SYNTAX BY LANGUAGE

```js
// JS / TS
// ── SECTION NAME ─────────────────────────────────────────
```

```python
# Python
# ── SECTION NAME ─────────────────────────────────────────
```

```lua
-- Lua
-- ── SECTION NAME ──────────────────────────────────────────
```

```bash
# Bash
# ── SECTION NAME ─────────────────────────────────────────
```

```css
/* CSS */
/* ── SECTION NAME ─────────────────────────────────────── */
```

```sql
-- SQL
-- ── SECTION NAME ─────────────────────────────────────────
```

---

*Bloomcore format. Keep it readable. Keep it honest. Comment the why.*
