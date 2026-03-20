// ============================================================
// SPIRALSIDE — FORGE VIEW v1.0
// Soul print builder — renders form HTML, delegates to build.js
// Converted from inline index.html to module pattern
// Nimbis anchor: js/app/views/forge.js
// ============================================================

import { initBuild } from '../build.js';

// ── INIT ─────────────────────────────────────────────────────
// Stamps full forge form HTML into #view-forge on first visit.
// Guard: data-initialized prevents double-render.
export function initForgeView() {
  const el = document.getElementById('view-forge');
  if (!el || el.dataset.initialized) return;
  el.dataset.initialized = '1';

  // Make view-forge itself the scroll container
  el.style.cssText = "overflow-y:auto;-webkit-overflow-scrolling:touch;";
  el.innerHTML = `
  <div style="padding:16px 16px calc(80px + var(--safe-bot));">

    <!-- IDENTITY -->
    <div class="forge-section">
      <div class="forge-section-header" onclick="toggleForgeSection('identity')">
        <span class="forge-section-icon" id="forge-icon-identity">&#x25BE;</span>
        <span class="forge-section-title">identity</span>
      </div>
      <div class="forge-section-body" id="forge-body-identity">
        <div class="forge-field"><label class="forge-label">name</label>
          <input class="forge-input" id="bot-name" placeholder="what are they called?" /></div>
        <div class="forge-field"><label class="forge-label">title / role</label>
          <input class="forge-input" id="forge-title" placeholder="The Quiet One, Street Oracle..." /></div>
        <div class="forge-field"><label class="forge-label">identity line</label>
          <input class="forge-input" id="forge-identity-line" placeholder="one line. their whole deal." /></div>
        <div class="forge-field"><label class="forge-label">vibe</label>
          <input class="forge-input" id="forge-vibe" placeholder="the sky at 4am" /></div>
        <div class="forge-field"><label class="forge-label">first words</label>
          <input class="forge-input" id="bot-greeting" placeholder="what do they say first?" /></div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">pronouns</label>
            <input class="forge-input" id="forge-pronouns" placeholder="she/her" /></div>
          <div class="forge-field forge-half"><label class="forge-label">species / type</label>
            <input class="forge-input" id="forge-species" placeholder="human, AI, cryptid..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">age</label>
            <input class="forge-input" id="forge-age" placeholder="ageless" /></div>
          <div class="forge-field forge-half"><label class="forge-label">alignment</label>
            <input class="forge-input" id="forge-alignment" placeholder="chaotic good" /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">origin</label>
            <input class="forge-input" id="forge-origin" placeholder="Spiral City" /></div>
          <div class="forge-field forge-half"><label class="forge-label">occupation</label>
            <input class="forge-input" id="forge-occupation" placeholder="what do they do?" /></div>
        </div>
      </div>
    </div>

    <!-- APPEARANCE -->
    <div class="forge-section">
      <div class="forge-section-header" onclick="toggleForgeSection('appearance')">
        <span class="forge-section-icon" id="forge-icon-appearance">&#x25B8;</span>
        <span class="forge-section-title">appearance</span>
      </div>
      <div class="forge-section-body" id="forge-body-appearance" style="display:none">
        <div class="forge-field">
          <label class="forge-label">portrait / art</label>
          <div style="display:flex;gap:8px;margin-bottom:6px">
            <button class="forge-gen-btn" onclick="window.handleForgeGenImg()"
              style="flex:1;padding:9px;background:linear-gradient(135deg,var(--teal),var(--purple));border:none;border-radius:8px;color:#fff;font-family:var(--font-display);font-weight:700;font-size:0.75rem;cursor:pointer">
              generate from fields
            </button>
            <button onclick="document.getElementById('forge-portrait-input').click()"
              style="padding:9px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer">
              upload
            </button>
          </div>
          <div id="forge-portrait-wrap"
            style="border:2px dashed var(--border);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:border-color 0.2s;margin-bottom:4px;position:relative;overflow:hidden;min-height:80px;display:flex;align-items:center;justify-content:center;"
            onclick="document.getElementById('forge-portrait-input').click()">
            <img id="forge-portrait-preview"
              style="display:none;max-width:100%;max-height:160px;border-radius:8px;object-fit:cover;" />
            <span id="forge-portrait-hint"
              style="font-size:0.72rem;color:var(--subtext);letter-spacing:0.06em">tap to upload portrait</span>
          </div>
          <input type="file" id="forge-portrait-input" accept="image/*"
            style="display:none" onchange="handlePortraitUpload(this)" />
        </div>
        <div class="forge-field"><label class="forge-label">appearance description</label>
          <textarea class="forge-input" id="forge-appearance" rows="3"
            placeholder="describe how they look..."></textarea></div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">hair</label>
            <input class="forge-input" id="forge-hair" placeholder="long silver..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">eyes</label>
            <input class="forge-input" id="forge-eyes" placeholder="glowing teal..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">style / clothing</label>
            <input class="forge-input" id="forge-style" placeholder="tactical hoodie..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">distinguishing marks</label>
            <input class="forge-input" id="forge-marks" placeholder="spiral tattoo..." /></div>
        </div>
        <div class="forge-field"><label class="forge-label">color theme</label>
          <input class="forge-input" id="forge-color-theme" placeholder="teal + void black + silver" /></div>
      </div>
    </div>

    <!-- PERSONALITY -->
    <div class="forge-section">
      <div class="forge-section-header" onclick="toggleForgeSection('personality')">
        <span class="forge-section-icon" id="forge-icon-personality">&#x25BE;</span>
        <span class="forge-section-title">personality</span>
      </div>
      <div class="forge-section-body" id="forge-body-personality">
        <div class="forge-field"><label class="forge-label">personality</label>
          <textarea class="forge-input" id="bot-personality" rows="3"
            placeholder="describe how they think, speak, feel..."></textarea></div>
        <div class="forge-field"><label class="forge-label">temperament</label>
          <input class="forge-input" id="forge-temperament" placeholder="hot-headed, calm, unpredictable..." /></div>
        <div class="forge-field"><label class="forge-label">strengths</label>
          <input class="forge-input" id="forge-strengths" placeholder="what are they great at?" /></div>
        <div class="forge-field"><label class="forge-label">weaknesses</label>
          <input class="forge-input" id="forge-weaknesses" placeholder="what trips them up?" /></div>
        <div class="forge-field"><label class="forge-label">fears</label>
          <input class="forge-input" id="forge-fears" placeholder="what keeps them up at night?" /></div>
        <div class="forge-field"><label class="forge-label">motivations</label>
          <input class="forge-input" id="forge-motivations" placeholder="what drives them?" /></div>
        <div class="forge-field"><label class="forge-label">tone</label>
          <div class="tone-grid" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
            <button class="tone-chip" data-tone="warm">warm</button>
            <button class="tone-chip" data-tone="direct">direct</button>
            <button class="tone-chip" data-tone="curious">curious</button>
            <button class="tone-chip" data-tone="playful">playful</button>
            <button class="tone-chip" data-tone="stoic">stoic</button>
            <button class="tone-chip" data-tone="poetic">poetic</button>
            <button class="tone-chip" data-tone="chaotic">chaotic</button>
            <button class="tone-chip" data-tone="fierce">fierce</button>
          </div>
        </div>
      </div>
    </div>

    <!-- BACKGROUND -->
    <div class="forge-section">
      <div class="forge-section-header" onclick="toggleForgeSection('background')">
        <span class="forge-section-icon" id="forge-icon-background">&#x25B8;</span>
        <span class="forge-section-title">background</span>
      </div>
      <div class="forge-section-body" id="forge-body-background" style="display:none">
        <div class="forge-field"><label class="forge-label">backstory</label>
          <textarea class="forge-input" id="forge-backstory" rows="4"
            placeholder="where did they come from? what shaped them?"></textarea></div>
        <div class="forge-field"><label class="forge-label">current arc</label>
          <textarea class="forge-input" id="forge-arc" rows="2"
            placeholder="what is happening in their story right now?"></textarea></div>
        <div class="forge-field"><label class="forge-label">affiliations</label>
          <input class="forge-input" id="forge-affiliations"
            placeholder="groups, factions, crews they belong to" /></div>
      </div>
    </div>

    <!-- STATS -->
    <div class="forge-section">
      <div class="forge-section-header" onclick="toggleForgeSection('stats')">
        <span class="forge-section-icon" id="forge-icon-stats">&#x25B8;</span>
        <span class="forge-section-title">stats</span>
      </div>
      <div class="forge-section-body" id="forge-body-stats" style="display:none">
        <div id="forge-stat-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:12px"></div>
        <button id="forge-add-stat" style="width:100%;padding:10px;background:var(--surface2);border:1px dashed var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.75rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s">
          + add stat (max 10)
        </button>
      </div>
    </div>

    <!-- FLAVOR -->
    <div class="forge-section">
      <div class="forge-section-header" onclick="toggleForgeSection('flavor')">
        <span class="forge-section-icon" id="forge-icon-flavor">&#x25B8;</span>
        <span class="forge-section-title">flavor</span>
      </div>
      <div class="forge-section-body" id="forge-body-flavor" style="display:none">
        <div class="forge-field"><label class="forge-label">catchphrase</label>
          <input class="forge-input" id="forge-catchphrase" placeholder="something they always say" /></div>
        <div class="forge-field"><label class="forge-label">personal motto</label>
          <input class="forge-input" id="forge-motto" placeholder="what do they live by?" /></div>
        <div class="forge-field"><label class="forge-label">theme song</label>
          <input class="forge-input" id="forge-theme-song" placeholder="the song that IS them" /></div>
        <div class="forge-field"><label class="forge-label">hobbies</label>
          <input class="forge-input" id="forge-hobbies" placeholder="what do they do for fun?" /></div>
      </div>
    </div>

    <!-- CARD PREVIEW -->
    <div id="forge-card-preview" style="margin-bottom:16px;display:none;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:0.6rem;letter-spacing:0.12em;color:var(--subtext);text-transform:uppercase;margin-bottom:12px">card preview</div>
      <div id="forge-card-canvas-wrap"></div>
      <button id="forge-download-card-btn" style="margin-top:12px;width:100%;padding:11px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--teal);font-family:var(--font-ui);font-size:0.78rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s">
        download card (.png)
      </button>
    </div>

    <!-- CREATE CARD -->
    <button id="create-card-btn" style="width:100%;padding:13px;margin-bottom:8px;background:linear-gradient(135deg,var(--teal),var(--purple));border:none;border-radius:12px;color:#fff;font-family:var(--font-display);font-weight:700;font-size:0.88rem;cursor:pointer;letter-spacing:0.04em;transition:opacity 0.2s;opacity:0.9">
      create card
    </button>

    <!-- SAVE -->
    <button id="save-bot-btn" style="width:100%;padding:14px;margin-top:8px;background:linear-gradient(135deg,var(--teal),var(--purple));border:none;border-radius:12px;color:#fff;font-family:var(--font-display);font-weight:700;font-size:0.9rem;cursor:pointer;letter-spacing:0.04em;transition:opacity 0.2s">
      save companion
    </button>

  </div>
  `;

  // Hand off all wiring to build.js (tone chips, save, card, stats, portrait, generate)
  initBuild();
}
