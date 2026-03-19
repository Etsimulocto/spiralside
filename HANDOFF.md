# SPIRALSIDE HANDOFF v14
# March 19 2026

## ORIENTATION
Read this file first. Inspect repo before asking questions.
Nimbis = Claude in-project name (Nimbis anchor comment in every file header)
Architect = the developer (quarterbitgames / Etsimulocto on GitHub)
Also sells: Bloomslice Teak (Amazon) — Raspberry Pi module stand

---

## THE BIG VISION — BLOOMCORE OS
Spiralside is an AI workstation OS. Each tab is an app.
Pi5 16GB in Architects rack is the server. Browser is the interface.
Sky and crew are the AI layer. This is also a STEM education platform.

Sky dream: kid cracks open a Pi, scans QR on Bloomslice Teak box,
Sky says hi, an hour later they blinked an LED and saved a Build Card.
Teacher prints it. Goes on the wall. That is the dream.

---

## STACK
Frontend:  Vercel -> spiralside.com / Etsimulocto/spiralside
Backend:   Railway -> web-production-4e6f3.up.railway.app / Etsimulocto/spiralside-api
DB/Auth:   Supabase -> project: qfawusrelwthxabfbglg
Assets:    HuggingFace -> quarterbitgames/spiralside (Space)
AI:        Anthropic + OpenAI via Railway backend
DNS:       Cloudflare
Hardware:  Raspberry Pi 5 16GB in custom rack (Architect local)
Local: ~/spiralside (frontend) ~/spiralside-api (backend)
Python: /c/Users/quart/AppData/Local/Programs/Python/Python313/python

---

## PATCH WORKFLOW — ALWAYS USE THIS

NEVER heredoc over 50 lines — Git Bash 4096 char limit truncates silently
NEVER r-triple-quote raw strings inside heredocs — same truncation issue
NEVER byte-offset slice HTML — offsets shift after every edit
NEVER cat > /tmp/file << EOF with single-quoted content inside
NEVER lines with trailing commas in heredoc — triggers > continuation prompt
ALWAYS write long scripts to disk first with short heredoc then run:
  python - << PYEOF
  open("_s.py","w").write("script content — no raw strings")
  PYEOF
  python _s.py && rm _s.py
ALWAYS str.replace() with exact literal text — no byte offsets ever
ALWAYS print(repr(src[idx:idx+200])) before any HTML replace
HTML replace pattern:
  1. short heredoc to print repr of exact text around target
  2. write _old.txt in separate short heredoc using chr(10) for newlines
  3. write _new.txt in separate short heredoc
  4. apply: short heredoc reads both files and does str.replace()
GIT PUSH:
  Frontend: git add . && git commit -m msg && git push origin main --force
  Backend:  git add . && git commit -m msg && git push (no --force)
HF auto-bumps version on every frontend push — version lag is normal

---

## WHAT CHANGED THIS SESSION (v0.8.198 -> v0.8.211)

### OPTIONS PANEL (js/app/models.js v2.0)
Replaced old flat input-menu popup with collapsible Options Panel.
Sections: models / tools / voice with STT and TTS toggles
Plus button is 34px round and opens/closes panel with outside-click-to-close
Mic button wired to Web Speech API STT — Chrome/Edge native — free
Spiral SVG send button replaces old up-arrow
Model indicator bar below input shows active model and estimated cost

Key exports from models.js:
  toggleInputMenu()        opens/closes options panel
  togglePanelSection(id)   expands/collapses a section
  selectModel(m)           sets active model
  toggleMic()              starts/stops STT recording
  speakReply(text)         TTS playback if enabled
  toggleSTT()              enable/disable mic button
  toggleTTS()              enable/disable auto-read replies
  initModels()             called from main.js on boot

MODELS object replaces old MODEL_COSTS — schema changed this session
initModels() wired in main.js after initChat()
speakReply() imported in chat.js and called after addMessage(data.reply)

### CREDIT SYSTEM REBASE
Old: 1 cr = $0.01 flat CREDIT_COST per message
New: 1 cr = $0.0001 (one hundredth of a penny) cost plus 17% margin
Philosophy: cost plus 17% covers hosting/tax/maintenance — no profit motive
Architect wants cheapest possible AI for users

Pack sizes: $5 = 50000cr / $10 = 110000cr / $20 = 240000cr
Per-message costs at avg 500 input + 200 output tokens:
  Haiku:  (0.80*500 + 4.00*200) / 1e6 * 1.17 / 0.0001 = ~14 cr/msg
  Sky 4o: (0.15*500 + 0.60*200) / 1e6 * 1.17 / 0.0001 = ~2 cr/msg
  Sonnet: (3.00*500 + 15.00*200) / 1e6 * 1.17 / 0.0001 = ~53 cr/msg
  Image gen: 500 cr flat
  TTS: 200 cr flat
  STT: 0 cr (browser native)
  Video: 2000 cr flat

