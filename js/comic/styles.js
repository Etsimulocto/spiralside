// ============================================================
// SPIRALSIDE — COMIC STYLES v1.0
// All CSS injection for the comic viewer overlay
// No markup here — pure style rules only
// Nimbis anchor: js/comic/styles.js
// ============================================================

// Injects all comic viewer styles into the document head
// Safe to call multiple times — checks for existing tag first
export function injectStyles() {

  // Skip if already injected
  if (document.getElementById('comic-styles')) return;

  const s = document.createElement('style');
  s.id = 'comic-styles';
  s.textContent = `
    /* ── OVERLAY ── */
    #comic-overlay {
      position:fixed;inset:0;z-index:9999;
      background:#101014;
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Mono',monospace;
      transition:opacity 0.5s ease;
    }
    #comic-overlay.fade-out { opacity:0; pointer-events:none; }

    /* ── PANEL CONTAINER ── */
    #comic-panel {
      position:relative;
      width:100%;max-width:480px;height:calc(var(--vh, 1vh) * 100);
      overflow:hidden;
      display:flex;flex-direction:column;justify-content:flex-end;
    }

    /* ── BACKGROUND ── */
    #comic-bg {
      position:absolute;inset:0;
      background-size:cover;background-position:center;
      transition:opacity 0.2s;
    }
    #comic-bg.glitch { animation:glitchBg 0.4s steps(2) forwards; }
    #comic-bg.crash  { animation:crashIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
    #comic-bg.fade   { animation:fadeIn 0.5s ease forwards; }

    @keyframes glitchBg {
      0%  { filter:hue-rotate(0deg)   brightness(1);   transform:translate(0,0);     }
      25% { filter:hue-rotate(90deg)  brightness(2);   transform:translate(-4px,2px); }
      50% { filter:hue-rotate(180deg) brightness(0.5); transform:translate(4px,-2px); }
      75% { filter:hue-rotate(270deg) brightness(1.5); transform:translate(-2px,4px); }
      100%{ filter:hue-rotate(0deg)   brightness(1);   transform:translate(0,0);     }
    }
    @keyframes crashIn {
      0%  { transform:scale(1.3) rotate(-3deg); opacity:0; }
      100%{ transform:scale(1)   rotate(0deg);  opacity:1; }
    }
    @keyframes fadeIn {
      0%  { opacity:0; } 100% { opacity:1; }
    }

    /* ── SCANLINES ── */
    #comic-scanlines {
      position:absolute;inset:0;pointer-events:none;z-index:2;
      background:repeating-linear-gradient(
        0deg,
        transparent,transparent 2px,
        rgba(0,246,214,0.025) 2px,rgba(0,246,214,0.025) 4px
      );
    }

    /* ── CRACK EFFECT ── */
    #comic-crack {
      position:absolute;inset:0;pointer-events:none;z-index:3;
      opacity:0;transition:opacity 0.4s;
      background:
        linear-gradient(135deg,transparent 40%,rgba(0,246,214,0.2) 50%,transparent 60%),
        linear-gradient(225deg,transparent 40%,rgba(255,75,203,0.15) 50%,transparent 60%);
    }
    #comic-crack.show { opacity:1; }

    /* ── VIGNETTE ── */
    #comic-vignette {
      position:absolute;inset:0;pointer-events:none;z-index:4;
      box-shadow:inset 0 0 60px rgba(0,0,0,0.7);
    }

    /* ── DIALOGUE BOX ── */
    #comic-dialogue {
      position:relative;z-index:10;
      margin:0 16px 24px;
      background:rgba(16,16,20,0.93);
      border:2px solid #00F6D6;
      border-radius:4px 16px 16px 16px;
      padding:14px 16px;
      box-shadow:0 0 24px rgba(0,246,214,0.25), inset 0 0 16px rgba(0,0,0,0.4);
      min-height:80px;
      clip-path:polygon(0 12px,12px 0,100% 0,100% 100%,0 100%);
    }
    #comic-speaker {
      font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;
      font-weight:700;margin-bottom:6px;min-height:14px;color:#00F6D6;
    }
    #comic-speaker.sky      { color:#00F6D6; }
    #comic-speaker.monday   { color:#FF4BCB; }
    #comic-speaker.cold     { color:#4DA3FF; }
    #comic-speaker.grit     { color:#FFD93D; }
    #comic-speaker.narrator { color:#F3F7FF; font-style:italic; letter-spacing:0.06em; }
    #comic-text {
      font-size:0.88rem;line-height:1.65;color:#F3F7FF;min-height:42px;
    }

    /* ── PANEL DOTS ── */
    #comic-counter {
      position:absolute;top:20px;right:20px;z-index:20;
      display:flex;gap:6px;align-items:center;
    }
    .comic-dot {
      width:6px;height:6px;border-radius:50%;
      background:rgba(243,247,255,0.18);
      transition:background 0.3s,transform 0.3s;
    }
    .comic-dot.active { background:#00F6D6; transform:scale(1.5); }
    .comic-dot.done   { background:rgba(0,246,214,0.35); }

    /* ── SKIP BUTTON ── */
    #comic-skip {
      position:absolute;top:20px;left:20px;z-index:20;
      background:rgba(16,16,20,0.75);
      border:1px solid rgba(243,247,255,0.18);
      border-radius:20px;padding:6px 14px;
      color:rgba(243,247,255,0.45);
      font-family:'DM Mono',monospace;font-size:0.6rem;
      letter-spacing:0.1em;cursor:pointer;
      opacity:0;pointer-events:none;transition:all 0.3s;
    }
    #comic-skip.visible       { opacity:1;pointer-events:all; }
    #comic-skip:hover         { color:#F3F7FF;border-color:rgba(243,247,255,0.5); }

    /* ── TAP HINT ── */
    #comic-tap {
      position:absolute;bottom:114px;right:20px;z-index:20;
      font-size:0.58rem;letter-spacing:0.1em;
      color:rgba(243,247,255,0.28);
      animation:tapPulse 2.2s infinite;
    }
    @keyframes tapPulse { 0%,100%{opacity:0.28;} 50%{opacity:0.75;} }

    /* ── LOADING SPINNER ── */
    #comic-loading {
      display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px;
    }
    .spiral-spin {
      width:36px;height:36px;
      border:3px solid rgba(0,246,214,0.15);
      border-top-color:#00F6D6;
      border-radius:50%;
      animation:spin 0.85s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    .loading-text {
      font-size:0.65rem;letter-spacing:0.12em;color:rgba(243,247,255,0.35);
    }
  `;
  document.head.appendChild(s);
}
