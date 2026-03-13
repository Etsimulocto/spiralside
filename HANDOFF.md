# SPIRALSIDE HANDOFF

## STACK
| Layer | Service | URL |
|---|---|---|
| Frontend | Vercel | spiralside.com |
| Backend | Railway | web-production-4e6f3.up.railway.app |
| Auth/DB | Supabase | qfawusrelwthxabfbglg.supabase.co |
| Assets/Music | HuggingFace | quarterbitgames/spiralside |
| Payments | PayPal | live, working |
| DNS | Cloudflare | |

## MODULE MAP
```
js/app/main.js       boot, globals, onAppReady
js/app/state.js      RAIL, SPEAKER_COLORS, state, CHARACTERS, FAB_TABS
js/app/db.js         initDB (v3), dbSet/dbGet/dbGetAll/dbDelete
js/app/auth.js       Supabase login/signup/signout
js/app/chat.js       initChat, sendMessage, addMessage
js/app/sheet.js      buildCharSelector, renderActiveChar, saveSummarize
js/app/vault.js      docs only (.txt .md .pdf) — NOT images
js/app/build.js      initBuild, handleSave, loadBotIntoForm
js/app/ui.js         FAB, views, store panel, credits, PayPal
js/app/style.js      theme editor, presets, particles, fonts
js/app/music.js      playlist, playback, mini player bar
js/app/musicview.js  full-screen visualizer (canvas, singleton AudioContext)
js/app/library.js    gallery, panel editor, book builder
js/app/comic.js      intro comic + playCustomComic for book playback
```

## IDB STORES (v3)
`config` · `sheets` · `vault` · `panels` · `books`

## KEY DECISIONS
- Library = images only; Vault = docs only (AI context)
- AudioContext is a singleton — never destroyed between music view opens
- All panel/book data in IndexedDB, no server
- getMusicState() exports: playing, volume, currentIdx, trackIdx, currentTitle, title, audio, progressPct, currentTime, duration
- Scripts: active in root, move to scripts/ when feature done

## DEPLOY WORKFLOW
```bash
cd ~/spiralside
git add .
git commit -m "message"
git push
# Vercel auto-deploys ~30s — Ctrl+Shift+R to see changes
```

## FIXED (March 13 2026)
- Music visualizer deaf + seek broken: getMusicState() field name mismatch (title/trackIdx/audio aliases added)
- Seek slider snapping back: added seeking flag, RAF skips slider update while dragging
- Duplicate id="view-music" div in index.html removed
- playCustomComic() implemented in comic.js + wired to window in main.js

## PENDING
- [ ] Test music visualizer + seek after deploy (open music FAB, check bars react, drag seek)
- [ ] Test book -> play as comic (library > books > play button)
- [ ] Conversation memory — chat is stateless, no history sent to API
- [ ] Favicon 404 — needs favicon.ico in repo root
- [ ] spiralside.app domain — point to Vercel
- [ ] PWA service worker — offline install
- [ ] Google Play via Capacitor — future
- [ ] Sheet endpoint is free — no credits deducted

## IP / CHARACTERS
Bloomcore / Spiral City: Sky, Monday, Cold, Architect, Cat, GRIT
Sky = free public companion (MIT licensed)
Sacred Blank = paid customizable companion
