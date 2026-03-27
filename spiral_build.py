# Fetches spiral.js from Supabase and writes it to disk
# Then patches index.html, ui.js, main.js using exact anchors from live files
# Pattern: _p.py Supabase pipeline as documented in handoffs
import urllib.request, json, subprocess, os, re

SUPA_URL = 'https://qfawusrelwthxabfbglg.supabase.co/rest/v1/handoff_docs?key=eq.spiral_js&select=content'
SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E'

def read(p): 
    with open(p,'r',encoding='utf-8') as f: return f.read()
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)
    print('wrote',p)
def run(cmd):
    r=subprocess.run(cmd,shell=True,capture_output=True,text=True)
    if r.stdout.strip(): print(r.stdout.strip())
    if r.stderr.strip(): print(r.stderr.strip())
    return r.returncode

print('[1] Fetching spiral.js from Supabase...')
req=urllib.request.Request(SUPA_URL,headers={'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY})
data=json.loads(urllib.request.urlopen(req).read())
# Content has '' as escaped single quotes -- unescape
js_content = data[0]['content'].replace("''","'")
os.makedirs('js/app/views',exist_ok=True)
write('js/app/views/spiral.js', js_content)

print('[2] Patching index.html...')
html = read('index.html')

# Tab button -- insert after tab-cannonized button
if 'tab-spiral' not in html:
    # Find tab-cannonized closing button tag
    idx = html.find('id="tab-cannonized"')
    if idx < 0: idx = html.find('id="tab-account"')
    close = html.index('</button>', idx) + len('</button>')
    TAB = '\n        <button id="tab-spiral" class="tab-btn" onclick="switchView(\'spiral\')">\u223f spiral</button>'
    html = html[:close] + TAB + html[close:]
    print('  tab button added')
else:
    print('  tab button already present')

# View div -- insert after view-cannonized closing div
if 'view-spiral' not in html:
    idx = html.rfind('id="view-cannonized"')
    if idx < 0: idx = html.rfind('id="view-account"')
    close = html.index('</div>', idx) + len('</div>')
    VIEW = '\n<div class="view" id="view-spiral"></div>'
    html = html[:close] + VIEW + html[close:]
    print('  view div added')
else:
    print('  view div already present')

write('index.html', html)

print('[3] Patching js/app/ui.js...')
ui = read('js/app/ui.js')
if 'spiral' not in ui:
    # Insert into viewInits after pi: entry
    ANCHOR = "pi:        () => window.initPiView       && window.initPiView(),"
    ENTRY  = "\n    spiral:    () => window.initSpiralView  && window.initSpiralView(),"
    if ANCHOR in ui:
        idx = ui.index(ANCHOR) + len(ANCHOR)
        ui = ui[:idx] + ENTRY + ui[idx:]
        write('js/app/ui.js', ui)
        print('  viewInits entry added after pi:')
    else:
        print('  ANCHOR NOT FOUND -- showing viewInits area:')
        m = re.search(r'const viewInits', ui)
        if m: print(repr(ui[m.start():m.start()+400]))
else:
    print('  already has spiral entry')

print('[4] Patching js/app/main.js...')
main = read('js/app/main.js')
if 'initSpiral' not in main:
    # Add import after initParticles import (line 2, known anchor)
    IMPORT_ANCHOR = 'import { initParticles } from "./particles.js";'
    GLOBAL_ANCHOR = 'window.initGuideView      = initGuide;'
    if IMPORT_ANCHOR in main:
        idx = main.index(IMPORT_ANCHOR) + len(IMPORT_ANCHOR)
        main = main[:idx] + "\nimport { initSpiral }      from './views/spiral.js';" + main[idx:]
        print('  import added')
    else:
        print('  import anchor not found')
    if GLOBAL_ANCHOR in main:
        idx = main.index(GLOBAL_ANCHOR) + len(GLOBAL_ANCHOR)
        main = main[:idx] + "\nwindow.initSpiralView     = initSpiral;" + main[idx:]
        print('  window.initSpiralView added')
    else:
        print('  global anchor not found')
    write('js/app/main.js', main)
else:
    print('  initSpiral already in main.js')

print('[5] Commit + push...')
run('git add js/app/views/spiral.js index.html js/app/ui.js js/app/main.js')
run('git commit -m "feat: spiral lab tab with gold unlocks"')
run('git push --force origin main')
print('\nDone! Deploy in ~30s')
