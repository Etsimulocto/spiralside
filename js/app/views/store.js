// ============================================================
// SPIRALSIDE — STORE VIEW v1.0
// Full-page store tab — credits, buy packs, feature pricing
// Nimbis anchor: js/app/views/store.js
// ============================================================
import { state } from '../state.js';
import { buyPack } from '../ui.js';

let initialized = false; // v2 — rebased credits

// Called by switchView('store') — renders once, updates on revisit
function injectStoreStyles() {
  if (document.getElementById('ss-store-styles')) return;
  const s = document.createElement('style');
  s.id = 'ss-store-styles';
  s.textContent = `
    #view-store { overflow-y: auto; -webkit-overflow-scrolling: touch; }
    .view-scroll-body { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 0; }
    .credit-hero { background: linear-gradient(135deg, rgba(0,246,214,0.08), rgba(124,106,247,0.08)); border: 1px solid var(--border); border-radius: 16px; padding: 28px 20px; text-align: center; margin-bottom: 20px; }
    .credit-amount { font-family: var(--font-display); font-size: 2.8rem; font-weight: 800; background: linear-gradient(135deg, var(--teal), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
    .credit-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin-top: 6px; }
    .credit-sub { font-size: 0.72rem; color: var(--subtext); margin-top: 8px; }
    .pricing-explainer { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; }
    .pe-title { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px; }
    .pe-body { font-size: 0.78rem; line-height: 1.6; color: var(--text); }
    .view-section-title { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; }
    .view-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .pack-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 4px; }
    .pack-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
    .pack-card:hover { border-color: var(--teal); transform: translateY(-2px); }
    .pack-card.popular { border-color: rgba(255,75,203,0.5); }
    .pack-tag { position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: var(--pink); color: #fff; font-size: 0.55rem; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
    .pack-price { font-family: var(--font-display); font-weight: 700; font-size: 1.4rem; color: var(--text); }
    .pack-credits { font-size: 0.65rem; color: var(--subtext); margin-top: 3px; }
    .pack-bonus { font-size: 0.6rem; color: var(--teal); margin-top: 2px; }
    .feature-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 6px; }
    .feature-icon { font-size: 1rem; width: 26px; text-align: center; flex-shrink: 0; }
    .feature-name { flex: 1; font-size: 0.78rem; color: var(--text); }
    .feature-sub { font-size: 0.62rem; color: var(--subtext); margin-top: 1px; }
    .feature-cost { font-size: 0.72rem; color: var(--teal); letter-spacing: 0.04em; }
    .gift-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-top: 4px; }
    .gift-desc { font-size: 0.75rem; color: var(--subtext); line-height: 1.6; margin-bottom: 14px; }
    .gift-send-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .gift-buy-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: 10px; color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; cursor: pointer; letter-spacing: 0.04em; margin-bottom: 14px; transition: opacity 0.2s; }
    .gift-buy-btn:hover { opacity: 0.88; }
    .gift-divider { text-align: center; font-size: 0.65rem; color: var(--subtext); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
    .gift-redeem-row { display: flex; gap: 8px; }
    .gift-input { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-family: var(--font-ui); font-size: 0.8rem; outline: none; }
    .gift-input:focus { border-color: var(--accent); }
    .gift-redeem-btn { padding: 10px 16px; background: var(--muted); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: var(--font-ui); font-size: 0.75rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .gift-redeem-btn:hover { border-color: var(--accent); color: var(--accent); }
    .gift-msg { font-size: 0.72rem; margin-top: 10px; min-height: 18px; }
    .gift-msg.ok { color: var(--teal); }
    .gift-msg.err { color: var(--pink); }
  `;
  document.head.appendChild(s);
}

export function initStoreView() {
  const el = document.getElementById('view-store');
  if (!el) return;
  injectStoreStyles();
  if (!initialized) {
  initialized = true;
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
          <input class="gift-input" id="gift-code-input" placeholder="SPIRAL-XXXX-XXXX" maxlength="16" />
          <button class="gift-redeem-btn" onclick="window.redeemGift()">redeem</button>
        </div>
        <div class="gift-msg" id="gift-msg"></div>
      </div>

    </div>`;
  }
  updateStoreView();
  if (window.updateCreditDisplay) window.updateCreditDisplay();
}


export function updateStoreView() {
  const amountEl = document.getElementById('store-credits');
  if (!amountEl) return;
  const subEl    = document.getElementById('store-free-msg');
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
