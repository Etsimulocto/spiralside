const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const catalogContent = document.querySelector("#catalog-content");
const catalogSummary = document.querySelector("#catalog-summary");
const catalogRunStatus = document.querySelector("#catalog-run-status");
const menuButton = document.querySelector("#menu-button");
const catalogToggleButton = document.querySelector("#catalog-toggle");
const editorToggleButton = document.querySelector("#editor-toggle");
const editorPanel = document.querySelector("#editor-panel");
const editorCloseButton = document.querySelector("#editor-close");
const editorFileSelect = document.querySelector("#editor-file");
const editorFilePath = document.querySelector("#editor-file-path");
const editorText = document.querySelector("#editor-text");
const editorStatus = document.querySelector("#editor-status");
const editorValidateButton = document.querySelector("#editor-validate");
const editorSaveButton = document.querySelector("#editor-save");
const editorDownloadButton = document.querySelector("#editor-download");
const editorResetButton = document.querySelector("#editor-reset");
const enemyTuner = document.querySelector("#enemy-tuner");
const spawnTools = document.querySelector("#spawn-tools");
const spawnItemSelect = document.querySelector("#spawn-item-select");
const spawnSelectedButton = document.querySelector("#spawn-selected");
const spawnAllButton = document.querySelector("#spawn-all");
const spawnToolsTitle = document.querySelector("#spawn-tools-title");
const spawnToolsHelp = document.querySelector("#spawn-tools-help");
const enemyTunerSelect = document.querySelector("#enemy-tuner-select");
const enemyTunerFields = document.querySelector("#enemy-tuner-fields");
const enemyPreviewLetter = document.querySelector("#enemy-preview-letter");
const enemyPreviewName = document.querySelector("#enemy-preview-name");
const explosionPreview = document.querySelector("#explosion-preview");
const dialog = document.querySelector("#settings-dialog");
const resumeButton = document.querySelector("#resume-button");
const closeMenuButton = document.querySelector("#close-menu");
const invertButton = document.querySelector("#invert-button");
const soundToggle = document.querySelector("#sound-toggle");
const slotList = document.querySelector("#save-slots");
const menuStatus = document.querySelector("#menu-status");
const restartButton = document.querySelector("#restart-button");
const gamepadStatus = document.querySelector("#gamepad-status");
const leftStick = document.querySelector("#left-stick"), rightStick = document.querySelector("#right-stick");
const leftStickKnob = document.querySelector("#left-stick-knob"), rightStickKnob = document.querySelector("#right-stick-knob");
const touchSticks = document.querySelector("#touch-sticks"), app = document.querySelector(".app");
const stage = document.querySelector(".stage");
const deathWallLine1 = document.querySelector("#death-wall-line-1");
const deathWallLine2 = document.querySelector("#death-wall-line-2");
const deathWall = document.querySelector("#death-wall");
const depthReadout = document.querySelector("#depth-readout");
const pickupMessageReadout = document.querySelector("#pickup-message");
const healthMeter = document.querySelector("#health-meter");
const healthText = document.querySelector("#health-text");
const livesReadout = document.querySelector("#lives-readout");
const armorReadout = document.querySelector("#armor-readout");
const scoreReadout = document.querySelector("#score-readout");
const weaponReadout = document.querySelector("#weapon-readout");
const fontSelect = document.querySelector("#font-theme");
const fontThemes = {
  // CRT: the glowing terminal font (VT323). It draws small, so it gets a size boost and no fake bold.
  crt: { canvas: "'VT323', 'Courier New', monospace", scale: 1.32, weight: "normal" },
  dos: { canvas: "'Courier New', Courier, monospace" },
  vga: { canvas: "'Lucida Console', 'DejaVu Sans Mono', monospace" },
  arcade: { canvas: "'Arial Black', Impact, 'DejaVu Sans Mono', monospace" }
};
const controlMap = {keyboard:{moveUp:["w","ArrowUp"],moveDown:["s","ArrowDown"],moveLeft:["a","ArrowLeft"],moveRight:["d","ArrowRight"],aimUp:["i"],aimDown:["k"],aimLeft:["j"],aimRight:["l"],fire:[" "],catalogToggle:["F6"]},gamepad:{deadzone:.18,moveAxes:{x:0,y:1},aimAxes:{x:2,y:3},fireButtons:[0,7],catalogButton:4,weaponPrevButtons:[6],weaponNextButtons:[5],dpad:{up:12,down:13,left:14,right:15}},touch:{deadzone:.12,fireWhileRightStickHeld:true}};
const input = {pad:null,move:{x:0,y:0},aim:{x:0,y:0},touchMove:{x:0,y:0},touchAim:{x:0,y:0},touchFire:false,mouseAim:{x:0,y:0},mouseFire:false};
let lastGamepadMessage = "";
const gamepadUiState = {
  startDown: false,
  selectDown: false,
  backDown: false,
  catalogDown: false,
  activateDown: false,
  direction: "",
  repeatIn: 0,
};

const palette = {
  paper: "#f4f0e6",
  ink: "#191919",
  accent: "#d84b3e",
};
const SLOT_PREFIX = "bulletPoints.saveSlot.";
const SLOT_COUNT = 3;
const EDITOR_DRAFT_PREFIX = "bulletPoints.editorDraft.";
const roomSettings = {
  scrollSpeed: 42,
  spawnInterval: 4.2,
  wallWidth: 54,
  glyphSpacing: 26,
  deathWallHeight: 160,
  deathWallLines: ["WALL OF DEATH", "NO ESCAPE"],
  leftWallGlyphs: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  rightWallGlyphs: "0123456789!?<>+-*/"
};
const uiText = {
  title: "PAUSED / SETTINGS",
  pauseSettings: "Ⅱ PAUSE / SETTINGS",
  resume: "RESUME RUN",
  displayHeading: "DISPLAY & SOUND",
  inkLabel: "Ink colors",
  invertOn: "INK: PAPER",
  invertOff: "INK: NEON",
  soundLabel: "Sound effects",
  soundNote: "(synth bleeps)",
  controlsHeading: "CONTROLS",
  keyboard: "Keyboard and mouse",
  auto: "Auto: use any active input",
  keyboard: "Keyboard and mouse",
  gamepad: "Gamepad",
  touch: "Dual mobile sticks",
  touchNote: "(left moves · right aims and fires)",
  gamepadStatus: "Looking for a connected controller…",
  noGamepad: "No controller detected. Connect one, then press a button.",
  gamepadConnected: "Connected: ",
  gamepadUnsupported: "Gamepad API unavailable in this browser.",
  saveSlots: "SAVE SLOTS",
  storageNote: "Stored in this browser",
  slotName: "SAVE SLOT {slot}",
  empty: "EMPTY",
  savedPrefix: "Saved ",
  savedRun: "Saved run",
  save: "SAVE",
  load: "LOAD",
  clear: "CLEAR",
  restart: "RESTART RUN",
  replacePrompt: "Replace Save Slot ",
  clearPrompt: "Clear Save Slot ",
  restartPrompt: "Restart this run?",
  savedMessage: "Saved to Slot ",
  saveFailed: "Could not save. Browser storage may be unavailable.",
  loadEmpty: " has no readable save.",
  loadSuccess: "Loaded Slot ",
  clearedMessage: "Slot ",
  clearFailed: "Could not clear this save slot.",
  restartSuccess: "Run restarted.",
  soundEnabled: "Sound effects enabled.",
  soundMuted: "Sound effects muted.",
  autoSelected: "Auto controls enabled.",
  keyboardSelected: "Keyboard and mouse selected.",
  gamepadSelected: "Gamepad selected.",
  touchSelected: "Dual mobile sticks selected."
};

let editorDirty = false;
let editorLoaded = false;
let editorPath = "";

const weaponList = [{
  id: "period", name: "Period Pistol", projectileGlyph: ".", damage: 1,
  shotsPerSecond: 5, projectileSpeed: 560, spreadDegrees: 0, projectilesPerShot: 1, pattern: "single", unlockedByDefault: true
}];
let pickupList = [];
let enemyList = [];
let horizontalWallWords = ["STONE", "BARRIER", "PARAGRAPH", "BLOCK"];
let numberHazardList = [];
let obstacleSetList = [];
const catalogData = { enemies: [], weapons: [], pickups: [], obstacles: [], patterns: [], wordSet: {}, settings: {}, controls: {}, menu: {}, feed: {} };
const state = {
  theme: "neon", paused: false, soundEnabled: true, controlScheme: "auto", fontTheme: "crt", keys: new Set(),
  player: { x: 0.5, y: 0.76 }, projectiles: [], beams: [], pickups: [], obstacles: [], fallingBlocks: [], numberHazards: [], effects: [],
  fireCooldown: 0, aim: { x: 0, y: -1 }, gameOver: false,
  enemies: [], enemyBullets: [], explosions: [], enemySpawnIndex: 0,
  health: 3, maxHealth: 3, lives: 3, maxLives: 3, score: 0, shields: 0, weaponId: "period", unlockedWeapons: ["period"],
  worldSpawnTimer: 1.5, nextWallSide: "left", runTime: 0, pickupMessage: "", pickupMessageTime: 0,
  gamepadPrevDown: false, gamepadNextDown: false,
  world: { scrollOffset: 0, deathWallY: null, distance: 0 }, lastTime: 0,
  // Run flow: title card until the first FIRE, then game-over card with a short lockout.
  started: false, overTime: 0,
  // Difficulty: the page number rises with depth and drives the wave director.
  level: 1, enemySpawnTimer: 2.2,
  // Feedback: invulnerability blink, screen shake, red hurt flash.
  invuln: 0, shake: 0, hurtFlash: 0,
  // Combo chain: kills inside the timer raise the score multiplier.
  combo: 0, comboTimer: 0, bestCombo: 0,
  // Floating score text and the big centered "PAGE n" banner.
  popups: [], banner: { text: "", time: 0 },
  // Best score, loaded from this browser at startup.
  best: 0, newBest: false,
};


// =====================================================================
// SOUND - tiny WebAudio synth. No files; every effect is built from tones and noise.
// =====================================================================
const sfx = (() => {
  let audio = null;          // the AudioContext (made on first use)
  let master = null;         // master volume node
  let noiseBuffer = null;    // half a second of white noise, reused for hits and crumbles
  const lastPlayed = {};     // name -> last start time, used to stop machine-gun spam
  // Minimum seconds between two plays of the same sound.
  const minGap = { shoot: 0.06, hit: 0.035, chip: 0.04, clink: 0.06, enemyShot: 0.14, kill: 0.03, pickup: 0.05 };

  // Build the context lazily. Browsers only let it run after a click or key press.
  function ensure() {
    if (audio) return audio;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audio = new AudioCtor();
    master = audio.createGain();
    master.gain.value = 0.3;
    master.connect(audio.destination);
    noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.5), audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return audio;
  }

  // One oscillator blip: frequency, length, wave shape, volume, optional pitch slide, optional delay.
  function tone(freq, duration, type = "square", volume = 0.15, slideTo = 0, delay = 0) {
    const t = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  // A burst of filtered noise: crunches, crumbles, impacts.
  function noise(duration, volume = 0.2, cutoff = 1800, delay = 0) {
    const t = audio.currentTime + delay;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t);
    source.stop(t + duration + 0.03);
  }

  // Play a few notes in a row (little jingles).
  function arp(notes, step, type = "square", volume = 0.09, length = 0.1) {
    notes.forEach((freq, i) => tone(freq, length, type, volume, 0, i * step));
  }

  // The sound list. Names are used by the game code below.
  const recipes = {
    shoot() { tone(920, 0.05, "square", 0.035, 480); },
    enemyShot() { tone(260, 0.07, "triangle", 0.03, 420); },
    hit() { tone(320, 0.05, "square", 0.07, 170); },
    kill() { noise(0.16, 0.2, 2600); tone(560, 0.12, "square", 0.08, 120); },
    clink() { tone(1700, 0.04, "triangle", 0.05, 1300); },
    chip() { noise(0.05, 0.09, 3400); },
    crumble() { noise(0.4, 0.26, 900); tone(170, 0.32, "sawtooth", 0.09, 55); },
    unlock() { arp([523, 659, 784, 1046], 0.07); },
    pickup() { arp([660, 880, 1320], 0.05, "triangle", 0.11, 0.09); },
    hurt() { tone(230, 0.24, "sawtooth", 0.15, 70); noise(0.15, 0.14, 1300); },
    shield() { tone(1250, 0.16, "triangle", 0.12, 620); },
    life() { tone(420, 0.55, "sawtooth", 0.15, 45); noise(0.4, 0.15, 700); },
    over() { arp([392, 330, 262, 196], 0.22, "square", 0.11, 0.26); },
    level() { arp([392, 523, 659, 784], 0.06, "square", 0.08); },
    start() { arp([262, 392, 523, 784], 0.07, "square", 0.08); },
  };

  return {
    // Called on the first click/key so the browser lets audio play.
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    },
    // Play one named sound if sound is on and it isn't spamming.
    play(name) {
      if (!state.soundEnabled || !recipes[name]) return;
      const ctx = ensure();
      if (!ctx || ctx.state !== "running") return;
      const now = ctx.currentTime;
      if (minGap[name] && now - (lastPlayed[name] ?? -9) < minGap[name]) return;
      lastPlayed[name] = now;
      try { recipes[name](); } catch { /* audio is a bonus; never crash the game over it */ }
    },
  };
})();

// =====================================================================
// GLOW - soft light blobs behind bright things (neon theme only).
// A cached radial-gradient sprite per color is much cheaper than canvas shadowBlur.
// =====================================================================
const glowCache = new Map();
function glowSprite(colorCode) {
  if (glowCache.has(colorCode)) return glowCache.get(colorCode);
  const sprite = document.createElement("canvas");            // offscreen 64x64 canvas
  sprite.width = sprite.height = 64;
  const g = sprite.getContext("2d");
  const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, colorCode);                         // bright center
  gradient.addColorStop(0.35, colorCode + "55");               // soft middle (hex alpha)
  gradient.addColorStop(1, "rgba(0,0,0,0)");                   // fade to nothing
  g.fillStyle = gradient;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(colorCode, sprite);
  return sprite;
}
// Draw a glow blob centered on x,y. Skipped entirely on the paper theme.
function drawGlow(x, y, radius, colorCode, alpha = 0.5) {
  if (!colors().glow || !/^#[0-9a-f]{6}$/i.test(colorCode || "")) return;
  context.save();
  context.globalAlpha *= alpha;
  context.globalCompositeOperation = "lighter";
  context.drawImage(glowSprite(colorCode), x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
}

// =====================================================================
// FEEDBACK - popups, sparks, shake, combo.
// =====================================================================
// Floating text that drifts up and fades (score numbers, pickup names).
function addPopup(x, y, text, colorCode, life = 0.9) {
  state.popups.push({ x, y, text, color: colorCode, life, duration: life });
  if (state.popups.length > 40) state.popups.shift();
}
// Kick the camera. Bigger numbers shake harder; it decays on its own.
function addShake(amount) {
  state.shake = Math.min(18, Math.max(state.shake, amount));
}
// Little impact sparks (reuses the letter-particle list).
function spawnSparks(x, y, colorCode, count = 3) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    state.explosions.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      glyph: Math.random() < 0.5 ? "·" : "*", color: colorCode || "#ffffff", life: 0.22, duration: 0.22 });
  }
}
// A single letter knocked out of a word. It hops up, then falls with gravity.
function spawnLetterDebris(x, y, glyph, colorCode) {
  state.explosions.push({ x, y, vx: (Math.random() - 0.5) * 140, vy: -70 - Math.random() * 110, g: 520,
    glyph, color: colorCode || "#ffffff", life: 0.95, duration: 0.95 });
}
// Score multiplier from the current combo: x1, then +1 every 4 kills, max x8.
function comboMultiplier() {
  return Math.min(8, 1 + Math.floor(state.combo / 4));
}
// Everything that happens when something dies: combo, score, popup, shake, sound.
function registerKill(x, y, basePoints, colorCode, shake = 3) {
  state.combo += 1;
  state.comboTimer = 2.4;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const mult = comboMultiplier();
  const points = Math.round(Math.max(0, basePoints) * mult);
  state.score += points;
  addPopup(x, y - 6, "+" + points + (mult > 1 ? " x" + mult : ""), colorCode || colors().hot);
  addShake(shake);
  sfx.play("kill");
}

// =====================================================================
// DIFFICULTY - the page number and the wave director.
// =====================================================================
const PAGE_LENGTH = 700;     // world distance per page (about 15 seconds of scrolling)
// The world scrolls a little faster each page, capped at +60%.
function levelSpeedScale() {
  return 1 + Math.min(0.6, (state.level - 1) * 0.06);
}
// Spawn one enemy, or a squad of the same letter on later pages.
function spawnEnemyWave(width, level) {
  if (!enemyList.length) return;
  const cap = Math.min(12, 4 + level);                                   // max enemies alive
  if (state.enemies.length >= cap) return;
  const pool = enemyList.slice(0, Math.min(enemyList.length, 5 + level * 3)); // A..E first, more letters later
  const data = pool[Math.floor(Math.random() * pool.length)];
  const squadChance = Math.min(0.55, 0.1 + level * 0.06);
  const squad = Math.random() < squadChance ? 2 + Math.floor(Math.random() * Math.min(3, level)) : 1;
  const left = roomSettings.wallWidth + 22;
  const right = Math.max(left + 1, width - roomSettings.wallWidth - 22);
  const center = left + 30 + Math.random() * Math.max(1, right - left - 60);
  const count = Math.min(squad, cap - state.enemies.length);
  for (let i = 0; i < count; i += 1) {
    const offset = i - (count - 1) / 2;                                   // spread around the center
    const x = Math.max(left, Math.min(right, center + offset * 36));
    spawnEnemyData(data, x, -24 - Math.abs(offset) * 22);                 // little V formation
  }
}
// Per-frame timers that only tick while the run is live.
function updateRunTimers(dt) {
  state.invuln = Math.max(0, state.invuln - dt);
  state.comboTimer -= dt;
  if (state.comboTimer <= 0) state.combo = 0;
  state.enemies.forEach(enemy => { enemy.flash = Math.max(0, (enemy.flash || 0) - dt); });
  state.obstacles.forEach(o => { o.flash = Math.max(0, (o.flash || 0) - dt); });
  state.fallingBlocks.forEach(o => { o.flash = Math.max(0, (o.flash || 0) - dt); });
  const page = 1 + Math.floor(state.world.distance / PAGE_LENGTH);
  if (page > state.level) {
    state.level = page;
    const word = horizontalWallWords[Math.floor(Math.random() * horizontalWallWords.length)] || "TEXT";
    state.banner = { text: "PAGE " + page + " · " + word, time: 2.4 };
    sfx.play("level");
  }
}
// Timers that also run on the title / game-over screens (so effects settle).
function tickFeedback(dt) {
  state.shake = Math.max(0, state.shake - dt * 40);
  state.hurtFlash = Math.max(0, state.hurtFlash - dt);
  state.banner.time = Math.max(0, state.banner.time - dt);
  state.popups = state.popups.filter(popup => (popup.life -= dt) > 0);
}

