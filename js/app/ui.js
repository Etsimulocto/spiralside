// ============================================================
// SPIRALSIDE — UI v1.0
// FAB menu, slide panel, view switching, header glow,
// credits display, greeting update, user avatar init
// Nimbis anchor: js/app/ui.js
// ============================================================

import { state, FAB_TABS, RAIL } from './state.js';
import { getToken }               from './auth.js';
import { dbSet, dbGet }           from './db.js';

// ── TAB DRAG REORDER ──────────────────────────────────────────
// Drag tabs left/right to reorder — persists to IDB config store

let _dragging = null;  // tab btn currently being dragged

async function saveTabOrder() {
  const order = [...document.querySelectorAll('#tab-bar .tab-btn')]
    .map(t => t.id.replace('tab-', ''));
  try { await dbSet('config', { key: 'tab_order', data: order }); }
  catch(e) { console.warn('[tabOrder] save failed:', e); }
}

export async function restoreTabOrder() {
  try {
    const rec = await dbGet('config', 'tab_order');
    if (!rec?.data?.length) return;
    const bar = document.getElementById('tab-bar');
    if (!bar) return;
    rec.data.forEach(id => {
      const btn = document.getElementById('tab-' + id);
      if (btn) bar.appendChild(btn);  // move to end in saved order
    });
  } catch(e) { console.warn('[tabOrder] restore failed:', e); }
}

export function initTabDrag() {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;

  bar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.draggable = true;

    btn.addEventListener('dragstart', e => {
      _dragging = btn;
      setTimeout(() => btn.style.opacity = '0.4', 0);  // defer so drag image renders first
      e.dataTransfer.effectAllowed = 'move';
    });

    btn.addEventListener('dragend', () => {
      btn.style.opacity = '';
      bar.querySelectorAll('.tab-btn').forEach(b => b.style.outline = '');
      _dragging = null;
      saveTabOrder();
    });

    btn.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_dragging || btn === _dragging) return;
      bar.querySelectorAll('.tab-btn').forEach(b => b.style.outline = '');
      btn.style.outline = '2px solid #00F6D6';  // drop target indicator
      const kids = [...bar.querySelectorAll('.tab-btn')];
      const from = kids.indexOf(_dragging);
      const to   = kids.indexOf(btn);
      if (from < to) bar.insertBefore(_dragging, btn.nextSibling);
      else           bar.insertBefore(_dragging, btn);
    });

    btn.addEventListener('drop', e => {
      e.preventDefault();
      bar.querySelectorAll('.tab-btn').forEach(b => b.style.outline = '');
    });
  });
}

// ── BUILD FAB MENU ────────────────────────────────────────────
// Injects 4 FAB items above the main button
export function buildFAB() {
  const container = document.getElementById('fab-container');

  // Remove any old items
  container.querySelectorAll('.fab-item').forEach(el => el.remove());

  FAB_TABS.forEach((tab, i) => {
    const item       = document.createElement('div');
    item.className   = 'fab-item';
    item.id          = `fab-item-${tab.id}`;
    item.style.bottom = `${64 + i * 56}px`;
    item.innerHTML   = `
      <span class="fab-label" style="color:${tab.color}">${tab.label}</span>
      <div class="fab-icon-btn" style="border-color:${tab.color}44;color:${tab.color}"
        onclick="switchView('${tab.id}')">${tab.icon}</div>
    `;
    // Insert before the main FAB button
    container.insertBefore(item, document.getElementById('fab-main'));
  });
}

// ── TOGGLE FAB ────────────────────────────────────────────────
export function toggleFAB() {
  state.fabOpen = !state.fabOpen;
  const btn = document.getElementById('fab-main');
  btn.classList.toggle('open', state.fabOpen);
  document.querySelectorAll('.fab-item').forEach((el, i) => {
    el.classList.toggle('open', state.fabOpen);
    el.style.transitionDelay = state.fabOpen
      ? `${i * 0.04}s`
      : `${(3 - i) * 0.03}s`;
  });
}


