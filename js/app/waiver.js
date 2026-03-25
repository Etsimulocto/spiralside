// ============================================================
// SPIRALSIDE -- WAIVER GATE v1.0
// First-launch disclaimer gate -- fires before app ready
// Clickwrap compliant: checkbox unchecked by default
// localStorage key: spiralside_waiver_v1_accepted
// Nimbis anchor: js/app/waiver.js
// ============================================================

const WAIVER_KEY = 'spiralside_waiver_v1_accepted';
export const WAIVER_VERSION_STR = '1.0';

// Resolves immediately if already accepted, else shows overlay
export function checkWaiver() {
  if (localStorage.getItem(WAIVER_KEY) === 'true') return Promise.resolve();
  return new Promise(resolve => { _injectStyles(); _buildDOM(resolve); });
}

function _injectStyles() {
  if (document.getElementById('waiver-styles')) return;
  const s = document.createElement('style');
  s.id = 'waiver-styles';
  s.textContent = `
    #waiver-overlay {
      position:fixed;inset:0;z-index:10000;background:#07070b;
      display:flex;align-items:center;justify-content:center;
      padding:24px 20px;font-family:'DM Mono',monospace;
      transition:opacity 0.4s ease;
    }
    #waiver-overlay.fade-out{opacity:0;pointer-events:none;}
    #waiver-card{
      width:100%;max-width:400px;background:#111118;
      border:1px solid #1e1e2e;border-radius:20px;
      padding:32px 28px;display:flex;flex-direction:column;
    }
    #waiver-logo{text-align:center;margin-bottom:6px;}
    #waiver-logo-text{
      font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;
      letter-spacing:-0.02em;
      background:linear-gradient(135deg,#7c6af7,#f76a8a);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;opacity:0.7;
    }
    #waiver-headline{
      font-family:'Syne',sans-serif;font-weight:700;font-size:1.35rem;
      color:#e8e8f0;text-align:center;margin-bottom:24px;letter-spacing:-0.01em;
    }
    #waiver-points{
      list-style:none;margin:0 0 28px;padding:0;
      display:flex;flex-direction:column;gap:14px;
    }
    #waiver-points li{display:flex;gap:12px;align-items:flex-start;}
    .waiver-bullet{
      flex-shrink:0;width:20px;height:20px;border-radius:50%;
      background:rgba(0,246,214,0.08);border:1px solid rgba(0,246,214,0.25);
      display:flex;align-items:center;justify-content:center;margin-top:1px;
    }
    .waiver-bullet svg{width:10px;height:10px;stroke:#00F6D6;fill:none;stroke-width:2.5;stroke-linecap:round;}
    .waiver-point-text{font-size:0.78rem;line-height:1.55;color:#9090b8;}
    .waiver-point-strong{color:#c8c8e0;font-weight:500;}
    #waiver-divider{height:1px;background:#1e1e2e;margin-bottom:20px;}
    #waiver-check-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:20px;cursor:pointer;}
    #waiver-checkbox{width:18px;height:18px;min-width:18px;accent-color:#00F6D6;margin-top:2px;cursor:pointer;}
    #waiver-check-label{font-size:0.75rem;color:#7070a0;line-height:1.5;cursor:pointer;user-select:none;}
    #waiver-check-label strong{color:#c8c8e0;font-weight:500;}
    #waiver-btn{
      width:100%;padding:14px;
      background:linear-gradient(135deg,#7c6af7,#f76a8a);
      border:none;border-radius:12px;color:#fff;
      font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem;
      letter-spacing:0.04em;cursor:pointer;transition:opacity 0.2s;margin-bottom:16px;
    }
    #waiver-btn:disabled{opacity:0.28;cursor:not-allowed;background:#2a2a3e;}
    #waiver-btn:not(:disabled):hover{opacity:0.88;}
    #waiver-links{text-align:center;font-size:0.62rem;color:#3a3a5a;letter-spacing:0.04em;}
    #waiver-links a{color:#5050a0;text-decoration:none;transition:color 0.2s;}
    #waiver-links a:hover{color:#7c6af7;}
  `;
  document.head.appendChild(s);
}

function _buildDOM(resolve) {
  const overlay = document.createElement('div');
  overlay.id = 'waiver-overlay';
  const tick = `<svg viewBox="0 0 10 8"><polyline points="1,4 3.5,6.5 9,1"/></svg>`;
  overlay.innerHTML = `
    <div id="waiver-card">
      <div id="waiver-logo"><span id="waiver-logo-text">spiralside</span></div>
      <div id="waiver-headline">Before we begin.</div>
      <ul id="waiver-points">
        <li><div class="waiver-bullet">${tick}</div><div class="waiver-point-text">
          <span class="waiver-point-strong">Sky is an AI, not a person.</span>
          She is not a licensed therapist, doctor, lawyer, or financial advisor.
          Nothing she says should be treated as professional advice.</div></li>
        <li><div class="waiver-bullet">${tick}</div><div class="waiver-point-text">
          <span class="waiver-point-strong">You are responsible for what you do with this app.</span>
          Spiralside is not responsible for content you create, share, or act on.
          Use of outputs is entirely at your own risk.</div></li>
        <li><div class="waiver-bullet">${tick}</div><div class="waiver-point-text">
          <span class="waiver-point-strong">This app is for users 18 and older.</span>
          By continuing, you confirm you are at least 18 years of age.</div></li>
        <li><div class="waiver-bullet">${tick}</div><div class="waiver-point-text">
          <span class="waiver-point-strong">AI outputs can be wrong.</span>
          Sky can make mistakes or produce inaccurate information.
          Do not rely on her outputs for real-world decisions.</div></li>
      </ul>
      <div id="waiver-divider"></div>
      <label id="waiver-check-row" for="waiver-checkbox">
        <input type="checkbox" id="waiver-checkbox" />
        <span id="waiver-check-label"><strong>I understand and agree to these terms.</strong></span>
      </label>
      <button id="waiver-btn" disabled>Enter Spiralside</button>
      <div id="waiver-links">
        <a href="/terms" target="_blank">Terms of Service</a> &nbsp;|&nbsp;
        <a href="/privacy" target="_blank">Privacy Policy</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const cb  = document.getElementById('waiver-checkbox');
  const btn = document.getElementById('waiver-btn');
  cb.addEventListener('change', () => { btn.disabled = !cb.checked; });
  btn.addEventListener('click', () => {
    if (!cb.checked) return;
    localStorage.setItem(WAIVER_KEY, 'true');
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.remove(); resolve(); }, 400);
  });
}
