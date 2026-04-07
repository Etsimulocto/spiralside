// ============================================================
import { initParticles } from "./particles.js";
import { initBloomslice } from "./bloomslice.js";
import { initBloomEngine } from "./views/bloomengine.js";
import { initSpiral }      from './views/spiral.js';
// SPIRALSIDE — MAIN v1.0
// Boot sequence — imports all modules, wires globals, starts app
// This is the single entry point loaded by index.html
// Nimbis anchor: js/app/main.js
import { syncLoad } from './sync.js';
import { exportSoulPrintPDF, exportUserData, importUserData } from './views/account.js';
import { CHARACTERS } from './state.js';
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
import { initImagine, injectImagineStyles }    from './imagine.js';
import { initMusicView, destroyMusicView } from './musicview.js';
import { initBuild, loadBotIntoForm }              from './build.js';
import { initCodex, openSceneForm, openWorldForm,
         downloadCodexCard, deleteCodexCard }          from './codex.js';
import { initLibrary, openPanelEditor, deletePanel,
         openBookBuilder, addPanelToBook,
         removePanelFromBook, movePanelInBook,
         deleteBook, saveImageToLibrary,
         openBookTimeline }              from './library.js';
import { buildFAB, toggleFAB, switchView, setFontSize, loadFontSize,

         loadUsage, updateCreditDisplay,
         updateGreeting, updateUserUI,
         buyPack, handlePayPalReturn,
         restoreTabOrder, initTabDrag }        from './ui.js';
import { state }                                   from './state.js';
import { selectModel, toggleInputMenu, updateInputMenu, initModels } from './models.js';
import { initStoreView, updateStoreView }          from './views/store.js';
import { initSpiralCutView }                       from './views/spiralcut.js';
import { initQuestView }                           from './views/quest.js';
import { initCutView } from './views/cut.js';
import { initXP, awardXP, getXPState, awardGold, spendGold, addItem, consumeItem, showLevelUpToast, showXPGain } from './xp.js';
import { initStudioView }                          from './views/studio.js';
import { initGuide, renderGuide } from './views/guide.js';
import { initForgeView }           from './views/forge.js';
import { initAccountView, updateAccountView }      from './views/account.js';
import { initVaultView } from './views/vault.js';
import { initFramesView } from '../frames/frames.js';
import { opfsWrite, opfsList, opfsEstimate, opfsSupported, opfsSize } from './opfs.js';

// ── EXPOSE GLOBALS ────────────────────────────────────────────
// HTML onclick attributes need these on window.
window.initColorSketches = initColorSketches;
window.recolorSketch = recolorSketch;
// Only expose what's called from inline HTML.
window.switchAuthTab     = switchAuthTab;
window._sb               = sb;
window.togglePw          = togglePw;
window.handleLogin       = handleLogin;
window.handleSignup      = handleSignup;
window._exportSoulPrint = exportSoulPrintPDF;
window.CHARACTERS       = CHARACTERS;
window._exportJSON      = exportUserData;
window._importJSON      = importUserData;
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
window.initBloomsliceView = initBloomslice;
window.initBloomEngineView = initBloomEngine;
window.initSpiralView     = initSpiral;
window.initForgeView      = initForgeView;
window.destroyMusicView  = destroyMusicView;
window.removeFile        = removeFile;
window.openPanelEditor   = openPanelEditor;
window.deletePanel       = deletePanel;
window.openBookBuilder   = openBookBuilder;
window.openBookTimeline  = openBookTimeline;
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
window.initQuestView    = initQuestView;
window.initCutView     = initCutView;
window.initFramesView  = initFramesView;
// OPFS globals — auto-save to device storage
window.opfsWrite     = opfsWrite;
window.opfsList      = opfsList;
window.opfsEstimate  = opfsEstimate;
window.opfsSupported = opfsSupported;
window.opfsSize      = opfsSize;
window.awardXP    = awardXP;
window.getXPState = getXPState;
window.showXPGain = showXPGain;
window.awardGold  = awardGold;
window.spendGold  = spendGold;
window.addItem    = addItem;
window.consumeItem= consumeItem;
window.closeSceneForm       = () => document.getElementById('codex-scene-form-overlay')?.classList.remove('open');
window.closeWorldForm       = () => document.getElementById('codex-world-form-overlay')?.classList.remove('open');

