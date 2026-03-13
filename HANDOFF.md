# SPIRALSIDE — CLAUDE HANDOFF FILE
# Drop this in the repo root. Start every new session with:
# "I'm building Spiralside. Clone https://github.com/Etsimulocto/spiralside and read HANDOFF.md"
# Last Updated: 2026-03-13

---

## STACK
| Layer      | Service      | URL                                        |
|------------|--------------|--------------------------------------------|
| Frontend   | Vercel       | spiralside.com                             |
| Backend    | Railway      | web-production-4e6f3.up.railway.app        |
| Auth / DB  | Supabase     | qfawusrelwthxabfbglg.supabase.co           |
| Assets     | HuggingFace  | quarterbitgames/spiralside                 |
| Music MP3s | HuggingFace  | /resolve/main/utilities/music/*.mp3        |
| Payments   | PayPal       | live, working                              |
| DNS        | Cloudflare   |                                            |
| Local dev  | Git Bash     | ~/spiralside                               |

---

## DEPLOY WORKFLOW
```bash
cd ~/spiralside
git add .
git commit -m "message"
git push
# Vercel auto-deploys in ~30s
# Always hard refresh after deploy: Ctrl+Shift+R
```

---

## MODULE MAP
```
js/app/main.js       v1.0  boot, globals, onAppReady — single entry point
js/app/state.js      v1.0  RAIL, SPEAKER_COLORS, state, CHARACTERS, FAB_TABS
js/app/db.js         v1.1  initDB (IDB v4), dbSet/dbGet/dbGetAll/dbDelete
js/app/auth.js       v1.3  Supabase login/signup/signout/onAuthStateChange
js/app/chat.js       v1.0  initChat, sendMessage, addMessage, showTyping
js/app/sheet.js      v1.0  buildCharSelector, renderActiveChar, saveSummarize
js/app/vault.js      v1.0  docs only (.txt .md .pdf) — NOT images
js/app/build.js      v1.0  initBuild, handleSave, loadBotIntoForm
js/app/ui.js         v1.0  FAB, views, store panel, credits, PayPal
js/app/style.js      v1.0  theme editor, presets, particles, fonts
js/app/music.js      v1.1  playlist, playback, mini player bar, getMusicState()
js/app/musicview.js  v1.1  full-screen visualizer (canvas, singleton AudioContext)
js/app/library.js    v1.0  image gallery, panel editor, book builder
js/app/comic.js      v1.1  intro comic + playCustomComic() for book playback
```

---

## DOM SCREENS & VIEWS
```
#screen-comic          intro comic overlay (hides after play)
#screen-auth           login / signup screen
#screen-app            main app wrapper (max-width 480px)

Views inside #screen-app (toggled by FAB):
  #view-chat           chat messages + input
  #view-sheet          character sheet selector
  #view-vault          doc vault list
  #view-build          companion builder form
  #view-music          music visualizer (innerHTML filled by musicview.js)
  #view-library        image gallery + book builder

Overlays:
  #panel-editor-overlay   panel editor (library)
  #book-builder-overlay   book builder (library)
  #slide-panel            store/style/account slide-up panel
```

---

## IDB — CRITICAL RULES
```
Database name : spiralside
Current version : 4

Stores:
  config   keyPath: key    — bot config, style prefs
  sheets   keyPath: id     — character sheet overrides
  vault    keyPath: name   — uploaded docs (text/pdf)
  panels   keyPath: id     — library image panels
  books    keyPath: id     — library books

⚠️  RULE: Every time you add a new store you MUST bump the version number
    in indexedDB.open('spiralside', N) by 1.
    If you don't, onupgradeneeded won't fire and the store won't be created.
    Users will get: NotFoundError: One of the specified object stores was not found.

    After bumping version, users need ONE manual IDB delete:
    DevTools → Application → IndexedDB → delete spiralside → Ctrl+Shift+R
    Future version bumps after that are automatic.
```

---

## SCRIPT HEADER FORMAT
Every JS file must have this comment block at the top.
When editing a file: update Version + Last Updated.
When adding IDB stores: bump IDB Version here AND in db.js.

```js
// ============================================================
// SPIRALSIDE — [MODULE NAME] v[X.X]
// [One line description]
// File         : js/app/[filename].js
// Type         : ES Module
// IDB Version  : 4  ← only needed in db.js — bump when adding stores
// Dependencies : [comma separated imports]
// Last Updated : YYYY-MM-DD
// ============================================================
```

Current module versions for reference:
```
main.js       1.0   2026-03-13
state.js      1.0   2026-03-13
db.js         1.1   2026-03-13   IDB v4
auth.js       1.3   2026-03-13
chat.js       1.0   2026-03-13
sheet.js      1.0   2026-03-13
vault.js      1.0   2026-03-13
build.js      1.0   2026-03-13
ui.js         1.0   2026-03-13
style.js      1.0   2026-03-13
music.js      1.1   2026-03-13
musicview.js  1.1   2026-03-13
library.js    1.0   2026-03-13
comic.js      1.1   2026-03-13
```

---

## KEY DECISIONS (don't change these without a reason)
- **Library = images only.** Vault = docs only (AI context). Never mix them.
- **AudioContext is a singleton.** Never destroy it between music view opens.
  createMediaElementSource() can only be called once per audio element.
  destroyMusicView() stops RAF only — audioCtx/sourceNode/analyser stay alive.
- **getMusicState() exports:** playing, volume, currentIdx, trackIdx,
  currentTitle, title, audio, progressPct, currentTime, duration
  (trackIdx and title are aliases for currentIdx and currentTitle — musicview uses them)
- **audio.crossOrigin = 'anonymous'** must be set on the Audio element
  or WebAudio analyser can't tap cross-origin HuggingFace streams.
- **All panel/book data lives in IndexedDB only** — no server storage.
- **Patch scripts** live in repo root while active, move to scripts/ when done.
- **playCustomComic(panels)** in comic.js — reuses intro comic engine for book playback.
  Wired to window.playCustomComic in main.js.

---

## MUSIC FILES ON HUGGINGFACE
```
HF base: https://huggingface.co/spaces/quarterbitgames/spiralside/resolve/main/
Tracks:
  utilities/music/SPIRALSIDE.mp3
  utilities/music/Centerspark.mp3      ← no (1), was renamed
  utilities/music/Mirrorblade.mp3
Playlist: utilities/music/playlist.json (served from Vercel/GitHub)
```

---

## CHARACTERS / IP
```
IP: Bloomcore / Spiral City (all original)
Characters: Sky, Monday, Cold, Architect, Cat, GRIT
Sky         = free public AI companion (MIT licensed original character)
Sacred Blank = paid customizable companion
Speaker colors:
  sky      #00F6D6
  monday   #FF4BCB
  cold     #4DA3FF
  grit     #FFD93D
  narrator #F0F0FF
```

---

## PENDING TODO
```
[ ] Test music visualizer reacts to audio (crossOrigin fix deployed — verify bars bounce)
[ ] Test seek slider drag (seeking flag fix deployed — verify no snap-back)
[ ] Test book → play as comic (playCustomComic implemented — needs live test)
[ ] Test library after IDB v4 deploy — add image, open panel editor, create book
[ ] Conversation memory — chat is stateless, no history sent to API
[ ] Favicon 404 — add favicon.ico to repo root
[ ] spiralside.app domain — point to Vercel
[ ] PWA service worker — offline install
[ ] Google Play via Capacitor — future
[ ] Sheet endpoint is free — no credits deducted currently
[ ] Pi 5 16GB — future local AI node (Ollama), Bloomslice TEAK mount
```

---

## PENDING CODE (not yet deployed as of 2026-03-13)
These fixes were written this session but NOT yet pushed — run the patch scripts:
```
js/app/db.js         — IDB v4 (panels + books stores added, version bumped 3→4)
js/app/music.js      — crossOrigin anonymous + Centerspark filename fix
js/app/musicview.js  — seeking flag, seek handler fixed, destroyMusicView resets seeking
js/app/comic.js      — playCustomComic() exported
js/app/main.js       — playCustomComic imported + wired to window
utilities/music/playlist.json — Centerspark filename fixed
```
Patch scripts are in repo root: apply_music_fix.py, fix2_idb_and_library.py, etc.
After applying, commit with:
```bash
git add .
git commit -m "fix: IDB v4, crossOrigin visualizer, seek slider, playCustomComic"
git push
```
Then delete IDB once in DevTools → hard refresh.

---

## HOW TO START A NEW SESSION
1. Paste this into Claude: 
   "I'm building Spiralside. Clone https://github.com/Etsimulocto/spiralside 
    and read HANDOFF.md before doing anything."
2. Claude clones repo, reads this file, checks pending items
3. Tell Claude what you want to work on
4. At end of session, update HANDOFF.md pending/fixed sections + push
