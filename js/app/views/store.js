// ============================================================
// SPIRALSIDE — STORE VIEW v1.0
// Full-page store tab — credits, buy packs, feature pricing
// Nimbis anchor: js/app/views/store.js
// ============================================================
import { state } from '../state.js';
import { buyPack } from '../ui.js';

let initialized = false; // v2 — rebased credits

// Called by switchView('store') — renders once, updates on revisit
export function initStoreView() {
  const el = document.getElementById('view-store');
  if (!el) return;
  el.innerHTML = `
    <div class="view-scroll-body">
      <div class="credit-hero">
        <div class="credit-amount" id="store-credits">0</div>
        <div class="credit-label">credits remaining</div>
        <div class="credit-sub" id="store-free-msg">free demo — buy credits to unlock real AI</div>
      </div>
      <div class="pricing-explainer">
        <div class="pe-title">how we charge</div>
        <div class="pe-body">1 credit = $0.0001 (1/100th of a penny). You pay exact API cost + 17% to cover hosting, taxes, and maintenance. No markup beyond that. Unused credits never expire.</div>
      </div>
      <div class="view-section-title">buy credits</div>
      <div class="pack-grid">
        <div class="pack-card" onclick="window.buyPack('5')">
          <div class="pack-price">$5</div>
          <div class="pack-credits">500,000 cr</div>
          <div class="pack-bonus">starter</div>
        </div>
        <div class="pack-card popular" onclick="window.buyPack('10')">
          <div class="pack-tag">✦ popular</div>
          <div class="pack-price">$10</div>
          <div class="pack-credits">1,100,000 cr</div>
          <div class="pack-bonus">+100,000 bonus</div>
        </div>
        <div class="pack-card" onclick="window.buyPack('20')">
          <div class="pack-price">$20</div>
          <div class="pack-credits">2,400,000 cr</div>
          <div class="pack-bonus">+400,000 bonus</div>
        </div>
      </div>
      <div class="view-section-title">live feature pricing</div>
      <div class="feature-row"><div class="feature-icon">⚡</div><div class="feature-name">chat — haiku<div class="feature-sub">fast · cost+17%</div></div><div class="feature-cost">~140 cr</div></div>
      <div class="feature-row"><div class="feature-icon">◎</div><div class="feature-name">chat — sky / 4o<div class="feature-sub">character · cost+17%</div></div><div class="feature-cost">~23 cr</div></div>
      <div class="feature-row"><div class="feature-icon">✦</div><div class="feature-name">chat — sonnet<div class="feature-sub">smart · cost+17%</div></div><div class="feature-cost">~527 cr</div></div>
      <div class="feature-row"><div class="feature-icon">🎨</div><div class="feature-name">image generation<div class="feature-sub">flux schnell</div></div><div class="feature-cost">500 cr</div></div>
      <div class="feature-row"><div class="feature-icon">🖣️</div><div class="feature-name">text to speech<div class="feature-sub">chatterbox</div></div><div class="feature-cost">200 cr</div></div>
      <div class="feature-row"><div class="feature-icon">🎤</div><div class="feature-name">speech to text<div class="feature-sub">browser native · free</div></div><div class="feature-cost">0 cr</div></div>
      <div class="feature-row"><div class="feature-icon">📹</div><div class="feature-name">video generation<div class="feature-sub">wan 2.2</div></div><div class="feature-cost">2,000 cr</div></div>
      <div class="view-section-title" style="margin-top:24px;">gift credits</div>
      <div class="gift-box">
        <div class="gift-desc">Send credits from your balance to a friend. Or buy a fresh $5 gift. They redeem the code in their account.</div>
        <div class="gift-send-row">
          <input class="gift-input" id="gift-amount-input" type="number" placeholder="credits to send" min="1000" style="letter-spacing:0;text-transform:none;" />
          <button class="gift-redeem-btn" onclick="window.sendGift()">send from balance</button>
        </div>
        <button class="gift-buy-btn" onclick="window.buyGift()">buy $5 gift → 500,000 cr</button>
        <div class="gift-divider">redeem a code</div>
        <div class="gift-redeem-row">
          <input class="gift-input" id="gift-code-input" placeholder="SPIRAL-XXXX-XXXX" maxlength="14" />
          <button class="gift-redeem-btn" onclick="window.redeemGift()">redeem</button>
        </div>
        <div class="gift-msg" id="gift-msg"></div>
      </div>

    </div>`;
  updateStoreView();
}


export function updateStoreView() {
  const amountEl = document.getElementById('store-credits');
  const subEl    = document.getElementById('store-free-msg');
  if (!amountEl) return;
  if (state.isPaid) {
    const cr = Number.isInteger(state.credits)
      ? state.credits
      : Math.round(state.credits);
    amountEl.textContent = Math.round(cr).toLocaleString();
    if (subEl) subEl.textContent = 'paid account';
  } else {
    amountEl.textContent = '0';
    if (subEl) subEl.textContent = 'free demo — buy credits to unlock real AI';
  }
}
