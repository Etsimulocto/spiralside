// ============================================================
// SPIRALSIDE — MAIN v1.0
// Boot sequence — imports all modules, wires globals, starts app
// This is the single entry point loaded by index.html
// Nimbis anchor: js/app/main.js
// ============================================================

import { initComic, playCustomComic }              from './comic.js';
import { initColorSketches, recolorSketch } from './colorSketches.js';
import { initSky } from './sky.js';
import { sb, checkAuthAndShow, listenAuthChanges,
         handleLogin, handleSignup, handleSignout,
         switchAuthTab, togglePw }                 from './auth.js';
import { initDB, dbGet, dbGetAll, dbSet }          from './db.js';
import { initChat, addMessage }                    from './chat.js';
import { buildCharSelector, renderActiveChar,
         saveSummarize, loadSavedSheets, exportCodex, importCodex }          from './sheet.js';
import { initVault, renderVault,
         removeFile, loadVaultFromDB }             from './vault.js';
import { initMusic }          from './music.js';
import { initImagine, injectImagineStyles }    from './imagine2.js';
import { initMusicView, destroyMusicView } from './musicview.js';
import { initBuild, loadBotIntoForm }              from './build.js';
import { initCodex, openSceneForm, openWorldForm,
         downloadCodexCard, deleteCodexCard }          from './codex.js';
import { initLibrary, openPanelEditor, deletePanel,
         openBookBuilder, addPanelToBook,
         removePanelFromBook, movePanelInBook,
         deleteBook, saveImageToLibrary }          from './library.js';
import { buildFAB, toggleFAB, switchView, setFontSize, loadFontSize,

         loadUsage, updateCreditDisplay,
         updateGreeting, updateUserUI,
         buyPack, handlePayPalReturn,
         restoreTabOrder, initTabDrag }        from './ui.js';
import { state }                                   from './state.js';
import { selectModel, toggleInputMenu, updateInputMenu, initModels } from './models.js';
import { initStoreView, updateStoreView }          from './views/store.js';
import { initSpiralCutView }                       from './views/spiralcut.js';
import { initStudioView }                          from './views/studio.js';
import { initGuide, renderGuide } from './views/guide.js';
import { initForgeView }           from './views/forge.js';
import { initAccountView, updateAccountView }      from './views/account.js';
import { initVaultView } from './views/vault.js';

// ── EXPOSE GLOBALS ────────────────────────────────────────────
// HTML onclick attributes need these on window.
window.initColorSketches = initColorSketches;
window.recolorSketch = recolorSketch;
// Only expose what's called from inline HTML.
window.switchAuthTab     = switchAuthTab;
window.togglePw          = togglePw;
window.handleLogin       = handleLogin;
window.handleSignup      = handleSignup;
window.handleSignout     = () => handleSignout(() => {});
window.openPanel         = (tab) => window.switchView(tab === 'store' ? 'store' : tab === 'style' ? 'style' : 'account');
window.setFontSize        = setFontSize;
window.closePanel        = () => {};
window.switchPanelTab    = (tab) => window.switchView(tab);
window.toggleFAB         = toggleFAB;
window.switchView        = switchView;
window.initPiView        = () => {
  const el = document.getElementById('view-pi');
  if (!el || el.dataset.initialized) return;
  el.dataset.initialized = '1';
  import('./views/pi.js').then(({ initPiView }) => initPiView());
};
window.initCodeView      = () => {
  const el = document.getElementById('view-code');
  if (!el || el.dataset.initialized) return;
  el.dataset.initialized = '1';
  import('./views/code.js').then(({ injectCodeStyles, renderCode }) => {
    injectCodeStyles();
    renderCode(el);
  });
};
window.buyPack           = buyPack;
window.updateCreditDisplay = updateCreditDisplay;
window.saveSummarize     = saveSummarize;
window.initMusicView     = initMusicView;
window.initImagine        = initImagine;
window.initStoreView      = initStoreView;
window.updateStoreView    = updateStoreView;
window.initAccountView    = initAccountView;
window.updateAccountView   = updateAccountView;
window.initGuideView      = initGuide;
window.initForgeView      = initForgeView;
window.destroyMusicView  = destroyMusicView;
window.removeFile        = removeFile;
window.openPanelEditor   = openPanelEditor;
window.deletePanel       = deletePanel;
window.openBookBuilder   = openBookBuilder;
window.addPanelToBook    = addPanelToBook;
window.removePanelFromBook = removePanelFromBook;
window.movePanelInBook   = movePanelInBook;
window.deleteBook        = deleteBook;
window.saveImageToLibrary = saveImageToLibrary;
window.playCustomComic      = playCustomComic;
window.openSceneForm        = openSceneForm;
window.openWorldForm        = openWorldForm;
window.downloadCodexCard    = downloadCodexCard;
window.deleteCodexCard      = deleteCodexCard;
window.initStudioView       = initStudioView;
window.initSpiralCutView    = initSpiralCutView;
window.closeSceneForm       = () => document.getElementById('codex-scene-form-overlay')?.classList.remove('open');
window.closeWorldForm       = () => document.getElementById('codex-world-form-overlay')?.classList.remove('open');

