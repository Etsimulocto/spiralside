
import pathlib

f = pathlib.Path("js/app/style.js")
src = f.read_text(encoding="utf-8").replace("\r\n", "\n")

# Check anchor exists
if "function startParticles()" not in src:
    print("ERROR: startParticles not found in style.js")
    exit(1)

# Replace startParticles to delegate to new engine globals
OLD = """function startParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const count = parseInt(pendingStyle.particleDensity) || 30;
  const spd   = (particleSpeed || 3) * 0.1;
  const sz    = particleSize  || 2;
  const col   = particleColor || pendingStyle.teal || '#00F6D6';
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * sz + 0.4,
    vx: (Math.random() - 0.5) * spd, vy: -Math.random() * spd - spd * 0.3,
    life: Math.random(),
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.003;
      if (p.life <= 0 || p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + 5; p.life = 0.6 + Math.random() * 0.4; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col + Math.floor(p.life * 180).toString(16).padStart(2, '0');
      ctx.fill();
    });
    particleAnim = requestAnimationFrame(draw);
  }
  if (particleAnim) cancelAnimationFrame(particleAnim);
  draw();
}

function stopParticles() {
  if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
}"""

NEW = """function startParticles() {
  if (window._particlesStart) {
    window._particlesStart(parseInt(pendingStyle.particleDensity)||30, particleSpeed||3, particleSize||2, particleColor||pendingStyle.teal||'#00F6D6');
    return;
  }
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const count = parseInt(pendingStyle.particleDensity) || 30;
  const spd   = (particleSpeed || 3) * 0.1;
  const sz    = particleSize  || 2;
  const col   = particleColor || pendingStyle.teal || '#00F6D6';
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * sz + 0.4,
    vx: (Math.random() - 0.5) * spd, vy: -Math.random() * spd - spd * 0.3,
    life: Math.random(),
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.003;
      if (p.life <= 0 || p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + 5; p.life = 0.6 + Math.random() * 0.4; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col + Math.floor(p.life * 180).toString(16).padStart(2, '0');
      ctx.fill();
    });
    particleAnim = requestAnimationFrame(draw);
  }
  if (particleAnim) cancelAnimationFrame(particleAnim);
  draw();
}

function stopParticles() {
  if (window._particlesStop) { window._particlesStop(); return; }
  if (particleAnim) { cancelAnimationFrame(particleAnim); particleAnim = null; }
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
}"""

if OLD in src:
    src = src.replace(OLD, NEW, 1)
    f.write_text(src, encoding="utf-8")
    print("OK: startParticles/stopParticles patched to delegate to new engine")
else:
    print("NOT FOUND — anchor mismatch, checking...")
    idx = src.find("function startParticles()")
    if idx >= 0:
        print(repr(src[idx:idx+200]))
    else:
        print("startParticles not in file at all")