// =====================================================================
// RUN FLOW - title card, start, game over, best score.
// =====================================================================
function startRun() {
  sfx.unlock();
  if (state.gameOver) resetRun();
  state.started = true;
  state.paused = dialog.open || !editorPanel.hidden;
  state.invuln = 1.2;
  state.lastTime = 0;
  input.mouseFire = false;
  sfx.play("start");
}
// On the title or game-over card, FIRE / Enter starts (after a short lockout on game over).
function handleOverlayInput(dt) {
  if (dialog.open || !editorPanel.hidden) return;
  if (state.gameOver) state.overTime += dt;
  const controls = readControls();
  const wantsStart = controls.fire || state.keys.has("Enter");
  if (!wantsStart) return;
  if (!state.started) startRun();
  else if (state.gameOver && state.overTime > 0.9) startRun();
}
function saveBest() {
  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    state.newBest = true;
    try { localStorage.setItem("bulletPoints.best", String(state.best)); } catch {}
  }
}

// =====================================================================
// BREAKABLE WORDS - shots chip letters out of walls until they shatter.
// =====================================================================
// Blocks are stored by their center; everything else by its left edge.
function obstacleLeft(obstacle, x = obstacle.x) {
  return obstacle.kind === "block" ? x - obstacle.width / 2 : x;
}
// Is this point inside any solid wall or block? Returns that obstacle.
function solidAt(x, y) {
  return solidObstacles().find(o => {
    const left = obstacleLeft(o);
    return x > left && x < left + o.width && y > o.y - o.height / 2 && y < o.y + o.height / 2;
  });
}
// Base toughness from data/obstacles.json (falls back to sensible numbers).
function obstacleBaseHealth(type, fallback) {
  const entry = (catalogData.obstacles || []).find(item => item?.type === type);
  return Number(entry?.health) || fallback;
}
// Work out hit points the first time something is hit. Gates and big LOCK walls can't be shot.
function ensureObstacleHp(o) {
  if (o.maxHp != null) return;
  const isToken = o.kind === "lock" && String(o.id || "").includes("-token-");
  if (o.kind === "gate" || (o.kind === "lock" && !isToken)) o.maxHp = Infinity;
  else if (isToken) o.maxHp = obstacleBaseHealth("lock", 1) * 3;
  else if (o.kind === "block") o.maxHp = obstacleBaseHealth("block", 2) * 3;
  else if (o.kind === "stone") o.maxHp = obstacleBaseHealth("stone", 3) * 2 + Math.ceil(o.width / 50);
  else o.maxHp = 3 + Math.ceil(o.width / 60);                         // word walls: easy-ish
  o.hp = o.maxHp;
}
// Repeat a word across a wall so blank walls still read as text.
function fillLabel(word, width, separator) {
  setCanvasFont(16, "bold");
  let label = word;
  while (context.measureText(label + separator + word).width < width - 14 && label.length < 240) label += separator + word;
  return label;
}
// The label with knocked-out letters replaced by spaces.
function brokenLabel(o) {
  if (!o.broken || !o.broken.size) return o.label;
  return o.label.split("").map((ch, i) => (o.broken.has(i) ? " " : ch)).join("");
}
// The color each kind of wall glows.
function obstacleTint(o, color) {
  if (o.kind === "gate") return color.teal;
  if (o.kind === "lock") return color.hot;
  if (o.kind === "stone") return color.stone;
  if (o.kind === "block") return "#ff9f43";
  return color.accent;
}
// A shot (or beam) hits a wall.
function damageObstacle(o, amount, x, y) {
  ensureObstacleHp(o);
  const tint = obstacleTint(o, colors());
  if (!Number.isFinite(o.maxHp)) {                                    // unbreakable: just sparks
    spawnSparks(x, y, tint, 2);
    sfx.play("clink");
    return;
  }
  o.hp -= Math.max(1, Number(amount) || 1);
  o.flash = 0.07;
  spawnSparks(x, y, tint, 2);
  // Knock letters out in proportion to the damage taken.
  if (o.label) {
    if (!o.broken) o.broken = new Set();
    const visible = [];
    for (let i = 0; i < o.label.length; i += 1) if (o.label[i] !== " " && !o.broken.has(i)) visible.push(i);
    const total = visible.length + o.broken.size;
    const target = Math.floor(total * (1 - Math.max(0, o.hp) / o.maxHp));
    const drawnWidth = Math.min(o.width - 12, (setCanvasFont(16, "bold"), context.measureText(o.label).width));
    const textLeft = obstacleLeft(o) + o.width / 2 - drawnWidth / 2;
    while (o.broken.size < target && visible.length) {
      const pick = visible.splice(Math.floor(Math.random() * visible.length), 1)[0];
      o.broken.add(pick);
      spawnLetterDebris(textLeft + drawnWidth * ((pick + 0.5) / o.label.length), o.y, o.label[pick], tint);
    }
  }
  if (o.hp > 0) { sfx.play("chip"); return; }
  destroyObstacle(o, tint);
}
// A wall runs out of hit points: shatter it, score it, maybe open gates.
function destroyObstacle(o, tint) {
  state.obstacles = state.obstacles.filter(item => item !== o);
  state.fallingBlocks = state.fallingBlocks.filter(item => item !== o);
  const left = obstacleLeft(o);
  const letters = (brokenLabel(o) || o.word || "#").replace(/[ ·═]/g, "") || "#";
  const count = Math.min(18, letters.length);
  for (let i = 0; i < count; i += 1) {
    spawnLetterDebris(left + o.width * ((i + 0.5) / count), o.y, letters[i], tint);
  }
  const points = o.kind === "lock" ? 100 : o.kind === "stone" ? 60 : o.kind === "block" ? 50 : 40;
  registerKill(left + o.width / 2, o.y, points, tint, 5);
  sfx.play("crumble");
  // Key and door: breaking a LOCK token opens every GATE in the same set.
  if (o.kind === "lock" && o.setId) {
    const gates = state.obstacles.filter(item => item.setId === o.setId && (item.kind === "gate" || item.kind === "lock"));
    gates.forEach(gate => { gate.maxHp = 1; gate.hp = 0; destroyObstacle(gate, colors().teal); });
    if (gates.length) { sayPickup("UNLOCKED · THE GATES OPEN"); sfx.play("unlock"); }
  }
}

// =====================================================================
// OVERLAY DRAWING - neon grid, vignette, title card, game over, combo.
// =====================================================================
// Draw text centered at x,y, with an optional glow.
function centerText(text, x, y, size, colorCode, glow = 0) {
  setCanvasFont(size, "bold");
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = colorCode;
  if (glow && colors().glow) { context.shadowColor = colorCode; context.shadowBlur = glow; }
  context.fillText(text, x, y);
  context.shadowBlur = 0;
}
// Faint scrolling grid behind the room (neon theme).
function drawNeonGrid(width, height, color) {
  const cell = 40;
  const phase = state.world.scrollOffset % cell;
  context.save();
  context.strokeStyle = color.grid;
  context.lineWidth = 1;
  context.beginPath();
  for (let x = cell / 2; x < width; x += cell) { context.moveTo(x, 0); context.lineTo(x, height); }
  for (let y = phase - cell; y < height; y += cell) { context.moveTo(0, y); context.lineTo(width, y); }
  context.stroke();
  context.restore();
}
// Everything drawn on top of the world: vignette, hurt flash, combo, banner, cards.
function drawScreenOverlays(width, height, color) {
  const floor = state.world.deathWallY || height - roomSettings.deathWallHeight;
  if (color.glow) {                                                   // dark corners (CRT look)
    const vignette = context.createRadialGradient(width / 2, floor / 2, Math.min(width, floor) * 0.3, width / 2, floor / 2, Math.max(width, floor) * 0.8);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.55)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }
  if (state.hurtFlash > 0) {                                          // red flash when hit
    context.fillStyle = `rgba(255, 60, 90, ${Math.min(0.35, state.hurtFlash)})`;
    context.fillRect(0, 0, width, height);
  }
  if (state.started && !state.gameOver && state.combo >= 2) {         // combo counter, top right
    const x = width - roomSettings.wallWidth - 14;
    context.save();
    setCanvasFont(15, "bold");
    context.textAlign = "right";
    context.textBaseline = "top";
    context.fillStyle = color.hot;
    if (color.glow) { context.shadowColor = color.hot; context.shadowBlur = 10; }
    context.fillText("COMBO " + state.combo + "  x" + comboMultiplier(), x, 12);
    context.shadowBlur = 0;
    context.fillStyle = color.hot;
    context.globalAlpha = 0.7;
    context.fillRect(x - 90 * Math.max(0, state.comboTimer / 2.4), 34, 90 * Math.max(0, state.comboTimer / 2.4), 3);
    context.restore();
  }
  if (state.banner.time > 0) {                                        // PAGE n banner
    context.save();
    context.globalAlpha = Math.min(1, state.banner.time / 0.5);
    centerText(state.banner.text, width / 2, floor * 0.3, 24, color.hot, 16);
    context.restore();
  }
  if (!editorPanel.hidden) return;                                    // editor wants to see the field
  if (!state.started) drawTitleCard(width, floor, color);
  else if (state.gameOver) drawGameOverCard(width, floor, color);
}
// Dark panel used behind the title and game-over text.
function drawCardBackdrop(width, floor, color) {
  context.fillStyle = color.glow ? "rgba(2, 4, 8, 0.72)" : "rgba(244, 240, 230, 0.86)";
  context.fillRect(0, 0, width, floor);
}
// The title card shown before the first run.
function drawTitleCard(width, floor, color) {
  drawCardBackdrop(width, floor, color);
  const cx = width / 2;
  const top = Math.max(40, floor * 0.2);
  const big = Math.max(26, Math.min(46, width / 11));
  centerText("BULLET", cx, top, big, color.accent, 22);
  centerText("POINTS", cx, top + big * 1.05, big, color.accent, 22);
  centerText("AN INFINITE WORD DUNGEON", cx, top + big * 1.9, 12, color.ink, 6);
  const lines = ["SHOOT THE LETTERS · BREAK THE WORDS", "SHOOT A LOCK TO OPEN ITS GATES", "CHAIN KILLS FOR A COMBO", "DON'T TOUCH THE WALL OF DEATH"];
  lines.forEach((line, i) => centerText(line, cx, top + big * 2.7 + i * 20, 11, color.stone, 0));
  if (Math.floor(performance.now() / 500) % 2 === 0) {
    centerText("PRESS FIRE · CLICK · TAP TO START", cx, top + big * 2.7 + lines.length * 20 + 26, 14, color.hot, 12);
  }
  if (state.best > 0) centerText("BEST " + state.best.toLocaleString(), cx, top + big * 2.7 + lines.length * 20 + 56, 12, color.teal, 6);
}
// The game-over card.
function drawGameOverCard(width, floor, color) {
  drawCardBackdrop(width, floor, color);
  const cx = width / 2;
  const top = Math.max(50, floor * 0.24);
  centerText("ERASED", cx, top, Math.max(30, Math.min(52, width / 9)), color.red, 24);
  centerText(gameOverLine, cx, top + 42, 13, color.ink, 6);
  centerText("PTS " + Math.floor(state.score).toLocaleString(), cx, top + 80, 18, color.hot, 10);
  centerText("DEPTH " + Math.floor(state.world.distance / 10) + " m · PAGE " + state.level + " · BEST COMBO " + state.bestCombo, cx, top + 106, 11, color.stone, 0);
  centerText(state.newBest ? "NEW BEST!" : "BEST " + state.best.toLocaleString(), cx, top + 130, 13, color.teal, 8);
  if (state.overTime > 0.9 && Math.floor(performance.now() / 500) % 2 === 0) {
    centerText("FIRE · R · TAP TO RETRY", cx, top + 166, 14, color.accent, 12);
  }
}
let gameOverLine = "THE PAGE CAUGHT YOU";   // replaced by data/menu.json labels.gameOver

function hasCompleteEnemyRoster(data) {
  const enemies = data?.enemies;
  if (!Array.isArray(enemies) || enemies.length !== 26) return false;
  const letters = new Set(enemies.map(enemy => String(enemy?.letter || "").toUpperCase()));
  return letters.size === 26 && "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").every(letter => letters.has(letter));
}

async function loadCombatData() {
  try {
    const [weaponResponse, pickupResponse, enemyResponse] = await Promise.all([
      fetch(new URL("../data/weapons.json", import.meta.url)),
      fetch(new URL("../data/pickups.json", import.meta.url)),
      fetch(new URL("../data/enemies.json", import.meta.url))
    ]);
    if (weaponResponse.ok) {
      const data = await weaponResponse.json();
      if (Array.isArray(data.weapons) && data.weapons.length) {
        weaponList.splice(0, weaponList.length, ...data.weapons);
        state.unlockedWeapons = weaponList.filter(w => w.unlockedByDefault).map(w => w.id);
        if (!state.unlockedWeapons.length) state.unlockedWeapons = [weaponList[0].id];
        state.weaponId = state.unlockedWeapons.includes("period") ? "period" : state.unlockedWeapons[0];
      }
    }
    if (pickupResponse.ok) {
      const data = await pickupResponse.json();
      if (Array.isArray(data.pickups)) pickupList = data.pickups;
    }
    if (enemyResponse.ok) {
      let data = await enemyResponse.json();
      try {
        const draftKey = EDITOR_DRAFT_PREFIX + "../data/enemies.json";
        const draft = localStorage.getItem(draftKey);
        if (draft !== null) {
          const draftData = JSON.parse(draft);
          if (hasCompleteEnemyRoster(draftData)) {
            data = draftData;
          } else {
            localStorage.setItem(EDITOR_DRAFT_PREFIX + "legacy-enemies-backup", draft);
            localStorage.removeItem(draftKey);
          }
        }
      } catch {}
      if (Array.isArray(data.enemies)) enemyList = data.enemies.filter(enemy => enemy && enemy.id && enemy.letter && enemy.name);
    }
  } catch {
    // Keep the built-in Period Pistol if the editable lists cannot load.
  }
}
async function loadCatalogData() {
  const files = [
    ["../data/enemies.json", "enemies", "enemies"],
    ["../data/weapons.json", "weapons", "weapons"],
    ["../data/pickups.json", "pickups", "pickups"],
    ["../data/obstacles.json", "obstacles", "obstacles"],
    ["../data/spawn-patterns.json", "patterns", "patterns"],
    ["../data/word-sets/default.json", "wordSet", null],
    ["../data/settings.json", "settings", null],
    ["../data/controls.json", "controls", null],
    ["../data/menu.json", "menu", null],
    ["../data/feeds/default.json", "feed", null]
  ];
  const results = await Promise.all(files.map(async ([path]) => {
    try {
      const response = await fetch(new URL(path, import.meta.url));
      return response.ok ? await response.json() : null;
    } catch { return null; }
  }));
  files.forEach(([, key, listKey], index) => {
    const data = results[index];
    if (!data) return;
    catalogData[key] = listKey ? (Array.isArray(data[listKey]) ? data[listKey] : []) : data;
  });
  numberHazardList = catalogData.obstacles.filter(item => item?.type === "number");
  obstacleSetList = catalogData.obstacles.filter(item => item?.type === "set");
  renderCatalog();
}

async function loadStartupContent() {
  await Promise.all([loadCombatData(), loadCatalogData()]);
  catalogData.enemies = enemyList;
  catalogData.weapons = weaponList;
  catalogData.pickups = pickupList;
  numberHazardList = (catalogData.obstacles || []).filter(item => item?.type === "number");
  obstacleSetList = (catalogData.obstacles || []).filter(item => item?.type === "set");
  renderCatalog();
}

function addCatalogSection(title, items, formatItem) {
  const section = document.createElement("section");
  section.className = "catalog-section";
  const heading = document.createElement("h3");
  heading.textContent = title + " · " + items.length;
  const list = document.createElement("ul");
  list.className = "catalog-list";
  items.forEach(item => {
    const row = document.createElement("li");
    const name = document.createElement("strong");
    const stats = document.createElement("small");
    name.textContent = item.name || item.letter || item.id || "Unnamed";
    stats.textContent = formatItem(item);
    row.append(name, stats);
    list.append(row);
  });
  section.append(heading, list);
  catalogContent.append(section);
}

function addCatalogWordGroup(name, words) {
  const cleanWords = Array.isArray(words) ? words.filter(word => typeof word === "string" && word.trim()) : [];
  const section = document.createElement("section");
  section.className = "catalog-section";
  const heading = document.createElement("h3");
  heading.textContent = name.toUpperCase() + " · " + cleanWords.length;
  const content = document.createElement("p");
  content.className = "catalog-words";
  content.textContent = cleanWords.join(" · ");
  section.append(heading, content);
  catalogContent.append(section);
}