Supabase migration already run this session:
  UPDATE user_usage SET credits = ROUND((credits*100)::numeric, 2)
All 4 users migrated. Architect balance: 19917 -> 1991696 cr
DO NOT run migration again — would multiply by 100 a second time

### BACKEND (main.py) — VERIFY BEFORE TRUSTING
MODEL_RATES dict and calc_cost() function added. CREDIT_COST removed.
Token-accurate billing uses actual input_tokens/output_tokens from API.
VERIFY with: grep -n "actual_cost" ~/spiralside-api/main.py
If missing re-apply — backend may still use old flat rate.

### STORE (views/store.js + index.html)
Pack amounts updated in both files to 50k/110k/240k cr
Feature pricing rows updated with live cost+17% values and model breakdown
Explainer added: cost plus 17% -- 1cr=$0.0001 -- credits never expire
Credit display: Math.round().toLocaleString() for comma-formatted numbers
store.js initialized guard removed — always re-renders on every visit
NOTE: index.html slide-panel feature rows may still show old values
  emoji encoding mismatch blocked clean replace — verify and fix if needed

---

## TAB BAR (v0.8.211)
chat | pi | forge | cards | codex | imagine | cut | library | vault | music | code | style | store | account
User draggable — order persists to IDB config key tab_order
restoreTabOrder() + initTabDrag() called in main.js after buildFAB()

---

## ADDING A NEW TAB — CHECKLIST
1. index.html — add tab button in #tab-bar
2. index.html — add view div INSIDE #screen-app
3. js/app/ui.js — add to viewInits object
4. js/app/main.js — expose window.init{Name}View via dynamic import
5. js/app/views/{id}.js — create view module export init{Name}View()
CRITICAL: view div MUST be inside #screen-app or renders invisibly

---

## MODULE MAP
js/app/
  main.js       boot -- all imports -- window globals
  state.js      FAB_TABS -- CHARACTERS -- state object -- RAIL
  ui.js         switchView -- viewInits -- buildFAB -- loadUsage
                updateCreditDisplay -- restoreTabOrder -- initTabDrag
  auth.js       Supabase auth
  chat.js       sendMessage -- addMessage -- speakReply wired from models.js
  models.js     OPTIONS PANEL v2 -- STT/TTS -- spiral send -- initModels
  build.js      Forge character builder
  card.js       canvas renderers CHR/WRD/SCN/BCK/BUILD cards
  sheet.js      character sheet view
  library.js    image gallery -- panel editor -- book builder
  imagine.js/2  image generation
  music.js      background music player
  musicview.js  music tab
  style.js      theme editor -- bg layers -- IDB persistence
  vault.js      file vault
  db.js         IDB wrapper v6 (bump to v7 for builds store)
  demo.js       demo mode scripted responses
  comic.js      intro comic player
  codex.js      scene and world cards
  views/
    store.js      credits -- packs -- live pricing -- how-we-charge explainer
    account.js    account info
    studio.js     cards tab
    spiralcut.js  SpiralCut v0.1
    code.js       coding assistant v1.0 LIVE
    pi.js         Bloomslice Studio Pi tab v1.0 LIVE

---

## KNOWN GOTCHAS (UPDATED THIS SESSION)
- SHORT heredocs only — write _s.py first then run it
- NEVER byte-offset HTML — use str.replace with exact literal text
- NEVER r-triple-quote in heredocs — truncates silently
- NEVER trailing commas or continuation lines in heredocs
- HTML replace: repr() to see exact bytes -- _old.txt/_new.txt pattern
- Blank screen = JS syntax error — check console first
- HF bumper: git push origin main --force if diverged
- view-{id} MUST be inside screen-app or renders invisibly
- IDB v6 -- bump to v7 for builds store
- PayPal capture: paypal_orders DB table NOT custom_id
- AudioContext: resume() needs user gesture not init
- code.js: state.session?.access_token NOT getSession()
- Vercel CDN lag: Ctrl+Shift+R after deploy
- store.js initialized guard removed — re-renders every visit
- models.js uses MODELS object not MODEL_COSTS
- Supabase credits col is float — cast to ::numeric for ROUND()
- Backend main.py token patch: verify actual_cost applied before relying
- Supabase migration already done — DO NOT multiply credits again
- Tab drag: initTabDrag() only wires tabs present at call time
- pi.js apostrophes: use textContent= not innerHTML
- card.js helpers at bottom: reuse _roundRect/_wrapText never redefine
- index.html has TWO store sections — slide panel and view-store tab
  both need updates when changing prices or pack amounts
