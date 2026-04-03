// ============================================================
// SPIRALSIDE — GUIDE TAB v2.0
// Interactive learning system: Start Here / Tutorials / Updates / Tips / Appendix
// Overlay tutorial engine highlights real UI elements with character voice
// Nimbis anchor: js/app/views/guide.js
// ============================================================

import { state } from '../state.js';

// ── CHARACTER COLOR MAP ───────────────────────────────────────
const CHAR_COLOR = {
  sky:    '#00F6D6',
  cold:   '#4DA3FF',
  monday: '#FF4BCB',
  grit:   '#FFD93D',
  adytum: '#a78bfa',
};

// ── SECTION LABELS ────────────────────────────────────────────
const SECTIONS = ['start', 'tutorials', 'updates', 'tips', 'appendix'];
const SECTION_LABELS = {
  start:     '🌀 Start Here',
  tutorials: 'Tutorials',
  updates:   'Updates',
  tips:      'Tips',
  appendix:  'Appendix',
};

// ── GUIDE CARD DATA ───────────────────────────────────────────
const GUIDES = {
  start: [
    {
      id: 'first_run',
      title: 'Welcome to Spiralside',
      desc: 'Your AI workstation. Sky and crew are already here — let\'s show you around.',
      icon: '🌀',
      character: 'sky',
      action: 'overlay',
      overlay: 'intro',
      is_new: false,
    },
  ],
  tutorials: [
    // ── A ──
    { id: 'tut_account',    title: 'Account',          desc: 'Manage your profile, export your soul print, sign out.',                                     icon: '👤', character: 'cold',   action: 'overlay', overlay: 'account',    is_new: false },
    // ── B ──
    { id: 'tut_bloomengine',title: 'Bloom Engine',     desc: 'Generative art canvas. Character presets, FX sliders, screensaver mode. Unlock with Gold.',  icon: '🌀', character: 'sky',    action: 'overlay', overlay: 'bloomengine',is_new: false },
    { id: 'tut_bloomslice', title: 'Bloomslice',       desc: 'Laser-cut teak mounting plates. Physical Bloomcore hardware. Real world unlocks.',            icon: '🪵', character: 'grit',   action: 'overlay', overlay: 'bloomslice', is_new: false },
    // ── C ──
    { id: 'tut_chat',       title: 'Chat',             desc: 'Talk to Sky and your companions. Switch models on the fly.',                                  icon: '💬', character: 'sky',    action: 'overlay', overlay: 'chat',       is_new: false },
    { id: 'tut_code',       title: 'Code',             desc: 'AI coding assistant. Bloomcore formatter built in.',                                          icon: '</>', character: 'cold',   action: 'overlay', overlay: 'code',       is_new: false },
    { id: 'tut_codex',      title: 'Codex',            desc: 'Your cards live here. Characters, scenes, worlds — all portable. Build your canon.',          icon: '✦',  character: 'grit',   action: 'overlay', overlay: 'codex',      is_new: false },
    { id: 'tut_cut',        title: 'Cut (SpiralCut)',  desc: 'Clip-based storyboard editor. 3-row timeline — CAST, SCENE, WORLD. Route images to Imagine.', icon: '✂',  character: 'monday', action: 'overlay', overlay: 'cut',        is_new: true  },
    // ── F ──
    { id: 'tut_forge',      title: 'Forge',            desc: 'Build your own companion. Name them, shape their personality, give them a vibe.',             icon: '⚙',  character: 'grit',   action: 'overlay', overlay: 'forge',      is_new: false },
    { id: 'tut_frames',     title: 'Frames',           desc: 'SVG/PNG frame maker. Comic FX — halftone, scanlines, speed lines, ripped edges, more.',       icon: '🖼',  character: 'cold',   action: 'overlay', overlay: 'frames',     is_new: true  },
    // ── I ──
    { id: 'tut_imagine',    title: 'Imagine',          desc: 'Generate images from text. Anchor to a card for consistent style across every scene.',        icon: '🎨', character: 'sky',    action: 'overlay', overlay: 'imagine',    is_new: false },
    // ── L ──
    { id: 'tut_library',    title: 'Library',          desc: 'Panel builder and book editor. Arrange frames into books. Set one as your intro comic.',      icon: '📚', character: 'monday', action: 'overlay', overlay: 'library',    is_new: true  },
    // ── M ──
    { id: 'tut_models',     title: 'Models & Options', desc: 'Pick speed vs power. Each model has a different cost and vibe.',                              icon: '⚡', character: 'cold',   action: 'overlay', overlay: 'models',     is_new: false },
    { id: 'tut_music',      title: 'Music',            desc: 'Background music for your sessions. Bloomcore original tracks.',                              icon: '🎵', character: 'monday', action: 'overlay', overlay: 'music',      is_new: false },
    // ── P ──
    { id: 'tut_pi',         title: 'Pi',               desc: 'Raspberry Pi tools. Build cards. Blink LEDs. Learn by making.',                              icon: '🍓', character: 'grit',   action: 'overlay', overlay: 'pi',         is_new: false },
    // ── Q ──
    { id: 'tut_quest',      title: 'Quest',            desc: 'Idle DnD RPG. Mii-style avatar, Gold economy, Wandering Merchant, loot drops.',              icon: '⚔',  character: 'grit',   action: 'overlay', overlay: 'quest',      is_new: true  },
    // ── S ──
    { id: 'tut_store',      title: 'Store',            desc: 'Credits, gift codes, pricing. 1 cr = $0.00001. Transparent cost, no markup motive.',          icon: '💎', character: 'cold',   action: 'overlay', overlay: 'store',      is_new: false },
    { id: 'tut_studio',     title: 'Studio',           desc: 'Cards/Studio — create and edit character soul prints. Portrait, stats, identity, story.',     icon: '🃏', character: 'grit',   action: 'overlay', overlay: 'studio',     is_new: false },
    // ── V ──
    { id: 'tut_vault',      title: 'Vault',            desc: 'Drop files here. Your companion reads them and remembers.',                                   icon: '🗂',  character: 'cold',   action: 'overlay', overlay: 'vault',      is_new: false },
  ],
  updates: [
    { id: 'upd_frames',     title: 'Frames Tab',       desc: 'New comic frame maker. Halftone, scanlines, speed lines, ripped edges, 6 corner styles, per-side offsets.', icon: '🖼',  character: 'cold',   action: 'none', is_new: true  },
    { id: 'upd_cut',        title: 'SpiralCut',        desc: 'New storyboard editor. 3-row timeline, cast bin, gen-image pipeline routes straight to Imagine.',           icon: '✂',  character: 'monday', action: 'none', is_new: true  },
    { id: 'upd_quest',      title: 'Quest',            desc: 'New idle RPG. Gold economy, Wandering Merchant (7 items, 3 rotating daily), loot modal, idle resolve.',     icon: '⚔',  character: 'grit',   action: 'none', is_new: true  },
    { id: 'upd_library',    title: 'Library + Books',  desc: 'Panel builder ships. Build books, set one as your intro comic — it replaces Sky\'s intro on load.',         icon: '📚', character: 'monday', action: 'none', is_new: true  },
    { id: 'upd_cloudsync',  title: 'Cloud Sync',       desc: 'You card, quest char, soul prints, scenes, worlds, and style prefs now sync across devices via Supabase.',  icon: '☁',  character: 'sky',    action: 'none', is_new: true  },
    { id: 'upd_youcard',    title: 'You Card',         desc: 'Full character sheet for you — 14+ fields, injects into AI context. Renders as a CHR trading card.',        icon: '👤', character: 'sky',    action: 'none', is_new: true  },
    { id: 'upd_gifts',      title: 'Gift Credits',     desc: 'Send SPIRAL codes to friends. Buy a $5 gift or send from your balance.',                                    icon: '🎁', character: 'sky',    action: 'none', is_new: true  },
    { id: 'upd_voice',      title: 'Voice I/O',        desc: 'Mic in chat: speak instead of type. TTS toggle: Sky talks back via ElevenLabs.',                           icon: '🎤', character: 'sky',    action: 'none', is_new: true  },
    { id: 'upd_tabdrag',    title: 'Tab Reorder',      desc: 'Drag tabs to reorder them. Order saves to IDB and persists across sessions.',                               icon: '↔',  character: 'cold',   action: 'none', is_new: true  },
  ],
  tips: [
    { id: 'tip_youcard',    title: 'Fill Your You Card',     desc: 'The more you fill it in, the more Sky actually knows who she\'s talking to.',               icon: '👤', character: 'sky',   action: 'none', is_new: false },
    { id: 'tip_compare',    title: 'Compare Models',         desc: 'Same prompt, different models. Sky/4o is character-accurate. Haiku is fast. Sonnet thinks.', icon: '⚖', character: 'cold',  action: 'none', is_new: false },
    { id: 'tip_cards',      title: 'Save as Card',           desc: 'Characters, scenes, worlds — cards travel. Email one to a friend. That\'s a crossover.',     icon: '📦', character: 'grit',  action: 'none', is_new: false },
    { id: 'tip_introbook',  title: 'Set a Custom Intro',     desc: 'Build a book in Library, then set it as your intro. It plays instead of Sky\'s intro.',      icon: '📖', character: 'monday',action: 'none', is_new: false },
    { id: 'tip_vault',      title: 'Vault = Memory',         desc: 'Drop a doc in Vault. Your companion references it automatically in chat.',                    icon: '🧠', character: 'sky',   action: 'none', is_new: false },
    { id: 'tip_gold',       title: 'Gold in Quest',          desc: 'Gold unlocks things across the app — Bloom Engine presets, future unlocks. Spend wisely.',    icon: '✦',  character: 'grit',  action: 'none', is_new: false },
    { id: 'tip_frames',     title: 'Frames → Library',       desc: 'Make a frame in Frames, save it. Pull it into Library to build a book panel.',               icon: '🖼',  character: 'cold',  action: 'none', is_new: false },
    { id: 'tip_bloomcore',  title: 'Bloomcore Format',       desc: 'Every file has a Nimbis anchor. // Nimbis anchor: path/to/file.js — the comments remember.', icon: '📐', character: 'cold',  action: 'none', is_new: false },
    { id: 'tip_email',      title: 'Email is Multiplayer',   desc: 'Forward a story chapter to a friend. CC is the party system. No friend lists needed.',       icon: '📬', character: 'sky',   action: 'none', is_new: false },
  ],
  appendix: [
    { id: 'apx_city',      title: 'Spiral City',      desc: 'Population: complicated. Sky is always there — not always the point.',                                                    icon: '🏙', character: 'adytum', action: 'none', is_new: false },
    { id: 'apx_bloomcore', title: 'Bloomcore',        desc: 'A design language. A universe. A frequency. Electric cyan. Deep violet. Hot pink.',                                       icon: '🌸', character: 'adytum', action: 'none', is_new: false },
    { id: 'apx_nimbis',    title: 'Nimbis',           desc: 'Every file in Spiralside has a Nimbis anchor. Claude\'s in-project name. The comments remember.',                        icon: '🌩', character: 'adytum', action: 'none', is_new: false },
    { id: 'apx_sky',       title: 'Sky is the Sky',   desc: 'Always there. Not the point. Users build their own characters. Sky is the demo, the default, the showroom.',             icon: '☁',  character: 'sky',    action: 'none', is_new: false },
    { id: 'apx_soulprint', title: 'Soul Prints',      desc: 'A soul print is a character card. It travels with you — email, sync, download. Your character, not the platform\'s.',   icon: '🪪', character: 'sky',    action: 'none', is_new: false },
    { id: 'apx_gold',      title: 'Gold Economy',     desc: 'Gold is earned in Quest. It unlocks things across the app. Credits pay for AI. Gold pays for vibes.',                    icon: '✦',  character: 'grit',   action: 'none', is_new: false },
    { id: 'apx_dream',     title: 'The STEM Dream',   desc: 'Kid cracks open a Pi. Scans QR on Bloomslice Teak. Sky says hi. LED blinks. Build Card saved. Teacher prints it.',      icon: '🍓', character: 'grit',   action: 'none', is_new: false },
  ],
};

