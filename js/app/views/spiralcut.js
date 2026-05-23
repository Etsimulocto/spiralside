
// SPIRALSIDE - SPIRALCUT v0.2
// Nimbis anchor: js/app/views/spiralcut.js
// Changes from v0.1: gen clip + gen image buttons wired to real endpoints
// prompt box added to inspector, video/image renders in preview area
// 30 credits deducted per video, 5 per image

let initialized=false;
let _scSession=null; // set by main.js after auth: window._scSession = session

export function initSpiralCutView(){
  const el=document.getElementById("view-spiralcut");
  if(!el||initialized)return;
  initialized=true;
  const wrap=document.createElement("div");
  wrap.style.cssText="display:flex;flex-direction:column;height:100%;overflow:hidden;";
  el.appendChild(wrap);
  _top(wrap);_mid(wrap);_tl(wrap);_wire();
}

function _top(el){
  const d=document.createElement("div");
  d.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;";
  const t=document.createElement("span");
  t.style.cssText="font-family:var(--font-display);font-weight:800;font-size:0.95rem;background:linear-gradient(135deg,var(--teal),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;";
  t.textContent="SpiralCut";
  const v=document.createElement("span");
  v.style.cssText="font-size:0.55rem;color:var(--subtext);border:1px solid var(--border);border-radius:4px;padding:2px 6px;margin-left:8px;";
  v.textContent="v0.2";
  const l=document.createElement("div");
  l.appendChild(t);l.appendChild(v);
  const b=document.createElement("button");
  b.style.cssText="padding:6px 14px;background:linear-gradient(135deg,var(--teal),var(--purple));border:none;border-radius:6px;color:#000;font-weight:700;font-size:0.68rem;cursor:pointer;";
  b.textContent="export";
  d.appendChild(l);d.appendChild(b);el.appendChild(d);
}

