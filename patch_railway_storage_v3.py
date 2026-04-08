import sys
FILE = r"C:/Users/quart/spiralside-api/main.py"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Fix create-storage-order to use proper PayPal format with plan tag in custom_id
OLD = """@app.post("/create-storage-order")
async def create_storage_order(authorization: str = Header(None)):
    user_id, _ = await verify_user(authorization)
    try:
        order = await create_paypal_order("2", user_id)
        approve_url = next((l["href"] for l in order["links"] if l["rel"] == "approve"), None)
        return {"order_id": order["id"], "approve_url": approve_url, "plan": "archive"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")"""

NEW = """@app.post("/create-storage-order")
async def create_storage_order(authorization: str = Header(None)):
    user_id, _ = await verify_user(authorization)
    try:
        token = await get_paypal_token()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "amount": {"currency_code": "USD", "value": "2.00"},
                        "description": "Spiralside Archive Plan (monthly)",
                        "custom_id": f"{user_id}|archive_monthly"
                    }],
                    "application_context": {
                        "return_url": "https://www.spiralside.com/?payment=success",
                        "cancel_url": "https://www.spiralside.com/?payment=cancelled"
                    }
                }
            )
            resp.raise_for_status()
            order = resp.json()
        approve_url = next((l["href"] for l in order["links"] if l["rel"] == "approve"), None)
        return {"order_id": order["id"], "approve_url": approve_url, "plan": "archive_monthly"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")"""

if OLD not in src:
    print("MISS: create-storage-order")
    sys.exit(1)
src = src.replace(OLD, NEW)
print("OK: /create-storage-order fixed")

# Fix capture to detect plan from custom_id
OLD_CAP = """        print(f"[payment] {user_id} purchased {credits_to_add} credits (${amount})")"""
NEW_CAP = """        print(f"[payment] {user_id} purchased {credits_to_add} credits (${amount})")
        # Activate storage plan if tagged in custom_id
        from datetime import timedelta, datetime as dt
        if "|archive_monthly" in custom_id:
            expires = dt.utcnow() + timedelta(days=30)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "plan_type": "archive_monthly",
                "storage_expires_at": expires.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            _cache_bust(user_id)
            print(f"[storage] archive monthly activated for {user_id} until {expires.date()}")
        elif "|archive_annual" in custom_id:
            expires = dt.utcnow() + timedelta(days=365)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "plan_type": "archive_annual",
                "storage_expires_at": expires.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            _cache_bust(user_id)
            print(f"[storage] archive annual activated for {user_id} until {expires.date()}")"""

if OLD_CAP not in src:
    print("MISS: capture print line")
    idx = src.find('credits_to_add} credits')
    print(repr(src[max(0,idx-20):idx+100]))
    sys.exit(1)
src = src.replace(OLD_CAP, NEW_CAP)
print("OK: capture detects archive plans from custom_id")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
