// ============================================================
// SPIRALSIDE — AUTH v1.3
// v1.3: onAuthStateChange now routes to app on SIGNED_IN
//       fixes login succeeding but screen not changing
// Nimbis anchor: js/app/auth.js
// ============================================================

import { state } from './state.js';

// ── SUPABASE CLIENT ───────────────────────────────────────────
const { createClient } = supabase;
export const sb = createClient(
  'https://qfawusrelwthxabfbglg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E',
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
      showScreen('app');
      onAppReady();
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
    if (event === 'SIGNED_IN' && session?.user) {
      state.user    = session.user;
      state.session = session;
      showScreen('app');
      // Call onAppReady if it hasn't been called yet
      if (window._onAppReady) {
        const fn = window._onAppReady;
        window._onAppReady = null; // only call once
        fn();
      }
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      // Keep state in sync on background refresh
      state.user    = session.user;
      state.session = session;
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
