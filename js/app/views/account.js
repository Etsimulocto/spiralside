// SPIRALSIDE — ACCOUNT VIEW v1.2
// HTML lives in index.html — this just refreshes values
// Nimbis anchor: js/app/views/account.js
import { state } from '../state.js';
export function initAccountView() {
  const emailEl = document.getElementById('account-email');
  if (emailEl && state.user?.email) emailEl.textContent = state.user.email;
  const avatarEl = document.getElementById('account-fab-initial');
  if (avatarEl && state.user?.email) avatarEl.textContent = state.user.email[0].toUpperCase();
  if (window.updateCreditDisplay) window.updateCreditDisplay();
}