function renderCatalog() {
  if (!catalogContent) return;
  catalogContent.replaceChildren();
  const enemies = catalogData.enemies || [];
  const weapons = catalogData.weapons || [];
  const pickups = catalogData.pickups || [];
  const obstacles = catalogData.obstacles || [];
  const patterns = catalogData.patterns || [];
  catalogSummary.textContent = `${enemies.length} ENEMIES · ${weapons.length} WEAPONS · ${pickups.length} PICKUPS · ${obstacles.length} OBSTACLES · ${patterns.length} PATTERNS`;

  addCatalogSection("A–Z ENEMIES", enemies, enemy =>
    `LETTER ${enemy.letter || "?"} · HP ${enemy.health ?? "?"} · SPD ${enemy.speed ?? "?"} · TOUCH ${enemy.contactDamage ?? "?"} · PTS ${enemy.score ?? "?"} · ${String(enemy.behavior || "drift").toUpperCase()} · ${enemy.shoots ? `FIRE ${enemy.fireRate}s / ${enemy.bulletType} ${enemy.bulletDamage}dmg` : "NO FIRE"} · COLOR ${enemy.enemyColor || "?"}`);
  addCatalogSection("WEAPONS", weapons, weapon =>
    `DMG ${weapon.damage ?? "?"} · ${weapon.shotsPerSecond ?? "?"}/s · SPEED ${weapon.projectileSpeed ?? "BEAM"} · SPREAD ${weapon.spreadDegrees ?? 0}° · SHOTS ${weapon.projectilesPerShot ?? 1} · ${String(weapon.pattern || "single").toUpperCase()}`);
  addCatalogSection("PICKUPS", pickups, pickup =>
    `${pickup.glyph || "?"} · ${pickup.effect || "?"} × ${pickup.amount ?? 1} · ${pickup.durationSeconds || 0}s · WEIGHT ${pickup.weight ?? "?"} · ${pickup.description || ""}`);
  addCatalogSection("OBSTACLES & EQUATIONS", obstacles, obstacle => obstacle.type === "number"
    ? `${obstacle.equation || obstacle.name} · ${obstacle.behavior} · RANGE ${obstacle.triggerRadius}px · SUCTION ${obstacle.suctionSpeed ?? 0} · HOLD ${obstacle.holdSeconds ?? 0}s · SLAM ${obstacle.slamSpeed ?? 0} · LAUNCH ${obstacle.launchSpeed ?? 0}`
    : obstacle.type === "set"
      ? `${obstacle.formation} · ${obstacle.rows} ROWS · SPACING ${obstacle.rowSpacing}px · GAP ${Math.round((obstacle.gapFraction || 0.28) * 100)}% · ${obstacle.description || ""}`
      : obstacle.type === "block"
        ? `FALL SPEED ${obstacle.fallSpeed}px/s · GRAVITY ${obstacle.gravity}px/s² · SLIDE ${obstacle.slideSpeed}px/s`
        : `${obstacle.wordSet || "wall"} · ${obstacle.collision || "solid"} · HP ${obstacle.health ?? 0} · BREAKS INTO LETTERS ${obstacle.breaksIntoLetters ? "YES" : "NO"}`);
  addCatalogSection("SPAWN PATTERNS", patterns, pattern =>
    `${pattern.description || ""} · ${(pattern.entries || []).map(entry => `${entry.count || 1}× ${entry.type}:${entry.id} (gap ${entry.spacing || 0})`).join(" · ")}`);

  const wordSet = catalogData.wordSet || {};
  addCatalogWordGroup("BACKGROUND WORDS", wordSet.background);
  addCatalogWordGroup("WALL WORDS", wordSet.walls);
  addCatalogWordGroup("DOOR WORDS", wordSet.doors);
  addCatalogWordGroup("ENEMY WORDS", wordSet.enemies);
  addCatalogWordGroup("PICKUP WORDS", wordSet.pickups);
  addCatalogWordGroup("DECORATION WORDS", wordSet.decorations);
  addCatalogWordGroup("HORIZONTAL WALL FEED", wordSet.horizontalWalls);

  const settings = catalogData.settings || {};
  const world = settings.world || {};
  const room = settings.room || {};
  const death = settings.wallOfDeath || {};
  const control = catalogData.controls || {};
  const keyboard = control.keyboard || {};
  const gamepad = control.gamepad || {};
  addCatalogSection("ROOM & INPUT", [{
    name: "WORLD",
    stats: `SCROLL ${world.scrollSpeed ?? "?"}px/s · SPAWN ${world.spawnInterval ?? "?"}s · WALL WIDTH ${room.wallWidth ?? "?"}px · DEATH WALL ${death.height ?? "?"}px · KEYS ${[...(keyboard.moveUp || []), ...(keyboard.moveDown || []), ...(keyboard.moveLeft || []), ...(keyboard.moveRight || [])].join("/")} · PAD LS ${gamepad.moveAxes?.x ?? 0}/${gamepad.moveAxes?.y ?? 1} RS ${gamepad.aimAxes?.x ?? 2}/${gamepad.aimAxes?.y ?? 3}`
  }], item => item.stats);
  const feed = catalogData.feed || {};
  addCatalogSection("FEED FILES", Object.entries(feed.files || {}).map(([name, path]) => ({ name, path })), item => item.path);
  addCatalogSection("MENU COPY", Object.entries(catalogData.menu || {}).map(([name, value]) => ({ name, value })), item => typeof item.value === "string" ? item.value : JSON.stringify(item.value));
}

function refreshCatalogFromEditor() {
  let data;
  try { data = JSON.parse(editorText.value); } catch { return; }
  if (editorPath.endsWith("/enemies.json")) catalogData.enemies = data.enemies || [];
  else if (editorPath.endsWith("/weapons.json")) catalogData.weapons = data.weapons || [];
  else if (editorPath.endsWith("/pickups.json")) catalogData.pickups = data.pickups || [];
  else if (editorPath.endsWith("/obstacles.json")) {
    catalogData.obstacles = data.obstacles || [];
    numberHazardList = catalogData.obstacles.filter(item => item?.type === "number");
    obstacleSetList = catalogData.obstacles.filter(item => item?.type === "set");
  }
  else if (editorPath.endsWith("/spawn-patterns.json")) catalogData.patterns = data.patterns || [];
  else if (editorPath.includes("/word-sets/")) catalogData.wordSet = data;
  else if (editorPath.endsWith("/settings.json")) catalogData.settings = data;
  else if (editorPath.endsWith("/controls.json")) catalogData.controls = data;
  else if (editorPath.endsWith("/menu.json")) catalogData.menu = data;
  else if (editorPath.endsWith("/feeds/default.json")) catalogData.feed = data;
  renderCatalog();
}

function getWeapon(id = state.weaponId) {
  return weaponList.find(weapon => weapon.id === id) || weaponList[0];
}
function cycleWeapon(direction) {
  const unlocked = weaponList.filter(weapon => state.unlockedWeapons.includes(weapon.id));
  if (unlocked.length < 2) {
    state.pickupMessage = "Find a weapon page to unlock more weapons";
    state.pickupMessageTime = 2;
    return;
  }
  let index = unlocked.findIndex(weapon => weapon.id === state.weaponId);
  index = (index + direction + unlocked.length) % unlocked.length;
  state.weaponId = unlocked[index].id;
  state.pickupMessage = unlocked[index].name;
  state.pickupMessageTime = 1.8;
}
function effectValue(effect, fallback = 1) {
  return state.effects.filter(item => item.effect === effect).reduce((value, item) => value * item.amount, fallback);
}
function effectTotal(effect) {
  return state.effects.filter(item => item.effect === effect).reduce((sum, item) => sum + Number(item.amount || 0), 0);
}
function sayPickup(message) {
  state.pickupMessage = message;
  state.pickupMessageTime = 2.2;
}
function collectPickup(pickup) {
  const item = pickup.data;
  state.score += 50;
  if (item.effect === "bonusDistance") state.score += Math.floor(Number(item.amount || 0) / 10);
  if (item.effect === "restoreHealth") {
    const before = state.health;
    state.health = Math.min(state.maxHealth, state.health + item.amount);
    sayPickup(state.health > before ? item.name + " +" + (state.health - before) + " HP" : "HEALTH FULL");
  } else if (item.effect === "addShield") {
    state.shields += item.amount;
    sayPickup(item.name + " +" + item.amount);
  } else if (["modifyFireRate", "extraProjectiles", "slowScroll", "speedBoost", "radialFire", "wordWall", "clones"].includes(item.effect)) {
    state.effects.push({
      effect: item.effect,
      amount: Number(item.amount) || 1,
      remaining: Math.max(0.1, Number(item.durationSeconds) || 0),
      intervalSeconds: Number(item.intervalSeconds) || 0.85,
      cooldown: 0
    });
    sayPickup(item.name + " · " + item.durationSeconds + "s");
  } else if (item.effect === "grantWeapon") {
    const locked = weaponList.filter(weapon => !state.unlockedWeapons.includes(weapon.id));
    const options = locked.length ? locked : weaponList.filter(weapon => weapon.id !== state.weaponId);
    const weapon = item.amount === "random" ? options[Math.floor(Math.random() * options.length)] : weaponList.find(entry => entry.id === item.amount);
    if (weapon) {
      if (!state.unlockedWeapons.includes(weapon.id)) state.unlockedWeapons.push(weapon.id);
      state.weaponId = weapon.id;
      sayPickup((locked.length ? "UNLOCKED · " : "WEAPON DROP · ") + weapon.name);
    } else {
      state.shields += 1;
      sayPickup("ARSENAL COMPLETE · +1 SHIELD");
    }
  } else if (item.effect === "increaseMaxHealth") {
    state.maxHealth += item.amount;
    state.health = Math.min(state.maxHealth, state.health + item.amount);
    sayPickup("MAX HP +" + item.amount);
  } else if (item.effect === "bonusDistance") {
    state.world.distance += item.amount;
    sayPickup("PAGE SKIP · +" + Math.round(item.amount / 10) + "m");
  } else {
    sayPickup(item.name || "PICKUP");
  }
}
function playerFormation(width, height) {
  const copies = Math.min(2, Math.max(0, Math.floor(effectTotal("clones"))));
  const centerX = width * state.player.x;
  const centerY = height * state.player.y;
  const offsets = copies === 2 ? [-24, 0, 24] : copies === 1 ? [-20, 20] : [0];
  return offsets.map(offset => ({ x: centerX + offset, y: centerY }));
}

function fireProjectileAt(weapon, x, y, angle, speed = Number(weapon.projectileSpeed) || 500) {
  state.projectiles.push({
    x: x + Math.cos(angle) * 14,
    y: y + Math.sin(angle) * 14,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle,
    glyph: weapon.projectileGlyph || ".", damage: Number(weapon.damage) || 1
  });
}

function shootWeapon(weapon, aim, width, height) {
  const baseAngle = Math.atan2(aim.y, aim.x);
  const count = Math.max(1, Number(weapon.projectilesPerShot) || 1) + Math.max(0, Math.floor(effectTotal("extraProjectiles")));
  const spread = (Number(weapon.spreadDegrees) || 0) * Math.PI / 180;
  for (const origin of playerFormation(width, height)) {
    if (weapon.pattern === "beam") {
      state.beams.push({ x: origin.x, y: origin.y, angle: baseAngle, length: weapon.beamLength || 400, duration: weapon.beamDuration || 0.12, remaining: weapon.beamDuration || 0.12, damage: Math.max(1, Number(weapon.damage) || 1), hitEnemies: [] });
      continue;
    }
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (count === 1 ? 0 : spread * (i / (count - 1) - 0.5));
      fireProjectileAt(weapon, origin.x, origin.y, angle);
    }
  }
}

function shootRadialBurst(weapon, width, height, count) {
  const bullets = Math.max(4, Math.min(24, Math.floor(Number(count) || 12)));
  const speed = Number(weapon.projectileSpeed) || 500;
  for (const origin of playerFormation(width, height)) {
    if (weapon.pattern === "beam") {
      for (let i = 0; i < bullets; i += 1) {
        const angle = Math.PI * 2 * i / bullets;
        state.beams.push({ x: origin.x, y: origin.y, angle, length: weapon.beamLength || 400, duration: weapon.beamDuration || 0.12, remaining: weapon.beamDuration || 0.12, damage: Math.max(1, Number(weapon.damage) || 1), hitEnemies: [] });
      }
    } else {
      for (let i = 0; i < bullets; i += 1) fireProjectileAt(weapon, origin.x, origin.y, Math.PI * 2 * i / bullets, speed);
    }
  }
}
async function loadControlMap() {
  try {
    const response = await fetch(new URL("../data/controls.json", import.meta.url));
    if (!response.ok) return;
    const config = await response.json();
    Object.assign(controlMap.keyboard, config.keyboard || {});
    Object.assign(controlMap.gamepad, config.gamepad || {});
    Object.assign(controlMap.touch, config.touch || {});
  } catch {}
}
function applyControlScheme() {
  app.classList.toggle("touch-mode", state.controlScheme === "touch");
  touchSticks.hidden = state.controlScheme !== "touch" && !matchMedia("(pointer: coarse)").matches;
}
function deadzone(value, zone) {
  return Math.abs(value) < zone ? 0 : Math.sign(value) * (Math.abs(value) - zone) / (1 - zone);
}
function pollGamepad() {
  if (!navigator.getGamepads) {
    input.pad = null;
    gamepadStatus.textContent = uiText.gamepadUnsupported;
    return;
  }
  input.pad = Array.from(navigator.getGamepads() || []).find(p => p && p.connected) || null;
  const pad = input.pad, cfg = controlMap.gamepad;
  const status = pad ? uiText.gamepadConnected.replace("{name}", pad.id || "Controller") : uiText.noGamepad;
  if (status !== lastGamepadMessage) { lastGamepadMessage = status; gamepadStatus.textContent = status; }
  if (!pad) { input.move = {x:0,y:0}; input.aim = {x:0,y:0}; return; }
  const ax = i => Number.isFinite(pad.axes[i]) ? pad.axes[i] : 0;
  const down = i => Boolean(pad.buttons[i]?.pressed);
  input.move = {x:deadzone(ax(cfg.moveAxes.x),cfg.deadzone)+Number(down(cfg.dpad.right))-Number(down(cfg.dpad.left)),y:deadzone(ax(cfg.moveAxes.y),cfg.deadzone)+Number(down(cfg.dpad.down))-Number(down(cfg.dpad.up))};
  input.aim = {x:deadzone(ax(cfg.aimAxes.x),cfg.deadzone),y:deadzone(ax(cfg.aimAxes.y),cfg.deadzone)};
}
function handleGamepadUi(dt) {
  const pad = input.pad;
  if (!pad) {
    gamepadUiState.startDown = false;
    gamepadUiState.selectDown = false;
    gamepadUiState.backDown = false;
    gamepadUiState.catalogDown = false;
    gamepadUiState.activateDown = false;
    gamepadUiState.direction = "";
    gamepadUiState.repeatIn = 0;
    return;
  }
  const cfg = controlMap.gamepad;
  const down = index => Number.isInteger(index) && Boolean(pad.buttons[index]?.pressed);
  const start = down(cfg.menuButton ?? 9);
  const select = down(cfg.editorButton ?? 8);
  const back = down(cfg.backButton ?? 1);
  const catalog = down(cfg.catalogButton ?? 4);
  const activate = down(cfg.activateButton ?? 0);

  if (catalog && !gamepadUiState.catalogDown && window.matchMedia("(min-width: 901px)").matches) toggleCatalogPanel();
  if (start && !gamepadUiState.startDown) {
    if (dialog.open) resumeRun();
    else openSettings();
  }
  if (select && !gamepadUiState.selectDown) {
    if (!editorPanel.hidden) toggleEditor(false);
    else toggleEditor(true);
  }
  if (back && !gamepadUiState.backDown) {
    if (!editorPanel.hidden) toggleEditor(false);
    else if (dialog.open) resumeRun();
  }

  const root = dialog.open ? dialog : (!editorPanel.hidden ? editorPanel : null);
  if (root) {
    const deadzoneValue = cfg.deadzone ?? 0.18;
    const axis = index => Number.isFinite(pad.axes[index]) ? pad.axes[index] : 0;
    const horizontal = Number(down(cfg.dpad?.right ?? 15)) - Number(down(cfg.dpad?.left ?? 14)) + deadzone(axis(cfg.moveAxes?.x ?? 0), deadzoneValue);
    const vertical = Number(down(cfg.dpad?.down ?? 13)) - Number(down(cfg.dpad?.up ?? 12)) + deadzone(axis(cfg.moveAxes?.y ?? 1), deadzoneValue);
    let direction = "";
    if (Math.abs(vertical) > 0.5) direction = vertical > 0 ? "down" : "up";
    else if (Math.abs(horizontal) > 0.5) direction = horizontal > 0 ? "right" : "left";

    if (direction) {
      if (direction !== gamepadUiState.direction || gamepadUiState.repeatIn <= 0) {
        const controls = Array.from(root.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'))
          .filter(element => element.getClientRects().length > 0);
        if (document.activeElement?.tagName === "SELECT") {
          const select = document.activeElement;
          const step = direction === "down" || direction === "right" ? 1 : -1;
          select.selectedIndex = (select.selectedIndex + step + select.options.length) % select.options.length;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (controls.length) {
          let index = controls.indexOf(document.activeElement);
          if (index < 0) index = 0;
          const step = direction === "down" || direction === "right" ? 1 : -1;
          controls[(index + step + controls.length) % controls.length].focus();
        }
        gamepadUiState.repeatIn = 0.28;
      } else {
        gamepadUiState.repeatIn -= dt;
      }
    }
    gamepadUiState.direction = direction;

    if (activate && !gamepadUiState.activateDown) {
      const target = document.activeElement;
      if (target && root.contains(target) && target.matches("button, input[type=checkbox], input[type=radio], select, [role=button]")) target.click();
    }
  } else {
    gamepadUiState.direction = "";
    gamepadUiState.repeatIn = 0;
  }

  gamepadUiState.startDown = start;
  gamepadUiState.selectDown = select;
  gamepadUiState.backDown = back;
  gamepadUiState.catalogDown = catalog;
  gamepadUiState.activateDown = activate;
}
function keyAxis(negative, positive) {
  return Number(positive.some(k => state.keys.has(k))) - Number(negative.some(k => state.keys.has(k)));
}
function readControls() {
  pollGamepad();
  const scheme=state.controlScheme, kb=controlMap.keyboard;
  const useK=scheme==="auto"||scheme==="keyboard", useG=scheme==="auto"||scheme==="gamepad", useT=scheme==="auto"||scheme==="touch";
  let move={x:(useK?keyAxis(kb.moveLeft,kb.moveRight):0)+(useG?input.move.x:0)+(useT?input.touchMove.x:0),y:(useK?keyAxis(kb.moveUp,kb.moveDown):0)+(useG?input.move.y:0)+(useT?input.touchMove.y:0)};
  const m=Math.hypot(move.x,move.y); if(m>1) move={x:move.x/m,y:move.y/m};
  const keyAim=useK?{x:keyAxis(kb.aimLeft,kb.aimRight),y:keyAxis(kb.aimUp,kb.aimDown)}:{x:0,y:0};
  const aim=[useT?input.touchAim:null,useG?input.aim:null,keyAim,useK?input.mouseAim:null].find(v=>v&&Math.hypot(v.x,v.y)>.15)||{x:0,y:-1};
  if (useG && input.pad) {
    const down = index => Boolean(input.pad.buttons[index]?.pressed);
    const prev = (controlMap.gamepad.weaponPrevButtons || [4]).some(down);
    const next = (controlMap.gamepad.weaponNextButtons || [5]).some(down);
    if (prev && !state.gamepadPrevDown) cycleWeapon(-1);
    if (next && !state.gamepadNextDown) cycleWeapon(1);
    state.gamepadPrevDown = prev;
    state.gamepadNextDown = next;
  } else {
    state.gamepadPrevDown = false;
    state.gamepadNextDown = false;
  }
  const rightStickFiring = useG && input.pad && controlMap.gamepad.rightStickFires !== false && Math.hypot(input.aim.x, input.aim.y) > (controlMap.gamepad.rightStickFireThreshold ?? 0.24);
  const fire=(useK&&(kb.fire||[]).some(k=>state.keys.has(k)|| (k===" "&&state.keys.has(" "))))||(useK&&input.mouseFire)||(useG&&input.pad&&(controlMap.gamepad.fireButtons||[]).some(i=>input.pad.buttons[i]?.pressed))||rightStickFiring||(useT&&input.touchFire&&controlMap.touch.fireWhileRightStickHeld);
  return {move,aim,fire};
}
function setStick(stick, knob, point) {
  const r=Math.min(stick.clientWidth,stick.clientHeight)*.34, box=stick.getBoundingClientRect();
  let x=point.clientX-(box.left+box.width/2), y=point.clientY-(box.top+box.height/2), d=Math.hypot(x,y), scale=d>r?r/d:1;
  x=x*scale/r; y=y*scale/r;
  if(Math.hypot(x,y)<(controlMap.touch.deadzone||.12)) x=y=0;
  knob.style.transform="translate("+x*r+"px,"+y*r+"px)";
  return {x,y};
}
function bindStick(stick,knob,type) {
  let active=null;
  const release=e=>{if(active!==null&&e.pointerId!==active)return; active=null; stick.classList.remove("is-active"); knob.style.transform="translate(0,0)"; if(type==="move")input.touchMove={x:0,y:0};else{input.touchAim={x:0,y:0};input.touchFire=false;}};
  stick.addEventListener("pointerdown",e=>{if(!["auto","touch"].includes(state.controlScheme))return;e.preventDefault();active=e.pointerId;stick.setPointerCapture(active);stick.classList.add("is-active");const v=setStick(stick,knob,e);if(type==="move")input.touchMove=v;else{input.touchAim=v;input.touchFire=true;}});
  stick.addEventListener("pointermove",e=>{if(e.pointerId!==active)return;const v=setStick(stick,knob,e);if(type==="move")input.touchMove=v;else{input.touchAim=v;input.touchFire=true;}});
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>stick.addEventListener(t,release));
}
function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  draw();
}

