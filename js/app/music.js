// ============================================================
// SPIRALSIDE — MUSIC v1.1
// playlist.json served from Vercel (GitHub repo)
// MP3s streamed from HuggingFace space
// Mini player bar injected above chat input
// Nimbis anchor: js/app/music.js
// ============================================================

// ── CONFIG ────────────────────────────────────────────────────
// playlist.json lives in the GitHub repo, served by Vercel
const PLAYLIST_URL = 'utilities/music/playlist.json';

// HuggingFace space base for MP3 files
const HF_BASE = 'https://huggingface.co/spaces/quarterbitgames/spiralside/resolve/main';

// ── MODULE STATE ──────────────────────────────────────────────
let audio        = null;   // HTMLAudioElement
let tracks       = [];     // from playlist.json
let userTracks   = [];     // added from vault
let currentIdx   = -1;     // currently playing index
let volume       = 0.35;   // quiet ambient default
let playerInited = false;  // init guard

// ── PUBLIC: INIT ──────────────────────────────────────────────
export async function initMusic() {
  if (playerInited) return;
  playerInited = true;

  await loadPlaylist();
  injectPlayerDOM();
  bindPlayerEvents();
  playRandom();
}

// ── LOAD PLAYLIST ─────────────────────────────────────────────
async function loadPlaylist() {
  try {
    // Cache-bust so adding new tracks shows immediately
    const r = await fetch(PLAYLIST_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    tracks = data.tracks || [];
    console.log('[music] loaded', tracks.length, 'tracks');
  } catch (e) {
    console.warn('[music] playlist fetch failed, using fallback:', e.message);
    // Hardcoded fallback — matches current HF files
    tracks = [
      { id: 'spiralside',  title: 'SPIRALSIDE',  file: 'utilities/music/SPIRALSIDE.mp3'      },
      { id: 'centerspark', title: 'Centerspark',  file: 'utilities/music/Centerspark.mp3' },
      { id: 'mirrorblade', title: 'Mirrorblade',  file: 'utilities/music/Mirrorblade.mp3'    },
    ];
  }
}

// ── PLAY RANDOM ───────────────────────────────────────────────
function playRandom() {
  const pool = [...tracks, ...userTracks];
  if (!pool.length) return;

  // Pick different from current
  let idx;
  do { idx = Math.floor(Math.random() * pool.length); }
  while (pool.length > 1 && idx === currentIdx);

  currentIdx = idx;
  playTrack(pool[idx]);
}

// ── PLAY TRACK ────────────────────────────────────────────────
function playTrack(track) {
  // Vault tracks have a blob URL; HF tracks get HF_BASE prefix
  const url = track.url
    ? track.url
    : `${HF_BASE}/${track.file}`;

  if (audio) {
    audio.pause();
    audio.src = '';
  }

  audio = new Audio(url);
  audio.crossOrigin = 'anonymous';
  audio.volume = volume;
  audio.loop   = false;
  audio.addEventListener('ended', playRandom);

  updatePlayerUI(track.title);

  // Autoplay — deferred to first user gesture if browser blocks
  audio.play().catch(() => {
    console.log('[music] autoplay blocked — waiting for gesture');
    setPlayBtnState(false);
    document.addEventListener('click', () => {
      audio?.play().catch(() => {});
      setPlayBtnState(true);
    }, { once: true });
  });
}

// ── INJECT PLAYER DOM ─────────────────────────────────────────
function injectPlayerDOM() {
  document.getElementById('music-player')?.remove();

  if (!document.getElementById('music-styles')) {
    const s = document.createElement('style');
    s.id = 'music-styles';
    s.textContent = `
      #music-player {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        background: var(--surface2, #151523);
        border-top: 1px solid var(--border, #1e1e35);
        flex-shrink: 0;
        height: 38px;
        overflow: hidden;
      }
      #music-icon {
        font-size: 0.8rem;
        color: var(--teal, #00F6D6);
        flex-shrink: 0;
        animation: musicPulse 2.4s ease-in-out infinite;
      }
      @keyframes musicPulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50%       { opacity: 1;   transform: scale(1.15); }
      }
      #music-track-name {
        flex: 1;
        font-size: 0.6rem;
        letter-spacing: 0.1em;
        color: var(--subtext, #6060A0);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-ui, "DM Mono", monospace);
        text-transform: uppercase;
        min-width: 0;
      }
      #music-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .music-btn {
        background: none;
        border: none;
        color: var(--subtext, #6060A0);
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        line-height: 1;
        transition: color 0.2s;
        font-family: monospace;
      }
      .music-btn:hover  { color: var(--text, #F0F0FF); }
      .music-btn.active { color: var(--teal, #00F6D6); }
      #music-vol {
        width: 52px;
        accent-color: var(--teal, #00F6D6);
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
      }
      #music-vol:hover { opacity: 1; }
    `;
    document.head.appendChild(s);
  }

  const player = document.createElement('div');
  player.id = 'music-player';
  player.innerHTML = `
    <span id="music-icon">♪</span>
    <span id="music-track-name">—</span>
    <div id="music-controls">
      <button class="music-btn" id="music-prev" title="previous">◀◀</button>
      <button class="music-btn active" id="music-play" title="play / pause">⏸</button>
      <button class="music-btn" id="music-next" title="next">▶▶</button>
      <input type="range" id="music-vol" min="0" max="1" step="0.01" value="${volume}" title="volume" />
    </div>
  `;

  // Insert above the chat input area inside #chat-view
  const chatView  = document.getElementById('chat-view');
  const inputArea = chatView?.querySelector('.chat-input-area');
  if (inputArea) {
    chatView.insertBefore(player, inputArea);
  } else if (chatView) {
    chatView.appendChild(player);
  }
}

// ── BIND EVENTS ───────────────────────────────────────────────
function bindPlayerEvents() {
  document.getElementById('music-play')?.addEventListener('click', togglePlay);
  document.getElementById('music-next')?.addEventListener('click', playRandom);
  document.getElementById('music-prev')?.addEventListener('click', playPrev);
  document.getElementById('music-vol')?.addEventListener('input', e => {
    volume = parseFloat(e.target.value);
    if (audio) audio.volume = volume;
  });
}

// ── CONTROLS ──────────────────────────────────────────────────
function togglePlay() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    setPlayBtnState(true);
  } else {
    audio.pause();
    setPlayBtnState(false);
  }
}