// ── SPLIT MODE ────────────────────────────────────────────────
let _splitOn = false;
const _sv = { a: 'chat', b: 'pi' };
const _TABS = ['chat','pi','imagine','forge','code','quest','codex','library','music','vault','studio','cut','style','store','account','guide','cannonized','spiral','frames','bloomslice','bloomengine'];

export function toggleSplitMode() {
  _splitOn = !_splitOn;
  document.getElementById('tab-split')?.classList.toggle('split-active', _splitOn);
  const root = document.getElementById('split-root');
  const app  = document.getElementById('screen-app');
  if (!root || !app) return;
  if (_splitOn) {
    app.style.display = 'none';
    root.style.display = 'flex';
    _buildPanels();
    _loadPanel('a', _sv.a);
    _loadPanel('b', _sv.b);
  } else {
    root.style.display = 'none';
    document.querySelectorAll('.split-view-host .view').forEach(v => { v.classList.remove('active'); app.appendChild(v); });
    app.style.display = '';
    switchView(state.activeView || 'chat');
  }
}
window.toggleSplitMode = toggleSplitMode;

// ── SPLIT TAB ORDER ──────────────────────────────────────────
// Single scrollable row — all tabs, draggable, persisted per panel
const _SPLIT_ALL = ['chat','pi','codex','forge','imagine','frames','cut','studio','quest','spiral','cannonized','library','music','code','bloomslice','bloomengine','vault','guide','style','store','account'];

function _saveSplitOrder(panel) {
  const bar = document.getElementById('split-bar-' + panel);
  if (!bar) return;
  const order = [...bar.querySelectorAll('.split-tab[data-view]')].map(b => b.dataset.view);
  try { localStorage.setItem('ss_split_order_' + panel, JSON.stringify(order)); } catch(e) {}
}

function _loadSplitOrder(panel, defaults) {
  try {
    const saved = localStorage.getItem('ss_split_order_' + panel);
    if (saved) {
      const arr = JSON.parse(saved);
      // Accept saved order only if it has exactly the same set of IDs
      if (arr.length === defaults.length && arr.every(id => defaults.includes(id))) return arr;
    }
  } catch(e) {}
  return defaults;
}

function _initSplitDrag(bar, panel) {
  let _drag = null;
  bar.querySelectorAll('.split-tab[data-view]').forEach(btn => {
    btn.draggable = true;
    btn.addEventListener('dragstart', e => {
      _drag = btn;
      setTimeout(() => btn.style.opacity = '0.4', 0);
      e.dataTransfer.effectAllowed = 'move';
    });
    btn.addEventListener('dragend', () => {
      btn.style.opacity = '';
      bar.querySelectorAll('.split-tab[data-view]').forEach(b => b.style.outline = '');
      _drag = null;
      _saveSplitOrder(panel);
    });
    btn.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_drag || btn === _drag) return;
      bar.querySelectorAll('.split-tab[data-view]').forEach(b => b.style.outline = '');
      btn.style.outline = '2px solid var(--teal)';
      const kids = [...bar.querySelectorAll('.split-tab[data-view]')];
      const from = kids.indexOf(_drag);
      const to   = kids.indexOf(btn);
      if (from < to) bar.insertBefore(_drag, btn.nextSibling);
      else           bar.insertBefore(_drag, btn);
    });
    btn.addEventListener('drop', e => {
      e.preventDefault();
      bar.querySelectorAll('.split-tab[data-view]').forEach(b => b.style.outline = '');
    });
  });
}

