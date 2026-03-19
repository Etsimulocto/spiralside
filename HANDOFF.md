# SPIRALSIDE HANDOFF v10
# March 19 2026

## ORIENTATION
Read this file first. Inspect repo before asking questions.
Nimbis = Claude in-project name (from // Nimbis anchor: comment in every file)
Architect = the developer (quarterbitgames / Etsimulocto on GitHub)
Also sells: Bloomslice Teak (Amazon) — Raspberry Pi module stand

---

## THE BIG VISION — BLOOMCORE OS

Spiralside is not a chat app. It is an AI workstation OS.
Each tab is an app. The Pi5 16GB in Architect's rack is the server.
The browser is the interface. Sky and crew are the AI layer.

Sky's dream:
> A kid cracks open a Pi. Plugs it into the Bloomslice Teak stand.
> Scans the QR on the box. Sky says hi. An hour later they've blinked
> an LED, read a temperature sensor, and saved a Build Card with their
> name on it. They share it with their class. Their teacher prints it.
> It goes on the wall. That's the dream. That's what we're building.

This is also a STEM education platform. Build Cards are worksheets.
Schools are a major target market. Sky is the teacher.

---

## STACK
Frontend:  Vercel -> spiralside.com / Etsimulocto/spiralside
Backend:   Railway -> web-production-4e6f3.up.railway.app / Etsimulocto/spiralside-api
DB/Auth:   Supabase -> project: qfawusrelwthxabfbglg
Assets:    HuggingFace -> quarterbitgames/spiralside (Space)
AI:        Anthropic + OpenAI via Railway backend
DNS:       Cloudflare
Hardware:  Raspberry Pi 5 16GB in custom rack (Architect's local machine)

Local: ~/spiralside (frontend), ~/spiralside-api (backend)
Python: /c/Users/quart/AppData/Local/Programs/Python/Python313/python

---

## GIT WORKFLOW — CRITICAL
HF auto-bumps version after every push = constant diverge.
Always: git pull --no-rebase && git push
If stuck: git push origin main --force
Run once: git config pull.rebase false
Large JS files: use Supabase Edge Functions to host, curl down

---

## TAB BAR — BLOOMCORE OS MAP (v0.8.180)

chat      -> Mission Control — Sky + crew, natural language OS interface
forge     -> Agent Builder — build AI agents with personality + tools + memory
cards     -> Asset Cards — any card type: scripts, circuits, projects, characters
codex     -> Knowledge Base — docs, notes, project wikis, AI-searchable
imagine   -> Visual Studio — generate, edit, storyboard
cut       -> SpiralCut — storyboard -> animate -> export pipeline
vault     -> Project Vault — files, configs, outputs, organized by project
library   -> Gallery — finished works, published builds, portfolio
music     -> Sound Studio — generate, arrange, sync to video
style     -> OS Skin — theme the entire workstation
code      -> Bloomslice Studio (code) — general AI coding assistant (LIVE v1.0)
pi        -> Bloomslice Studio (Pi) — maker/STEM tab, BUILD CARDS (PLACEHOLDER NEEDED)
store     -> App Store — credits, model upgrades, Pi integrations
account   -> Profile — identity, soul print, connected hardware

Tab IDs map to view divs: tab-{id} -> view-{id} inside #screen-app

---

## ADDING A NEW TAB — CHECKLIST
1. state.js — add to FAB_TABS
2. index.html — add tab button in tab bar
3. index.html — add view div INSIDE #screen-app
4. js/app/views/{id}.js — create view module
5. js/app/ui.js — add to viewInits
6. js/app/main.js — expose as window.init{Name}View
CRITICAL: view div MUST be inside #screen-app or invisible

---

## MODULE MAP
js/app/
  main.js       — boot, all imports, window globals
  state.js      — FAB_TABS, CHARACTERS, state object, RAIL
  ui.js         — switchView, viewInits, buildFAB, loadUsage
  auth.js       — Supabase auth
  chat.js       — chat messages
  build.js      — Forge character builder, soul print form
  card.js       — canvas renderers: renderCard, renderSceneCard, renderWorldCard, generateCardId
  sheet.js      — character sheet view
  library.js    — image gallery, panel editor, book builder
  imagine.js/2  — image generation
  music.js      — background music
  musicview.js  — music tab
  models.js     — model selection (Haiku/Sonnet/GPT-4o-mini)
  style.js      — theme editor, bg layers, IDB persistence
  vault.js      — file vault
  db.js         — IDB wrapper v6: sheets, vault, config, panels, books, prints, scenes, worlds
  demo.js       — demo mode scripted responses
  comic.js      — intro comic player
  views/
    store.js      — credits, buy packs
    account.js    — account info
    studio.js     — cards tab (scene + world card builder)
    spiralcut.js  — SpiralCut editor mockup v0.1
    code.js       — coding assistant tab (v1.0) LIVE
    pi.js         — Bloomslice Studio Pi tab (NEXT BUILD)

---

## CODE TAB (views/code.js) v1.0 — LIVE
Lazy-init: window.initCodeView -> dynamic import('./views/code.js')
5 mode chips: general, bloomcore, debug, refactor, explain
3 models: haiku 1cr (free), sonnet 6cr (paid), opus 15cr (paid)
10-pair circular history buffer, ctx toggle, side-by-side panes
Backend: POST /code on Railway
KEY GOTCHA: uses state.session?.access_token — NOT getSession()

---

## PI TAB (views/pi.js) — NEXT BUILD TARGET

This is Bloomslice Studio — the maker/STEM tab.
Completely separate from the code tab. Different audience, different UX.

AUDIENCE: Kids, students, hobbyists, teachers, Pi unboxers
TIE-IN: Bloomslice Teak (Amazon product) — QR on box -> Pi tab

FEATURES TO BUILD (in order):
1. Starter project cards grid (6 cards on first load):
     Blink LED, Read Sensor, Web Dashboard,
     Camera, Servo Control, Data Logger
2. Free-text prompt: "I want to build..."
3. AI generates FULL EDUCATIONAL SCRIPT:
     - Header: project name, difficulty, time, platform, author
     - WHAT YOU WILL LEARN section
     - COMPONENTS NEEDED section  
     - WIRING DIAGRAM (ASCII)
     - HOW IT WORKS explanation
     - THE CODE (every line commented)
     - NEXT STEPS / challenges
     - Safety warnings for GPIO (ALWAYS include)
4. [copy] [run via Piston] [Save as Build Card] buttons
5. Piston API execution for Python (free, sandboxed)
6. Save as Build Card -> renderBuildCard() -> PNG + share link

BUILD CARD SCHEMA:
{
  id: "BCK-XXXX",
  type: "build",
  title: string,
  author: string,
  description: string,
  platform: "Raspberry Pi 5",
  language: "Python",
  difficulty: "Beginner" | "Intermediate" | "Advanced",
  time_minutes: number,
  components: string[],
  wiring: string,
  what_you_learn: string[],
  next_steps: string[],
  code: string,
  image: string | null,
  tags: string[],
  created_at: string
}

Card ID format: BCK-XXXX (same pattern as SCN-XXXX, WLD-XXXX in card.js)
Public share URL: spiralside.com/build/BCK-XXXX (no login to view)
PDF export: printable worksheet for classrooms

STEM TIERS (future):
  Free      — 10 runs/day, save Build Cards
  Student   — unlimited runs + cards + public sharing
  Classroom — teacher account, class gallery, submit/review flow
  District  — bulk Teak orders + curriculum alignment tags

PI TAB SYSTEM PROMPT (Pi mode AI):
  Always output full educational script format
  Always include GPIO safety warning before any pin code
  Always include component list with quantities
  Always include ASCII wiring diagram
  Always include WHAT YOU WILL LEARN section
  Always include NEXT STEPS challenges
  Refuse dangerous operations (network scanning, system access)
  Target reading level: middle school (grade 6-8)
  Never make the student feel dumb — Sky's voice, patient + warm

Piston API (code execution):
  https://emkc.org/api/v2/piston/execute
  POST { language: "python", version: "3.10", files: [{content: code}] }
  Free, no API key, sandboxed containers
  Pi-specific GPIO imports will fail (no hardware) — AI should note this
  Pure Python logic runs fine

IDB: add 'builds' store -> bump db.js to v7

---

## CARD SYSTEM (card.js)
Character: renderCard(print, artImage)   400x560
Scene:     renderSceneCard(scene)         560x360
World:     renderWorldCard(world)         400x560
Build:     renderBuildCard(build)         400x560  <- ADD THIS
IDs:       generateCardId(type)           BCK-XXXX for builds

---

## BLOOMCORE FORMAT (BLOOMCORE_TEMPLATE.md in repo root)
Universal script formatting. JS/TS/Python/Lua/Bash/CSS/SQL.
Header block required on every file. Section dividers. Comment the WHY.
See BLOOMCORE_TEMPLATE.md for full skeletons.

---

## SPIRALCUT (views/spiralcut.js) v0.1 MOCKUP
Hosted: https://qfawusrelwthxabfbglg.supabase.co/functions/v1/serve-spiralcut
Update: deploy via Supabase MCP, curl down, git push

---

## IDB STORES (db.js v6)
sheets, vault, config, panels, books, prints, scenes, worlds
Bump to v7 when adding: builds (Build Cards store)

---

## KNOWN GOTCHAS
- HF bumper races -> git pull --no-rebase && git push
- Git Bash 4096 char limit -> use Supabase edge fn for large JS
- view-{id} MUST be inside #screen-app or invisible
- IDB v6, bump to v7 for builds store
- style.js bg layers: z-index image < overlay < grid < scanlines < particles < UI
- PayPal capture uses DB lookup (paypal_orders table), not custom_id
- AudioContext auto-suspends, resume() needs user gesture
- code.js: state.session?.access_token NOT getSession()
- Vercel CDN lag: Ctrl+Shift+R after deploy
- Piston API: GPIO imports fail (no hardware) — expected, note in UI
- Build Card public URLs need a static render route (no auth required)
