# patch B: recovery flow logic in auth.js
import sys
src = open('js/app/auth.js', encoding='utf-8').read().replace('\r\n', '\n')
if 'handleForgotPassword' in src:
    print('SKIP: patch B already applied'); sys.exit(0)
# 1) recovery flag - true if we arrived via a reset email link
A1 = "// ── SCREEN ROUTING ─"
if src.count(A1) != 1: print('FAIL: anchor1'); sys.exit(1)
src = src.replace(A1, "let _recovering = window.location.hash.includes('type=recovery');\n\n" + A1, 1)
# 2) guard SIGNED_IN routing + catch PASSWORD_RECOVERY event
A2 = "sb.auth.onAuthStateChange((event, session) => {\n    if (event === 'SIGNED_IN' && session?.user) {"
if src.count(A2) != 1: print('FAIL: anchor2'); sys.exit(1)
N2 = ("sb.auth.onAuthStateChange((event, session) => {\n"
      "    if (event === 'PASSWORD_RECOVERY') { _recovering = true; showScreen('auth'); showRecovery(); return; }\n"
      "    if (event === 'SIGNED_IN' && session?.user) {\n"
      "      if (_recovering) { showScreen('auth'); showRecovery(); return; }")
src = src.replace(A2, N2, 1)
# 3) append the new handlers as exports
src += '''
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
'''
open('js/app/auth.js', 'w', encoding='utf-8').write(src)
print('OK: patch B applied (recovery flow in auth.js)')
