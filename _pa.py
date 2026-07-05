# patch A: forgot link + forgot/recovery forms in the auth card
import sys
src = open('index.html', encoding='utf-8').read().replace('\r\n', '\n')
if 'forgot-form' in src:
    print('SKIP: patch A already applied'); sys.exit(0)
A = '<button class="auth-btn" onclick="handleLogin()">sign in</button>\n    </div>'
if src.count(A) != 1:
    print('FAIL: login form anchor count =', src.count(A)); sys.exit(1)
NEW = '''<button class="auth-btn" onclick="handleLogin()">sign in</button>
      <div id="auth-forgot-link" onclick="showForgot()"
           style="margin-top:10px;text-align:center;font-size:0.68rem;color:var(--subtext);cursor:pointer">
        forgot password?</div>
    </div>
    <!-- FORGOT PASSWORD -->
    <div id="forgot-form" style="display:none">
      <div class="auth-field">
        <label>email</label>
        <input type="email" id="forgot-email" placeholder="you@example.com" />
      </div>
      <button class="auth-btn" onclick="handleForgotPassword()">send reset link</button>
      <div onclick="backToLogin()"
           style="margin-top:10px;text-align:center;font-size:0.68rem;color:var(--subtext);cursor:pointer">
        back to sign in</div>
    </div>
    <!-- SET NEW PASSWORD (arrives via email link) -->
    <div id="recovery-form" style="display:none">
      <div class="auth-field">
        <label>new password</label>
        <div class="pw-wrap">
          <input type="password" id="recovery-password" placeholder="new password" />
          <button class="pw-toggle" type="button" onclick="togglePw('recovery-password',this)">show</button>
        </div>
      </div>
      <button class="auth-btn" onclick="handleNewPassword()">set new password</button>
    </div>'''
src = src.replace(A, NEW, 1)
open('index.html', 'w', encoding='utf-8').write(src)
print('OK: patch A applied (forgot + recovery forms)')
