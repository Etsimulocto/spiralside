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
export function destroyMusicView() {
  stopRaf();
  const el = document.getElementById('view-music');
  if (el) el.innerHTML = '';
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

  document.getElementById('mv-seek')?.addEventListener('input', e => {
    const ms = getMusicState();
    if (ms.audio && ms.audio.duration) {
      ms.audio.currentTime = (parseFloat(e.target.value) / 100) * ms.audio.duration;
    }
  });

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
function setupAnalyser() {
  const ms = getMusicState();
  if (!ms?.audio) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (!sourceNode) {
      sourceNode = audioCtx.createMediaElementSource(ms.audio);
      analyser   = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      dataArr    = new Uint8Array(analyser.frequencyBinCount);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
  } catch {
    analyser = null; // fallback: draw idle ring
  }
}

// ── DRAW VISUALIZER ───────────────────────────────────────────
function drawVisualizer() {
  const canvas = document.getElementById('mv-canvas');
  if (!canvas) return;

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

  const ctx  = canvas.getContext('2d');
  const cx   = W / 2;
  const cy   = H / 2;
  const R    = Math.min(W, H) * 0.38;
  const bars = 52;

  ctx.clearRect(0, 0, W, H);

  if (analyser) analyser.getByteFrequencyData(dataArr);

  for (let i = 0; i < bars; i++) {
    const angle  = (i / bars) * Math.PI * 2 - Math.PI / 2;
    const raw    = analyser ? (dataArr[i % dataArr.length] / 255) : 0.08;
    const amp    = 0.06 + raw * 0.45;
    const inner  = R;
    const outer  = R + amp * R;

    const t      = i / bars;                           // 0→1
    const r      = Math.round(0   + t * 123);          // teal→purple R
    const g      = Math.round(246 - t * 151);          // teal→purple G
    const b      = Math.round(214 + t * 41);           // teal→purple B

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
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
  if (seek)    seek.value       = pct;
  if (timeCur) timeCur.textContent = fmt(cur);
  if (timeTot) timeTot.textContent = fmt(dur);

  // Track changed — resync title + queue
  if (ms.title !== (document.getElementById('mv-title')?.textContent)) syncUI();
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
