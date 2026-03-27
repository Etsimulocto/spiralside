# ============================================================
# SPIRALSIDE -- SPIRAL TAB PATCH v2
# Run from ~/spiralside:
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe patch_spiral.py
# Nimbis anchor: patch_spiral.py
# ============================================================

import os, sys, re, subprocess

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  wrote ' + path)

# ── STEP 1: write spiral.js ──────────────────────────────────
print('[1] Writing js/app/views/spiral.js...')
os.makedirs('js/app/views', exist_ok=True)

SPIRAL_JS = open('/dev/stdin').read() if False else None

# Write spiral.js directly
spiral_path = 'js/app/views/spiral.js'
with open(spiral_path, 'w', encoding='utf-8') as f:
    f.write(
        "// Nimbis anchor: js/app/views/spiral.js\n"
        "export const SpiralView = (() => {\n"
        "  const PRESETS = {\n"
        "    sky:      { type:'log',    color:'#00F6D6', speed:0.6,  density:180, dir:1,  particles:true,  decay:false },\n"
        "    cold:     { type:'archi',  color:'#4DA3FF', speed:0.3,  density:220, dir:-1, particles:false, decay:false },\n"
        "    monday:   { type:'fib',    color:'#FF4BCB', speed:1.1,  density:140, dir:1,  particles:true,  decay:true  },\n"
        "    grit:     { type:'galaxy', color:'#FFD93D', speed:0.5,  density:160, dir:1,  particles:true,  decay:false },\n"
        "    architect:{ type:'archi',  color:'#F3F7FF', speed:0.25, density:260, dir:-1, particles:false, decay:false },\n"
        "    custom:   { type:'log',    color:'#7c6af7', speed:0.6,  density:180, dir:1,  particles:true,  decay:false },\n"
        "  };\n"
        "  let canvas, ctx, animId, particles=[], angle=0;\n"
        "  let idleTimer=null, ssActive=false, ssOverlay=null;\n"
        "  const cfg={ type:'log',color:'#00F6D6',speed:0.6,density:180,dir:1,particles:true,decay:false,idleMins:5,activePreset:'sky' };\n"
        "\n"
        "  function archimedean(cx,cy,maxR,turns,theta){\n"
        "    const pts=[],steps=Math.round(cfg.density*turns),b=maxR/(turns*Math.PI*2);\n"
        "    for(let i=0;i<=steps;i++){const t=(i/steps)*turns*Math.PI*2,a=t*cfg.dir+theta;pts.push([cx+b*t*Math.cos(a),cy+b*t*Math.sin(a)]);}\n"
        "    return pts;\n"
        "  }\n"
        "  function logarithmic(cx,cy,maxR,turns,theta){\n"
        "    const pts=[],steps=Math.round(cfg.density*turns),b=Math.log(maxR)/(turns*Math.PI*2);\n"
        "    for(let i=0;i<=steps;i++){const t=(i/steps)*turns*Math.PI*2,a=t*cfg.dir+theta;pts.push([cx+Math.exp(b*t)*Math.cos(a),cy+Math.exp(b*t)*Math.sin(a)]);}\n"
        "    return pts;\n"
        "  }\n"
        "  function fibonacci(cx,cy,maxR,theta){\n"
        "    const pts=[],n=cfg.density*3,g=Math.PI*(3-Math.sqrt(5));\n"
        "    for(let i=0;i<n;i++){const r=maxR*Math.sqrt(i/n),a=i*g*cfg.dir+theta;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}\n"
        "    return pts;\n"
        "  }\n"
        "  function galaxy(cx,cy,maxR,turns,theta){\n"
        "    const pts=[],arms=3,steps=Math.round(cfg.density*turns),b=Math.log(maxR)/(turns*Math.PI*2);\n"
        "    for(let arm=0;arm<arms;arm++){const off=(arm/arms)*Math.PI*2;\n"
        "      for(let i=0;i<=steps;i++){const t=(i/steps)*turns*Math.PI*2,drift=0.18*Math.sin(t*1.4),a=(t+drift)*cfg.dir+theta+off;pts.push([cx+Math.exp(b*t)*Math.cos(a),cy+Math.exp(b*t)*Math.sin(a)]);}\n"
        "    } return pts;\n"
        "  }\n"
        "  function hexAlpha(hex,alpha){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return 'rgba('+r+','+g+','+b+','+alpha+')';}\n"
        "\n"
        "  function draw(){\n"
        "    const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,maxR=Math.min(W,H)*0.44;\n"
        "    if(cfg.decay){ctx.fillStyle='rgba(10,10,15,0.12)';ctx.fillRect(0,0,W,H);}else{ctx.clearRect(0,0,W,H);}\n"
        "    let pts;\n"
        "    if(cfg.type==='archi') pts=archimedean(cx,cy,maxR,5,angle);\n"
        "    else if(cfg.type==='fib') pts=fibonacci(cx,cy,maxR,angle);\n"
        "    else if(cfg.type==='galaxy') pts=galaxy(cx,cy,maxR,4,angle);\n"
        "    else pts=logarithmic(cx,cy,maxR,5,angle);\n"
        "    if(cfg.type==='fib'){\n"
        "      pts.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fillStyle=hexAlpha(cfg.color,0.3+(i/pts.length)*0.7);ctx.fill();});\n"
        "    }else{\n"
        "      for(let i=1;i<pts.length;i++){ctx.beginPath();ctx.moveTo(pts[i-1][0],pts[i-1][1]);ctx.lineTo(pts[i][0],pts[i][1]);ctx.strokeStyle=hexAlpha(cfg.color,0.12+(i/pts.length)*0.88);ctx.lineWidth=0.9+(i/pts.length)*0.6;ctx.stroke();}\n"
        "    }\n"
        "    if(cfg.particles&&pts.length>10){particles.forEach(p=>{const idx=Math.floor(p.pos*(pts.length-1));const[px,py]=pts[idx];ctx.beginPath();ctx.arc(px+p.ox,py+p.oy,p.r,0,Math.PI*2);ctx.fillStyle=hexAlpha(cfg.color,p.alpha);ctx.fill();p.pos=(p.pos+p.spd)%1;p.ox+=(Math.random()-0.5)*0.3;p.ox*=0.92;p.oy+=(Math.random()-0.5)*0.3;p.oy*=0.92;});}\n"
        "    angle+=0.004*cfg.speed*cfg.dir;\n"
        "  }\n"
        "  function initParticles(){particles=Array.from({length:28},(_,i)=>({pos:i/28,spd:0.0008+Math.random()*0.0012,r:1.2+Math.random()*2.2,alpha:0.4+Math.random()*0.55,ox:0,oy:0}));}\n"
        "  function loop(){draw();animId=requestAnimationFrame(loop);}\n"
        "  function stopLoop(){if(animId){cancelAnimationFrame(animId);animId=null;}}\n"
        "  function resize(){if(!canvas)return;const rect=canvas.parentElement.getBoundingClientRect();canvas.width=rect.width||340;canvas.height=rect.height||340;}\n"
        "\n"
        "  function resetIdleTimer(){clearTimeout(idleTimer);if(ssActive)exitScreensaver();if(cfg.idleMins>0)idleTimer=setTimeout(enterScreensaver,cfg.idleMins*60*1000);}\n"
        "  function enterScreensaver(){\n"
        "    if(ssActive)return; ssActive=true;\n"
        "    ssOverlay=document.createElement('div'); ssOverlay.id='spiral-ss';\n"
        "    ssOverlay.style.cssText='position:fixed;inset:0;z-index:8888;background:#0a0a0f;cursor:none;';\n"
        "    const sc=document.createElement('canvas'); sc.style.cssText='position:absolute;inset:0;width:100%;height:100%;';\n"
        "    ssOverlay.appendChild(sc);\n"
        "    const mk=document.createElement('div'); mk.textContent='spiralside';\n"
        "    mk.style.cssText='position:absolute;bottom:40px;left:50%;transform:translateX(-50%);font-family:Syne,sans-serif;font-size:0.75rem;letter-spacing:0.25em;color:rgba(243,247,255,0.08);pointer-events:none;';\n"
        "    ssOverlay.appendChild(mk); document.body.appendChild(ssOverlay);\n"
        "    ['click','touchstart','keydown','mousemove'].forEach(ev=>ssOverlay.addEventListener(ev,exitScreensaver,{once:true}));\n"
        "    ssOverlay._prev=canvas; canvas=sc; ctx=sc.getContext('2d'); sc.width=window.innerWidth; sc.height=window.innerHeight;\n"
        "  }\n"
        "  function exitScreensaver(){if(!ssActive||!ssOverlay)return;ssActive=false;if(ssOverlay._prev){canvas=ssOverlay._prev;ctx=canvas.getContext('2d');}ssOverlay.remove();ssOverlay=null;resetIdleTimer();}\n"
        "  function savePNG(){canvas.toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='spiral-'+cfg.activePreset+'-'+Date.now()+'.png';a.click();});}\n"
        "  function q(s){return document.querySelector(s);}\n"
        "\n"
        "  function applyPreset(name){\n"
        "    const p=PRESETS[name]||PRESETS.custom; Object.assign(cfg,p); cfg.activePreset=name;\n"
        "    initParticles(); syncControls();\n"
        "    document.querySelectorAll('.sp-preset').forEach(c=>c.classList.toggle('active',c.dataset.preset===name));\n"
        "  }\n"
        "  function syncControls(){\n"
        "    const t=q('#sp-type');if(t)t.value=cfg.type;\n"
        "    const c=q('#sp-color');if(c)c.value=cfg.color;\n"
        "    const sw=q('#sp-color-swatch');if(sw)sw.style.background=cfg.color;\n"
        "    const sp=q('#sp-speed');if(sp)sp.value=cfg.speed*10;\n"
        "    const sv=q('#sp-speed-val');if(sv)sv.textContent=cfg.speed.toFixed(1)+'x';\n"
        "    const dn=q('#sp-density');if(dn)dn.value=cfg.density;\n"
        "    const dv=q('#sp-density-val');if(dv)dv.textContent=cfg.density;\n"
        "    const dr=q('#sp-dir');if(dr)dr.textContent=cfg.dir===1?'CW':'CCW';\n"
        "    const pt=q('#sp-particles');if(pt)pt.classList.toggle('on',cfg.particles);\n"
        "    const dc=q('#sp-decay');if(dc)dc.classList.toggle('on',cfg.decay);\n"
        "  }\n"
        "\n"
        "  function injectStyles(){\n"
        "    if(document.getElementById('spiral-styles'))return;\n"
        "    const s=document.createElement('style'); s.id='spiral-styles';\n"
        "    s.textContent=[\n"
        "      '#spiral-root{display:flex;flex-direction:column;height:100%;background:var(--bg,#0a0a0f);overflow:hidden;}',\n"
        "      '#sp-presets{display:flex;gap:6px;padding:12px 16px 8px;overflow-x:auto;flex-shrink:0;scrollbar-width:none;}',\n"
        "      '#sp-presets::-webkit-scrollbar{display:none;}',\n"
        "      '.sp-preset{padding:5px 14px;border-radius:20px;border:1px solid var(--border,#1e1e2e);background:var(--surface,#111118);color:var(--subtext,#7070a0);font-family:var(--font-ui,monospace);font-size:0.65rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:all 0.2s;flex-shrink:0;}',\n"
        "      '.sp-preset:hover{border-color:#6af7c8;color:var(--text,#e8e8f0);}',\n"
        "      '.sp-preset.active{border-color:#6af7c8;color:#6af7c8;background:rgba(106,247,200,0.08);}',\n"
        "      '#sp-canvas-wrap{flex:1;min-height:0;position:relative;background:radial-gradient(ellipse at 50% 50%,rgba(106,247,200,0.03) 0%,transparent 70%);}',\n"
        "      '#sp-canvas{width:100%;height:100%;display:block;}',\n"
        "      '#sp-controls{flex-shrink:0;padding:12px 16px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border,#1e1e2e);background:var(--surface,#111118);display:flex;flex-direction:column;gap:8px;}',\n"
        "      '.sp-row{display:flex;align-items:center;gap:10px;}',\n"
        "      '.sp-label{font-size:0.62rem;letter-spacing:0.1em;color:var(--subtext,#7070a0);text-transform:uppercase;width:72px;flex-shrink:0;}',\n"
        "      '.sp-select{flex:1;background:var(--bg,#0a0a0f);border:1px solid var(--border,#1e1e2e);border-radius:8px;padding:6px 10px;color:var(--text,#e8e8f0);font-family:var(--font-ui,monospace);font-size:0.72rem;outline:none;cursor:pointer;}',\n"
        "      '.sp-select:focus{border-color:#6af7c8;}',\n"
        "      '.sp-range{flex:1;accent-color:#6af7c8;height:3px;cursor:pointer;}',\n"
        "      '.sp-val{font-size:0.65rem;color:#6af7c8;width:38px;text-align:right;flex-shrink:0;font-family:var(--font-ui,monospace);}',\n"
        "      '.sp-swatch{width:36px;height:28px;border-radius:8px;border:1px solid var(--border,#1e1e2e);cursor:pointer;overflow:hidden;position:relative;}',\n"
        "      '.sp-swatch input[type=color]{position:absolute;inset:-4px;width:calc(100% + 8px);height:calc(100% + 8px);border:none;cursor:pointer;opacity:0;}',\n"
        "      '.sp-toggle{width:36px;height:20px;background:var(--muted,#2a2a3e);border-radius:10px;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}',\n"
        "      '.sp-toggle.on{background:#6af7c8;}',\n"
        "      \".sp-toggle::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform 0.2s;}\",\n"
        "      '.sp-toggle.on::after{transform:translateX(16px);}',\n"
        "      '.sp-toggle-btn{flex:1;padding:6px 12px;background:var(--bg,#0a0a0f);border:1px solid var(--border,#1e1e2e);border-radius:8px;color:var(--text,#e8e8f0);font-family:var(--font-ui,monospace);font-size:0.72rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s;}',\n"
        "      '.sp-toggle-btn:hover{border-color:#6af7c8;}',\n"
        "      '.sp-actions{display:flex;gap:8px;margin-top:4px;}',\n"
        "      '.sp-action-btn{flex:1;padding:9px;background:var(--bg,#0a0a0f);border:1px solid var(--border,#1e1e2e);border-radius:10px;color:var(--subtext,#7070a0);font-family:var(--font-ui,monospace);font-size:0.65rem;letter-spacing:0.06em;cursor:pointer;transition:all 0.2s;}',\n"
        "      '.sp-action-btn:hover{border-color:#6af7c8;color:#6af7c8;}',\n"
        "    ].join('');\n"
        "    document.head.appendChild(s);\n"
        "  }\n"
        "\n"
        "  function buildDOM(container){\n"
        "    container.innerHTML=\n"
        "      '<div id=\"spiral-root\">'\n"
        "      +'<div id=\"sp-presets\">'\n"
        "      +'<button class=\"sp-preset active\" data-preset=\"sky\">sky</button>'\n"
        "      +'<button class=\"sp-preset\" data-preset=\"cold\">cold</button>'\n"
        "      +'<button class=\"sp-preset\" data-preset=\"monday\">monday</button>'\n"
        "      +'<button class=\"sp-preset\" data-preset=\"grit\">grit</button>'\n"
        "      +'<button class=\"sp-preset\" data-preset=\"architect\">architect</button>'\n"
        "      +'<button class=\"sp-preset\" data-preset=\"custom\">custom</button>'\n"
        "      +'</div>'\n"
        "      +'<div id=\"sp-canvas-wrap\"><canvas id=\"sp-canvas\"></canvas></div>'\n"
        "      +'<div id=\"sp-controls\">'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">type</label>'\n"
        "      +'<select id=\"sp-type\" class=\"sp-select\">'\n"
        "      +'<option value=\"log\">logarithmic</option>'\n"
        "      +'<option value=\"archi\">archimedean</option>'\n"
        "      +'<option value=\"fib\">fibonacci</option>'\n"
        "      +'<option value=\"galaxy\">galaxy</option>'\n"
        "      +'</select></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">color</label>'\n"
        "      +'<div id=\"sp-color-swatch\" class=\"sp-swatch\" style=\"background:#00F6D6\">'\n"
        "      +'<input type=\"color\" id=\"sp-color\" value=\"#00F6D6\"/></div></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">speed</label>'\n"
        "      +'<input type=\"range\" id=\"sp-speed\" min=\"1\" max=\"20\" value=\"6\" class=\"sp-range\"/>'\n"
        "      +'<span id=\"sp-speed-val\" class=\"sp-val\">0.6x</span></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">density</label>'\n"
        "      +'<input type=\"range\" id=\"sp-density\" min=\"60\" max=\"400\" value=\"180\" class=\"sp-range\"/>'\n"
        "      +'<span id=\"sp-density-val\" class=\"sp-val\">180</span></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">direction</label>'\n"
        "      +'<button id=\"sp-dir\" class=\"sp-toggle-btn\">CW</button></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">particles</label>'\n"
        "      +'<div id=\"sp-particles\" class=\"sp-toggle on\"></div></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">decay</label>'\n"
        "      +'<div id=\"sp-decay\" class=\"sp-toggle\"></div></div>'\n"
        "      +'<div class=\"sp-row\"><label class=\"sp-label\">screensaver</label>'\n"
        "      +'<select id=\"sp-idle\" class=\"sp-select\">'\n"
        "      +'<option value=\"2\">after 2 min</option>'\n"
        "      +'<option value=\"5\" selected>after 5 min</option>'\n"
        "      +'<option value=\"10\">after 10 min</option>'\n"
        "      +'<option value=\"0\">off</option>'\n"
        "      +'</select></div>'\n"
        "      +'<div class=\"sp-actions\">'\n"
        "      +'<button id=\"sp-save-png\" class=\"sp-action-btn\">save PNG</button>'\n"
        "      +'<button id=\"sp-screensaver-now\" class=\"sp-action-btn\">screensaver now</button>'\n"
        "      +'</div></div></div>';\n"
        "    injectStyles();\n"
        "    canvas=document.getElementById('sp-canvas'); ctx=canvas.getContext('2d'); resize();\n"
        "    document.querySelectorAll('.sp-preset').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));\n"
        "    q('#sp-type').addEventListener('change',e=>{cfg.type=e.target.value;cfg.activePreset='custom';document.querySelectorAll('.sp-preset').forEach(c=>c.classList.remove('active'));});\n"
        "    q('#sp-color').addEventListener('input',e=>{cfg.color=e.target.value;q('#sp-color-swatch').style.background=e.target.value;});\n"
        "    q('#sp-speed').addEventListener('input',e=>{cfg.speed=e.target.value/10;q('#sp-speed-val').textContent=cfg.speed.toFixed(1)+'x';});\n"
        "    q('#sp-density').addEventListener('input',e=>{cfg.density=parseInt(e.target.value);q('#sp-density-val').textContent=cfg.density;});\n"
        "    q('#sp-dir').addEventListener('click',()=>{cfg.dir*=-1;q('#sp-dir').textContent=cfg.dir===1?'CW':'CCW';});\n"
        "    q('#sp-particles').addEventListener('click',()=>{cfg.particles=!cfg.particles;q('#sp-particles').classList.toggle('on',cfg.particles);if(cfg.particles)initParticles();});\n"
        "    q('#sp-decay').addEventListener('click',()=>{cfg.decay=!cfg.decay;q('#sp-decay').classList.toggle('on',cfg.decay);});\n"
        "    q('#sp-idle').addEventListener('change',e=>{cfg.idleMins=parseInt(e.target.value);resetIdleTimer();});\n"
        "    q('#sp-save-png').addEventListener('click',savePNG);\n"
        "    q('#sp-screensaver-now').addEventListener('click',enterScreensaver);\n"
        "    window.addEventListener('resize',resize);\n"
        "  }\n"
        "\n"
        "  function mount(container){\n"
        "    if(!container)return;\n"
        "    buildDOM(container); initParticles(); applyPreset('sky'); stopLoop(); loop();\n"
        "    ['mousemove','touchstart','keydown','click'].forEach(ev=>document.addEventListener(ev,resetIdleTimer,{passive:true}));\n"
        "    resetIdleTimer();\n"
        "  }\n"
        "  function unmount(){stopLoop();clearTimeout(idleTimer);if(ssActive)exitScreensaver();}\n"
        "\n"
        "  return { mount, unmount, applyPreset, savePNG };\n"
        "})();\n"
    )
