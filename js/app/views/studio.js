// ============================================================
// SPIRALSIDE — STUDIO VIEW v1.0
// Scene + World card builder — renders into view-studio
// Uses same forge-section/forge-field pattern as build.js
// Nimbis anchor: js/app/views/studio.js
// ============================================================

import { dbSet, dbGetAll, dbDelete } from '../db.js';
import { renderSceneCard, renderWorldCard, generateCardId } from '../card.js';

let initialized = false;
let scenes = [];
let worlds = [];
let activeTab = 'scenes';
let _sceneImgData = null;
let _worldImgData = null;
let _sceneEditId  = null;
let _worldEditId  = null;

export async function initStudioView() {
  const el = document.getElementById('view-studio');
  if (!el) return;

  if (!initialized) {
    el.innerHTML = `
      <div style="overflow-y:auto;height:100%;padding-bottom:80px;-webkit-overflow-scrolling:touch;">

        <!-- STUDIO TABS -->
        <div style="display:flex;gap:6px;padding:16px 16px 0">
          <button class="studio-tab active" data-tab="scenes"
            onclick="window._studioSwitchTab('scenes')"
            style="flex:1;padding:9px;background:var(--surface);border:1px solid var(--teal);
            border-radius:8px;color:var(--teal);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer">
            🎬 scenes
          </button>
          <button class="studio-tab" data-tab="worlds"
            onclick="window._studioSwitchTab('worlds')"
            style="flex:1;padding:9px;background:var(--surface);border:1px solid var(--border);
            border-radius:8px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer">
            🌐 worlds
          </button>
        </div>

        <!-- SCENE PANEL -->
        <div id="studio-scene-panel" style="padding:16px">
          <div class="forge-section">
            <div class="forge-section-header" onclick="window._studioToggleForm('scene')">
              <span class="forge-section-icon" id="studio-scene-icon">▸</span>
              <span class="forge-section-title">+ new scene card</span>
            </div>
            <div class="forge-section-body" id="studio-scene-form" style="display:none">
              <div class="forge-field"><label class="forge-label">scene name</label>
                <input class="forge-input" id="st-scene-name" placeholder="The Collapse at Station 7"/></div>
              <div class="forge-field"><label class="forge-label">caption / dialogue</label>
                <textarea class="forge-input" id="st-scene-caption" rows="2"
                  placeholder="She found the signal in the static."
                  style="resize:vertical"></textarea></div>
              <div class="forge-row">
                <div class="forge-field forge-half"><label class="forge-label">mood</label>
                  <select class="forge-input" id="st-scene-mood">
                    <option value="">select</option>
                    <option>tense</option><option>quiet</option><option>electric</option>
                    <option>melancholic</option><option>surreal</option><option>triumphant</option>
                    <option>ominous</option><option>tender</option><option>chaotic</option>
                  </select></div>
                <div class="forge-field forge-half"><label class="forge-label">time of day</label>
                  <select class="forge-input" id="st-scene-time">
                    <option value="">select</option>
                    <option>dawn</option><option>morning</option><option>midday</option>
                    <option>dusk</option><option>night</option><option>void</option>
                  </select></div>
              </div>
              <div class="forge-row">
                <div class="forge-field forge-half"><label class="forge-label">camera</label>
                  <select class="forge-input" id="st-scene-camera">
                    <option value="">select</option>
                    <option>wide</option><option>medium</option><option>close-up</option>
                    <option>low angle</option><option>high angle</option>
                    <option>birds-eye</option><option>dutch tilt</option><option>POV</option>
                  </select></div>
                <div class="forge-field forge-half"><label class="forge-label">location</label>
                  <input class="forge-input" id="st-scene-location" placeholder="Spiral City rooftop"/></div>
              </div>
              <div class="forge-field"><label class="forge-label">linked world</label>
                <input class="forge-input" id="st-scene-world" placeholder="world name or ID"/></div>
              <div class="forge-field"><label class="forge-label">panel image</label>
                <div id="st-scene-img-wrap" style="
                  border:2px dashed var(--border);border-radius:10px;padding:16px;
                  text-align:center;cursor:pointer;transition:border-color 0.2s;
                  min-height:70px;display:flex;align-items:center;justify-content:center;
                  position:relative;overflow:hidden;
                " onclick="document.getElementById('st-scene-img-input').click()">
                  <img id="st-scene-img-preview" style="display:none;max-width:100%;max-height:140px;border-radius:6px;object-fit:cover"/>
                  <span id="st-scene-img-hint" style="font-size:0.72rem;color:var(--subtext)">tap to upload panel image</span>
                </div>
                <input type="file" id="st-scene-img-input" accept="image/*" style="display:none"
                  onchange="window._studioSceneImg(this)"/></div>
              <button onclick="window._studioSaveScene()" style="
                width:100%;padding:12px;background:linear-gradient(135deg,var(--teal),var(--purple));
                border:none;border-radius:10px;color:#fff;font-family:var(--font-display);
                font-weight:700;font-size:0.88rem;cursor:pointer;margin-top:4px">
                ✦ save scene card
              </button>
            </div>
          </div>

          <!-- SCENE GRID -->
          <div id="studio-scene-grid" style="display:flex;flex-direction:column;gap:14px;margin-top:12px"></div>
        </div>

        <!-- WORLD PANEL -->
        <div id="studio-world-panel" style="padding:16px;display:none">
          <div class="forge-section">
            <div class="forge-section-header" onclick="window._studioToggleForm('world')">
              <span class="forge-section-icon" id="studio-world-icon">▸</span>
              <span class="forge-section-title">+ new world card</span>
            </div>
            <div class="forge-section-body" id="studio-world-form" style="display:none">
              <div class="forge-field"><label class="forge-label">world name</label>
                <input class="forge-input" id="st-world-name" placeholder="Spiral City"/></div>
              <div class="forge-field"><label class="forge-label">tagline</label>
                <input class="forge-input" id="st-world-tagline" placeholder="Where the signal never sleeps."/></div>
              <div class="forge-row">
                <div class="forge-field forge-half"><label class="forge-label">biome / type</label>
                  <select class="forge-input" id="st-world-biome">
                    <option value="">select</option>
                    <option>cyberpunk city</option><option>void station</option>
                    <option>forest archive</option><option>deep ocean</option>
                    <option>neon desert</option><option>sky archipelago</option>
                    <option>ruined megastructure</option><option>pocket dimension</option>
                    <option>dreamspace</option><option>underground network</option>
                  </select></div>
                <div class="forge-field forge-half"><label class="forge-label">threat (0-100)</label>
                  <input class="forge-input" type="number" id="st-world-threat" min="0" max="100" value="50"/></div>
              </div>
              <div class="forge-field"><label class="forge-label">lore</label>
                <textarea class="forge-input" id="st-world-lore" rows="3"
                  placeholder="A city built on layered signals..."
                  style="resize:vertical"></textarea></div>
              <div class="forge-field"><label class="forge-label">key locations</label>
                <input class="forge-input" id="st-world-loc1" placeholder="Location 1" style="margin-bottom:6px"/>
                <input class="forge-input" id="st-world-loc2" placeholder="Location 2" style="margin-bottom:6px"/>
                <input class="forge-input" id="st-world-loc3" placeholder="Location 3"/></div>
              <div class="forge-field"><label class="forge-label">cover image</label>
                <div id="st-world-img-wrap" style="
                  border:2px dashed var(--border);border-radius:10px;padding:16px;
                  text-align:center;cursor:pointer;transition:border-color 0.2s;
                  min-height:70px;display:flex;align-items:center;justify-content:center;
                  position:relative;overflow:hidden;
                " onclick="document.getElementById('st-world-img-input').click()">
                  <img id="st-world-img-preview" style="display:none;max-width:100%;max-height:140px;border-radius:6px;object-fit:cover"/>
                  <span id="st-world-img-hint" style="font-size:0.72rem;color:var(--subtext)">tap to upload cover image</span>
                </div>
                <input type="file" id="st-world-img-input" accept="image/*" style="display:none"
                  onchange="window._studioWorldImg(this)"/></div>
              <button onclick="window._studioSaveWorld()" style="
                width:100%;padding:12px;background:linear-gradient(135deg,var(--purple),var(--pink));
                border:none;border-radius:10px;color:#fff;font-family:var(--font-display);
                font-weight:700;font-size:0.88rem;cursor:pointer;margin-top:4px">
                ✦ save world card
              </button>
            </div>
          </div>

          <!-- WORLD GRID -->
          <div id="studio-world-grid" style="display:flex;flex-direction:column;gap:14px;margin-top:12px"></div>
        </div>

      </div>`;
    initialized = true;
    _wireStudio();
  }

  // Always reload data on open
  await _loadData();
}

