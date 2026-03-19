#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — PATCH: Add Coding Tab
# Patches index.html (nav item + view div) and main.py (/code endpoint)
# Run from ~/spiralside in Git Bash:
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe /tmp/patch_code_tab.py
# ============================================================

import re, sys

# ── PATCH 1: index.html — add 5th nav item ────────────────
print("=== Patching index.html nav item ===")
idx_path = 'index.html'
idx = open(idx_path, encoding='utf-8').read()

OLD_NAV_END = '''    <button class="nav-item" data-view="builder-view">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>build
    </button>
  </nav>'''

NEW_NAV_END = '''    <button class="nav-item" data-view="builder-view">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>build
    </button>
    <button class="nav-item" data-view="code-view">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>code
    </button>
  </nav>'''

if OLD_NAV_END in idx:
    idx = idx.replace(OLD_NAV_END, NEW_NAV_END, 1)
    print("  ✓ nav item added")
else:
    print("  ✗ nav item anchor not found — check manually")
    sys.exit(1)

# ── PATCH 2: index.html — add code view div before </div> closing #app ──
OLD_APP_END = '''  </nav>
</div>

<!-- SLIDE PANEL'''

NEW_APP_END = '''  </nav>

  <!-- CODE VIEW -->
  <div class="view" id="code-view"></div>

</div>

<!-- SLIDE PANEL'''

if OLD_APP_END in idx:
    idx = idx.replace(OLD_APP_END, NEW_APP_END, 1)
    print("  ✓ code view div added")
else:
    print("  ✗ code view div anchor not found — check manually")
    sys.exit(1)

# ── PATCH 3: index.html — import and init code module in <script type="module"> ──
OLD_MODULE = '''  <script type="module" defer>
    import { init } from "./js/comic/viewer.js";
    window.ComicViewer = { init };
  </script>'''

NEW_MODULE = '''  <script type="module" defer>
    import { init }                   from "./js/comic/viewer.js";
    import { renderCode, injectCodeStyles } from "./js/app/views/code.js";
    window.ComicViewer = { init };
    window.renderCode  = renderCode;
    window.injectCodeStyles = injectCodeStyles;
  </script>'''

if OLD_MODULE in idx:
    idx = idx.replace(OLD_MODULE, NEW_MODULE, 1)
    print("  ✓ code module import added")
else:
    print("  ✗ module import anchor not found — check manually")
    sys.exit(1)

# ── PATCH 4: index.html — wire code view in nav click handler ──
# The existing nav handler just does data-view switching.
# We need to call renderCode when code-view is activated.
OLD_NAV_HANDLER = '''document.querySelectorAll('.nav-item').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    b.classList.add('active');document.getElementById(b.dataset.view).classList.add('active');
  });
});'''

NEW_NAV_HANDLER = '''document.querySelectorAll('.nav-item').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    b.classList.add('active');
    const view = document.getElementById(b.dataset.view);
    view.classList.add('active');
    // Lazy-init code view on first activation
    if (b.dataset.view === 'code-view' && !view.dataset.initialized) {
      view.dataset.initialized = '1';
      if (window.injectCodeStyles) window.injectCodeStyles();
      if (window.renderCode) window.renderCode(view);
    }
  });
});'''

if OLD_NAV_HANDLER in idx:
    idx = idx.replace(OLD_NAV_HANDLER, NEW_NAV_HANDLER, 1)
    print("  ✓ nav handler updated for code view lazy-init")
else:
    print("  ✗ nav handler anchor not found — check manually")
    sys.exit(1)

open(idx_path, 'w', encoding='utf-8').write(idx)
print("  ✓ index.html written\n")


# ── PATCH 5: main.py — add /code endpoint ────────────────
print("=== Patching main.py /code endpoint ===")
main_path = '../spiralside-api/main.py'
try:
    main = open(main_path, encoding='utf-8').read()
except FileNotFoundError:
    # Try local path if running from spiralside-api dir
    main_path = 'main.py'
    main = open(main_path, encoding='utf-8').read()

