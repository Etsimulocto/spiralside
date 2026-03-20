# ============================================================
# patch_vault_backend.py
# Adds /vault/list, /vault/add, /vault/delete/{id} to main.py
# Run from spiralside-api root in Git Bash:
#   python patch_vault_backend.py
# ============================================================

import sys, os

TARGET = "main.py"

# ── VERIFY FILE EXISTS ────────────────────────────────────
if not os.path.exists(TARGET):
    print(f"ERROR: {TARGET} not found — run from spiralside-api root")
    sys.exit(1)

with open(TARGET, "r", encoding="utf-8") as f:
    src = f.read()

# ── GUARD: don't apply twice ──────────────────────────────
if "vault/list" in src:
    print("ALREADY PATCHED — vault routes already present in main.py")
    sys.exit(0)

# ── STEP 1: Add VaultFileRecord model after CaptureRequest ─
OLD_MODEL = '''class CaptureRequest(BaseModel):
    order_id: str'''

NEW_MODEL = '''class CaptureRequest(BaseModel):
    order_id: str

class VaultFileRecord(BaseModel):
    id: str           # UUID generated client-side so IDB and DB stay in sync
    name: str         # original filename
    size: int         # bytes
    mime_type: str    # e.g. text/plain, image/png'''

if OLD_MODEL not in src:
    print("ERROR: CaptureRequest anchor not found — inspect main.py repr")
    sys.exit(1)

src = src.replace(OLD_MODEL, NEW_MODEL, 1)
print("✓ Added VaultFileRecord model")

# ── STEP 2: Add vault routes before the reload-characters route ─
OLD_ROUTE = '''# ── RELOAD CHARACTERS ─────────────────────────────────────
@app.post("/reload-characters")'''

NEW_ROUTES = '''# ── VAULT: LIST ───────────────────────────────────────────
# Returns metadata list for user's vault files (no content — stored in IDB)
@app.get("/vault/list")
async def vault_list(authorization: str = Header(None)):
    user_id, sb = await verify_user(authorization)
    try:
        result = sb.table("vault_files") \\
            .select("id,name,size,mime_type,created_at") \\
            .eq("user_id", user_id) \\
            .order("created_at", desc=False) \\
            .execute()
        return {"files": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vault list error: {str(e)}")

# ── VAULT: ADD ─────────────────────────────────────────────
# Upserts a metadata record; content stored locally in client IDB
@app.post("/vault/add")
async def vault_add(req: VaultFileRecord, authorization: str = Header(None)):
    user_id, sb = await verify_user(authorization)
    try:
        sb.table("vault_files").upsert({
            "id":        req.id,
            "user_id":   user_id,
            "name":      req.name,
            "size":      req.size,
            "mime_type": req.mime_type,
        }).execute()
        return {"success": True, "id": req.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vault add error: {str(e)}")

# ── VAULT: DELETE ──────────────────────────────────────────
# Removes metadata record; client responsible for IDB cleanup
@app.delete("/vault/delete/{file_id}")
async def vault_delete(file_id: str, authorization: str = Header(None)):
    user_id, sb = await verify_user(authorization)
    try:
        sb.table("vault_files") \\
            .delete() \\
            .eq("id", file_id) \\
            .eq("user_id", user_id) \\
            .execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vault delete error: {str(e)}")

# ── RELOAD CHARACTERS ─────────────────────────────────────
@app.post("/reload-characters")'''

if OLD_ROUTE not in src:
    print("ERROR: reload-characters anchor not found — inspect main.py repr")
    sys.exit(1)

src = src.replace(OLD_ROUTE, NEW_ROUTES, 1)
print("✓ Added /vault/list, /vault/add, /vault/delete routes")

# ── WRITE BACK ────────────────────────────────────────────
with open(TARGET, "w", encoding="utf-8") as f:
    f.write(src)

print("\n✅ main.py patched successfully")
print("Next: git add . && git commit -m 'feat: add vault CRUD endpoints' && git push")
