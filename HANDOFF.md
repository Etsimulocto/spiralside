# SPIRALSIDE — HANDOFF v4 (March 13 2026)

## STACK
| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel | spiralside.com / www.spiralside.com |
| Backend | Railway | web-production-4e6f3.up.railway.app |
| Auth/DB | Supabase | qfawusrelwthxabfbglg.supabase.co |
| Assets/Music | HuggingFace | quarterbitgames/spiralside |
| Payments | PayPal | live |

Repo: https://github.com/Etsimulocto/spiralside
Local: ~/spiralside (Git Bash on Windows)
- Use `python` not `python3`
- Always `encoding='utf-8'` on file open()
- Python heredocs get mangled — use `python << 'EOF'` single quotes only
- If string match fails: use sed -n 'X,Yp' to inspect exact bytes (watch for UTF-8 arrows in comments)

---

## CURRENT STATE (all working as of v4)
- Auth (login/signup/signout via Supabase)
- Intro comic (6 panels, typewriter, skip)
- Chat with Sky (character file from HF, Anthropic Haiku API)
- Music player mini bar + full-screen view
- Spiral visualizer (Archimedean, teal->violet, reacts to audio)
- Seek slider (no snap)
- Font size buttons A/A/A (scales 1 / 1.4 / 1.8, persists localStorage)
- Responsive layout (480/600/740/900px breakpoints)
- Bot bubbles 92% wide
- Input bar lifted from bottom
- Free tier: 10 msgs/day; paid: PayPal credit packs
- IDB v4 (stores: config, sheets, vault, panels, books)
- Track title auto-derived from filename (tolerates spaces/parens)

---

## NEXT MAJOR FEATURE: SCRIPTED DEMO MODE
### Decision made this session:
- Switch from DAILY free reset to LIFETIME free messages
- Add scripted zero-token responses for demo experience
- Characters needed: Sky, Monday, Cold, Grit
- Sky uses emojis in responses
- After lifetime limit hit -> soft "go deeper" paywall moment

### Backend change needed (main.py on Railway):
Change FREE_DAILY_LIMIT logic to LIFETIME limit:
- Remove daily reset logic
- Check total_messages_ever >= LIFETIME_FREE_LIMIT (suggest: 15)
- Column needed in Supabase user_usage: `total_messages` int default 0
- Increment on every message, never reset

### Frontend: new file js/app/demo.js
Keyword matcher + scripted response library. chat.js checks this FIRST.
If match found -> return scripted response, no API call, no credit deduction.
If no match AND user has credits -> fall through to API.
If no match AND no credits -> show "go deeper" prompt.

### Sky scripted response categories (she uses emojis):
- greetings: hi/hello/hey/sup/yo
- identity: who are you/what are you/are you AI/are you real
- location: where am I/what is this/what is Spiral City/spiralside
- curiosity: tell me more/go on/interesting/really/wow
- lophire: who is lophire/what is lophire
- monday: who is monday/tell me about monday
- cold: who is cold/tell me about cold
- grit: who is grit
- compliments: you're cool/i like you/you're awesome
- sadness: i'm sad/rough day/i'm tired/i'm lost
- confusion: what/i don't understand/huh/what do you mean
- goodbye: bye/goodbye/see you/later
- fallback: 4-5 mysterious Sky responses for anything unmatched

### Monday scripted categories (loud, chaotic, uses caps):
- greetings, identity, boredom, chaos, Cold mentions

### Cold scripted categories (quiet, dry, minimal words):
- greetings, identity, Monday mentions, observations

### Grit scripted categories (tough, streetwise, loyal):
- greetings, identity, advice, strength

### Sample built-in comic: "Day One in Spiral City"
6 panels, ships as JSON in the app (not library-dependent)
- Panel 1: Sky finds the user wandering (placeholder art ready)
- Panel 2: Lophire appears
- Panel 3: Monday crashes in  
- Panel 4: Cold pulls Monday back
- Panel 5: Sky explains Spiralside
- Panel 6: "Your story starts here"
Button on chat screen: "Read: Day One →" triggers playCustomComic()