function _mid(el){
  const m=document.createElement("div");
  m.style.cssText="display:flex;flex:1;overflow:hidden;min-height:0;";

  // -- ASSET BIN --
  const bin=document.createElement("div");
  bin.style.cssText="width:130px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);display:flex;flex-direction:column;overflow:hidden;";
  const bh=document.createElement("div");
  bh.style.cssText="padding:7px 10px;font-size:0.52rem;color:var(--subtext);text-transform:uppercase;border-bottom:1px solid var(--border);flex-shrink:0;";
  bh.textContent="asset bin";
  bin.appendChild(bh);
  const tabs=document.createElement("div");
  tabs.style.cssText="display:flex;border-bottom:1px solid var(--border);flex-shrink:0;";
  [["scenes","sc-bin-scenes",true],["worlds","sc-bin-worlds",false],["cast","sc-bin-chars",false]].forEach(([l,b,a])=>{
    const btn=document.createElement("button");
    btn.className="sc-atab";btn.dataset.bin=b;btn.textContent=l;
    btn.style.cssText="flex:1;padding:5px 2px;background:transparent;border:none;border-bottom:2px solid "+(a?"var(--teal)":"transparent")+";color:"+(a?"var(--teal)":"var(--subtext)")+";font-family:var(--font-ui);font-size:0.52rem;cursor:pointer;";
    tabs.appendChild(btn);
  });
  bin.appendChild(tabs);
  const bl=document.createElement("div");
  bl.style.cssText="flex:1;overflow-y:auto;padding:6px;";
  [["sc-bin-scenes","scene",3],["sc-bin-worlds","world",2],["sc-bin-chars","char",3]].forEach(([id,t,n],i)=>{
    const d=document.createElement("div");
    d.id=id;if(i>0)d.style.display="none";
    d.innerHTML=_ph(t,n);bl.appendChild(d);
  });
  bin.appendChild(bl);m.appendChild(bin);

  // -- RIGHT COLUMN: preview + inspector --
  const rc=document.createElement("div");
  rc.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;";

  // Preview area
  const pv=document.createElement("div");
  pv.id="sc-preview";
  pv.style.cssText="flex:1;background:#050508;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;min-height:0;";
  pv.innerHTML="<div id='sc-preview-inner' style='text-align:center;'><div style='font-size:2rem;opacity:0.2;margin-bottom:8px;'>&#10022;</div><div style='font-size:0.62rem;color:var(--subtext);letter-spacing:0.1em;'>no clip selected</div></div><div style='position:absolute;top:10px;right:10px;font-size:0.52rem;color:var(--subtext);background:rgba(8,8,16,0.8);border:1px solid var(--border);border-radius:4px;padding:3px 7px;'><span id='sc-clip-count'>0</span> clips</div>";
  rc.appendChild(pv);

  // Inspector
  const ins=document.createElement("div");
  ins.id="sc-inspector";
  ins.style.cssText="border-top:1px solid var(--border);background:var(--surface);padding:10px 14px;flex-shrink:0;";
  ins.innerHTML=`
    <div style='font-size:0.52rem;color:var(--subtext);text-transform:uppercase;margin-bottom:8px;'>selected clip</div>
    <div style='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;'>
      <div><div style='font-size:0.52rem;color:var(--subtext);'>name</div><div id='sc-insp-name' style='font-size:0.7rem;color:var(--text);'>&#8212;</div></div>
      <div><div style='font-size:0.52rem;color:var(--subtext);'>mood</div><div id='sc-insp-mood' style='font-size:0.7rem;color:var(--teal);'>&#8212;</div></div>
      <div><div style='font-size:0.52rem;color:var(--subtext);'>est.</div><div id='sc-insp-dur' style='font-size:0.7rem;color:var(--subtext);'>~5s</div></div>
    </div>
    <textarea id='sc-prompt' placeholder='describe the scene, mood, motion...' style='width:100%;box-sizing:border-box;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-family:var(--font-ui);font-size:0.68rem;resize:none;outline:none;margin-bottom:8px;' rows='2'></textarea>
    <div style='display:flex;gap:6px;'>
      <button id='sc-btn-img' style='flex:1;padding:7px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--subtext);font-size:0.6rem;cursor:pointer;transition:border-color 0.15s;'>gen image <span style='color:var(--teal);font-size:0.55rem;'>5cr</span></button>
      <button id='sc-btn-vid' style='flex:1;padding:7px;background:rgba(0,246,214,0.08);border:1px solid var(--teal);border-radius:6px;color:var(--teal);font-size:0.6rem;cursor:pointer;font-weight:700;transition:all 0.15s;'>gen clip <span style='font-size:0.55rem;opacity:0.7;'>30cr</span></button>
      <button id='sc-btn-exp' style='flex:1;padding:7px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--subtext);font-size:0.6rem;cursor:pointer;'>&#8595; export</button>
    </div>
    <div id='sc-status' style='font-size:0.58rem;color:var(--subtext);margin-top:6px;min-height:16px;text-align:center;'></div>
  `;
  rc.appendChild(ins);m.appendChild(rc);el.appendChild(m);
}

function _tl(el){
  const d=document.createElement("div");
  d.style.cssText="border-top:2px solid var(--border);background:var(--surface);flex-shrink:0;height:110px;display:flex;flex-direction:column;overflow:hidden;";
  const hdr=document.createElement("div");
  hdr.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:5px 12px;border-bottom:1px solid var(--border);flex-shrink:0;";
  hdr.innerHTML="<div style='font-size:0.52rem;color:var(--subtext);text-transform:uppercase;'>storyboard</div><div style='display:flex;gap:6px;'><button id='sc-clear-btn' style='padding:3px 10px;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--subtext);font-size:0.56rem;cursor:pointer;'>clear</button><button id='sc-render-btn' style='padding:3px 10px;background:rgba(0,246,214,0.1);border:1px solid var(--teal);border-radius:4px;color:var(--teal);font-size:0.56rem;cursor:pointer;'>&#10022; render all</button></div>";
  d.appendChild(hdr);
  const track=document.createElement("div");
  track.id="sc-timeline";
  track.style.cssText="flex:1;overflow-x:auto;overflow-y:hidden;display:flex;align-items:center;gap:6px;padding:0 12px;";
  const hint=document.createElement("div");
  hint.id="sc-tl-empty";
  hint.style.cssText="font-size:0.6rem;color:var(--subtext);opacity:0.5;white-space:nowrap;";
  hint.textContent="&#10022; tap + on a scene to add";
  track.appendChild(hint);d.appendChild(track);el.appendChild(d);
}

