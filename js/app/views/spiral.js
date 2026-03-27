
// Nimbis anchor: js/app/views/spiral.js
// SPIRALSIDE -- SPIRAL VIEW v1.0
// Gold-unlock generative spiral art tab
// Pattern: injectCSS + renderHTML + wire events, flex:1 min-height:0 inner wrapper
// window.initSpiralView = initSpiral (registered in main.js alongside other globals)

const _SpiralState = {
  canvas: null, ctx: null, animId: null,
  ptcls: [], angle: 0, frozen: false, rainbowHue: 0,
  owned: new Set(['dual']),
  active: new Set(),
  gold: 0,
  cfg: { type:'log', color:'#00F6D6', speed:0.6, density:180, dir:1, particles:true, decay:false },
};

const SPIRAL_PRESETS = {
  sky:      { type:'log',    color:'#00F6D6', speed:0.6,  density:180, dir:1,  particles:true,  decay:false },
  cold:     { type:'archi',  color:'#4DA3FF', speed:0.3,  density:220, dir:-1, particles:false, decay:false },
  monday:   { type:'fib',    color:'#FF4BCB', speed:1.1,  density:140, dir:1,  particles:true,  decay:true  },
  grit:     { type:'galaxy', color:'#FFD93D', speed:0.5,  density:160, dir:1,  particles:true,  decay:false },
  architect:{ type:'archi',  color:'#F3F7FF', speed:0.25, density:260, dir:-1, particles:false, decay:false },
  custom:   { type:'log',    color:'#7c6af7', speed:0.6,  density:180, dir:1,  particles:true,  decay:false },
};

const SPIRAL_UNLOCKS = [
  { id:'dual',    label:'dual spiral', cost:0   },
  { id:'pulse',   label:'pulse',       cost:50  },
  { id:'trails',  label:'long trails', cost:75  },
  { id:'rainbow', label:'rainbow',     cost:100 },
  { id:'mirror',  label:'mirror',      cost:120 },
  { id:'web',     label:'web lines',   cost:150 },
  { id:'arms',    label:'extra arms',  cost:200 },
  { id:'shatter', label:'shatter',     cost:200 },
  { id:'setbg',   label:'set as bg',   cost:250 },
];