print('  wrote js/app/views/spiral.js')

# ── STEP 2: patch index.html ─────────────────────────────────
print('\n[2] Patching index.html...')
with open('index.html','r',encoding='utf-8') as f: HTML=f.read()

TAB_BTN = '\n        <button id="tab-spiral" class="tab-btn" onclick="switchTab(\'spiral\')">spiral</button>'
if 'tab-spiral' in HTML:
    print('  tab button already present, skipping')
else:
    for anchor in ['id="tab-cannonized"','id="tab-account"','id="tab-settings"']:
        if anchor in HTML:
            idx=HTML.index(anchor); close=HTML.index('</button>',idx)+len('</button>')
            HTML=HTML[:close]+TAB_BTN+HTML[close:]
            print('  tab button inserted after '+anchor); break
    else:
        print('  WARNING: no tab anchor found -- add manually')

VIEW_DIV='\n      <!-- SPIRAL VIEW -->\n      <div id="view-spiral" class="view-panel"></div>'
if 'view-spiral' in HTML:
    print('  view div already present, skipping')
else:
    for anchor in ['id="view-cannonized"','id="view-quest"','id="view-account"']:
        if anchor in HTML:
            idx=HTML.rindex(anchor); close=HTML.index('</div>',idx)+len('</div>')
            HTML=HTML[:close]+VIEW_DIV+HTML[close:]
            print('  view div inserted after '+anchor); break
    else:
        print('  WARNING: no view anchor found -- add manually')

