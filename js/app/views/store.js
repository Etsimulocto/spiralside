// ============================================================
// SPIRALSIDE — STORE VIEW v3.0
// Credits, packs, feature pricing, storage plans, gifts
// v3: annual archive plan + expiry meter
// Nimbis anchor: js/app/views/store.js
// ============================================================
import { state } from '../state.js';
import { buyPack } from '../ui.js';

const RAIL = 'https://web-production-4e6f3.up.railway.app';

function injectStoreStyles() {
  if (document.getElementById('ss-store-styles')) return;
  const s = document.createElement('style');
  s.id = 'ss-store-styles';
  s.textContent = `
    #view-store { overflow-y: auto; -webkit-overflow-scrolling: touch; }
    .ads-off-building {
      flex-shrink: 0; width: 44px; height: 52px; background: #0b0b12;
      border: 1px solid rgba(255,255,255,0.08); border-bottom: none;
      border-radius: 3px 3px 0 0; cursor: pointer; position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      transition: border-color 0.2s; padding-bottom: 4px;
    }
    .ads-off-building:hover { border-color: rgba(0,246,214,0.45); }
    .ads-off-building.active { border-color: rgba(0,246,214,0.6); background: rgba(0,246,214,0.05); }
    .aob-wins { display: flex; flex-direction: column; align-items: center; gap: 3px; position: absolute; top: 6px; left: 0; right: 0; }
    .aob-row { display: flex; gap: 3px; }
    .aob-w { width: 5px; height: 5px; border-radius: 1px; background: rgba(255,255,255,0.06); transition: background 0.3s; }
    .ads-off-building.active .aob-w { background: rgba(0,246,214,0.55); }
    .aob-label { font-family: var(--font-ui,'DM Mono',monospace); font-size: 0.45rem; letter-spacing: 0.06em; color: rgba(255,255,255,0.3); text-align: center; line-height: 1.2; }
    .ads-off-building.active .aob-label { color: rgba(0,246,214,0.7); }
    .view-scroll-body { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 0; flex: 1; min-height: 0; overflow-y: auto; }
    .credit-hero { background: linear-gradient(135deg, rgba(0,246,214,0.08), rgba(124,106,247,0.08)); border: 1px solid var(--border); border-radius: 16px; padding: 28px 20px; text-align: center; margin-bottom: 20px; }
    .credit-amount { font-family: var(--font-display); font-size: 2.8rem; font-weight: 800; color: var(--teal); line-height: 1; }
    .credit-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin-top: 6px; }
    .credit-sub { font-size: 0.72rem; color: var(--subtext); margin-top: 8px; }
    .pricing-explainer { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; }
    .pe-title { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--subtext); margin-bottom: 4px; }
    .pe-body { font-size: 0.75rem; line-height: 1.5; color: var(--text); }
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
    .feature-cost { font-size: 0.72rem; color: var(--teal); letter-spacing: 0.04em; white-space: nowrap; }
    .storage-plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
    .storage-plan-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 12px; position: relative; overflow: hidden; }
    .storage-plan-card.active { border-color: var(--teal); background: rgba(0,246,214,0.04); }
    .storage-plan-card.popular-annual { border-color: rgba(255,75,203,0.4); }
    .spc-tag { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--teal), var(--purple)); }
    .spc-tag-annual { background: linear-gradient(90deg, var(--pink), var(--purple)); }
    .spc-name { font-family: var(--font-display); font-size: 0.82rem; font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .spc-price { font-size: 1.1rem; font-weight: 800; font-family: var(--font-display); color: var(--teal); }
    .spc-price-annual { color: var(--pink); }
    .spc-period { font-size: 0.55rem; color: var(--subtext); letter-spacing: 0.06em; }
    .spc-storage { font-size: 0.62rem; color: var(--subtext); margin: 6px 0; }
    .spc-savings { font-size: 0.58rem; color: var(--pink); margin-bottom: 6px; }
    .spc-btn { width: 100%; padding: 7px; background: transparent; border: 1px solid var(--teal); border-radius: 8px; color: var(--teal); font-family: var(--font-ui); font-size: 0.62rem; letter-spacing: 0.06em; cursor: pointer; transition: all 0.2s; }
    .spc-btn:hover { background: rgba(0,246,214,0.1); }
    .spc-btn.annual { border-color: var(--pink); color: var(--pink); }
    .spc-btn.annual:hover { background: rgba(255,75,203,0.1); }
    .spc-btn.active-plan { background: rgba(0,246,214,0.12); border-color: var(--teal); cursor: default; font-size: 0.58rem; }
    .plan-meter { margin-top: 10px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
    .plan-meter-title { font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--subtext); margin-bottom: 8px; }
    .plan-meter-bar-wrap { height: 6px; background: var(--muted); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
    .plan-meter-bar { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
    .plan-meter-labels { display: flex; justify-content: space-between; }
    .plan-meter-label { font-size: 0.6rem; color: var(--subtext); }
    .plan-meter-label.right { color: var(--teal); }
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
  el.innerHTML = `
    <div class="view-scroll-body">
      <div class="credit-hero">
        <div class="credit-amount" id="store-credits">0</div>
        <div class="credit-label">credits remaining</div>
        <div class="credit-sub" id="store-free-msg">free demo &mdash; buy credits to unlock real AI</div>
      </div>
      <div class="pricing-explainer">
        <div class="pe-title">how saving works</div>
        <div class="pe-body" style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <span style="color:var(--teal);font-weight:700;">on your device</span> &mdash;
            everything saves locally first. Generated images, frames, comics, vault files stay on your device in private storage. Fast, private, always works offline.
          </div>
          <div>
            <span style="color:var(--teal);font-weight:700;">free cloud sync</span> &mdash;
            your You card, character prints, scenes, worlds, quest progress, and style all sync to the cloud as text. Switch devices and your world comes with you. Images stay on device.
          </div>
          <div>
            <span style="color:var(--pink);font-weight:700;">archive plan</span> &mdash;
            adds cloud backup for images too &mdash; avatars, portraits, scene panels, vault files. 2 GB total. If you lose your device, you lose nothing.
          </div>
          <div style="font-size:0.68rem;color:var(--subtext);border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
            1 cr = $0.0001 &middot; API cost + 17% for hosting &middot; credits never expire
          </div>
        </div>
      </div>

      <div class="view-section-title">buy credits</div>
      <div class="pack-grid">
        <div class="pack-card" onclick="window.buyPack('5')">
          <div class="pack-price">$5</div>
          <div class="pack-credits">500,000 cr</div>
          <div class="pack-bonus">starter</div>
        </div>
        <div class="pack-card popular" onclick="window.buyPack('10')">
          <div class="pack-tag">&#10022; popular</div>
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
      <div class="feature-row"><div class="feature-icon">&#9889;</div><div class="feature-name">chat &mdash; haiku<div class="feature-sub">fast &middot; cost+17%</div></div><div class="feature-cost">~140 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#9678;</div><div class="feature-name">chat &mdash; sky / 4o<div class="feature-sub">character &middot; cost+17%</div></div><div class="feature-cost">~23 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#10022;</div><div class="feature-name">chat &mdash; sonnet<div class="feature-sub">smart &middot; cost+17%</div></div><div class="feature-cost">~527 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#127912;</div><div class="feature-name">image generation<div class="feature-sub">flux schnell</div></div><div class="feature-cost">500 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#127897;</div><div class="feature-name">text to speech<div class="feature-sub">elevenlabs &middot; sky only</div></div><div class="feature-cost">~2 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#127908;</div><div class="feature-name">speech to text<div class="feature-sub">browser native &middot; free</div></div><div class="feature-cost">0 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#128249;</div><div class="feature-name">video generation<div class="feature-sub">wan 2.2 &middot; coming soon</div></div><div class="feature-cost">2,000 cr</div></div>
      <div class="feature-row"><div class="feature-icon">&#8756;</div><div class="feature-name">cannonize thread<div class="feature-sub">haiku &middot; 5 free then cost+17%</div></div><div class="feature-cost">~140 cr</div></div>

      <div class="view-section-title" style="margin-top:24px;">storage plans</div>
      <div class="feature-row" style="background:linear-gradient(135deg,rgba(0,246,214,0.05),rgba(123,95,255,0.05));border-color:rgba(0,246,214,0.15);margin-bottom:10px;">
        <div class="feature-icon" style="font-size:0.7rem;font-weight:700;color:var(--subtext);">FREE</div>
        <div class="feature-name">free storage<div class="feature-sub">canon blocks &amp; text data &middot; 5 MB cloud</div></div>
        <div class="feature-cost" style="color:var(--subtext)">free</div>
      </div>
      <div class="storage-plan-grid">
        <div class="storage-plan-card" id="plan-card-monthly">
          <div class="spc-tag"></div>
          <div class="spc-name">archive</div>
          <div><span class="spc-price">$2</span><span class="spc-period"> / mo</span></div>
          <div class="spc-storage">2 GB &middot; images, files, canon</div>
          <button class="spc-btn" id="plan-btn-monthly" onclick="window.subscribePlan('monthly')">loading...</button>
        </div>
        <div class="storage-plan-card popular-annual" id="plan-card-annual">
          <div class="spc-tag spc-tag-annual"></div>
          <div class="spc-name">archive <span style="font-size:0.6rem;color:var(--pink);letter-spacing:0.08em;">ANNUAL</span></div>
          <div><span class="spc-price spc-price-annual">$19.99</span><span class="spc-period"> / yr</span></div>
          <div class="spc-storage">2 GB &middot; images, files, canon</div>
          <div class="spc-savings">save $4 vs monthly</div>
          <button class="spc-btn annual" id="plan-btn-annual" onclick="window.subscribePlan('annual')">loading...</button>
        </div>
      </div>

      <div class="plan-meter" id="plan-meter" style="display:none;">
        <div class="plan-meter-title">plan active</div>
        <div class="plan-meter-bar-wrap">
          <div class="plan-meter-bar" id="plan-meter-bar" style="width:0%;background:var(--teal);"></div>
        </div>
        <div class="plan-meter-labels">
          <span class="plan-meter-label" id="plan-meter-start"></span>
          <span class="plan-meter-label right" id="plan-meter-end"></span>
        </div>
      </div>

      <div class="view-section-title" style="margin-top:24px;">gift credits</div>
      <div class="gift-box">
        <div class="gift-desc">Send credits from your balance to a friend. Or buy a fresh $5 gift. They redeem the code in their account.</div>
        <div class="gift-send-row">
          <input class="gift-input" id="gift-amount-input" type="number" placeholder="credits to send" min="1000" style="letter-spacing:0;text-transform:none;" />
          <button class="gift-redeem-btn" onclick="window.sendGift()">send from balance</button>
        </div>
        <button class="gift-buy-btn" onclick="window.buyGift()">buy $5 gift &rarr; 500,000 cr</button>
        <div class="gift-divider">redeem a code</div>
        <div class="gift-redeem-row">
          <input class="gift-input" id="gift-code-input" placeholder="SPIRAL-XXXX-XXXX" maxlength="16" />
          <button class="gift-redeem-btn" onclick="window.redeemGift()">redeem</button>
        </div>
        <div class="gift-msg" id="gift-msg"></div>
      </div>

      <div class="view-section-title" style="margin-top:24px;">game maker</div>
      <div class="feature-row" id="bloom-unlock-row" style="background:linear-gradient(135deg,rgba(0,246,214,0.05),rgba(123,95,255,0.05));border-color:rgba(0,246,214,0.15);">
        <div class="feature-icon">&#127918;</div>
        <div class="feature-name">bloomstudio full version<div class="feature-sub">one-time &middot; 100 rooms &middot; 10 cloud slots</div></div>
        <div class="feature-cost">300,000 cr</div>
        <button class="gift-redeem-btn" id="bloom-unlock-btn" onclick="window.unlockBloomstudio()">unlock</button>
      </div>
      <div class="feature-row" id="bloom3d-unlock-row" style="background:linear-gradient(135deg,rgba(0,246,214,0.05),rgba(123,95,255,0.05));border-color:rgba(0,246,214,0.15);margin-top:6px;">
        <div class="feature-icon">&#9670;</div>
        <div class="feature-name">bloom3d all parts<div class="feature-sub">one-time &middot; every pack, plus everything added later</div></div>
        <div class="feature-cost">300,000 cr</div>
        <button class="gift-redeem-btn" id="bloom3d-unlock-btn" onclick="window.unlockBloom3D()">unlock</button>
      </div>
      <div class="view-section-title" style="margin-top:24px;">perks</div>
      <div class="feature-row" id="ads-off-row">
        <div class="feature-icon">&#127751;</div>
        <div class="feature-name">hide skyline ads<div class="feature-sub">one-time &middot; stored locally</div></div>
        <div class="feature-cost">50,000 cr</div>
        <div class="ads-off-building" id="ads-off-btn" onclick="window.toggleAdsOff()" title="click to toggle">
          <div class="aob-wins">
            <div class="aob-row"><div class="aob-w"></div><div class="aob-w"></div><div class="aob-w"></div></div>
            <div class="aob-row"><div class="aob-w"></div><div class="aob-w"></div><div class="aob-w"></div></div>
            <div class="aob-row"><div class="aob-w"></div><div class="aob-w"></div><div class="aob-w"></div></div>
          </div>
          <div class="aob-label" id="ads-off-label">off</div>
        </div>
      </div>
    </div>`;

  updateStoreView();
  if (window.updateCreditDisplay) window.updateCreditDisplay();
  updateAdsOffBtn();
  updateBloomUnlockBtn();
  updateBloom3DUnlockBtn();
  setTimeout(loadPlanStatus, 400);
}

// -- BLOOMSTUDIO UNLOCK ---------------------------------------------------
// One atomic RPC does everything: balance check, deduct, set
// bloomstudio_paid, write the ledger row. The client cannot do any of that
// directly - user_usage is read-only to the browser by design.
window.unlockBloomstudio = async function() {
  if (!state.user) { alert('Sign in first.'); return; }
  const btn = document.getElementById('bloom-unlock-btn');
  const old = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  try {
    const { data, error } = await window._sb.rpc('bloomstudio_unlock');
    if (error) { alert('Unlock failed. Try again.'); return; }
    if (!data || !data.ok) {
      if (data && data.error === 'insufficient') {
        alert('Not enough credits.\n\nNeed ' + Number(data.need).toLocaleString() +
              ' cr, you have ' + Number(data.have).toLocaleString() +
              ' cr.\n\nBuy credits above, then come back.');
      } else if (data && data.error === 'not_signed_in') {
        alert('Sign in first.');
      } else {
        alert('Unlock failed. Try again.');
      }
      return;
    }
    // Keep the in-memory balance honest with what the server just did.
    if (typeof data.credits === 'number') state.credits = data.credits;
    if (window.updateCreditDisplay) window.updateCreditDisplay();
    // Tell a live BloomStudio frame to re-read its entitlement, so the caps
    // drop without a reload. Design exposes this hook; absent = harmless.
    if (typeof window.bloomstudioRefreshPaid === 'function') {
      try { window.bloomstudioRefreshPaid(); } catch (e) {}
    }
    alert(data.already
      ? 'Already unlocked - no credits spent.'
      : 'BloomStudio unlocked. 100 rooms and 10 cloud slots are yours.');
  } catch (e) {
    alert('Unlock failed. Try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = old || 'unlock'; }
    updateBloomUnlockBtn();
  }
};

// Reads its own row (allowed - "Users can read own usage" policy) and
// flips the button to an owned state. Self-contained on purpose so it
// cannot interfere with loadPlanStatus.
async function updateBloomUnlockBtn() {
  const btn = document.getElementById('bloom-unlock-btn');
  const row = document.getElementById('bloom-unlock-row');
  if (!btn || !window._sb) return;
  try {
    const { data: { session } } = await window._sb.auth.getSession();
    if (!session) { btn.textContent = 'sign in'; btn.disabled = true; return; }
    const { data } = await window._sb
      .from('user_usage')
      .select('bloomstudio_paid')
      .eq('user_id', session.user.id)
      .single();
    if (data && data.bloomstudio_paid) {
      btn.textContent = 'owned';
      btn.disabled = true;
      if (row) row.style.opacity = '0.65';
    } else {
      btn.textContent = 'unlock';
      btn.disabled = false;
      if (row) row.style.opacity = '';
    }
  } catch (e) { /* leave the button as-is on any failure */ }
}

// -- BLOOM3D UNLOCK -------------------------------------------------------
// Same shape as unlockBloomstudio: one atomic RPC checks the balance,
// deducts, flips bloom3d_paid and writes the ledger row. The RPC returns
// the ledger row id, which becomes the grant's ref inside the engine.
window.unlockBloom3D = async function() {
  if (!state.user) { alert('Sign in first.'); return; }
  const btn = document.getElementById('bloom3d-unlock-btn');
  const old = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  try {
    const { data, error } = await window._sb.rpc('bloom3d_unlock');
    if (error) { alert('Unlock failed. Try again.'); return; }
    if (!data || !data.ok) {
      if (data && data.error === 'insufficient') {
        alert('Not enough credits.\n\nNeed ' + Number(data.need).toLocaleString() +
              ' cr, you have ' + Number(data.have).toLocaleString() +
              ' cr.\n\nBuy credits above, then come back.');
      } else if (data && data.error === 'not_signed_in') {
        alert('Sign in first.');
      } else {
        alert('Unlock failed. Try again.');
      }
      return;
    }
    if (typeof data.credits === 'number') state.credits = data.credits;
    if (window.updateCreditDisplay) window.updateCreditDisplay();
    // Park the fresh grant on state, then push it to a live frame so an
    // open picker ungreys in place. No reload needed.
    state.bloom3dPaid = true;
    state.bloom3dRef  = data.ref || '';
    if (typeof window.bloom3dRefreshEntitlement === 'function') {
      try { window.bloom3dRefreshEntitlement(); } catch (e) {}
    }
    alert(data.already
      ? 'Already unlocked - no credits spent.'
      : 'BLOOM3D parts unlocked. Every pack is yours.');
  } catch (e) {
    alert('Unlock failed. Try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = old || 'unlock'; }
    updateBloom3DUnlockBtn();
  }
};

// Reads the caller's own entitlement and flips the button to owned.
async function updateBloom3DUnlockBtn() {
  const btn = document.getElementById('bloom3d-unlock-btn');
  const row = document.getElementById('bloom3d-unlock-row');
  if (!btn || !window._sb) return;
  try {
    const { data: { session } } = await window._sb.auth.getSession();
    if (!session) { btn.textContent = 'sign in'; btn.disabled = true; return; }
    const { data } = await window._sb.rpc('bloom3d_entitlement');
    if (data && data.paid) {
      btn.textContent = 'owned';
      btn.disabled = true;
      if (row) row.style.opacity = '0.65';
    } else {
      btn.textContent = 'unlock';
      btn.disabled = false;
      if (row) row.style.opacity = '';
    }
  } catch (e) { /* leave the button as-is on any failure */ }
}

function updateAdsOffBtn() {
  const btn   = document.getElementById('ads-off-btn');
  const label = document.getElementById('ads-off-label');
  if (!btn) return;
  const off = localStorage.getItem('ss_ads_off') === '1';
  btn.classList.toggle('active', off);
  if (label) label.textContent = off ? 'on' : 'off';
}

export function updateStoreView() {
  const amountEl = document.getElementById('store-credits');
  if (!amountEl) return;
  const subEl = document.getElementById('store-free-msg');
  if (state.isPaid) {
    amountEl.textContent = Math.round(state.credits || 0).toLocaleString();
    if (subEl) subEl.textContent = 'paid account';
  } else {
    amountEl.textContent = '0';
    if (subEl) subEl.textContent = 'free demo \u2014 buy credits to unlock real AI';
  }
}

// -- PLAN STATUS LOADER ---------------------------------------------------
async function loadPlanStatus() {
  const btnM = document.getElementById('plan-btn-monthly');
  const btnA = document.getElementById('plan-btn-annual');
  const meter = document.getElementById('plan-meter');
  if (!btnM || !btnA || !window._sb) return;

  try {
    const { data: { session } } = await window._sb.auth.getSession();
    if (!session) {
      btnM.textContent = 'subscribe $2/mo';
      btnA.textContent = 'subscribe $19.99/yr';
      return;
    }

    const { data } = await window._sb
      .from('user_usage')
      .select('storage_plan, storage_expires_at, plan_purchased_at, plan_type')
      .eq('user_id', session.user.id)
      .single();

    const plan    = data?.storage_plan || 'free';
    const exp     = data?.storage_expires_at ? new Date(data.storage_expires_at) : null;
    const bought  = data?.plan_purchased_at  ? new Date(data.plan_purchased_at)  : null;
    const type    = data?.plan_type || 'free';
    const active  = plan === 'archive' && exp && exp > new Date();

    if (active) {
      const isAnnual = type === 'archive_annual';
      const daysLeft = Math.max(0, Math.ceil((exp - new Date()) / 86400000));
      const totalDays = isAnnual ? 365 : 30;
      const pct = Math.max(4, Math.round((daysLeft / totalDays) * 100));
      const color = daysLeft < 7 ? 'var(--pink)' : daysLeft < 30 ? '#FFD93D' : 'var(--teal)';

      // Update buttons
      if (isAnnual) {
        btnA.textContent = daysLeft + ' days left';
        btnA.className = 'spc-btn annual active-plan';
        btnM.textContent = 'subscribe $2/mo';
        document.getElementById('plan-card-annual').classList.add('active');
      } else {
        btnM.textContent = daysLeft + ' days left';
        btnM.className = 'spc-btn active-plan';
        btnA.textContent = 'upgrade to annual';
        document.getElementById('plan-card-monthly').classList.add('active');
      }

      // Show meter
      if (meter) {
        meter.style.display = 'block';
        const bar = document.getElementById('plan-meter-bar');
        const startEl = document.getElementById('plan-meter-start');
        const endEl   = document.getElementById('plan-meter-end');
        if (bar) { bar.style.width = pct + '%'; bar.style.background = color; }
        if (startEl && bought) startEl.textContent = bought.toLocaleDateString();
        if (endEl && exp) endEl.textContent = daysLeft + ' days remaining';
        document.querySelector('.plan-meter-title').textContent =
          isAnnual ? 'annual archive plan' : 'monthly archive plan';
      }
    } else {
      btnM.textContent = 'subscribe $2/mo';
      btnA.textContent = 'subscribe $19.99/yr';
      if (meter) meter.style.display = 'none';
    }
  } catch(e) {
    btnM.textContent = 'subscribe $2/mo';
    btnA.textContent = 'subscribe $19.99/yr';
  }
}

// -- SUBSCRIBE HANDLER ---------------------------------------------------
// Called from ui.js handlePayPalReturn after successful payment
window.refreshPlanStatus = async function() {
  await loadPlanStatus();
  // Show confirmation toast if plan is now active
  const meter = document.getElementById('plan-meter');
  if (meter && meter.style.display !== 'none') {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--teal);color:#000;font-family:var(--font-ui);font-size:0.75rem;padding:10px 20px;border-radius:20px;z-index:9999;font-weight:700;letter-spacing:0.06em;box-shadow:0 4px 20px rgba(0,246,214,0.4);';
    toast.textContent = 'archive plan active';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
};

window.subscribePlan = async function(type) {
  if (!state.user) { alert('Sign in first.'); return; }
  const endpoint = type === 'annual'
    ? RAIL + '/create-annual-storage-order'
    : RAIL + '/create-storage-order';
  try {
    let token = state.session?.access_token;
    if (!token) { const {data} = await window._sb.auth.getSession(); token = data?.session?.access_token; }
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({})
    });
    const d = await r.json();
    if (!r.ok) { alert(d.detail || 'Error'); return; }
    window.location.href = d.approve_url;
  } catch(e) { alert('Payment error. Try again.'); }
};

// -- TOGGLE ADS OFF ------------------------------------------------------
window.toggleAdsOff = function() {
  const already = localStorage.getItem('ss_ads_off') === '1';
  if (already) { localStorage.removeItem('ss_ads_off'); updateAdsOffBtn(); return; }
  const COST = 50000;
  if (!state.isPaid) { alert('You need a paid account to use this perk.'); return; }
  if ((state.credits || 0) < COST) { alert('Not enough credits. Need 50,000 cr.'); return; }
  if (!confirm('Spend 50,000 cr to hide the skyline ads?')) return;
  state.credits = (state.credits || 0) - COST;
  localStorage.setItem('ss_ads_off', '1');
  updateAdsOffBtn();
  if (window.updateCreditDisplay) window.updateCreditDisplay();
  const t = document.getElementById('skyline-ticker');
  if (t) t.classList.remove('visible');
};
