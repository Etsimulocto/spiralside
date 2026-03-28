// Nimbis anchor: js/app/views/bloomengine.js
// SPIRALSIDE -- BLOOM ENGINE v1.0
// Living fractal particle biome creator / scientific synthesizer control panel
// Pattern: flex:1 min-height:0 inner wrapper, canvas top 42%, scrollable panel bottom
// window.initBloomEngineView = initBloomEngine (registered in main.js)

const _BEState = {
  canvas: null, ctx: null, animId: null,
  particles: [], wells: [], cycle: 0, bloomPhase: 0,
};

const BE_PALETTES = [
  ['#00F6D6','#4DA3FF','#FF4BCB','#FFD93D','#F3F7FF','#a8ff80'],
  ['#00F6D6','#00b4d8','#0077b6','#48cae4','#90e0ef','#caf0f8'],
  ['#FF4BCB','#f72585','#b5179e','#7209b7','#560bad','#480ca8'],
  ['#FFD93D','#f8961e','#f3722c','#f94144','#ff6b6b','#ffd166'],
  ['#a8ff80','#78ff44','#00F6D6','#00b894','#55efc4','#b2f7ef'],
  ['#F3F7FF','#ddd','#aaa','#888','#555','#333'],
];

function _beInjectCSS() {
  if (document.getElementById('be-css')) return;
  const s = document.createElement('style');
  s.id = 'be-css';
  s.textContent = [
    '#be-inner{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;background:#0a0a0f;font-family:var(--font-ui,monospace);}',
    '#be-canvas{display:block;flex:0 0 auto;background:#101014;width:100%;cursor:crosshair;}',
    '#be-wells-hint{font-size:8px;color:#333;letter-spacing:.08em;padding:2px 10px;background:#080810;flex-shrink:0;}',
    '#be-panel{flex:1;overflow-y:auto;overflow-x:hidden;background:#0e0e16;-webkit-overflow-scrolling:touch;}',
    '#be-panel-inner{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#1a1a22;}',
    '.be-mod{background:#0e0e16;padding:10px;}',
    '.be-title{font-size:9px;color:#4DA3FF;letter-spacing:.15em;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid #1a1a2a;padding-bottom:4px;}',
    '.be-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
    '.be-row label{font-size:8px;color:#556;letter-spacing:.06em;width:88px;flex-shrink:0;text-transform:uppercase;}',
    '.be-row input[type=range]{flex:1;accent-color:#00F6D6;height:2px;cursor:pointer;}',
    '.be-val{font-size:9px;color:#00F6D6;width:28px;text-align:right;flex-shrink:0;}',
    '#be-bar{display:flex;justify-content:space-between;align-items:center;padding:4px 10px;background:#080810;border-top:1px solid #1a1a22;font-size:8px;letter-spacing:.1em;flex-shrink:0;}',
    '#be-status{color:#FF4BCB;}',
    '#be-stats{color:#444;display:flex;gap:12px;}',
    '.be-stat span{color:#00F6D6;}',
    '#be-bloom-btn{background:transparent;border:1px solid #FF4BCB44;color:#FF4BCB;font-family:var(--font-ui,monospace);font-size:8px;letter-spacing:.1em;padding:3px 8px;cursor:pointer;border-radius:2px;}',
    '#be-bloom-btn:hover{background:#FF4BCB22;}',
  ].join('');
  document.head.appendChild(s);
}