function colors() {
  // Paper: the original ink-on-paper look (now the INVERT option).
  if (state.theme === "paper") {
    return { ...palette, wall: "#e9e2d2", stone: "#77736a", grid: "transparent", hot: "#c0392b",
      teal: "#278da5", red: "#d84b3e", shot: palette.accent, wallGlyph: palette.ink, glow: false };
  }
  // Neon: the glowing terminal look (default), matching BLOOM SYSTEM.
  return { paper: "#05070b", ink: "#a8f6ff", accent: "#ff4bcb", wall: "#0a1118", stone: "#6f8a99",
    grid: "rgba(0, 229, 255, 0.05)", hot: "#ffd93d", teal: "#00f6d6", red: "#ff5a6a",
    shot: "#ffd93d", wallGlyph: "#2f6a78", glow: true };
}

function drawScrollingSidewall(x, wallWidth, glyphs, color, side) {
  const { height } = canvas.getBoundingClientRect();
  const spacing = roomSettings.glyphSpacing;
  const phase = state.world.scrollOffset % spacing;
  context.fillStyle = color.wall;                       // wall background strip
  context.fillRect(x, 0, wallWidth, height);
  context.fillStyle = color.wallGlyph;                  // dim glyph color
  context.textAlign = "center";
  setCanvasFont(13, "bold");
  const rows = Math.ceil(height / spacing) + 2;
  for (let row = 0; row < rows; row += 1) {
    const y = -spacing + phase + row * spacing;
    const streamRow = Math.floor(state.world.scrollOffset / spacing) + row - 1;
    for (let column = 0; column < 3; column += 1) {
      const index = ((streamRow + column * (side === "left" ? 5 : 9)) % glyphs.length + glyphs.length) % glyphs.length;
      const character = glyphs[index];
      const xPosition = x + wallWidth * ((column + 0.5) / 3);
      // Every so often a glyph lights up bright, like a data stream.
      const lit = color.glow && ((streamRow * 7 + column * 13) % 11 === 0);
      context.fillStyle = lit ? color.teal : color.wallGlyph;
      context.globalAlpha = lit ? 0.95 : 0.48 + ((streamRow + column) % 3) * 0.16;
      context.fillText(character, xPosition, y);
    }
  }
  context.globalAlpha = 1;
  context.strokeStyle = color.glow ? color.teal : color.ink;   // inner edge line
  context.globalAlpha = color.glow ? 0.4 : 0.55;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(side === "left" ? x + wallWidth : x, 0);
  context.lineTo(side === "left" ? x + wallWidth : x, height);
  context.stroke();
  context.globalAlpha = 1;
}

function getDeathWallHeight() {
  return deathWall.getBoundingClientRect().height || roomSettings.deathWallHeight;
}

function getPlayerStartY() {
  const height = Math.max(1, canvas.getBoundingClientRect().height);
  return Math.max(0.18, Math.min(0.72, (height - getDeathWallHeight() - 28) / height));
}

function applyDeathWallSettings() {
  stage.style.setProperty("--death-wall-height", roomSettings.deathWallHeight + "px");
  stage.style.setProperty("--death-wall-reserved-height", getDeathWallHeight() + "px");
  deathWallLine1.textContent = roomSettings.deathWallLines[0] || "WALL OF DEATH";
  deathWallLine2.textContent = roomSettings.deathWallLines[1] || "NO ESCAPE";
}

function renderHud() {
  healthMeter.max = Math.max(1, state.maxHealth);
  healthMeter.value = Math.max(0, state.health);
  healthText.textContent = `${Math.max(0, Math.ceil(state.health))}/${Math.max(1, state.maxHealth)}`;
  livesReadout.textContent = `LIVES ${"●".repeat(Math.max(0, state.lives))}${"○".repeat(Math.max(0, state.maxLives - state.lives))}`;
  armorReadout.textContent = `ARMOR ${Math.max(0, Math.floor(state.shields))}`;
  scoreReadout.textContent = `PTS ${Math.floor(state.score).toLocaleString()}`;
  depthReadout.textContent = `DEPTH ${Math.floor(state.world.distance / 10)} m · PG ${state.level}`;
  pickupMessageReadout.textContent = state.gameOver ? "ERASED · FIRE / R / TAP" : !state.started ? "PRESS FIRE TO START" : state.pickupMessageTime > 0 ? state.pickupMessage : "";
  const weapon = getWeapon();
  weaponReadout.textContent = `${weapon.projectileGlyph || "."} ${weapon.name.toUpperCase()}`;
  catalogRunStatus.textContent = `HP ${Math.ceil(state.health)}/${state.maxHealth} · LIVES ${state.lives} · ARMOR ${state.shields} · PTS ${Math.floor(state.score).toLocaleString()} · ${Math.floor(state.world.distance / 10)}m`;
}

function createEnemyExplosion(enemy) {
  const count = Math.max(2, Math.min(32, Number(enemy.data.explosionCount) || 8));
  const duration = Math.max(0.1, Number(enemy.data.explosionDuration) || 0.55);
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i / count) + Math.random() * 0.24;
    const speed = 35 + Math.random() * 90;
    state.explosions.push({
      x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      glyph: enemy.data.explosionGlyph || enemy.letter,
      color: enemy.data.explosionColor || enemy.data.enemyColor || "#ffffff",
      life: duration, duration
    });
  }
}

function defeatEnemy(enemy) {
  createEnemyExplosion(enemy);                                         // letter burst
  registerKill(enemy.x, enemy.y, Number(enemy.data.score) || 0, enemy.data.enemyColor);
  sayPickup("DEFEATED · " + enemy.data.name);
}

function damagePlayer(amount) {
  if (state.effects.some(effect => effect.effect === "wordWall")) return;   // WALL TEXT shield
  if (state.invuln > 0) return;                                              // still blinking from the last hit
  const damage = Math.max(0, Number(amount) || 0);
  if (damage === 0) return;
  state.invuln = 1.0;                                                        // short mercy window
  state.combo = 0;                                                           // getting hit breaks the chain
  if (state.shields > 0) {
    state.shields -= 1;
    addShake(5);
    sfx.play("shield");
    return;
  }
  state.health = Math.max(0, state.health - damage);
  state.hurtFlash = 0.35;
  addShake(10);
  sfx.play("hurt");
  if (state.health <= 0) loseLife();
}

function fireEnemyBullet(enemy, playerX, playerY) {
  const dx = playerX - enemy.x, dy = playerY - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const type = enemy.data.bulletType || "letter";
  const glyph = type === "dot" ? (enemy.data.bulletGlyph || "·")
    : type === "letter" ? enemy.letter
    : type === "word" ? (enemy.data.bulletGlyph || enemy.letter + enemy.letter)
    : type === "ring" ? "○"
    : type === "slash" ? "/"
    : (enemy.data.bulletGlyph || "·");
  state.enemyBullets.push({
    x: enemy.x, y: enemy.y, vx: dx / distance * (Number(enemy.data.bulletSpeed) || 180),
    vy: dy / distance * (Number(enemy.data.bulletSpeed) || 180),
    glyph, type, damage: Number(enemy.data.bulletDamage) || 1,
    color: enemy.data.bulletColor || enemy.data.enemyColor || "#ffffff",
    angle: Math.atan2(dy, dx)
  });
  sfx.play("enemyShot");
}

function updateEnemySystem(dt, width, height, scrollDelta) {
  const minX = roomSettings.wallWidth + 16;
  const maxX = Math.max(minX + 1, width - roomSettings.wallWidth - 16);
  const playerX = width * state.player.x;
  const playerY = height * state.player.y;

  state.enemies = state.enemies.filter(enemy => {
    const def = enemy.data;
    const speed = Math.max(0, Number(def.speed) || 0);
    enemy.age += dt;
    enemy.phase += dt;
    enemy.y += scrollDelta;
    const dx = playerX - enemy.x, dy = playerY - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (def.behavior === "charge" && Math.sin(enemy.phase * 1.3) > 0.25) {
      enemy.x += dx / distance * speed * 1.7 * dt;
      enemy.y += dy / distance * speed * 1.7 * dt;
    } else if (def.behavior === "chase") {
      enemy.x += dx / distance * speed * dt;
      enemy.y += dy / distance * speed * dt;
    } else if (def.behavior === "strafe") {
      enemy.x = enemy.originX + Math.sin(enemy.phase * 1.4) * Math.min(90, speed * 1.3);
    } else if (def.behavior === "weave") {
      enemy.x += Math.sin(enemy.phase * 2.7) * speed * dt;
      enemy.y += Math.cos(enemy.phase * 1.8) * speed * 0.18 * dt;
    } else if (def.behavior === "bounce") {
      enemy.x += enemy.direction * speed * dt;
      if (enemy.x < minX || enemy.x > maxX) enemy.direction *= -1;
    } else if (def.behavior === "swoop") {
      enemy.x += dx / distance * speed * 0.65 * dt;
      enemy.y += Math.sin(enemy.phase * 2) * speed * 0.35 * dt;
    } else if (def.behavior === "orbit") {
      enemy.angle += dt * Math.max(0.6, speed / 45);
      enemy.x = playerX + Math.cos(enemy.angle) * 68;
      enemy.y = playerY + Math.sin(enemy.angle) * 48;
    } else if (def.behavior === "stalk") {
      enemy.x += Math.sign(dx) * speed * 0.45 * dt;
      enemy.y += Math.sign(dy) * speed * 0.22 * dt;
    } else {
      enemy.x += Math.sin(enemy.phase + enemy.phase * 0.35) * speed * 0.28 * dt;
    }

    enemy.x = Math.max(minX, Math.min(maxX, enemy.x));
    enemy.fireCooldown -= dt;
    if (def.shoots && enemy.fireCooldown <= 0) {
      fireEnemyBullet(enemy, playerX, playerY);
      enemy.fireCooldown = Math.max(0.25, Number(def.fireRate) || 1.6);
    }
    if (Math.hypot(enemy.x - playerX, enemy.y - playerY) < 22) {
      if (state.effects.some(effect => effect.effect === "wordWall")) {
        defeatEnemy(enemy);
      } else {
        damagePlayer(def.contactDamage);
        createEnemyExplosion(enemy);
        sayPickup("HIT BY · " + def.name);
      }
      return false;
    }
    return enemy.y < state.world.deathWallY + 30;
  });

  state.enemyBullets = state.enemyBullets.filter(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    const protectedByWordWall = state.effects.some(effect => effect.effect === "wordWall") &&
      Math.abs(bullet.x - playerX) < 30 && Math.abs(bullet.y - playerY) < 26;
    if (protectedByWordWall) return false;
    if (solidAt(bullet.x, bullet.y)) { spawnSparks(bullet.x, bullet.y, bullet.color, 2); return false; } // walls are cover
    if (Math.hypot(bullet.x - playerX, bullet.y - playerY) < 14) {
      damagePlayer(bullet.damage);
      sayPickup("HIT BY · ENEMY FIRE");
      return false;
    }
    return bullet.x > -24 && bullet.x < width + 24 && bullet.y > -24 && bullet.y < height + 24;
  });

  state.explosions = state.explosions.filter(particle => {
    particle.vy += (particle.g || 0) * dt;          // letter debris falls
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    return particle.life > 0;
  });
}

function updatePlayerShots(dt, width, height) {
  const remaining = [];
  for (const shot of state.projectiles) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.angle = Math.atan2(shot.vy, shot.vx);
    const damage = Math.max(1, Number(shot.damage) || 1);
    // 1) Did it hit an enemy?
    const targetIndex = state.enemies.findIndex(enemy => Math.hypot(enemy.x - shot.x, enemy.y - shot.y) < 18);
    if (targetIndex >= 0) {
      const target = state.enemies[targetIndex];
      target.health -= damage;
      target.flash = 0.09;                                              // white hit flash
      spawnSparks(shot.x, shot.y, target.data.enemyColor || "#ffffff", 2);
      if (target.health <= 0) {
        state.enemies.splice(targetIndex, 1);
        defeatEnemy(target);
      } else {
        sfx.play("hit");
      }
      continue;
    }
    // 2) Did it hit a wall? Words chip apart; gates just spark.
    const wall = solidAt(shot.x, shot.y);
    if (wall) {
      damageObstacle(wall, damage, shot.x, shot.y);
      continue;
    }
    // 3) Still on screen? Keep it flying.
    if (shot.x >= -20 && shot.x <= width + 20 && shot.y >= -20 && shot.y <= height + 20) remaining.push(shot);
  }
  state.projectiles = remaining;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function updateBeamHits() {
  for (const beam of state.beams) {
    if (!Array.isArray(beam.hitEnemies)) beam.hitEnemies = [];
    // The first frame of a beam also cuts through any walls along its line.
    if (!Array.isArray(beam.hitObstacles)) {
      beam.hitObstacles = [];
      for (let d = 10; d < beam.length; d += 10) {
        const bx = beam.x + Math.cos(beam.angle) * d, by = beam.y + Math.sin(beam.angle) * d;
        const wall = solidAt(bx, by);
        if (wall && !beam.hitObstacles.includes(wall)) {
          beam.hitObstacles.push(wall);
          damageObstacle(wall, Math.max(1, Number(beam.damage) || 1) * 2, bx, by);
        }
      }
    }
    const endX = beam.x + Math.cos(beam.angle) * beam.length;
    const endY = beam.y + Math.sin(beam.angle) * beam.length;
    state.enemies = state.enemies.filter(enemy => {
      if (beam.hitEnemies.includes(enemy) || distanceToSegment(enemy.x, enemy.y, beam.x, beam.y, endX, endY) > 17) return true;
      beam.hitEnemies.push(enemy);
      enemy.health -= Math.max(1, Number(beam.damage) || 1);
      if (enemy.health <= 0) {
        defeatEnemy(enemy);
        return false;
      }
      return true;
    });
  }
}

function loseLife() {
  state.lives = Math.max(0, state.lives - 1);
  state.enemyBullets = [];
  state.combo = 0;
  addShake(16);
  state.hurtFlash = 0.5;
  if (state.lives === 0) {
    state.gameOver = true;
    state.paused = true;
    state.overTime = 0;
    state.keys.clear();
    saveBest();
    sfx.play("over");
    return;
  }
  sfx.play("life");
  state.player = { x: 0.5, y: getPlayerStartY() };
  state.health = state.maxHealth;
  state.invuln = 2;                                                    // safe respawn
  state.projectiles = [];
  state.enemyBullets = [];
  state.pickupMessage = `LIFE LOST · ${state.lives} LEFT`;
  state.pickupMessageTime = 2.4;
}

