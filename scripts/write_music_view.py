#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — write_music_view.py
# Adds a full-screen music player view as a FAB item
# Writes js/app/musicview.js and patches state.js + main.js
# Run from ~/spiralside: py write_music_view.py
# ============================================================

import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  wrote: {path}')

def patch(path, old, new, label=''):
    content = read(path)
    if old not in content:
        print(f'  WARN: patch target not found in {path} [{label}]')
        return False
    write(path, content.replace(old, new, 1))
    print(f'  patched: {path} [{label}]')
    return True

print('🎵 Writing music view...')

# ── 1. js/app/musicview.js ───────────────────────────────────
musicview_js = '''// ============================================================
// SPIRALSIDE — MUSICVIEW v1.0
// Full-screen now-playing panel with canvas visualizer
// Reads live state from music.js, syncs controls back
// Nimbis anchor: js/app/musicview.js
// ============================================================

import { getMusicState, setVolumeExternal, playNextExternal,
         playPrevExternal, togglePlayExternal, playTrackByIdx,
         getTrackList } from \'./music.js\';

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
  const view = document.getElementById(\'music-view\');
  if (!view) return;
  if (view.dataset.built) { refreshPlaylist(); return; }
  view.dataset.built = \'1\';

  // Inject styles once
  if (!document.getElementById(\'musicview-styles\')) {
    const s = document.createElement(\'style\');
    s.id = \'musicview-styles\';
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
  document.getElementById(\'mv-play\').addEventListener(\'click\', () => {
    togglePlayExternal();
    syncUI();
  });
  document.getElementById(\'mv-next\').addEventListener(\'click\', () => {
    playNextExternal();
    setTimeout(syncUI, 100);
  });
  document.getElementById(\'mv-prev\').addEventListener(\'click\', () => {
    playPrevExternal();
    setTimeout(syncUI, 100);
  });
  document.getElementById(\'mv-vol\').addEventListener(\'input\', e => {
    setVolumeExternal(parseFloat(e.target.value));
  });

  refreshPlaylist();
}

// ── REFRESH PLAYLIST LIST ─────────────────────────────────────
function refreshPlaylist() {
  const container = document.getElementById(\'mv-playlist\');
  if (!container) return;

  const allTracks = getTrackList();
  const { currentIdx } = getMusicState();

  container.innerHTML = allTracks.map((t, i) => `
    <div class="mv-track-row ${i === currentIdx ? \'mv-active\' : \'\'}"
         data-idx="${i}"
         onclick="window._mvSelectTrack(${i})">
      <span class="mv-track-num">${i === currentIdx ? \'▶\' : (i + 1)}</span>
      <span class="mv-track-name">${t.title}</span>
    </div>
  `).join(\'\');

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
  const titleEl = document.getElementById(\'mv-track-title\');
  if (titleEl) titleEl.textContent = currentTitle || \'—\';

  // Play button
  const playBtn = document.getElementById(\'mv-play\');
  if (playBtn) playBtn.textContent = playing ? \'⏸\' : \'▶\';

  // Progress
  const progEl = document.getElementById(\'mv-prog\');
  if (progEl) progEl.style.width = ((progressPct || 0) * 100).toFixed(1) + \'%\';

  // Times
  const curEl = document.getElementById(\'mv-time-cur\');
  const totEl = document.getElementById(\'mv-time-tot\');
  if (curEl) curEl.textContent = formatTime(currentTime || 0);
  if (totEl) totEl.textContent = formatTime(duration || 0);

  // Volume slider
  const volEl = document.getElementById(\'mv-vol\');
  if (volEl) volEl.value = volume;

  // Playlist active state
  const rows = document.querySelectorAll(\'#mv-playlist .mv-track-row\');
  rows.forEach((r, i) => {
    const active = i === currentIdx;
    r.classList.toggle(\'mv-active\', active);
    r.querySelector(\'.mv-track-num\').textContent = active ? \'▶\' : (i + 1);
  });
}

// ── TIME FORMATTER ────────────────────────────────────────────
function formatTime(secs) {
  if (!secs || isNaN(secs)) return \'0:00\';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, \'0\');
  return `${m}:${s}`;
}

// ── VISUALIZER ────────────────────────────────────────────────
function startViz() {
  if (vizFrame) cancelAnimationFrame(vizFrame);

  function draw() {
    const canvas = document.getElementById(\'mv-canvas\');
    if (!canvas) { vizFrame = null; return; }

    const ctx  = canvas.getContext(\'2d\');
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
      ctx.lineCap     = \'round\';
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
''';
write('js/app/musicview.js', musicview_js)

