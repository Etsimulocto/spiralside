import os, urllib.request, json

ROOT = os.path.expanduser("~/spiralside")
env = open(os.path.join(ROOT, ".env")).read()
key = [l.split("=",1)[1].strip() for l in env.splitlines() if "SUPABASE_ANON_KEY" in l][0]
proj = "qfawusrelwthxabfbglg"

url = f"https://{proj}.supabase.co/rest/v1/handoff_docs?key=eq.bloomengine_js&select=content"
req = urllib.request.Request(url, headers={"apikey": key, "Authorization": "Bearer " + key})
data = json.loads(urllib.request.urlopen(req).read())[0]["content"]

path = os.path.join(ROOT, "js/app/views/bloomengine.js")
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("OK wrote", path)
