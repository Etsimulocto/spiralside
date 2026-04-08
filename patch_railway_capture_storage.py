import sys
FILE = r"C:/Users/quart/spiralside-api/main.py"

with open(FILE, encoding="utf-8") as f:
    src = f.read()

# Fix 1: create-storage-order should tag the custom_id with plan info
# so capture-order knows what to activate
OLD_STORAGE = '''@app.post("/create-storage-order")
async def create_storage_order(authorization: str = Header(None)):
    user_id, _ = await verify_user(authorization)
    try:
        order = await create_paypal_order("2", user_id)
        approve_url = next((l["href"] for l in order["links"] if l["rel"] == "approve"), None)
        return {"order_id": order["id"], "approve_url": approve_url, "plan": "archive"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")'''

NEW_STORAGE = '''@app.post("/create-storage-order")
async def create_storage_order(authorization: str = Header(None)):
    user_id, _ = await verify_user(authorization)
    try:
        # Tag custom_id with plan type so capture knows what to activate
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
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")'''

if OLD_STORAGE not in src:
    print("MISS: create-storage-order")
    sys.exit(1)
src = src.replace(OLD_STORAGE, NEW_STORAGE)
print("OK: /create-storage-order fixed")

# Fix 2: create-annual-storage-order — same pattern
OLD_ANNUAL = '''@app.post("/create-annual-storage-order")
async def create_annual_storage_order(authorization: str = Header(None)):
    user_id, _ = await verify_user(authorization)
    try:
        order = await create_paypal_order("19.99", user_id)
        approve_url = next((l["href"] for l in order["links"] if l["rel"] == "approve"), None)
        return {"order_id": order["id"], "approve_url": approve_url, "plan": "archive_annual"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")'''

NEW_ANNUAL = '''@app.post("/create-annual-storage-order")
async def create_annual_storage_order(authorization: str = Header(None)):
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
                        "amount": {"currency_code": "USD", "value": "19.99"},
                        "description": "Spiralside Archive Plan (annual)",
                        "custom_id": f"{user_id}|archive_annual"
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
        return {"order_id": order["id"], "approve_url": approve_url, "plan": "archive_annual"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")'''

if OLD_ANNUAL not in src:
    print("MISS: create-annual-storage-order")
    sys.exit(1)
src = src.replace(OLD_ANNUAL, NEW_ANNUAL)
print("OK: /create-annual-storage-order fixed")

# Fix 3: capture-order — handle archive plans from custom_id
# Find the credits_to_add line and add plan activation after it
OLD_CAPTURE = '''        print(f"[payment] {user_id} purchased {credits_to_add} credits (${amount})")
        if amount == "2":
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

NEW_CAPTURE = '''        print(f"[payment] {user_id} purchased {credits_to_add} credits (${amount})")
        # Check custom_id for plan activation — format: user_id|plan_type
        from datetime import timedelta, datetime as dt
        if "|archive_monthly" in custom_id or amount == "2":
            expires = dt.utcnow() + timedelta(days=30)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "plan_type": "archive_monthly",
                "storage_expires_at": expires.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            print(f"[storage] archive monthly activated for {user_id} until {expires.date()}")
            _cache_bust(user_id)
        elif "|archive_annual" in custom_id or amount == "19.99":
            expires = dt.utcnow() + timedelta(days=365)
            sb.table("user_usage").update({
                "storage_plan": "archive",
                "plan_type": "archive_annual",
                "storage_expires_at": expires.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            print(f"[storage] archive annual activated for {user_id} until {expires.date()}")
            _cache_bust(user_id)'''

if OLD_CAPTURE not in src:
    print("MISS: capture storage block")
    idx = src.find("archive monthly")
    print(repr(src[max(0,idx-100):idx+300]))
    sys.exit(1)
src = src.replace(OLD_CAPTURE, NEW_CAPTURE)
print("OK: capture handles archive plans from custom_id")

with open(FILE, "w", encoding="utf-8") as f:
    f.write(src)
print("DONE")
