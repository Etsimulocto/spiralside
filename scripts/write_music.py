#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — write_music.py
# Writes js/app/music.js, utilities/music/playlist.json,
# and patches index.html + js/app/main.js
# Run from ~/spiralside with: py write_music.py
# ============================================================

import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

# ── HELPER ───────────────────────────────────────────────────
def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  wrote: {path}')

def read(path):
    full = os.path.join(BASE, path)
    with open(full, 'r', encoding='utf-8') as f:
        return f.read()

def patch(path, old, new, label=''):
    content = read(path)
    if old not in content:
        print(f'  WARN: patch target not found in {path} — {label}')
        return
    content = content.replace(old, new, 1)
    write(path, content)
    print(f'  patched: {path} [{label}]')

print('🎵 Writing Spiralside music system...')

# ── 1. playlist.json ─────────────────────────────────────────
playlist_json = '''{
  "tracks": [
    {
      "id": "spiralside",
      "title": "SPIRALSIDE",
      "file": "utilities/music/SPIRALSIDE.mp3"
    },
    {
      "id": "centerspark",
      "title": "Centerspark",
      "file": "utilities/music/Centerspark (1).mp3"
    },
    {
      "id": "mirrorblade",
      "title": "Mirrorblade",
      "file": "utilities/music/Mirrorblade.mp3"
    }
  ]
}
'''
write('utilities/music/playlist.json', playlist_json)

# ── 2. js/app/music.js ───────────────────────────────────────
music_js = '''// ============================================================
// SPIRALSIDE — MUSIC v1.0
// Loads playlist from HuggingFace, plays random track on init
// Mini player bar injected into DOM above chat input area
// User vault tracks can be added to pool at runtime
// Nimbis anchor: js/app/music.js
// ============================================================

import { state } from './state.js';

// ── CONFIG ────────────────────────────────────────────────────
const HF_BASE     = 'https://huggingface.co/spaces/quarterbitgames/spiralside/resolve/main';
const PLAYLIST_URL = `${HF_BASE}/utilities/music/playlist.json`;

// ── MODULE STATE ──────────────────────────────────────────────
let audio        = null;   // HTMLAudioElement
let tracks       = [];     // loaded from playlist.json
let currentIdx   = -1;     // index of playing track
let userTracks   = [];     // tracks added from vault
let volume       = 0.35;   // default volume (quiet ambient)
let playerInited = false;

// ── PUBLIC: INIT ──────────────────────────────────────────────
// Call once from main.js after app is shown
export async function initMusic() {
  if (playerInited) return;
  playerInited = true;

  await loadPlaylist();
  injectPlayerDOM();
  bindPlayerEvents();
  playRandom();
}

// ── LOAD PLAYLIST FROM HF ─────────────────────────────────────
async function loadPlaylist() {
  try {
    const r = await fetch(PLAYLIST_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    tracks = data.tracks || [];
    console.log('[music] playlist loaded:', tracks.length, 'tracks');
  } catch (e) {
    console.warn('[music] playlist fetch failed, using fallback:', e);
    // Fallback: hardcoded tracks in case HF is slow
    tracks = [
      { id: 'spiralside',  title: 'SPIRALSIDE',  file: 'utilities/music/SPIRALSIDE.mp3'       },
      { id: 'centerspark', title: 'Centerspark',  file: 'utilities/music/Centerspark (1).mp3' },
      { id: 'mirrorblade', title: 'Mirrorblade',  file: 'utilities/music/Mirrorblade.mp3'     },
    ];
  }
}

// ── PLAY A RANDOM TRACK ───────────────────────────────────────
function playRandom() {
  const pool = [...tracks, ...userTracks];
  if (!pool.length) return;

  // Pick a random index different from current
  let idx;
  do { idx = Math.floor(Math.random() * pool.length); }
  while (pool.length > 1 && idx === currentIdx);

  currentIdx = idx;
  playTrack(pool[idx]);
}

// ── PLAY A SPECIFIC TRACK ─────────────────────────────────────
function playTrack(track) {
  // Resolve URL — HF hosted tracks use HF_BASE prefix
  const url = track.url
    ? track.url                          // vault tracks have full blob URL
    : `${HF_BASE}/${track.file}`;

  // Stop existing
  if (audio) {
    audio.pause();
    audio.src = '';
  }

  audio = new Audio(url);
  audio.volume = volume;
  audio.loop   = false;

  // Auto-advance to next random track when one ends
  audio.addEventListener('ended', playRandom);

  // Update player UI
  updatePlayerUI(track.title);

  // Autoplay — browsers require user gesture first
  // We defer to first user interaction if blocked
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Blocked by browser — wait for user tap
      console.log('[music] autoplay blocked, waiting for gesture');
      setPlayBtnState(false);
      document.addEventListener('click', resumeOnGesture, { once: true });
    });
  }
}

// Resume after user gesture unblocks autoplay
function resumeOnGesture() {
  if (audio && audio.paused) {
    audio.play().catch(() => {});
    setPlayBtnState(true);
  }
}

// ── INJECT PLAYER DOM ─────────────────────────────────────────
function injectPlayerDOM() {
  // Remove if already exists (hot reload safety)
  document.getElementById('music-player')?.remove();

  // Inject styles
  if (!document.getElementById('music-styles')) {
    const s = document.createElement('style');
    s.id = 'music-styles';
    s.textContent = `
      /* ── MUSIC PLAYER BAR ── */
      #music-player {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 16px;
        background: var(--surface2, #151523);
        border-top: 1px solid var(--border, #1e1e35);
        flex-shrink: 0;
        z-index: 50;
        height: 40px;
      }

      /* Music note icon */
      #music-icon {
        font-size: 0.85rem;
        color: var(--teal, #00F6D6);
        flex-shrink: 0;
        animation: musicPulse 2s ease-in-out infinite;
      }
      @keyframes musicPulse {
        0%, 100% { opacity: 0.6; }
        50%       { opacity: 1;   }
      }

      /* Scrolling track name */
      #music-track-name {
        flex: 1;
        font-size: 0.62rem;
        letter-spacing: 0.1em;
        color: var(--subtext, #6060A0);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-ui, 'DM Mono', monospace);
        text-transform: uppercase;
        min-width: 0;
      }

      /* Controls */
      #music-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .music-btn {
        background: none;
        border: none;
        color: var(--subtext, #6060A0);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
        font-size: 0.75rem;
        line-height: 1;
      }
      .music-btn:hover { color: var(--text, #F0F0FF); }
      .music-btn.active { color: var(--teal, #00F6D6); }

      /* Volume slider */
      #music-vol {
        width: 56px;
        accent-color: var(--teal, #00F6D6);
        height: 3px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      #music-vol:hover { opacity: 1; }
    `;
    document.head.appendChild(s);
  }

  // Build the player element
  const player = document.createElement('div');
  player.id = 'music-player';
  player.innerHTML = `
    <span id="music-icon">♪</span>
    <span id="music-track-name">loading...</span>
    <div id="music-controls">
      <button class="music-btn" id="music-prev"  title="previous">◀◀</button>
      <button class="music-btn active" id="music-play" title="play/pause">⏸</button>
      <button class="music-btn" id="music-next"  title="next">▶▶</button>
      <input  type="range" id="music-vol" min="0" max="1" step="0.01" value="${volume}" title="volume" />
    </div>
  `;

  // Insert ABOVE the chat input area inside #chat-view
  const chatView  = document.getElementById('chat-view');
  const inputArea = chatView?.querySelector('.chat-input-area');
  if (inputArea) {
    chatView.insertBefore(player, inputArea);
  } else {
    // Fallback: append to chat view
    chatView?.appendChild(player);
  }
}

// ── BIND PLAYER EVENTS ────────────────────────────────────────
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

// ── UPDATE PLAYER UI ──────────────────────────────────────────
function updatePlayerUI(title) {
  const nameEl = document.getElementById('music-track-name');
  if (nameEl) nameEl.textContent = title || 'unknown';
  setPlayBtnState(true);
}

// ── PUBLIC: ADD VAULT TRACK ───────────────────────────────────
// Called from vault.js when user uploads an audio file
export function addVaultTrack(name, blobUrl) {
  // Avoid duplicates
  if (userTracks.find(t => t.title === name)) return;
  userTracks.push({ id: `vault-${Date.now()}`, title: name, url: blobUrl });
  console.log('[music] vault track added:', name);
}

// ── PUBLIC: GET CURRENT STATE ─────────────────────────────────
export function getMusicState() {
  return { playing: audio && !audio.paused, volume, currentIdx };
}
''';
write('js/app/music.js', music_js)

