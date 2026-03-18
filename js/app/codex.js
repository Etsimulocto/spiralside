// ============================================================
// SPIRALSIDE — CODEX v1.0
// Scene + World card builder UI
// Stores to IDB 'scenes' + 'worlds' stores
// Nimbis anchor: js/app/codex.js
// ============================================================

import { dbSet, dbGetAll, dbDelete } from './db.js';
import { renderSceneCard, renderWorldCard, generateCardId } from './card.js';

let scenes = [];
let worlds = [];
let activeTab = 'scenes';
let _sceneEditId = null;
let _sceneImgData = null;
let _worldEditId = null;
let _worldImgData = null;

export async function initCodex() {
  scenes = await dbGetAll('scenes') || [];
  worlds = await dbGetAll('worlds') || [];
  renderCodexView();
  wireCodexControls();
}

function wireCodexControls() {
  document.querySelectorAll('.codex-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderCodexView();
    });
  });
  document.getElementById('codex-new-scene-btn')?.addEventListener('click', () => openSceneForm(null));
  document.getElementById('codex-new-world-btn')?.addEventListener('click', () => openWorldForm(null));
  document.getElementById('codex-scene-save')?.addEventListener('click', saveSceneCard);
  document.getElementById('codex-world-save')?.addEventListener('click', saveWorldCard);
  document.getElementById('codex-scene-form-close')?.addEventListener('click', closeSceneForm);
  document.getElementById('codex-world-form-close')?.addEventListener('click', closeWorldForm);
  document.getElementById('codex-scene-img-btn')?.addEventListener('click', () => document.getElementById('codex-scene-img-input').click());
  document.getElementById('codex-scene-img-input')?.addEventListener('change', e => handleImgUpload(e, 'scene'));
  document.getElementById('codex-world-img-btn')?.addEventListener('click', () => document.getElementById('codex-world-img-input').click());
  document.getElementById('codex-world-img-input')?.addEventListener('change', e => handleImgUpload(e, 'world'));
}

function renderCodexView() {
  const sg = document.getElementById('codex-scene-grid');
  const wg = document.getElementById('codex-world-grid');
  const nb = document.getElementById('codex-new-scene-btn');
  const nw = document.getElementById('codex-new-world-btn');
  if (activeTab === 'scenes') {
    if (sg) sg.style.display = 'grid';
    if (wg) wg.style.display = 'none';
    if (nb) nb.style.display = 'flex';
    if (nw) nw.style.display = 'none';
    renderSceneGrid();
  } else {
    if (sg) sg.style.display = 'none';
    if (wg) wg.style.display = 'grid';
    if (nb) nb.style.display = 'none';
    if (nw) nw.style.display = 'flex';
    renderWorldGrid();
  }
}

async function renderSceneGrid() {
  const grid = document.getElementById('codex-scene-grid');
  if (!grid) return;
  if (!scenes.length) {
    grid.innerHTML = '<div class="codex-empty"><div style="font-size:2rem;margin-bottom:10px">🎬</div><div>no scenes yet</div><div style="opacity:0.5;margin-top:6px;font-size:0.68rem">tap + to create your first scene card</div></div>';
    return;
  }
  grid.innerHTML = '';
  for (const scene of scenes) {
    const wrap = document.createElement('div');
    wrap.className = 'codex-card-wrap';
    const canvas = await renderSceneCard(scene);
    canvas.style.cssText = 'width:100%;border-radius:8px;display:block;cursor:pointer;';
    canvas.onclick = () => window.openSceneForm(scene.id);
    wrap.appendChild(canvas);
    const bar = document.createElement('div');
    bar.className = 'codex-card-bar';
    bar.innerHTML = '<button class="codex-card-action" onclick="window.downloadCodexCard(\'scene\',\''+scene.id+'\')">↓ save</button><button class="codex-card-action danger" onclick="window.deleteCodexCard(\'scene\',\''+scene.id+'\')">✕</button>';
    wrap.appendChild(bar);
    grid.appendChild(wrap);
  }
}

