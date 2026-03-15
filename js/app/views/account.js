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
    el.innerHTML = `
      <div class="view-scroll-body">
        <div class="view-section-title">account</div>
        <div class="account-email" id="account-email">—</div>
        <button class="signout-btn" onclick="window.handleSignout()">sign out</button>
      </div>`;
    initialized = true;
  }

  // Always refresh email
  const emailEl = document.getElementById('account-email');
  if (emailEl && state.user?.email) emailEl.textContent = state.user.email;
}
