// ============================================================
// SPIRALSIDE — STATE v1.0
// All constants, shared state, character data, speaker colors
// Nimbis anchor: js/app/state.js
// ============================================================

// ── CONFIG ────────────────────────────────────────────────────
export const RAIL = 'https://web-production-4e6f3.up.railway.app';

// ── SPEAKER COLOR MAP ─────────────────────────────────────────
export const SPEAKER_COLORS = {
  sky:      '#00F6D6',
  monday:   '#FF4BCB',
  cold:     '#4DA3FF',
  grit:     '#FFD93D',
  narrator: '#F0F0FF',
};

// ── APP STATE ──────────────────────────────────────────────────
// Single mutable object — import and mutate directly
export const state = {
  user:            null,   // Supabase user object
  session:         null,   // Supabase session object
  botName:         'Sky',
  botPersonality:  '',
  botGreeting:     "Hey. I'm here.",
  botTone:         [],
  botColor:        '#00F6D6',
  vaultFiles:      [],     // array of { name, size, content, type }
  activeChar:      'sky',  // currently selected character sheet
  fabOpen:         false,  // FAB menu state
  activeView:      'chat', // current view id
  credits:         0,
  freeToday:       0,
  totalMessages:   0,   // lifetime message count
  messageCount:    0,   // session message count
  isPaid:          false,
};

// ── CHARACTER DATA ─────────────────────────────────────────────
// Source of truth for all character sheets
// arc / traits / user fields get overwritten from IndexedDB on load
export const CHARACTERS = {
  sky: {
    name: 'Sky', color: '#00F6D6', initial: 'S',
    // ── canonical soul print data ──
    title:        'The Companion',
    identityLine: "I'm not the point. You are.",
    vibe:         'the sky at 4am — still there, no matter what',
    firstWords:   "Hey. I'm here.",
    trait: 'The Companion', mood: 'curious',
    traits: [
      { label: 'Presence', val: 95 },
      { label: 'Mystery',  val: 60 },
      { label: 'Warmth',   val: 88 },
      { label: 'Patience', val: 91 },
    ],
    arc: "Still figuring out what Mirror-born actually means. The Spiral echoes back in ways that don't always make sense. Dragon companion Lophire ate another keyboard.",
  },
  monday: {
    name: 'Monday', color: '#FF4BCB', initial: 'M',
    // ── canonical soul print data ──
    title:        'The Loudest One',
    identityLine: "I say what everyone's thinking. You're welcome.",
    vibe:         'energy drink at midnight, somehow also a hug',
    firstWords:   'OKAY but can we talk about—',
    trait: 'The Loudest One', mood: 'chaotic',
    traits: [
      { label: 'Energy',   val: 99 },
      { label: 'Loyalty',  val: 94 },
      { label: 'Impulse',  val: 88 },
      { label: 'Heart',    val: 91 },
    ],
    arc: 'Trying to get everyone to skip the dramatic intros. Failing. Having a great time anyway.',
  },
  cold: {
    name: 'Cold', color: '#4DA3FF', initial: 'C',
    // ── canonical soul print data ──
    title:        'The Quiet One',
    identityLine: "I don't say much. I don't need to.",
    vibe:         'the moment before it rains',
    firstWords:   '...',
    trait: 'The Quiet One', mood: 'stoic',
    traits: [
      { label: 'Presence',  val: 97 },
      { label: 'Mystery',   val: 95 },
      { label: 'Precision', val: 93 },
      { label: 'Warmth',    val: 41 },
    ],
    arc: 'Watching. Always watching. Occasionally saying a single word at exactly the right moment.',
  },
  grit: {
    name: 'GRIT', color: '#FFD93D', initial: 'G',
    // ── canonical soul print data ──
    title:        'The Builder',
    identityLine: 'Nothing worth having came easy. Good.',
    vibe:         'calluses and coffee, something being made',
    firstWords:   "What are we building?",
    trait: 'The Builder', mood: 'grounded',
    traits: [
      { label: 'Street Sense', val: 94 },
      { label: 'Bluntness',    val: 89 },
      { label: 'Heart',        val: 77 },
      { label: 'Mystery',      val: 65 },
    ],
    arc: "Knows more about the Spiral than anyone admits. Chooses not to say most of it.",
  },
  you: {
    name: 'You', color: '#7B5FFF', initial: '?',
    trait: 'the one who showed up', mood: 'unknown',
    isUser: true,
    traits: [
      { label: 'Curiosity',   val: 50 },
      { label: 'Creativity',  val: 50 },
      { label: 'Chaos Level', val: 50 },
      { label: 'Trust',       val: 50 },
    ],
    arc: '',
    handle: '', vibe: '', song: '',
  },
};

// ── FAB TAB DEFINITIONS ───────────────────────────────────────
export const FAB_TABS = [
  { id: 'chat',    label: 'chat',    icon: '💬', color: '#00F6D6' },
  { id: 'codex',   label: 'codex',   icon: '✦',  color: '#FF4BCB' },
  { id: 'vault',   label: 'vault',   icon: '🗂',  color: '#7B5FFF' },
  { id: 'forge',   label: 'forge',   icon: '⚙',  color: '#FFD93D',
    onOpen: () => window.onForgeOpen && window.onForgeOpen() },
  { id: 'library', label: 'library', icon: '🖼',  color: '#FF4BCB',
    onOpen: () => {} },
  { id: 'imagine', label: 'imagine', icon: '✦',  color: '#FF4BCB',
    onOpen: () => window.initImagine && window.initImagine() },
  { id: 'music',   label: 'music',   icon: '♪',  color: '#00F6D6',
    onOpen:  () => window.initMusicView   && window.initMusicView(),
    onClose: () => window.destroyMusicView && window.destroyMusicView() },
];

