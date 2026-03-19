// ============================================================
// SPIRALSIDE — PI VIEW v0.1 (stub)
// Bloomslice Studio — maker/STEM tab
// Placeholder with Sky intro — full build next session
// Nimbis anchor: js/app/views/pi.js
// ============================================================

// ── STATE ─────────────────────────────────────────────────
let initialized = false; // prevent double-init

// ── INIT ──────────────────────────────────────────────────
export function initPiView() {
  const el = document.getElementById('view-pi');
  if (!el || initialized) return;
  initialized = true;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;background:#08080d;align-items:center;justify-content:center;padding:32px;text-align:center;font-family:"DM Mono",monospace;';

  wrap.innerHTML = `
    <div style="font-size:3rem;margin-bottom:24px;">🍓</div>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;
                background:linear-gradient(135deg,#FF4BCB,#00F6D6);
                -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                margin-bottom:16px;">
      Bloomslice Studio
    </div>
    <div style="font-size:0.78rem;color:#9090c0;line-height:1.8;max-width:340px;margin-bottom:32px;">
      Tell me what you want to build and I'll write the code,
      explain every line, and show you how to wire it up.
      <br><br>
      <span style="color:#FF4BCB;">Coming soon.</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:360px;">
      ${['🔴 Blink LED','📡 Read Sensor','🌐 Web Server','📷 Camera','🎛️ Servo','📊 Data Logger']
        .map(p => `<div style="padding:8px 14px;background:#111118;border:1px solid #FF4BCB33;
                               border-radius:20px;color:#9090c0;font-size:0.68rem;
                               letter-spacing:0.06em;">${p}</div>`).join('')}
    </div>
    <div style="margin-top:40px;font-size:0.62rem;color:#9090c033;letter-spacing:0.1em;">
      BLOOMSLICE STUDIO · SPIRALSIDE
    </div>
  `;

  el.appendChild(wrap);
}