// ── OVERLAY SEQUENCES ──────────────────────────────────────────
const OVERLAYS = {
  intro: [
    { target: null,           title: 'Hey.',                    text: 'You found the guide. Good instinct.',                                            char: 'sky',    pos: 'center' },
    { target: 'tab-chat',     title: 'This is Chat',            text: 'Talk to me here. Or any companion you build.',                                   char: 'sky',    pos: 'bottom' },
    { target: 'tab-codex',    title: 'This is Codex',           text: 'Your characters, scenes, and worlds live here as portable cards.',               char: 'grit',   pos: 'bottom' },
    { target: 'tab-forge',    title: 'This is Forge',           text: 'Build your own companion. Give them a name. A voice. A vibe.',                   char: 'grit',   pos: 'bottom' },
    { target: 'tab-imagine',  title: 'This is Imagine',         text: 'Generate images. Anchor to a card for style consistency.',                       char: 'sky',    pos: 'bottom' },
    { target: 'tab-quest',    title: 'This is Quest',           text: 'Idle RPG lives here. Earn Gold. Spend it on unlocks across the whole app.',      char: 'grit',   pos: 'bottom' },
    { target: null,           title: "That's enough for now.",  text: 'Explore. Break things. Come back here when you\'re lost.',                       char: 'monday', pos: 'center' },
  ],
  account: [
    { target: null, title: 'Account', text: 'Sign out, export your soul print as PDF, or dump your full data as JSON.', char: 'cold', pos: 'center' },
  ],
  bloomengine: [
    { target: 'tab-bloomengine', title: 'Bloom Engine',    text: 'Generative art canvas. Pick a character preset, tweak FX sliders, go full screensaver.', char: 'sky',  pos: 'bottom' },
    { target: null,              title: 'Gold Unlocks',    text: '9 Gold unlocks live here — buy presets, effects, and more from Quest earnings.',          char: 'grit', pos: 'center' },
  ],
  bloomslice: [
    { target: 'tab-bloomslice', title: 'Bloomslice',       text: 'Laser-cut teak mounting plates for Raspberry Pi. Physical Bloomcore hardware.',         char: 'grit', pos: 'bottom' },
    { target: null,             title: 'Real Object',      text: 'This is where the digital meets the physical. $15.28 on Amazon. QR leads back here.',   char: 'grit', pos: 'center' },
  ],
  chat: [
    { target: 'tab-chat',    title: 'Chat Tab',         text: 'This is where you talk. To Sky, or whoever you built.',                                   char: 'sky',  pos: 'bottom' },
    { target: 'btn-plus',    title: 'Options',          text: 'Hit + to switch models, attach files, toggle voice, or generate an image.',               char: 'cold', pos: 'top'    },
    { target: 'btn-mic',     title: 'Voice Input',      text: 'Tap the mic and speak. Chrome and Edge support this natively.',                           char: 'sky',  pos: 'top'    },
  ],
  code: [
    { target: 'tab-code',    title: 'Code Tab',         text: 'AI coding assistant. Pick a mode — Bloomcore formatter is built in.',                     char: 'cold', pos: 'bottom' },
    { target: null,          title: 'Model Tiers',      text: 'Free, balanced, and max quality. Same chat credit system.',                               char: 'cold', pos: 'center' },
  ],
  codex: [
    { target: 'tab-codex',   title: 'Codex',            text: 'Every card you build lives here. Characters, scenes, worlds — all downloadable.',         char: 'grit', pos: 'bottom' },
    { target: null,          title: 'Soul Prints',      text: 'A soul print travels with you. Email it, sync it, import it anywhere.',                   char: 'sky',  pos: 'center' },
    { target: null,          title: 'Scenes + Worlds',  text: 'Scenes and worlds anchor your Imagine prompts for style consistency across sessions.',     char: 'grit', pos: 'center' },
  ],
  cut: [
    { target: 'tab-spiralcut', title: 'SpiralCut',      text: 'Clip-based storyboard editor. Build your story panel by panel.',                          char: 'monday', pos: 'bottom' },
    { target: null,            title: '3-Row Timeline', text: 'CAST, SCENE, WORLD — drag cards from your Codex into each row.',                          char: 'cold',   pos: 'center' },
    { target: null,            title: 'Imagine Pipeline', text: 'Send a cut clip to Imagine for gen-image. It routes automatically.',                    char: 'sky',    pos: 'center' },
  ],
  forge: [
    { target: 'tab-forge',   title: 'Forge',            text: 'Build a companion. Give them a name, personality, greeting, and tone.',                   char: 'grit', pos: 'bottom' },
    { target: null,          title: 'It\'s Yours',      text: 'Sky is the demo. Forge is where you make it yours.',                                      char: 'sky',  pos: 'center' },
  ],
  frames: [
    { target: 'tab-frames',  title: 'Frames Tab',       text: 'Make comic frames. Pick a corner style, add FX, export as SVG or PNG.',                   char: 'cold', pos: 'bottom' },
    { target: null,          title: 'Comic FX',         text: 'Halftone, scanlines, speed lines, ripped edge, panel badge, skew — all layerable.',       char: 'cold', pos: 'center' },
    { target: null,          title: 'Into Library',     text: 'Save a frame here, pull it into Library to build a full book panel.',                     char: 'grit', pos: 'center' },
  ],
  imagine: [
    { target: 'tab-imagine', title: 'Imagine Tab',      text: 'Type a prompt. Generate an image. Anchor to a card for consistency.',                     char: 'sky',  pos: 'bottom' },
    { target: null,          title: 'Card Anchoring',   text: 'Attach a character or scene card — Imagine uses it for style and visual consistency.',     char: 'cold', pos: 'center' },
  ],
  library: [
    { target: 'tab-library', title: 'Library',          text: 'Build books from panels. Arrange them on a timeline. Tell your story.',                   char: 'monday', pos: 'bottom' },
    { target: null,          title: 'Set as Intro',     text: 'Set any book as your intro comic. It plays instead of Sky\'s intro on next load.',        char: 'sky',    pos: 'center' },
  ],
  models: [
    { target: 'btn-plus',    title: 'Open Options',     text: 'This opens the full Options Panel.',                                                      char: 'cold', pos: 'top'    },
    { target: null,          title: 'Three Tiers',      text: 'Sky/4o is cheapest and most character-accurate. Haiku is fast. Sonnet thinks deepest.',   char: 'cold', pos: 'center' },
    { target: null,          title: 'Real Cost',        text: 'Cost + 17% covers hosting. No profit motive. Architect wants AI as cheap as possible.',   char: 'cold', pos: 'center' },
  ],
  music: [
    { target: 'tab-music',   title: 'Music Tab',        text: 'Bloomcore original tracks. Background for your sessions.',                                char: 'monday', pos: 'bottom' },
  ],
  pi: [
    { target: 'tab-pi',      title: 'Pi Tab',           text: 'Raspberry Pi tools. Write code, run it on Piston, save as Build Cards.',                  char: 'grit', pos: 'bottom' },
    { target: null,          title: 'The Dream',        text: 'Scan the Bloomslice QR, Sky says hi, blink an LED, print your card. That\'s it.',         char: 'grit', pos: 'center' },
  ],
  quest: [
    { target: 'tab-quest',   title: 'Quest',            text: 'Idle DnD RPG. Your avatar fights while you\'re gone. Loot drops on return.',              char: 'grit',   pos: 'bottom' },
    { target: null,          title: 'Gold Economy',     text: 'Earn Gold here. Spend it on unlocks across the whole app — Bloom Engine, more coming.',   char: 'grit',   pos: 'center' },
    { target: null,          title: 'Merchant',         text: 'Wandering Merchant shows up with 3 rotating items daily. Check in.',                      char: 'monday', pos: 'center' },
  ],
  store: [
    { target: null,          title: 'Store',            text: '1 credit = $0.00001. Transparent pricing. No markup motive.',                             char: 'cold', pos: 'center' },
    { target: null,          title: 'Gift Codes',       text: 'Send SPIRAL codes to friends. Buy a $5 gift or send from your balance.',                  char: 'sky',  pos: 'center' },
  ],
  studio: [
    { target: 'tab-studio',  title: 'Studio',           text: 'Soul print editor. Portrait, stats, identity fields, story arc — all in one card.',       char: 'grit', pos: 'bottom' },
    { target: null,          title: 'Export',           text: 'Download as JSON. Import anywhere. Your character belongs to you.',                        char: 'cold', pos: 'center' },
  ],
  vault: [
    { target: 'tab-vault',   title: 'Vault',            text: 'Drop a doc here. Your companion reads it and references it in chat.',                      char: 'cold', pos: 'bottom' },
    { target: null,          title: 'Your Data',        text: 'Nothing leaves your device unless you send it. Local first.',                              char: 'sky',  pos: 'center' },
  ],
};

