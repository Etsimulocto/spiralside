import sys
FILE = r"C:/Users/quart/spiralside-api/main.py"

with open(FILE, encoding="utf-8") as f:
    src = f.read()

# Add annual plan to CREDIT_PACKS so PayPal accepts $19.99
# But we need a separate endpoint since $19.99 isn't in CREDIT_PACKS
# Insert /create-annual-storage-order before /create-storage-order

OLD = '@app.post("/create-storage-order")'
NEW = '''@app.post("/create-annual-storage-order")
async def create_annual_storage_order(authorization: str = Header(None)):
    user_id, sb = await verify_user(authorization)
    try:
        order = await create_paypal_order("19.99", user_id)
        approve_url = next((l["href"] for l in order["links"] if l["rel"] == "approve"), None)
        return {"order_id": order["id"], "approve_url": approve_url, "plan": "archive_annual"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")

@app.post("/create-storage-order")'''

if OLD not in src:
    print("MISS: /create-storage-order anchor")
    sys.exit(1)
src = src.replace(OLD, NEW)
print("OK: /create-annual-storage-order added")

# Update capture-order to handle $19.99 as annual plan
OLD_CAP = '''        if amount == "2":
            from datetime import timedelta, datetime as dt
            expires = dt.utcnow() + timedelta(days=30)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "storage_expires_at": expires.isoformat()
            }).eq("user_id", user_id).execute()
            print(f"[storage] archive plan activated for {user_id}")'''

NEW_CAP = '''        if amount == "2":
            from datetime import timedelta, datetime as dt
            expires = dt.utcnow() + timedelta(days=30)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "plan_type": "archive_monthly",
                "storage_expires_at": expires.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            print(f"[storage] archive monthly activated for {user_id} until {expires.date()}")
        elif amount == "19.99":
            from datetime import timedelta, datetime as dt
            expires = dt.utcnow() + timedelta(days=365)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "plan_type": "archive_annual",
                "storage_expires_at": expires.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            print(f"[storage] archive annual activated for {user_id} until {expires.date()}")'''

if OLD_CAP not in src:
    print("MISS: capture amount==2 block")
    # show context around amount
    idx = src.find('amount == "2"')
    print(repr(src[max(0,idx-50):idx+200]))
    sys.exit(1)
src = src.replace(OLD_CAP, NEW_CAP)
print("OK: capture handles monthly + annual")

# Also allow $19.99 in create_paypal_order — it validates amount format
# The create_paypal_order function takes a string amount directly so no change needed
# But CREDIT_PACKS validation in /create-order blocks non-5/10/20 amounts
# Annual uses its own endpoint so no issue

with open(FILE, "w", encoding="utf-8") as f:
    f.write(src)
print("DONE")