with open('index.html','w',encoding='utf-8') as f: f.write(HTML)
print('  wrote index.html')

# ── STEP 3: patch ui.js ──────────────────────────────────────
print('\n[3] Patching js/app/ui.js...')
UI_PATH='js/app/ui.js'
if not os.path.exists(UI_PATH):
    print('  NOT FOUND -- add manually:')
    print("    'spiral': () => window.SpiralView?.mount(document.getElementById('view-spiral')),")
else:
    with open(UI_PATH,'r',encoding='utf-8') as f: ui=f.read()
    if 'spiral' in ui:
        print('  already patched, skipping')
    else:
        ENTRY="\n  'spiral':     () => window.SpiralView?.mount(document.getElementById('view-spiral')),"
        for anchor in ["'cannonized'",'"cannonized"',"'quest'",'"quest"',"'account'",'"account"']:
            if anchor in ui:
                idx=ui.rindex(anchor); end=ui.index('\n',idx)
                ui=ui[:end]+ENTRY+ui[end:]
                with open(UI_PATH,'w',encoding='utf-8') as f: f.write(ui)
                print('  viewInits entry added after '+anchor); break
        else:
            print('  WARNING: no anchor found -- add manually')

# ── STEP 4: patch main.js ────────────────────────────────────
print('\n[4] Patching js/app/main.js...')
MAIN_PATH='js/app/main.js'
if not os.path.exists(MAIN_PATH):
    print('  NOT FOUND -- add manually:')
    print("    import { SpiralView } from './views/spiral.js';")
    print("    window.SpiralView = SpiralView;")
