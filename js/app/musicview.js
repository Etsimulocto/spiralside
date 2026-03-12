// ============================================================
// SPIRALSIDE — MUSICVIEW v1.0
// Full-screen now-playing panel with canvas visualizer
// Reads live state from music.js, syncs controls back
// Nimbis anchor: js/app/musicview.js
// ============================================================

import { getMusicState, setVolumeExternal, playNextExternal,
         playPrevExternal, togglePlayExternal, playTrackByIdx,
         getTrackList } from './music.js';

// ── STATE ─────────────────────────────────────────────────────
let vizFrame  = null;   // rAF handle
let phase     = 0;      // visualizer wave phase
let inited    = false;  // DOM built flag

// ── PUBLIC: INIT (called by switchView when music view opens) ─
export function initMusicView() {
  buildDOM();
  startViz();
  syncUI();
  // Keep UI in sync while view is open
  window._musicViewInterval = setInterval(syncUI, 500);
}

// ── PUBLIC: DESTROY (called when leaving the view) ────────────
export function destroyMusicView() {
  stopViz();
  clearInterval(window._musicViewInterval);
}

// ── BUILD DOM ─────────────────────────────────────────────────
function buildDOM() {
  const view = document.getElementById('view-music');
  if (!view) return;
  if (view.dataset.built) { refreshPlaylist(); return; }
  view.dataset.built = '1';

  // Inject styles once
  if (!document.getElementById('musicview-styles')) {
    const s = document.createElement('style');
    s.id = 'musicview-styles';
    s.textContent = `
      /* ── MUSIC VIEW ── */
      #music-view {
        display: none;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px 32px;
        overflow-y: auto;
        background: var(--bg, #08080d);
        -webkit-overflow-scrolling: touch;
      }
      #music-view.active { display: flex; }

      .mv-title {
        font-size: 0.58rem;
        letter-spacing: 0.18em;
        color: var(--subtext, #6060A0);
        text-transform: uppercase;
        margin-bottom: 32px;
        font-family: var(--font-ui, "DM Mono", monospace);
      }

      /* Art ring */
      .mv-art-ring {
        position: relative;
        width: 210px;
        height: 210px;
        margin-bottom: 28px;
        flex-shrink: 0;
      }
      #mv-canvas {
        position: absolute;
        inset: 0;
        border-radius: 50%;
      }
      .mv-art-inner {
        position: absolute;
        inset: 18px;
        border-radius: 50%;
        background: var(--surface, #0f0f18);
        border: 2px solid var(--border, #1e1e35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        color: var(--teal, #00F6D6);
        animation: mvNotePulse 2.4s ease-in-out infinite;
      }
      @keyframes mvNotePulse {
        0%,100% { opacity: 0.4; transform: scale(1); }
        50%      { opacity: 1;   transform: scale(1.08); }
      }

      /* Track info */
      .mv-track-title {
        font-family: var(--font-display, "Syne", sans-serif);
        font-weight: 700;
        font-size: 1.15rem;
        letter-spacing: 0.04em;
        color: var(--text, #F0F0FF);
        text-align: center;
        margin-bottom: 4px;
        width: 100%;
      }
      .mv-track-sub {
        font-size: 0.6rem;
        letter-spacing: 0.12em;
        color: var(--subtext, #6060A0);
        text-transform: uppercase;
        text-align: center;
        margin-bottom: 28px;
      }

      /* Progress */
      .mv-progress-wrap { width: 100%; margin-bottom: 24px; }
      .mv-progress-bar {
        width: 100%;
        height: 3px;
        background: var(--border, #1e1e35);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 8px;
        cursor: pointer;
      }
      .mv-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--teal, #00F6D6), var(--purple, #7B5FFF));
        border-radius: 2px;
        width: 0%;
        transition: width 0.4s linear;
      }
      .mv-times {
        display: flex;
        justify-content: space-between;
        font-size: 0.58rem;
        color: var(--subtext, #6060A0);
        letter-spacing: 0.06em;
        font-family: var(--font-ui, "DM Mono", monospace);
      }

      /* Controls */
      .mv-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 32px;
        margin-bottom: 28px;
      }
      .mv-ctrl {
        background: none;
        border: none;
        color: var(--subtext, #6060A0);
        cursor: pointer;
        font-size: 1rem;
        padding: 8px;
        transition: color 0.2s;
        font-family: monospace;
      }
      .mv-ctrl:hover { color: var(--text, #F0F0FF); }
      .mv-ctrl.play-btn {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: var(--teal, #00F6D6);
        color: var(--bg, #08080d);
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s, background 0.2s;
      }
      .mv-ctrl.play-btn:hover { transform: scale(1.05); }

      /* Volume */
      .mv-vol-row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        margin-bottom: 32px;
      }
      .mv-vol-icon { font-size: 0.7rem; color: var(--subtext, #6060A0); }
      #mv-vol {
        flex: 1;
        accent-color: var(--teal, #00F6D6);
        cursor: pointer;
      }

      /* Playlist */
      .mv-playlist-label {
        font-size: 0.58rem;
        letter-spacing: 0.14em;
        color: var(--subtext, #6060A0);
        text-transform: uppercase;
        width: 100%;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border, #1e1e35);
        font-family: var(--font-ui, "DM Mono", monospace);
      }
      .mv-track-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 0;
        border-bottom: 1px solid var(--border, #1e1e35);
        cursor: pointer;
        width: 100%;
        transition: all 0.15s;
      }
      .mv-track-num {
        font-size: 0.58rem;
        color: var(--subtext, #6060A0);
        width: 18px;
        text-align: center;
        flex-shrink: 0;
        font-family: var(--font-ui, "DM Mono", monospace);
      }
      .mv-track-name {
        flex: 1;
        font-size: 0.78rem;
        color: var(--subtext, #6060A0);
        letter-spacing: 0.05em;
        font-family: var(--font-ui, "DM Mono", monospace);
        transition: color 0.2s;
      }
      .mv-track-row:hover .mv-track-name { color: var(--text, #F0F0FF); }
      .mv-track-row.mv-active .mv-track-name { color: var(--teal, #00F6D6); }
      .mv-track-row.mv-active .mv-track-num  { color: var(--teal, #00F6D6); }
    `;
    document.head.appendChild(s);
  }

  // Build inner HTML
  view.innerHTML = `
    <div class="mv-title">♪ now playing</div>

    <div class="mv-art-ring">
      <canvas id="mv-canvas" width="210" height="210"></canvas>
      <div class="mv-art-inner">♪</div>
    </div>

    <div class="mv-track-title" id="mv-track-title">—</div>
    <div class="mv-track-sub">spiralside ost · 2026</div>

    <div class="mv-progress-wrap">
      <div class="mv-progress-bar">
        <div class="mv-progress-fill" id="mv-prog"></div>
      </div>
      <div class="mv-times">
        <span id="mv-time-cur">0:00</span>
        <span id="mv-time-tot">—:——</span>
      </div>
    </div>

    <div class="mv-controls">
      <button class="mv-ctrl" id="mv-prev" title="previous">◀◀</button>
      <button class="mv-ctrl play-btn" id="mv-play">⏸</button>
      <button class="mv-ctrl" id="mv-next" title="next">▶▶</button>
    </div>

    <div class="mv-vol-row">
      <span class="mv-vol-icon">♪</span>
      <input type="range" id="mv-vol" min="0" max="1" step="0.01" value="0.35" />
      <span class="mv-vol-icon" style="font-size:0.88rem">♪</span>
    </div>

    <div class="mv-playlist-label">queue</div>
    <div id="mv-playlist" style="width:100%"></div>
  `;

  // Wire controls
  document.getElementById('mv-play').addEventListener('click', () => {
    togglePlayExternal();
    syncUI();
  });
  document.getElementById('mv-next').addEventListener('click', () => {
    playNextExternal();
    setTimeout(syncUI, 100);
  });
  document.getElementById('mv-prev').addEventListener('click', () => {
    playPrevExternal();
    setTimeout(syncUI, 100);
  });
  document.getElementById('mv-vol').addEventListener('input', e => {
    setVolumeExternal(parseFloat(e.target.value));
  });

  refreshPlaylist();
}

