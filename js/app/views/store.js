// ============================================================
// SPIRALSIDE — STORE VIEW v1.0
// Full-page store tab — credits, buy packs, feature pricing
// Nimbis anchor: js/app/views/store.js
// ============================================================
import { state } from '../state.js';
import { buyPack } from '../ui.js';

let initialized = false;

// Called by switchView('store') — renders once, updates on revisit
export function initStoreView() {
  const el = document.getElementById('view-store');
  if (!el) return;

  if (!initialized) {
    el.innerHTML = `
      <div class="view-scroll-body">
        <div class="credit-hero">
          <div class="credit-amount" id="store-credits">0</div>
          <div class="credit-label">credits remaining</div>
          <div class="credit-sub" id="store-free-msg">free demo — buy credits to unlock real AI</div>
        </div>
        <div class="view-section-title">buy credits</div>
        <div class="pack-grid">
          <div class="pack-card" onclick="window.buyPack('5')">
            <div class="pack-price">$5</div>
            <div class="pack-credits">500 credits</div>
            <div class="pack-bonus">starter</div>
          </div>
          <div class="pack-card popular" onclick="window.buyPack('10')">
            <div class="pack-tag">✦ popular</div>
            <div class="pack-price">$10</div>
            <div class="pack-credits">1,100 credits</div>
            <div class="pack-bonus">+100 bonus</div>
          </div>
          <div class="pack-card" onclick="window.buyPack('20')">
            <div class="pack-price">$20</div>
            <div class="pack-credits">2,400 credits</div>
            <div class="pack-bonus">+400 bonus</div>
          </div>
        </div>
        <div class="view-section-title">feature pricing</div>
        <div class="feature-row"><div class="feature-icon">💬</div><div class="feature-name">chat — haiku</div><div class="feature-cost">1 cr</div></div>
        <div class="feature-row"><div class="feature-icon">💬</div><div class="feature-name">chat — sonnet</div><div class="feature-cost">6 cr</div></div>
        <div class="feature-row"><div class="feature-icon">🎨</div><div class="feature-name">image generation</div><div class="feature-cost">5 cr</div></div>
        <div class="feature-row"><div class="feature-icon">🗣️</div><div class="feature-name">text to speech</div><div class="feature-cost">2 cr</div></div>
        <div class="feature-row"><div class="feature-icon">🎤</div><div class="feature-name">speech to text</div><div class="feature-cost">1 cr</div></div>
        <div class="feature-row"><div class="feature-icon">📹</div><div class="feature-name">video generation</div><div class="feature-cost">20 cr</div></div>
      </div>`;
    initialized = true;
  }
  updateStoreView();
}

// Refreshes credit display — called by updateCreditDisplay in ui.js
export function updateStoreView() {
  const amountEl = document.getElementById('store-credits');
  const subEl    = document.getElementById('store-free-msg');
  if (!amountEl) return;
  if (state.isPaid) {
    const cr = Number.isInteger(state.credits)
      ? state.credits
      : parseFloat(state.credits.toFixed(1));
    amountEl.textContent = cr;
    if (subEl) subEl.textContent = 'paid account';
  } else {
    amountEl.textContent = '0';
    if (subEl) subEl.textContent = 'free demo — buy credits to unlock real AI';
  }
}
