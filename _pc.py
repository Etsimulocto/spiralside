# patch C: import + expose new auth handlers in main.js
import sys
src = open('js/app/main.js', encoding='utf-8').read().replace('\r\n', '\n')
if 'handleForgotPassword' in src:
    print('SKIP: patch C already applied'); sys.exit(0)
A1 = "switchAuthTab, togglePw }"
if src.count(A1) != 1: print('FAIL: import anchor'); sys.exit(1)
src = src.replace(A1, "switchAuthTab, togglePw,\n         showForgot, backToLogin, handleForgotPassword, handleNewPassword }", 1)
A2 = "window.handleSignup      = handleSignup;"
if src.count(A2) != 1: print('FAIL: expose anchor'); sys.exit(1)
src = src.replace(A2, A2 + '''
window.showForgot           = showForgot;
window.backToLogin          = backToLogin;
window.handleForgotPassword = handleForgotPassword;
window.handleNewPassword    = handleNewPassword;''', 1)
open('js/app/main.js', 'w', encoding='utf-8').write(src)
print('OK: patch C applied (main.js wiring)')