# ── 2. Patch music.js — add exported control functions ────────
# We need to add: setVolumeExternal, playNextExternal,
# playPrevExternal, togglePlayExternal, playTrackByIdx, getTrackList
# and expand getMusicState to include more fields

music_extra = '''

// ── EXTENDED EXPORTS FOR MUSICVIEW ───────────────────────────
// These allow musicview.js to control playback and read state

export function setVolumeExternal(v) {
  volume = Math.max(0, Math.min(1, v));
  if (audio) audio.volume = volume;
}

export function playNextExternal() { playRandom(); }

export function playPrevExternal() {
  const pool = [...tracks, ...userTracks];
  if (!pool.length) return;
  currentIdx = (currentIdx - 1 + pool.length) % pool.length;
  playTrack(pool[currentIdx]);
}

export function togglePlayExternal() {
  if (!audio) return;
  if (audio.paused) { audio.play().catch(() => {}); }
  else { audio.pause(); }
}

export function playTrackByIdx(idx) {
  const pool = [...tracks, ...userTracks];
  if (idx < 0 || idx >= pool.length) return;
  currentIdx = idx;
  playTrack(pool[idx]);
}

export function getTrackList() {
  return [...tracks, ...userTracks];
}
'''

music_content = read('js/app/music.js')

# Replace the old getMusicState with an expanded version
old_state = '''// ── PUBLIC: STATE ─────────────────────────────────────────────
export function getMusicState() {
  return { playing: audio && !audio.paused, volume, currentIdx };
}'''

new_state = '''// ── PUBLIC: STATE (extended for musicview) ────────────────────
export function getMusicState() {
  const pool = [...tracks, ...userTracks];
  const track = pool[currentIdx];
  return {
    playing:      audio ? !audio.paused : false,
    volume,
    currentIdx,
    currentTitle: track?.title || null,
    progressPct:  audio && audio.duration ? audio.currentTime / audio.duration : 0,
    currentTime:  audio?.currentTime || 0,
    duration:     audio?.duration || 0,
  };
}''' + music_extra

if old_state in music_content:
    write('js/app/music.js', music_content.replace(old_state, new_state, 1))
    print('  patched: js/app/music.js [expanded getMusicState + control exports]')
else:
    # Append to end of file if not found
    print('  WARN: getMusicState not found, appending exports to music.js')
    with open(os.path.join(BASE, 'js/app/music.js'), 'a', encoding='utf-8') as f:
        f.write('\n' + new_state)

# ── 3. Patch index.html — add music-view div ─────────────────
# Add the view div after the builder-view div
old_view = '  <!-- NAV -->'
new_view = '''  <!-- MUSIC VIEW -->
  <div class="view" id="music-view"></div>

  <!-- NAV -->'''
patch('index.html', old_view, new_view, 'add music-view div')

# ── 4. Patch index.html — add music nav item ─────────────────
old_nav = '''    <button class="nav-item" data-view="builder-view">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>build
    </button>'''
new_nav = '''    <button class="nav-item" data-view="builder-view">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>build
    </button>
    <button class="nav-item" data-view="music-view" id="nav-music">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>music
    </button>'''
patch('index.html', old_nav, new_nav, 'add music nav item')

# ── 5. Patch main.js — import musicview + wire nav ────────────
patch('main.js' if os.path.exists(os.path.join(BASE, 'main.js')) else 'js/app/main.js',
      "import { initMusic }          from './music.js';",
      "import { initMusic }          from './music.js';\nimport { initMusicView, destroyMusicView } from './musicview.js';",
      'import musicview')

# Find and patch the nav click handler to call initMusicView
old_nav_handler = "document.querySelectorAll('.nav-item').forEach(b=>{"
new_nav_handler = """// Music view lifecycle — init when entering, destroy when leaving
let lastView = '';
document.querySelectorAll('.nav-item').forEach(b=>{"""
patch('js/app/main.js', old_nav_handler, new_nav_handler, 'add lastView tracking')

# Patch inside the nav handler to call initMusicView
old_nav_body = "    b.classList.add('active');document.getElementById(b.dataset.view).classList.add('active');"
new_nav_body = """    const viewId = b.dataset.view;
    b.classList.add('active');
    document.getElementById(viewId).classList.add('active');
    if (lastView === 'music-view' && viewId !== 'music-view') destroyMusicView();
    if (viewId === 'music-view') initMusicView();
    lastView = viewId;"""
patch('js/app/main.js', old_nav_body, new_nav_body, 'wire initMusicView to nav')

print()
print('✅ Music view written!')
print()
print('Run:')
print('  cd ~/spiralside')
print('  git add .')
print('  git commit -m "feat: full-screen music player view"')
print('  git push')