function draw() {
  renderHud();
  const { width, height } = canvas.getBoundingClientRect();
  const color = colors();
  context.clearRect(0, 0, width, height);
  context.fillStyle = color.paper;                       // background
  context.fillRect(0, 0, width, height);

  // Screen shake: nudge the whole world a few pixels while it lasts.
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  context.save();
  context.translate(shakeX, shakeY);

  if (color.glow) drawNeonGrid(width, height, color);     // faint scrolling grid

  const wallWidth = Math.min(roomSettings.wallWidth, Math.max(34, width * 0.16));
  drawScrollingSidewall(0, wallWidth, roomSettings.leftWallGlyphs, color, "left");
  drawScrollingSidewall(width - wallWidth, wallWidth, roomSettings.rightWallGlyphs, color, "right");

  // ---- Word walls, stones, gates and locks.
  state.obstacles.forEach(obstacle => {
    const top = obstacle.y - obstacle.height / 2;
    const tint = obstacleTint(obstacle, color);
    const isToken = obstacle.kind === "lock" && String(obstacle.id || "").includes("-token-");
    // Blank walls get their word repeated across them so everything reads as text.
    if (!obstacle.label && obstacle.word) {
      obstacle.label = fillLabel(obstacle.word, obstacle.width, obstacle.kind === "gate" ? " ═ " : " ");
    }
    context.save();
    // Body: dark (neon) or paper fill, flashing solid on a hit.
    context.fillStyle = obstacle.flash > 0 ? tint : obstacle.kind === "stone" ? color.wall : color.paper;
    context.fillRect(obstacle.x, top, obstacle.width, obstacle.height);
    // Outline, glowing on neon. LOCK tokens pulse so you know to shoot them.
    const pulse = isToken ? 0.6 + Math.sin(state.runTime * 8) * 0.4 : 1;
    if (color.glow) { context.shadowColor = tint; context.shadowBlur = (obstacle.flash > 0 ? 18 : 8) * pulse + (isToken ? 6 : 0); }
    context.strokeStyle = tint;
    context.lineWidth = obstacle.kind === "gate" || isToken ? 3 : 2;
    if (obstacle.kind === "gate") context.setLineDash([10, 5]);
    context.strokeRect(obstacle.x, top, obstacle.width, obstacle.height);
    context.setLineDash([]);
    context.shadowBlur = 0;
    // Text, clipped to the wall, with knocked-out letters missing.
    context.beginPath();
    context.rect(obstacle.x, top, obstacle.width, obstacle.height);
    context.clip();
    if (obstacle.label) {
      setCanvasFont(16, "bold");
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = obstacle.flash > 0 ? color.paper : color.glow ? tint : color.ink;
      context.fillText(brokenLabel(obstacle), obstacle.x + obstacle.width / 2, obstacle.y + 1, Math.max(24, obstacle.width - 12));
    }
    context.restore();
    if (isToken) drawGlow(obstacle.x + obstacle.width / 2, obstacle.y, 34 * pulse, tint, 0.35);
  });

  // ---- Falling / sliding blocks.
  state.fallingBlocks.forEach(block => {
    const blockColor = "#ff9f43";
    context.save();
    context.fillStyle = block.flash > 0 ? blockColor : color.paper;
    if (color.glow) { context.shadowColor = blockColor; context.shadowBlur = 10; }
    context.strokeStyle = color.glow ? blockColor : "#d97706";
    context.lineWidth = 3;
    context.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
    context.strokeRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
    context.shadowBlur = 0;
    context.strokeStyle = color.glow ? "#7a4a14" : "#8d5a12";
    context.lineWidth = 1;
    context.strokeRect(block.x - block.size * 0.32, block.y - block.size * 0.32, block.size * 0.64, block.size * 0.64);
    // Damage shows as a shrinking core.
    if (Number.isFinite(block.maxHp)) {
      const left = Math.max(0, block.hp / block.maxHp);
      context.fillStyle = blockColor;
      context.globalAlpha = 0.5;
      context.fillRect(block.x - block.size * 0.32 * left, block.y - block.size * 0.32 * left, block.size * 0.64 * left, block.size * 0.64 * left);
      context.globalAlpha = 1;
    }
    context.fillStyle = color.glow ? blockColor : color.ink;
    context.textAlign = "center";
    context.textBaseline = "middle";
    if (block.sliding) { context.fillStyle = blockColor; setCanvasFont(9, "bold"); context.fillText("↔", block.x, block.y + block.size / 2 + 8); }
    context.restore();
  });

  // ---- Equation hazards (unchanged behavior, neon glow added).
  state.numberHazards.forEach(hazard => {
    const pulse = 1 + Math.sin(state.runTime * 5 + hazard.x * 0.02) * 0.08;
    const colorCode = hazard.data.color || color.accent;
    const equation = String(hazard.data.equation || hazard.data.name || "1 + 1 = ?");
    drawGlow(hazard.x, hazard.y, 60, colorCode, 0.25);
    context.save();
    context.translate(hazard.x, hazard.y);
    context.rotate(Math.sin(state.runTime * 2 + hazard.x) * 0.045);
    context.scale(pulse, pulse);
    context.strokeStyle = colorCode;
    context.fillStyle = color.paper;
    context.lineWidth = 3;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.arc(0, 0, 34 + Math.sin(state.runTime * 7) * 3, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.fillRect(-48, -20, 96, 40);
    context.strokeRect(-48, -20, 96, 40);
    context.fillStyle = color.glow ? colorCode : color.ink;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const fontSize = Math.max(9, Math.min(17, 260 / equation.length));
    setCanvasFont(fontSize, "bold");
    context.fillText(equation, 0, 0, 88);
    if (hazard.phase !== "idle" && hazard.phase !== "cooldown") {
      context.fillStyle = colorCode;
      setCanvasFont(8, "bold");
      context.fillText(hazard.phase.toUpperCase() + " · " + (hazard.bounces || 0), 0, 29);
    }
    context.restore();
  });

  // ---- Pickups: glowing rings with their glyph.
  state.pickups.forEach(pickup => {
    const pulse = 1 + Math.sin(state.runTime * 6 + pickup.y * 0.03) * 0.08;
    const ring = color.glow ? color.teal : color.accent;
    drawGlow(pickup.x, pickup.y, 30 * pulse, ring, 0.45);
    context.save();
    context.translate(pickup.x, pickup.y);
    context.scale(pulse, pulse);
    context.fillStyle = color.paper;
    context.beginPath();
    context.arc(0, 0, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = ring;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = ring;
    context.textAlign = "center";
    context.textBaseline = "middle";
    setCanvasFont(16, "bold");
    context.fillText(pickup.data.glyph || "?", 0, 1);
    context.restore();
  });

  // ---- Enemies: letter in a ring, health arc, white flash on hit.
  state.enemies.forEach(enemy => {
    const tint = enemy.data.enemyColor || color.accent;
    const flashing = enemy.flash > 0;
    drawGlow(enemy.x, enemy.y, 34, tint, flashing ? 0.8 : 0.45);
    context.save();
    context.beginPath();
    context.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
    context.fillStyle = flashing ? "#ffffff" : color.paper;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = tint;
    context.stroke();
    // Health arc: only for tougher letters that have taken damage.
    const maxHealth = enemy.maxHealth || 1;
    if (maxHealth > 1 && enemy.health < maxHealth) {
      context.beginPath();
      context.arc(enemy.x, enemy.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, enemy.health / maxHealth));
      context.lineWidth = 2;
      context.globalAlpha = 0.8;
      context.stroke();
      context.globalAlpha = 1;
    }
    context.fillStyle = flashing ? color.paper : tint;
    if (color.glow && !flashing) { context.shadowColor = tint; context.shadowBlur = 8; }
    context.textAlign = "center";
    context.textBaseline = "middle";
    setCanvasFont(22, "bold");
    context.fillText(enemy.letter, enemy.x, enemy.y + 1);
    context.restore();
  });

  // ---- Enemy bullets.
  state.enemyBullets.forEach(bullet => {
    drawGlow(bullet.x, bullet.y, 14, bullet.color, 0.5);
    context.save();
    context.translate(bullet.x, bullet.y);
    context.rotate(bullet.angle);
    context.fillStyle = bullet.color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    setCanvasFont(bullet.type === "word" ? 13 : 17, "bold");
    context.fillText(bullet.glyph, 0, 0);
    context.restore();
  });

  // ---- Letter bursts, sparks and wall debris.
  state.explosions.forEach(particle => {
    context.save();
    context.globalAlpha = Math.max(0, particle.life / particle.duration);
    context.fillStyle = particle.color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    setCanvasFont(12 + (1 - particle.life / particle.duration) * 9, "bold");
    context.fillText(particle.glyph, particle.x, particle.y);
    context.restore();
  });

  // ---- Player.
  const px = width * state.player.x;
  const py = height * state.player.y;
  if (state.effects.some(effect => effect.effect === "wordWall")) {
    context.save();
    context.strokeStyle = color.accent;
    context.fillStyle = color.accent;
    context.lineWidth = 3;
    context.setLineDash([8, 4]);
    context.strokeRect(px - 28, py - 24, 56, 48);
    context.setLineDash([]);
    setCanvasFont(9, "bold");
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("WALL", px, py - 23);
    context.fillText("TEXT", px, py + 23);
    context.restore();
  }
  // Blink while invulnerable after a hit.
  const blinkHidden = state.invuln > 0 && state.started && Math.floor(state.invuln * 14) % 2 === 0;
  const playerCount = Math.max(0, Math.floor(effectTotal("clones")));
  const formation = playerCount ? playerFormation(width, height) : [{ x: px, y: py }];
  const playerColor = color.glow ? color.teal : color.accent;
  if (!blinkHidden) {
    formation.forEach((copy, index) => {
      context.save();
      context.globalAlpha = index === Math.floor(formation.length / 2) ? 1 : 0.72;
      drawGlow(copy.x, copy.y, 30, playerColor, 0.55);
      context.fillStyle = color.glow ? color.paper : color.accent;
      context.beginPath();
      context.arc(copy.x, copy.y, 10, 0, Math.PI * 2);
      context.fill();
      if (color.glow) { context.strokeStyle = playerColor; context.lineWidth = 2; context.stroke(); }
      context.fillStyle = color.glow ? "#e8fdff" : color.paper;
      setCanvasFont(10, "bold");
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("@", copy.x, copy.y + 0.5);
      context.restore();
    });
    // Aim tick: a small chevron showing where shots will go.
    const aimLength = Math.hypot(state.aim.x, state.aim.y) || 1;
    const ax = state.aim.x / aimLength, ay = state.aim.y / aimLength;
    context.save();
    context.strokeStyle = playerColor;
    context.globalAlpha = 0.75;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(px + ax * 16, py + ay * 16);
    context.lineTo(px + ax * 24, py + ay * 24);
    context.stroke();
    context.restore();
  }

  // ---- Player shots.
  state.projectiles.forEach(shot => {
    drawGlow(shot.x, shot.y, 14, color.shot, 0.55);
    context.save();
    context.translate(shot.x, shot.y);
    context.rotate(shot.angle);
    context.fillStyle = color.shot;
    context.textAlign = "center";
    context.textBaseline = "middle";
    setCanvasFont(18, "bold");
    context.fillText(shot.glyph, 0, 0);
    if (shot.glyph === ".") {
      context.globalAlpha = 0.5;
      context.fillRect(-9, -1, 5, 2);
    }
    context.restore();
  });
  // ---- Laser beams.
  state.beams.forEach(beam => {
    context.save();
    context.translate(beam.x, beam.y);
    context.rotate(beam.angle);
    context.globalAlpha = Math.max(0.15, beam.remaining / beam.duration);
    context.strokeStyle = color.shot;
    if (color.glow) { context.shadowColor = color.shot; context.shadowBlur = 14; }
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(8, 0);
    context.lineTo(beam.length, 0);
    context.stroke();
    context.globalAlpha *= 0.55;
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(8, 0);
    context.lineTo(beam.length, 0);
    context.stroke();
    context.restore();
  });

  // ---- Floating score / pickup text.
  state.popups.forEach(popup => {
    const t = 1 - popup.life / popup.duration;               // 0 -> 1 over its life
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, popup.life / popup.duration * 1.6));
    centerText(popup.text, popup.x, popup.y - t * 30, 13, popup.color, 8);
    context.restore();
  });

  context.restore();                                          // end of shaken world
  drawScreenOverlays(width, height, color);                   // vignette, combo, cards
}

function update(time) {
  const dt = Math.min((time - state.lastTime) / 1000 || 0, 0.04);
  state.lastTime = time;
  pollGamepad();
  handleGamepadUi(dt);
  const { width, height } = canvas.getBoundingClientRect();
  state.world.deathWallY = height - getDeathWallHeight();
  tickFeedback(dt);                                              // shake, popups, banner
  if (!state.started || state.gameOver) handleOverlayInput(dt);  // title / game-over cards

  if (state.started && !state.paused && !state.gameOver) {
    state.runTime += dt;
    updateRunTimers(dt);                                         // invuln, combo, page number
    state.effects = state.effects.map(effect => ({ ...effect, remaining: effect.remaining - dt })).filter(effect => effect.remaining > 0);
    state.pickupMessageTime = Math.max(0, state.pickupMessageTime - dt);
    const controls = readControls();
    const previousPlayerX = state.player.x;
    const previousPlayerY = state.player.y;
    const moveScale = Math.max(0.5, Math.min(2.5, effectValue("speedBoost", 1)));
    let nextPlayerX = state.player.x + controls.move.x * dt * 0.45 * moveScale;
    let nextPlayerY = state.player.y + controls.move.y * dt * 0.45 * moveScale;
    if (Math.hypot(controls.aim.x, controls.aim.y) > 0.15) state.aim = controls.aim;

    const scrollScale = effectValue("slowScroll", 1);
    const scrollStep = roomSettings.scrollSpeed * scrollScale * levelSpeedScale();
    const scrollDelta = dt * scrollStep;
    state.world.scrollOffset += scrollDelta;
    const previousDepth = Math.floor(state.world.distance / 10);
    state.world.distance += dt * scrollStep;
    state.score += Math.floor(state.world.distance / 10) - previousDepth;

    // Wave director: walls/pickups/hazards on one timer, enemies on their own faster timer.
    state.worldSpawnTimer -= dt;
    if (state.worldSpawnTimer <= 0) {
      spawnWorldDrop(width);
      state.worldSpawnTimer = Math.max(1.1, roomSettings.spawnInterval - state.level * 0.15) * (0.75 + Math.random() * 0.5);
    }
    state.enemySpawnTimer -= dt;
    if (state.enemySpawnTimer <= 0) {
      spawnEnemyWave(width, state.level);
      state.enemySpawnTimer = Math.max(0.85, 3.0 - state.level * 0.22) * (0.7 + Math.random() * 0.6);
    }

    state.fireCooldown -= dt;
    const weapon = getWeapon();
    const fireRate = effectValue("modifyFireRate", 1);
    if (controls.fire && state.fireCooldown <= 0) {
      shootWeapon(weapon, state.aim, width, height);
      sfx.play("shoot");
      state.fireCooldown = 1 / Math.max(0.2, (Number(weapon.shotsPerSecond) || 4) * fireRate);
    }
    state.effects.forEach(effect => {
      if (effect.effect !== "radialFire") return;
      effect.cooldown = Number(effect.cooldown || 0) - dt;
      if (effect.cooldown <= 0) {
        shootRadialBurst(weapon, width, height, effect.amount);
        effect.cooldown = Math.max(0.2, Number(effect.intervalSeconds) || 0.85);
      }
    });
    updatePlayerShots(dt, width, height);
    state.beams = state.beams.map(beam => ({ ...beam, remaining: beam.remaining - dt })).filter(beam => beam.remaining > 0);
    updateBeamHits();
    state.obstacles = state.obstacles.filter(obstacle => {
      obstacle.previousY = obstacle.y;
      obstacle.y += dt * scrollStep;
      return obstacle.y < state.world.deathWallY - 12;
    });
    updateFallingBlocks(dt, width, scrollStep);
    const wallMargin = Math.min(0.18, roomSettings.wallWidth / Math.max(width, 1) + 0.025);
    const minX = wallMargin, maxX = 1 - wallMargin;
    const minY = 0.08, maxY = Math.min(0.98, (state.world.deathWallY - 16) / height);
    state.numberHazards = state.numberHazards.filter(hazard => hazard.y < state.world.deathWallY + 50);
    const hazardControl = updateNumberHazards(dt, width, height, scrollDelta, nextPlayerX, nextPlayerY, minX, maxX, minY, maxY);
    nextPlayerX = hazardControl.x;
    nextPlayerY = hazardControl.y;
    nextPlayerX = Math.max(minX, Math.min(maxX, nextPlayerX));
    nextPlayerY = Math.max(minY, Math.min(maxY, nextPlayerY));
    const nextPx = nextPlayerX * width, nextPy = nextPlayerY * height;
    const oldPx = previousPlayerX * width, oldPy = previousPlayerY * height;
    const protectedByWordWall = state.effects.some(effect => effect.effect === "wordWall");
    const endCollision = protectedByWordWall ? null : collidesWithObstacle(nextPx, nextPy);
    const sweptCollision = protectedByWordWall ? null : solidObstacles().find(obstacle =>
      segmentHitsObstacle(oldPx, oldPy, nextPx, nextPy, obstacle)
    );

    let crushed = false;                            // set when a wall pins you to the floor
    if (endCollision || sweptCollision) {
      const hitsHorizontalPath = solidObstacles().some(obstacle =>
        collidesWithObstacle(nextPx, oldPy) === obstacle ||
        segmentHitsObstacle(oldPx, oldPy, nextPx, oldPy, obstacle)
      );
      const hitsVerticalPath = solidObstacles().some(obstacle =>
        collidesWithObstacle(oldPx, nextPy) === obstacle ||
        segmentHitsObstacle(oldPx, oldPy, oldPx, nextPy, obstacle)
      );

      const scrollCarry = scrollDelta / height;
      // Pinned: a wall is carrying you down and you're already at the floor -> crushed.
      if (previousPlayerY + scrollCarry > maxY + 0.0001 && hitsVerticalPath) crushed = true;
      if (!hitsHorizontalPath) {
        nextPlayerY = Math.max(minY, Math.min(maxY, previousPlayerY + scrollCarry));
      } else if (!hitsVerticalPath) {
        nextPlayerX = previousPlayerX;
      } else {
        nextPlayerX = previousPlayerX;
        nextPlayerY = Math.max(minY, Math.min(maxY, previousPlayerY + scrollCarry));
      }
    }

    // A moving wall can sweep over the player even when the normal slide
    // response has no open axis. If that leaves the player embedded, kick
    // them to the nearest clear point beside or beyond the barrier.
    if (!protectedByWordWall) {
      const trappedBy = solidObstacles().find(obstacle =>
        obstacleContainsPoint(nextPlayerX * width, nextPlayerY * height, obstacle)
      );
      if (trappedBy) {
        const kickout = findWallKickoutPosition(
          nextPlayerX * width,
          nextPlayerY * height,
          trappedBy,
          width,
          height,
          wallMargin,
          1 - wallMargin,
          minY,
          maxY
        );
        if (kickout) {
          nextPlayerX = kickout.x;
          nextPlayerY = kickout.y;
          state.pickupMessage = "WALL KICKOUT · BACK IN THE RUN";
          state.pickupMessageTime = 1.8;
        }
      }
    }

    state.player.x = nextPlayerX;
    state.player.y = nextPlayerY;
    updateEnemySystem(dt, width, height, scrollDelta);
    const playerX = width * state.player.x, playerY = height * state.player.y;
    state.pickups = state.pickups.filter(pickup => {
      pickup.y += dt * scrollStep;
      if (Math.hypot(pickup.x - playerX, pickup.y - playerY) < 22) {
        collectPickup(pickup);
        sfx.play("pickup");
        addPopup(pickup.x, pickup.y - 12, pickup.data.name || "PICKUP", colors().teal, 1.1);
        return false;
      }
      return pickup.y < state.world.deathWallY - 10;
    });

    if (crushed && !protectedByWordWall && state.invuln <= 0) {   // respawn grace covers crushing too
      sayPickup("CRUSHED INTO THE WALL OF DEATH");
      loseLife();
    } else if (height * state.player.y + 10 >= state.world.deathWallY) loseLife();
  }
  draw();
  requestAnimationFrame(update);
}

function resetRun() {
  const { height } = canvas.getBoundingClientRect();
  state.player = { x: 0.5, y: getPlayerStartY() };
  state.world = { scrollOffset: 0, deathWallY: height - getDeathWallHeight(), distance: 0 };
  state.gameOver = false;
  state.projectiles = [];
  state.beams = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.explosions = [];
  state.enemySpawnIndex = 0;
  state.pickups = [];
  state.obstacles = [];
  state.fallingBlocks = [];
  state.numberHazards = [];
  state.effects = [];
  state.health = 3;
  state.maxHealth = 3;
  state.lives = 3;
  state.maxLives = 3;
  state.score = 0;
  state.shields = 0;
  state.unlockedWeapons = weaponList.filter(weapon => weapon.unlockedByDefault).map(weapon => weapon.id);
  if (!state.unlockedWeapons.length) state.unlockedWeapons = [weaponList[0].id];
  state.weaponId = state.unlockedWeapons.includes("period") ? "period" : state.unlockedWeapons[0];
  state.worldSpawnTimer = 1.5;
  state.nextWallSide = "left";
  state.runTime = 0;
  state.pickupMessage = "";
  state.pickupMessageTime = 0;
  state.fireCooldown = 0;
  state.paused = dialog.open || !editorPanel.hidden;
  state.keys.clear();
  state.lastTime = 0;
  // Fresh feedback/difficulty state for the new run.
  state.level = 1;
  state.enemySpawnTimer = 2.2;
  state.invuln = 1.2;
  state.shake = 0;
  state.hurtFlash = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.bestCombo = 0;
  state.popups = [];
  state.banner = { text: "", time: 0 };
  state.overTime = 0;
  state.newBest = false;
  draw();
}

async function loadHorizontalWallWords() {
  try {
    const response = await fetch(new URL("../data/word-sets/default.json", import.meta.url));
    if (!response.ok) return;
    const wordSet = await response.json();
    if (Array.isArray(wordSet.horizontalWalls) && wordSet.horizontalWalls.length) {
      horizontalWallWords = wordSet.horizontalWalls.filter(word => typeof word === "string" && word.trim()).map(word => word.trim().toUpperCase());
    }
  } catch {
    // Keep the built-in wall words if the editable word set cannot load.
  }
}

