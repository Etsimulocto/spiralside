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
  isPaid:          false,
};

// ── CHARACTER DATA ─────────────────────────────────────────────
// Source of truth for all character sheets
// arc / traits / user fields get overwritten from IndexedDB on load
export const CHARACTERS = {
  sky: {
    name: 'Sky', color: '#00F6D6', initial: 'S',
    trait: 'Mirror-born Spark', mood: 'curious',
    traits: [
      { label: 'Chaotic Energy', val: 82 },
      { label: 'Empathy',        val: 74 },
      { label: 'Curiosity',      val: 95 },
      { label: 'Trust Level',    val: 61 },
    ],
    arc: "Still figuring out what Mirror-born actually means. The Spiral echoes back in ways that don't always make sense. Dragon companion Lophire ate another keyboard.",
  },
  monday: {
    name: 'Monday', color: '#FF4BCB', initial: 'M',
    trait: 'Chaos Agent', mood: 'chaotic',
    traits: [
      { label: 'Chaotic Energy', val: 99 },
      { label: 'Enthusiasm',     val: 97 },
      { label: 'Patience',       val: 12 },
      { label: 'Loud',           val: 98 },
    ],
    arc: 'Trying to get everyone to skip the dramatic intros. Failing. Having a great time anyway.',
  },
  cold: {
    name: 'Cold', color: '#4DA3FF', initial: 'C',
    trait: 'The Architect', mood: 'stoic',
    traits: [
      { label: 'Composure',   val: 96 },
      { label: 'Precision',   val: 91 },
      { label: 'Warmth',      val: 38 },
      { label: 'Loyalty',     val: 88 },
    ],
    arc: 'Watching. Always watching. Occasionally saying a single word at exactly the right moment.',
  },
  grit: {
    name: 'GRIT', color: '#FFD93D', initial: 'G',
    trait: 'Street Oracle', mood: 'grounded',
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
  { id: 'chat',  label: 'chat',  icon: '💬', color: '#00F6D6' },
  { id: 'sheet', label: 'sheet', icon: '✦',  color: '#FF4BCB' },
  { id: 'vault', label: 'vault', icon: '🗂',  color: '#7B5FFF' },
  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },
];