// ── APP READY ─────────────────────────────────────────────────
// Called after auth check confirms a valid session
async function onAppReady() {
  initSky(); // living sky — Nimbis
  // 1. Open IndexedDB
  await initDB();

  // 2. Load persisted bot config
  const bot = await dbGet('config', 'bot');
  if (bot) {
    state.botName        = bot.name        || 'Sky';
    state.botPersonality = bot.personality || '';
    state.botGreeting    = bot.greeting    || "Hey. I'm here.";
    state.botTone        = bot.tone        || [];
    state.botColor       = bot.color       || '#00F6D6';
  }

  // 3. Load persisted vault files
  const vaultFiles = await dbGetAll('vault');
  loadVaultFromDB(vaultFiles);

  // 4. Load saved character sheet overrides
  await loadSavedSheets(dbGet);

  // 5. Init all modules
  initModels();
  initChat(openPanel);
  initVault();
  initBuild();
  initLibrary();
  buildFAB();
  await restoreTabOrder();  // restore saved tab order from IDB
  initTabDrag();            // wire drag-to-reorder

  // 6. Populate forms and UI
  loadBotIntoForm();
  updateUserUI();
  loadFontSize();
  updateGreeting();
  buildCharSelector();
  renderActiveChar('sky');

  // 7. Load credit usage from server
  loadUsage();

  // 8. Handle any PayPal return redirect
  handlePayPalReturn();
  initMusic();  // start background music
}

// ── BOOT ──────────────────────────────────────────────────────
// 1. Start comic intro
// 2. When comic ends → check auth → route to app or auth screen
listenAuthChanges();
initComic(() => checkAuthAndShow(onAppReady));


// ── STYLE MODULE ──────────────────────────────────────────────
import {
  initStylePanel, applyThemePreset, previewColor, selectBgType,
  previewScanlines, selectBubbleShape, selectFont, previewSlider, setFontRole, selectFontUnified,
  applyAndSaveStyle, resetStyle, updateParticleDensity, loadSavedStyle, initSlots, saveSlot, loadSlot, updateParticleSpeed, updateParticleSize, updateParticleColor, updateGridSize, updateGridOpacity, updateGridColor, loadBgImage, updateBgImageOpacity, updateBgImageFit, toggleBgLayer, applyAllBgLayers, syncBgToggles, loadBgPresets, selectBgPreset
} from './style.js';