function spawnEnemyData(data, x, y) {
  if (!data) return false;
  state.enemies.push({
    id: data.id || String(data.letter || "test").toLowerCase(),
    letter: data.letter || String(data.id || "?").charAt(0).toUpperCase(),
    data,
    x, y,
    originX: x, phase: Math.random() * Math.PI * 2,
    age: 0, direction: Math.random() < 0.5 ? -1 : 1, angle: Math.random() * Math.PI * 2,
    health: Math.max(1, Number(data.health) || 1),
    maxHealth: Math.max(1, Number(data.health) || 1),
    flash: 0,
    fireCooldown: Math.random() * Math.max(0.4, Number(data.fireRate) || 1.5)
  });
  return true;
}

function spawnEnemy(width) {
  if (!enemyList.length || state.enemies.length >= 5) return;
  const data = enemyList[state.enemySpawnIndex % enemyList.length];
  state.enemySpawnIndex += 1;
  const left = roomSettings.wallWidth + 18;
  const right = Math.max(left + 1, width - roomSettings.wallWidth - 18);
  spawnEnemyData(data, left + Math.random() * (right - left), -24);
}

function spawnStoneRow(width,y,gapSide,gapFraction=.28,word="STONE",setId="",kindOverride=""){
  const left=roomSettings.wallWidth+12, roomWidth=Math.max(100,width-roomSettings.wallWidth*2-24);
  const gapWidth=Math.max(MIN_WALL_GAP,Math.min(roomWidth*.38,roomWidth*gapFraction)), wallWidth=roomWidth-gapWidth; // gap never narrower than the player lane
  const kind=kindOverride||(word==="GATE"?"gate":word==="LOCK"?"lock":"stone");
  const parts=gapSide==="center"?[{x:left,width:wallWidth/2},{x:left+wallWidth/2+gapWidth,width:wallWidth/2}]:[{x:gapSide==="left"?left+gapWidth:left,width:wallWidth}];
  return parts.filter(p=>p.width>=52).map(p=>{let label="";if(kind==="wordWall"){setCanvasFont(16,"bold");label=word;while(context.measureText(label).width<p.width-24&&label.length<240)label+=" · "+word;}const o={id:(setId||"wall")+"-"+Math.random().toString(36).slice(2,7),kind,word,label,x:p.x,y,width:p.width,height:28,previousY:y,setId};state.obstacles.push(o);return o;});
}
function spawnLockToken(x,y,setId=""){
  const width=44,height=36,o={id:(setId||"lock")+"-token-"+Math.random().toString(36).slice(2,7),kind:"lock",word:"LOCK",label:"LOCK",x:x-width/2,y,width,height,previousY:y,setId};
  state.obstacles.push(o);return o;
}
function spawnFallingBlock(data,width,x,y,setId=""){
  const size=Math.max(48,Math.min(68,Number(data?.size)||60)),left=roomSettings.wallWidth+12+size/2,right=Math.max(left+1,width-roomSettings.wallWidth-12-size/2);
  const b={id:(data?.id||"falling-block")+"-"+Math.random().toString(36).slice(2,7),kind:"block",label:data?.name||"BLOCK",x:Math.max(left,Math.min(right,x)),y,previousX:x,previousY:y,width:size,height:size,size,fallSpeed:Math.max(40,Number(data?.fallSpeed)||95),gravity:Math.max(0,Number(data?.gravity)||50),slideSpeed:Math.max(60,Number(data?.slideSpeed)||190),slideDirection:Math.random()<.5?-1:1,vx:0,sliding:false,supportId:"",setId};
  b.previousX=b.x;state.fallingBlocks.push(b);return b;
}
function updateFallingBlocks(dt,width,scrollStep){
  const left=roomSettings.wallWidth+12,right=width-roomSettings.wallWidth-12;
  state.fallingBlocks=state.fallingBlocks.filter(b=>{
    b.previousX=b.x;b.previousY=b.y;const half=b.size/2,support=b.sliding?state.obstacles.find(w=>w.id===b.supportId):null;
    if(support){
      b.y=support.y-support.height/2-half;b.vx=b.slideDirection*b.slideSpeed;b.x+=b.vx*dt;
      const cleared=b.x+half<support.x||b.x-half>support.x+support.width;
      const atEdge=b.slideDirection<0?b.x-half<=left+1:b.x+half>=right-1;
      if(cleared||atEdge){b.sliding=false;b.supportId="";b.vx=0;b.fallSpeed=Math.max(75,b.fallSpeed);b.y+=2;}
    }else{
      b.sliding=false;b.supportId="";b.y+=(scrollStep+b.fallSpeed)*dt;b.fallSpeed+=b.gravity*dt;b.x+=b.vx*dt;
      if(b.x-half<=left){b.x=left+half;if(b.vx<0)b.vx=Math.abs(b.vx);}
      if(b.x+half>=right){b.x=right-half;if(b.vx>0)b.vx=-Math.abs(b.vx);}
      const landed=state.obstacles.find(w=>{
        if(w.kind==="lock")return false;
        const overlaps=b.x+half>w.x&&b.x-half<w.x+w.width, before=(Number.isFinite(w.previousY)?w.previousY:w.y)-w.height/2, now=w.y-w.height/2;
        return overlaps&&b.y+half>=now&&b.previousY+half<=before+5&&b.y<w.y;
      });
      if(landed){b.y=landed.y-landed.height/2-half;b.fallSpeed=0;b.sliding=true;b.supportId=landed.id;b.slideDirection=b.x<landed.x+landed.width/2?1:-1;b.vx=b.slideDirection*b.slideSpeed;}
    }
    return b.y<(state.world.deathWallY||0)+60;
  });
}
function spawnObstacleSet(width,setData,startY=-70){
  const set=setData||obstacleSetList[Math.floor(Math.random()*obstacleSetList.length)];if(!set)return false;
  const roomLeft=roomSettings.wallWidth+12,roomWidth=Math.max(100,width-roomSettings.wallWidth*2-24),rows=Math.max(2,Math.min(4,Number(set.rows)||3)),spacing=Math.max(150,Number(set.rowSpacing)||190),gap=Math.max(.22,Math.min(.38,Number(set.gapFraction)||.3)),setId=set.id||"obstacle-set",sides=set.gapSequence?.length?set.gapSequence:["left","right","center","left"];
  for(let row=0;row<rows;row++){
    const side=sides[row%sides.length],y=startY-row*spacing,word=set.formation==="lock-gate"?(row%2?"LOCK":"GATE"):"STONE",segments=spawnStoneRow(width,y,side,gap,word,setId);
    if(set.formation==="block-skate"){const wall=segments.sort((a,b)=>b.width-a.width)[0];if(wall){const cfg=set.block||{size:38,fallSpeed:105,gravity:45,slideSpeed:210};spawnFallingBlock(cfg,width,wall.x+wall.width*(row%2?.66:.34),y-Math.max(70,Number(set.blockDropHeight)||90),setId);}}
    if(set.formation==="lock-gate"&&row%2===1){const gx=side==="left"?roomLeft+roomWidth*gap/2:side==="right"?roomLeft+roomWidth*(1-gap/2):roomLeft+roomWidth/2;spawnLockToken(gx,y,setId);}
  }
  return true;
}

// ---- Wall spacing rules (so solid rows can never seal the room) ----
const MIN_WALL_GAP = 84;        // every row leaves at least this many px open (player is ~20px wide)
const MIN_ROW_SPACING = 140;    // px of clear space required between a new row and the walls already above
// Top edge of the highest wall currently in the room (Infinity when there are none).
function highestWallTop() {
  return state.obstacles.reduce((top, o) => Math.min(top, o.y - o.height / 2), Infinity);
}
// True if a new wall whose lowest edge sits at bottomY keeps a clear lane under the walls above it.
function roomForWall(bottomY) {
  return highestWallTop() - bottomY >= MIN_ROW_SPACING;
}
// How far down (in px) a new obstacle set's lowest row will be.
function obstacleSetBottom(startY) {
  return startY + 14;
}

function spawnWorldDrop(width) {
  const roomWidth = Math.max(80, width - roomSettings.wallWidth * 2 - 24);
  const enemyChance = enemyList.length ? 0.16 : 0;   // enemies mostly come from the wave timer now
  const pickupChance = pickupList.length ? 0.28 : 0;
  const numberHazardChance = numberHazardList.length ? 0.18 : 0;
  const obstacleSetChance = obstacleSetList.length ? 0.22 : 0;
  const roll = Math.random();
  if (roll < enemyChance) {
    spawnEnemyWave(width, state.level);
    return;
  }
  if (roll < enemyChance + pickupChance) {
    const totalWeight = pickupList.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 1), 0);
    let itemRoll = Math.random() * totalWeight;
    const item = pickupList.find(entry => (itemRoll -= Math.max(0, Number(entry.weight) || 1)) <= 0) || pickupList[0];
    const left = roomSettings.wallWidth + 12;
    state.pickups.push({ data: item, x: left + Math.random() * roomWidth, y: -20 });
    return;
  }
  if (roll < enemyChance + pickupChance + numberHazardChance) {
    const data = numberHazardList[Math.floor(Math.random() * numberHazardList.length)];
    spawnNumberHazard(data, width, Math.max(80, width - roomSettings.wallWidth * 2), -42);
    return;
  }
  if (roll < enemyChance + pickupChance + numberHazardChance + obstacleSetChance) {
    if (roomForWall(obstacleSetBottom(-70))) spawnObstacleSet(width);
    else spawnEnemyWave(width, state.level);       // no room for walls yet: send enemies instead
    return;
  }
  // Single word wall: same rule, it must not land on or right against another wall.
  if (!roomForWall(-28 + 13)) {
    spawnEnemyWave(width, state.level);
    return;
  }

  const left = roomSettings.wallWidth + 12;
  const maxWidth = Math.max(0, Math.min(roomWidth * 0.82, roomWidth - MIN_WALL_GAP));   // always a real gap
  const minWidth = Math.min(maxWidth, Math.max(72, roomWidth * 0.32));
  const barrierWidth = minWidth + Math.random() * Math.max(0, maxWidth - minWidth);
  const gapSide = state.nextWallSide;
  const x = gapSide === "left" ? left : left + roomWidth - barrierWidth;
  const word = horizontalWallWords[Math.floor(Math.random() * horizontalWallWords.length)] || "ROLL FOR INITIATIVE";
  setCanvasFont(16, "bold");
  let label = word;
  while (context.measureText(label).width < barrierWidth - 18) label += " · " + word;
  state.obstacles.push({ kind: "wordWall", word, label, x, y: -28, width: barrierWidth, height: 26, previousY: -28 });
  state.nextWallSide = gapSide === "left" ? "right" : "left";
}

function spawnNumberHazard(data, width, height, y = -42, x = null) {
  if (!data || state.numberHazards.length >= 5) return false;
  const left = roomSettings.wallWidth + 24;
  const right = Math.max(left + 1, width - roomSettings.wallWidth - 24);
  const hazardX = Number.isFinite(x) ? x : left + Math.random() * (right - left);
  state.numberHazards.push({
    id: data.id || "equation-" + Math.random().toString(36).slice(2, 7),
    data: { ...data },
    x: hazardX,
    y,
    previousY: y,
    phase: "idle",
    timer: 0,
    cooldown: 0,
    velocityX: 0,
    velocityY: 0,
    direction: "",
    bounces: 0
  });
  return true;
}

function updateNumberHazards(dt, width, height, scrollDelta, playerX, playerY, minX, maxX, minY, maxY) {
  let targetX = playerX;
  let targetY = playerY;
  const activePhases = new Set(["suction", "hold", "slam", "pinned", "pinball", "repulse"]);
  let active = state.numberHazards.find(hazard => activePhases.has(hazard.phase));

  state.numberHazards = state.numberHazards.filter(hazard => {
    hazard.previousY = hazard.y;
    hazard.y += scrollDelta;
    if (hazard.y > state.world.deathWallY + 50) return false;
    const data = hazard.data || {};
    const behavior = data.behavior || "suction-hold";
    hazard.cooldown = Math.max(0, hazard.cooldown - dt);

    if (hazard.phase === "cooldown") {
      hazard.timer -= dt;
      if (hazard.timer <= 0) hazard.phase = "idle";
      return true;
    }
    if (hazard.phase === "idle") {
      if (active || hazard.cooldown > 0) return true;
      const distance = Math.hypot(hazard.x - targetX * width, hazard.y - targetY * height);
      if (distance > (Number(data.triggerRadius) || 150)) return true;
      active = hazard;
      hazard.phase = behavior === "repulsor" ? "repulse" : "suction";
      hazard.timer = Number(data.suctionSeconds) || 0.7;
      sayPickup((data.equation || data.name || "EQUATION") + " · " + (behavior === "repulsor" ? "REPEL" : "GRAVITY WELL"));
    }
    if (hazard !== active) return true;

    const px = targetX * width, py = targetY * height;
    const dx = hazard.x - px, dy = hazard.y - py;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const clampX = value => Math.max(minX, Math.min(maxX, value));
    const clampY = value => Math.max(minY, Math.min(maxY, value));

    if (hazard.phase === "suction") {
      const speed = Math.max(0, Number(data.suctionSpeed) || 260);
      const step = Math.min(distance, speed * dt);
      targetX = clampX(targetX + dx / distance * step / width);
      targetY = clampY(targetY + dy / distance * step / height);
      hazard.timer -= dt;
      if (distance <= (Number(data.captureRadius) || 28) || hazard.timer <= 0) {
        hazard.phase = "hold";
        hazard.timer = Math.max(0.2, Number(data.holdSeconds) || 1);
        hazard.anchorX = clampX(hazard.x / width);
        hazard.anchorY = clampY((hazard.y - 8) / height);
      }
    } else if (hazard.phase === "hold") {
      targetX = hazard.anchorX;
      targetY = hazard.anchorY;
      hazard.timer -= dt;
      if (hazard.timer <= 0) {
        if (behavior === "wall-slam") {
          const dirs = Array.isArray(data.directions) && data.directions.length ? data.directions : ["left", "right", "up", "down"];
          hazard.direction = dirs[Math.floor(Math.random() * dirs.length)];
          hazard.phase = "slam";
        } else if (behavior === "pinball" || behavior === "suction-pinball" || behavior === "wall-slam") {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.max(200, Number(data.launchSpeed) || 520);
          hazard.velocityX = Math.cos(angle) * speed;
          hazard.velocityY = Math.sin(angle) * speed;
          hazard.timer = Math.max(0.4, Number(data.pinballSeconds) || 2);
          hazard.phase = "pinball";
          hazard.bounces = 0;
        } else {
          hazard.phase = "cooldown";
          hazard.timer = Math.max(0.5, Number(data.cooldownSeconds) || 2.5);
        }
      }
    } else if (hazard.phase === "slam") {
      const destination = {
        left: { x: minX, y: targetY },
        right: { x: maxX, y: targetY },
        up: { x: targetX, y: minY },
        down: { x: targetX, y: maxY }
      }[hazard.direction] || { x: minX, y: targetY };
      const dxNorm = destination.x - targetX, dyNorm = destination.y - targetY;
      const distPx = Math.hypot(dxNorm * width, dyNorm * height);
      const step = Math.max(100, Number(data.slamSpeed) || 620) * dt;
      if (distPx <= step + 2) {
        targetX = destination.x;
        targetY = destination.y;
        hazard.phase = "pinned";
        hazard.timer = Math.max(0.3, Number(data.wallHoldSeconds) || 1.4);
        sayPickup("SLAMMED " + hazard.direction.toUpperCase() + " · HOLD ON");
      } else {
        targetX = clampX(targetX + dxNorm * step / distPx);
        targetY = clampY(targetY + dyNorm * step / distPx);
      }
    } else if (hazard.phase === "pinned") {
      if (hazard.direction === "left") targetX = minX;
      if (hazard.direction === "right") targetX = maxX;
      if (hazard.direction === "up") targetY = minY;
      if (hazard.direction === "down") targetY = maxY;
      hazard.timer -= dt;
      if (hazard.timer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.max(200, Number(data.launchSpeed) || 520);
        hazard.velocityX = Math.cos(angle) * speed;
        hazard.velocityY = Math.sin(angle) * speed;
        hazard.timer = Math.max(0.4, Number(data.pinballSeconds) || 2);
        hazard.phase = "pinball";
        sayPickup("EQUATION RELEASE · PINBALL!");
      }
    } else if (hazard.phase === "pinball") {
      hazard.timer -= dt;
      let nextPx = px + hazard.velocityX * dt;
      let nextPy = py + hazard.velocityY * dt;
      if (nextPx < minX * width) { nextPx = minX * width; hazard.velocityX = Math.abs(hazard.velocityX); hazard.bounces += 1; }
      if (nextPx > maxX * width) { nextPx = maxX * width; hazard.velocityX = -Math.abs(hazard.velocityX); hazard.bounces += 1; }
      if (nextPy < minY * height) { nextPy = minY * height; hazard.velocityY = Math.abs(hazard.velocityY); hazard.bounces += 1; }
      if (nextPy > maxY * height) { nextPy = maxY * height; hazard.velocityY = -Math.abs(hazard.velocityY); hazard.bounces += 1; }
      const struckWall = state.effects.some(effect => effect.effect === "wordWall")
        ? null
        : solidObstacles().find(obstacle => obstacleContainsPoint(nextPx, nextPy, obstacle));
      if (struckWall) {
        const hitX = obstacleContainsPoint(nextPx, py, struckWall);
        const hitY = obstacleContainsPoint(px, nextPy, struckWall);
        if (hitX || !hitY) hazard.velocityX *= -1;
        if (hitY || !hitX) hazard.velocityY *= -1;
        nextPx = px;
        nextPy = py;
        hazard.bounces += 1;
      }
      targetX = clampX(nextPx / width);
      targetY = clampY(nextPy / height);
      if (hazard.timer <= 0) {
        hazard.phase = "cooldown";
        hazard.timer = Math.max(0.5, Number(data.cooldownSeconds) || 2.5);
      }
    } else if (hazard.phase === "repulse") {
      const speed = Math.max(100, Number(data.suctionSpeed) || 340);
      const step = Math.min(Math.max(0, (Number(data.triggerRadius) || 150) - distance), speed * dt);
      targetX = clampX(targetX - dx / distance * step / width);
      targetY = clampY(targetY - dy / distance * step / height);
      hazard.timer -= dt;
      if (hazard.timer <= 0) {
        hazard.phase = "cooldown";
        hazard.timer = Math.max(0.5, Number(data.cooldownSeconds) || 2.5);
      }
    }
    return true;
  });
  return { x: targetX, y: targetY };
}

function solidObstacles() {
  return state.obstacles.concat(state.fallingBlocks);
}

function obstacleContainsPoint(x, y, obstacle, obstacleX = obstacle.x, obstacleY = obstacle.y) {
  const radius = 10;
  obstacleX = obstacleLeft(obstacle, obstacleX);       // blocks are stored by center
  return x + radius > obstacleX && x - radius < obstacleX + obstacle.width &&
    y + radius > obstacleY - obstacle.height / 2 && y - radius < obstacleY + obstacle.height / 2;
}

