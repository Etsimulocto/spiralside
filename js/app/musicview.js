// ============================================================
// SPIRALSIDE — MUSIC VIEW v1.1
// Full-screen now playing with canvas visualizer
// initMusicView() called by FAB onOpen hook
// destroyMusicView() called by FAB onClose hook
// Nimbis anchor: js/app/musicview.js
// ============================================================

import { getMusicState, setVolumeExternal,
         playNextExternal, playPrevExternal,
         togglePlayExternal, playTrackByIdx,
         getTrackList }                      from './music.js';

// ── STATE ─────────────────────────────────────────────────────
let rafId     = null;   // requestAnimationFrame handle
let analyser  = null;   // Web Audio analyser node
let dataArr   = null;   // Uint8Array for frequency data
let audioCtx  = null;   // AudioContext
let sourceNode= null;   // MediaElementSource
let seeking   = false;

// ── INIT ──────────────────────────────────────────────────────
export function initMusicView() {
  const el = document.getElementById('view-music');
  if (!el) return;

  el.innerHTML = buildMusicViewHTML();
  wireControls();
  setupAnalyser();
  syncUI();
  startRaf();
}

// ── DESTROY ───────────────────────────────────────────────────
// Only stop the animation loop — do NOT touch audioCtx or sourceNode.
// createMediaElementSource can only be called once per audio element;
// nulling sourceNode and recreating it on the next open breaks the analyser.
export function destroyMusicView() {
  stopRaf();
  seeking = false;
  const el = document.getElementById('view-music');
  if (el) el.innerHTML = '';
  // audioCtx, sourceNode, analyser, dataArr all stay alive
}

// ── HTML ──────────────────────────────────────────────────────
function buildMusicViewHTML() {
  const tracks = getTrackList();
  const ms     = getMusicState();

  return `
    <div id="mv-inner">
      <div id="mv-now-label">♪ NOW PLAYING</div>

      <div id="mv-canvas-wrap">
        <canvas id="mv-canvas"></canvas>
        <div id="mv-note">♩</div>
      </div>

      <div id="mv-title">${ms.title || '—'}</div>
      <div id="mv-album">SPIRALSIDE OST · 2026</div>

      <div id="mv-progress-wrap">
        <span id="mv-time-cur">0:00</span>
        <div id="mv-progress-bg">
          <div id="mv-progress-fill"></div>
          <input type="range" id="mv-seek" min="0" max="100" value="0" step="0.1" />
        </div>
        <span id="mv-time-tot">0:00</span>
      </div>

      <div id="mv-controls">
        <button id="mv-prev" class="mv-btn">◀◀</button>
        <button id="mv-play" class="mv-btn mv-btn-main">${ms.playing ? '⏸' : '▶'}</button>
        <button id="mv-next" class="mv-btn">▶▶</button>
      </div>

      <div id="mv-vol-row">
        <span class="mv-vol-icon">♩</span>
        <input type="range" id="mv-vol" min="0" max="1" step="0.01" value="${ms.volume ?? 0.7}" />
        <span class="mv-vol-icon">♪</span>
      </div>

      <div id="mv-queue-label">QUEUE</div>
      <div id="mv-queue">
        ${tracks.map((t, i) => `
          <div class="mv-queue-item ${i === ms.trackIdx ? 'mv-queue-active' : ''}"
               onclick="window.mvPlayTrack(${i})">
            <span class="mv-queue-num">${i + 1}</span>
            <span class="mv-queue-name">${t.title || t.file}</span>
            ${i === ms.trackIdx ? '<span class="mv-queue-playing">▶</span>' : ''}
          </div>`).join('')}
      </div>
    </div>`;
}

// ── CONTROLS ──────────────────────────────────────────────────
function wireControls() {
  document.getElementById('mv-prev')?.addEventListener('click', () => { playPrevExternal(); syncUI(); });
  document.getElementById('mv-next')?.addEventListener('click', () => { playNextExternal(); syncUI(); });
  document.getElementById('mv-play')?.addEventListener('click', () => { togglePlayExternal(); syncUI(); });

  document.getElementById('mv-vol')?.addEventListener('input', e => {
    setVolumeExternal(parseFloat(e.target.value));
  });

  const seekEl = document.getElementById('mv-seek');
  if (seekEl) {
    seekEl.addEventListener('mousedown', () => { seeking = true; });
    seekEl.addEventListener('touchstart', () => { seeking = true; }, { passive: true });
    seekEl.addEventListener('change', e => {
      const ms = getMusicState();
      if (ms.audio && ms.audio.duration) ms.audio.currentTime = (parseFloat(e.target.value)/100)*ms.audio.duration;
      seeking = false;
    });
    seekEl.addEventListener('input', e => {
      const ms = getMusicState();
      if (ms.audio && ms.audio.duration) ms.audio.currentTime = (parseFloat(e.target.value)/100)*ms.audio.duration;
    });
  }

  window.mvPlayTrack = (idx) => { playTrackByIdx(idx); syncUI(); };
}

