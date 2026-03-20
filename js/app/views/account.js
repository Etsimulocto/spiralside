// ============================================================
// SPIRALSIDE — ACCOUNT VIEW v1.1
// Updates existing index.html account elements — no innerHTML overwrite
// Nimbis anchor: js/app/views/account.js
// ============================================================
import { state } from '../state.js';

export function initAccountView() {
  const el = document.getElementById('view-account');
  if (!el) return;
  const emailEl = document.getElementById('account-email');
  if (emailEl && state.user?.email) emailEl.textContent = state.user.email;
  const avatarEl = document.getElementById('account-fab-initial');
  if (avatarEl && state.user?.email) avatarEl.textContent = state.user.email[0].toUpperCase();
  if (window.updateCreditDisplay) window.updateCreditDisplay();
}