async function renderWorldGrid() {
  const grid = document.getElementById('codex-world-grid');
  if (!grid) return;
  if (!worlds.length) {
    grid.innerHTML = '<div class="codex-empty"><div style="font-size:2rem;margin-bottom:10px">🌐</div><div>no worlds yet</div><div style="opacity:0.5;margin-top:6px;font-size:0.68rem">tap + to create your first world card</div></div>';
    return;
  }
  grid.innerHTML = '';
  for (const world of worlds) {
    const wrap = document.createElement('div');
    wrap.className = 'codex-card-wrap';
    const canvas = await renderWorldCard(world);
    canvas.style.cssText = 'width:100%;border-radius:8px;display:block;cursor:pointer;';
    canvas.onclick = () => window.openWorldForm(world.id);
    wrap.appendChild(canvas);
    const bar = document.createElement('div');
    bar.className = 'codex-card-bar';
    bar.innerHTML = '<button class="codex-card-action" onclick="window.downloadCodexCard(\'world\',\''+world.id+'\')">↓ save</button><button class="codex-card-action danger" onclick="window.deleteCodexCard(\'world\',\''+world.id+'\')">✕</button>';
    wrap.appendChild(bar);
    grid.appendChild(wrap);
  }
}

export function openSceneForm(id) {
  _sceneEditId = id;
  _sceneImgData = null;
  const overlay = document.getElementById('codex-scene-form-overlay');
  if (!overlay) return;
  if (id) {
    const s = scenes.find(x => x.id === id);
    if (s) {
      document.getElementById('codex-scene-name').value     = s.name     || '';
      document.getElementById('codex-scene-caption').value  = s.caption  || '';
      document.getElementById('codex-scene-mood').value     = s.mood     || '';
      document.getElementById('codex-scene-time').value     = s.time     || '';
      document.getElementById('codex-scene-camera').value   = s.camera   || '';
      document.getElementById('codex-scene-location').value = s.location || '';
      document.getElementById('codex-scene-world').value    = s.world    || '';
      _sceneImgData = s.image || null;
      const p = document.getElementById('codex-scene-img-preview');
      if (p && s.image) { p.src = s.image; p.style.display = 'block'; }
    }
  } else {
    ['codex-scene-name','codex-scene-caption','codex-scene-location','codex-scene-world'].forEach(eid => {
      const el = document.getElementById(eid); if (el) el.value = '';
    });
    ['codex-scene-mood','codex-scene-time','codex-scene-camera'].forEach(eid => {
      const el = document.getElementById(eid); if (el) el.selectedIndex = 0;
    });
    const p = document.getElementById('codex-scene-img-preview');
    if (p) { p.src = ''; p.style.display = 'none'; }
  }
  overlay.classList.add('open');
}

function closeSceneForm() {
  document.getElementById('codex-scene-form-overlay')?.classList.remove('open');
  _sceneEditId = null; _sceneImgData = null;
}

async function saveSceneCard() {
  const id = _sceneEditId || generateCardId('scene');
  const scene = {
    id,
    card_type: 'scene',
    name:      document.getElementById('codex-scene-name').value.trim()     || 'untitled scene',
    caption:   document.getElementById('codex-scene-caption').value.trim()  || '',
    mood:      document.getElementById('codex-scene-mood').value            || '',
    time:      document.getElementById('codex-scene-time').value            || '',
    camera:    document.getElementById('codex-scene-camera').value          || '',
    location:  document.getElementById('codex-scene-location').value.trim() || '',
    world:     document.getElementById('codex-scene-world').value.trim()    || '',
    image:     _sceneImgData || null,
    created_at: _sceneEditId
      ? (scenes.find(s => s.id === _sceneEditId)?.created_at || new Date().toISOString())
      : new Date().toISOString(),
  };
  await dbSet('scenes', scene);
  if (_sceneEditId) { scenes = scenes.map(s => s.id === _sceneEditId ? scene : s); }
  else { scenes.push(scene); }
  closeSceneForm();
  renderSceneGrid();
}