function _wireStudio() {
  window._studioSwitchTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('.studio-tab').forEach(b => {
      const isActive = b.dataset.tab === tab;
      b.style.borderColor = isActive ? 'var(--teal)' : 'var(--border)';
      b.style.color = isActive ? 'var(--teal)' : 'var(--subtext)';
    });
    document.getElementById('studio-scene-panel').style.display = tab === 'scenes' ? 'block' : 'none';
    document.getElementById('studio-world-panel').style.display = tab === 'worlds' ? 'block' : 'none';
  };

  window._studioToggleForm = (type) => {
    const body = document.getElementById(`studio-${type}-form`);
    const icon = document.getElementById(`studio-${type}-icon`);
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    if (icon) icon.textContent = open ? '▸' : '▾';
  };

  window._studioSceneImg = (input) => {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      _sceneImgData = reader.result;
      const p = document.getElementById('st-scene-img-preview');
      const h = document.getElementById('st-scene-img-hint');
      const w = document.getElementById('st-scene-img-wrap');
      if (p) { p.src = _sceneImgData; p.style.display = 'block'; }
      if (h) h.style.display = 'none';
      if (w) w.style.borderColor = 'var(--teal)';
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  window._studioWorldImg = (input) => {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      _worldImgData = reader.result;
      const p = document.getElementById('st-world-img-preview');
      const h = document.getElementById('st-world-img-hint');
      const w = document.getElementById('st-world-img-wrap');
      if (p) { p.src = _worldImgData; p.style.display = 'block'; }
      if (h) h.style.display = 'none';
      if (w) w.style.borderColor = 'var(--purple)';
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  window._studioSaveScene = async () => {
    const g = id => document.getElementById(id)?.value?.trim() || '';
    const id = _sceneEditId || generateCardId('scene');
    const scene = {
      id, card_type: 'scene',
      name:     g('st-scene-name')     || 'untitled scene',
      caption:  g('st-scene-caption'),
      mood:     g('st-scene-mood'),
      time:     g('st-scene-time'),
      camera:   g('st-scene-camera'),
      location: g('st-scene-location'),
      world:    g('st-scene-world'),
      image:    _sceneImgData || null,
      created_at: _sceneEditId
        ? (scenes.find(s => s.id === _sceneEditId)?.created_at || new Date().toISOString())
        : new Date().toISOString(),
    };
    await dbSet('scenes', scene);
    if (_sceneEditId) scenes = scenes.map(s => s.id === _sceneEditId ? scene : s);
    else scenes.push(scene);
    _sceneEditId = null; _sceneImgData = null;
    // Close form
    document.getElementById('studio-scene-form').style.display = 'none';
    document.getElementById('studio-scene-icon').textContent = '▸';
    await _renderSceneGrid();
  };

  window._studioSaveWorld = async () => {
    const g = id => document.getElementById(id)?.value?.trim() || '';
    const id = _worldEditId || generateCardId('world');
    const world = {
      id, card_type: 'world',
      name:      g('st-world-name')    || 'untitled world',
      tagline:   g('st-world-tagline'),
      biome:     g('st-world-biome'),
      lore:      g('st-world-lore'),
      threat:    parseInt(document.getElementById('st-world-threat')?.value) || 50,
      locations: [g('st-world-loc1'), g('st-world-loc2'), g('st-world-loc3')].filter(Boolean),
      palette:   ['#00F6D6','#FF4BCB','#4DA3FF','#FFD93D','#7c6af7','#F3F7FF'],
      image:     _worldImgData || null,
      created_at: _worldEditId
        ? (worlds.find(w => w.id === _worldEditId)?.created_at || new Date().toISOString())
        : new Date().toISOString(),
    };
    await dbSet('worlds', world);
    if (_worldEditId) worlds = worlds.map(w => w.id === _worldEditId ? world : w);
    else worlds.push(world);
    _worldEditId = null; _worldImgData = null;
    document.getElementById('studio-world-form').style.display = 'none';
    document.getElementById('studio-world-icon').textContent = '▸';
    await _renderWorldGrid();
  };

  window._studioDeleteScene = async (id) => {
    scenes = scenes.filter(s => s.id !== id);
    await dbDelete('scenes', id);
    await _renderSceneGrid();
  };

  window._studioDeleteWorld = async (id) => {
    worlds = worlds.filter(w => w.id !== id);
    await dbDelete('worlds', id);
    await _renderWorldGrid();
  };

  window._studioDownload = async (type, id) => {
    const item = type === 'scene' ? scenes.find(s => s.id === id) : worlds.find(w => w.id === id);
    if (!item) return;
    const canvas = type === 'scene' ? await renderSceneCard(item) : await renderWorldCard(item);
    const link = document.createElement('a');
    link.download = id + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
}

async function _loadData() {
  scenes = await dbGetAll('scenes') || [];
  worlds = await dbGetAll('worlds') || [];
  await _renderSceneGrid();
  await _renderWorldGrid();
}

async function _renderSceneGrid() {
  const grid = document.getElementById('studio-scene-grid');
  if (!grid) return;
  if (!scenes.length) {
    grid.innerHTML = '<div style="text-align:center;padding:32px;color:var(--subtext);font-size:0.78rem">no scenes yet — tap + new scene card above</div>';
    return;
  }
  grid.innerHTML = '';
  for (const scene of scenes) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const canvas = await renderSceneCard(scene);
    canvas.style.cssText = 'width:100%;border-radius:8px;display:block;cursor:pointer;';
    canvas.onclick = () => window._studioDownload('scene', scene.id);
    wrap.appendChild(canvas);
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;';
    bar.innerHTML = `
      <button onclick="window._studioDownload('scene','${scene.id}')" style="
        padding:5px 12px;background:var(--surface);border:1px solid var(--border);
        border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.65rem;cursor:pointer">
        ↓ save
      </button>
      <button onclick="window._studioDeleteScene('${scene.id}')" style="
        padding:5px 12px;background:var(--surface);border:1px solid var(--border);
        border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.65rem;cursor:pointer">
        ✕
      </button>`;
    wrap.appendChild(bar);
    grid.appendChild(wrap);
  }
}

async function _renderWorldGrid() {
  const grid = document.getElementById('studio-world-grid');
  if (!grid) return;
  if (!worlds.length) {
    grid.innerHTML = '<div style="text-align:center;padding:32px;color:var(--subtext);font-size:0.78rem">no worlds yet — tap + new world card above</div>';
    return;
  }
  grid.innerHTML = '';
  for (const world of worlds) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const canvas = await renderWorldCard(world);
    canvas.style.cssText = 'width:100%;border-radius:8px;display:block;cursor:pointer;';
    canvas.onclick = () => window._studioDownload('world', world.id);
    wrap.appendChild(canvas);
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;';
    bar.innerHTML = `
      <button onclick="window._studioDownload('world','${world.id}')" style="
        padding:5px 12px;background:var(--surface);border:1px solid var(--border);
        border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.65rem;cursor:pointer">
        ↓ save
      </button>
      <button onclick="window._studioDeleteWorld('${world.id}')" style="
        padding:5px 12px;background:var(--surface);border:1px solid var(--border);
        border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.65rem;cursor:pointer">
        ✕
      </button>`;
    wrap.appendChild(bar);
    grid.appendChild(wrap);
  }
}
