# SPIRALSIDE HANDOFF v16
# March 20 2026 — morning session

## ORIENTATION
Nimbis = Claude in-project name. Architect = quarterbitgames / Etsimulocto.
Read HANDOFF before touching anything. Inspect files before writing.

## CURRENT VERSION: v0.8.247

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
ALWAYS str.replace() with exact literal text.
GIT: git add . && git commit -m msg && git push origin main --force (frontend)
GIT: git add . && git commit -m msg && git push (backend, no --force)

## THE BIG ARCHITECTURAL ISSUE (what this session hit)

### ROOT CAUSE: Two-tier tab system
Some view tabs were built in the old era (inline HTML in index.html).
Some were built in the new era (empty div + module file renders them).
These two approaches conflict — credits disappear, layouts collapse.

### INLINE TABS (still in index.html — need module conversion):
- view-codex    line 1666  — full inline HTML
- view-vault    line 1716  — full inline HTML
- view-forge    line 1734  — full inline HTML
- view-library  line 1962  — full inline HTML
- view-style    line 2107  — full inline HTML
- view-account  line 2517  — full inline HTML (avatar, email, credits, sign out)

### MODULE TABS (empty div + js/app/views/{name}.js):
- view-guide, view-store, view-studio, view-spiralcut
- view-code, view-pi, view-imagine, view-music

### WHY MODULES WORK AND INLINE DOES NOT:
The .view CSS is: display:none; flex:1; overflow:hidden; flex-direction:column
When active, display:flex is added. The child scroll container MUST have
flex:1; min-height:0 or it collapses to zero height (getBoundingClientRect = 0).
Module tabs inject this CSS themselves via injectStyles().
Inline tabs use old layout patterns that pre-date the flex view system.
Result: credits and content are IN the DOM with correct values but invisible.

### PLAN: Convert each inline tab to a module — one per session
Pattern for each tab:
1. Create js/app/views/{name}.js with injectStyles() + init{Name}View()
2. injectStyles() injects CSS with .{name}-scroll { flex:1; min-height:0; overflow-y:auto; }
3. init{Name}View() renders innerHTML once (initialized guard), updates values on revisit
4. Empty the view div in index.html (remove inline HTML, keep empty div)
5. Add to viewInits in ui.js
6. Ensure window.init{Name}View exposed in main.js
7. Remove any duplicate IDs from old slide panel in index.html

### ACCOUNT TAB STATUS:
view-account HTML is intact in index.html (lines 2517-2552).
account.js currently just updates existing elements (no innerHTML overwrite).
The credits ARE in the DOM with correct value and color but zero dimensions.
Fix: convert account to full module (same as store.js pattern).
The old slide panel (#panel-account at line ~2844) still has duplicate IDs —
rename or remove those as part of the conversion.

### STORE TAB STATUS:
store.js is a full module, works correctly.
#view-store in index.html is empty (store.js owns it).
Gift section works — SPIRAL codes generate and redeem correctly (verified with Helen).
Remaining: store still says "1 credit = $0.0001" — should be $0.00001.

## WHAT WORKS THIS SESSION
- Options Panel (+ button, models/tools/voice sections)
- Spiral send button, mic STT, TTS toggle
- Sky/4o-mini as default model (~23 cr/msg, cheapest)
- Credit system: 1cr = $0.00001, 1 penny = 1000 credits
- Pack sizes: $5=500k / $10=1.1M / $20=2.4M cr
- Gift system LIVE: send from balance, SPIRAL codes, redeem — end-to-end verified
- store.js full module with Bloomcore styling, scrollable, gift section
- Version badge bigger and readable
- Supabase gift_codes table with deducted_from column

## CREDIT MATH
1 cr = $0.00001
Haiku: ~140 cr/msg, Sky/4o: ~23 cr/msg, Sonnet: ~527 cr/msg
Image: 500 cr, TTS: 200 cr, STT: 0 cr, Video: 2000 cr
Supabase migrations done x2 — DO NOT multiply credits again
All balances already migrated. Architect: ~19.9M cr, Helen: ~4.5M cr

## MODULE CONVERSION PATTERN (store.js is the reference)
See js/app/views/store.js for the working pattern:
- injectStoreStyles() called once, checks for existing style tag
- initialized guard prevents re-render
- updateStoreView() updates values without re-rendering
- view-scroll-body CSS: flex:1; min-height:0; overflow-y:auto;
- All CSS injected by the module — no dependency on index.html CSS

## KNOWN GOTCHAS
- SHORT heredocs — write _s.py or use Supabase relay for long content
- NEVER byte-offset HTML
- Blank screen = JS syntax error — check console first
- view-{id} MUST be inside #screen-app
- index.html has duplicate IDs in old slide panel (#panel-store, #panel-account)
  These have been renamed with old- prefix but check before adding new IDs
- store-free-msg ID still exists in old panel-store — may cause conflicts
- Supabase credits col is float — cast ::numeric for ROUND()
- gift_codes table: code, credits, created_by, redeemed_by, deducted_from
- Tab drag: initTabDrag() only wires tabs present at call time
- Backend /send-gift, /create-gift, /redeem-gift all live on Railway

## TAB BAR (v0.8.247)
chat|pi|forge|cards|codex|imagine|cut|library|vault|music|code|style|store|account

## MODULE MAP
js/app/views/
  store.js      FULL MODULE — credits, packs, live pricing, gift section
  account.js    PARTIAL — updates index.html elements only (needs full conversion)
  guide.js      FULL MODULE
  studio.js     FULL MODULE
  spiralcut.js  FULL MODULE
  code.js       FULL MODULE
  pi.js         FULL MODULE

## MORNING TODO (one per thread)
1. Convert view-account to full module (fix invisible credits)
2. Convert view-codex to module
3. Convert view-vault to module
4. Convert view-forge to module
5. Convert view-library to module
6. Convert view-style to module
7. Fix store explainer text: still says $0.0001 should be $0.00001
8. Backend: verify actual_cost token billing is live in /chat
9. Fix buyGift() PayPal return — needs to call /create-gift not /capture-order
