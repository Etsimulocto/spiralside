
import pathlib

f = pathlib.Path("js/app/style.js")
src = f.read_text(encoding="utf-8").replace("\r\n", "\n")

old_speed  = "export function updateParticleSpeed(v) { particleSpeed = parseInt(v); stopParticles(); startParticles(); }"
old_size   = "export function updateParticleSize(v)  { particleSize  = parseFloat(v); stopParticles(); startParticles(); }"
old_color  = "export function updateParticleColor(v) { particleColor = v; stopParticles(); startParticles(); }"

new_speed  = "export function updateParticleSpeed(v)  { particleSpeed = parseInt(v);   if(window._particlesStop){window._particlesStop();} if(window._particlesStart){window._particlesStart(parseInt(pendingStyle.particleDensity)||30,particleSpeed,particleSize,particleColor||'#00F6D6');} }"
new_size   = "export function updateParticleSize(v)   { particleSize  = parseFloat(v); if(window._particlesStop){window._particlesStop();} if(window._particlesStart){window._particlesStart(parseInt(pendingStyle.particleDensity)||30,particleSpeed,particleSize,particleColor||'#00F6D6');} }"
new_color  = "export function updateParticleColor(v)  { particleColor = v;             if(window._particlesStop){window._particlesStop();} if(window._particlesStart){window._particlesStart(parseInt(pendingStyle.particleDensity)||30,particleSpeed,particleSize,particleColor||'#00F6D6');} }"

ok = True
for old, new, label in [(old_speed,new_speed,'speed'),(old_size,new_size,'size'),(old_color,new_color,'color')]:
    if old in src:
        src = src.replace(old, new, 1)
        print(f"OK: {label}")
    else:
        print(f"NOT FOUND: {label}")
        ok = False

if ok:
    f.write_text(src, encoding="utf-8")
    print("written")
else:
    print("NOT written — check anchors")