// ── APP READY ─────────────────────────────────────────────────
// Called after auth check confirms a valid session

// ── SEED BUILT-IN PRINTS ─────────────────────────────────────
async function seedBuiltInPrints() {
  const builtIns = [
    { id:'builtin_sky',    name:'Sky',    color:'#00F6D6', title:'The Companion',   vibe:'the sky at 4am', firstWords:"Hey. I'm here.",        stats:{Presence:95,Mystery:60,Warmth:88,Patience:91} },
    { id:'builtin_monday', name:'Monday', color:'#FF4BCB', title:'The Loudest One', vibe:'energy drink at midnight', firstWords:'OKAY but can we talk about—', stats:{Energy:99,Loyalty:94,Impulse:88,Heart:91} },
    { id:'builtin_cold',   name:'Cold',   color:'#4DA3FF', title:'The Quiet One',   vibe:'the moment before it rains', firstWords:'...',         stats:{Presence:97,Mystery:95,Precision:93,Warmth:41} },
    { id:'builtin_grit',   name:'GRIT',   color:'#FFD93D', title:'The Builder',     vibe:'calluses and coffee', firstWords:'What are we building?', stats:{Street_Sense:94,Bluntness:89,Heart:77,Mystery:65} },
    { id:'builtin_you',    name:'You',    color:'#7B5FFF', title:'The One Who Showed Up', vibe:'still here', firstWords:'...', stats:{Curiosity:50,Creativity:50,Chaos_Level:50,Trust:50} },
  ];
  for (const c of builtIns) {
    try {
      const existing = await dbGet('prints', c.id);
      if (existing) continue;
      const statsObj = {};
      Object.entries(c.stats).forEach(([k,v]) => { statsObj[k.toLowerCase()] = {value:v,max:100,description:''}; });
      await dbSet('prints', {
        id: c.id, card_id: c.id,
        schema_version: 'spiralside_print_v1',
        template_type: 'archetype',
        identity: { name:c.name, title:c.title, vibe:c.vibe, first_words:c.firstWords, tone_tags:[] },
        appearance:{}, personality:{}, story:{backstory:'',current_arc:'',affiliations:'',theme_song:''},
        stats: statsObj, flavor:{},
        portrait_base64: null,
        metadata:{ owner_id:'system', visibility:'public', is_archetype:true,
          created_at:new Date().toISOString(), updated_at:new Date().toISOString() },
        _color: c.color,
      });
    } catch(e) { /* skip */ }
  }
}

// ── CLOUD HYDRATION ──────────────────────────────────────────────────────
// On every login, pull style_prefs + quest_char from Supabase.
// Runs before UI renders so the user sees their real theme immediately.
// Fully silent on failure — localStorage / defaults win if cloud unreachable.
async function hydrateFromCloud() {
  // ── Style prefs ──────────────────────────────────────────
  // Only hydrate if localStorage has nothing — loadSavedStyle() already
  // applied local style before onAppReady ran, so re-applying here causes flash
  try {
    const _hasLocalStyle = localStorage.getItem('ss_style');
    if (!_hasLocalStyle) {
      const cloudStyle = await syncLoad('style_prefs');
      if (cloudStyle) {
        const { setPendingStyle, applyStyleVars } = await import('./style.js');
        setPendingStyle(cloudStyle);
        applyStyleVars(cloudStyle);
        localStorage.setItem('ss_style', JSON.stringify(cloudStyle));
        console.log('[sync] style_prefs hydrated from cloud');
      }
    }
  } catch(e) { console.warn('[sync] style hydration failed:', e); }

  // ── Quest char — seed localStorage if fresh device ───────
  try {
    const cloudChar = await syncLoad('quest_char');
    if (cloudChar) {
      const localRaw = localStorage.getItem('ss_quest_char');
      const localChar = localRaw ? JSON.parse(localRaw) : null;
      // Only write cloud char if local is missing OR cloud has strictly higher total stats
      // This prevents cloud (which may be older/stripped) from overwriting battle progress
      const cloudTotal = (cloudChar.atk||0) + (cloudChar.def||0) + (cloudChar.wit||0) + (cloudChar.luk||0);
      const localTotal = localChar ? ((localChar.atk||0) + (localChar.def||0) + (localChar.wit||0) + (localChar.luk||0)) : -1;
      if (!localChar || cloudTotal > localTotal) {
        localStorage.setItem('ss_quest_char', JSON.stringify(cloudChar));
        console.log('[sync] quest_char hydrated from cloud (stats:', cloudTotal.toFixed(1), ')');
      } else {
        console.log('[sync] quest_char kept local (local stats:', localTotal.toFixed(1), '> cloud:', cloudTotal.toFixed(1), ')');
      }
    }
  } catch(e) { console.warn('[sync] quest_char hydration failed:', e); }
}

