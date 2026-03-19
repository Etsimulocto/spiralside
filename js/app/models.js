// SPIRALSIDE - MODEL SELECTOR v2.0 // Nimbis anchor: js/app/models.js
export let selectedModel = 'haiku';
let panelOpen=false,sttEnabled=true,ttsEnabled=false,recognition=null,isRecording=false;
export const MODELS={haiku:{label:'Haiku',cost_in:0.80,cost_out:4.00},'4o':{label:'Sky / 4o',cost_in:0.15,cost_out:0.60},sonnet:{label:'Sonnet',cost_in:3.00,cost_out:15.00}};
const MARGIN=1.17,AVG_IN=500,AVG_OUT=200;
function estimateCost(k){const m=MODELS[k];if(!m)return '';return ((m.cost_in*AVG_IN+m.cost_out*AVG_OUT)/1000000*MARGIN/0.00001).toFixed(0);}
export function selectModel(m){selectedModel=m;window.selectedModel=m;_renderRows();_updateIndicator();}
export function toggleInputMenu(){panelOpen=!panelOpen;
  const panel=document.getElementById('options-panel');const btn=document.getElementById('plus-btn');
  if(!panel)return;panel.classList.toggle('open',panelOpen);if(btn)btn.classList.toggle('active',panelOpen);
  if(panelOpen)setTimeout(()=>document.addEventListener('click',_outside),10);else document.removeEventListener('click',_outside);}
function _outside(e){const panel=document.getElementById('options-panel');const btn=document.getElementById('plus-btn');
  if(panel&&btn&&!panel.contains(e.target)&&e.target!==btn){panelOpen=false;panel.classList.remove('open');btn.classList.remove('active');document.removeEventListener('click',_outside);}}
export function togglePanelSection(id){const body=document.getElementById('psec-'+id);const chev=document.getElementById('pchev-'+id);if(!body)return;const open=body.classList.toggle('open');if(chev)chev.textContent=open?'▲':'▼';}
export function updateInputMenu(){_renderRows();_updateIndicator();}
function _renderRows(){Object.keys(MODELS).forEach(k=>{const row=document.getElementById('mrow-'+k);const chk=document.getElementById('mcheck-'+k);if(row)row.classList.toggle('active',k===selectedModel);if(chk)chk.classList.toggle('on',k===selectedModel);const cost=document.getElementById('mcost-'+k);if(cost)cost.textContent='-'+estimateCost(k)+' cr';});}
function _updateIndicator(){const el=document.getElementById('model-indicator-label');if(!el)return;const m=MODELS[selectedModel];el.textContent=m?m.label.toLowerCase()+' · ~'+estimateCost(selectedModel)+' cr':'';}
function _initSTT(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;recognition=new SR();recognition.continuous=false;recognition.interimResults=false;recognition.lang='en-US';
  recognition.onresult=e=>{const t=e.results[0][0].transcript;const inp=document.getElementById('msg-input');if(inp){inp.value=t;inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,100)+'px';}};
  recognition.onend=()=>{isRecording=false;_updateMic();};recognition.onerror=()=>{isRecording=false;_updateMic();};}
export function toggleMic(){if(!sttEnabled)return;if(!recognition)_initSTT();if(!recognition)return;if(isRecording){recognition.stop();isRecording=false;}else{recognition.start();isRecording=true;}_updateMic();}
function _updateMic(){const btn=document.getElementById('mic-btn');if(!btn)return;btn.classList.toggle('recording',isRecording);btn.title=isRecording?'stop recording':'speak';}
export function speakReply(text){if(!ttsEnabled||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=0.95;u.pitch=1.0;window.speechSynthesis.speak(u);}
export function toggleSTT(){sttEnabled=!sttEnabled;const tog=document.getElementById('tog-stt');const mic=document.getElementById('mic-btn');if(tog)tog.classList.toggle('on',sttEnabled);if(mic)mic.style.display=sttEnabled?'flex':'none';}
export function toggleTTS(){ttsEnabled=!ttsEnabled;const tog=document.getElementById('tog-tts');if(tog)tog.classList.toggle('on',ttsEnabled);}
export function initModels(){_initSTT();_renderRows();_updateIndicator();}
window.selectModel=selectModel;window.toggleInputMenu=toggleInputMenu;window.updateInputMenu=updateInputMenu;
window.togglePanelSection=togglePanelSection;window.toggleMic=toggleMic;window.toggleSTT=toggleSTT;window.toggleTTS=toggleTTS;window.selectedModel=selectedModel;