function _buildPanels() {
  ['a','b'].forEach(p => {
    const panel = document.getElementById('split-panel-' + p);
    if (!panel || panel.querySelector('.split-tabbar')) return;

    // Single compact scrollable tab bar
    const bar = document.createElement('div');
    bar.className = 'split-tabbar';
    bar.id = 'split-bar-' + p;

    const ordered = _loadSplitOrder(p, _SPLIT_ALL);
    ordered.forEach(id => {
      const btn = document.createElement('button');
      btn.className = 'split-tab' + (_sv[p] === id ? ' active' : '');
      btn.textContent = id;
      btn.dataset.view = id;
      btn.onclick = () => _loadPanel(p, id);
      bar.appendChild(btn);
    });

    // Exit split — panel B only, pinned right
    if (p === 'b') {
      const x = document.createElement('button');
      x.className = 'split-tab';
      x.textContent = 'x';
      x.title = 'exit split';
      x.style.cssText = 'margin-left:auto;color:var(--pink);flex-shrink:0;padding:3px 8px;';
      x.onclick = () => window.toggleSplitMode();
      bar.appendChild(x);
    }

    _initSplitDrag(bar, p);

    const host = document.createElement('div');
    host.className = 'split-view-host';
    host.id = 'split-host-' + p;

    panel.appendChild(bar);
    panel.appendChild(host);
  });
}

function _loadPanel(panel, id) {
  _sv[panel] = id;
  const panelEl = document.getElementById('split-panel-' + panel);
  if (!panelEl) return;
  panelEl.querySelectorAll('.split-tab').forEach(t => t.classList.toggle('active', t.textContent === id));
  const host = document.getElementById('split-host-' + panel);
  if (!host) return;
  // Move view into host
  const app = document.getElementById('screen-app');
  const viewEl = document.getElementById('view-' + id);
  if (!viewEl) return;
  // Return any view currently in this host back to screen-app
  [...host.children].forEach(c => { if (c.classList.contains('view')) { c.classList.remove('active'); app.appendChild(c); } });
  host.appendChild(viewEl);
  viewEl.classList.add('active');
  // Init
  const I = {
    store:()=>window.initStoreView&&window.initStoreView(),
    studio:()=>window.initStudioView&&window.initStudioView(),
    cut:()=>window.initCutView&&window.initCutView(),
    quest:()=>window.initQuestView&&window.initQuestView(),
    style:()=>window.initStylePanel&&window.initStylePanel(),
    account:()=>window.initAccountView&&window.initAccountView(),
    imagine:()=>window.initImagine&&window.initImagine(),
    music:()=>window.initMusicView&&window.initMusicView(),
    library:()=>window.initLibrary&&window.initLibrary(),
    code:()=>window.initCodeView&&window.initCodeView(),
    guide:()=>window.initGuideView&&window.initGuideView(),
    forge:()=>window.initForgeView&&window.initForgeView(),
    vault:()=>window.initVaultView&&window.initVaultView(),
    pi:()=>window.initPiView&&window.initPiView(),
    bloomslice: () => window.initBloomsliceView && window.initBloomsliceView(),
      bloomengine: () => window.initBloomEngineView && window.initBloomEngineView(),
    codex:()=>window.initCodexView&&window.initCodexView(),
    spiral:()=>window.initSpiralView&&window.initSpiralView(),
    frames:()=>window.initFramesView&&window.initFramesView(),
    cannonized:()=>window.initCannonizedView&&window.initCannonizedView(),
  };
  if (I[id]) I[id]();
  setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
}