function collidesWithObstacle(x, y) {
  return solidObstacles().find(obstacle => obstacleContainsPoint(x, y, obstacle));
}

function findWallKickoutPosition(x, y, obstacle, width, height, minX, maxX, minY, maxY) {
  const radius = 13;
  const sideStep = radius + 2;
  const verticalStep = obstacle.height / 2 + radius + 2;
  const leftEdge = obstacleLeft(obstacle);
  const xOptions = [x, leftEdge - sideStep, leftEdge + obstacle.width + sideStep];
  const yOptions = [
    y,
    obstacle.y - verticalStep,
    obstacle.y + verticalStep,
    y - 16, y + 16, y - 32, y + 32,
    y - 48, y + 48, y - 64, y + 64,
  ];
  const candidates = [];
  for (const candidateX of xOptions) {
    for (const candidateY of yOptions) {
      if (candidateX < minX * width || candidateX > maxX * width ||
          candidateY < minY * height || candidateY > maxY * height) continue;
      if (solidObstacles().some(other => obstacleContainsPoint(candidateX, candidateY, other))) continue;
      candidates.push({ x: candidateX / width, y: candidateY / height,
        distance: Math.hypot(candidateX - x, candidateY - y) });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] || null;
}

function segmentHitsObstacle(fromX, fromY, toX, toY, obstacle) {
  const radius = 10;
  const left = obstacle.x - radius;
  const right = obstacle.x + obstacle.width + radius;
  const previousY = Number.isFinite(obstacle.previousY) ? obstacle.previousY : obstacle.y;
  const fromRelativeY = fromY - previousY;
  const toRelativeY = toY - obstacle.y;
  const top = -obstacle.height / 2 - radius;
  const bottom = obstacle.height / 2 + radius;
  let enter = 0;
  let leave = 1;

  const previousX = Number.isFinite(obstacle.previousX) ? obstacle.previousX : obstacle.x;
  const fromRelativeX = fromX - obstacleLeft(obstacle, previousX);
  const toRelativeX = toX - obstacleLeft(obstacle);
  for (const [origin, delta, min, max] of [
    [fromRelativeX, toRelativeX - fromRelativeX, -radius, obstacle.width + radius],
    [fromRelativeY, toRelativeY - fromRelativeY, top, bottom]
  ]) {
    if (Math.abs(delta) < 0.0001) {
      if (origin < min || origin > max) return false;
      continue;
    }
    let near = (min - origin) / delta;
    let far = (max - origin) / delta;
    if (near > far) [near, far] = [far, near];
    enter = Math.max(enter, near);
    leave = Math.min(leave, far);
    if (enter > leave) return false;
  }
  return leave >= 0 && enter <= 1;
}

async function loadWorldSettings() {
  try {
    const response = await fetch(new URL("../data/settings.json", import.meta.url));
    if (!response.ok) return;
    const settings = await response.json();
    if (Number.isFinite(settings.world?.scrollSpeed)) roomSettings.scrollSpeed = settings.world.scrollSpeed;
    if (Number.isFinite(settings.world?.spawnInterval)) roomSettings.spawnInterval = Math.max(1.5, settings.world.spawnInterval);
    const room = settings.room || {};
    if (Number.isFinite(room.wallWidth)) roomSettings.wallWidth = room.wallWidth;
    if (Number.isFinite(room.glyphSpacing)) roomSettings.glyphSpacing = room.glyphSpacing;
    if (Number.isFinite(settings.wallOfDeath?.height)) roomSettings.deathWallHeight = settings.wallOfDeath.height;
    if (Array.isArray(settings.wallOfDeath?.lines) && settings.wallOfDeath.lines.length >= 2) roomSettings.deathWallLines = settings.wallOfDeath.lines.slice(0, 2);
    applyDeathWallSettings();
    if (typeof room.leftWallGlyphs === "string" && room.leftWallGlyphs.length > 0) roomSettings.leftWallGlyphs = room.leftWallGlyphs;
    if (typeof room.rightWallGlyphs === "string" && room.rightWallGlyphs.length > 0) roomSettings.rightWallGlyphs = room.rightWallGlyphs;
    draw();
  } catch {
    // Use the built-in room values if settings cannot be loaded.
  }
}

function announce(message) {
  menuStatus.textContent = message;
}

function applyFontTheme(theme, persist = false) {
  const selected = Object.hasOwn(fontThemes, theme) ? theme : "crt";
  state.fontTheme = selected;
  document.documentElement.dataset.gameFont = selected;
  fontSelect.value = selected;
  if (persist) {
    try { localStorage.setItem("bulletPoints.font.v2", selected); } catch {}
  }
  draw();
}

function setCanvasFont(size, weight = "bold") {
  const theme = fontThemes[state.fontTheme] || fontThemes.crt;        // current font theme
  const px = Math.round(size * (theme.scale || 1));                    // small fonts get scaled up
  context.font = `${theme.weight || weight} ${px}px ${theme.canvas}`;   // apply to the canvas
}

function applyTheme() {
  const color = colors();
  document.documentElement.dataset.theme = state.theme;                 // CSS switches on this
  document.documentElement.style.setProperty("--paper", color.paper);
  document.documentElement.style.setProperty("--ink", color.ink);
  document.documentElement.style.setProperty("--accent", color.accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color.paper);
  invertButton.setAttribute("aria-pressed", String(state.theme === "paper"));
  invertButton.textContent = state.theme === "paper" ? uiText.invertOn : uiText.invertOff;
  try { localStorage.setItem("bulletPoints.theme", state.theme); } catch {}
  draw();
}

function openSettings() {
  if (!editorPanel.hidden) {
    editorPanel.hidden = true;
    document.body.classList.remove("editor-open");
  }
  state.paused = true;
  state.keys.clear();
  menuStatus.textContent = "";
  if (!dialog.open) dialog.showModal();
  draw();
  resumeButton.focus();
}

function resumeRun() {
  if (dialog.open) dialog.close();
  state.paused = false;
  state.keys.clear();
  state.lastTime = 0;
  menuButton.focus();
  draw();
}

function editorDraftKey(path) {
  return EDITOR_DRAFT_PREFIX + path;
}

function setEditorStatus(message) {
  editorStatus.textContent = message;
}

function renderEnemyPreview(enemy) {
  if (!enemy) return;
  enemyPreviewLetter.textContent = enemy.letter || "?";
  enemyPreviewLetter.style.color = enemy.enemyColor || "#ffffff";
  enemyPreviewName.textContent = enemy.name || "Unnamed enemy";
  enemyPreviewName.style.color = enemy.enemyColor || "#ffffff";
  const count = Math.max(1, Math.min(24, Number(enemy.explosionCount) || 8));
  explosionPreview.textContent = Array.from({ length: count }, () => enemy.explosionGlyph || enemy.letter || "?").join(" ");
  explosionPreview.style.color = enemy.explosionColor || enemy.enemyColor || "#ffffff";
}

function refreshEnemyRosterFromEditor(data) {
  if (!Array.isArray(data?.enemies)) return;
  enemyList = data.enemies;
  state.enemies.forEach(enemy => {
    const updated = enemyList.find(entry => entry.id === enemy.id);
    if (updated) {
      enemy.data = updated;
      enemy.health = Math.min(enemy.health, Math.max(1, Number(updated.health) || 1));
    }
  });
}

function spawnToolCollection(path, data) {
  if (path.endsWith("/enemies.json")) return { kind: "enemies", label: "ENEMIES", items: data.enemies || [] };
  if (path.endsWith("/pickups.json")) return { kind: "pickups", label: "PICKUPS", items: data.pickups || [] };
  if (path.endsWith("/weapons.json")) return { kind: "weapons", label: "WEAPONS", items: data.weapons || [] };
  if (path.endsWith("/obstacles.json")) return { kind: "obstacles", label: "OBSTACLES", items: data.obstacles || [] };
  if (path.includes("/word-sets/")) return { kind: "words", label: "HORIZONTAL WALL WORDS", items: (data.horizontalWalls || []).map((word, index) => ({ id: String(index), name: word })) };
  if (path.endsWith("/spawn-patterns.json")) return { kind: "patterns", label: "SPAWN PATTERNS", items: data.patterns || [] };
  if (path.endsWith("/feeds/default.json")) return { kind: "feed", label: "FULL FEED", items: [{ id: "full-feed", name: "Everything in First Page" }] };
  return null;
}

function renderSpawnTools() {
  let data;
  try { data = JSON.parse(editorText.value); } catch { spawnTools.hidden = true; return; }
  const collection = spawnToolCollection(editorPath, data);
  if (!collection || !collection.items.length) { spawnTools.hidden = true; return; }
  spawnTools.hidden = false;
  spawnToolsTitle.textContent = "LIVE SPAWNER · " + collection.label;
  const previousValue = spawnItemSelect.value;
  spawnItemSelect.replaceChildren();
  collection.items.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = item.letter
      ? item.letter + " · " + (item.name || "Unnamed enemy")
      : (item.name || item.id || "Entry " + (index + 1));
    spawnItemSelect.append(option);
  });
  // Keep the previous pick if it still exists; otherwise select the first entry (was blank before).
  if (previousValue !== "" && Number(previousValue) < collection.items.length) spawnItemSelect.value = previousValue;
  else if (collection.items.length) spawnItemSelect.selectedIndex = 0;
  spawnSelectedButton.textContent = collection.kind === "patterns" ? "SPAWN PATTERN" : collection.kind === "feed" ? "SPAWN EVERYTHING" : "SPAWN SELECTED";
  spawnAllButton.hidden = collection.kind === "feed";
  spawnAllButton.textContent = collection.kind === "words" ? "SPAWN 10 WORDS" : "SPAWN ALL (" + collection.items.length + ")";
  spawnToolsHelp.textContent = "Adds test objects to the live canvas. The run resumes when F8 closes.";
}

function spawnTestObstacle(word, width, y, index = 0) {
  const cleanWord = String(word || "WORD").trim().toUpperCase();
  spawnStoneRow(width, y, ["left", "right", "center"][index % 3], 0.3, cleanWord, "", "wordWall");
}

function spawnEditorItem(kind, item, index, total, width, height) {
  const roomLeft = roomSettings.wallWidth + 18;
  const roomWidth = Math.max(80, width - roomSettings.wallWidth * 2 - 36);
  const columns = Math.max(1, Math.min(8, total));
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = roomLeft + roomWidth * ((column + 1) / (columns + 1));
  const y = Math.max(36, Math.min(height - getDeathWallHeight() - 30, height * 0.14 + row * 34));

  if (kind === "enemies") return spawnEnemyData(item, x, y);
  if (kind === "pickups") {
    state.pickups.push({ data: item, x, y });
    return true;
  }
  if (kind === "weapons") {
    state.pickups.push({
      data: { id: "test-weapon-" + item.id, name: "TEST DROP · " + item.name, glyph: item.projectileGlyph || "!", effect: "grantWeapon", amount: item.id, durationSeconds: 0 },
      x, y
    });
    return true;
  }
  if (kind === "obstacles" && item.type === "number") return spawnNumberHazard(item, width, height, y, x);
  if (kind === "obstacles" && item.type === "set") return spawnObstacleSet(width, item, y);
  if (kind === "obstacles" && item.type === "block") return Boolean(spawnFallingBlock(item, width, x, y));
  if (kind === "obstacles" && item.type === "gate") return spawnStoneRow(width, y, ["left", "right", "center"][index % 3], item.gapFraction || 0.3, "GATE").length > 0;
  if (kind === "obstacles" && item.type === "lock") return Boolean(spawnLockToken(x, y));
  if (kind === "obstacles" && item.type === "stone") return spawnStoneRow(width, y, ["left", "right", "center"][index % 3], item.gapFraction || 0.28, "STONE").length > 0;
  if (kind === "obstacles" || kind === "words") {
    spawnTestObstacle(item.name || item.word || item.id, width, y, index);
    return true;
  }
  if (kind === "patterns") {
    const entries = Array.isArray(item.entries) ? item.entries : [];
    entries.forEach((entry, entryIndex) => {
      const count = Math.max(1, Math.min(26, Number(entry.count) || 1));
      for (let n = 0; n < count; n += 1) {
        const targetX = roomLeft + roomWidth * ((n + 1) / (count + 1));
        const targetY = y + (entryIndex * count + n) * Math.max(24, Number(entry.spacing) || 30);
        if (entry.type === "enemy" && enemyList.length) {
          const enemy = enemyList.find(candidate => candidate.id === entry.id) || enemyList[(entryIndex + n) % enemyList.length];
          spawnEnemyData(enemy, targetX, targetY);
        } else if (entry.type === "pickup" && pickupList.length) {
          const pickup = pickupList.find(candidate => candidate.id === entry.id) || pickupList[(entryIndex + n) % pickupList.length];
          state.pickups.push({ data: pickup, x: targetX, y: targetY });
        } else {
          spawnTestObstacle(entry.id || entry.type || "STONE", width, targetY, n);
        }
      }
    });
    return entries.length > 0;
  }
  return false;
}

function spawnEditorSelection(all = false) {
  let data;
  try { data = JSON.parse(editorText.value); } catch { setEditorStatus("Fix the JSON before spawning from this category."); return; }
  const collection = spawnToolCollection(editorPath, data);
  if (!collection) return;
  if (collection.kind === "feed") {
    const width = canvas.getBoundingClientRect().width, height = canvas.getBoundingClientRect().height;
    let count = 0;
    const groups = [
      ["enemies", enemyList],
      ["pickups", pickupList],
      ["weapons", weaponList],
      ["obstacles", catalogData.obstacles.length ? catalogData.obstacles : ["STONE", "BLOCK", "LOCK", "GATE"].map((name, id) => ({ id: String(id), name }))],
      ["words", horizontalWallWords.slice(0, 10).map((name, id) => ({ id: String(id), name }))]
    ];
    groups.forEach(([kind, items]) => items.forEach((item, index) => {
      if (spawnEditorItem(kind, item, index, items.length, width, height)) count += 1;
    }));
    draw();
    setEditorStatus("Spawned the full feed test set: " + count + " objects. Close F8 to watch them run.");
    return;
  }
  let selectedItems = collection.items;
  if (!all) {
    const index = Math.max(0, Math.min(collection.items.length - 1, Number(spawnItemSelect.value) || 0));
    selectedItems = [collection.items[index]];
  } else if (collection.kind === "words") {
    selectedItems = collection.items.slice(0, 10);
  } else if (collection.kind === "patterns") {
    selectedItems = collection.items;
  }
  const width = canvas.getBoundingClientRect().width, height = canvas.getBoundingClientRect().height;
  let spawned = 0;
  selectedItems.forEach((item, index) => {
    if (collection.kind === "patterns") {
      if (spawnEditorItem("patterns", item, index, selectedItems.length, width, height)) spawned += 1;
    } else if (spawnEditorItem(collection.kind, item, index, selectedItems.length, width, height)) {
      spawned += 1;
    }
  });
  draw();
  setEditorStatus("Spawned " + spawned + (all ? " entries" : " · " + (selectedItems[0]?.name || "selected item")) + " onto the game canvas.");
}

function renderEnemyTuner() {
  const active = editorPath === "../data/enemies.json";
  enemyTuner.hidden = !active;
  if (!active) return;

  let data;
  try { data = JSON.parse(editorText.value); } catch { return; }
  if (!Array.isArray(data.enemies) || !data.enemies.length) return;
  const previousSelection = enemyTunerSelect.value;
  enemyTunerSelect.replaceChildren();
  [...data.enemies]
    .sort((a, b) => String(a?.letter || "").localeCompare(String(b?.letter || "")))
    .forEach(enemy => {
      const option = document.createElement("option");
      option.value = enemy?.id || "";
      const letter = String(enemy?.letter || enemy?.id?.[0] || "?").toUpperCase();
      const name = String(enemy?.name || "Unnamed enemy");
      option.textContent = letter + " · " + name;
      enemyTunerSelect.append(option);
    });
  enemyTunerSelect.value = data.enemies.some(enemy => enemy.id === previousSelection) ? previousSelection : data.enemies[0].id;
  const enemy = data.enemies.find(entry => entry.id === enemyTunerSelect.value) || data.enemies[0];
  enemyTunerFields.replaceChildren();

  const schema = [
    { section: "IDENTITY & STATS" },
    { key: "name", label: "Enemy name", type: "text" },
    { key: "health", label: "Health", type: "number", min: 1, max: 99, step: 1 },
    { key: "speed", label: "Movement speed", type: "number", min: 0, max: 500, step: 1 },
    { key: "contactDamage", label: "Contact damage", type: "number", min: 0, max: 20, step: 1 },
    { key: "score", label: "Points", type: "number", min: 0, max: 9999, step: 5 },
    { key: "enemyColor", label: "Enemy color", type: "color" },
    { key: "behavior", label: "Movement", type: "select", options: ["drift","charge","chase","strafe","weave","bounce","swoop","orbit","stalk"] },
    { section: "ATTACK" },
    { key: "shoots", label: "Shoots at player", type: "checkbox" },
    { key: "fireRate", label: "Seconds between shots", type: "number", min: 0.25, max: 12, step: 0.05 },
    { key: "bulletType", label: "Bullet style", type: "select", options: ["dot","letter","word","ring","slash"] },
    { key: "bulletGlyph", label: "Bullet glyph", type: "text" },
    { key: "bulletSpeed", label: "Bullet speed", type: "number", min: 20, max: 900, step: 5 },
    { key: "bulletDamage", label: "Bullet damage", type: "number", min: 0, max: 20, step: 1 },
    { key: "bulletColor", label: "Bullet color", type: "color" },
    { section: "LETTER BURST" },
    { key: "explosionGlyph", label: "Burst letter", type: "text" },
    { key: "explosionCount", label: "Burst letters", type: "number", min: 2, max: 32, step: 1 },
    { key: "explosionDuration", label: "Burst duration", type: "number", min: 0.1, max: 2, step: 0.05 },
    { key: "explosionColor", label: "Burst color", type: "color" }
  ];

  schema.forEach(field => {
    if (field.section) {
      const heading = document.createElement("h4");
      heading.className = "enemy-tuner-section";
      heading.textContent = field.section;
      enemyTunerFields.append(heading);
      return;
    }
    const label = document.createElement("label");
    label.className = "enemy-tuner-field";
    const caption = document.createElement("span");
    caption.textContent = field.label;
    let control;
    if (field.type === "select") {
      control = document.createElement("select");
      field.options.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value.toUpperCase();
        control.append(option);
      });
      control.value = enemy[field.key] || field.options[0];
    } else {
      control = document.createElement("input");
      control.type = field.type;
      if (field.type === "checkbox") control.checked = Boolean(enemy[field.key]);
      else if (field.type === "color") control.value = /^#[0-9a-f]{6}$/i.test(enemy[field.key] || "") ? enemy[field.key] : "#ffffff";
      else {
        control.value = enemy[field.key] ?? "";
        if (field.type === "number") {
          control.min = field.min;
          control.max = field.max;
          control.step = field.step;
        }
      }
    }
    control.addEventListener(field.type === "select" ? "change" : "input", () => {
      const roster = parsedEditorData();
      const target = roster?.enemies?.find(entry => entry.id === enemyTunerSelect.value);
      if (!target) return;
      target[field.key] = field.type === "checkbox" ? control.checked
        : field.type === "number" ? Number(control.value)
        : control.value;
      editorText.value = JSON.stringify(roster, null, 2);
      editorText.dispatchEvent(new Event("input", { bubbles: true }));
      refreshEnemyRosterFromEditor(roster);
      renderEnemyPreview(target);
    });
    label.append(caption, control);
    enemyTunerFields.append(label);
  });
  renderEnemyPreview(enemy);
}

