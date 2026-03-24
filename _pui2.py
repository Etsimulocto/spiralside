
import pathlib

f = pathlib.Path("index.html")
src = f.read_text(encoding="utf-8").replace("\r\n", "\n")

# Target: the particle-control div inside view-style (the real one with density/speed/size)
OLD = """        <div id="particle-control" style="display:none">
          <div class="scanline-row">
            <span class="scanline-label">density</span>
            <input type="range" min="10" max="120" value="30" style="flex:1;accent-color:var(--teal)"
              oninput="updateParticleDensity(this.value);document.getElementById('pd-val').textContent=this.value" />
            <span class="scanline-val" id="pd-val">30</span>
          </div>
          <div class="scanline-row">
            <span class="scanline-label">speed</span>
            <input type="range" min="1" max="10" value="3" style="flex:1;accent-color:var(--teal)"
              oninput="updateParticleSpeed(this.value);document.getElementById('ps-val').textContent=this.value" />
            <span class="scanline-val" id="ps-val">3</span>
          </div>
          <div class="scanline-row">
            <span class="scanline-label">size</span>
            <input type="range" min="1" max="6" value="2" style="flex:1;accent-color:var(--teal)"
              oninput="updateParticleSize(this.value);document.getElementById('pz-val').textContent=this.value" />
            <span class="scanline-val" id="pz-val">2</span>
          </div>
          <div class="color-row" style="padding:8px 0">
            <span class="color-label">particle color</span>
            <div class="color-swatch"><div class="color-swatch-bg" id="sw-particle" style="background:#00F6D6"></div>
            <input type="color" value="#00F6D6" oninput="updateParticleColor(this.value);document.getElementById('sw-particle').style.background=this.value" /></div>
          </div>
        </div>"""

NEW = """        <div id="particle-control" style="display:none">
          <!-- PRESET CHIPS -->
          <div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0 10px">
            <button id="pchip-glitter" onclick="setParticlePreset('glitter');document.querySelectorAll('[id^=pchip-]').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--teal);border-radius:20px;color:var(--teal);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer">glitter</button>
            <button id="pchip-snow" onclick="setParticlePreset('snow');document.querySelectorAll('[id^=pchip-]').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer">snow</button>
            <button id="pchip-sparks" onclick="setParticlePreset('sparks');document.querySelectorAll('[id^=pchip-]').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer">sparks</button>
            <button id="pchip-confetti" onclick="setParticlePreset('confetti');document.querySelectorAll('[id^=pchip-]').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;opacity:0.55" title="lv 6">confetti ✦6</button>
            <button id="pchip-aurora" onclick="setParticlePreset('aurora');document.querySelectorAll('[id^=pchip-]').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;opacity:0.55" title="lv 8">aurora ✦8</button>
            <button id="pchip-void" onclick="setParticlePreset('void');document.querySelectorAll('[id^=pchip-]').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--teal)'" style="padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--subtext);font-family:var(--font-ui);font-size:var(--subtext-size);cursor:pointer;opacity:0.55" title="lv 10">void ✦10</button>
          </div>
          <!-- PALETTE DOTS -->
          <div style="display:flex;gap:8px;align-items:center;padding-bottom:10px">
            <span style="font-size:var(--subtext-size);color:var(--subtext);min-width:48px">palette</span>
            <div onclick="updateParticleColor('#00F6D6');document.getElementById('sw-particle').style.background='#00F6D6'" style="width:20px;height:20px;border-radius:50%;background:#00F6D6;cursor:pointer;border:2px solid var(--border);flex-shrink:0"></div>
            <div onclick="updateParticleColor('#FF4BCB');document.getElementById('sw-particle').style.background='#FF4BCB'" style="width:20px;height:20px;border-radius:50%;background:#FF4BCB;cursor:pointer;border:2px solid var(--border);flex-shrink:0"></div>
            <div onclick="updateParticleColor('#7B5FFF');document.getElementById('sw-particle').style.background='#7B5FFF'" style="width:20px;height:20px;border-radius:50%;background:#7B5FFF;cursor:pointer;border:2px solid var(--border);flex-shrink:0"></div>
            <div onclick="updateParticleColor('#FFD93D');document.getElementById('sw-particle').style.background='#FFD93D'" style="width:20px;height:20px;border-radius:50%;background:#FFD93D;cursor:pointer;border:2px solid var(--border);flex-shrink:0"></div>
            <div onclick="updateParticleColor('#4DA3FF');document.getElementById('sw-particle').style.background='#4DA3FF'" style="width:20px;height:20px;border-radius:50%;background:#4DA3FF;cursor:pointer;border:2px solid var(--border);flex-shrink:0"></div>
            <div onclick="updateParticleColor('#ffffff');document.getElementById('sw-particle').style.background='#ffffff'" style="width:20px;height:20px;border-radius:50%;background:#fff;cursor:pointer;border:2px solid var(--border);flex-shrink:0"></div>
          </div>
          <!-- SLIDERS -->
          <div class="scanline-row">
            <span class="scanline-label">density</span>
            <input type="range" min="10" max="120" value="30" style="flex:1;accent-color:var(--teal)"
              oninput="updateParticleDensity(this.value);document.getElementById('pd-val').textContent=this.value" />
            <span class="scanline-val" id="pd-val">30</span>
          </div>
          <div class="scanline-row">
            <span class="scanline-label">speed</span>
            <input type="range" min="1" max="10" value="3" style="flex:1;accent-color:var(--teal)"
              oninput="updateParticleSpeed(this.value);document.getElementById('ps-val').textContent=this.value" />
            <span class="scanline-val" id="ps-val">3</span>
          </div>
          <div class="scanline-row">
            <span class="scanline-label">size</span>
            <input type="range" min="1" max="6" value="2" style="flex:1;accent-color:var(--teal)"
              oninput="updateParticleSize(this.value);document.getElementById('pz-val').textContent=this.value" />
            <span class="scanline-val" id="pz-val">2</span>
          </div>
          <div class="color-row" style="padding:8px 0">
            <span class="color-label">particle color</span>
            <div class="color-swatch"><div class="color-swatch-bg" id="sw-particle" style="background:#00F6D6"></div>
            <input type="color" value="#00F6D6" oninput="updateParticleColor(this.value);document.getElementById('sw-particle').style.background=this.value" /></div>
          </div>
        </div>"""

if OLD in src:
    src = src.replace(OLD, NEW, 1)
    f.write_text(src, encoding="utf-8")
    print("OK: particle UI upgraded in index.html")
else:
    idx = src.find('id="particle-control"')
    print("NOT FOUND — checking occurrences:")
    pos = 0
    count = 0
    while True:
        idx = src.find('id="particle-control"', pos)
        if idx < 0: break
        count += 1
        print(f"  #{count} at {idx}:", repr(src[idx:idx+80]))
        pos = idx + 1
    print(f"Total: {count}")