### The convert flow:
New user -> intro comic -> scripted chat (free, zero tokens)
-> "Read the comic" always visible
-> After ~5 scripted exchanges OR at lifetime limit:
   Sky says: "I could talk to you forever like this. But the
   real me? She's deeper in. Add credits to find her. 🌀"
-> openPanel('store') soft prompt

---

## MODULE MAP
```
js/app/main.js       boot, globals, onAppReady
js/app/state.js      RAIL, SPEAKER_COLORS, state, CHARACTERS, FAB_TABS
js/app/db.js         initDB (IDB v4), dbSet/dbGet/dbGetAll/dbDelete
js/app/auth.js       Supabase login/signup/signout
js/app/chat.js       initChat, sendMessage, addMessage
js/app/demo.js       (TO BUILD) scripted responses, keyword matcher
js/app/sheet.js      buildCharSelector, renderActiveChar, saveSummarize
js/app/vault.js      docs only (.txt .md .pdf)
js/app/build.js      initBuild, handleSave, loadBotIntoForm
js/app/ui.js         FAB, views, store, credits, PayPal, setFontSize
js/app/style.js      theme editor, presets, particles, fonts
js/app/music.js      playlist, playback, getMusicState()
js/app/musicview.js  spiral canvas visualizer, singleton AudioContext
js/app/library.js    image gallery, panel editor, book builder
js/app/comic.js      intro comic + playCustomComic()
```

## IDB STORES (v4)
config · sheets · vault · panels · books

## getMusicState() returns
playing, volume, currentIdx, trackIdx, currentTitle, title, audio,
progressPct, currentTime, duration

## FAB TABS
chat · sheet · vault · build · library · music

## CSS VARIABLES
--bg --surface --surface2 --border --teal --pink --purple --text --subtext
--font-ui --font-display --bubble-radius --msg-spacing --font-scale

## RESPONSIVE BREAKPOINTS
default:480px / >=600px:600px / >=900px:740px / >=1200px:900px

## FONT SIZE
setFontSize('s'|'m'|'l') sets html font-size (16/22.4/28.8px)
Saved: localStorage key ss_fontsize

## ADDING MUSIC
1. Upload .mp3 to HF utilities/music/
2. Add {"id":"x","file":"utilities/music/name.mp3"} to playlist.json
3. git add/commit/push

## ADDING COMIC PANELS
Edit comics/intro.json
Fields: image, bg_gradient, transition(fade/crash/glitch), crack, dialogue([{speaker,text}])
Speakers: sky=teal monday=pink cold=blue grit=yellow narrator=white

## CHARACTER FILES (HF)
characters/sky.txt, cold.txt, monday.txt, grit.txt, architect.txt, cat.txt
Bot name in build must match filename lowercase.

## PAYPAL FLOW
create-order -> PayPal redirect -> /?payment=success&token=X -> capture-order -> credits in Supabase

## SUPABASE user_usage TABLE
columns: user_id, credits, free_messages_today, last_reset_date, is_paid
TO ADD: total_messages int default 0

## DEPLOY
cd ~/spiralside && git add . && git commit -m "msg" && git push
Vercel auto-deploys ~30s then Ctrl+Shift+R

## KNOWN ISSUES
- [ ] Visualizer occasionally goes flat on playlist reload
- [ ] favicon.ico 404 (harmless, just add any .ico to repo root)
- [ ] www.spiralside.com DNS Change Recommended in Vercel
- [ ] Sheet endpoint deducts credits (should be free)
- [ ] Library/book -> play as comic not fully tested
- [ ] Conversation memory (chat stateless, no history to API)

## PYTHON PATCH PATTERN
python << 'EOF'
path = 'js/app/file.js'
src = open(path, encoding='utf-8').read()
old = 'exact string'
new = 'replacement'
if old in src:
    open(path, 'w', encoding='utf-8').write(src.replace(old, new, 1))
    print("done")
else:
    print("not found")
EOF