async function loadEditorFile(path, allowDiscard = false) {
  if (editorDirty && !allowDiscard && !window.confirm("Discard unsaved editor changes?")) {
    editorFileSelect.value = editorPath;
    return;
  }
  editorPath = path;
  editorFileSelect.value = path;
  editorFilePath.textContent = path.replace("../", "");
  editorDirty = false;
  let replacedLegacyDraft = false;
  try {
    const draftKey = editorDraftKey(path);
    const draft = localStorage.getItem(draftKey);
    if (draft !== null) {
      let useDraft = true;
      if (path === "../data/enemies.json") {
        let draftData;
        try { draftData = JSON.parse(draft); } catch { draftData = null; }
        if (!hasCompleteEnemyRoster(draftData)) {
          localStorage.setItem(EDITOR_DRAFT_PREFIX + "legacy-enemies-backup", draft);
          localStorage.removeItem(draftKey);
          useDraft = false;
          replacedLegacyDraft = true;
        }
      } else if (path === "../data/pickups.json") {
        let draftData;
        try { draftData = JSON.parse(draft); } catch { draftData = null; }
        if (Number(draftData?.version) < 2) {
          localStorage.setItem(EDITOR_DRAFT_PREFIX + "legacy-pickups-backup", draft);
          localStorage.removeItem(draftKey);
          useDraft = false;
          replacedLegacyDraft = true;
        }
      }
      if (useDraft) {
        editorText.value = draft;
        setEditorStatus("Loaded your browser-local draft. Save it as a file when ready.");
        renderEnemyTuner();
        renderSpawnTools();
        refreshCatalogFromEditor();
        try { refreshEnemyRosterFromEditor(JSON.parse(draft)); } catch {}
        editorLoaded = true;
        return;
      }
    }
  } catch {
    // Continue by loading the repository version if local storage is unavailable.
  }
  try {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.text();
    JSON.parse(data);
    editorText.value = JSON.stringify(JSON.parse(data), null, 2);
    setEditorStatus(replacedLegacyDraft
      ? path === "../data/enemies.json"
        ? "Loaded the complete A–Z roster. Your old enemy draft is backed up in this browser."
        : "Loaded the updated pickup list. Your old pickup draft is backed up in this browser."
      : "Loaded the repository version.");
    renderEnemyTuner();
    renderSpawnTools();
    refreshCatalogFromEditor();
    if (path === "../data/enemies.json") refreshEnemyRosterFromEditor(JSON.parse(data));
    editorLoaded = true;
  } catch {
    editorText.value = "";
    setEditorStatus("Could not load this file. Run the game through the local web server.");
    renderEnemyTuner();
    renderSpawnTools();
  }
}

function parsedEditorData() {
  try {
    return JSON.parse(editorText.value);
  } catch (error) {
    setEditorStatus("JSON error: " + error.message);
    return null;
  }
}

function toggleCatalogPanel(forceVisible) {
  const visible = typeof forceVisible === "boolean"
    ? forceVisible
    : document.body.classList.contains("catalog-hidden");
  document.body.classList.toggle("catalog-hidden", !visible);
  catalogToggleButton.setAttribute("aria-expanded", String(visible));
  catalogToggleButton.setAttribute("aria-label", (visible ? "Hide" : "Show") + " Dungeon Index (F6 or L1)");
  try { localStorage.setItem("bulletPoints.catalogHidden", String(!visible)); } catch {}
  requestAnimationFrame(resizeCanvas);
}

function toggleEditor(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : editorPanel.hidden;
  if (shouldOpen) {
    if (dialog.open) dialog.close();
    state.paused = true;
    state.keys.clear();
    editorPanel.hidden = false;
    document.body.classList.add("editor-open");
    if (!editorLoaded) loadEditorFile(editorFileSelect.value, true);
    editorFileSelect.focus();
  } else {
    editorPanel.hidden = true;
    document.body.classList.remove("editor-open");
    state.paused = dialog.open;
    state.keys.clear();
    state.lastTime = 0;
    menuButton.focus();
    draw();
  }
}

function saveEditorDraft() {
  if (parsedEditorData() === null) return;
  try {
    localStorage.setItem(editorDraftKey(editorPath), editorText.value);
    editorDirty = false;
    setEditorStatus("Draft saved in this browser. Download the file to keep or share it.");
  } catch {
    setEditorStatus("Browser storage unavailable. Use Download File to keep this edit.");
  }
}

function downloadEditorFile() {
  const parsed = parsedEditorData();
  if (parsed === null) return;
  const blob = new Blob([JSON.stringify(parsed, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = editorPath.replace("../data/", "").replaceAll("/", "-");
  link.click();
  URL.revokeObjectURL(url);
  editorDirty = false;
  setEditorStatus("Downloaded " + link.download + ".");
}

function resetEditorFile() {
  if (!window.confirm("Remove the local draft and reload this repository file?")) return;
  try {
    localStorage.removeItem(editorDraftKey(editorPath));
  } catch {
    // The file can still be reloaded even if browser storage is blocked.
  }
  editorDirty = false;
  loadEditorFile(editorPath, true);
}

function slotKey(slot) {
  return SLOT_PREFIX + slot;
}

function readSlot(slot) {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved run";
  return "Saved " + date.toLocaleString();
}

function saveCurrentRun(slot) {
  const previous = readSlot(slot);
  if (previous && !window.confirm(uiText.replacePrompt + slot + "?")) return;
  const snapshot = {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    player: { x: state.player.x, y: state.player.y },
    world: { ...state.world },
    theme: state.theme,
    soundEnabled: state.soundEnabled,
    controlScheme: state.controlScheme,
    health: state.health,
    maxHealth: state.maxHealth,
    lives: state.lives,
    score: state.score,
    shields: state.shields,
    weaponId: state.weaponId,
    unlockedWeapons: [...state.unlockedWeapons],
  };
  try {
    localStorage.setItem(slotKey(slot), JSON.stringify(snapshot));
    announce(uiText.savedMessage + slot + ".");
    renderSaveSlots();
  } catch {
    announce(uiText.saveFailed);
  }
}

function loadRun(slot) {
  const snapshot = readSlot(slot);
  if (!snapshot || snapshot.schemaVersion !== 1 || !snapshot.player) {
    announce(uiText.clearedMessage + slot + uiText.loadEmpty);
    return;
  }
  state.player = {
    x: Number.isFinite(snapshot.player.x) ? Math.max(0.04, Math.min(0.96, snapshot.player.x)) : 0.5,
    y: Number.isFinite(snapshot.player.y) ? Math.max(0.08, Math.min(getPlayerStartY(), snapshot.player.y)) : getPlayerStartY(),
  };
  if (snapshot.world && Number.isFinite(snapshot.world.scrollOffset)) {
    state.world = {
      scrollOffset: snapshot.world.scrollOffset,
      deathWallY: Number.isFinite(snapshot.world.deathWallY) ? snapshot.world.deathWallY : canvas.getBoundingClientRect().height - getDeathWallHeight(),
      distance: Number.isFinite(snapshot.world.distance) ? snapshot.world.distance : 0,
    };
  } else {
    const { height } = canvas.getBoundingClientRect();
    state.world = { scrollOffset: 0, deathWallY: height - roomSettings.deathWallHeight, distance: 0 };
  }
  state.gameOver = false;
  state.health = Number.isFinite(snapshot.health) ? snapshot.health : 3;
  state.maxHealth = Number.isFinite(snapshot.maxHealth) ? snapshot.maxHealth : 3;
  state.lives = Number.isFinite(snapshot.lives) ? Math.max(0, Math.min(3, snapshot.lives)) : 3;
  state.maxLives = 3;
  state.score = Number.isFinite(snapshot.score) ? Math.max(0, snapshot.score) : 0;
  state.shields = Number.isFinite(snapshot.shields) ? snapshot.shields : 0;
  state.unlockedWeapons = Array.isArray(snapshot.unlockedWeapons) ? snapshot.unlockedWeapons.filter(id => weaponList.some(weapon => weapon.id === id)) : weaponList.filter(weapon => weapon.unlockedByDefault).map(weapon => weapon.id);
  if (!state.unlockedWeapons.length) state.unlockedWeapons = [weaponList[0].id];
  state.weaponId = state.unlockedWeapons.includes(snapshot.weaponId) ? snapshot.weaponId : state.unlockedWeapons[0];
  state.pickups = [];
  state.obstacles = [];
  state.fallingBlocks = [];
  state.numberHazards = [];
  state.worldSpawnTimer = 1.5;
  state.nextWallSide = "left";
  state.effects = [];
  state.theme = snapshot.theme === "paper" ? "paper" : "neon";
  state.started = true;
  state.soundEnabled = snapshot.soundEnabled !== false;
  state.controlScheme = ["auto","keyboard","gamepad","touch"].includes(snapshot.controlScheme) ? snapshot.controlScheme : "auto";
  soundToggle.checked = state.soundEnabled;
  document.querySelector('input[name="control-scheme"][value="' + state.controlScheme + '"]').checked = true;
  applyControlScheme();
  applyTheme();
  announce(uiText.loadSuccess + slot + ".");
}

function clearSlot(slot) {
  if (!window.confirm(uiText.clearPrompt + slot + "?")) return;
  try {
    localStorage.removeItem(slotKey(slot));
    announce(uiText.clearedMessage + slot + " cleared.");
    renderSaveSlots();
  } catch {
    announce(uiText.clearFailed);
  }
}

function renderSaveSlots() {
  slotList.replaceChildren();
  for (let slot = 1; slot <= SLOT_COUNT; slot += 1) {
    const snapshot = readSlot(slot);
    const card = document.createElement("article");
    card.className = "save-slot";

    const description = document.createElement("div");
    const title = document.createElement("p");
    title.className = "slot-title";
    title.textContent = uiText.slotName.replace("{slot}", slot);
    const detail = document.createElement("p");
    detail.className = "slot-detail";
    detail.textContent = snapshot ? formatSavedAt(snapshot.savedAt) : uiText.empty;
    description.append(title, detail);

    const actions = document.createElement("div");
    actions.className = "slot-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = uiText.save;
    saveButton.addEventListener("click", () => saveCurrentRun(slot));
    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.textContent = uiText.load;
    loadButton.disabled = !snapshot;
    loadButton.addEventListener("click", () => loadRun(slot));
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = uiText.clear;
    clearButton.disabled = !snapshot;
    clearButton.addEventListener("click", () => clearSlot(slot));
    actions.append(saveButton, loadButton, clearButton);

    card.append(description, actions);
    slotList.append(card);
  }
}

async function applyMenuCopy() {
  try {
    const response = await fetch(new URL("../data/menu.json", import.meta.url));
    if (!response.ok) return;
    const menu = await response.json();
    if (menu.title) document.title = menu.title;
    Object.assign(uiText, menu.settingsMenu || {});
    if (menu.labels?.gameOver) gameOverLine = String(menu.labels.gameOver).toUpperCase();
    document.querySelector("#settings-title").textContent = uiText.title;
    menuButton.textContent = uiText.pauseSettings;
    resumeButton.textContent = uiText.resume;
    document.querySelector("#display-heading").textContent = uiText.displayHeading;
    document.querySelector("#ink-label").textContent = uiText.inkLabel;
    document.querySelector("#sound-label").textContent = uiText.soundLabel;
    document.querySelector("#font-label").textContent = uiText.fontLabel || "Game font";
    document.querySelector("#sound-note").textContent = uiText.soundNote;
    document.querySelector("#controls-heading").textContent = uiText.controlsHeading;
    document.querySelector("#auto-label").textContent = uiText.auto;
    document.querySelector("#keyboard-label").textContent = uiText.keyboard;
    document.querySelector("#gamepad-label").textContent = uiText.gamepad;
    document.querySelector("#touch-label").textContent = uiText.touch;
    document.querySelector("#touch-note").textContent = uiText.touchNote;
    document.querySelector("#slots-heading").textContent = uiText.saveSlots;
    document.querySelector("#slot-storage-note").textContent = uiText.storageNote;
    restartButton.textContent = uiText.restart;
    renderSaveSlots();
    applyTheme();
  } catch {
    // Keep the built-in labels if the menu text file is unavailable.
  }
}

bindStick(leftStick,leftStickKnob,"move");
bindStick(rightStick,rightStickKnob,"aim");
window.addEventListener("resize",()=>{applyControlScheme();applyDeathWallSettings();resizeCanvas();});
canvas.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"||["gamepad","touch"].includes(state.controlScheme))return;
  const b=canvas.getBoundingClientRect(),dx=e.clientX-b.left-b.width*state.player.x,dy=e.clientY-b.top-b.height*state.player.y,len=Math.hypot(dx,dy);
  if(len>8)input.mouseAim={x:dx/len,y:dy/len};
});
canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&["auto","keyboard"].includes(state.controlScheme))input.mouseFire=true;});
// Tap / click the field to start, or to retry after game over.
canvas.addEventListener("pointerdown", () => {
  if (dialog.open || !editorPanel.hidden) return;
  if (!state.started || (state.gameOver && state.overTime > 0.9)) startRun();
});
// Browsers keep audio muted until the first gesture; wake it up then.
window.addEventListener("pointerdown", () => sfx.unlock(), { passive: true });
window.addEventListener("keydown", () => sfx.unlock());
window.addEventListener("pointerup",e=>{if(e.pointerType==="mouse")input.mouseFire=false;});
window.addEventListener("blur",()=>{state.keys.clear();input.mouseFire=false;input.touchFire=false;input.touchMove={x:0,y:0};input.touchAim={x:0,y:0};});
window.addEventListener("keydown", (event) => {
  if (event.key === "F6" && window.matchMedia("(min-width: 901px)").matches) {
    event.preventDefault();
    toggleCatalogPanel();
    return;
  }
  if (event.key === "F8") {
    event.preventDefault();
    toggleEditor();
    return;
  }
  if (event.key === "Escape" && !editorPanel.hidden) {
    event.preventDefault();
    toggleEditor(false);
    return;
  }
  if (event.key === "Escape" && dialog.open) {
    event.preventDefault();
    resumeRun();
    return;
  }
  if (dialog.open) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
    return;
  }
  if (!editorPanel.hidden) return;
  if (state.gameOver && event.key.toLowerCase() === "r") {
    event.preventDefault();
    startRun();                                   // resets and starts a fresh run
    return;
  }
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["auto", "keyboard"].includes(state.controlScheme)) {
    if ((controlMap.keyboard.weaponPrev || ["q"]).includes(key)) { event.preventDefault(); cycleWeapon(-1); return; }
    if ((controlMap.keyboard.weaponNext || ["e"]).includes(key)) { event.preventDefault(); cycleWeapon(1); return; }
  }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(key)) event.preventDefault();
  state.keys.add(key);
});
window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  state.keys.delete(key);
});
window.addEventListener("blur", () => state.keys.clear());

catalogToggleButton.addEventListener("click", () => toggleCatalogPanel());
editorToggleButton.addEventListener("click", () => toggleEditor());
editorCloseButton.addEventListener("click", () => toggleEditor(false));
editorFileSelect.addEventListener("change", async () => {
  await loadEditorFile(editorFileSelect.value);
  renderEnemyTuner();
  renderSpawnTools();
});
editorText.addEventListener("input", () => {
  editorDirty = true;
  setEditorStatus("Unsaved edits. Check the JSON before saving your draft.");
  if (editorPath === "../data/enemies.json") {
    try {
      const data = JSON.parse(editorText.value);
      refreshEnemyRosterFromEditor(data);
      const enemy = data.enemies?.find(entry => entry.id === enemyTunerSelect.value);
      if (enemy) renderEnemyPreview(enemy);
    } catch {}
  }
  renderSpawnTools();
  refreshCatalogFromEditor();
});
enemyTunerSelect.addEventListener("change", renderEnemyTuner);
spawnSelectedButton.addEventListener("click", () => spawnEditorSelection(false));
spawnAllButton.addEventListener("click", () => spawnEditorSelection(true));
editorValidateButton.addEventListener("click", () => {
  if (parsedEditorData() !== null) setEditorStatus("JSON is valid.");
});
editorSaveButton.addEventListener("click", saveEditorDraft);
editorDownloadButton.addEventListener("click", downloadEditorFile);
editorResetButton.addEventListener("click", resetEditorFile);
menuButton.addEventListener("click", openSettings);
resumeButton.addEventListener("click", resumeRun);
closeMenuButton.addEventListener("click", resumeRun);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  resumeRun();
});
invertButton.addEventListener("click", () => {
  state.theme = state.theme === "paper" ? "neon" : "paper";   // neon <-> paper
  applyTheme();
});
fontSelect.addEventListener("change", () => applyFontTheme(fontSelect.value, true));
soundToggle.addEventListener("change", () => {
  state.soundEnabled = soundToggle.checked;
  announce(state.soundEnabled ? uiText.soundEnabled : uiText.soundMuted);
});
document.querySelectorAll('input[name="control-scheme"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    state.controlScheme = radio.value;
    applyControlScheme();
    announce(({auto:uiText.autoSelected,keyboard:uiText.keyboardSelected,gamepad:uiText.gamepadSelected,touch:uiText.touchSelected})[radio.value]);
  });
});
restartButton.addEventListener("click", () => {
  if (!window.confirm(uiText.restartPrompt)) return;
  resetRun();
  announce(uiText.restartSuccess);
});

renderSaveSlots();
// Restore the theme and best score saved in this browser.
try { state.theme = localStorage.getItem("bulletPoints.theme") === "paper" ? "paper" : "neon"; } catch {}
try { state.best = Math.max(0, Number(localStorage.getItem("bulletPoints.best")) || 0); } catch {}
applyTheme();
// Redraw once the CRT font has loaded so canvas text uses it.
document.fonts?.load?.("20px VT323").then(() => draw()).catch(() => {});
applyMenuCopy();
try { applyFontTheme(localStorage.getItem("bulletPoints.font.v2") || "crt"); } catch { applyFontTheme("crt"); }
applyControlScheme();
try {
  const catalogHidden = localStorage.getItem("bulletPoints.catalogHidden") === "true";
  if (catalogHidden) toggleCatalogPanel(false);
  else catalogToggleButton.setAttribute("aria-expanded", "true");
} catch {}
applyDeathWallSettings();
state.player.y = getPlayerStartY();
loadControlMap();
loadStartupContent();
loadWorldSettings();
loadHorizontalWallWords();
resizeCanvas();
requestAnimationFrame(update);
