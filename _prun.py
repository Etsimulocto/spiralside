
import urllib.request, json, pathlib, re

ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E"
HEADERS = {"apikey": ANON, "Authorization": "Bearer " + ANON}

def fetch(key):
    url = f"https://qfawusrelwthxabfbglg.supabase.co/rest/v1/handoff_docs?key=eq.{key}&select=content"
    req = urllib.request.Request(url, headers=HEADERS)
    return json.loads(urllib.request.urlopen(req).read())[0]["content"]

# ── 1. write particles.js ──────────────────────────────────
content = fetch("particles_js")
print("fetched particles_js:", len(content), "chars")
pathlib.Path("js/app").mkdir(parents=True, exist_ok=True)
pathlib.Path("js/app/particles.js").write_text(content, encoding="utf-8")
print("written: js/app/particles.js")

# ── 2. patch main.js ──────────────────────────────────────
main = pathlib.Path("js/app/main.js")
src = main.read_text(encoding="utf-8")
src = src.replace("\r\n", "\n")

if "initParticles" not in src:
    # add import after first import line
    first_nl = src.find("\n") + 1
    src = src[:first_nl] + 'import { initParticles } from "./particles.js";\n' + src[first_nl:]
    print("OK: import added")
else:
    print("SKIP: import already present")

if "initParticles()" not in src:
    m = re.search(r"showApp\([^)]+\);", src)
    if m:
        src = src[:m.end()] + "\n  initParticles();" + src[m.end():]
        print("OK: initParticles() call injected after showApp")
    else:
        print("WARN: showApp call not found — appending")
        src += "\n// particles init\ninitParticles();\n"
else:
    print("SKIP: initParticles() call already present")

main.write_text(src, encoding="utf-8")
print("done — ready to commit")
