// ============================================================
// SPIRALSIDE — SPIRALCUT v0.1 (MOCKUP)
// Clip editor — asset bin, preview, inspector, timeline
// Nimbis anchor: js/app/views/spiralcut.js
// ============================================================

let initialized = false;

export function initSpiralCutView() {
  const el = document.getElementById('view-spiralcut');
  if (!el) return;
  if (initialized) return;
  initialized = true;
  el.innerHTML = _buildHTML();
  _wire();
}

function _buildHTML() { return `
<div style='display:flex;flex-direction:column;height:100%;overflow:hidden;background:var(--bg);'>

  <!-- TOP BAR -->
  <div style='display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;gap:12px;'>
    <div style='display:flex;align-items:center;gap:8px;'>
      <span style='font-family:var(--font-display);font-weight:800;font-size:0.95rem;background:linear-gradient(135deg,var(--teal),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;'>SpiralCut</span>
      <span style='font-size:0.55rem;color:var(--subtext);letter-spacing:0.1em;border:1px solid var(--border);border-radius:4px;padding:2px 6px;'>v0.1</span>
    </div>
    <div style='display:flex;gap:6px;'>
      <button id='sc-play-btn' style='width:30px;height:30px;border-radius:50%;background:var(--teal);border:none;color:#000;font-size:0.85rem;cursor:pointer;'>▶</button>
      <button style='padding:6px 14px;background:linear-gradient(135deg,var(--teal),var(--purple));border:none;border-radius:6px;color:#000;font-family:var(--font-display);font-weight:700;font-size:0.68rem;cursor:pointer;'>export</button>
    </div>
  </div>

  <!-- MIDDLE ROW -->
  <div style='display:flex;flex:1;overflow:hidden;min-height:0;'>

    <!-- ASSET BIN -->
    <div style='width:130px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);overflow-y:auto;display:flex;flex-direction:column;'>
      <div style='padding:7px 10px;font-size:0.52rem;letter-spacing:0.14em;color:var(--subtext);text-transform:uppercase;border-bottom:1px solid var(--border);flex-shrink:0;'>asset bin</div>
      <div style='display:flex;border-bottom:1px solid var(--border);flex-shrink:0;'>
        <button class='sc-atab' data-bin='sc-bin-scenes' style='flex:1;padding:5px 2px;background:transparent;border:none;border-bottom:2px solid var(--teal);color:var(--teal);font-family:var(--font-ui);font-size:0.52rem;cursor:pointer;'>scenes</button>
        <button class='sc-atab' data-bin='sc-bin-worlds' style='flex:1;padding:5px 2px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--subtext);font-family:var(--font-ui);font-size:0.52rem;cursor:pointer;'>worlds</button>
        <button class='sc-atab' data-bin='sc-bin-chars' style='flex:1;padding:5px 2px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--subtext);font-family:var(--font-ui);font-size:0.52rem;cursor:pointer;'>cast</button>
      </div>
      <div style='flex:1;overflow-y:auto;padding:6px;'>
        <div id='sc-bin-scenes'>${_placeholders('scene',3)}</div>
        <div id='sc-bin-worlds' style='display:none'>${_placeholders('world',2)}</div>
        <div id='sc-bin-chars' style='display:none'>${_placeholders('char',3)}</div>
      </div>
    </div>

    <!-- PREVIEW + INSPECTOR -->
    <div style='flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;'>

      <!-- PREVIEW -->
      <div style='flex:1;background:#050508;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;min-height:0;'>
        <div style='position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,246,214,0.015) 2px,rgba(0,246,214,0.015) 4px);z-index:1;'></div>
        <div id='sc-preview-empty' style='text-align:center;z-index:2;'>
          <div style='font-size:2rem;opacity:0.2;margin-bottom:8px;'>⬡</div>
          <div style='font-size:0.62rem;color:var(--subtext);letter-spacing:0.1em;'>no clip selected</div>
          <div style='font-size:0.56rem;color:var(--subtext);opacity:0.5;margin-top:4px;'>tap + on a scene to add to timeline</div>
        </div>
        <div style='position:absolute;top:10px;right:10px;z-index:3;font-size:0.52rem;color:var(--subtext);background:rgba(8,8,16,0.8);border:1px solid var(--border);border-radius:4px;padding:3px 7px;'><span id='sc-clip-count'>0</span> clips</div>
        <div style='position:absolute;bottom:10px;left:10px;z-index:3;font-family:var(--font-ui);font-size:0.58rem;color:var(--teal);background:rgba(8,8,16,0.8);border:1px solid rgba(0,246,214,0.2);border-radius:4px;padding:3px 8px;letter-spacing:0.08em;'>00:00 / 00:00</div>
      </div>

      <!-- INSPECTOR -->
      <div style='border-top:1px solid var(--border);background:var(--surface);padding:10px 14px;flex-shrink:0;'>
        <div style='font-size:0.52rem;letter-spacing:0.14em;color:var(--subtext);text-transform:uppercase;margin-bottom:8px;'>selected clip</div>
        <div style='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;'>
          <div><div style='font-size:0.52rem;color:var(--subtext);margin-bottom:3px;'>name</div><div style='font-size:0.7rem;color:var(--text);' id='sc-insp-name'>—</div></div>
          <div><div style='font-size:0.52rem;color:var(--subtext);margin-bottom:3px;'>mood</div><div style='font-size:0.7rem;color:var(--teal);' id='sc-insp-mood'>—</div></div>
          <div><div style='font-size:0.52rem;color:var(--subtext);margin-bottom:3px;'>est.</div><div style='font-size:0.7rem;color:var(--subtext);' id='sc-insp-dur'>~5s</div></div>
        </div>
        <div style='display:flex;gap:6px;'>
          <button style='flex:1;padding:7px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.6rem;cursor:pointer;'>🎨 gen image</button>
          <button style='flex:1;padding:7px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.6rem;cursor:pointer;'>🎬 gen clip</button>
          <button style='flex:1;padding:7px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--subtext);font-family:var(--font-ui);font-size:0.6rem;cursor:pointer;'>↓ export</button>
        </div>
      </div>
    </div>
  </div>

  <!-- TIMELINE -->
  <div style='border-top:2px solid var(--border);background:var(--surface);flex-shrink:0;height:110px;display:flex;flex-direction:column;overflow:hidden;'>
    <div style='display:flex;align-items:center;justify-content:space-between;padding:5px 12px;border-bottom:1px solid var(--border);flex-shrink:0;'>
      <div style='font-size:0.52rem;letter-spacing:0.14em;color:var(--subtext);text-transform:uppercase;'>storyboard timeline</div>
      <div style='display:flex;gap:6px;'>
        <button id='sc-clear-btn' style='padding:3px 10px;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--subtext);font-family:var(--font-ui);font-size:0.56rem;cursor:pointer;'>clear</button>
        <button id='sc-render-btn' style='padding:3px 10px;background:rgba(0,246,214,0.1);border:1px solid var(--teal);border-radius:4px;color:var(--teal);font-family:var(--font-ui);font-size:0.56rem;cursor:pointer;'>✦ render all</button>
      </div>
    </div>
    <div id='sc-timeline' style='flex:1;overflow-x:auto;overflow-y:hidden;display:flex;align-items:center;gap:6px;padding:0 12px;-webkit-overflow-scrolling:touch;'>
      <div id='sc-tl-empty' style='display:flex;align-items:center;gap:8px;font-size:0.6rem;color:var(--subtext);letter-spacing:0.08em;white-space:nowrap;opacity:0.5;'>
        <span style='font-size:1.2rem;opacity:0.4;'>⬡</span> tap + on a scene card to add it here
      </div>
    </div>
  </div>

</div>`,
}

