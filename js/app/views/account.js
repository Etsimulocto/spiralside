// ============================================================
// SPIRALSIDE — ACCOUNT VIEW v1.0
// Full-page account tab — email, sign out
// Nimbis anchor: js/app/views/account.js
// ============================================================
import { state } from '../state.js';

let initialized = false;

export function initAccountView() {
  const el = document.getElementById('view-account');
  if (!el) return;

  if (!initialized) {
    initialized = true;
    el.innerHTML = `
      <div style="padding:20px 16px 40px;overflow-y:auto;flex:1;min-height:0;">
        <div style="background:linear-gradient(135deg,rgba(0,246,214,0.08),rgba(124,106,247,0.08));border:1px solid var(--border);border-radius:16px;padding:28px 20px;text-align:center;margin-bottom:20px;">
        <div class="credit-amount" id="account-credits" style="font-family:var(--font-display);font-size:2.4rem;font-weight:800;color:var(--teal);text-align:center;">—</div>
        <div class="credit-label" style="font-size:0.65rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--subtext);text-align:center;margin-top:6px;">credits remaining</div>
      </div>
      <div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--subtext);margin:20px 0 10px;display:flex;align-items:center;gap:8px;">account</div>
        <div class="account-email" id="account-email">—</div>
        <button class="signout-btn" onclick="window.handleSignout()">sign out</button>
      </div>`;
    initialized = true;
  }

  // Always refresh email
  const emailEl = document.getElementById('account-email');
  if (emailEl && state.user?.email) emailEl.textContent = state.user.email;
  if (window.updateCreditDisplay) window.updateCreditDisplay();
}
