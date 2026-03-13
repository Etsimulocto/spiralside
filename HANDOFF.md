# SPIRALSIDE — HANDOFF v3 (March 13 2026)

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
- Python heredocs get mangled in Git Bash — use `python << 'EOF'` with single quotes

---

## CURRENT STATE (all working as of this handoff)
- Auth (login/signup/signout via Supabase)
- Intro comic (6 panels, typewriter dialogue, skip button)
- Chat with Sky (character file loaded from HF, Anthropic API)
- Music player (mini bar + full-screen view)
- Spiral visualizer (Archimedean spiral, teal→violet, reacts to audio)
- Seek slider (drag without snapping)
- Font size buttons (A/A/A in header, persists via localStorage)
- Responsive layout (480/600/740/900px breakpoints)
- Bot bubbles wide (92% max-width)
- Input bar lifted from bottom edge
- Free tier: 10 msgs/day; paid: credit packs via PayPal
- IDB v4 (stores: config, sheets, vault, panels, books)

## KNOWN ISSUES / TODO
- [ ] Library/book flow not fully tested (IDB v4 should fix crashes)
- [ ] Conversation memory — chat is stateless, no history sent to API
- [ ] favicon.ico 404 — add any 32x32 .ico to repo root
- [ ] www.spiralside.com DNS Change Recommended warning in Vercel
- [ ] spiralside.app domain — point to Vercel when ready
- [ ] PWA service worker — offline install
- [ ] Google Play via Capacitor — future
- [ ] Sheet endpoint still deducts credits (should be free)
- [ ] Visualizer goes flat after playlist reload (crossOrigin/analyser reconnect)

---

## MODULE MAP
```
js/app/main.js       boot, globals, onAppReady
js/app/state.js      RAIL, SPEAKER_COLORS, state, CHARACTERS, FAB_TABS
js/app/db.js         initDB (IDB v4), dbSet/dbGet/dbGetAll/dbDelete
js/app/auth.js       Supabase login/signup/signout
js/app/chat.js       initChat, sendMessage, addMessage
js/app/sheet.js      buildCharSelector, renderActiveChar, saveSummarize
js/app/vault.js      docs only (.txt .md .pdf)
js/app/build.js      initBuild, handleSave, loadBotIntoForm
js/app/ui.js         FAB, views, store panel, credits, PayPal, setFontSize
js/app/style.js      theme editor, presets, particles, fonts
js/app/music.js      playlist, playback, getMusicState() with aliases
js/app/musicview.js  full-screen visualizer, spiral canvas, singleton AudioContext
js/app/library.js    image gallery, panel editor, book builder
js/app/comic.js      intro comic + playCustomComic()
```

## IDB STORES (v4)
`config` · `sheets` · `vault` · `panels` · `books`

## getMusicState() returns
`playing, volume, currentIdx, trackIdx, currentTitle, title, audio, progressPct, currentTime, duration`

## FAB TABS
chat · sheet · vault · build · library · music (onOpen: initMusicView, onClose: destroyMusicView)

---

## ADDING MUSIC
1. Upload .mp3 to HF space at `utilities/music/`
2. Add entry to `utilities/music/playlist.json`:
   `{"id":"anything","file":"utilities/music/filename.mp3"}`
   Title auto-derived from filename — no `title` field needed
3. git add + commit + push

## ADDING COMIC PANELS
- Edit `comics/intro.json` in repo
- Panel fields: `image` (full URL), `bg_gradient` (fallback), `transition` (fade/crash/glitch), `crack` (bool), `dialogue` (array of {speaker, text})
- Speaker colors: sky=teal, monday=pink, cold=blue, grit=yellow, narrator=white italic

## CHARACTER FILES
Loaded from HF at startup: `characters/sky.txt`, `cold.txt`, `monday.txt`, `grit.txt`, `architect.txt`, `cat.txt`
Bot name in build view must match filename (lowercase) for character file to load.

## PAYPAL FLOW
create-order → redirect to PayPal → return to spiralside.com/?payment=success&token=XXX → capture-order → credits added to Supabase

## DEPLOY
```bash
cd ~/spiralside
git add .
git commit -m "message"
git push
# Vercel auto-deploys ~30s, then Ctrl+Shift+R
```

## CSS VARIABLES (index.html :root)
`--bg --surface --surface2 --border --teal --pink --purple --text --subtext`
`--font-ui --font-display --bubble-radius --msg-spacing --font-scale`

## RESPONSIVE BREAKPOINTS
- default: max-width 480px
- ≥600px: 600px
- ≥900px: 740px  
- ≥1200px: 900px

## FONT SIZE BUTTONS
setFontSize('s'|'m'|'l') in ui.js — sets html font-size (13.1/16/19.2px) so all rem units scale
Saved to localStorage key `ss_fontsize`

## PYTHON PATCH PATTERN (Git Bash safe)
```python
python << 'EOF'
path = 'js/app/somefile.js'
src = open(path, encoding='utf-8').read()
old = 'exact string to find'
new = 'replacement string'
if old in src:
    open(path, 'w', encoding='utf-8').write(src.replace(old, new, 1))
    print("done")
else:
    print("not found")
EOF
```
If string match fails, use `sed -n 'X,Yp'` to inspect exact bytes, watch for UTF-8 arrow chars (→) in comments.

## LAST COMMIT
feat: responsive layout breakpoints, font size A/A/A buttons + fixes
