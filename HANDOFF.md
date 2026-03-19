# SPIRALSIDE HANDOFF v15
# March 19 2026 — end of day

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

## PATCH WORKFLOW — CRITICAL RULES

NEVER heredoc over 50 lines — Git Bash 4096 char limit truncates silently
NEVER r-triple-quote raw strings inside heredocs — same truncation
NEVER byte-offset slice HTML — offsets shift after every edit
NEVER trailing commas or else/elif/try lines in heredocs — triggers > prompt
ALWAYS write long scripts to disk first:
  python - << PYEOF
  open("_s.py","w").write("content no raw strings")
  PYEOF
  python _s.py && rm _s.py
ALWAYS str.replace() with exact literal text
ALWAYS print(repr(src[idx:idx+200])) before any HTML replace
BEST PATTERN for long content: store in Supabase handoff_docs table, fetch via urllib

Supabase relay pattern:
  INSERT INTO handoff_docs (key, content) VALUES (key, content)
  ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;
  Then fetch via urllib.request in a short heredoc and write to disk.

GIT PUSH:
  Frontend: git add . && git commit -m msg && git push origin main --force
  Backend:  git add . && git commit -m msg && git push (no --force)
  NOTE: Vercel stops pushing updates in the evenings — resume next morning

---

## WHAT CHANGED THIS SESSION (v0.8.198 -> v0.8.221)

### OPTIONS PANEL (js/app/models.js v2.0)
Replaced old flat input-menu popup with collapsible Options Panel.
Sections: models / tools / voice with STT and TTS toggles
Plus button is 34px round, opens/closes panel, outside-click closes
Mic button wired to Web Speech API STT — Chrome/Edge native — free
Spiral SVG send button replaces old up-arrow
Model indicator bar below input shows active model and deduction per message
Default model changed to Sky/4o (cheapest + best Sky character fit)

Key exports: toggleInputMenu, togglePanelSection, selectModel
  toggleMic, speakReply, toggleSTT, toggleTTS, initModels
MODELS object replaces old MODEL_COSTS — schema changed this session
initModels() wired in main.js after initChat()
speakReply() imported in chat.js and fires after bot reply if TTS on

### CREDIT SYSTEM REBASE
1 cr = $0.00001 (1/100,000th of a dollar — 1 penny = 1000 credits)
Cost + 17% margin covers hosting/tax/maintenance — no profit motive
Architect wants cheapest possible AI for users

Pack sizes: $5 = 500,000cr / $10 = 1,100,000cr / $20 = 2,400,000cr
Per-message costs at avg 500 input + 200 output tokens:
  Haiku:  ~140 cr/msg
  Sky 4o: ~23 cr/msg  (cheapest — default model)
  Sonnet: ~527 cr/msg
  Image gen: 500 cr flat (needs updating to new unit)
  TTS: 200 cr flat (needs updating to new unit)
  STT: 0 cr (browser native)
  Video: 2,000 cr flat (needs updating to new unit)

Supabase migrations run this session (DO NOT run again):
  1st: UPDATE user_usage SET credits = ROUND((credits*100)::numeric, 2)
  2nd: UPDATE user_usage SET credits = ROUND((credits*10)::numeric, 2)
  Net effect: all balances x1000 from original
  Architect balance: ~19917 -> 19,916,932 cr (some spent on chat)

### BACKEND (main.py) — CURRENT STATE
MODEL_RATES dict + calc_cost() function — replaces flat CREDIT_COST
Token-accurate billing using actual input_tokens/output_tokens from API
VERIFY: grep -n "actual_cost\|calc_cost\|MODEL_RATES" ~/spiralside-api/main.py
calc_cost divisor is 0.00001 (matches new 1cr=$0.00001 unit)

New endpoints added this session:
  POST /send-gift  — deducts credits from sender, generates SPIRAL code
  POST /create-gift — PayPal $5 flow, generates SPIRAL code
  POST /redeem-gift — validates code, credits recipient account

### GIFT SYSTEM — LIVE (needs morning verification)
gift_codes table in Supabase:
  code TEXT PK, credits INT, amount_paid NUMERIC
  created_by UUID, redeemed_by UUID, deducted_from UUID
  redeemed_at TIMESTAMPTZ, created_at TIMESTAMPTZ

Code format: SPIRAL-XXXX-XXXX (uppercase alphanumeric)
Rules: cannot redeem own code, code single-use only

Frontend: gift section at bottom of store tab (views/store.js)
  - Send from balance: amount input + "send from balance" button
  - Buy $5 gift: PayPal flow -> SPIRAL code
  - Redeem: code input + "redeem" button
  - Success/error messages in #gift-msg div

