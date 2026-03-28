import os

ROOT = os.path.expanduser("~/spiralside")
path = os.path.join(ROOT, "js/app/views/bloomengine.js")

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# --- 1: add reset button to bar HTML ---
old_bar = "'<button id=\"be-bloom-btn\">WHITE BLOOM</button></div></div>';"
new_bar = "'<button id=\"be-reset-btn\">RESET</button><button id=\"be-bloom-btn\">WHITE BLOOM</button></div></div>';"

# --- 2: add reset button CSS ---
old_css = "    '#be-bloom-btn:hover{background:#FF4BCB22;}',\n    '#view-bloomengine.active"
new_css = "    '#be-bloom-btn:hover{background:#FF4BCB22;}',\n    '#be-reset-btn{background:transparent;border:1px solid #4DA3FF44;color:#4DA3FF;font-family:var(--font-ui,monospace);font-size:8px;letter-spacing:.1em;padding:3px 8px;cursor:pointer;border-radius:2px;margin-right:4px;}',\n    '#be-reset-btn:hover{background:#4DA3FF22;}',\n    '#view-bloomengine.active"

# --- 3: add reset defaults object and wire button in _beWire ---
old_wire = "  document.getElementById('be-bloom-btn').addEventListener('click',()=>{st.bloomPhase=1.0;});"
new_wire = """  const BE_DEFAULTS = {spawn:30,life:140,radius:0,maxpop:600,cdrift:40,size:2,entropy:50,radial:15,vortex:0,speed:3,damp:99,bounce:50,sine:40,sinamp:40,cos:0,phase:0,harm:1,tangle:0,branch:0,bangle:45,self:0,fscale:50,bloom:10,recbloom:0,lorenz:0,lsigma:10,julia:0,jcx:-70,bifurc:0,strange:0,spectral:0,heat:0,ghost:20,cpulse:0,palette:0,invert:0,polar:0,arms:0,radsym:1,odecay:0,adrift:0,petal:0,windx:0,windy:0,pulse:0,gravity:0,tunnel:0,repulse:0};
  document.getElementById('be-reset-btn').addEventListener('click',()=>{
    Object.entries(BE_DEFAULTS).forEach(([k,v])=>{
      const el=document.getElementById('be-'+k);
      const vEl=document.getElementById('bv-'+k);
      if(el){el.value=v;}
      if(vEl){vEl.textContent=v;}
    });
    st.wells=[];st.bloomPhase=0;st.particles=[_beSpawn(null,null,4,0)];
    const wEl=document.getElementById('be-st-wells');if(wEl)wEl.textContent=0;
  });
  document.getElementById('be-bloom-btn').addEventListener('click',()=>{st.bloomPhase=1.0;});"""

if "be-reset-btn" in src:
    print("already patched")
else:
    c1 = src.count(old_bar)
    c2 = src.count(old_css)
    c3 = src.count(old_wire)
    print(f"bar:{c1} css:{c2} wire:{c3}")
    assert c1 == 1, "bar anchor not found"
    assert c2 == 1, "css anchor not found"
    assert c3 == 1, "wire anchor not found"
    src = src.replace(old_bar, new_bar)
    src = src.replace(old_css, new_css)
    src = src.replace(old_wire, new_wire)
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)
    print("OK patched bloomengine.js — reset button added")
