# SPIRALSIDE — Project Map & Orientation

_Drop this in the spiralside project so Claude knows where everything lives.
Updated 2026-07-03 from `Etsimulocto/spiralside@main` (commit 4e67694).
BloomStudio tab is LIVE on spiralside.com._

---

## Repos (owner: `Etsimulocto`)

| Repo | Branch | Role |
|---|---|---|
| **spiralside** | `main` | The site — Vercel frontend (spiralside.com). **This is the one we edit.** |
| **spiralside-api** | `main` | Backend API |
| **Bloomcore** _(private)_ | `main` | Core agent logic + lore archive |
| **BloomStudio** _(private)_ | `main` | The game maker (to be embedded as a tab) |
| **BloomGame_GM2** _(private)_ | `main` | Game project |
| **SkyCorePi** | `main` | Pi build (note: a 2nd spiralside clone lives at `SkyCorePi/source/spiralside`) |
| Bloomcore, sky-archive-bot | private | agent/bot |
| HybridEngine_TestLab, canon-forge, spiral-reality-sdk, quarterbitgamesfb | public | side projects |

Repo URL pattern: `https://github.com/Etsimulocto/<repo>`

**Local clones (Git Bash, Windows):**
- `/c/Users/quart/spiralside` ← **primary push folder**
- `/c/Users/quart/SkyCorePi/source/spiralside` ← secondary, ignore unless intended

**Push loop:** edit files here → drop into `/c/Users/quart/spiralside` → `git add . && git commit -m "…" && git push origin main` → Vercel auto-deploys. No `--force`. Watch Windows CRLF.

---

## Stack
- **Frontend:** Vercel (spiralside.com) — single `index.html` shell + ES-module views
- **Backend:** Railway (spiralside-api) · **DB/Auth:** Supabase · **Assets:** HuggingFace
- **Type/tokens:** DM Mono + Syne, neon teal/pink/purple, CSS vars in `:root`
- Installable **PWA** (so mobile layout still matters)

---

## File structure (spiralside repo)

```
index.html            ← app shell, ~3,700 lines: all base CSS, :root tokens,
                         #screen-app frame, #tab-bar, switchView() wiring
support.js            ← (BloomStudio runtime, unrelated to spiralside)

js/app/               ← core modules
  main.js (33k)         boot + view registry + switchView
  ui.js (22k)           shared UI: tab bar, cards, buttons, toasts
  state.js  db.js  opfs.js  sync.js  mastersave.js   ← state/persistence
  auth.js  models.js                                 ← auth + AI models
  chat.js  imagine.js  library.js  sheet.js  card.js ← big feature modules
  build.js  codex.js  comic.js  demo.js  music.js  musicview.js
  particles.js  pdf.js  sky.js  style.js  colorSketches.js  bloomslice.js  vault.js

js/app/views/         ← tab views (self-contained: injectStyles()+init…View())
  account.js  bloomengine.js  bloomstudio.js  code.js  cut.js  forge.js
  guide.js  pi.js (52k)  quest.js (104k)  spiral.js  spiralcut.js
  store.js  studio.js  vault.js

bloomstudio/index.html  ← compiled self-contained BloomStudio bundle (252 KB),
                          served at /bloomstudio/index.html, iframe-embedded by
                          the bloomstudio tab. SNAPSHOT — re-compile from the DC
                          to update (see "BloomStudio tab" below).

codex/archetypes/*.json     character/archetype data
comics/  (intro.json + panels/*.png)   intro comic
bloomslice/data/products.json          store data
icons/  legal/  migrations/  scripts/  utilities/
api/cannonize.js
_*.py  _*.txt   ← ~115 one-off patch scripts at root (historical, ignorable)
```

---

## Known issues / the job

1. **"Portrait" look = intentional phone cap.** In `index.html` (~line 307):
   `#screen-app { max-width: min(480px,100vw) }` stepping up at breakpoints.
   On desktop = skinny centered strip + dead gutters. Nav is a bottom
   horizontal-scrolling strip of ~22 emoji tabs (mobile pattern).

2. **Phased plan:**
   - **A** _(TODO)_ — responsive shell: left sidebar nav on wide screens, content
     fills width, keep phone column on mobile + token refresh.
   - **B** _(✅ DONE — live on spiralside.com)_ — BloomStudio wired in as
     `view-bloomstudio` via iframe-embed. See below.
   - **C** _(TODO)_ — per-view desktop polish (single-col phone grids → desktop
     layouts).

3. **Already staged** (commit to test the loop) — `index.html` ~line 308:
   ```css
   @media (min-width:900px)  { #screen-app { max-width: min(960px,100vw); } }
   @media (min-width:1200px) { #screen-app { max-width: min(1160px,100vw); } }
   @media (min-width:1600px) { #screen-app { max-width: min(1360px,100vw); } }
   ```

---

## BloomStudio tab (Phase B — DONE, live)

BloomStudio ships as an **iframe-embedded** self-contained bundle. Wiring:
- `bloomstudio/index.html` — the compiled bundle (served at `/bloomstudio/index.html`)
- `js/app/views/bloomstudio.js` — lazy-loads the iframe into `#view-bloomstudio`
  on first tab open (zero boot cost, fully isolated, allows fullscreen)
- `js/app/main.js` — registers the view in `switchView`
- `js/app/ui.js` — adds the tab to the tab bar

**To update the game inside the tab:** the bundle is a SNAPSHOT — it does NOT
auto-pick-up edits to the source game (e.g. the enemy-builder built in the
BloomStudio design project). Re-compile the DC → self-contained HTML, then
replace `bloomstudio/index.html` (one file) and push.

**Future upgrade:** a `postMessage` bridge between the iframe and the shell would
let the studio read spiralside auth/credits (noted in `bloomstudio.js`).

---

## Workflow constraint
Claude's GitHub access is **read/import only** — it edits files in the workspace;
**you push** via Git Bash. Claude can read/import any file from the repos above,
build/preview here, and hand back changed files with exact paths.
