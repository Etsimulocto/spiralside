// ============================================================
// SPIRALSIDE — BLOOMCORE COMIC VIEWER v1.0
// Standalone component — drop into any page alongside index.html
// JSON-driven — edit comics/intro.json on HF to change content
// No rebuild ever needed — just edit the JSON
// Nimbis anchor: comic-viewer.js
// ============================================================

const ComicViewer = (() => {

  // ── CONFIG ────────────────────────────────────────────────
  const HF_RAW = 'https://huggingface.co/spaces/quarterbitgames/spiralside/raw/main';
  const COMIC_URL = `${HF_RAW}/comics/intro.json`;

  // ── STATE ─────────────────────────────────────────────────
  let panels  = [];   // loaded panel data
  let current = 0;    // current panel index
  let typing  = null; // typewriter interval
  let lineIdx = 0;    // current dialogue line within panel
  let onDone  = null; // callback when comic finishes

  // ── INJECT STYLES ─────────────────────────────────────────
  function injectStyles() {
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
        width:100%;max-width:480px;height:100dvh;
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

      /* ── SCANLINE OVERLAY ── */
      #comic-scanlines {
        position:absolute;inset:0;pointer-events:none;z-index:2;
        background:repeating-linear-gradient(
          0deg,
          transparent,transparent 2px,
          rgba(0,246,214,0.025) 2px,rgba(0,246,214,0.025) 4px
        );
      }

      /* ── CRACK EFFECT (last panel) ── */
      #comic-crack {
        position:absolute;inset:0;pointer-events:none;z-index:3;
        opacity:0;transition:opacity 0.4s;
        background:
          linear-gradient(135deg,transparent 40%,rgba(0,246,214,0.2) 50%,transparent 60%),
          linear-gradient(225deg,transparent 40%,rgba(255,75,203,0.15) 50%,transparent 60%);
      }
      #comic-crack.show { opacity:1; }

      /* ── BORDER VIGNETTE ── */
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
        font-weight:700;margin-bottom:6px;min-height:14px;
        color:#00F6D6;
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
        opacity:0;pointer-events:none;
        transition:all 0.3s;
      }
      #comic-skip.visible             { opacity:1;pointer-events:all; }
      #comic-skip:hover               { color:#F3F7FF;border-color:rgba(243,247,255,0.5); }

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
        display:flex;flex-direction:column;align-items:center;gap:16px;
        padding:24px;
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
        font-size:0.65rem;letter-spacing:0.12em;
        color:rgba(243,247,255,0.35);
      }
    `;
    document.head.appendChild(s);
  }

  // ── BUILD DOM ──────────────────────────────────────────────
  function buildDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'comic-overlay';
    overlay.innerHTML = `
      <div id="comic-panel">
        <div id="comic-bg"></div>
        <div id="comic-scanlines"></div>
        <div id="comic-crack"></div>
        <div id="comic-vignette"></div>
        <div id="comic-counter"></div>
        <button id="comic-skip">skip intro</button>
        <div id="comic-tap">tap to continue</div>
        <div id="comic-dialogue">
          <div id="comic-speaker"></div>
          <div id="comic-text"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', onTap);
    document.getElementById('comic-skip').addEventListener('click', e => {
      e.stopPropagation();
      finish();
    });
  }

  // ── LOAD JSON FROM HF ──────────────────────────────────────
  async function loadComic() {
    try {
      const r = await fetch(COMIC_URL + '?t=' + Date.now());
      if (!r.ok) throw new Error('fetch failed');
      const data = await r.json();
      return data.panels || [];
    } catch {
      return getFallbackPanels(); // use built-in panels if HF unreachable
    }
  }

  // ── FALLBACK PANELS (no art, gradient only) ───────────────
  function getFallbackPanels() {
    return [
      { bg_gradient:'radial-gradient(ellipse at 50% 60%,#1a0a2e 0%,#101014 70%)', transition:'fade',
        dialogue:[{speaker:'narrator',text:'Spiral City. Population: complicated.'}] },
      { bg_gradient:'radial-gradient(ellipse at 30% 40%,#002a2a 0%,#101014 70%)', transition:'crash',
        dialogue:[{speaker:'Sky',text:"Oh. You're actually here."}] },
      { bg_gradient:'radial-gradient(ellipse at 70% 50%,#1a002a 0%,#101014 70%)', transition:'glitch',
        dialogue:[{speaker:'Sky',text:"This place remembers you."},{speaker:'Sky',text:"I don't always understand how. But the Spiral echoes back."}] },
      { bg_gradient:'radial-gradient(ellipse at 50% 30%,#1a1a00 0%,#101014 70%)', transition:'crash',
        dialogue:[{speaker:'Monday',text:"HEY. Are we doing the dramatic intro thing AGAIN—"},{speaker:'Cold',text:"Monday."},{speaker:'Monday',text:"...fine."}] },
      { bg_gradient:'radial-gradient(ellipse at 50% 50%,#001a2a 0%,#101014 70%)', transition:'glitch',
        dialogue:[{speaker:'Sky',text:"Your companion. Your data. Your rules."},{speaker:'Sky',text:"Ready?"}] },
      { bg_gradient:'radial-gradient(ellipse at 50% 50%,#00F6D618 0%,#101014 60%)', transition:'fade', crack:true,
        dialogue:[{speaker:'narrator',text:'— entering Spiralside —'}] }
    ];
  }

  // ── RENDER PANEL ──────────────────────────────────────────
  function renderPanel(index) {
    const panel = panels[index];
    if (!panel) { finish(); return; }

    // Set background
    const bg = document.getElementById('comic-bg');
    bg.className = '';
    if (panel.image) {
      bg.style.backgroundImage = `url(${HF_RAW}/${panel.image})`;
      bg.style.background = '';
    } else if (panel.bg_gradient) {
      bg.style.background = panel.bg_gradient;
      bg.style.backgroundImage = '';
    } else {
      bg.style.background = panel.bg_color || '#101014';
    }

    // Trigger transition animation
    void bg.offsetWidth;
    bg.classList.add(panel.transition || 'fade');

    // Crack effect on last panel
    document.getElementById('comic-crack').classList.toggle('show', !!panel.crack);

    // Show skip after first panel
    if (index >= 1) document.getElementById('comic-skip').classList.add('visible');

    // Update progress dots
    const counter = document.getElementById('comic-counter');
    counter.innerHTML = panels.map((_,i) =>
      `<div class="comic-dot ${i===index?'active':i<index?'done':''}"></div>`
    ).join('');

    // Start typing first dialogue line
    lineIdx = 0;
    typeLine(panel.dialogue || [], 0);
  }

  // ── TYPEWRITER DIALOGUE ───────────────────────────────────
  function typeLine(lines, idx) {
    if (!lines.length) return;
    lineIdx = idx;
    if (idx >= lines.length) return;

    const line = lines[idx];
    const speakerEl = document.getElementById('comic-speaker');
    const textEl    = document.getElementById('comic-text');

    speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
    speakerEl.className   = line.speaker.toLowerCase();
    textEl.textContent    = '';

    if (typing) clearInterval(typing);

    let i = 0;
    const speed = line.speaker === 'narrator' ? 32 : 20;
    typing = setInterval(() => {
      textEl.textContent += line.text[i++];
      if (i >= line.text.length) {
        clearInterval(typing);
        typing = null;
        // Auto-advance to next line in same panel after pause
        if (idx + 1 < lines.length) {
          setTimeout(() => typeLine(lines, idx + 1), 1100);
        }
      }
    }, speed);
  }

  // ── TAP HANDLER ───────────────────────────────────────────
  function onTap() {
    const panel = panels[current];
    // If still typing — skip to end of current line
    if (typing) {
      clearInterval(typing);
      typing = null;
      const lines = panel?.dialogue || [];
      if (lines[lineIdx]) {
        document.getElementById('comic-text').textContent    = lines[lineIdx].text;
        document.getElementById('comic-speaker').textContent =
          lines[lineIdx].speaker === 'narrator' ? '' : lines[lineIdx].speaker;
        document.getElementById('comic-speaker').className   = lines[lineIdx].speaker.toLowerCase();
      }
      return;
    }
    // Advance to next panel
    current++;
    if (current >= panels.length) finish();
    else renderPanel(current);
  }

  // ── FINISH ────────────────────────────────────────────────
  function finish() {
    if (typing) { clearInterval(typing); typing = null; }
    const overlay = document.getElementById('comic-overlay');
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 500);
  }

  // ── PUBLIC: INIT ──────────────────────────────────────────
  // Usage: ComicViewer.init(() => showApp(user));
  async function init(callback) {
    onDone = callback;
    injectStyles();
    buildDOM();

    // Show spinner while loading JSON
    document.getElementById('comic-dialogue').innerHTML = `
      <div id="comic-loading">
        <div class="spiral-spin"></div>
        <div class="loading-text">initializing spiral...</div>
      </div>
    `;

    panels = await loadComic();

    // Restore dialogue DOM
    document.getElementById('comic-dialogue').innerHTML = `
      <div id="comic-speaker"></div>
      <div id="comic-text"></div>
    `;

    current = 0;
    renderPanel(0);
  }

  return { init };

})();
