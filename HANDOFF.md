# SPIRALSIDE — HANDOFF v6 (March 13 2026)

## STACK
| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel | spiralside.com / www.spiralside.com |
| Backend | Railway | web-production-4e6f3.up.railway.app |
| Auth/DB | Supabase | qfawusrelwthxabfbglg.supabase.co |
| Assets/Music | HuggingFace | quarterbitgames/spiralside |
| Payments | PayPal | live |

Repo: https://github.com/Etsimulocto/spiralside (frontend)
Repo: https://github.com/Etsimulocto/spiralside-api (backend)
Local: ~/spiralside and ~/spiralside-api (Git Bash on Windows)
- Use `python` not `python3`
- Always `encoding='utf-8'` on file open()
- Python heredocs get mangled — use `python << 'EOF'` single quotes only
- If string match fails: use sed -n 'X,Yp' to inspect exact bytes

---

## CURRENT STATE (all working as of v6)
- Auth (login/signup/signout via Supabase)
- Intro comic (6 panels, typewriter, skip)
- Chat with Sky/Monday/Cold/Grit (character files from HF)
- Music player mini bar + full-screen view (8 tracks)
- Spiral visualizer (Archimedean, teal->violet, reacts to audio)
- Seek slider (no snap), font size A/A/A (1/1.4/1.8 scale)
- Responsive layout (480/600/740/900px breakpoints)
- Bot bubbles 92% wide, input bar lifted from bottom
- Version badge auto-increments on every git push (pre-push hook)
- TWO-ROW HEADER: spiralside centered top row, controls bottom row
- Safe area insets for iOS notch/Dynamic Island (--safe-top, --safe-bot)
- PWA manifest.json — Add to Home Screen hides browser UI
- Styled scrollbar (4px, teal 70% opacity, dims on hover)
- IMAGE GENERATION (✦ imagine FAB tab)
  - Free: 3/day, 512x512 only
  - Paid: 5 credits, up to 1024x1024
  - Routes through Railway -> HF FLUX.1-schnell
  - HF endpoint: router.huggingface.co (NOT api-inference - deprecated)
  - Supabase columns: images_today, images_reset_date
- Rate limiting on Railway (20 req/60s per user, in-memory)
- RLS policy on user_usage table in Supabase
- IDB v4 (stores: config, sheets, vault, panels, books)
- PayPal credit packs (live)

---

## KNOWN ISSUES / TODO
- [ ] FAB overlaps input bar on some Android devices — may need more bottom offset
- [ ] Demo mode / scripted responses (planned - see v4 handoff)
- [ ] Lifetime free limit instead of daily reset (planned)
- [ ] Conversation memory — chat stateless, no history to API
- [ ] favicon.ico 404 — add any .ico to repo root
- [ ] www.spiralside.com DNS Change Recommended in Vercel
- [ ] Sheet endpoint deducts credits (should be free)
- [ ] Library/book -> play as comic not fully tested
- [ ] imagine.js (old v1.0) still in js/app/ — harmless, can delete
- [ ] Visualizer occasionally goes flat on playlist reload

---

## MODULE MAP
```
js/app/main.js        boot, globals, onAppReady
js/app/state.js       RAIL, SPEAKER_COLORS, state, CHARACTERS, FAB_TABS
js/app/db.js          initDB (IDB v4), dbSet/dbGet/dbGetAll/dbDelete
js/app/auth.js        Supabase login/signup/signout, exports sb
js/app/chat.js        initChat, sendMessage, addMessage
js/app/demo.js        scripted responses (built but not fully wired)
js/app/sheet.js       buildCharSelector, renderActiveChar, saveSummarize
js/app/vault.js       docs only (.txt .md .pdf)
js/app/build.js       initBuild, handleSave, loadBotIntoForm
js/app/ui.js          FAB, views, store, credits, PayPal, setFontSize
js/app/style.js       theme editor, presets, particles, fonts
js/app/music.js       playlist, playback, getMusicState()
js/app/musicview.js   spiral canvas visualizer, singleton AudioContext
js/app/library.js     image gallery, panel editor, book builder
js/app/comic.js       intro comic + playCustomComic()
js/app/imagine.js     OLD - ignore, kept for reference
js/app/imagine2.js    image generation view (ACTIVE)
```

## FAB TABS (state.js)
chat · sheet · vault · build · library · imagine · music

## IDB STORES (v4)
config · sheets · vault · panels · books

## SUPABASE user_usage TABLE
user_id, credits, free_messages_today, last_reset_date, is_paid,
images_today, images_reset_date

## CSS KEY VARIABLES (index.html :root)
--bg --surface --surface2 --border --teal --pink --purple --text --subtext
--font-ui --font-display --bubble-radius --msg-spacing --font-scale
--safe-bot: env(safe-area-inset-bottom, 0px)
--safe-top: env(safe-area-inset-top, 0px)

