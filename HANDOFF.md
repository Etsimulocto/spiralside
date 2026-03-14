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