function _ph(type,count){
  const lb={scene:"scene",world:"world",char:"char"};
  let h="";
  for(let i=1;i<=count;i++){
    const id=type+"_"+i;
    const nm=lb[type]+" "+i;
    const div=document.createElement("div");
    div.style.cssText="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px;";
    const label=document.createElement("div");
    label.style.cssText="font-size:0.65rem;color:var(--text);margin-bottom:4px;";
    label.textContent=nm;
    const btn=document.createElement("button");
    btn.style.cssText="width:100%;padding:3px;background:rgba(0,246,214,0.08);border:1px solid rgba(0,246,214,0.2);border-radius:4px;color:var(--teal);font-size:0.52rem;cursor:pointer;";
    btn.textContent="+ add";
    btn.onclick=()=>window._scAdd(id,nm,"electric");
    div.appendChild(label);div.appendChild(btn);
    h+=div.outerHTML;
  }
  return h;
}

// -- STATUS HELPER --
function _setStatus(msg, color){
  const el=document.getElementById("sc-status");
  if(!el)return;
  el.textContent=msg;
  el.style.color=color||"var(--subtext)";
}

// -- SHOW SPINNER IN PREVIEW --
function _showSpinner(){
  const inner=document.getElementById("sc-preview-inner");
  if(!inner)return;
  inner.innerHTML="<div style='display:flex;flex-direction:column;align-items:center;gap:12px;'><div style='width:32px;height:32px;border:3px solid rgba(0,246,214,0.15);border-top-color:#00F6D6;border-radius:50%;animation:sc-spin 0.85s linear infinite;'></div><div style='font-size:0.6rem;color:var(--subtext);letter-spacing:0.1em;'>generating...</div></div>";
  if(!document.getElementById("sc-spin-css")){
    const s=document.createElement("style");
    s.id="sc-spin-css";
    s.textContent="@keyframes sc-spin{to{transform:rotate(360deg);}}";
    document.head.appendChild(s);
  }
}

// -- SHOW VIDEO IN PREVIEW --
function _showVideo(url){
  const inner=document.getElementById("sc-preview-inner");
  if(!inner)return;
  inner.innerHTML="<video src='"+url+"' controls autoplay loop style='max-width:100%;max-height:100%;border-radius:6px;'></video>";
}

// -- SHOW IMAGE IN PREVIEW --
function _showImage(url){
  const inner=document.getElementById("sc-preview-inner");
  if(!inner)return;
  inner.innerHTML="<img src='"+url+"' style='max-width:100%;max-height:100%;border-radius:6px;object-fit:contain;' />";
}

// -- GET AUTH TOKEN --
async function _getToken(){
  if(window._scSession && window._scSession.access_token) return window._scSession.access_token;
  // fallback: try supabase directly
  if(window.sb){
    const {data}=await window.sb.auth.getSession();
    if(data?.session?.access_token) return data.session.access_token;
  }
  return null;
}

const RAIL="https://web-production-4e6f3.up.railway.app";

// -- GEN CLIP (VIDEO) --
async function _genClip(){
  const prompt=document.getElementById("sc-prompt").value.trim();
  if(!prompt){_setStatus("enter a prompt first","#FF4BCB");return;}
  const token=await _getToken();
  if(!token){_setStatus("not signed in","#FF4BCB");return;}
  const btn=document.getElementById("sc-btn-vid");
  btn.disabled=true;btn.textContent="generating...";
  _showSpinner();
  _setStatus("sending to PixVerse... (up to 60s)","var(--subtext)");
  try{
    const r=await fetch(RAIL+"/generate-video",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({prompt:"2D anime cel shading flat style bloomcore aesthetic "+prompt,duration:5})
    });
    const d=await r.json();
    if(!r.ok){_setStatus(d.detail||"generation failed","#FF4BCB");_resetPreview();return;}
    _showVideo(d.video_url);
    _setStatus("done! "+d.credits_remaining+" credits left","#00F6D6");
  }catch(e){
    _setStatus("connection error","#FF4BCB");
    _resetPreview();
  }finally{
    btn.disabled=false;btn.textContent="gen clip 30cr";
  }
}

// -- GEN IMAGE --
async function _genImage(){
  const prompt=document.getElementById("sc-prompt").value.trim();
  if(!prompt){_setStatus("enter a prompt first","#FF4BCB");return;}
  const token=await _getToken();
  if(!token){_setStatus("not signed in","#FF4BCB");return;}
  const btn=document.getElementById("sc-btn-img");
  btn.disabled=true;btn.textContent="generating...";
  _showSpinner();
  _setStatus("generating image...","var(--subtext)");
  try{
    const r=await fetch(RAIL+"/generate-image",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({prompt:"2D anime cel shading flat style bloomcore aesthetic "+prompt,model:"flux-schnell"})
    });
    const d=await r.json();
    if(!r.ok){_setStatus(d.detail||"generation failed","#FF4BCB");_resetPreview();return;}
    _showImage(d.image_url||d.url);
    _setStatus("done!","#00F6D6");
  }catch(e){
    _setStatus("connection error","#FF4BCB");
    _resetPreview();
  }finally{
    btn.disabled=false;btn.textContent="gen image 5cr";
  }
}