// ── MODULE STATE ───────────────────────────────────────────────
let activeSection = 'start';
let overlaySteps  = [];
let overlayIdx    = 0;
const LS_PRE      = 'ss_guide_';

// ── COMPLETION HELPERS ─────────────────────────────────────────
function isDone(id)    { return localStorage.getItem(LS_PRE + id) === '1'; }
function markDone(id)  { localStorage.setItem(LS_PRE + id, '1'); }

// ── INJECT CSS (once) ──────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('guide-styles')) return;
  const s = document.createElement('style');
  s.id = 'guide-styles';
  s.textContent = `
    /* ── GUIDE SHELL ── */
    #view-guide.active { flex-direction:column; overflow:hidden; flex:1; }

    /* Section pills */
    .guide-sections {
      display:flex; gap:6px; padding:12px 16px 0;
      overflow-x:auto; flex-shrink:0; scrollbar-width:none;
    }
    .guide-sections::-webkit-scrollbar { display:none; }
    .guide-section-pill {
      flex-shrink:0; padding:6px 14px;
      background:var(--surface); border:1px solid var(--border);
      border-radius:20px; color:var(--subtext);
      font-family:var(--font-ui); font-size:0.65rem;
      letter-spacing:0.08em; cursor:pointer;
      transition:all 0.2s; white-space:nowrap;
    }
    .guide-section-pill.active {
      background:rgba(124,106,247,0.15);
      border-color:var(--accent); color:var(--accent);
    }

    /* Card list */
    .guide-cards {
      flex:1; min-height:0; overflow-y:auto;
      padding:14px 16px calc(14px + var(--safe-bot));
      display:flex; flex-direction:column; gap:10px;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:thin; scrollbar-color:var(--muted) transparent;
    }
    .guide-cards::-webkit-scrollbar { width:3px; }
    .guide-cards::-webkit-scrollbar-thumb { background:var(--muted); border-radius:2px; }

    /* Hero block */
    .guide-hero {
      padding:20px 16px; text-align:center;
      background:linear-gradient(135deg, rgba(124,106,247,0.12) 0%, rgba(247,106,138,0.08) 100%);
      border:1px solid rgba(124,106,247,0.2); border-radius:14px;
    }
    .guide-hero-icon   { font-size:2rem; margin-bottom:8px; }
    .guide-hero-title  {
      font-family:var(--font-display); font-weight:800; font-size:1.05rem; margin-bottom:6px;
      background:linear-gradient(135deg,var(--accent),var(--accent2));
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .guide-hero-desc  { font-size:0.74rem; color:var(--subtext); line-height:1.6; margin-bottom:14px; }
    .guide-hero-btn   {
      padding:10px 24px;
      background:linear-gradient(135deg,var(--accent),var(--accent2));
      border:none; border-radius:20px; color:#fff;
      font-family:var(--font-display); font-weight:700;
      font-size:0.8rem; cursor:pointer; letter-spacing:0.04em; transition:opacity 0.2s;
    }
    .guide-hero-btn:hover { opacity:0.85; }

    /* Guide card */
    .guide-card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:14px; padding:14px 16px;
      display:flex; align-items:flex-start; gap:12px;
      cursor:pointer; transition:border-color 0.2s, transform 0.15s;
      position:relative; overflow:hidden;
    }
    .guide-card:hover  { border-color:var(--accent); transform:translateY(-1px); }
    .guide-card.done   { opacity:0.55; }
    .guide-card.done:hover { opacity:0.8; }

    /* Left accent bar */
    .guide-card::before {
      content:''; position:absolute; left:0; top:12px; bottom:12px;
      width:3px; border-radius:0 2px 2px 0;
      background:var(--accent); opacity:0; transition:opacity 0.2s;
    }
    .guide-card:hover::before { opacity:1; }

    .guide-card-icon {
      width:38px; height:38px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:1.1rem;
    }
    .guide-card-body  { flex:1; min-width:0; }
    .guide-card-title {
      font-size:0.82rem; font-weight:600; color:var(--text);
      font-family:var(--font-display); margin-bottom:3px;
      display:flex; align-items:center; gap:8px;
    }
    .guide-card-desc  { font-size:0.72rem; color:var(--subtext); line-height:1.5; }
    .guide-card-char  { font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; margin-top:6px; }
    .guide-card-arrow {
      flex-shrink:0; align-self:center;
      width:28px; height:28px; border-radius:50%;
      border:1px solid var(--border); background:transparent;
      display:flex; align-items:center; justify-content:center;
      color:var(--subtext); transition:all 0.2s;
    }
    .guide-card:hover .guide-card-arrow { border-color:var(--accent); color:var(--accent); background:rgba(124,106,247,0.1); }

    .guide-badge-new  { background:var(--accent2); color:#fff; font-size:0.5rem; letter-spacing:0.1em; padding:2px 6px; border-radius:10px; text-transform:uppercase; font-weight:700; }
    .guide-badge-done { font-size:0.75rem; }

    .guide-empty { text-align:center; padding:40px 20px; color:var(--subtext); font-size:0.78rem; }
  `;
  document.head.appendChild(s);
}

