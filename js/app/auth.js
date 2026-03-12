// ============================================================
// SPIRALSIDE — AUTH v1.1
// Supabase init, login/signup/signout, screen routing
// v1.1: auto token refresh — expired sessions silently renewed
// Nimbis anchor: js/app/auth.js
// ============================================================

import { state } from './state.js';

// ── SUPABASE CLIENT ───────────────────────────────────────────
// supabase global is loaded via CDN script tag in index.html
const { createClient } = supabase;
export const sb = createClient(
  'https://qfawusrelwthxabfbglg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E',
  {
    // Tell Supabase to auto-refresh the token before it expires
    auth: {
      autoRefreshToken:    true,   // renews JWT automatically
      persistSession:      true,   // keeps session in localStorage
      detectSessionInUrl:  true,   // handles magic link / OAuth returns
    }
  }
);

// ── SCREEN ROUTING ────────────────────────────────────────────
export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
}

// ── CHECK SESSION AND ROUTE ───────────────────────────────────
// Called after comic finishes — routes to app or auth
// Tries to refresh the session first so expired tokens don't
// strand the user on a blank screen
export function checkAuthAndShow(onAppReady) {
  sb.auth.getSession().then(async ({ data }) => {

    let session = data?.session;

    // If session exists but token looks stale, force a refresh
    if (session) {
      try {
        const { data: refreshed } = await sb.auth.refreshSession();
        if (refreshed?.session) session = refreshed.session;
      } catch (_) {
        // Refresh failed — session is genuinely dead, go to auth
        session = null;
      }
    }

    if (session?.user) {
      state.user    = session.user;
      state.session = session;
      showScreen('app');
      onAppReady();
    } else {
      // Clear any stale local session data before showing auth
      await sb.auth.signOut();
      showScreen('auth');
    }
  });
}

// ── LISTEN FOR AUTH CHANGES ───────────────────────────────────
// Keeps state.session in sync whenever Supabase auto-refreshes
// the token in the background (happens every ~55 minutes)
export function listenAuthChanges() {
  sb.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
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
  showScreen('auth');
}

// ── GET FRESH TOKEN ───────────────────────────────────────────
// Used by chat/usage/paypal — always returns a valid token
// Silently refreshes if current one is expired
export async function getToken() {
  // Try current in-memory token first
  let token = state.session?.access_token;
  if (token) return token;

  // Fall back to reading from storage
  const { data } = await sb.auth.getSession();
  if (data?.session) {
    state.session = data.session;
    return data.session.access_token;
  }

  // Last resort — force a refresh
  try {
    const { data: refreshed } = await sb.auth.refreshSession();
    if (refreshed?.session) {
      state.session = refreshed.session;
      return refreshed.session.access_token;
    }
  } catch (_) {}

  return null;
}
