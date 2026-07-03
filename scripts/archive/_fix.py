
import pathlib

f = pathlib.Path("js/app/style.js")
src = f.read_text(encoding="utf-8").replace("\r\n", "\n")

# Patch 1: startParticles — add delegate at top
OLD1 = "function startParticles() {\n  const canvas = document.getElementById('particles-canvas');"
NEW1 = "function startParticles() {\n  if (window._particlesStart) { window._particlesStart(parseInt(pendingStyle.particleDensity)||30, particleSpeed||3, particleSize||2, particleColor||pendingStyle.teal||'#00F6D6'); return; }\n  const canvas = document.getElementById('particles-canvas');"

# Patch 2: stopParticles — add delegate at top
OLD2 = "function stopParticles() {\n  if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }"
NEW2 = "function stopParticles() {\n  if (window._particlesStop) { window._particlesStop(); return; }\n  if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }"

ok = True
if OLD1 in src:
    src = src.replace(OLD1, NEW1, 1)
    print("OK: startParticles delegate added")
else:
    print("NOT FOUND: startParticles anchor")
    idx = src.find("function startParticles()")
    print(repr(src[idx:idx+120]) if idx >= 0 else "not in file")
    ok = False

if OLD2 in src:
    src = src.replace(OLD2, NEW2, 1)
    print("OK: stopParticles delegate added")
else:
    print("NOT FOUND: stopParticles anchor")
    idx = src.find("function stopParticles()")
    print(repr(src[idx:idx+120]) if idx >= 0 else "not in file")
    ok = False

if ok:
    f.write_text(src, encoding="utf-8")
    print("written — ready to commit")
else:
    print("NOT written — check anchors above")