function _spiralInjectCSS() {
  if (document.getElementById('spiral-css')) return;
  const s = document.createElement('style');
  s.id = 'spiral-css';
  s.textContent = [
    '#sp-inner{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;}',
    '#sp-topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;flex-shrink:0;border-bottom:1px solid var(--border,#1e1e2e);}',
    '#sp-gold{display:flex;align-items:center;gap:5px;font-size:0.65rem;letter-spacing:0.08em;color:#FFD93D;}',
    '#sp-goldnum{font-weight:700;font-size:0.9rem;}',
    '#sp-presets{display:flex;gap:5px;padding:8px 14px 5px;overflow-x:auto;flex-shrink:0;scrollbar-width:none;}',
    '#sp-presets::-webkit-scrollbar{display:none;}',
    '.sp-preset{padding:4px 12px;border-radius:20px;border:1px solid var(--border,#1e1e2e);background:transparent;color:var(--subtext,#7070a0);font-family:var(--font-ui,monospace);font-size:0.6rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:all 0.15s;}',
    '.sp-preset:hover,.sp-preset.active{border-color:#00F6D6;color:#00F6D6;background:rgba(0,246,214,0.08);}',
    '#sp-canvas-wrap{flex:1;min-height:0;overflow:hidden;background:#0a0a0f;position:relative;}',
    '#sp-canvas{display:block;width:100%;height:100%;}',
    '#sp-ctrl{flex-shrink:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border,#1e1e2e);background:var(--surface,#111118);overflow-y:auto;max-height:45vh;}',
    '.sp-section{font-size:0.55rem;letter-spacing:0.14em;color:var(--subtext,#7070a0);text-transform:uppercase;padding:6px 0 4px;border-bottom:1px solid var(--border,#1e1e2e);margin-bottom:6px;}',
    '.sp-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}',
    '.sp-lbl{font-size:0.58rem;letter-spacing:0.08em;color:var(--subtext,#7070a0);text-transform:uppercase;width:60px;flex-shrink:0;}',
    '.sp-row select,.sp-rng{flex:1;background:var(--bg,#0a0a0f);border:1px solid var(--border,#1e1e2e);border-radius:8px;padding:5px 8px;color:var(--text,#e8e8f0);font-family:var(--font-ui,monospace);font-size:0.7rem;outline:none;}',
    '.sp-rng{padding:0;border:none;accent-color:#00F6D6;cursor:pointer;}',
    '.sp-val{font-size:0.62rem;color:#00F6D6;width:32px;text-align:right;flex-shrink:0;}',
    '.sp-tog{width:32px;height:18px;background:var(--muted,#2a2a3e);border-radius:9px;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;border:none;}',
    '.sp-tog.on{background:#00F6D6;}',
    ".sp-tog::after{content:';position:absolute;top:2px;left:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform 0.2s;}",
    '.sp-tog.on::after{transform:translateX(14px);}',
    '.sp-tbtn{flex:1;padding:5px 8px;background:transparent;border:1px solid var(--border,#1e1e2e);border-radius:8px;color:var(--text,#e8e8f0);font-family:var(--font-ui,monospace);font-size:0.65rem;cursor:pointer;transition:all 0.15s;}',
    '.sp-tbtn:hover{border-color:#00F6D6;}',
    '.sp-sw{width:30px;height:22px;border-radius:6px;border:1px solid var(--border,#1e1e2e);overflow:hidden;position:relative;cursor:pointer;}',
    '.sp-sw input{position:absolute;inset:-4px;width:calc(100% + 8px);height:calc(100% + 8px);opacity:0;cursor:pointer;}',
    '#sp-unlock-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;}',
    '.sp-ubtn{padding:7px 4px;background:transparent;border:1px solid var(--border,#1e1e2e);border-radius:10px;color:var(--subtext,#7070a0);font-family:var(--font-ui,monospace);font-size:0.58rem;cursor:pointer;transition:all 0.15s;display:flex;flex-direction:column;align-items:center;gap:3px;}',
    '.sp-ubtn.owned{border-color:#00F6D6;color:#00F6D6;background:rgba(0,246,214,0.06);}',
    '.sp-ubtn.sp-on{background:rgba(0,246,214,0.18);border-color:#00F6D6;color:#00F6D6;}',
    '.sp-ubtn:hover:not(.owned){border-color:#FFD93D;color:#FFD93D;}',
    '.sp-ucost{font-size:0.52rem;color:#FFD93D;letter-spacing:0.06em;}',
    '.sp-ucost.free{color:#00F6D6;}',
    '#sp-acts{display:flex;gap:6px;margin-top:4px;}',
    '.sp-abtn{flex:1;padding:7px;background:transparent;border:1px solid var(--border,#1e1e2e);border-radius:10px;color:var(--subtext,#7070a0);font-family:var(--font-ui,monospace);font-size:0.6rem;cursor:pointer;transition:all 0.15s;}',
    '.sp-abtn:hover{border-color:#00F6D6;color:#00F6D6;}',
    '#sp-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0a0a0f;border:1px solid #FFD93D;color:#FFD93D;font-family:var(--font-ui,monospace);font-size:0.65rem;letter-spacing:0.08em;padding:7px 16px;border-radius:20px;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9000;}',
    '#sp-toast.show{opacity:1;}',
  ].join(');
  document.head.appendChild(s);
}

function _spiralBuildHTML(container) {
  const unlockHTML = SPIRAL_UNLOCKS.map(u =>
    '<button class="sp-ubtn' + (_SpiralState.owned.has(u.id) ? ' owned' : ') + '" data-uid="' + u.id + '" data-cost="' + u.cost + '">"' +
    '<span>' + u.label + '</span>' +
    '<span class="sp-ucost' + (u.cost === 0 ? ' free' : ') + '">"' +
    (u.cost === 0 ? 'owned' : u.cost + ' \u25c8') +
    '</span></button>'
  ).join(');

  container.innerHTML =
    '<div id="sp-inner">' +
    '<div id="sp-topbar">' +
    '<span style="font-size:0.7rem;letter-spacing:0.1em;color:var(--text,#e8e8f0);">\u223f spiral lab</span>' +
    '<div id="sp-gold"><span style="font-size:0.85rem;">\u25c8</span><span id="sp-goldnum">0</span><span style="color:var(--subtext,#7070a0);">gold</span></div>' +
    '</div>' +
    '<div id="sp-presets">' +
    '<button class="sp-preset active" data-p="sky">sky</button>' +
    '<button class="sp-preset" data-p="cold">cold</button>' +
    '<button class="sp-preset" data-p="monday">monday</button>' +
    '<button class="sp-preset" data-p="grit">grit</button>' +
    '<button class="sp-preset" data-p="architect">architect</button>' +
    '<button class="sp-preset" data-p="custom">custom</button>' +
    '</div>' +
    '<div id="sp-canvas-wrap"><canvas id="sp-canvas"></canvas></div>' +
    '<div id="sp-ctrl">' +
    '<div class="sp-section">base controls</div>' +
    '<div class="sp-row"><span class="sp-lbl">type</span><select id="sp-type"><option value="log">logarithmic</option><option value="archi">archimedean</option><option value="fib">fibonacci</option><option value="galaxy">galaxy</option></select></div>' +
    '<div class="sp-row"><span class="sp-lbl">color</span><div id="sp-cswatch" class="sp-sw" style="background:#00F6D6"><input type="color" id="sp-color" value="#00F6D6"/></div><span class="sp-lbl" style="width:auto;margin-left:8px;">speed</span><input type="range" id="sp-speed" min="1" max="20" value="6" step="1" class="sp-rng"/><span class="sp-val" id="sp-spval">0.6x</span></div>' +
    '<div class="sp-row"><span class="sp-lbl">density</span><input type="range" id="sp-density" min="60" max="400" value="180" step="10" class="sp-rng"/><span class="sp-val" id="sp-dnval">180</span></div>' +
    '<div class="sp-row"><span class="sp-lbl">dir</span><button class="sp-tbtn" id="sp-dir">CW</button><span class="sp-lbl" style="width:auto;margin-left:6px;">ptcl</span><button class="sp-tog on" id="sp-ptcl"></button><span class="sp-lbl" style="width:auto;margin-left:6px;">decay</span><button class="sp-tog" id="sp-decay"></button></div>' +
    '<div class="sp-section" style="margin-top:4px;">unlock with gold \u25c8</div>' +
    '<div id="sp-unlock-grid">' + unlockHTML + '</div>' +
    '<div id="sp-acts"><button class="sp-abtn" id="sp-freeze">freeze</button><button class="sp-abtn" id="sp-png">save PNG</button><button class="sp-abtn" id="sp-ss">screensaver</button></div>' +
    '</div>' +
    '</div>' +
    '<div id="sp-toast"></div>';
}

function _spiralMath() {
  function rgba(hex, a) {
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }
  function hsl2hex(h) {
    const s=1,l=0.55,a=s*Math.min(l,1-l);
    const f=n=>{const k=(n+h/30)%12,c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};
    return '#'+f(0)+f(8)+f(4);
  }
  function archi(cx,cy,maxR,turns,th,cfg){
    const p=[],s=Math.round(cfg.density*turns),b=maxR/(turns*Math.PI*2);
    for(let i=0;i<=s;i++){const t=(i/s)*turns*Math.PI*2,a=t*cfg.dir+th;p.push([cx+b*t*Math.cos(a),cy+b*t*Math.sin(a)]);}return p;
  }
  function log_(cx,cy,maxR,turns,th,cfg){
    const p=[],s=Math.round(cfg.density*turns),b=Math.log(maxR)/(turns*Math.PI*2);
    for(let i=0;i<=s;i++){const t=(i/s)*turns*Math.PI*2,a=t*cfg.dir+th;p.push([cx+Math.exp(b*t)*Math.cos(a),cy+Math.exp(b*t)*Math.sin(a)]);}return p;
  }
  function fib(cx,cy,maxR,th,cfg){
    const p=[],n=cfg.density*3,g=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<n;i++){const r=maxR*Math.sqrt(i/n),a=i*g*cfg.dir+th;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;
  }
  function galaxy(cx,cy,maxR,turns,th,cfg,arms){
    const p=[],s=Math.round(cfg.density*turns),b=Math.log(maxR)/(turns*Math.PI*2);
    for(let arm=0;arm<arms;arm++){const off=(arm/arms)*Math.PI*2;
      for(let i=0;i<=s;i++){const t=(i/s)*turns*Math.PI*2,dr=0.18*Math.sin(t*1.4),a=(t+dr)*cfg.dir+th+off;p.push([cx+Math.exp(b*t)*Math.cos(a),cy+Math.exp(b*t)*Math.sin(a)]);}}return p;
  }
  function getPts(cfg, cx, cy, maxR, angle, arms) {
    if(cfg.type==='archi') return archi(cx,cy,maxR,5,angle,cfg);
    if(cfg.type==='fib')   return fib(cx,cy,maxR,angle,cfg);
    if(cfg.type==='galaxy') return galaxy(cx,cy,maxR,4,angle,cfg,arms);
    return log_(cx,cy,maxR,5,angle,cfg);
  }
  return { rgba, hsl2hex, getPts };
}

function _spiralDraw(st, math) {
  const { canvas, ctx, cfg, active, ptcls } = st;
  const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2;
  const pulse = active.has('pulse') ? Math.sin(Date.now()/600)*0.08+0.92 : 1;
  const maxR = Math.min(W,H)*0.44*pulse;
  const trailAlpha = active.has('trails') ? 0.04 : 0.12;
  if(cfg.decay||active.has('trails')){ctx.fillStyle='rgba(10,10,15,'+trailAlpha+')';ctx.fillRect(0,0,W,H);}
  else{ctx.clearRect(0,0,W,H);}
  const col = active.has('rainbow') ? math.hsl2hex(st.rainbowHue%360) : cfg.color;
  if(active.has('rainbow')) st.rainbowHue += 0.8;
  const arms = active.has('arms') ? 5 : 3;
  const mir = active.has('mirror');
  const pts = math.getPts(cfg, cx, cy, maxR, st.angle, arms);

  function drawPts(p, c) {
    if(cfg.type==='fib'){
      p.forEach(([x,y],i)=>{
        ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fillStyle=math.rgba(c,0.3+(i/p.length)*0.7);ctx.fill();
        if(mir){ctx.beginPath();ctx.arc(W-x,y,1.4,0,Math.PI*2);ctx.fill();}
      });
    } else {
      for(let i=1;i<p.length;i++){
        ctx.beginPath();ctx.moveTo(p[i-1][0],p[i-1][1]);ctx.lineTo(p[i][0],p[i][1]);
        ctx.strokeStyle=math.rgba(c,0.12+(i/p.length)*0.88);ctx.lineWidth=0.9+(i/p.length)*0.6;ctx.stroke();
        if(mir){ctx.beginPath();ctx.moveTo(W-p[i-1][0],p[i-1][1]);ctx.lineTo(W-p[i][0],p[i][1]);ctx.stroke();}
      }
    }
  }

  drawPts(pts, col);
  if(active.has('dual')){
    const pts2 = math.getPts({...cfg,dir:cfg.dir*-1}, cx, cy, maxR*0.7, st.angle*-1.3+Math.PI, arms);
    drawPts(pts2, col);
  }

  if(cfg.particles && pts.length>10){
    ptcls.forEach((p,pi)=>{
      const idx=Math.floor(p.pos*(pts.length-1));
      const[px,py]=pts[idx];
      ctx.beginPath();ctx.arc(px+p.ox,py+p.oy,p.r,0,Math.PI*2);ctx.fillStyle=math.rgba(col,p.alpha);ctx.fill();
      if(active.has('web') && pi<ptcls.length-1){
        const nxt=ptcls[pi+1];
        const ni=Math.floor(nxt.pos*(pts.length-1));
        const[nx,ny]=pts[ni];
        const d=Math.hypot(px-nx,py-ny);
        if(d<80){ctx.beginPath();ctx.moveTo(px+p.ox,py+p.oy);ctx.lineTo(nx+nxt.ox,ny+nxt.oy);ctx.strokeStyle=math.rgba(col,0.15*(1-d/80));ctx.lineWidth=0.5;ctx.stroke();}
      }
      p.pos=(p.pos+p.spd)%1;
      p.ox+=(Math.random()-0.5)*0.3;p.ox*=0.92;
      p.oy+=(Math.random()-0.5)*0.3;p.oy*=0.92;
    });
  }
  st.angle += 0.004*cfg.speed*cfg.dir;
}

function _spiralWire(st, math) {
  const q = s => document.querySelector(s);

  function setSize() {
    const wrap = document.getElementById('sp-canvas-wrap');
    if(!wrap || !st.canvas) return;
    st.canvas.width  = wrap.offsetWidth  || 300;
    st.canvas.height = wrap.offsetHeight || 300;
  }

  function loop() {
    if(!st.frozen) _spiralDraw(st, math);
    st.animId = requestAnimationFrame(loop);
  }

  function initP() {
    st.ptcls = Array.from({length:28},(_,i)=>({
      pos:i/28, spd:0.0008+Math.random()*0.0012,
      r:1.2+Math.random()*2.2, alpha:0.4+Math.random()*0.55, ox:0, oy:0
    }));
  }

  function toast(msg) {
    const t = document.getElementById('sp-toast');
    if(!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 2000);
  }

  function updateGold() {
    const el = document.getElementById('sp-goldnum');
    if(el) el.textContent = st.gold;
  }

  function syncCtrl() {
    const t=q('#sp-type');if(t)t.value=st.cfg.type;
    const c=q('#sp-color');if(c)c.value=st.cfg.color;
    const sw=q('#sp-cswatch');if(sw)sw.style.background=st.cfg.color;
    const sp=q('#sp-speed');if(sp)sp.value=st.cfg.speed*10;
    const sv=q('#sp-spval');if(sv)sv.textContent=st.cfg.speed.toFixed(1)+'x';
    const dn=q('#sp-density');if(dn)dn.value=st.cfg.density;
    const dv=q('#sp-dnval');if(dv)dv.textContent=st.cfg.density;
    const dr=q('#sp-dir');if(dr)dr.textContent=st.cfg.dir===1?'CW':'CCW';
    const pt=q('#sp-ptcl');if(pt)pt.classList.toggle('on',st.cfg.particles);
    const dc=q('#sp-decay');if(dc)dc.classList.toggle('on',st.cfg.decay);
    document.querySelectorAll('.sp-ubtn').forEach(btn=>{
      const uid=btn.dataset.uid;
      btn.classList.toggle('owned',st.owned.has(uid));
      btn.classList.toggle('sp-on',st.active.has(uid));
      const costEl=btn.querySelector('.sp-ucost');
      if(costEl && st.owned.has(uid)){costEl.textContent='owned';costEl.classList.add('free');}
    });
  }

  function applyPreset(name) {
    const p = SPIRAL_PRESETS[name]||SPIRAL_PRESETS.custom;
    Object.assign(st.cfg, p); initP(); syncCtrl();
    document.querySelectorAll('.sp-preset').forEach(c=>c.classList.toggle('active',c.dataset.p===name));
  }

  // Wire controls
  q('#sp-type').addEventListener('change',e=>{st.cfg.type=e.target.value;document.querySelectorAll('.sp-preset').forEach(c=>c.classList.remove('active'));});
  q('#sp-color').addEventListener('input',e=>{st.cfg.color=e.target.value;q('#sp-cswatch').style.background=e.target.value;});
  q('#sp-speed').addEventListener('input',e=>{st.cfg.speed=e.target.value/10;q('#sp-spval').textContent=st.cfg.speed.toFixed(1)+'x';});
  q('#sp-density').addEventListener('input',e=>{st.cfg.density=parseInt(e.target.value);q('#sp-dnval').textContent=st.cfg.density;});
  q('#sp-dir').addEventListener('click',()=>{st.cfg.dir*=-1;q('#sp-dir').textContent=st.cfg.dir===1?'CW':'CCW';});
  q('#sp-ptcl').addEventListener('click',()=>{st.cfg.particles=!st.cfg.particles;q('#sp-ptcl').classList.toggle('on',st.cfg.particles);if(st.cfg.particles)initP();});
  q('#sp-decay').addEventListener('click',()=>{st.cfg.decay=!st.cfg.decay;q('#sp-decay').classList.toggle('on',st.cfg.decay);});
  q('#sp-freeze').addEventListener('click',()=>{st.frozen=!st.frozen;q('#sp-freeze').textContent=st.frozen?'unfreeze':'freeze';});
  q('#sp-png').addEventListener('click',()=>{st.canvas.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='spiral-'+Date.now()+'.png';a.click();});});
  q('#sp-ss').addEventListener('click',()=>toast('screensaver activates after 5min idle'));
  document.querySelectorAll('.sp-preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.p)));

  document.querySelectorAll('.sp-ubtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const uid=btn.dataset.uid, cost=parseInt(btn.dataset.cost)||0;
      if(st.owned.has(uid)){
        st.active.has(uid)?st.active.delete(uid):st.active.add(uid);
        btn.classList.toggle('sp-on',st.active.has(uid));
        toast(uid+(st.active.has(uid)?' on':' off'));
      } else if(st.gold>=cost){
        st.gold-=cost; updateGold();
        st.owned.add(uid); st.active.add(uid);
        btn.classList.add('owned','sp-on');
        const costEl=btn.querySelector('.sp-ucost');
        if(costEl){costEl.textContent='owned';costEl.classList.add('free');}
        toast('unlocked: '+uid+'!');
      } else {
        toast('need '+(cost-st.gold)+' more gold \u25c8');
      }
    });
  });

  window.addEventListener('resize',()=>setTimeout(setSize,0));

  st.canvas = document.getElementById('sp-canvas');
  st.ctx = st.canvas.getContext('2d');
  setTimeout(()=>{ setSize(); initP(); applyPreset('sky'); if(st.animId)cancelAnimationFrame(st.animId); loop(); updateGold(); }, 0);
}

export function initSpiral() {
  const container = document.getElementById('view-spiral');
  if (!container || container.dataset.initialized) return;
  container.dataset.initialized = '1';
  _spiralInjectCSS();
  _spiralBuildHTML(container);
  const math = _spiralMath();
  _spiralWire(_SpiralState, math);
}