function _resetPreview(){
  const inner=document.getElementById("sc-preview-inner");
  if(!inner)return;
  inner.innerHTML="<div style='text-align:center;'><div style='font-size:2rem;opacity:0.2;margin-bottom:8px;'>&#10022;</div><div style='font-size:0.62rem;color:var(--subtext);letter-spacing:0.1em;'>no clip selected</div></div>";
}

function _wire(){
  let clips=[];
  document.querySelectorAll(".sc-atab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".sc-atab").forEach(b=>{b.style.borderBottomColor="transparent";b.style.color="var(--subtext)";});
      btn.style.borderBottomColor="var(--teal)";btn.style.color="var(--teal)";
      document.querySelectorAll("[id^=sc-bin-]").forEach(d=>d.style.display="none");
      document.getElementById(btn.dataset.bin).style.display="block";
    });
  });
  window._scAdd=(id,name,mood)=>{
    clips.push({id,name,mood});
    _rtl();
    document.getElementById("sc-clip-count").textContent=clips.length;
    document.getElementById("sc-insp-name").textContent=name;
    document.getElementById("sc-insp-mood").textContent=mood;
    document.getElementById("sc-prompt").placeholder="describe "+name+"...";
  };
  document.getElementById("sc-clear-btn").onclick=()=>{clips=[];_rtl();document.getElementById("sc-clip-count").textContent="0";};
  document.getElementById("sc-render-btn").onclick=()=>{if(clips.length)_setStatus("render all: coming soon","var(--subtext)");};
  document.getElementById("sc-btn-vid").addEventListener("click",_genClip);
  document.getElementById("sc-btn-img").addEventListener("click",_genImage);
  document.getElementById("sc-btn-exp").addEventListener("click",()=>{
    const vid=document.querySelector("#sc-preview-inner video");
    const img=document.querySelector("#sc-preview-inner img");
    const url=vid?vid.src:img?img.src:null;
    if(url){const a=document.createElement("a");a.href=url;a.download="spiralcut-"+Date.now()+".mp4";a.target="_blank";a.click();}
    else _setStatus("nothing to export yet","var(--subtext)");
  });
  function _rtl(){
    const tl=document.getElementById("sc-timeline");
    const em=document.getElementById("sc-tl-empty");
    tl.querySelectorAll(".sc-tl-clip").forEach(c=>c.remove());
    em.style.display=clips.length?"none":"block";
    clips.forEach((c,i)=>{
      const d=document.createElement("div");
      d.className="sc-tl-clip";
      d.style.cssText="flex-shrink:0;width:78px;height:72px;background:var(--surface2);border:1px solid var(--teal);border-radius:6px;padding:6px;cursor:pointer;position:relative;display:flex;flex-direction:column;justify-content:space-between;";
      const n=document.createElement("div");n.style.cssText="font-size:0.58rem;color:var(--teal);";n.textContent="#"+(i+1);
      const nm=document.createElement("div");nm.style.cssText="font-size:0.56rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";nm.textContent=c.name;
      const dur=document.createElement("div");dur.style.cssText="font-size:0.48rem;color:var(--subtext);";dur.textContent="~5s";
      const del=document.createElement("button");
      del.style.cssText="position:absolute;top:3px;right:3px;background:none;border:none;color:var(--subtext);font-size:0.58rem;cursor:pointer;";
      del.textContent="x";
      del.onclick=e=>{e.stopPropagation();d.remove();};
      d.appendChild(n);d.appendChild(nm);d.appendChild(dur);d.appendChild(del);
      d.onclick=()=>{
        document.getElementById("sc-insp-name").textContent=c.name;
        document.getElementById("sc-insp-mood").textContent=c.mood||"&#8212;";
        document.getElementById("sc-prompt").placeholder="describe "+c.name+"...";
      };
      tl.appendChild(d);
    });
  }
}
