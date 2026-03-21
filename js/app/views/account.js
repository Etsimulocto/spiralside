// ============================================================
// SPIRALSIDE — ACCOUNT VIEW v2.1
// Full module — owns its own HTML and CSS like store.js
// Nimbis anchor: js/app/views/account.js
// Added: About section at bottom with legal links + version
// ============================================================
import { state } from '../state.js';

let initialized = false;

function injectAccountStyles() {
  if (document.getElementById('ss-account-styles')) return;
  const s = document.createElement('style');
  s.id = 'ss-account-styles';
  s.textContent = `
    #view-account { flex-direction: column; overflow: hidden; }
    .acct-scroll { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px 16px 40px; }
    .acct-avatar-wrap { text-align: center; padding: 32px 0 24px; }
    .acct-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--teal), var(--accent)); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; border: 3px solid var(--border); color: #0a0a0f; }
    .acct-email { font-size: 0.8rem; color: var(--subtext); text-align: center; margin-bottom: 4px; }
    .acct-credit-hero { background: linear-gradient(135deg, rgba(0,246,214,0.08), rgba(124,106,247,0.08)); border: 1px solid var(--border); border-radius: 16px; padding: 28px 20px; text-align: center; margin-bottom: 20px; }
    .acct-credit-amount { font-family: var(--font-display); font-size: 2.8rem; font-weight: 800; color: var(--teal); line-height: 1; }
    .acct-credit-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin-top: 6px; }
    .acct-section-title { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; }
    .acct-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .acct-signout-btn { width: 100%; padding: 13px; background: transparent; border: 1px solid var(--border); border-radius: 12px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.8rem; cursor: pointer; letter-spacing: 0.04em; transition: all 0.2s; margin-bottom: 10px; display: block; }
    .acct-signout-btn:hover { border-color: var(--accent2); color: var(--accent2); }
    .acct-buy-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--teal), var(--accent)); border: none; border-radius: 12px; color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s; display: block; }
    .acct-buy-btn:hover { opacity: 0.88; }

    /* ── About section ── */
    .acct-about-block { margin-top: 8px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; }
    .acct-about-tagline { font-size: 0.75rem; color: var(--subtext); line-height: 1.5; margin-bottom: 14px; }
    .acct-about-links { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .acct-about-link { font-size: 0.75rem; color: var(--teal); text-decoration: none; letter-spacing: 0.02em; opacity: 0.85; transition: opacity 0.2s; }
    .acct-about-link:hover { opacity: 1; text-decoration: underline; }
    .acct-about-contact { font-size: 0.7rem; color: var(--subtext); line-height: 1.6; }
    .acct-about-contact a { color: var(--subtext); text-decoration: none; }
    .acct-about-contact a:hover { color: var(--teal); }
    .acct-version { font-size: 0.6rem; letter-spacing: 0.1em; color: var(--subtext); opacity: 0.4; text-align: center; margin-top: 12px; }
  `;
  document.head.appendChild(s);
}

export function initAccountView() {
  const el = document.getElementById('view-account');
  if (!el) return;
  injectAccountStyles();
  if (!initialized) {
    initialized = true;
    el.innerHTML = `
      <div class="acct-scroll">

        <!-- ── Avatar + email ── -->
        <div class="acct-avatar-wrap">
          <div class="acct-avatar" id="acct-avatar-initial">?</div>
          <div class="acct-email" id="acct-email">—</div>
        </div>

        <!-- ── Credits ── -->
        <div class="acct-section-title">credits</div>
        <div class="acct-credit-hero">
          <div class="acct-credit-amount" id="account-credits">0</div>
          <div class="acct-credit-label">credits remaining</div>
        </div>

        <!-- ── Account actions ── -->
        <div class="acct-section-title">account</div>
        <button class="acct-signout-btn" onclick="window.handleSignout()">sign out</button>
        <button class="acct-buy-btn" onclick="window.switchView('store')">buy credits</button>

        <!-- ── About ── -->
        <div class="acct-section-title">about</div>
        <div class="acct-about-block">
          <p class="acct-about-tagline">
            Spiralside is your space. Everything you create here belongs to you —
            we don't own it, train on it, or sell it. Ever.
          </p>
          <div class="acct-about-links">
            <a class="acct-about-link" href="https://spiralside.com/terms" target="_blank" rel="noopener">Terms of Service</a>
            <a class="acct-about-link" href="https://spiralside.com/privacy" target="_blank" rel="noopener">Privacy Policy</a>
            <a class="acct-about-link" href="https://spiralside.com/disclaimer" target="_blank" rel="noopener">Liability Disclaimer</a>
          </div>
          <div class="acct-about-contact">
            Questions? <a href="mailto:support@spiralside.com">support@spiralside.com</a><br>
            Legal: <a href="mailto:legal@spiralside.com">legal@spiralside.com</a><br>
            Complaints: <a href="mailto:complaints@spiralside.com">complaints@spiralside.com</a>
          </div>
          <div class="acct-version">spiralside v1.0 · built in tennessee · signal clean</div>
        </div>

      </div>
    `;
  }
  updateAccountView();
}

export function updateAccountView() {
  const emailEl  = document.getElementById('acct-email');
  const avatarEl = document.getElementById('acct-avatar-initial');
  const crEl     = document.getElementById('account-credits');
  if (emailEl  && state.user?.email) emailEl.textContent  = state.user.email;
  if (avatarEl && state.user?.email) avatarEl.textContent = state.user.email[0].toUpperCase();
  if (crEl) crEl.textContent = state.isPaid ? Math.round(state.credits).toLocaleString() : '—';
}