function _placeholders(type, count) {
  const colors = { scene:'var(--teal)', world:'var(--purple)', char:'var(--pink)' };
  const icons  = { scene:'🎬', world:'🌐', char:'✦' };
  const label  = { scene:'scene', world:'world', char:'character' };
  let h = '';
  for (let i = 1; i <= count; i++) {
    h += `<div style='background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px;cursor:pointer;'>
      <div style='font-size:0.7rem;'>${icons[type]}</div>
      <div style='font-size:0.6rem;color:var(--text);margin:2px 0;'>${label[type]} ${i}</div>
      <div style='font-size:0.52rem;color:var(--subtext);'>placeholder</div>
      <button onclick="window._scAdd('${type}','${type}-${i}','${label[type]} ${i}','electric')" style='width:100%;margin-top:5px;padding:3px;background:rgba(0,246,214,0.08);border:1px solid rgba(0,246,214,0.2);border-radius:4px;color:var(--teal);font-family:var(--font-ui);font-size:0.52rem;cursor:pointer;'>+ add</button>
    </div>`;
  }
  return h;
}

function _wire() {
  let clips = [];

  // Asset tabs
  document.querySelectorAll('.sc-atab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sc-atab').forEach(b => {
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--subtext)';
      });
      btn.style.borderBottomColor = 'var(--teal)';
      btn.style.color = 'var(--teal)';
      document.querySelectorAll('[id^=sc-bin-]').forEach(d => d.style.display = 'none');
      document.getElementById(btn.dataset.bin).style.display = 'block';
    });
  });

  window._scAdd = (type, id, name, mood) => {
    clips.push({ type, id, name, mood });
    _renderTL();
    document.getElementById('sc-clip-count').textContent = clips.length;
    document.getElementById('sc-insp-name').textContent = name;
    document.getElementById('sc-insp-mood').textContent = mood;
  };

  document.getElementById('sc-clear-btn').addEventListener('click', () => {
    clips = []; _renderTL();
    document.getElementById('sc-clip-count').textContent = '0';
  });

  document.getElementById('sc-render-btn').addEventListener('click', () => {
    if (!clips.length) return;
    alert('render queue coming soon — ' + clips.length + ' clips queued');
  });

  function _renderTL() {
    const tl = document.getElementById('sc-timeline');
    const empty = document.getElementById('sc-tl-empty');
    tl.querySelectorAll('.sc-tl-clip').forEach(c => c.remove());
    empty.style.display = clips.length ? 'none' : 'flex';
    const col = { scene:'var(--teal)', world:'var(--purple)', char:'var(--pink)' };
    const ico = { scene:'🎬', world:'🌐', char:'✦' };
    clips.forEach((clip, i) => {
      const d = document.createElement('div');
      d.className = 'sc-tl-clip';
      d.style.cssText = `flex-shrink:0;width:78px;height:72px;background:var(--surface2);border:1px solid ${col[clip.type]||'var(--border)'};border-radius:6px;padding:6px;cursor:pointer;position:relative;display:flex;flex-direction:column;justify-content:space-between;`;
      d.innerHTML = `
        <div style='font-size:0.58rem;color:${col[clip.type]}'>${ico[clip.type]} ${i+1}</div>
        <div style='font-size:0.56rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>${clip.name}</div>
        <div style='font-size:0.48rem;color:var(--subtext);'>~5s · pending</div>
        <button onclick='event.stopPropagation();this.closest(".sc-tl-clip").remove()' style='position:absolute;top:3px;right:3px;background:none;border:none;color:var(--subtext);font-size:0.58rem;cursor:pointer;'>✕</button>
      `;
      d.onclick = () => {
        document.getElementById('sc-insp-name').textContent = clip.name;
        document.getElementById('sc-insp-mood').textContent = clip.mood || '—';
      };
      tl.appendChild(d);
    });
  }
}