// ── REFRESH PLAYLIST LIST ─────────────────────────────────────
function refreshPlaylist() {
  const container = document.getElementById('mv-playlist');
  if (!container) return;

  const allTracks = getTrackList();
  const { currentIdx } = getMusicState();

  container.innerHTML = allTracks.map((t, i) => `
    <div class="mv-track-row ${i === currentIdx ? 'mv-active' : ''}"
         data-idx="${i}"
         onclick="window._mvSelectTrack(${i})">
      <span class="mv-track-num">${i === currentIdx ? '▶' : (i + 1)}</span>
      <span class="mv-track-name">${t.title}</span>
    </div>
  `).join('');

  // Expose select handler globally for onclick
  window._mvSelectTrack = (idx) => {
    playTrackByIdx(idx);
    setTimeout(syncUI, 150);
  };
}

// ── SYNC UI TO MUSIC STATE ────────────────────────────────────
function syncUI() {
  const { playing, volume, currentIdx, currentTitle,
          progressPct, currentTime, duration } = getMusicState();

  // Title
  const titleEl = document.getElementById('mv-track-title');
  if (titleEl) titleEl.textContent = currentTitle || '—';

  // Play button
  const playBtn = document.getElementById('mv-play');
  if (playBtn) playBtn.textContent = playing ? '⏸' : '▶';

  // Progress
  const progEl = document.getElementById('mv-prog');
  if (progEl) progEl.style.width = ((progressPct || 0) * 100).toFixed(1) + '%';

  // Times
  const curEl = document.getElementById('mv-time-cur');
  const totEl = document.getElementById('mv-time-tot');
  if (curEl) curEl.textContent = formatTime(currentTime || 0);
  if (totEl) totEl.textContent = formatTime(duration || 0);

  // Volume slider
  const volEl = document.getElementById('mv-vol');
  if (volEl) volEl.value = volume;

  // Playlist active state
  const rows = document.querySelectorAll('#mv-playlist .mv-track-row');
  rows.forEach((r, i) => {
    const active = i === currentIdx;
    r.classList.toggle('mv-active', active);
    r.querySelector('.mv-track-num').textContent = active ? '▶' : (i + 1);
  });
}