// ── DATA HYDRATION (runs after loadSavedSheets) ──────────────────────────────
// Overlays cloud you_card + prints onto already-loaded CHARACTERS + IDB.
// No race conditions — IDB is open, CHARACTERS is populated.
async function hydrateDataFromCloud(dbSet, dbGet) {
  // ── You card ──
  try {
    const cloudYou = await syncLoad('you_card');
    if (cloudYou && cloudYou.handle) {
      // Write into IDB via the already-open connection
      await dbSet('sheets', { ...cloudYou, id: 'you' });
      // Also patch CHARACTERS.you directly so UI reflects it immediately
      const { CHARACTERS: _C } = await import('./state.js');
      if (_C && _C.you) {
        Object.assign(_C.you, cloudYou);
        window._youHandle = cloudYou.handle || window._youHandle;
        try { renderActiveChar('you'); } catch(_) {}
      }
      console.log('[sync] you_card overlaid from cloud');
    }
  } catch(e) { console.warn('[sync] you_card overlay failed:', e); }

  // ── Scenes ──
  try {
    const { syncLoadAll } = await import('./sync.js');
    const allRecs = await syncLoadAll();
    const sceneRecs = allRecs.filter(r => r.record_type.startsWith('scene_'));
    for (const rec of sceneRecs) {
      const id = rec.data?.id;
      if (!id) continue;
      const existing = await dbGet('scenes', id);
      if (!existing || !existing.created_at) {
        await dbSet('scenes', { ...rec.data, id });
      }
    }
    if (sceneRecs.length) console.log('[sync] ' + sceneRecs.length + ' scenes synced from cloud');
  } catch(e) { console.warn('[sync] scenes hydration failed:', e); }

  // ── Worlds ──
  try {
    const { syncLoadAll: _sla } = await import('./sync.js');
    const allRecs2 = await _sla();
    const worldRecs = allRecs2.filter(r => r.record_type.startsWith('world_'));
    for (const rec of worldRecs) {
      const id = rec.data?.id;
      if (!id) continue;
      const existing = await dbGet('worlds', id);
      if (!existing || !existing.created_at) {
        await dbSet('worlds', { ...rec.data, id });
      }
    }
    if (worldRecs.length) console.log('[sync] ' + worldRecs.length + ' worlds synced from cloud');
  } catch(e) { console.warn('[sync] worlds hydration failed:', e); }

  // ── User prints ──
  try {
    const { syncLoadAll } = await import('./sync.js');
    const allRecords = await syncLoadAll();
    const printRecords = allRecords.filter(r => r.record_type.startsWith('print_'));
    for (const rec of printRecords) {
      if (rec.data?.metadata?.is_archetype) continue;
      const id = rec.data.id || rec.data.card_id;
      if (!id) continue;
      const existing = await dbGet('prints', id);
      // Only write if cloud is newer or local has nothing
      if (!existing || (rec.updated_at && existing.updated_at && rec.updated_at > existing.updated_at) || !existing.updated_at) {
        await dbSet('prints', { ...rec.data, id });
      }
    }
    if (printRecords.length > 0) {
      console.log('[sync] ' + printRecords.length + ' prints synced from cloud');
      // Rebuild char selector so new chips appear
      const { buildCharSelector, renderActiveChar } = await import('./sheet.js');
      buildCharSelector();
    }
  } catch(e) { console.warn('[sync] prints overlay failed:', e); }

  // Fire event so quest view re-renders char with fresh You card data
  window.dispatchEvent(new CustomEvent('cloud:hydrated'));
}

