# SPIRALSIDE HANDOFF v17
# March 20 2026 — afternoon session complete

## ORIENTATION
Nimbis = Claude in-project name. Architect = quarterbitgames / Etsimulocto.
Read HANDOFF before touching anything. Inspect files before writing.

## CURRENT VERSION: v0.8.265

## STACK
Frontend:  Vercel -> spiralside.com / Etsimulocto/spiralside
Backend:   Railway -> web-production-4e6f3.up.railway.app
DB/Auth:   Supabase -> qfawusrelwthxabfbglg
Assets:    HuggingFace -> quarterbitgames/spiralside
Python:    /c/Users/quart/AppData/Local/Programs/Python/Python313/python

## PATCH WORKFLOW
NEVER heredoc over 50 lines. NEVER r-triple-quote in heredocs.
NEVER byte-offset HTML. NEVER trailing commas/else in heredoc lines.
ALWAYS write long scripts via Supabase relay or _s.py file pattern.
ALWAYS str.replace() with exact literal text — check CRLF with repr() first.
GIT: git add . && git commit -m msg && git push origin main (frontend)
GIT: git add . && git commit -m msg && git push (backend, no --force)
NOTE: use --force sparingly — it causes branch divergence that breaks webhook
NOTE: if branch diverges, use: git push origin main (no --force) after empty commit

## WHAT WORKS (as of v0.8.265)
- Store tab: full module, credits hero shows 20,415,807, HOW WE CHARGE, pack grid,
  live feature pricing, gift section — all correct and separate from account
- Account tab: full module, credits hero shows 20,415,807, email, sign out, buy credits
  — stays separate from store, credits persist across tab switches
- Gift system: send from balance, SPIRAL-XXXX-XXXX codes, redeem — verified with Helen
- Credits badge in header shows correct balance
- Options panel: + button, models/tools/voice sections, spiral send button, mic STT
- Sky/4o-mini default model (~23 cr/msg)
- Credit system: 1cr = $0.00001, packs: $5=500k / $10=1.1M / $20=2.4M cr

## THE TWO ROOT CAUSES FOUND THIS SESSION

### Bug 1: display:flex override (account invisible/showing in wrong place)
account.js injectAccountStyles() had:
  #view-account { display: flex; flex-direction: column; overflow: hidden; }
This permanently overrode .view { display: none } making account always visible.
FIX: removed display:flex from that rule — .view.active handles showing it.
LESSON: NEVER set display on #view-{id} directly in injected module CSS.
Only set flex-direction, overflow, etc. Let .view/.view.active control display.

### Bug 2: -webkit-text-fill-color: transparent (credits number invisible)
store.js .credit-amount CSS had gradient clip with -webkit-text-fill-color: transparent.
The gradient didnt render properly so the number was invisible (but present in DOM).
FIX: replaced with color: var(--teal) — solid color, always visible.
LESSON: avoid -webkit-text-fill-color: transparent in injected module CSS.

## MODULE CONVERSION PATTERN (CRITICAL RULES)

### What works (store.js and account.js are the reference):
1. Create js/app/views/{name}.js with injectStyles() + init{Name}View()
2. injectStyles() injects CSS — NEVER set display on #view-{id}
3. Scroll container CSS: flex:1; min-height:0; overflow-y:auto (NOT height:100%)
4. initialized guard prevents re-render on revisit
5. update{Name}View() updates values without re-rendering
6. Empty the view div in index.html (keep just the empty div tag)
7. Add to viewInits in ui.js
8. Expose window.init{Name}View in main.js
9. Credit amounts: use color:var(--teal) NOT gradient clip

### NEVER do in module CSS:
- display:flex or display:block on #view-{id} — breaks show/hide system
- -webkit-text-fill-color:transparent — makes text invisible
- height:100% on scroll container — use flex:1;min-height:0 instead

## INLINE TABS STILL NEEDING MODULE CONVERSION (one per thread):
- view-codex    line 1666  — full inline HTML
- view-vault    line 1716  — full inline HTML
- view-forge    line 1734  — full inline HTML
- view-library  line 1962  — full inline HTML
- view-style    line 2107  — full inline HTML

## MODULE MAP (current state)
js/app/views/
  store.js      FULL MODULE — credits, packs, live pricing, gift section ✅
  account.js    FULL MODULE v2.0 — avatar, email, credits, sign out, buy ✅
  guide.js      FULL MODULE ✅
  studio.js     FULL MODULE ✅
  spiralcut.js  FULL MODULE ✅
  code.js       FULL MODULE ✅
  pi.js         FULL MODULE ✅

## CREDIT MATH
1 cr = $0.00001 (1 penny = 1000 credits)
Haiku: ~140 cr/msg, Sky/4o: ~23 cr/msg, Sonnet: ~527 cr/msg
Image: 500 cr, TTS: 200 cr, STT: 0 cr, Video: 2000 cr
Supabase migrations done x2 — DO NOT multiply credits again
Architect: ~20.4M cr, Helen: ~4.5M cr

## STORE TAB REMAINING ISSUES
- HOW WE CHARGE still says $0.0001 — should be $0.00001
- Avatar circle in account has no gradient fill (dark/empty)
- buyGift() PayPal return needs /create-gift not /capture-order

## KEY FILES
index.html:
  - #view-store at line 2065: EMPTY div, store.js owns it
  - #view-account at line 2477: EMPTY div, account.js owns it
  - .view CSS: display:none; flex:1; overflow:hidden; flex-direction:column
  - .view.active CSS: display:flex
  - All other inline tabs still have full HTML (codex/vault/forge/library/style)

js/app/views/store.js:
  - injectStoreStyles() — .credit-amount uses color:var(--teal) NOT gradient clip
  - initialized guard present
  - updateStoreView() updates #store-credits and #store-free-msg
  - Gift section at bottom

js/app/views/account.js:
  - injectAccountStyles() — #view-account rule has NO display property
  - .acct-scroll: flex:1; min-height:0; overflow-y:auto
  - updateAccountView() updates #acct-email, #acct-avatar-initial, #account-credits
  - Exposed: window.initAccountView, window.updateAccountView

js/app/ui.js:
  - updateCreditDisplay() — sets badge, #store-credits, #account-credits
  - viewInits: store calls initStoreView+updateCreditDisplay, account calls initAccountView
  - NO display property set anywhere on view divs

js/app/main.js:
  - window.initAccountView = initAccountView
  - window.updateAccountView = updateAccountView
  - window.updateCreditDisplay = updateCreditDisplay

## SUPABASE
Project ID: qfawusrelwthxabfbglg
Tables: user_usage, gift_codes, paypal_orders, credit_transactions
handoff_docs key=v15 = this handoff
gift_codes: code, credits, created_by, redeemed_by, deducted_from, redeemed_at
RLS anon-read policy enabled on handoff_docs

## KNOWN GOTCHAS
- CRLF on Windows — use repr() to inspect exact bytes before str.replace()
- SHORT heredocs — write _s.py or use Supabase relay for long content
- git --force causes webhook divergence — prefer normal push
- Blank screen = JS syntax error — check console first
- view-{id} MUST be inside #screen-app
- Tab bar is manually written HTML — new tabs need 4 manual steps
- store-free-msg ID exists in old panel-store in slide panel area