function _beBuildHTML(container) {
  function mod(title, rows) {
    return '<div class="be-mod"><div class="be-title">' + title + '</div>' + rows + '</div>';
  }
  function row(label, id, min, max, val, step) {
    return '<div class="be-row"><label>' + label + '</label>' +
      '<input type="range" id="be-' + id + '" min="' + min + '" max="' + max + '" value="' + val + '" step="' + (step||1) + '">' +
      '<span class="be-val" id="bv-' + id + '">' + val + '</span></div>';
  }
  const panelHTML =
    mod('&#9654; spawn field',
      row('Mitosis Rate','spawn',0,100,30)+row('Particle Life','life',10,400,140)+
      row('Spawn Radius','radius',0,100,0)+row('Max Population','maxpop',50,2000,600,50)+
      row('Chromatic Drift','cdrift',0,100,40)+row('Size Variance','size',1,8,2)) +
    mod('&#9654; motion field',
      row('Entropy','entropy',0,100,50)+row('Radial Pull','radial',-100,100,15)+
      row('Vortex Spin','vortex',-100,100,0)+row('Speed Limit','speed',1,10,3)+
      row('Damping','damp',80,100,99)+row('Bounce','bounce',0,100,50)) +
    mod('&#9654; wave geometry',
      row('Sine Freq','sine',0,100,40)+row('Sine Amp','sinamp',0,100,40)+
      row('Cosine Interfere','cos',0,100,0)+row('Phase Shift','phase',0,100,0)+
      row('Harmonic Res','harm',1,8,1)+row('Wave Tangle','tangle',0,100,0)) +
    mod('&#9654; fractal layer',
      row('Branch Depth','branch',0,100,0)+row('Branch Angle','bangle',0,180,45)+
      row('Self Similarity','self',0,100,0)+row('Fractal Scale','fscale',10,90,50)+
      row('Bloom Factor','bloom',0,100,10)+row('Recursive Bloom','recbloom',0,100,0)) +
    mod('&#9654; chaos math',
      row('Lorenz Chaos','lorenz',0,100,0)+row('Lorenz Sigma','lsigma',1,28,10)+
      row('Julia Field','julia',0,100,0)+row('Julia Cx','jcx',-100,100,-70)+
      row('Bifurcation','bifurc',0,100,0)+row('Strange Pull','strange',0,100,0)) +
    mod('&#9654; chromatic',
      row('Spectral Shift','spectral',0,100,0)+row('Heat Map','heat',0,100,0)+
      row('Ghost Trails','ghost',0,100,20)+row('Color Pulse','cpulse',0,100,0)+
      row('Palette Lock','palette',0,5,0)+row('Invert Field','invert',0,1,0)) +
    mod('&#9654; polar geometry',
      row('Polar Remap','polar',0,100,0)+row('Spiral Arms','arms',0,12,0)+
      row('Radial Symmetry','radsym',1,12,1)+row('Orbit Decay','odecay',0,100,0)+
      row('Angular Drift','adrift',-100,100,0)+row('Petal Count','petal',0,12,0)) +
    mod('&#9654; field ops',
      row('Wind X','windx',-100,100,0)+row('Wind Y','windy',-100,100,0)+
      row('Pulse Rate','pulse',0,100,0)+row('Gravity Y','gravity',-50,50,0)+
      row('Tunnel Warp','tunnel',0,100,0)+row('Repulse Ring','repulse',0,100,0));

  container.innerHTML =
    '<div id="be-inner">' +
    '<canvas id="be-canvas"></canvas>' +
    '<div id="be-wells-hint">click canvas = attract well | right-click = repel well</div>' +
    '<div id="be-panel"><div id="be-panel-inner">' + panelHTML + '</div></div>' +
    '<div id="be-bar"><span id="be-status">GENESIS - 1 PARTICLE</span>' +
    '<div id="be-stats"><div class="be-stat">POP <span id="be-st-pop">1</span></div>' +
    '<div class="be-stat">CYCLE <span id="be-st-cyc">0</span></div>' +
    '<div class="be-stat">WELLS <span id="be-st-wells">0</span></div></div>' +
    '<button id="be-bloom-btn">WHITE BLOOM</button></div></div>';
}

function _beG(id) { return +document.getElementById('be-' + id).value; }

function _beHsv(h, s, v) {
  const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
  const m=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  return 'rgb('+Math.round(m[0]*255)+','+Math.round(m[1]*255)+','+Math.round(m[2]*255)+')';
}

