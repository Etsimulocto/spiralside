import sys, re
FILE = r"C:/Users/quart/spiralside-api/main.py"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# ── 1. Add /create-annual-storage-order if not already there
if "/create-annual-storage-order" in src:
    print("SKIP: /create-annual-storage-order already exists")
else:
    idx = src.find('@app.post("/create-storage-order")')
    if idx < 0:
        print("MISS: /create-storage-order anchor")
        sys.exit(1)
    new_annual = '''@app.post("/create-annual-storage-order")
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
        raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")

'''
    src = src[:idx] + new_annual + src[idx:]
    print("OK: /create-annual-storage-order added")

# ── 2. Fix capture-order — find the print line dynamically
# The print line contains 'credits_to_add' and 'order_data'
idx = src.find("credits_to_add")
if idx < 0:
    print("MISS: credits_to_add not found")
    sys.exit(1)

# Find the print statement line containing credits_to_add
line_start = src.rfind('\n', 0, idx) + 1
line_end   = src.find('\n', idx)
print_line = src[line_start:line_end]
print("Found print line:", repr(print_line))

# Only add plan activation if not already there
if "archive_monthly" in src:
    print("SKIP: plan activation already in capture")
else:
    # Insert plan activation block after the print line
    activation = '''
        # Activate storage plan if tagged in custom_id
        _custom = result.get("purchase_units", [{}])[0].get("custom_id", "") if isinstance(result, dict) else ""
        from datetime import timedelta, datetime as dt
        if "|archive_monthly" in _custom:
            _exp = dt.utcnow() + timedelta(days=30)
            sb.table("user_usage").update({
                "storage_plan": "archive", "plan_type": "archive_monthly",
                "storage_expires_at": _exp.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            if hasattr(sys.modules[__name__], "_cache_bust"): _cache_bust(user_id)
            print(f"[storage] archive monthly activated for {user_id} until {_exp.date()}")
        elif "|archive_annual" in _custom:
            _exp = dt.utcnow() + timedelta(days=365)
            sb.table("user_usage").update({
                "storage_plan": "archive", "plan_type": "archive_annual",
                "storage_expires_at": _exp.isoformat(),
                "plan_purchased_at": dt.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            if hasattr(sys.modules[__name__], "_cache_bust"): _cache_bust(user_id)
            print(f"[storage] archive annual activated for {user_id} until {_exp.date()}")'''
    
    src = src[:line_end] + activation + src[line_end:]
    print("OK: plan activation inserted after print line")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