async function onAppReady() {
  // Hydrate from cloud before anything else renders
  await hydrateFromCloud();
  initSky(); // living sky — Nimbis
  // 1. Open IndexedDB
  await initDB();
  await seedBuiltInPrints();

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
  // 4b. Overlay cloud data on top of IDB — cloud wins for you_card + prints
  // Runs after loadSavedSheets so CHARACTERS is already populated,
  // we just overwrite with fresher cloud data if available
  await hydrateDataFromCloud(dbSet, dbGet);
  // 5. Init XP engine — loads state, handles day reset, daily login bonus
  await initXP();
  // Wire level-up toast + XP gain indicator to XP events
  window.addEventListener('xp:levelup', e => showLevelUpToast(e.detail.level));

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

// ── PWA INSTALL PROMPT ───────────────────────────────────────
// Capture the beforeinstallprompt event so we can trigger it from a button
// Only fires on Chrome/Edge when the app is installable (not already installed)
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();  // stop browser showing its own mini-bar
  _installPrompt = e;
  // Show our install button wherever it lives
  document.querySelectorAll('.pwa-install-btn').forEach(b => b.style.display = 'flex');
  console.log('[pwa] install prompt ready');
});

// Called by the install button
window.triggerInstall = async function() {
  if (!_installPrompt) return;
  _installPrompt.prompt();
  const { outcome } = await _installPrompt.userChoice;
  console.log('[pwa] user choice:', outcome);
  _installPrompt = null;
  if (outcome === 'accepted') {
    // Hide install buttons — already installed
    document.querySelectorAll('.pwa-install-btn').forEach(b => b.style.display = 'none');
  }
};

// Detect if already running as installed PWA
window._isPWA = window.matchMedia('(display-mode: standalone)').matches
             || window.navigator.standalone === true;

// ── BOOT ──────────────────────────────────────────────────────
// 1. Start comic intro
// 2. When comic ends → check auth → route to app or auth screen
listenAuthChanges();
// On startup: try to play the user's most recent book as the intro comic.
// Does a raw IDB peek (before full initDB) to check for books with slots.
// Falls back to normal intro if none found.
// Raw IDB read — no initDB needed, just opens spiralside directly
function _peekIDB(storeName) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve([]); return; }
        const tx = db.transaction(storeName, 'readonly');
        const all = tx.objectStore(storeName).getAll();
        all.onsuccess = () => { db.close(); resolve(all.result || []); };
        all.onerror  = () => { db.close(); resolve([]); };
      };
      req.onerror = () => resolve([]);
    } catch(e) { resolve([]); }
  });
}
function _peekIDBBooks()  { return _peekIDB('books'); }
function _peekIDBPanels() { return _peekIDB('panels'); }
function _peekIDBConfig(key) {
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('spiralside');
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('config')) { db.close(); resolve(null); return; }
        const tx  = db.transaction('config', 'readonly');
        const get = tx.objectStore('config').get(key);
        get.onsuccess = () => { db.close(); resolve(get.result?.value ?? null); };
        get.onerror   = () => { db.close(); resolve(null); };
      };
      req.onerror = () => resolve(null);
    } catch(e) { resolve(null); }
  });
}

// Boot: user book REPLACES Sky intro if one exists
// Flow: peek IDB → if book found play it then auth, else normal initComic then auth
const _authCallback = () => checkAuthAndShow(onAppReady);