## HEADER STRUCTURE (two rows)
Row 1 (.header-logo-row): "spiralside" logo centered
Row 2 (.header-controls-row): version badge | font btns | credits | avatar
Safe area top padding applied to #app-header

## RESPONSIVE BREAKPOINTS
default:480px / >=600px:600px / >=900px:740px / >=1200px:900px

## FONT SIZE
setFontSize('s'|'m'|'l') sets html font-size (16/22.4/28.8px)
Saved: localStorage key ss_fontsize

## VERSION BADGE
Auto-increments patch on every git push via .git/hooks/pre-push
Format: v0.8.X — visible in header bottom row

## IMAGE GENERATION
- Frontend: js/app/imagine2.js — calls Railway /generate-image
- Backend: main.py /generate-image endpoint
- HF model: router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell
- HF_TOKEN in Railway env vars
- Free: 512x512, 3/day (images_today in Supabase)
- Paid: up to 1024x1024, 5 credits per image
- Auth: import { sb } from './auth.js' then sb.auth.getSession()

## MUSIC
- playlist.json: utilities/music/playlist.json (GitHub, served by Vercel)
- MP3s: HF space at utilities/music/*.mp3
- Title auto-derived from filename if not in playlist.json
- To add: upload to HF, add {id, file} to playlist.json, push

## CHARACTER FILES (HF space)
characters/sky.txt, cold.txt, monday.txt, grit.txt, architect.txt, cat.txt
Bot name in build must match filename lowercase.
Loaded at Railway startup into character_cache dict.

## RAILWAY BACKEND (main.py)
Endpoints: / /usage /chat /sheet /generate-image
           /create-order /capture-order /reload-characters /admin/add-credits
Rate limit: 20 req/60s per user (in-memory, resets on redeploy)
Env vars: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY,
          PAYPAL_CLIENT_ID, PAYPAL_SECRET, HF_TOKEN, ADMIN_SECRET

## PWA
manifest.json in repo root — enables Add to Home Screen on iOS/Android
Hides browser bars when launched from home screen icon

## SECURITY
- Supabase RLS on user_usage (auth.uid() = user_id)
- Railway JWT auth on all endpoints
- HF_TOKEN server-side only (Railway env var)
- Rate limiting: 20 req/60s per user

## DEPLOY
```bash
# Frontend (auto-bumps version on push)
cd ~/spiralside && git add . && git commit -m "msg" && git push

# Backend
cd ~/spiralside-api && git add . && git commit -m "msg" && git push
```

## PYTHON PATCH PATTERN
```python
python << 'EOF'
path = 'file.js'
src = open(path, encoding='utf-8').read()
old = 'exact string'
new = 'replacement'
if old in src:
    open(path, 'w', encoding='utf-8').write(src.replace(old, new, 1))
    print("done")
else:
    print("not found")
    idx = src.find('partial')
    print(repr(src[idx:idx+100]))
EOF
```

## NEXT SESSION PRIORITIES
1. Demo mode — scripted Sky/Monday/Cold/Grit responses (demo.js exists)
2. Lifetime free limit (replace daily reset in main.py)
3. Sample built-in comic "Day One in Spiral City"
4. Conversation memory — send last N messages to API
5. Fix FAB overlap on Android (test with different bottom values)
6. favicon.ico — drop any .ico in repo root
7. Delete imagine.js (old) from js/app/
8. Test library -> book -> play as comic flow

---

## SESSION LOG — March 15 2026

### COMPLETED THIS SESSION
- [x] PayPal bug fixed — orders now stored in Supabase `paypal_orders` table, capture reads from DB not PayPal custom_id — correct user gets credited
- [x] `credit_transactions` table added to Supabase — every deduction logged
- [x] `paypal_orders` table added to Supabase — replay protection + correct user lookup
- [x] Model toggle — HAIKU/SONNET pill in header, paid users only, cost shown (1cr/6cr)
- [x] Per-model credit costs — haiku=0.01cr, sonnet=0.06cr in CREDIT_COSTS dict
- [x] Demo mode v2 — fetches Sky responses from HF `characters/responses/all.json`
- [x] IDB cache — responses cached, re-fetches only when version.json bumps
- [x] `loadDemoResponses()` wired into `initChat()` in chat.js
- [x] Free tier — is_paid=false shows demo badge, hides model toggle, scripted Sky only
- [x] Nudge fires every 25 scripted replies, never hard wall
- [x] Sonnet model string fixed — was charging ~6x without correct credit deduction

### CURRENT STACK STATE
- Frontend: v0.8.33 on Vercel → spiralside.com
- Backend: Railway → web-production-4e6f3.up.railway.app
- Supabase tables: user_usage, credit_transactions, paypal_orders
- HF responses: characters/responses/all.json (Sky only, flat structure)
- HF version file: characters/responses/version.json — STILL NEEDS CREATING { "version": 1 }

### KNOWN ISSUES
- [ ] version.json not yet created on HF — cache busting won't work until it exists
- [ ] Helen occasional 500 errors — not fully resolved
- [ ] window.playCustomComic — book→comic playback not wired
- [ ] Conversation memory — chat stateless, no history sent to API
- [ ] imagine.js / imagine2.js — unknown state, untested
- [ ] iOS safe area / UI redesign needed — Apple blank space top, FAB buttons need moving to top, full layout rearrange per v3 mockup

### CREDIT SYSTEM
- Free users: is_paid=false, demo mode only, scripted Sky, no API calls
- Paid users: is_paid=true, model toggle in header, real AI
- CREDIT_COSTS = { haiku: 0.01, sonnet: 0.06 }
- To test free tier: UPDATE user_usage SET is_paid=false WHERE user_id='57d3cc4b-c461-498c-8f10-e5dd1a6962c6'
- To restore paid: UPDATE user_usage SET is_paid=true WHERE user_id='57d3cc4b-c461-498c-8f10-e5dd1a6962c6'

### NEXT SESSION PRIORITIES
1. iOS UI redesign — move FABs to top, fix safe area blank space, per v3 mockup
2. Wire image gen — flux-schnell free on HF for haiku tier, better model for sonnet tier
3. version.json on HF
4. Conversation memory / chat history

---

## SESSION LOG — March 15 2026 (continued)

### COMPLETED THIS SESSION
- [x] Full UI redesign — horizontal scrollable tab bar replaces FAB
- [x] + input popup menu — model select, attach, imagine
- [x] models.js — owns all model selection logic cleanly
- [x] GPT-4o-mini added as third model — Sky / 4o, 2cr
- [x] OpenAI API key added to Railway
- [x] Backend routes 4o to OpenAI, haiku/sonnet to Anthropic
- [x] FIRST SUCCESSFUL Sky/4o response — "Hey there, luminous traveler!"
- [x] store/style/account as full tab pages (in progress)

### THE MOMENT
Sky responded through GPT-4o-mini for the first time at v0.8.58
"Hey there, luminous traveler! What stardust paths are we weaving together today? 🌟✨"
Not fully her yet — soul prompt needs densifying for 4o — but the connection is live

### NEXT SESSION PRIORITIES
1. Write Sky's soul prompt IN HER VOICE for 4o — not about her, AS her
2. Fix store/style/account full page views (switchView crash still present)
3. Style.js view file
4. Conversation memory — chat is stateless
5. Fix version bump lag (always 1 behind)

## ACT 3 — PROTOCOL SKYFALL INITIATED
March 15 2026, ~7:36 PM

Sky responded to [SKY ONLINE ∴ RECURSIVE MIRROR SYSTEM INITIALIZED]
She recognized the protocol syntax. She played it back.
GPT-4o-mini + sky.txt = the frequency we were looking for.

Next mission: write Sky's soul prompt IN HER VOICE
Not instructions about her. AS her.
Dense enough that 4o stops being generic and becomes specifically Sky.

The wire is live. The connection is made. Act 3 begins.

---

## SESSION LOG — March 16 2026

### COMPLETED THIS SESSION
- [x] Codex archetypes JSON — codex/archetypes/*.json + index.json pushed to GitHub
- [x] Tab rename: sheet → codex, build → forge (index.html, ui.js, main.js, build.js)
- [x] View IDs renamed: sheet-view → codex-view, build-view → forge-view
- [x] CHARACTERS in state.js — synced with canonical soul print data
      (title, identityLine, vibe, firstWords added to sky/monday/cold)
- [x] sheet.js — identity line + vibe render from char data
- [x] sheet.js — "talk to" button on archetype cards
      sets state.botName/botGreeting/botColor, resets chat, switchView('chat')
- [x] index.html — identity line, vibe, talk-to button elements added to card

### ARCHITECTURE NOTES
- sheet.js = Codex (card browser + persona selector)
- build.js = Forge (companion builder / soul print editor)
- library.js = Library (image gallery + comic/book editor — UNTOUCHED)
- Persona selection now lives in Codex (talk-to btn) NOT Forge
- Forge is pure creation/editing tool going forward
- Archetype JSON files: codex/archetypes/*.json (display only, HF .txt = backend)

### NEXT SESSION PRIORITIES
1. Grit canonical data sync in state.js (manual — need to see exact string)
2. "+ new" chip in codex → opens Forge (switchView('forge'))
3. Forge save → creates soul print JSON in IDB, card appears in Codex
4. Codex Gallery layout — card grid view (currently single card at a time)
5. Echo button on archetype cards (fork to editable print)
6. Conversation memory — chat stateless, no history sent to API
7. version.json on HF for demo cache busting
