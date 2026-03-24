
import urllib.request, json, pathlib, re

ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E"

url = "https://qfawusrelwthxabfbglg.supabase.co/rest/v1/handoff_docs?key=eq.particles_js&select=content"
req = urllib.request.Request(url, headers={"apikey": ANON, "Authorization": "Bearer " + ANON})
data = json.loads(urllib.request.urlopen(req).read())
content = data[0]["content"]
print("fetched", len(content), "chars")

pathlib.Path("js/app").mkdir(parents=True, exist_ok=True)
pathlib.Path("js/app/particles.js").write_text(content, encoding="utf-8")
print("written: js/app/particles.js")

main = pathlib.Path("js/app/main.js")
src = main.read_text(encoding="utf-8").replace("
", "
")

if "initParticles" not in src:
    first_nl = src.find("
") + 1
    src = src[:first_nl] + "import { initParticles } from ./particles.js;
".replace(" ./", " ./") + src[first_nl:]
    src = src.replace("import { initParticles } from ./particles.js;", "import { initParticles } from "./particles.js";")
    print("OK: import added")
else:
    print("SKIP: import already present")

if "initParticles()" not in src:
    m = re.search(r"showApp\([^)]+\);", src)
    if m:
        src = src[:m.end()] + "
  initParticles();" + src[m.end():]
        print("OK: initParticles() call injected")
    else:
        print("WARN: showApp call not found")
else:
    print("SKIP: call already present")

main.write_text(src, encoding="utf-8")
print("done")
