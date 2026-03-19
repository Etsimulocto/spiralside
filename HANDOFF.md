# SPIRALSIDE HANDOFF v7
# March 19 2026

## ORIENTATION
Read this file first. Inspect repo before asking questions.
Nimbis = Claude in-project name (from // Nimbis anchor: comment in every file)
Architect = the developer (quarterbitgames / Etsimulocto on GitHub)

---

## STACK
Frontend:  Vercel -> spiralside.com / Etsimulocto/spiralside
Backend:   Railway -> web-production-4e6f3.up.railway.app / Etsimulocto/spiralside-api
DB/Auth:   Supabase -> project: qfawusrelwthxabfbglg
Assets:    HuggingFace -> quarterbitgames/spiralside (Space)
AI:        Anthropic + OpenAI via Railway backend
DNS:       Cloudflare

Local: ~/spiralside (frontend), ~/spiralside-api (backend)
Python: /c/Users/quart/AppData/Local/Programs/Python/Python313/python

---

## GIT WORKFLOW — CRITICAL

HuggingFace auto-bumps version and force-pushes after every push = constant diverge.

Always use:
  git pull --no-rebase && git push

If stuck/diverged:
  git commit --allow-empty -m "chore: trigger redeploy" && git push --force

Config (run once):
  git config pull.rebase false

For large JS files — Git Bash has ~4096 char line limit on inline Python.
Use Supabase Edge Functions to host file, curl it down:
  curl -s "https://qfawusrelwthxabfbglg.supabase.co/functions/v1/serve-spiralcut"     -o ~/spiralside/js/app/views/spiralcut.js
Deploy new files via Supabase MCP deploy_edge_function tool.

---

## TAB BAR ORDER (v0.8.175)
chat | forge | cards | codex | imagine | cut | vault | library | music | style | store | account

Tab IDs map to view divs: tab-{id} -> view-{id} inside #screen-app

---

## ADDING A NEW TAB — CHECKLIST

1. state.js — add to FAB_TABS: { id, label, icon, color, onOpen: () => window.init{Name}View && window.init{Name}View() }
2. index.html — add tab button to tab bar: <button class="tab-btn" id="tab-{id}" onclick="switchView('{id}')">icon label</button>
3. index.html — add view div INSIDE #screen-app (before </div><!-- end #screen-app -->): <div class="view" id="view-{id}"></div>
4. js/app/views/{id}.js — create view module with export function init{Name}View()
5. js/app/ui.js — add to viewInits: {id}: () => window.init{Name}View && window.init{Name}View()
6. js/app/main.js — import init{Name}View, expose as window.init{Name}View

CRITICAL: view div MUST be inside #screen-app or it renders invisibly (parent = BODY)

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

---

## IDB STORES (db.js v6)
sheets, vault, config, panels, books, prints, scenes, worlds
Bump version to 7 if adding new stores.

---

## CARD SYSTEM (card.js)
Character: renderCard(print, artImage)  400x560 canvas, takes soul print JSON
Scene:     renderSceneCard(scene)        560x360 canvas
World:     renderWorldCard(world)        400x560 canvas
IDs:       generateCardId(type)          SCN-XXXX / WLD-XXXX / CHR-XXXX

Scene fields: id, name, caption, mood, time, camera, location, world, image
World fields: id, name, tagline, biome, lore, threat, locations[], palette[], image

---

## SPIRALCUT (views/spiralcut.js) v0.1 MOCKUP
Asset bin (scenes/worlds/cast) + preview + inspector + storyboard timeline.
Not wired to real IDB yet — shows placeholders.

Hosted via Supabase Edge Function (name: serve-spiralcut):
  https://qfawusrelwthxabfbglg.supabase.co/functions/v1/serve-spiralcut

To update spiralcut.js:
  1. Deploy via Supabase MCP deploy_edge_function
  2. curl -s [url] -o ~/spiralside/js/app/views/spiralcut.js
  3. git add, commit, push

---

## PRODUCTION VISION: SPIRALCUT PIPELINE
Character prints (forge)
  + Scene cards -> shots/panels
  + World cards -> setting/palette
  -> SpiralCut storyboard (arrange order)
  -> Render: scene fields -> image prompt -> Imagine -> image per panel
  -> Animate: image -> WAN 2.2 -> ~5s clip per panel
  -> Export: download clips, stitch in CapCut/DaVinci externally
  -> Comic mode: panels -> comic viewer (library.js books system)

Video limit: ~3-10s per clip. Spiralside = clip maker, not full video editor.

---

## NEXT PRIORITIES
1. Wire SpiralCut asset bin to real IDB scenes/worlds/prints
2. Wire gen image button -> Imagine with scene card prompt pre-filled
3. Storyboard persistence to IDB
4. Character card export from codex tab

---

## KNOWN GOTCHAS
- HF bumper races every push -> git pull --no-rebase && git push
- Git Bash 4096 char limit -> use Supabase edge fn for large JS files
- view-{id} MUST be inside #screen-app or invisible
- IDB v6, bump to v7 for new stores
- style.js bg layers on body: z-index image < overlay < grid < scanlines < particles < UI
- PayPal capture uses DB lookup (paypal_orders table), not custom_id
- AudioContext auto-suspends, resume() needs user gesture