window.initStylePanel       = initStylePanel;
window.initVaultView = initVaultView;
window.initVault    = initVault;
window.renderVault  = renderVault;
window.applyThemePreset     = applyThemePreset;
window.previewColor         = previewColor;
window.selectBgType         = selectBgType;
window.previewScanlines     = previewScanlines;
window.selectBubbleShape    = selectBubbleShape;
window.selectFont           = selectFont;
window.setFontRole          = setFontRole;
window.selectFontUnified    = selectFontUnified;
window.previewSlider        = previewSlider;
window.applyAndSaveStyle    = applyAndSaveStyle;
window.resetStyle           = resetStyle;
window.saveSlot             = saveSlot;
window.loadSlot             = loadSlot;
window.updateParticleSpeed  = updateParticleSpeed;
window.updateParticleSize   = updateParticleSize;
window.updateParticleColor  = updateParticleColor;
window.updateGridSize       = updateGridSize;
window.updateGridOpacity    = updateGridOpacity;
window.updateGridColor      = updateGridColor;
window.loadBgImage          = loadBgImage;
window.updateBgImageOpacity = updateBgImageOpacity;
window.updateBgImageFit     = updateBgImageFit;
window.toggleBgLayer        = toggleBgLayer;
window.applyAllBgLayers     = applyAllBgLayers;
window.syncBgToggles        = syncBgToggles;
window.loadBgPresets        = loadBgPresets;
window.selectBgPreset       = selectBgPreset;
window.updateParticleDensity = updateParticleDensity;

loadSavedStyle();
initSlots();

window.sendGift = async function() {
  const amtEl = document.getElementById('gift-amount-input');
  const msg = document.getElementById('gift-msg');
  const credits = parseInt(amtEl?.value);
  if (!credits || credits < 1000) { if(msg){msg.textContent='Min 1,000 cr.';msg.className='gift-msg err';} return; }
  if (!state.user){alert('Sign in first.');return;}
  try {
    let token = state.session?.access_token;
    if (!token){const{data}=await sb.auth.getSession();token=data?.session?.access_token;}
    const r = await fetch('https://web-production-4e6f3.up.railway.app/send-gift',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({credits})});
    const d = await r.json();
    if(!r.ok){if(msg){msg.textContent=d.detail||'Error.';msg.className='gift-msg err';}return;}
    if(msg){msg.textContent='Code: '+d.code+' — '+credits.toLocaleString()+' cr sent!';msg.className='gift-msg ok';}
    if(amtEl)amtEl.value='';
    loadUsage();
  } catch(e){if(msg){msg.textContent='Connection error.';msg.className='gift-msg err';}}
};
window.redeemGift = async function() {
  const codeEl = document.getElementById('gift-code-input');
  const msg = document.getElementById('gift-msg');
  const code = codeEl?.value?.trim().toUpperCase();
  if (!code || code.length < 12){if(msg){msg.textContent='Enter a valid code.';msg.className='gift-msg err';}return;}
  if (!state.user){alert('Sign in first.');return;}
  try {
    let token = state.session?.access_token;
    if (!token){const{data}=await sb.auth.getSession();token=data?.session?.access_token;}
    const r = await fetch('https://web-production-4e6f3.up.railway.app/redeem-gift',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({code})});
    const d = await r.json();
    if(!r.ok){if(msg){msg.textContent=d.detail||'Error.';msg.className='gift-msg err';}return;}
    if(msg){msg.textContent=d.credits_added.toLocaleString()+' credits added!';msg.className='gift-msg ok';}
    if(codeEl)codeEl.value='';
    loadUsage();
  } catch(e){if(msg){msg.textContent='Connection error.';msg.className='gift-msg err';}}
};
window.buyGift = async function() {
  if (!state.user){alert('Sign in first.');return;}
  try {
    let token = state.session?.access_token;
    if (!token){const{data}=await sb.auth.getSession();token=data?.session?.access_token;}
    const r = await fetch('https://web-production-4e6f3.up.railway.app/create-order',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({amount:'5',gift:true})});
    const d = await r.json();
    if(!r.ok){alert(d.detail||'Payment error.');return;}
    localStorage.setItem('pending_gift_order',d.order_id);
    window.location.href = d.approve_url;
  } catch(e){alert('Payment error. Try again.');}
};
