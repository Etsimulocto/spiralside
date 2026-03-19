// ============================================================
// SPIRALSIDE — MODEL SELECTOR v1.0
// Handles model selection, input menu state, credit display
// All model UI logic lives here — no inline script needed
// Nimbis anchor: js/app/models.js
// ============================================================

// ── STATE ─────────────────────────────────────────────────
export let selectedModel = 'haiku';
let inputMenuOpen = false;

// ── MODEL COSTS ───────────────────────────────────────────
export const MODEL_COSTS = {
  haiku:  1,
  '4o':   2,
  sonnet: 6,
};

// ── SELECT MODEL ──────────────────────────────────────────
export function selectModel(m) {
  selectedModel = m;
  window.selectedModel = m;
  updateInputMenu();
}

// ── TOGGLE INPUT MENU ─────────────────────────────────────
export function toggleInputMenu() {
  inputMenuOpen = !inputMenuOpen;
  const menu = document.getElementById('input-menu');
  if (!menu) return;
  menu.classList.toggle('open', inputMenuOpen);
  if (inputMenuOpen) {
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        const menu = document.getElementById('input-menu');
        const btn  = document.getElementById('plus-btn');
        if (menu && btn && !menu.contains(e.target) && e.target !== btn) {
          inputMenuOpen = false;
          menu.classList.remove('open');
        }
        document.removeEventListener('click', handler);
      });
    }, 10);
  }
}

// ── UPDATE INPUT MENU ─────────────────────────────────────
export function updateInputMenu() {
  const m = selectedModel || 'haiku';
  ['haiku', '4o', 'sonnet'].forEach(id => {
    const btn = document.getElementById('iopt-' + id);
    if (btn) btn.classList.toggle('active', m === id);
  });
  // hide model options for free users
  const section = document.getElementById('input-menu-models');
  if (section) section.style.display = window._isPaid ? 'flex' : 'none';
}

// ── EXPOSE TO WINDOW ──────────────────────────────────────
// Called from onclick attributes in index.html
window.selectModel      = selectModel;
window.toggleInputMenu  = toggleInputMenu;
window.updateInputMenu  = updateInputMenu;
window.selectedModel    = selectedModel;