// ── SWITCH VIEW ───────────────────────────────────────────────
// id: 'chat' | 'codex' | 'vault' | 'forge'
export function switchView(id) {
  // Highlight correct tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const activeTab = document.getElementById(`tab-${id}`);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  // Lazy-init view on first visit
  const viewInits = {
    store:     () => { window.initStoreView  && window.initStoreView();  updateCreditDisplay(); },
    studio:    () => window.initStudioView   && window.initStudioView(),
    cut:       () => window.initCutView      && window.initCutView(),
    quest:     () => window.initQuestView    && window.initQuestView(),
    style:     () => { window.initStylePanel && window.initStylePanel(); setTimeout(() => window.initColorSketches && window.initColorSketches(), 400); },
    account:   () => window.initAccountView  && window.initAccountView(),
    imagine:   () => window.initImagine      && window.initImagine(),
    frames:    () => window.initFramesView  && window.initFramesView(),
    music:     () => window.initMusicView    && window.initMusicView(),
    library:   () => window.initLibrary      && window.initLibrary(),
    code:      () => window.initCodeView     && window.initCodeView(),
    guide:     () => window.initGuideView    && window.initGuideView(),
    forge:     () => window.initForgeView    && window.initForgeView(),
    vault:     () => window.initVaultView    && window.initVaultView(),
    pi:        () => window.initPiView       && window.initPiView(),
    spiral:    () => window.initSpiralView  && window.initSpiralView(),
    bloomslice: () => window.initBloomsliceView && window.initBloomsliceView(),
    bloomengine: () => window.initBloomEngineView && window.initBloomEngineView(),
  };
  if (viewInits[id]) viewInits[id]();
  // Fire onOpen hook so modules can refresh state on revisit
  if (window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]) {
    window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]();
  }
  const prevViewId = state.activeView;
  state.activeView = id;

  // Close FAB (if it still exists)
  state.fabOpen = false;
  document.getElementById('fab-main')?.classList.remove('open');
  document.querySelectorAll('.fab-item').forEach(el => el.classList.remove('open'));

  // Call onClose for previous view
  const prevTab = FAB_TABS.find(t => t.id === prevViewId);
  if (prevTab?.onClose) prevTab.onClose();

  // Activate the matching view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');

  // Call onOpen for new view
  const nextTab = FAB_TABS.find(t => t.id === id);
  if (nextTab?.onOpen) nextTab.onOpen();

  // Header glow color per view
  const glowColors = { chat: '#00F6D6', codex: '#FF4BCB', studio: '#7c6af7', vault: '#7B5FFF', forge: '#FFD93D', music: '#00F6D6', library: '#FF4BCB', store: '#00F6D6', style: '#7B5FFF', account: '#4DA3FF' };
  document.getElementById('header-glow').style.background = glowColors[id] || '#00F6D6';

  // Highlight active FAB icon
  FAB_TABS.forEach(tab => {
    const btn = document.querySelector(`#fab-item-${tab.id} .fab-icon-btn`);
    if (btn) btn.style.background = tab.id === id ? tab.color + '22' : 'var(--surface2)';
  });
}

// ── SLIDE PANEL ───────────────────────────────────────────────
export function openPanel(tab = 'store') {
  document.getElementById('panel-overlay').classList.add('open');
  document.getElementById('slide-panel').classList.add('open');
  switchPanelTab(tab);
  if (tab === 'style') { window.initStylePanel && window.initStylePanel(); window.initSlots && window.initSlots(); window.syncBgToggles && window.syncBgToggles(); window.loadBgPresets && window.loadBgPresets(); }
}

export function closePanel() {
  document.getElementById('panel-overlay').classList.remove('open');
  document.getElementById('slide-panel').classList.remove('open');
}

