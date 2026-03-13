// ============================================================
// SPIRALSIDE — MAIN v1.0
// Boot sequence — imports all modules, wires globals, starts app
// This is the single entry point loaded by index.html
// Nimbis anchor: js/app/main.js
// ============================================================

import { initComic, playCustomComic }              from './comic.js';
import { sb, checkAuthAndShow, listenAuthChanges,
         handleLogin, handleSignup, handleSignout,
         switchAuthTab, togglePw }                 from './auth.js';
import { initDB, dbGet, dbGetAll, dbSet }          from './db.js';
import { initChat, addMessage }                    from './chat.js';
import { buildCharSelector, renderActiveChar,
         saveSummarize, loadSavedSheets }          from './sheet.js';
import { initVault, renderVault,
         removeFile, loadVaultFromDB }             from './vault.js';
import { initMusic }          from './music.js';
import { initMusicView, destroyMusicView } from './musicview.js';
import { initBuild, loadBotIntoForm }              from './build.js';
import { initLibrary, openPanelEditor, deletePanel,
         openBookBuilder, addPanelToBook,
         removePanelFromBook, movePanelInBook,
         deleteBook }                              from './library.js';
import { buildFAB, toggleFAB, switchView,
         openPanel, closePanel, switchPanelTab,
         loadUsage, updateCreditDisplay,
         updateGreeting, updateUserUI,
         buyPack, handlePayPalReturn }             from './ui.js';
import { state }                                   from './state.js';

// ── EXPOSE GLOBALS ────────────────────────────────────────────
// HTML onclick attributes need these on window.
// Only expose what's called from inline HTML.
window.switchAuthTab     = switchAuthTab;
window.togglePw          = togglePw;
window.handleLogin       = handleLogin;
window.handleSignup      = handleSignup;
window.handleSignout     = () => handleSignout(closePanel);
window.openPanel         = openPanel;
window.closePanel        = closePanel;
window.switchPanelTab    = switchPanelTab;
window.toggleFAB         = toggleFAB;
window.switchView        = switchView;
window.buyPack           = buyPack;
window.saveSummarize     = saveSummarize;
window.initMusicView     = initMusicView;
window.destroyMusicView  = destroyMusicView;
window.removeFile        = removeFile;
window.openPanelEditor   = openPanelEditor;
window.deletePanel       = deletePanel;
window.openBookBuilder   = openBookBuilder;
window.addPanelToBook    = addPanelToBook;
window.removePanelFromBook = removePanelFromBook;
window.movePanelInBook   = movePanelInBook;
window.deleteBook        = deleteBook;
window.playCustomComic   = playCustomComic;

// ── APP READY ─────────────────────────────────────────────────
// Called after auth check confirms a valid session
async function onAppReady() {
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
  initChat();
  initVault();
  initBuild();
  initLibrary();
  buildFAB();

  // 6. Populate forms and UI
  loadBotIntoForm();
  updateUserUI();
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
  previewScanlines, selectBubbleShape, selectFont, previewSlider,
  applyAndSaveStyle, resetStyle, updateParticleDensity, loadSavedStyle
} from './style.js';

window.initStylePanel       = initStylePanel;
window.applyThemePreset     = applyThemePreset;
window.previewColor         = previewColor;
window.selectBgType         = selectBgType;
window.previewScanlines     = previewScanlines;
window.selectBubbleShape    = selectBubbleShape;
window.selectFont           = selectFont;
window.previewSlider        = previewSlider;
window.applyAndSaveStyle    = applyAndSaveStyle;
window.resetStyle           = resetStyle;
window.updateParticleDensity = updateParticleDensity;

loadSavedStyle();
