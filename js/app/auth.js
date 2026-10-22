// ============================================================
// SPIRALSIDE — AUTH v1.3
// v1.3: onAuthStateChange now routes to app on SIGNED_IN
//       fixes login succeeding but screen not changing
// Nimbis anchor: js/app/auth.js
// ============================================================

import { checkWaiver, WAIVER_VERSION_STR } from './waiver.js';
import { state } from './state.js';

// ── SUPABASE CLIENT ───────────────────────────────────────────
const { createClient } = supabase;
export const sb = createClient(
  'https://qfawusrelwthxabfbglg.supabase.co',
  'sb_publishable_K4gWB2MTrt7y8sypQ7VZdg__8wxn049',
  {
    auth: {
      autoRefreshToken:   true,
      detectSessionInUrl: true,
      storage:            window.localStorage,
      storageKey:         'ss_auth',
      persistSession:     true,
    }
  }
);


// ── EXPOSE SHELL GLOBALS FOR THE BLOOMSTUDIO IFRAME ───────────
// BloomStudio runs in an iframe and resolves its pricing tier by looking
// UP at this page for `window.sb` and `window.state`. Finding both means
// "a Spiralside shell is hosting me" -> it reads
// user_usage.bloomstudio_paid and gates accordingly. Finding neither
// means "no shell, I'm on some random web host" -> free demo tier,
// 1 slot / 3 rooms / 50 sprites, for EVERY user including paid ones.
//
// Spiralside is an ES-module app, so `sb` and `state` are module-scoped
// and never reach window on their own. These two assignments are the
// entire contract. Do not remove them.
//
// Deliberately NOT setting window.bloomstudioTier here: that override
// short-circuits the database read, which would mean maintaining tier
// logic in two places. The DB stays the single source of truth.
window.sb = sb;
window.state = state;

// Nudge the iframe to re-read the tier once auth resolves. Without this
// a user who signs in mid-session keeps whatever tier was resolved at
// iframe boot until they reload. The engine also retries on its own with
// backoff and re-checks on window focus, so this is belt-and-braces.
// Located by src rather than a view id so it survives tab renames.
export function refreshBloomTier() {
  try {
    const f = document.querySelector('iframe[src*="bloomstudio"]');
    if (f && f.contentWindow && f.contentWindow.bloomstudioRefreshPaid) {
      f.contentWindow.bloomstudioRefreshPaid();
    }
  } catch (e) {
    // Cross-origin or iframe not mounted yet. Harmless -- the engine's
    // own retry and focus handlers will pick it up.
  }
}
window.refreshBloomTier = refreshBloomTier;
let _recovering = window.location.hash.includes('type=recovery');

// ── SCREEN ROUTING ────────────────────────────────────────────
export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
}

// ── CHECK SESSION AND ROUTE ───────────────────────────────────
// Called once after comic finishes
export function checkAuthAndShow(onAppReady) {
  // Store the callback so listenAuthChanges can call it too
  window._onAppReady = onAppReady;

  sb.auth.getSession().then(async ({ data }) => {
    let session = data?.session;
    if (session) {
      try {
        const { data: refreshed } = await sb.auth.refreshSession();
        if (refreshed?.session) session = refreshed.session;
      } catch (_) {
        session = null;
      }
    }
    if (session?.user) {
      state.user    = session.user;
      state.session = session;
      try { window.refreshBloomTier && window.refreshBloomTier(); } catch (e) {}
      showScreen('app');
      checkWaiver().then(() => {
        onAppReady();
      });
    } else {
      await sb.auth.signOut();
      showScreen('auth');
    }
  });
}

// ── LISTEN FOR AUTH CHANGES ───────────────────────────────────
// SIGNED_IN fires after handleLogin() succeeds — route to app
export function listenAuthChanges() {
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { _recovering = true; showScreen('auth'); showRecovery(); return; }
    if (event === 'SIGNED_IN' && session?.user) {
      if (_recovering) { showScreen('auth'); showRecovery(); return; }
      state.user    = session.user;
      state.session = session;
      try { window.refreshBloomTier && window.refreshBloomTier(); } catch (e) {}
      showScreen('app');
      // Call onAppReady if it hasn't been called yet
      if (window._onAppReady) {
        const fn = window._onAppReady;
        window._onAppReady = null; // only call once
        checkWaiver().then(() => {
          fn();
        });
      }
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      // Keep state in sync on background refresh
      state.user    = session.user;
      state.session = session;
      try { window.refreshBloomTier && window.refreshBloomTier(); } catch (e) {}
    } else if (event === 'SIGNED_OUT') {
      state.user    = null;
      state.session = null;
    }
  });
}

