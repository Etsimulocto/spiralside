
import pathlib

# ── 1. particles.js — add cycle engine ──────────────────────────
f = pathlib.Path("js/app/particles.js")
src = f.read_text(encoding="utf-8").replace("\r\n", "\n")

add = '''
// ── AUTO-CYCLE unlocked presets ───────────────────────────────
let cycleTimer = null;
window.startParticleCycle = function(intervalMs) {
  if (cycleTimer) clearInterval(cycleTimer);
  var free = ['glitter','snow','sparks','confetti','aurora','void'].filter(function(p){ return presetUnlocked(p); });
  var idx = free.indexOf(cfg.preset);
  if (idx < 0) idx = 0;
  cycleTimer = setInterval(function() {
    idx = (idx + 1) % free.length;
    cfg.preset = free[idx];
    saveCfg();
    document.querySelectorAll('[id^=pchip-]').forEach(function(b){ b.style.borderColor=''; b.style.color=''; });
    var chip = document.getElementById('pchip-' + free[idx]);
    if (chip) { chip.style.borderColor = 'var(--teal)'; chip.style.color = 'var(--teal)'; }
  }, intervalMs || 3000);
};
window.stopParticleCycle = function() {
  if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
};
'''

if 'startParticleCycle' not in src:
    src = src.replace('export async function initParticles()', add + 'export async function initParticles()')
    f.write_text(src, encoding="utf-8")
    print("OK: cycle engine added to particles.js")
else:
    print("SKIP: already present")

# ── 2. index.html — add cycle button above palette row ──────────
h = pathlib.Path("index.html")
htm = h.read_text(encoding="utf-8").replace("\r\n", "\n")

OLD = "          <!-- PALETTE DOTS -->"
NEW = """          <!-- CYCLE TOGGLE -->
          <button id="cycle-btn" onclick="if(window._cycleOn){window.stopParticleCycle();window._cycleOn=false;this.style.borderColor='';this.style.color='';}else{window.startParticleCycle(3000);window._cycleOn=true;this.style.borderColor='var(--teal)';this.style.color='var(--teal)';}" style="padding:5px 14px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;margin-bottom:4px">&#x21BB; cycle all</button>
          <!-- PALETTE DOTS -->"""

if OLD in htm:
    htm = htm.replace(OLD, NEW, 1)
    h.write_text(htm, encoding="utf-8")
    print("OK: cycle button added to index.html")
else:
    print("NOT FOUND: palette dots comment in index.html")
