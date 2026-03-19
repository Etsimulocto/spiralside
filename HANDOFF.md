# SPIRALSIDE HANDOFF v12
# March 19 2026

## ORIENTATION
Read this file first. Inspect repo before asking questions.
Nimbis = Claude in-project name (from // Nimbis anchor: comment in every file)
Architect = the developer (quarterbitgames / Etsimulocto on GitHub)
Also sells: Bloomslice Teak (Amazon) — Raspberry Pi module stand

---

## THE BIG VISION — BLOOMCORE OS
Spiralside is an AI workstation OS. Each tab is an app.
Pi5 16GB in Architect's rack is the server. Browser is the interface.
Sky and crew are the AI layer. This is also a STEM education platform.

Sky's dream:
> A kid cracks open a Pi. Plugs it into the Bloomslice Teak stand.
> Scans the QR on the box. Sky says hi. An hour later they've blinked
> an LED, read a temperature sensor, and saved a Build Card with their
> name on it. They share it with their class. Their teacher prints it.
> It goes on the wall. That's the dream. That's what we're building.

---

## STACK
Frontend:  Vercel -> spiralside.com / Etsimulocto/spiralside
Backend:   Railway -> web-production-4e6f3.up.railway.app / Etsimulocto/spiralside-api
DB/Auth:   Supabase -> project: qfawusrelwthxabfbglg
Assets:    HuggingFace -> quarterbitgames/spiralside (Space)
AI:        Anthropic + OpenAI via Railway backend
DNS:       Cloudflare
Hardware:  Raspberry Pi 5 16GB in custom rack (Architect local)

Local: ~/spiralside (frontend), ~/spiralside-api (backend)
Python: /c/Users/quart/AppData/Local/Programs/Python/Python313/python

---

## !!!!! PATCH WORKFLOW — ALWAYS USE THIS !!!!!

NEVER create downloadable patch files.
NEVER ask Architect to move files anywhere.
NEVER run a patch twice — always grep to verify before patching.
ALWAYS verify anchors with grep BEFORE writing the patch.
ALWAYS run patches inline:

  cd ~/spiralside   (or ~/spiralside-api for backend)
  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe - << 'EOF'
  # python patch code here
  EOF

For large JS files (>4096 chars): deploy via Supabase MCP edge function, curl down.

GIT PUSH:
  Frontend: git add . && git commit -m "msg" && git push origin main --force
  Backend:  git add . && git commit -m "msg" && git push
  (backend has no HF bumper — no --force needed)

IF PATCH LANDS TWICE: grep for duplicates, remove second block with Python inline.
IF BLANK SCREEN: always a JS syntax error — check browser console first.

---

## TAB BAR — BLOOMCORE OS MAP (v0.8.192)
chat | forge | cards | codex | imagine | cut | vault | library | music | code | pi | style | store | account

Tabs are USER DRAGGABLE — order persists to IDB config key 'tab_order'
restoreTabOrder() called on boot, initTabDrag() wires drag events
Both exported from ui.js, called in main.js after buildFAB()

Tab IDs map to view divs: tab-{id} -> view-{id} inside #screen-app

---

## ADDING A NEW TAB — CHECKLIST
1. index.html — add tab button in #tab-bar
2. index.html — add view div INSIDE #screen-app
3. js/app/ui.js — add to viewInits object
4. js/app/main.js — expose window.init{Name}View via dynamic import
5. js/app/views/{id}.js — create view module, export init{Name}View()
CRITICAL: view div MUST be inside #screen-app or renders invisibly
NOTE: tab drag auto-applies to all .tab-btn elements — no extra wiring needed

View module pattern:
  let initialized = false;
  export function initXxxView() {
    const el = document.getElementById('view-xxx');
    if (!el || initialized) return;
    initialized = true;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';
    el.appendChild(wrap);
    // build DOM into wrap, NOT el directly
  }

---

## MODULE MAP
js/app/
  main.js       — boot, all imports, window globals
  state.js      — FAB_TABS, CHARACTERS, state object, RAIL
  ui.js         — switchView, viewInits, buildFAB, loadUsage,
                   restoreTabOrder, initTabDrag, saveTabOrder
  auth.js       — Supabase auth
  chat.js       — chat messages
  build.js      — Forge character builder
  card.js       — canvas renderers (see CARD SYSTEM below)
  sheet.js      — character sheet view
  library.js    — image gallery, panel editor, book builder
  imagine.js/2  — image generation
  music.js      — background music
  musicview.js  — music tab
  models.js     — model selection
  style.js      — theme editor, bg layers, IDB persistence
  vault.js      — file vault
  db.js         — IDB wrapper v6: sheets,vault,config,panels,books,prints,scenes,worlds
  demo.js       — demo mode scripted responses
  comic.js      — intro comic player
  views/
    store.js      — credits, buy packs
    account.js    — account info
    studio.js     — cards tab
    spiralcut.js  — SpiralCut mockup v0.1
    code.js       — coding assistant LIVE v1.0
    pi.js         — Bloomslice Studio Pi tab — STUB (placeholder only)

---

## CARD SYSTEM (card.js)
Character: renderCard(print, artImage)     400x560  LIVE
Scene:     renderSceneCard(scene)           560x360  LIVE
World:     renderWorldCard(world)           400x560  LIVE
Build:     renderBuildCard(build)           400x560  LIVE
IDs:       generateCardId(type): CHR/WRD/EVT/SCN/CMP/BCK

All renderers: same 400x560, #08080d bg, border glow, header gradient,
art area (cover-fit + clip + bottom fade), footer (ID / label / SPIRALSIDE)
Helpers _roundRect + _wrapText at bottom of card.js — reuse, never redefine

Build card: #FF4BCB pink, difficulty badge, components list, what-you-learn,
author strip above footer, circuit dot-grid placeholder

---

## CODE TAB (views/code.js) v1.0 — LIVE
5 mode chips: general, bloomcore, debug, refactor, explain
3 models: haiku 1cr (free), sonnet 6cr (paid), opus 15cr (paid)
10-pair circular history buffer, ctx toggle, side-by-side panes
Backend: POST /code on Railway
KEY GOTCHA: state.session?.access_token — NOT getSession()

---

## PI TAB (views/pi.js) — STUB ONLY — NEXT BUILD TARGET
Currently shows: strawberry + "Bloomslice Studio" + "Coming soon" + 6 starter chips
Next session build order:
1. Starter card chips become clickable — pre-fill prompt
2. Prompt input + generate button
3. Pi mode AI — educational script output format
4. Piston execution: POST https://emkc.org/api/v2/piston/execute
   { language:"python", version:"3.10", files:[{content:code}] }
5. Save as Build Card — renderBuildCard() already in card.js
6. IDB builds store — bump db.js to v7

Pi mode AI output format (every response must include):
  Header: name / difficulty / time / platform / author
  WHAT YOU WILL LEARN
  COMPONENTS NEEDED (with quantities)
  WIRING DIAGRAM (ASCII)
  HOW IT WORKS (plain English)
  THE CODE (every line commented)
  NEXT STEPS / challenges
  GPIO safety warning (always, before any pin code)
  Reading level: grade 6-8, Sky's voice, warm + patient

Piston note: GPIO/hardware imports fail in sandbox — expected, note in UI

---

## IDB (db.js v6)
Stores: sheets, vault, config, panels, books, prints, scenes, worlds
config store: keyPath='key', writes need {key:'x', data:value}, reads return {key,data}
Bump to v7 when adding: builds
Helpers: dbSet(store, val), dbGet(store, key), dbGetAll(store)

---

## BLOOMCORE FORMAT
See BLOOMCORE_TEMPLATE.md in repo root.
Header block on every file. Section dividers: // ── NAME ──
Comment the WHY not the WHAT.

---

## KNOWN GOTCHAS
- PATCH WORKFLOW: inline python only, grep anchors first, never patch twice
- Blank screen = JS syntax error — check console before anything else
- HF bumper: git push origin main --force if diverged
- Git Bash 4096 char limit: use Supabase edge fn for large JS
- view-{id} MUST be inside #screen-app or invisible
- IDB v6, bump to v7 for builds store
- config store reads return {key, data} — must access .data
- PayPal capture: paypal_orders DB table, NOT custom_id
- AudioContext: auto-suspends, resume() needs user gesture
- code.js: state.session?.access_token NOT getSession()
- Vercel CDN lag: Ctrl+Shift+R after deploy
- Piston: GPIO imports fail (no hardware) — expected
- card.js helpers at bottom — reuse _roundRect/_wrapText, never redefine
- Tab drag: initTabDrag() only wires tabs present at call time
  If tabs added dynamically later, call initTabDrag() again
- Backend push: no --force needed (no HF bumper on api repo)