# Model name mapping for the /code endpoint
CODE_ENDPOINT = '''
# ── CODE ASSISTANT ────────────────────────────────────────
class CodeRequest(BaseModel):
    messages: list          # [{ role, content }, ...]  full history
    mode:     str = "general"
    model:    str = "haiku"  # haiku | sonnet | opus
    system:   str = ""       # injected from frontend mode preset

# Model routing for /code — maps frontend value to Anthropic model string + credit cost
CODE_MODELS = {
    "haiku":  {"model": "claude-haiku-4-5-20251001",   "cost": 0.01, "paid_only": False},
    "sonnet": {"model": "claude-sonnet-4-6",            "cost": 0.06, "paid_only": True },
    "opus":   {"model": "claude-opus-4-6",              "cost": 0.15, "paid_only": True },
}

@app.post("/code")
async def code_assistant(req: CodeRequest, authorization: str = Header(None)):
    user_id, sb = await verify_user(authorization)
    today = str(date.today())

    # ── LOAD USAGE ──
    usage = sb.table("user_usage").select("*").eq("user_id", user_id).execute()
    if not usage.data:
        sb.table("user_usage").insert({
            "user_id": user_id, "credits": 0.0,
            "free_messages_today": 0, "last_reset_date": today, "is_paid": False
        }).execute()
        free_count, credits, is_paid = 0, 0.0, False
    else:
        record     = usage.data[0]
        credits    = record["credits"]
        is_paid    = record["is_paid"]
        free_count = record["free_messages_today"]
        if record.get("last_reset_date") != today:
            free_count = 0
            sb.table("user_usage").update({
                "free_messages_today": 0, "last_reset_date": today
            }).eq("user_id", user_id).execute()

    # ── VALIDATE MODEL ──
    model_key  = req.model if req.model in CODE_MODELS else "haiku"
    model_cfg  = CODE_MODELS[model_key]
    model_str  = model_cfg["model"]
    cost       = model_cfg["cost"]
    paid_only  = model_cfg["paid_only"]

    # Free users can only use haiku, and are capped at free daily limit
    if not is_paid:
        if paid_only:
            raise HTTPException(status_code=402,
                detail=f"The {model_key} model requires a paid account. Add credits to unlock.")
        if free_count >= FREE_DAILY_LIMIT:
            raise HTTPException(status_code=429,
                detail=f"Free limit reached ({FREE_DAILY_LIMIT}/day). Add credits to continue.")
    else:
        if credits < cost:
            raise HTTPException(status_code=402,
                detail="Out of credits. Please add more to continue.")

    # ── CALL ANTHROPIC ──
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model":      model_str,
                    "max_tokens": 4096,
                    "system":     req.system,
                    "messages":   req.messages,  # full history array
                }
            )
        resp.raise_for_status()
        result = resp.json()["content"][0]["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # ── DEDUCT CREDITS / FREE COUNT ──
    if not is_paid:
        sb.table("user_usage").update({
            "free_messages_today": free_count + 1
        }).eq("user_id", user_id).execute()
    else:
        sb.table("user_usage").update({
            "credits": round(credits - cost, 4)
        }).eq("user_id", user_id).execute()

    return {
        "result": result,
        "usage": {
            "is_paid":              is_paid,
            "credits_remaining":    round(credits - cost, 4) if is_paid else None,
            "free_messages_today":  free_count + 1 if not is_paid else None,
            "free_limit":           FREE_DAILY_LIMIT,
        }
    }
'''

# Insert before the reload-characters endpoint
RELOAD_ANCHOR = "# ── RELOAD CHARACTERS ─────────────────────────────────────────────────────"
if RELOAD_ANCHOR in main:
    main = main.replace(RELOAD_ANCHOR, CODE_ENDPOINT + "\n\n" + RELOAD_ANCHOR, 1)
    print("  ✓ /code endpoint added to main.py")
else:
    # Fallback: append before last line
    main = main.rstrip() + "\n" + CODE_ENDPOINT + "\n"
    print("  ✓ /code endpoint appended to main.py (anchor not found, appended)")

open(main_path, 'w', encoding='utf-8').write(main)
print("  ✓ main.py written\n")

print("=== All patches applied ===")
print("")
print("Next steps:")
print("  1. Copy js/app/views/code.js from the output")
print("  2. From ~/spiralside:")
print("       git add . && git commit -m 'feat: coding tab v1 — mode presets, model picker, 10-pair history' && git push origin main --force")
print("  3. From ~/spiralside-api:")
print("       git add . && git commit -m 'feat: /code endpoint — haiku/sonnet/opus routing, credit deduction' && git push")
print("  4. Verify Railway redeploy (~30s)")