window.sendGift() — at line ~192 in main.js
window.redeemGift() — at line ~209 in main.js
window.buyGift() — at line ~226 in main.js

TODO MORNING: verify gift flow end-to-end (send -> code -> redeem)
TODO: buyGift PayPal return handler needs to call /create-gift not /capture-order
  Check localStorage pending_gift_order on PayPal return in handlePayPalReturn()

### STORE (views/store.js + index.html)
Pack amounts: 500k/1.1M/2.4M cr in both files
Feature pricing: ~140/~23/~527 cr with model breakdown and cost+17% explainer
store.js initialized guard removed — always re-renders
NOTE: image/TTS/video flat cr amounts in store still in old units — need update

### VERSION BADGE
Made bigger: font-size 0.75rem, opacity 1, padding 4px 12px

---

## TAB BAR (v0.8.221)
chat | pi | forge | cards | codex | imagine | cut | library | vault | music | code | style | store | account
User draggable — order persists to IDB config key tab_order

---

## MODULE MAP
js/app/
  main.js       boot -- imports -- window globals
                window.sendGift / redeemGift / buyGift added end of file
  state.js      FAB_TABS -- CHARACTERS -- state -- RAIL
  ui.js         switchView -- buildFAB -- loadUsage -- updateCreditDisplay
  auth.js       Supabase auth
  chat.js       sendMessage -- addMessage -- speakReply wired
  models.js     OPTIONS PANEL v2 -- STT/TTS -- spiral send -- initModels
                default model: 4o (Sky/4o-mini)
  build.js      Forge character builder
  card.js       canvas renderers CHR/WRD/SCN/BCK/BUILD
  sheet.js      character sheet view
  library.js    image gallery -- panel editor -- book builder
  imagine.js/2  image generation
  music.js      background music
  musicview.js  music tab
  style.js      theme editor -- IDB persistence
  vault.js      file vault
  db.js         IDB wrapper v6 (bump to v7 for builds store)
  demo.js       demo mode scripted responses
  comic.js      intro comic player
  codex.js      scene and world cards
  views/
    store.js      credits -- packs -- live pricing -- gift section
    account.js    account info
    studio.js     cards tab
    spiralcut.js  SpiralCut v0.1
    code.js       coding assistant v1.0 LIVE
    pi.js         Bloomslice Studio Pi tab v1.0 LIVE

---

## KNOWN GOTCHAS (UPDATED THIS SESSION)
- SHORT heredocs only — write _s.py first then run it
- NEVER byte-offset HTML — str.replace with exact literal text
- NEVER r-triple-quote in heredocs
- NEVER trailing commas or else/elif in heredoc lines
- HTML replace: repr() first -- _old.txt/_new.txt pattern
- BEST: use Supabase handoff_docs relay for long content
- Blank screen = JS syntax error — check console
- HF bumper: git push origin main --force if diverged
- Vercel stops pushing in evenings — resume next morning
- view-{id} MUST be inside screen-app or renders invisibly
- IDB v6 -- bump to v7 for builds store
- PayPal capture: paypal_orders DB table NOT custom_id
- AudioContext: resume() needs user gesture
- code.js: state.session?.access_token NOT getSession()
- Vercel CDN lag: Ctrl+Shift+R after deploy
- store.js initialized guard removed — re-renders every visit
- models.js uses MODELS object not MODEL_COSTS
- Supabase credits col is float — cast to ::numeric for ROUND()
- Supabase migration DONE x2 — DO NOT multiply credits again
- index.html has TWO store sections — slide panel and view-store tab
- Tab drag: initTabDrag() only wires tabs present at call time
- pi.js: use textContent= not innerHTML for apostrophes
- card.js: reuse _roundRect/_wrapText at bottom never redefine
- gift buyGift() PayPal return: pending_gift_order in localStorage
  handlePayPalReturn() needs to check this flag and call /create-gift
  Currently calls /capture-order which adds to BUYER not generates code

---

## MORNING TODO LIST
1. Verify gift flow: send credits -> get SPIRAL code -> redeem on another account
2. Fix buyGift PayPal return handler to call /create-gift not /capture-order
3. Update flat credit costs in store (image 500cr, TTS 200cr, video 2000cr)
   These are in old units -- at new scale: image ~5000cr, TTS ~2000cr, video ~20000cr
4. Backend main.py token patch -- verify actual_cost is being used in /chat
5. Remaining index.html slide-panel feature rows may show old values
6. Consider: Codex/Forge rename (was planned pre-session, still pending)
