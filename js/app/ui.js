// ============================================================
// SPIRALSIDE — UI v1.0
// FAB menu, slide panel, view switching, header glow,
// credits display, greeting update, user avatar init
// Nimbis anchor: js/app/ui.js
// ============================================================

import { state, FAB_TABS, RAIL } from './state.js';
import { getToken }               from './auth.js';

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
    store:   () => updateCreditDisplay(),
    studio:  () => window.initStudioView && window.initStudioView(),
    spiralcut: () => window.initSpiralCutView && window.initSpiralCutView(),
    style:   () => window.initStylePanel  && window.initStylePanel(),
    account: () => updateCreditDisplay(),
    imagine: () => window.initImagine     && window.initImagine(),
    music:   () => window.initMusicView   && window.initMusicView(),
    library: () => window.initLibrary     && window.initLibrary(),
    code:    () => window.initCodeView     && window.initCodeView(),
    pi:      () => window.initPiView        && window.initPiView(),
  };
  if (viewInits[id]) viewInits[id]();
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
  const acctEl = document.getElementById('account-credits');
  if (acctEl) acctEl.textContent = state.isPaid ? state.credits : Math.max(0, 10 - state.freeToday);
  const badge   = document.getElementById('credits-badge');
  const storeEl = document.getElementById('store-credits');
  const freeEl  = document.getElementById('store-free-msg');
  const toggle  = document.getElementById('model-toggle');
  if (state.isPaid) {
    const cr = Number.isInteger(state.credits)
      ? state.credits
      : parseFloat(state.credits.toFixed(1));
    badge.textContent   = `${cr} cr`;
    storeEl.textContent = cr;
    freeEl.textContent  = 'paid account';
    if (toggle) toggle.classList.add('visible');
    window._isPaid = true;
    if (window.updateInputMenu) window.updateInputMenu();
  } else {
    badge.textContent   = 'demo';
    storeEl.textContent = 0;
    freeEl.textContent  = 'free demo — buy credits to unlock real AI';
    if (toggle) toggle.classList.remove('visible');
    window._isPaid = false;
    if (window.updateInputMenu) window.updateInputMenu();
  }
}

// ── GREETING MESSAGE UPDATE ───────────────────────────────────
// Refreshes the first bot message in chat with current bot config
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
  document.getElementById('account-email').textContent = state.user?.email || '—';
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
        openPanel('store');
        setTimeout(() => alert(`Payment successful! ${data.credits_added} credits added.`), 300);
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
