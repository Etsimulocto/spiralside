
import pathlib

f = pathlib.Path("js/app/style.js")
src = f.read_text(encoding="utf-8").replace("\r\n", "\n")

# Find the particle-control div — add preset + palette rows before density
OLD = """        <div id="particle-control" style="display:none">
          <div class="scanline-row">
            <span class="scanline-label">density</span>"""

NEW = """        <div id="particle-control" style="display:none">
          <div class="scanline-row" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">
            <span class="scanline-label">preset</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1">
              <button onclick="setParticlePreset('glitter');this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--teal);border-radius:20px;color:var(--teal);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer">glitter</button>
              <button onclick="setParticlePreset('snow');this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer">snow</button>
              <button onclick="setParticlePreset('sparks');this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer">sparks</button>
              <button onclick="setParticlePreset('confetti');this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;opacity:0.5" title="lv 6">confetti ✦6</button>
              <button onclick="setParticlePreset('aurora');this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;opacity:0.5" title="lv 8">aurora ✦8</button>
              <button onclick="setParticlePreset('void');this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;opacity:0.5" title="lv 10">void ✦10</button>
            </div>
          </div>
          <div class="scanline-row" style="margin-bottom:4px">
            <span class="scanline-label">palette</span>
            <div style="display:flex;gap:8px;align-items:center;flex:1">
              <div onclick="updateParticleColor('#00F6D6');document.getElementById('sw-particle').style.background='#00F6D6'" style="width:22px;height:22px;border-radius:50%;background:#00F6D6;cursor:pointer;border:2px solid var(--border)"></div>
              <div onclick="updateParticleColor('#FF4BCB');document.getElementById('sw-particle').style.background='#FF4BCB'" style="width:22px;height:22px;border-radius:50%;background:#FF4BCB;cursor:pointer;border:2px solid var(--border)"></div>
              <div onclick="updateParticleColor('#7B5FFF');document.getElementById('sw-particle').style.background='#7B5FFF'" style="width:22px;height:22px;border-radius:50%;background:#7B5FFF;cursor:pointer;border:2px solid var(--border)"></div>
              <div onclick="updateParticleColor('#FFD93D');document.getElementById('sw-particle').style.background='#FFD93D'" style="width:22px;height:22px;border-radius:50%;background:#FFD93D;cursor:pointer;border:2px solid var(--border)"></div>
              <div onclick="updateParticleColor('#4DA3FF');document.getElementById('sw-particle').style.background='#4DA3FF'" style="width:22px;height:22px;border-radius:50%;background:#4DA3FF;cursor:pointer;border:2px solid var(--border)"></div>
              <div onclick="updateParticleColor('#ffffff');document.getElementById('sw-particle').style.background='#ffffff'" style="width:22px;height:22px;border-radius:50%;background:#ffffff;cursor:pointer;border:2px solid var(--border)"></div>
            </div>
          </div>
          <div class="scanline-row">
            <span class="scanline-label">density</span>"""

if OLD in src:
    src = src.replace(OLD, NEW, 1)
    f.write_text(src, encoding="utf-8")
    print("OK: particle UI upgraded")
else:
    idx = src.find('id="particle-control"')
    print("NOT FOUND — anchor check:")
    print(repr(src[idx:idx+120]) if idx >= 0 else "particle-control not found")
