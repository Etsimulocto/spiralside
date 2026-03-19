# SPIRALSIDE HANDOFF v11
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

## !!!!! PATCH WORKFLOW — READ THIS EVERY TIME !!!!!

NEVER create downloadable files for patches.
NEVER ask Architect to move files to /tmp/ or anywhere.
ALWAYS write and run patches inline using this exact pattern:

  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe - << 'EOF'
  # python patch code here
  # reads/writes files relative to cwd
  EOF

Always run from the correct directory first:
  cd ~/spiralside        (for frontend patches)
  cd ~/spiralside-api    (for backend patches)

For large JS files that exceed Git Bash line limits:
  Deploy via Supabase MCP deploy_edge_function
  Then curl down: curl -s [edge_fn_url] -o [target_path]
  Then git add/commit/push

GIT PUSH PATTERN:
  Frontend: git add . && git commit -m "msg" && git push origin main --force
  Backend:  git add . && git commit -m "msg" && git push
  (backend does NOT need --force, no HF bumper)

HF auto-bumps version on every frontend push = diverge is normal.
If stuck: git push origin main --force
Run once: git config pull.rebase false

---

## TAB BAR — BLOOMCORE OS MAP (v0.8.186)
chat      -> Mission Control
forge     -> Agent Builder
cards     -> Asset Cards
codex     -> Knowledge Base
imagine   -> Visual Studio
cut       -> SpiralCut pipeline
vault     -> Project Vault
library   -> Gallery
music     -> Sound Studio
style     -> OS Skin
code      -> Bloomslice Studio (code) — LIVE v1.0
pi        -> Bloomslice Studio (Pi)   — PLACEHOLDER NEEDED (next build)
store     -> App Store
account   -> Profile

Tab IDs map to view divs: tab-{id} -> view-{id} inside #screen-app

---

## ADDING A NEW TAB — CHECKLIST
1. state.js  — add to FAB_TABS array
2. index.html — add <button class="tab-btn" id="tab-{id}" onclick="switchView('{id}')"> in tab bar
3. index.html — add <div class="view" id="view-{id}"></div> INSIDE #screen-app
4. js/app/views/{id}.js — create view module, export function init{Name}View()
5. js/app/ui.js — add to viewInits: {id}: () => window.init{Name}View && window.init{Name}View()
6. js/app/main.js — expose: window.init{Name}View = () => { import('./views/{id}.js').then(...) }
CRITICAL: view div MUST be inside #screen-app div or it renders invisibly

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
  ui.js         — switchView, viewInits, buildFAB, loadUsage
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
    pi.js         — Bloomslice Studio Pi tab — NOT BUILT YET

---

## CARD SYSTEM (card.js) — CURRENT STATE
Character: renderCard(print, artImage)     400x560  LIVE
Scene:     renderSceneCard(scene)           560x360  LIVE
World:     renderWorldCard(world)           400x560  LIVE
Build:     renderBuildCard(build)           400x560  LIVE (added this session)
IDs:       generateCardId(type)
  CHR / WRD / EVT / SCN / CMP / BCK (build)

All renderers follow same pattern:
- CARD_W=400 CARD_H=560 (scene is 560x360)
- Background: #08080d always
- Border: color glow + 3px stroke, _roundRect()
- Header gradient: color+'dd' -> #08080d
- Art area: image or placeholder, cover-fit with clip, bottom fade
- Footer: dark bar + accent line + ID left / label center / SPIRALSIDE right
- Helpers: _roundRect(ctx,x,y,w,h,r) and _wrapText(ctx,text,x,y,maxW,lineH)
  These are defined at bottom of card.js — reuse, do NOT redefine

Build card specifics:
- Color anchor: #FF4BCB (Bloomslice pink)
- Difficulty badge overlaid on art (BEGINNER teal / INTERMEDIATE yellow / ADVANCED pink)
- Components list with bullet dots (replaces stat bars)
- What You'll Learn with checkmarks (replaces vibe/lifecycle)
- Author strip above footer
- Art placeholder: circuit dot-grid + trace lines + large pi emoji