(async () => {
  // peek IDB before anything plays — no initDB needed
  let playedUserBook = false;
  try {
    const books  = await _peekIDBBooks();
    const introId = await _peekIDBConfig('intro_book_id');
    // Only replace Sky intro if user has explicitly set an intro book
    // Without an explicit introId, always show Sky's intro
    if (!introId) {
      if (!playedUserBook) initComic(_authCallback);
      return;
    }

    const valid  = (books || [])
      .filter(b => b.id === introId && b.slots && b.slots.some(s => s.type==='image' || (s.type==='text' && s.text)));

    if (valid.length) {
      const book   = valid[0];
      const panels = await _peekIDBPanels();
      const panelMap = {};
      (panels||[]).forEach(p => { panelMap[p.id] = p; });
      const FILTERS_PEEK = [
        {id:'none',css:'none'},{id:'teal',css:'sepia(1) saturate(3) hue-rotate(130deg) brightness(0.85)'},
        {id:'pink',css:'sepia(1) saturate(3) hue-rotate(280deg) brightness(0.85)'},
        {id:'noir',css:'grayscale(1) contrast(1.2) brightness(0.8)'},
        {id:'glitch',css:'hue-rotate(90deg) saturate(2) contrast(1.3)'},
        {id:'vignette',css:'brightness(0.7) contrast(1.1)'},
      ];
      const comicPanels = book.slots.map(slot => {
        if (slot.type === 'image') {
          const p = panelMap[slot.panelId];
          if (!p) return null;
          const fObj = FILTERS_PEEK.find(f => f.id===(slot.filter||'none')) || FILTERS_PEEK[0];

          // Build dialogue — textBoxes (new) or legacy caption fallback
          let dialogue = [];
          if (slot.textBoxes && slot.textBoxes.length) {
            dialogue = slot.textBoxes
              .filter(tb => tb.text && tb.text.trim())
              .map(tb => ({
                speaker:      tb.speaker      || 'narrator',
                text:         tb.text.trim(),
                style:        tb.style        || 'dialogue',
                pos:          tb.pos          || null,
                borderColor:  tb.borderColor  || null,
                borderWidth:  tb.borderWidth  || null,
                borderStyle:  tb.borderStyle  || null,
                borderRadius: tb.borderRadius || null,
                bgOpacity:    tb.bgOpacity    !== undefined ? tb.bgOpacity : null,
                bgColor:      tb.bgColor      || null,
                fontSize:     tb.fontSize     || null,
              }));
          } else {
            const capText    = typeof slot.caption==='string' ? slot.caption : slot.caption?.text||'';
            const capSpeaker = typeof slot.caption==='string' ? 'narrator'   : slot.caption?.speaker||'narrator';
            if (capText) dialogue = [{speaker:capSpeaker, text:capText}];
          }

          return {
            image:      p.dataURL,
            filter_css: fObj.css,
            frame_svg:  slot.frameSVG || null,
            dialogue,
            transition: 'fade',
            bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
          };
        } else if (slot.type==='text' && slot.text) {
          return {
            bg_gradient: 'radial-gradient(ellipse at 50% 50%,#0a0a1a 0%,#101014 70%)',
            dialogue: [{speaker:slot.speaker||'narrator', text:slot.text}],
            transition: 'fade',
          };
        }
        return null;
      }).filter(p => p !== null && (p.image || p.dialogue?.length));

      if (comicPanels.length) {
        // label the skip button with the book title
        const skipEl = document.getElementById('comic-skip');
        if (skipEl) { skipEl.textContent='skip · '+book.title; skipEl.classList.add('visible'); }
        // show the comic screen (initComic normally does this)
        const screen = document.getElementById('screen-comic');
        if (screen) { screen.classList.remove('fade-out'); screen.style.display=''; }
        // play user book — on finish run normal auth
        window.playCustomComic(comicPanels, _authCallback);
        playedUserBook = true;
      }
    }
  } catch(e) {
    console.log('[intro] IDB peek failed, using default intro', e);
  }

  // no user book — run Sky's intro normally
  if (!playedUserBook) {
    initComic(_authCallback);
  }
})();


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

// particles init
initParticles();