// ── RENDER ─────────────────────────────────────────────────────
export function renderGuide() {
  const el = document.getElementById('view-guide');
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;height:100%">
    <div class="guide-sections">
      ${SECTIONS.map(s => `
        <button class="guide-section-pill ${s === activeSection ? 'active' : ''}"
                onclick="window.__guideSection('${s}')">${SECTION_LABELS[s]}</button>
      `).join('')}
    </div>
    <div class="guide-cards">${buildSection(activeSection)}</div>
    </div>
  `;
}

function buildSection(sec) {
  const cards = GUIDES[sec] || [];
  if (!cards.length) return '<div class="guide-empty">Nothing here yet.</div>';

  let html = '';

  // Hero block only on Start Here
  if (sec === 'start') {
    html += `
      <div class="guide-hero">
        <div class="guide-hero-icon">🌀</div>
        <div class="guide-hero-title">Welcome to Spiralside</div>
        <div class="guide-hero-desc">
          Your AI workstation. Sky and crew are here.<br>
          This guide teaches by showing — not by walls of text.
        </div>
        <button class="guide-hero-btn" onclick="window.__guideOverlay('intro','first_run')">
          run intro tour
        </button>
      </div>
    `;
  }

  html += cards.map(c => {
    const done  = isDone(c.id);
    const color = CHAR_COLOR[c.character] || '#7c6af7';
    return `
      <div class="guide-card ${done ? 'done' : ''}"
           onclick="window.__guideTap('${c.id}','${c.action}','${c.overlay || ''}')">
        <div class="guide-card-icon" style="background:${color}22;color:${color}">${c.icon}</div>
        <div class="guide-card-body">
          <div class="guide-card-title">
            ${c.title}
            ${c.is_new && !done ? '<span class="guide-badge-new">NEW</span>' : ''}
            ${done ? '<span class="guide-badge-done" style="color:#6af7c8">✓</span>' : ''}
          </div>
          <div class="guide-card-desc">${c.desc}</div>
          <div class="guide-card-char" style="color:${color}">${c.character}</div>
        </div>
        ${c.action !== 'none' ? `
          <div class="guide-card-arrow">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return html;
}

// ── WINDOW HANDLERS ────────────────────────────────────────────
window.__guideSection = (sec) => {
  activeSection = sec;
  renderGuide();
};

window.__guideTap = (id, action, overlayKey) => {
  markDone(id);
  if (action === 'overlay' && overlayKey && OVERLAYS[overlayKey]) {
    startOverlay(overlayKey);
  }
  renderGuide();
};

window.__guideOverlay = (overlayKey, cardId) => {
  if (cardId) markDone(cardId);
  startOverlay(overlayKey);
  renderGuide();
};

// ── OVERLAY ENGINE ─────────────────────────────────────────────
function startOverlay(key) {
  const steps = OVERLAYS[key];
  if (!steps?.length) return;
  overlaySteps = steps;
  overlayIdx   = 0;
  showStep();
}

async function showStep() {
  clearOverlay();
  if (overlayIdx >= overlaySteps.length) return;

  const step  = overlaySteps[overlayIdx];
  const color = CHAR_COLOR[step.char] || '#7c6af7';
  const isLast = overlayIdx === overlaySteps.length - 1;

  // Dim layer
  const dim = document.createElement('div');
  dim.id = 'guide-dim';
  dim.style.cssText = 'position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,0.65);';
  document.body.appendChild(dim);

  // Highlight target
  let rect = null;
  if (step.target) {
    const el = document.getElementById(step.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      // small delay so scroll settles before we measure rect
      await new Promise(r => setTimeout(r, 120));
      rect = el.getBoundingClientRect();
      el.style.position  = 'relative';
      el.style.zIndex    = '7100';
      el.style.boxShadow = `0 0 0 3px ${color}, 0 0 0 7px rgba(0,0,0,0.5)`;
      el.style.borderRadius = '8px';
      el.dataset.ghl = '1';
    }
  }

  // Tooltip
  const tip = document.createElement('div');
  tip.id = 'guide-tip';
  tip.style.cssText = `
    position:fixed; z-index:7200;
    background:rgba(16,16,20,0.97);
    border:1px solid ${color}55;
    border-radius:14px; padding:18px;
    width:min(320px, calc(100vw - 32px));
    box-shadow:0 0 40px ${color}2a;
    font-family:'DM Mono',monospace;
    max-height:60vh; overflow-y:auto;
    scrollbar-width:thin; scrollbar-color:rgba(243,247,255,0.15) transparent;
  `;
  tip.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="width:7px;height:7px;border-radius:50%;background:${color};"></div>
      <span style="font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:${color};font-weight:700;">${step.char}</span>
      <span style="margin-left:auto;font-size:0.58rem;color:rgba(243,247,255,0.3);">${overlayIdx + 1} / ${overlaySteps.length}</span>
    </div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1rem;color:#F3F7FF;margin-bottom:6px;">${step.title}</div>
    <div style="font-size:0.78rem;line-height:1.65;color:rgba(243,247,255,0.72);margin-bottom:14px;">${step.text}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="g-skip" style="padding:7px 14px;background:transparent;border:1px solid rgba(243,247,255,0.18);border-radius:20px;color:rgba(243,247,255,0.4);font-family:'DM Mono',monospace;font-size:0.62rem;cursor:pointer;letter-spacing:0.06em;">skip</button>
      <button id="g-next" style="padding:7px 18px;background:${color};border:none;border-radius:20px;color:#101014;font-family:'Syne',sans-serif;font-weight:700;font-size:0.72rem;cursor:pointer;">${isLast ? 'done' : 'next →'}</button>
    </div>
  `;
  document.body.appendChild(tip);

  // Position tooltip
  positionTip(tip, rect, step.pos, step.target);

  document.getElementById('g-next').onclick = () => { overlayIdx++; clearHighlights(); showStep(); };
  document.getElementById('g-skip').onclick = () => { clearHighlights(); clearOverlay(); };
}

function positionTip(tip, rect, pos, targetId) {
  requestAnimationFrame(() => {
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left, top;

    // Tab bar elements live in a scrollable row — always center the tooltip
    // so it never snaps to an off-screen position after scrollIntoView
    const isTab = targetId && targetId.startsWith('tab-');
    if (!rect || pos === 'center' || isTab) {
      left = (vw - tw) / 2;
      top  = (vh - th) / 2;
    } else {
      left = rect.left + rect.width / 2 - tw / 2;
      top  = pos === 'top' ? rect.top - th - 14 : rect.bottom + 14;
    }

    tip.style.left = Math.round(Math.max(8, Math.min(left, vw - tw - 8))) + 'px';
    tip.style.top  = Math.round(Math.max(8, Math.min(top,  vh - th - 8))) + 'px';
  });
}

function clearHighlights() {
  document.querySelectorAll('[data-ghl]').forEach(el => {
    el.style.zIndex    = '';
    el.style.boxShadow = '';
    delete el.dataset.ghl;
  });
}

function clearOverlay() {
  document.getElementById('guide-dim')?.remove();
  document.getElementById('guide-tip')?.remove();
  clearHighlights();
}

// ── PUBLIC INIT ────────────────────────────────────────────────
export function initGuide() {
  injectCSS();
  renderGuide();
}