Build card schema:
{
  id: "BCK-XXXX",  type: "build",
  title, author, description, platform, language,
  difficulty: "Beginner"|"Intermediate"|"Advanced",
  time_minutes, components[], what_you_learn[],
  next_steps[], code, image, tags[], created_at
}

---

## CODE TAB (views/code.js) v1.0 — LIVE
Lazy-init: window.initCodeView -> dynamic import('./views/code.js')
5 mode chips: general, bloomcore, debug, refactor, explain
3 models: haiku 1cr (free), sonnet 6cr (paid), opus 15cr (paid)
10-pair circular history buffer, ctx toggle, side-by-side panes
Backend: POST /code on Railway
KEY GOTCHA: uses state.session?.access_token — NOT getSession()

---

## PI TAB (views/pi.js) — NOT BUILT YET — NEXT TARGET

This is Bloomslice Studio — the maker/STEM tab.
Different from code tab: starter cards, educational output, Build Cards.
Audience: kids, students, hobbyists, teachers, Pi unboxers.
Tie-in: Bloomslice Teak (Amazon) — QR on box -> Pi tab.

BUILD ORDER:
1. Stub pi.js — register tab, show placeholder (Sky intro message)
2. Starter project cards grid (6 cards): Blink LED, Read Sensor,
   Web Dashboard, Camera, Servo Control, Data Logger
3. Free-text prompt: "I want to build..."
4. Pi mode AI — generates FULL EDUCATIONAL SCRIPT:
   Header (name/difficulty/time/platform/author)
   WHAT YOU WILL LEARN section
   COMPONENTS NEEDED section
   WIRING DIAGRAM (ASCII)
   HOW IT WORKS explanation
   THE CODE (every line commented)
   NEXT STEPS / challenges
   GPIO safety warning always included
5. [copy] [run via Piston] [Save as Build Card] buttons
6. Piston execution: POST https://emkc.org/api/v2/piston/execute
   { language:"python", version:"3.10", files:[{content:code}] }
   Free, no API key, sandboxed — GPIO imports will fail (no HW), note this in UI
7. Save as Build Card -> renderBuildCard() already in card.js
   Store in IDB 'builds' store (bump db.js to v7)

PI MODE SYSTEM PROMPT RULES:
- Always output full educational script format
- Always GPIO safety warning before any pin code
- Always component list with quantities
- Always ASCII wiring diagram
- Always WHAT YOU WILL LEARN
- Always NEXT STEPS challenges
- Refuse dangerous ops (network scan, system access)
- Target reading level: middle school (grade 6-8)
- Sky's voice: patient, warm, never makes student feel dumb

STEM TIERS (future):
  Free / Student / Classroom / District

---

## IDB STORES (db.js v6)
sheets, vault, config, panels, books, prints, scenes, worlds
Bump to v7 when adding: builds (Build Cards)

---

## BLOOMCORE FORMAT
See BLOOMCORE_TEMPLATE.md in repo root.
Every file: header block, section dividers, comment the WHY.
Section dividers: // ── NAME ─── (adapt comment char per language)

---

## KNOWN GOTCHAS
- PATCH WORKFLOW: always inline python, never create files — see top of this doc
- HF bumper: git push origin main --force if diverged
- Git Bash 4096 char limit: use Supabase edge fn for large JS
- view-{id} MUST be inside #screen-app or invisible
- IDB v6, bump to v7 for builds store
- style.js bg layers: z-index image < overlay < grid < scanlines < particles < UI
- PayPal capture: uses paypal_orders DB table, NOT custom_id
- AudioContext: auto-suspends, resume() needs user gesture
- code.js: state.session?.access_token NOT getSession()
- Vercel CDN lag: Ctrl+Shift+R after deploy
- Piston: GPIO imports fail (no hardware) — expected, note in UI
- card.js helpers _roundRect/_wrapText at bottom of file — reuse, never redefine
- Backend push does NOT need --force (no HF bumper on api repo)