// ── PASSWORD VISIBILITY TOGGLE ────────────────────────────────
export function togglePw(id, btn) {
  const input     = document.getElementById(id);
  input.type      = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? 'show' : 'hide';
}

// ── AUTH TAB SWITCH ───────────────────────────────────────────
export function switchAuthTab(t) {
  document.getElementById('login-form').style.display  = t === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form').style.display = t === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  t === 'login');
  document.getElementById('tab-signup').classList.toggle('active', t === 'signup');
  document.getElementById('auth-error').textContent = '';
}

// ── ERROR DISPLAY ─────────────────────────────────────────────
function setAuthError(msg, success = false) {
  const el  = document.getElementById('auth-error');
  el.textContent = msg;
  el.className   = 'auth-error' + (success ? ' auth-success' : '');
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const btn   = document.querySelector('#login-form .auth-btn');
  btn.disabled = true; btn.textContent = 'signing in...';
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  btn.disabled = false; btn.textContent = 'sign in';
  if (error) setAuthError(error.message);
  // On success, onAuthStateChange fires SIGNED_IN and routes to app
}

// ── SIGNUP ────────────────────────────────────────────────────
export async function handleSignup() {
  if (!document.getElementById('age-check').checked) {
    setAuthError('You must confirm your age.');
    return;
  }
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  const btn   = document.querySelector('#signup-form .auth-btn');
  btn.disabled = true; btn.textContent = 'creating...';
  const { error } = await sb.auth.signUp({ email, password: pass });
  btn.disabled = false; btn.textContent = 'create account';
  if (error) setAuthError(error.message);
  else setAuthError('Check your email to confirm!', true);
}

// ── SIGNOUT ───────────────────────────────────────────────────
export async function handleSignout(closePanel) {
  await sb.auth.signOut();
  closePanel();
  state.user    = null;
  state.session = null;
  window._onAppReady = null;
  showScreen('auth');
}

// ── GET FRESH TOKEN ───────────────────────────────────────────
export async function getToken() {
  let token = state.session?.access_token;
  if (token) return token;
  const { data } = await sb.auth.getSession();
  if (data?.session) {
    state.session = data.session;
    return data.session.access_token;
  }
  try {
    const { data: refreshed } = await sb.auth.refreshSession();
    if (refreshed?.session) {
      state.session = refreshed.session;
      return refreshed.session.access_token;
    }
  } catch (_) {}
  return null;
}

// ── FORGOT / RESET PASSWORD ──────────────────────────────────
export function showForgot() {
  document.getElementById('login-form').style.display  = 'none';
  document.getElementById('forgot-form').style.display = 'block';
  document.getElementById('auth-error').textContent = '';
}
export function backToLogin() {
  document.getElementById('forgot-form').style.display   = 'none';
  document.getElementById('recovery-form').style.display = 'none';
  document.getElementById('login-form').style.display    = 'block';
  document.getElementById('auth-error').textContent = '';
}
export function showRecovery() {
  ['login-form','signup-form','forgot-form'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  document.getElementById('recovery-form').style.display = 'block';
}
export async function handleForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { setAuthError('Enter your email first.'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) setAuthError(error.message);
  else setAuthError('Reset link sent - check your email!', true);
}
export async function handleNewPassword() {
  const pass = document.getElementById('recovery-password').value;
  if (!pass || pass.length < 6) { setAuthError('Password must be at least 6 characters.'); return; }
  const { error } = await sb.auth.updateUser({ password: pass });
  if (error) { setAuthError(error.message); return; }
  _recovering = false;
  setAuthError('Password updated! Loading...', true);
  window.location.hash = '';
  setTimeout(() => window.location.reload(), 800);
}