else:
    with open(MAIN_PATH,'r',encoding='utf-8') as f: main=f.read()
    if 'SpiralView' in main:
        print('  already patched, skipping')
    else:
        import re
        import_matches=list(re.finditer(r'^import ',main,re.MULTILINE))
        IMPORT="\nimport { SpiralView }   from './views/spiral.js';"
        GLOBAL="\nwindow.SpiralView = SpiralView;"
        if import_matches:
            last_end=main.index('\n',import_matches[-1].start())
            main=main[:last_end]+IMPORT+main[last_end:]
        win_matches=list(re.finditer(r'^window\.',main,re.MULTILINE))
        if win_matches:
            last_w_end=main.index('\n',win_matches[-1].start())
            main=main[:last_w_end]+GLOBAL+main[last_w_end:]
        else:
            main+=GLOBAL
        with open(MAIN_PATH,'w',encoding='utf-8') as f: f.write(main)
        print('  import + window.SpiralView added')

# ── STEP 5: commit + push ────────────────────────────────────
print('\n[5] Committing and pushing...')
def run(cmd):
    r=subprocess.run(cmd,shell=True,capture_output=True,text=True)
    if r.stdout.strip(): print('  '+r.stdout.strip())
    if r.stderr.strip(): print('  '+r.stderr.strip())
    return r.returncode

run('git add js/app/views/spiral.js index.html js/app/ui.js js/app/main.js')
run('git commit -m "feat: spiral tab -- canvas generator + screensaver + character presets"')
code=run('git push --force')
print('\nDone! Vercel deploys in ~30s' if code==0 else '\nPush may have failed -- check above')