function _beSpawn(x, y, ci, gen) {
  const st=_BEState, C=st.canvas;
  const life=Math.round(_beG('life')*(0.5+Math.random()));
  const spd=0.3+Math.random()*1.8*(0.2+_beG('entropy')/100);
  const ang=Math.random()*Math.PI*2;
  const r=_beG('radius'), ox=r?(Math.random()-0.5)*r*2:0, oy=r?(Math.random()-0.5)*r*2:0;
  return {
    x:(x!=null?x:C.width/2)+ox, y:(y!=null?y:C.height/2)+oy,
    vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
    life, maxLife:life, age:0, colorIdx:ci!=null?ci:4, gen:gen||0,
    size:0.8+Math.random()*(_beG('size')*0.6),
    soff:Math.random()*Math.PI*2, px:x!=null?x:C.width/2, py:y!=null?y:C.height/2,
  };
}

function _beLoop() {
  const st=_BEState;
  if (!st.canvas||!document.getElementById('view-bloomengine')) {
    if (st.animId){cancelAnimationFrame(st.animId);st.animId=null;} return;
  }
  const C=st.canvas,ctx=st.ctx,W=C.width,H=C.height,cx=W/2,cy=H/2;
  const entropy=_beG('entropy')/100, radial=_beG('radial')/100, vortex=_beG('vortex')/100;
  const sineF=_beG('sine')/100, sineA=_beG('sinamp')/100, cosF=_beG('cos')/100;
  const phase=_beG('phase')/100*Math.PI*2, harm=_beG('harm');
  const tangle=_beG('tangle')/100, branch=_beG('branch')/100;
  const bangle=_beG('bangle')*Math.PI/180, self_s=_beG('self')/100, fscale=_beG('fscale')/100;
  const recbloom=_beG('recbloom')/100, lorenz=_beG('lorenz')/100, lsigma=_beG('lsigma');
  const julia=_beG('julia')/100, jcx=_beG('jcx')/100;
  const bifurc=_beG('bifurc')/100, strange=_beG('strange')/100;
  const spectral=_beG('spectral')/100, heat=_beG('heat')/100;
  const ghost=_beG('ghost')/100, cpulse=_beG('cpulse')/100;
  const palIdx=_beG('palette'), invert=_beG('invert');
  const polar=_beG('polar')/100, arms=_beG('arms'), radsym=_beG('radsym');
  const odecay=_beG('odecay')/100, adrift=_beG('adrift')/100, petal=_beG('petal');
  const windx=_beG('windx')/100, windy=_beG('windy')/100;
  const pulseR=_beG('pulse')/100, gravity=_beG('gravity')/100;
  const tunnel=_beG('tunnel')/100, repulse=_beG('repulse')/100;
  const spawnR=_beG('spawn')/100, cdrift=_beG('cdrift')/100;
  const maxpop=_beG('maxpop'), damp=_beG('damp')/100, speedLim=_beG('speed');
  const bounce=_beG('bounce')/100;
  const COLS=BE_PALETTES[palIdx%BE_PALETTES.length];

  if (st.bloomPhase>0) {
    ctx.fillStyle='rgba(243,247,255,'+st.bloomPhase*0.15+')';ctx.fillRect(0,0,W,H);
    st.bloomPhase-=0.012;
    if (st.bloomPhase<=0){st.bloomPhase=0;st.particles=[_beSpawn(null,null,4,0)];ctx.fillStyle='#101014';ctx.fillRect(0,0,W,H);}
  } else {
    ctx.fillStyle=invert?'rgba(243,247,255,'+(0.08+ghost*0.12)+')':'rgba(10,10,15,'+(0.12+ghost*0.15)+')';
    ctx.fillRect(0,0,W,H);
  }

  const newP=[], densMap={};
  for (let i=0;i<st.particles.length;i++) {
    const pt=st.particles[i]; pt.age++;
    const t=pt.age*0.05, lifeR=1-pt.age/pt.maxLife;
    if (lifeR<=0) continue;
    let ax=0,ay=0;
    ax+=(Math.random()-0.5)*entropy*0.5; ay+=(Math.random()-0.5)*entropy*0.5;
    const dx=cx-pt.x,dy=cy-pt.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
    ax+=(dx/dist)*radial*0.15; ay+=(dy/dist)*radial*0.15;
    ax+=(-dy/dist)*vortex*0.15; ay+=(dx/dist)*vortex*0.15;
    const sf=t*harm*(sineF*3+0.1)+pt.soff+phase;
    ax+=Math.sin(sf)*sineA*1.5; ay+=Math.cos(sf*(1+cosF*2))*sineA*1.5;
    if (cosF>0){ax+=Math.cos(sf*1.7+phase)*cosF*1.2;ay+=Math.sin(sf*1.3)*cosF*1.2;}
    if (tangle>0){ax+=Math.sin(pt.y*0.02+t)*tangle*0.8;ay+=Math.cos(pt.x*0.02+t)*tangle*0.8;}
    for (const w of st.wells){const wx=w.x-pt.x,wy=w.y-pt.y,wd=Math.sqrt(wx*wx+wy*wy)||1,force=w.type*3/(wd*0.1+1);ax+=(wx/wd)*force;ay+=(wy/wd)*force;}
    ax+=windx*0.08;ay+=windy*0.08+gravity*0.15;
    if (pulseR>0){const pd=Math.sin(st.cycle*0.05)*pulseR*50,pr=dist-pd;ax-=(dx/dist)*pr*pulseR*0.003;ay-=(dy/dist)*pr*pulseR*0.003;}
    if (repulse>0&&dist<repulse*100+20){ax-=(dx/dist)*repulse*1.5;ay-=(dy/dist)*repulse*1.5;}
    if (tunnel>0){const nd=(pt.x/W-0.5)*2,ndy=(pt.y/H-0.5)*2;ax+=nd*tunnel*0.2;ay+=ndy*tunnel*0.2;}
    if (lorenz>0){const lx=(pt.x/W-0.5)*4,ly=(pt.y/H-0.5)*4;ax+=lsigma*(ly-lx)*lorenz*0.008;ay+=(lx*(28-lx*lx)-ly)*lorenz*0.004;}
    if (julia>0){const jx=(pt.x/W-0.5)*3,jy=(pt.y/H-0.5)*3,nx=jx*jx-jy*jy+jcx,ny=2*jx*jy-0.27;ax+=(nx-jx)*julia*0.08;ay+=(ny-jy)*julia*0.08;}
    if (bifurc>0&&Math.random()<0.02){const pop=st.particles.length/maxpop,r2=2.4+bifurc*1.6;ax+=(r2*pop*(1-pop)-pop)*5*bifurc;}
    if (strange>0){ax+=Math.sin(pt.y/H*Math.PI*2)*strange*0.4;ay+=Math.cos(pt.x/W*Math.PI*2)*strange*0.4;}
    if (polar>0){const ang2=Math.atan2(pt.y-cy,pt.x-cx),ta=ang2+adrift*0.02;ax+=(Math.cos(ta)*dist-pt.vx)*polar*0.1;ay+=(Math.sin(ta)*dist-pt.vy)*polar*0.1;}
    if (arms>0){const ang3=Math.atan2(pt.y-cy,pt.x-cx),spi=ang3-dist*0.02*arms;ax+=Math.cos(spi)*arms*0.05;ay+=Math.sin(spi)*arms*0.05;}
    if (petal>0){const ang4=Math.atan2(pt.y-cy,pt.x-cx),pr2=Math.abs(Math.cos(ang4*petal))*50;ax+=(cx+Math.cos(ang4)*pr2-pt.x)*0.01;ay+=(cy+Math.sin(ang4)*pr2-pt.y)*0.01;}
    if (odecay>0){const ang5=Math.atan2(pt.y-cy,pt.x-cx);ax+=Math.cos(ang5+Math.PI/2)*odecay*0.3-pt.vx*odecay*0.05;ay+=Math.sin(ang5+Math.PI/2)*odecay*0.3-pt.vy*odecay*0.05;}
    if (radsym>1){const ang6=Math.atan2(pt.y-cy,pt.x-cx),snap=Math.round(ang6/(Math.PI*2/radsym))*(Math.PI*2/radsym);ax+=(Math.cos(snap)-Math.cos(ang6))*0.1;ay+=(Math.sin(snap)-Math.sin(ang6))*0.1;}
    pt.vx=(pt.vx+ax)*damp;pt.vy=(pt.vy+ay)*damp;
    const spd2=Math.sqrt(pt.vx*pt.vx+pt.vy*pt.vy);
    if (spd2>speedLim){pt.vx=(pt.vx/spd2)*speedLim;pt.vy=(pt.vy/spd2)*speedLim;}
    pt.px=pt.x;pt.py=pt.y;pt.x+=pt.vx;pt.y+=pt.vy;
    if (pt.x<0){pt.vx*=-bounce;pt.x=0;}if (pt.x>W){pt.vx*=-bounce;pt.x=W;}
    if (pt.y<0){pt.vy*=-bounce;pt.y=0;}if (pt.y>H){pt.vy*=-bounce;pt.y=H;}
    let col;
    if (spectral>0){const sp3=Math.sqrt(pt.vx*pt.vx+pt.vy*pt.vy)/speedLim;col=_beHsv(sp3*spectral+(1-spectral)*(pt.colorIdx/COLS.length),0.8,0.9);}
    else if (cpulse>0){col=COLS[(pt.colorIdx+Math.floor(st.cycle*cpulse*0.05))%COLS.length];}
    else{col=COLS[pt.colorIdx%COLS.length];}
    if (heat>0){const dk=Math.floor(pt.x/20)+Math.floor(pt.y/20)*Math.ceil(W/20);densMap[dk]=(densMap[dk]||0)+1;}
    ctx.globalAlpha=Math.min(lifeR*1.5,0.95)*(invert?0.7:1);
    ctx.fillStyle=col;
    const sz=Math.max(0.5,pt.size*(0.3+lifeR*0.8));
    ctx.fillRect(Math.round(pt.x),Math.round(pt.y),Math.ceil(sz),Math.ceil(sz));
    if (branch>0&&lifeR>0.3&&newP.length<maxpop&&Math.random()<branch*0.015){
      const a=Math.atan2(pt.vy,pt.vx);
      for (const da of [bangle,-bangle]){const ci3=Math.random()<cdrift?Math.floor(Math.random()*COLS.length):pt.colorIdx;if(newP.length<maxpop){const nb=_beSpawn(pt.x,pt.y,ci3,pt.gen+1);nb.vx=Math.cos(a+da)*speedLim*fscale;nb.vy=Math.sin(a+da)*speedLim*fscale;newP.push(nb);}}
    }
    if (self_s>0&&pt.age>5&&Math.random()<self_s*0.005&&newP.length<maxpop){const ns=_beSpawn(pt.px,pt.py,pt.colorIdx,pt.gen+1);ns.vx=-pt.vx*fscale;ns.vy=-pt.vy*fscale;newP.push(ns);}
    if (recbloom>0&&lifeR<0.1&&Math.random()<recbloom*0.3){for(let b=0;b<3;b++){if(newP.length<maxpop)newP.push(_beSpawn(pt.x,pt.y,Math.floor(Math.random()*COLS.length),pt.gen+1));}}
    newP.push(pt);
  }
  if (heat>0){ctx.globalAlpha=heat*0.4;for(const [k,v] of Object.entries(densMap)){const ki=+k,gw=Math.ceil(W/20),gx=(ki%gw)*20,gy=Math.floor(ki/gw)*20,h2=Math.min(v/10,1);ctx.fillStyle=_beHsv((1-h2)*0.33,0.8,0.9);ctx.fillRect(gx,gy,20,20);}}
  ctx.globalAlpha=1;
  for (const w of st.wells){ctx.globalAlpha=0.4;ctx.strokeStyle=w.type>0?'#FF4BCB':'#4DA3FF';ctx.lineWidth=0.5;ctx.beginPath();ctx.arc(w.x,w.y,8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(w.x,w.y,2,0,Math.PI*2);ctx.fillStyle=w.type>0?'#FF4BCB':'#4DA3FF';ctx.fill();ctx.globalAlpha=1;}
  if (st.particles.length===0&&st.bloomPhase<=0) st.particles.push(_beSpawn());
  if (newP.length>maxpop){newP.sort(()=>Math.random()-0.5);newP.length=maxpop;}
  while(newP.length<1)newP.push(_beSpawn());
  for(let i=0;i<newP.length;i++){const pt=newP[i];if(newP.length<maxpop&&Math.random()<spawnR*0.035*(1-newP.length/maxpop)){const ci4=Math.random()<cdrift?Math.floor(Math.random()*COLS.length):pt.colorIdx;newP.push(_beSpawn(pt.x,pt.y,ci4,pt.gen+1));}}
  if(newP.length>maxpop)newP.length=maxpop;
  st.particles=newP; st.cycle++;
  if(st.cycle%15===0){
    const popEl=document.getElementById('be-st-pop'),cycEl=document.getElementById('be-st-cyc'),statEl=document.getElementById('be-status');
    if(popEl)popEl.textContent=st.particles.length;
    if(cycEl)cycEl.textContent=st.cycle;
    const s=st.particles.length>maxpop*0.85?'CRITICAL MASS - BLOOM?':st.particles.length<5?'GENESIS STATE':st.particles.length>maxpop*0.5?'BIOME EXPANDING':'SYSTEM NOMINAL';
    if(statEl)statEl.textContent=s;
  }
  st.animId=requestAnimationFrame(_beLoop);
}

function _beSetSize() {
  const C=_BEState.canvas; if(!C) return;
  const inner=document.getElementById('be-inner'); if(!inner) return;
  const viewH=inner.offsetHeight;
  const canH=Math.max(180,Math.min(Math.floor(viewH*0.42),320));
  C.width=C.offsetWidth||320; C.height=canH; C.style.height=canH+'px';
}

function _beWire() {
  const st=_BEState;
  const C=document.getElementById('be-canvas'); if(!C) return;
  st.canvas=C; st.ctx=C.getContext('2d');
  _beSetSize();
  document.querySelectorAll('#be-inner input[type=range]').forEach(el=>{
    el.addEventListener('input',()=>{const v=document.getElementById('bv-'+el.id.slice(3));if(v)v.textContent=el.value;});
  });
  C.addEventListener('click',e=>{const r=C.getBoundingClientRect();st.wells.push({x:e.clientX-r.left,y:e.clientY-r.top,type:1});if(st.wells.length>8)st.wells.shift();const el=document.getElementById('be-st-wells');if(el)el.textContent=st.wells.length;});
  C.addEventListener('contextmenu',e=>{e.preventDefault();const r=C.getBoundingClientRect();st.wells.push({x:e.clientX-r.left,y:e.clientY-r.top,type:-1});if(st.wells.length>8)st.wells.shift();const el=document.getElementById('be-st-wells');if(el)el.textContent=st.wells.length;});
  document.getElementById('be-bloom-btn').addEventListener('click',()=>{st.bloomPhase=1.0;});
  window.addEventListener('resize',()=>setTimeout(_beSetSize,0));
  st.particles=[_beSpawn(null,null,4,0)];
  if(st.animId)cancelAnimationFrame(st.animId);
  _beLoop();
}

export function initBloomEngine() {
  const container=document.getElementById('view-bloomengine');
  if(!container||container.dataset.initialized) return;
  container.dataset.initialized='1';
  _beInjectCSS();
  _beBuildHTML(container);
  setTimeout(_beWire,0);
}