export function switchPanelTab(tab) {
  document.querySelectorAll('.panel-tab').forEach((t, i) => {
    const tabs = ['store', 'account'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.panel-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`panel-${tab}`)?.classList.add('active');
}

// ── CREDITS DISPLAY ───────────────────────────────────────────
export async function loadUsage() {
  try {
    const token = await getToken();
    if (!token) return;

    const r = await fetch(`${RAIL}/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.ok) {
      const d        = await r.json();
      state.credits   = d.credits              || 0;
      state.freeToday = d.free_messages_today  || 0;
      state.isPaid    = d.is_paid              || false;
      updateCreditDisplay();
    }
  } catch(e) {
    console.warn('loadUsage:', e);
  }
}

export function updateCreditDisplay() {
  const badge   = document.getElementById('credits-badge');
  const storeEl = document.getElementById('store-credits');
  const acctEl  = document.getElementById('account-credits');
  const freeEl  = document.getElementById('store-free-msg');
  const toggle  = document.getElementById('model-toggle');
  if (state.isPaid) {
    window._currentCredits = state.credits;
  const cr = Math.round(state.credits).toLocaleString();
    if (badge)   badge.textContent  = cr + ' cr';
    if (storeEl) storeEl.textContent = cr;
    if (acctEl)  acctEl.textContent  = cr;
    if (freeEl)  freeEl.textContent  = 'paid account';
    if (toggle)  toggle.classList.add('visible');
    window._isPaid = true;
  } else {
    const left = Math.max(0, 10 - state.freeToday);
    if (badge)   badge.textContent  = left + ' free left';
    if (storeEl) storeEl.textContent = '0';
    if (acctEl)  acctEl.textContent  = left;
    if (freeEl)  freeEl.textContent  = 'free demo — buy credits to unlock real AI';
    if (toggle)  toggle.classList.remove('visible');
    window._isPaid = false;
  }
  if (window.updateInputMenu) window.updateInputMenu();
}

export function updateGreeting() {
  const bubble = document.getElementById('greeting-bubble');
  const icon   = document.getElementById('bot-avatar-icon');
  if (!bubble || !icon) return;

  bubble.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,${state.botColor},transparent)"></div>
    ${state.botGreeting}`;

  icon.textContent     = state.botName[0].toUpperCase();
  icon.style.color     = state.botColor;
  icon.style.borderColor = `${state.botColor}66`;
}

// ── USER AVATAR + EMAIL ───────────────────────────────────────
export function updateUserUI() {
  const initial = (state.user?.email?.[0] || '?').toUpperCase();
  const fabEl = document.getElementById('account-fab-initial');
  if (fabEl) fabEl.textContent = initial;
  const _ae = document.getElementById('account-email'); if (_ae) _ae.textContent = state.user?.email || '—';
}

// ── PAYPAL ────────────────────────────────────────────────────
export async function buyPack(amount) {
  if (!state.user) { alert('Please sign in first.'); return; }
  try {
    const token = await getToken();
    const r = await fetch(`${RAIL}/create-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ amount: String(amount) }),
    });
    const data = await r.json();
    if (!r.ok) { alert(data.detail || 'Payment error.'); return; }
    window.location.href = data.approve_url;
  } catch {
    alert('Payment error. Try again.');
  }
}

export async function handlePayPalReturn() {
  const params  = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  const token   = params.get('token');

  if (payment === 'success' && token) {
    try {
      const authToken = await getToken();
      const r = await fetch(`${RAIL}/capture-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body:    JSON.stringify({ order_id: token }),
      });
      const data = await r.json();
      if (r.ok) {
        await loadUsage();
        window.history.replaceState({}, document.title, window.location.pathname);
        // Refresh plan status if it was a storage purchase
        if (typeof window.refreshPlanStatus === 'function') await window.refreshPlanStatus();
        // Switch to store tab
        if (typeof window.switchView === 'function') window.switchView('store');
        else openPanel('store');
        // Only alert if credits were added (not a storage-only purchase)
        if (data.credits_added > 0) {
          setTimeout(() => alert('Payment successful! ' + data.credits_added.toLocaleString() + ' credits added.'), 300);
        }
      }
    } catch {}
  } else if (payment === 'cancelled') {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}


// ── FONT SIZE ─────────────────────────────────────────────────
export function setFontSize(size) {
  const scales = { s: 0.85, m: 1, l: 1.2 };
  const scale = scales[size] || 1;
  // Set on <html> so all rem units scale — this is the only reliable approach
  
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem('ss_fontsize', size);
  ['s','m','l'].forEach(id => {
    document.getElementById('fs-' + id)?.classList.toggle('fs-active', id === size);
  });
}

export function loadFontSize() {
  const saved = localStorage.getItem('ss_fontsize') || 'm';
  setFontSize(saved);
}
