SKY_JS = r"""// ============================================================
// SPIRALSIDE — COLOR SKETCHES v1.1
// Tiny seeded canvas doodles for each color row in Style tab
// Nimbis anchor: js/app/colorSketches.js
// ============================================================

function rng(seed) {
  let s = seed + 1;
  return () => { s = (s * 16807) % 2147483647; return (s-1)/2147483646; };
}

const SKETCHES = ['stars','horizon','clouds','constellation','rain','wave','dots','aurora'];

function drawSketch(canvas, type, color, seed) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const r = rng(seed);
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = 0.6;

  if (type === 'stars') {
    for (let i=0;i<18;i++){
      ctx.beginPath();ctx.arc(r()*w,r()*h,r()*1.8+0.5,0,Math.PI*2);ctx.fill();
    }
    for (let i=0;i<2;i++){
      const x=r()*w*0.8+w*0.1,y=r()*h*0.6+h*0.2;
      ctx.lineWidth=0.8;
      ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();
    }
  } else if (type === 'horizon') {
    for (let i=0;i<4;i++){
      const y=h*0.25+i*(h*0.18);
      ctx.globalAlpha=0.55-i*0.1; ctx.lineWidth=i===0?1.2:0.6;
      ctx.beginPath(); ctx.moveTo(0,y+(r()-0.5)*3);
      for (let x=0;x<=w;x+=8) ctx.lineTo(x,y+(r()-0.5)*4);
      ctx.stroke();
    }
    ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.arc(w*(0.2+r()*0.6),h*0.22,4+r()*3,0,Math.PI*2);ctx.stroke();
  } else if (type === 'clouds') {
    ctx.lineJoin='round';
    for (let c=0;c<3;c++){
      const cx=r()*w*0.6+w*0.05,cy=r()*h*0.4+h*0.1,sc=0.5+r()*0.6;
      ctx.globalAlpha=0.4+r()*0.2; ctx.lineWidth=0.9;
      ctx.beginPath();
      ctx.arc(cx,cy,7*sc,Math.PI,0);
      ctx.arc(cx+7*sc,cy-3*sc,5*sc,Math.PI,0);
      ctx.arc(cx+14*sc,cy,6*sc,Math.PI,0);
      ctx.closePath(); ctx.stroke();
    }
  } else if (type === 'constellation') {
    const pts=[];
    for (let i=0;i<7;i++) pts.push([w*0.1+r()*w*0.8,h*0.1+r()*h*0.8]);
    ctx.lineWidth=0.6; ctx.globalAlpha=0.35;
    for (let i=0;i<pts.length-1;i++){
      const dx=pts[i][0]-pts[i+1][0],dy=pts[i][1]-pts[i+1][1];
      if (Math.sqrt(dx*dx+dy*dy)<w*0.55){
        ctx.beginPath();ctx.moveTo(pts[i][0],pts[i][1]);ctx.lineTo(pts[i+1][0],pts[i+1][1]);ctx.stroke();
      }
    }
    ctx.globalAlpha=0.75;
    pts.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,1.5+r()*0.8,0,Math.PI*2);ctx.fill();});
  } else if (type === 'rain') {
    ctx.lineWidth=0.7;
    for (let i=0;i<22;i++){
      const x=r()*w,y=r()*h,len=5+r()*8;
      ctx.globalAlpha=0.3+r()*0.3;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len*0.3,y+len);ctx.stroke();
    }
  } else if (type === 'wave') {
    ctx.lineWidth=1;
    for (let row=0;row<3;row++){
      const y0=h*0.2+row*h*0.25,amp=3+r()*4,freq=0.06+r()*0.05,phase=r()*Math.PI*2;
      ctx.globalAlpha=0.5-row*0.1;
      ctx.beginPath();
      for (let x=0;x<=w;x+=2){const y=y0+Math.sin(x*freq+phase)*amp;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.stroke();
    }
  } else if (type === 'dots') {
    ctx.globalAlpha=0.5;
    for (let col=0;col<9;col++) for (let row=0;row<3;row++){
      ctx.beginPath();ctx.arc((col+0.5)*(w/9),(row+0.5)*(h/3),0.8+r()*2,0,Math.PI*2);ctx.fill();
    }
  } else if (type === 'aurora') {
    ctx.lineWidth=1.5;
    for (let i=0;i<6;i++){
      const x0=w*(i/5.5); ctx.globalAlpha=0.2+r()*0.3;
      ctx.beginPath(); ctx.moveTo(x0,h);
      for (let y=h;y>=0;y-=4) ctx.lineTo(x0+Math.sin(y*0.08+r()*2)*6,y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
}

export function initColorSketches() {
  const canvases = document.querySelectorAll('.color-sketch-canvas');
  const color = getComputedStyle(document.documentElement).getPropertyValue('--subtext').trim() || '#6060A0';
  canvases.forEach((cvs, i) => {
    // Force canvas pixel dimensions — CSS might have overridden them
    cvs.width  = 120;
    cvs.height = 32;
    drawSketch(cvs, SKETCHES[i % SKETCHES.length], color, i * 137 + 42);
  });
}

export function recolorSketch(index, color) {
  const cvs = document.querySelectorAll('.color-sketch-canvas')[index];
  if (!cvs) return;
  cvs.width=120; cvs.height=32;
  drawSketch(cvs, SKETCHES[index % SKETCHES.length], color, index*137+42);
}
"""

with open('js/app/colorSketches.js', 'w', encoding='utf-8') as f:
    f.write(SKY_JS)
print('OK — colorSketches.js rewritten')
print()
print('git add js/app/colorSketches.js && git commit -m "fix: sketches v1.1 force canvas size" && git push --force origin main')