// ── SYNC UI ───────────────────────────────────────────────────
function syncUI() {
  const ms = getMusicState();
  if (!ms || !document.getElementById('mv-inner')) return;

  const titleEl = document.getElementById('mv-title');
  const playEl  = document.getElementById('mv-play');
  if (titleEl) titleEl.textContent = ms.title || '—';
  if (playEl)  playEl.textContent  = ms.playing ? '⏸' : '▶';

  // Re-render queue highlights
  document.querySelectorAll('.mv-queue-item').forEach((el, i) => {
    el.classList.toggle('mv-queue-active', i === ms.trackIdx);
    const playSpan = el.querySelector('.mv-queue-playing');
    if (i === ms.trackIdx && !playSpan) {
      el.innerHTML += '<span class="mv-queue-playing">▶</span>';
    } else if (i !== ms.trackIdx && playSpan) {
      playSpan.remove();
    }
  });
}

// ── RAF LOOP ──────────────────────────────────────────────────
function startRaf() {
  stopRaf();
  function frame() {
    drawVisualizer();
    updateProgress();
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

function stopRaf() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// ── ANALYSER SETUP ────────────────────────────────────────────
// Called every time music view opens.
// AudioContext and sourceNode are created only once (module-level singletons).
// On subsequent opens we just resume the suspended context.
function setupAnalyser() {
  const ms = getMusicState();
  if (!ms?.audio) return;
  try {
    if (!audioCtx) {
      // First ever open: create everything
      audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioCtx.createMediaElementSource(ms.audio);
      analyser   = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      dataArr    = new Uint8Array(analyser.frequencyBinCount);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    } else {
      // Subsequent opens: browser may have suspended the context — resume it
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }
  } catch(e) {
    console.warn('[musicview] analyser setup failed:', e.message);
    analyser = null; // graceful fallback: draw idle ring
  }
}

// ── DRAW VISUALIZER ───────────────────────────────────────────
function drawVisualizer() {
  const canvas = document.getElementById('mv-canvas');
  if (!canvas) return;

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

  const ctx   = canvas.getContext('2d');
  const cx    = W / 2;
  const cy    = H / 2;
  const maxR  = Math.min(W, H) * 0.38;  // outer edge of spiral
  const minR  = maxR * 0.18;            // tight inner center
  const turns = 2.5;                    // number of rotations
  const bars  = 128;                    // one spike per frequency bin

  ctx.clearRect(0, 0, W, H);
  if (analyser) analyser.getByteFrequencyData(dataArr);

  // Draw frequency spikes along the spiral
  for (let i = 0; i < bars; i++) {
    const t      = i / (bars - 1);                        // 0=center, 1=outer
    const angle  = t * turns * Math.PI * 2 - Math.PI / 2; // spiral angle
    const baseR  = minR + t * (maxR - minR);               // radius grows outward

    const raw    = analyser ? (dataArr[i] / 255) : 0.06;
    const spike  = (0.04 + raw * 0.38) * maxR;            // spike length in px

    const bx = cx + Math.cos(angle) * baseR;
    const by = cy + Math.sin(angle) * baseR;
    const ex = cx + Math.cos(angle) * (baseR + spike);
    const ey = cy + Math.sin(angle) * (baseR + spike);

    // Teal at center, violet at outer edge
    const cr = Math.round(0   + t * 123);
    const cg = Math.round(246 - t * 151);
    const cb = Math.round(214 + t * 41);
    const ca = (0.55 + raw * 0.45).toFixed(2);

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${ca})`;
    ctx.lineWidth   = 1.8;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // Faint spiral guide line underneath the spikes
  ctx.beginPath();
  for (let i = 0; i <= 300; i++) {
    const t     = i / 300;
    const angle = t * turns * Math.PI * 2 - Math.PI / 2;
    const r     = minR + t * (maxR - minR);
    const x     = cx + Math.cos(angle) * r;
    const y     = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(0,246,214,0.10)';
  ctx.lineWidth   = 1;
  ctx.lineCap     = 'butt';
  ctx.stroke();
}


  // Center ring
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,246,214,0.12)';
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ── UPDATE PROGRESS ───────────────────────────────────────────
function updateProgress() {
  const ms = getMusicState();
  if (!ms?.audio || !document.getElementById('mv-progress-fill')) return;

  const audio    = ms.audio;
  const cur      = audio.currentTime  || 0;
  const dur      = audio.duration     || 0;
  const pct      = dur > 0 ? (cur / dur) * 100 : 0;

  const fill     = document.getElementById('mv-progress-fill');
  const seek     = document.getElementById('mv-seek');
  const timeCur  = document.getElementById('mv-time-cur');
  const timeTot  = document.getElementById('mv-time-tot');

  if (fill)    fill.style.width = `${pct}%`;
  if (seek && !seeking) seek.value = pct;
  if (timeCur) timeCur.textContent = fmt(cur);
  if (timeTot) timeTot.textContent = fmt(dur);

  // Track changed — resync title + queue (only if view is built)
  const titleEl2 = document.getElementById('mv-title');
  if (titleEl2 && ms.title !== titleEl2.textContent) syncUI();
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