function playPrev() {
  const pool = [...tracks, ...userTracks];
  if (!pool.length) return;
  currentIdx = (currentIdx - 1 + pool.length) % pool.length;
  playTrack(pool[currentIdx]);
}

function setPlayBtnState(playing) {
  const btn = document.getElementById('music-play');
  if (!btn) return;
  btn.textContent = playing ? '⏸' : '▶';
  btn.classList.toggle('active', playing);
}

function updatePlayerUI(title) {
  const el = document.getElementById('music-track-name');
  if (el) el.textContent = title || '—';
  setPlayBtnState(true);
}

// ── PUBLIC: ADD VAULT TRACK ───────────────────────────────────
export function addVaultTrack(name, blobUrl) {
  if (userTracks.find(t => t.title === name)) return;
  userTracks.push({ id: `vault-${Date.now()}`, title: name, url: blobUrl });
  console.log('[music] vault track added:', name);
}

// ── PUBLIC: STATE (extended for musicview) ────────────────────
export function getMusicState() {
  const pool = [...tracks, ...userTracks];
  const track = pool[currentIdx];
  return {
    playing:      audio ? !audio.paused : false,
    volume,
    currentIdx,
    trackIdx:     currentIdx,
    currentTitle: track?.title || null,
    title:        track?.title || null,
    progressPct:  audio && audio.duration ? audio.currentTime / audio.duration : 0,
    currentTime:  audio?.currentTime || 0,
    duration:     audio?.duration || 0,
    audio,
  };
}

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

