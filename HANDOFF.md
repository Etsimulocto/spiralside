# SPIRALSIDE HANDOFF v13
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
NEVER run a patch twice — grep to verify before patching.
NEVER transport JS through edge functions — escape sequences mangle.
ALWAYS write JS files directly with inline Python:

  cd ~/spiralside  (or ~/spiralside-api for backend)
  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe - << 'PYEOF'
  content = r"""
  // js content here — raw string, no escaping needed
  """
  open('path/to/file.js', 'w', encoding='utf-8').write(content)
  print('written')
  PYEOF

For targeted patches (find/replace):
  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe - << 'EOF'
  src = open('file.js', encoding='utf-8').read()
  src = src.replace('old', 'new', 1)
  open('file.js', 'w', encoding='utf-8').write(src)
  EOF

GIT PUSH:
  Frontend: git add . && git commit -m "msg" && git push origin main --force
  Backend:  git add . && git commit -m "msg" && git push

HF auto-bumps version on every frontend push — diverge is normal.
If stuck: git push origin main --force

---

## TAB BAR — BLOOMCORE OS MAP (v0.8.198)
chat | pi | forge | cards | codex | imagine | cut | library | vault | music | code | style | store | account
(user draggable — order persists to IDB config key 'tab_order')

restoreTabOrder() + initTabDrag() called in main.js after buildFAB()
Both exported from ui.js

---

## ADDING A NEW TAB — CHECKLIST
1. index.html — add tab button in #tab-bar
2. index.html — add view div INSIDE #screen-app
3. js/app/ui.js — add to viewInits object
4. js/app/main.js — expose window.init{Name}View via dynamic import
5. js/app/views/{id}.js — create view module, export init{Name}View()
CRITICAL: view div MUST be inside #screen-app or renders invisibly
NOTE: tab drag auto-wires to all .tab-btn elements

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
  db.js         — IDB wrapper v6
  demo.js       — demo mode scripted responses
  comic.js      — intro comic player
  views/
    store.js      — credits, buy packs
    account.js    — account info
    studio.js     — cards tab
    spiralcut.js  — SpiralCut mockup v0.1
    code.js       — coding assistant LIVE v1.0
    pi.js         — Bloomslice Studio Pi tab LIVE v1.0

---

## CARD SYSTEM (card.js)
Character: renderCard(print, artImage)     400x560  LIVE
Scene:     renderSceneCard(scene)           560x360  LIVE
World:     renderWorldCard(world)           400x560  LIVE
Build:     renderBuildCard(build)           400x560  LIVE
IDs:       generateCardId(type): CHR/WRD/EVT/SCN/CMP/BCK

All renderers: #08080d bg, border glow, header gradient,
art area (cover-fit+clip+fade), footer (ID/label/SPIRALSIDE)
Helpers _roundRect + _wrapText at bottom — reuse, never redefine

Build card: #FF4BCB pink, difficulty badge, components,
what-you-learn, author strip, circuit dot-grid placeholder

Build card schema:
{ id, type:'build', title, author, description, platform,
  language, difficulty, time_minutes, components[],
  what_you_learn[], next_steps[], code, image, tags[], created_at }

---

## CODE TAB (views/code.js) v1.0 — LIVE
5 modes: general, bloomcore, debug, refactor, explain
3 models: haiku 1cr (free), sonnet 6cr (paid), opus 15cr (paid)
10-pair circular history, ctx toggle, side-by-side panes
Backend: POST /code
GOTCHA: state.session?.access_token — NOT getSession()

---

## PI TAB (views/pi.js) v1.0 — LIVE
Bloomslice Studio — maker/STEM tab. WORKING as of v0.8.198.

FEATURES LIVE:
- 6 starter cards (Blink LED, Read Sensor, Web Server,
  Camera Snap, Servo, Data Logger) — click to pre-fill + generate
- Free-text prompt + generate button
- Sky-voiced educational script output (Sky char + Pi educator prompt)
- Line-by-line code block renderer (NO regex — safe from mangling)
- Piston execution: POST https://emkc.org/api/v2/piston/execute
  GPIO/hardware imports fail in sandbox — shows yellow warning, expected
- Auto-renders Build Card preview (right pane) after generation
- Save as Build Card to IDB (needs v7 upgrade for builds store)
- Download card as PNG
- Side-by-side panes, mobile stacks at 640px

BACKEND: POST /pi on Railway
- Free users: haiku, capped at FREE_DAILY_LIMIT
- Paid users: sonnet (better for long edu scripts), 90s timeout
- System: Sky character file + PI_EDUCATOR_PROMPT
- PI_EDUCATOR_PROMPT enforces: header format, WHAT YOU'LL LEARN,
  COMPONENTS NEEDED, WIRING DIAGRAM (ASCII), HOW IT WORKS,
  THE CODE (every line commented), NEXT STEPS, GPIO safety warning

GOTCHA: pi.js written directly via Python raw string — NEVER
transport through edge functions (escape sequences mangle)

NEXT STEPS FOR PI TAB:
- IDB v7: add 'builds' store (currently save fails gracefully)
- Saved cards gallery below the panes
- Public share URL: spiralside.com/build/BCK-XXXX
- Model picker (let paid users choose sonnet vs opus)

---

## IDB (db.js v6)
Stores: sheets, vault, config, panels, books, prints, scenes, worlds
config: keyPath='key', writes {key:'x',data:value}, reads return {key,data}
Bump to v7 when adding: builds
Helpers: dbSet(store,val), dbGet(store,key), dbGetAll(store)

---

## BLOOMCORE FORMAT
See BLOOMCORE_TEMPLATE.md in repo root.
Header on every file. Section dividers // ── NAME ──
Comment the WHY not the WHAT.

---

## KNOWN GOTCHAS
- PATCH WORKFLOW: inline python only, grep anchors first, never twice
- JS files: write with Python raw string — NEVER via edge function transport
- Blank screen = JS syntax error — check console first
- HF bumper: git push origin main --force if diverged
- Git Bash 4096 char limit on inline commands (not Python stdin)
- view-{id} MUST be inside #screen-app or invisible
- IDB v6, bump to v7 for builds store
- config store reads return {key,data} — must access .data
- PayPal capture: paypal_orders DB table, NOT custom_id
- AudioContext: auto-suspends, resume() needs user gesture
- code.js: state.session?.access_token NOT getSession()
- Vercel CDN lag: Ctrl+Shift+R after deploy
- Piston: GPIO imports fail (no hardware) — expected, yellow warning
- card.js helpers at bottom — reuse _roundRect/_wrapText, never redefine
- Tab drag: initTabDrag() only wires tabs present at call time
- Backend push: no --force needed (no HF bumper on api repo)
- pi.js apostrophes: use \' in JS strings or textContent= instead of innerHTML
