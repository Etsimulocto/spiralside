# CLAUDE.md — Spiralside

Context file for AI-assisted sessions (Claude Code, Claude Projects).
Last verified against production: **July 3, 2026**. If this file and the live
site disagree, the live site wins — fetch the deployed file before patching.

---

## WHAT THIS IS

**Spiralside** (spiralside.com) — a browser-first, local-first multi-agent
creative OS. Core loop: **Make → Remember → Share**. A crew of AI characters
(Sky, Cold, Monday, GRIT) plus a user-created "You card." Sky is the demo,
the default, the showroom — users forge their own characters; it's their
story, their team, their world.

Original IP: **Bloomcore / Spiral City** (Sky, Monday, Cold, GRIT, Architect, Cat).

Sole developer: **Architect** (GitHub: Etsimulocto, org: quarterbitgames).

---

## STACK (current, verified)

| Layer     | Service                                              | Repo / local path              |
|-----------|------------------------------------------------------|--------------------------------|
| Frontend  | Vercel → spiralside.com                              | Etsimulocto/spiralside → `~/spiralside` |
| Backend   | Railway FastAPI → web-production-4e6f3.up.railway.app | Etsimulocto/spiralside-api → `~/spiralside-api` |
| DB/Auth   | Supabase (project `qfawusrelwthxabfbglg`)            | —                              |
| AI        | Anthropic API                                        | —                              |
| Video gen | fal.ai — PixVerse V6 (`FAL_KEY` on Railway)          | old HuggingFace endpoint deprecated |
| TTS       | ElevenLabs (Railway `/tts`)                          | —                              |
| Payments  | PayPal (credit packs + gift codes), Gumroad, Lemon Squeezy | **NOT Stripe** — old docs are wrong |
| DNS       | Cloudflare                                           | —                              |
| Local dev | Windows + Git Bash, Python at `C:/Users/quart/AppData/Local/Programs/Python/Python313/python.exe` | — |

Sub-products:
- **Canon Forge** — standalone at forge.spiralside.com. Separate
  `forge_credits` column in `user_usage` (30 credits/forge). Do not mix with
  the main `credits` column.
- **Cannonized** (in-app tab) — essence-block memory forge. Calls the Vercel
  serverless proxy `api/cannonize.js` (NOT Railway).
- **SpiralCut v0.2** — video editor tab, gen via Railway `/generate-video`
  → fal.ai PixVerse V6 (540p, 5s, 30 credits/clip).

---

## FRONTEND ARCHITECTURE

Single `index.html` shell (~3,700 lines: tokens, shell CSS, all view divs,
inline scripts) + ~25 view modules in `js/app/`. Most modules are
self-contained: `injectStyles()` + `init{Name}View()`. A few older views
still live inline in index.html (codex/vault/forge/library/style).

Design tokens are CSS vars in `:root` (teal `#00F6D6`, pink `#FF4BCB`,
purple `#7B5FFF`; DM Mono + Syne). Spacing/radius scale added July 2026
(`--space-*`, `--radius-*`, `--sidebar-w`).

**Responsive shell (July 2026, Phase A):** mobile is a flex phone column;
at ≥900px `#screen-app` becomes a CSS grid — the single `#tab-bar` is
repositioned as a left sidebar via `grid-template-areas`. No duplicate nav
DOM. All `.view` elements share the `main` grid cell.

### Adding a tab — 4-step recipe
1. Tab button in `#tab-bar` in `index.html`
2. View div `#view-{id}` (class `view`) in `index.html`
3. Entry in `viewInits` inside `switchView()` in `js/app/ui.js`
   (**`viewInits` lives in ui.js, NOT main.js**)
4. Import + `window.initXxxView` global in `js/app/main.js`

### Display rules — do not violate
- `.view { display:none }` / `.view.active { display:flex }` **own display**.
  Never set `display` on `#view-{id}` in injected module CSS — only
  `flex-direction`, `overflow`, etc.
- Scroll containers: `flex:1; min-height:0; overflow-y:auto`
- Do NOT touch `.screen` / `.view` CSS without reading handoff history.
- Substring trap: `initSpiralCutView` contains `initSpiral` — always match
  full import paths, never loose substrings.

### Data / state
- IndexedDB `spiralside` — bump DB version when adding object stores.
- `you_card` lives in the **sheets** IDB store (`id:'you'`) — NOT prints.
- `onForgeOpen` owns the forge load lifecycle — check the you_card branch first.
- `cloud:hydrated` custom event fires after Supabase hydration — tabs listen
  to re-render with fresh data.
- Auth: Supabase JS from **unpkg.com** — never jsdelivr (blocked by Edge
  tracking prevention).

---

## HARD RULES (learned the expensive way)

1. `interactive-widget=resizes-content` must **NEVER** be in the viewport
   meta tag (black screen on iOS keyboard open).
2. Supabase CDN stays on **unpkg.com**.
3. Railway 403 "Host not in allowlist" with no error logs = zombie state →
   manual redeploy from dashboard. Not a code fix.
4. **Never force-push the backend** (spiralside-api). Frontend: plain
   `git push origin main` — no `--force` (breaks the Vercel webhook).
5. Windows repo = **CRLF** line endings. Preserve them in generated files.
6. Git Bash `python -c` strings: no emoji/non-ASCII (silently wipes files),
   no `!` (history expansion), no em dashes, no `\n` escapes writing to
   files. Multiline `-c` is unreliable — write a script file first.
7. Syntax-check Railway's main.py before any push:
   `python.exe -m py_compile main.py && echo OK`
8. Railway 500 with no CORS headers = crash before FastAPI responds —
   not a CORS config issue. `401 Not authenticated` on curl = route live.
9. Fetch the **live deployed file** before writing any patch anchor —
   local and deployed diverge constantly. Normalize CRLF before matching.
   When an anchor misses, print `repr(src[idx:idx+300])` to expose whitespace.
10. Supabase free-tier siblings: run `SELECT NOW()` periodically to prevent
    inactivity pause. Never relay JS file content through Supabase SQL
    (quote mangling).

---

## WORKING STYLE (Architect's preferences)

- **Full scripts, every line commented — no snippets.**
- Thorough planning before coding; talk out new features first.
  Bugs: direct diagnosis, fast iteration.
- Step-by-step guidance on unfamiliar platforms.
- Session rhythm: patch → run locally → paste terminal output → next patch.
- Session handoffs live in Supabase `handoff_docs` (key/content). Read the
  newest handoff at session start.

---

## ACTIVE WORK (July 2026)

- **Makeover Phases:** A = responsive shell + token refresh (shipped in
  index.html). B = BloomStudio as iframe-embedded tab. C = per-view desktop
  layouts (de-phone the stretched views).
- Idea queue: loading screen → home screen with per-tab icons; onboarding
  comic (6 panels, name-input moment); voice bank for forged characters;
  STT via Railway `/transcribe` + Whisper; vault backend routes; credits
  audit before monetization push.