# ── 3. Patch main.js — import music + call initMusic ─────────
# Read main.js
main_content = read('js/app/main.js')

# Add music import after last import line
old_import = "import { initBuild"
new_import = "import { initMusic }          from './music.js';\nimport { initBuild"
patch('js/app/main.js', old_import, new_import, 'add music import')

# Call initMusic inside onAppReady (after loadUsage or near end of onAppReady)
old_ready = "  handlePayPalReturn();"
new_ready = "  handlePayPalReturn();\n  initMusic();  // start background music"
patch('js/app/main.js', old_ready, new_ready, 'call initMusic in onAppReady')

# ── 4. Patch vault.js — add audio file detection ─────────────
vault_content = read('js/app/vault.js')

# Add import for addVaultTrack at top
if 'addVaultTrack' not in vault_content:
    old_vault_import = "// ============================================================\n// SPIRALSIDE — VAULT"
    new_vault_import = "// ============================================================\n// SPIRALSIDE — VAULT"
    # Safer: patch the processFile function to detect audio
    audio_patch_old = "  const content = await f.text().catch(() => '[binary]');"
    audio_patch_new = """  // Detect audio files — add to music player instead of reading as text
  const isAudio = f.type.startsWith('audio/') || /\\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name);
  if (isAudio) {
    const blobUrl = URL.createObjectURL(f);
    // Dynamically import music module to add track
    import('./music.js').then(m => m.addVaultTrack(f.name, blobUrl));
  }
  const content = isAudio ? '[audio file — added to music player]' : await f.text().catch(() => '[binary]');"""
    patch('js/app/vault.js', audio_patch_old, audio_patch_new, 'audio detection in vault')
else:
    print('  skip: vault.js already has audio handling')

print()
print('✅ Music system written!')
print()
print('📋 NEXT STEPS:')
print('  1. Upload utilities/music/playlist.json to HuggingFace space')
print('     (the file is at: utilities/music/playlist.json in your repo)')
print()
print('  2. On HuggingFace, the playlist.json should already exist')
print('     if you push it — but HF Spaces files need to be uploaded')
print('     via the HF UI or git lfs push.')
print()
print('  3. Run in Git Bash:')
print('     cd ~/spiralside')
print('     git add .')
print('     git commit -m "feat: add background music player"')
print('     git push')
print()
print('  4. Hard refresh: Ctrl+Shift+R')
print()
print('🎵 Tracks loaded:')
print('   - SPIRALSIDE.mp3')
print('   - Centerspark (1).mp3')
print('   - Mirrorblade.mp3')