export function openWorldForm(id) {
  _worldEditId = id;
  _worldImgData = null;
  const overlay = document.getElementById('codex-world-form-overlay');
  if (!overlay) return;
  if (id) {
    const w = worlds.find(x => x.id === id);
    if (w) {
      document.getElementById('codex-world-name').value    = w.name    || '';
      document.getElementById('codex-world-tagline').value = w.tagline || '';
      document.getElementById('codex-world-biome').value   = w.biome   || '';
      document.getElementById('codex-world-lore').value    = w.lore    || '';
      document.getElementById('codex-world-threat').value  = w.threat  || 50;
      document.getElementById('codex-world-loc1').value    = w.locations?.[0] || '';
      document.getElementById('codex-world-loc2').value    = w.locations?.[1] || '';
      document.getElementById('codex-world-loc3').value    = w.locations?.[2] || '';
      _worldImgData = w.image || null;
      const p = document.getElementById('codex-world-img-preview');
      if (p && w.image) { p.src = w.image; p.style.display = 'block'; }
    }
  } else {
    ['codex-world-name','codex-world-tagline','codex-world-lore',
     'codex-world-loc1','codex-world-loc2','codex-world-loc3'].forEach(eid => {
      const el = document.getElementById(eid); if (el) el.value = '';
    });
    const b = document.getElementById('codex-world-biome'); if (b) b.selectedIndex = 0;
    const t = document.getElementById('codex-world-threat'); if (t) t.value = 50;
    const p = document.getElementById('codex-world-img-preview');
    if (p) { p.src = ''; p.style.display = 'none'; }
  }
  overlay.classList.add('open');
}

function closeWorldForm() {
  document.getElementById('codex-world-form-overlay')?.classList.remove('open');
  _worldEditId = null; _worldImgData = null;
}

async function saveWorldCard() {
  const id = _worldEditId || generateCardId('world');
  const world = {
    id,
    card_type: 'world',
    name:      document.getElementById('codex-world-name').value.trim()    || 'untitled world',
    tagline:   document.getElementById('codex-world-tagline').value.trim() || '',
    biome:     document.getElementById('codex-world-biome').value          || '',
    lore:      document.getElementById('codex-world-lore').value.trim()    || '',
    threat:    parseInt(document.getElementById('codex-world-threat').value) || 50,
    locations: [
      document.getElementById('codex-world-loc1').value.trim(),
      document.getElementById('codex-world-loc2').value.trim(),
      document.getElementById('codex-world-loc3').value.trim(),
    ].filter(Boolean),
    palette: ['#00F6D6','#FF4BCB','#4DA3FF','#FFD93D','#7c6af7','#F3F7FF'],
    image:   _worldImgData || null,
    created_at: _worldEditId
      ? (worlds.find(w => w.id === _worldEditId)?.created_at || new Date().toISOString())
      : new Date().toISOString(),
  };
  await dbSet('worlds', world);
  if (_worldEditId) { worlds = worlds.map(w => w.id === _worldEditId ? world : w); }
  else { worlds.push(world); }
  closeWorldForm();
  renderWorldGrid();
}

function handleImgUpload(e, type) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result;
    if (type === 'scene') {
      _sceneImgData = data;
      const p = document.getElementById('codex-scene-img-preview');
      if (p) { p.src = data; p.style.display = 'block'; }
    } else {
      _worldImgData = data;
      const p = document.getElementById('codex-world-img-preview');
      if (p) { p.src = data; p.style.display = 'block'; }
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

export async function downloadCodexCard(type, id) {
  const item = type === 'scene' ? scenes.find(s => s.id === id) : worlds.find(w => w.id === id);
  if (!item) return;
  const canvas = type === 'scene' ? await renderSceneCard(item) : await renderWorldCard(item);
  const link = document.createElement('a');
  link.download = id + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function deleteCodexCard(type, id) {
  if (type === 'scene') {
    scenes = scenes.filter(s => s.id !== id);
    await dbDelete('scenes', id);
    renderSceneGrid();
  } else {
    worlds = worlds.filter(w => w.id !== id);
    await dbDelete('worlds', id);
    renderWorldGrid();
  }
}