// ── TIME FORMATTER ────────────────────────────────────────────
function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── VISUALIZER ────────────────────────────────────────────────
function startViz() {
  if (vizFrame) cancelAnimationFrame(vizFrame);

  function draw() {
    const canvas = document.getElementById('mv-canvas');
    if (!canvas) { vizFrame = null; return; }

    const ctx  = canvas.getContext('2d');
    const W    = 210, H = 210;
    const cx   = W/2, cy = H/2;
    const r    = 85;
    const bars = 52;
    const { playing } = getMusicState();

    ctx.clearRect(0, 0, W, H);
    phase += playing ? 0.03 : 0;

    for (let i = 0; i < bars; i++) {
      const angle  = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const wave   = Math.sin(phase + i * 0.38) * 0.5 + 0.5;
      const noise  = Math.sin(phase * 1.6 + i * 0.85) * 0.3 + 0.3;
      const barH   = playing ? (6 + wave * 20 + noise * 10) : 3;
      const alpha  = playing ? (0.35 + wave * 0.65) : 0.12;

      const x1 = cx + Math.cos(angle) * r;
      const y1 = cy + Math.sin(angle) * r;
      const x2 = cx + Math.cos(angle) * (r + barH);
      const y2 = cy + Math.sin(angle) * (r + barH);

      // Teal → purple gradient around the ring
      const t  = i / bars;
      const rr = Math.round(t * 123);
      const gg = Math.round(246 - t * 155);
      const bb = Math.round(214 + t * 41);

      ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    vizFrame = requestAnimationFrame(draw);
  }
  draw();
}

function stopViz() {
  if (vizFrame) { cancelAnimationFrame(vizFrame); vizFrame = null; }
}
