// ============================================================
// SPIRALSIDE — ACCOUNT VIEW v3.0
// Full module — owns its own HTML and CSS
// Added: retro save system (autosave + 3 manual slots)
//        download save file, upload/restore from file
// Nimbis anchor: js/app/views/account.js
// ============================================================

import { syncLoadAll, syncSave } from '../sync.js';
import { generateSoulPrint }     from '../pdf.js';
import { state }                 from '../state.js';
import {
  loadAllSlots,
  saveToSlot,
  restoreFromSlot,
  downloadSave,
  uploadSave,
  wipeSlot,
  queueAutosave,
} from '../mastersave.js';

// ── LEGACY EXPORT — kept for backward compat ─────────────────
export async function exportSoulPrintPDF() {
  const { dbGet } = await import('../db.js');
  const you = await dbGet('sheets', 'you') || {};
  await generateSoulPrint(you);
}

export async function exportUserData() {
  try {
    const fname = await downloadSave();
    showSaveToast('\u2193 downloaded: ' + fname, 'ok');
  } catch(e) {
    showSaveToast('download failed: ' + e.message, 'err');
  }
}

export function importUserData() {
  uploadSave(
    (blob) => {
      showSaveToast('\u2713 save restored — reload to apply', 'ok');
      setTimeout(() => location.reload(), 1800);
    },
    (msg) => showSaveToast('import failed: ' + msg, 'err')
  );
}

// ── STYLES ───────────────────────────────────────────────────
let initialized = false;

function injectAccountStyles() {
  if (document.getElementById('ss-account-styles')) return;
  const s = document.createElement('style');
  s.id = 'ss-account-styles';
  s.textContent = `
    #view-account { flex-direction: column; overflow: hidden; }
    .acct-scroll { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px 16px 40px; }

    /* ── Avatar + email ── */
    .acct-avatar-wrap { text-align: center; padding: 32px 0 24px; }
    .acct-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--teal), var(--accent)); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; border: 3px solid var(--border); color: #0a0a0f; }
    .acct-email { font-size: 0.8rem; color: var(--subtext); text-align: center; margin-bottom: 4px; }

    /* ── Credit hero ── */
    .acct-credit-hero { background: linear-gradient(135deg, rgba(0,246,214,0.08), rgba(124,106,247,0.08)); border: 1px solid var(--border); border-radius: 16px; padding: 28px 20px; text-align: center; margin-bottom: 20px; }
    .acct-credit-amount { font-family: var(--font-display); font-size: 2.8rem; font-weight: 800; color: var(--teal); line-height: 1; }
    .acct-credit-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin-top: 6px; }

    /* ── Section title ── */
    .acct-section-title { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; }
    .acct-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

    /* ── Buttons ── */
    .acct-signout-btn { width: 100%; padding: 13px; background: transparent; border: 1px solid var(--border); border-radius: 12px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.8rem; cursor: pointer; letter-spacing: 0.04em; transition: all 0.2s; margin-bottom: 10px; display: block; }
    .acct-signout-btn:hover { border-color: var(--accent2); color: var(--accent2); }
    .acct-buy-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--teal), var(--accent)); border: none; border-radius: 12px; color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s; display: block; }
    .acct-buy-btn:hover { opacity: 0.88; }

    /* ── RETRO SAVE SYSTEM ── */
    .save-system-wrap { margin-bottom: 4px; }

    /* Save slot card */
    .save-slot-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      overflow: hidden;
    }
    .save-slot-card.has-data { border-color: rgba(0,246,214,0.25); }
    .save-slot-card.autosave { border-color: rgba(124,106,247,0.2); }

    /* CRT scanline shimmer on hover */
    .save-slot-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent, transparent 2px,
        rgba(0,246,214,0.015) 2px, rgba(0,246,214,0.015) 4px
      );
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .save-slot-card:hover::before { opacity: 1; }

    /* Slot number badge */
    .save-slot-num {
      width: 36px; height: 36px;
      border-radius: 6px;
      background: var(--muted);
      border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display);
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--subtext);
      letter-spacing: 0.06em;
      flex-shrink: 0;
      text-transform: uppercase;
    }
    .save-slot-card.has-data .save-slot-num { color: var(--teal); border-color: rgba(0,246,214,0.3); }
    .save-slot-card.autosave  .save-slot-num { color: #7c6af7; border-color: rgba(124,106,247,0.3); }

    /* Slot info */
    .save-slot-info { flex: 1; min-width: 0; }
    .save-slot-name { font-size: 0.8rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
    .save-slot-meta { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.04em; }
    .save-slot-empty { font-size: 0.72rem; color: var(--subtext); opacity: 0.4; }

    /* Slot action buttons */
    .save-slot-actions { display: flex; gap: 5px; flex-shrink: 0; }
    .slt-btn {
      padding: 5px 10px;
      border-radius: 6px;
      font-family: var(--font-ui);
      font-size: 0.6rem;
      letter-spacing: 0.06em;
      cursor: pointer;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--subtext);
      transition: all 0.15s;
      white-space: nowrap;
    }
    .slt-btn:hover { color: var(--text); border-color: var(--subtext); }
    .slt-btn.save  { border-color: rgba(0,246,214,0.3); color: var(--teal); }
    .slt-btn.save:hover { background: rgba(0,246,214,0.08); }
    .slt-btn.load  { border-color: rgba(124,106,247,0.3); color: #7c6af7; }
    .slt-btn.load:hover { background: rgba(124,106,247,0.08); }
    .slt-btn.del   { border-color: rgba(255,107,107,0.2); color: rgba(255,107,107,0.5); }
    .slt-btn.del:hover { border-color: #ff6b6b; color: #ff6b6b; background: rgba(255,107,107,0.06); }

    /* Download / Upload row */
    .save-file-row { display: flex; gap: 8px; margin-top: 10px; }
    .save-file-btn {
      flex: 1; padding: 11px 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--subtext);
      font-family: var(--font-ui);
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all 0.15s;
    }
    .save-file-btn:hover { border-color: var(--teal); color: var(--teal); }
    .save-file-btn.upload:hover { border-color: #7c6af7; color: #7c6af7; }

    /* Save/load toast */
    .save-toast {
      position: fixed;
      top: calc(54px + env(safe-area-inset-top, 0px));
      left: 50%; transform: translateX(-50%) translateY(-8px);
      background: var(--surface);
      border: 1px solid var(--teal);
      color: var(--teal);
      font-family: var(--font-ui);
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      padding: 8px 16px;
      border-radius: 20px;
      opacity: 0; pointer-events: none;
      z-index: 9999;
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
      white-space: nowrap;
    }
    .save-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    .save-toast.err { border-color: #ff6b6b; color: #ff6b6b; }

    /* Slot name input modal */
    .slot-name-modal {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 9100;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .slot-name-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px 18px;
      width: 100%; max-width: 340px;
    }
    .slot-name-title { font-family: var(--font-display); font-size: 0.88rem; font-weight: 700; color: var(--text); margin-bottom: 12px; }
    .slot-name-input {
      width: 100%; background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px;
      color: var(--text); font-family: var(--font-ui); font-size: 0.8rem;
      outline: none; margin-bottom: 14px;
    }
    .slot-name-input:focus { border-color: var(--teal); }
    .slot-name-btns { display: flex; gap: 8px; }
    .slot-name-cancel { flex: 1; padding: 10px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.75rem; cursor: pointer; }
    .slot-name-save { flex: 2; padding: 10px; background: linear-gradient(135deg, var(--teal), #7c6af7); border: none; border-radius: 8px; color: #0a0a0f; font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; cursor: pointer; letter-spacing: 0.04em; }

    /* Confirm restore overlay */
    .restore-confirm {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 9100;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .restore-card {
      background: var(--bg); border: 1px solid rgba(255,107,107,0.3); border-radius: 14px;
      padding: 22px 18px; width: 100%; max-width: 340px;
    }
    .restore-title { font-family: var(--font-display); font-size: 0.88rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .restore-sub { font-size: 0.72rem; color: var(--subtext); line-height: 1.55; margin-bottom: 14px; }
    .restore-btns { display: flex; gap: 8px; }
    .restore-cancel { flex: 1; padding: 10px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.75rem; cursor: pointer; }
    .restore-ok { flex: 2; padding: 10px; background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.4); border-radius: 8px; color: #ff6b6b; font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; cursor: pointer; letter-spacing: 0.04em; }

    /* PWA install */
    .pwa-install-btn { display:none; align-items:center; gap:12px; background:linear-gradient(135deg,rgba(0,246,214,0.1),rgba(123,95,255,0.1)); border:1px solid rgba(0,246,214,0.3); border-radius:12px; padding:14px 16px; margin-bottom:12px; cursor:pointer; transition:all 0.2s; }
    .pwa-install-btn:hover { border-color:var(--teal); }

    /* About */
    .acct-about-block { margin-top: 8px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; }
    .acct-about-tagline { font-size: 0.75rem; color: var(--subtext); line-height: 1.5; margin-bottom: 14px; }
    .acct-about-links { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .acct-about-link { font-size: 0.75rem; color: var(--teal); text-decoration: none; letter-spacing: 0.02em; opacity: 0.85; transition: opacity 0.2s; }
    .acct-about-link:hover { opacity: 1; text-decoration: underline; }
    .acct-about-contact { font-size: 0.7rem; color: var(--subtext); line-height: 1.6; }
    .acct-about-contact a { color: var(--subtext); text-decoration: none; }
    .acct-about-contact a:hover { color: var(--teal); }
    .acct-version { font-size: 0.6rem; letter-spacing: 0.1em; color: var(--subtext); opacity: 0.4; text-align: center; margin-top: 12px; }
  `;
  document.head.appendChild(s);
}

// ── TOAST ─────────────────────────────────────────────────────
function showSaveToast(msg, type = 'ok') {
  let t = document.getElementById('save-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'save-toast';
    t.className = 'save-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'save-toast' + (type === 'err' ? ' err' : '');
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.remove('visible'); }, 3000);
}

// ── SLOT NAME MODAL ───────────────────────────────────────────
function promptSlotName(existingName, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'slot-name-modal';
  modal.innerHTML = `
    <div class="slot-name-card">
      <div class="slot-name-title">name this save</div>
      <input class="slot-name-input" id="sn-input" type="text" maxlength="28"
        value="${existingName || ''}" placeholder="e.g. before the guild quest..." />
      <div class="slot-name-btns">
        <button class="slot-name-cancel" id="sn-cancel">cancel</button>
        <button class="slot-name-save" id="sn-save">save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const input = modal.querySelector('#sn-input');
  input.focus(); input.select();
  modal.querySelector('#sn-cancel').onclick = () => modal.remove();
  modal.querySelector('#sn-save').onclick = () => {
    const name = input.value.trim() || 'save';
    modal.remove();
    onConfirm(name);
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { modal.querySelector('#sn-save').click(); }
    if (e.key === 'Escape') modal.remove();
  });
}

// ── RESTORE CONFIRM MODAL ─────────────────────────────────────
function confirmRestore(slotName, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'restore-confirm';
  modal.innerHTML = `
    <div class="restore-card">
      <div class="restore-title">load \u201c${slotName}\u201d?</div>
      <div class="restore-sub">
        This will overwrite your current game state.<br>
        Quest progress, XP, and settings will be replaced.<br>
        Images stay on this device.
      </div>
      <div class="restore-btns">
        <button class="restore-cancel" id="rc-cancel">cancel</button>
        <button class="restore-ok" id="rc-ok">load save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#rc-cancel').onclick = () => modal.remove();
  modal.querySelector('#rc-ok').onclick = () => { modal.remove(); onConfirm(); };
}

// ── FORMAT SLOT DATE ──────────────────────────────────────────
function fmtSlotDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ' \u00B7 ' + d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true }).toLowerCase();
}

// ── FORMAT SLOT META ──────────────────────────────────────────
function fmtSlotMeta(saveData) {
  if (!saveData?.meta) return '';
  const parts = [];
  if (saveData.meta.level)  parts.push('lv ' + saveData.meta.level);
  if (saveData.meta.streak) parts.push(saveData.meta.streak + 'd streak');
  const gold = saveData.xp_state?.gold;
  if (gold) parts.push(gold + 'g');
  const quests = saveData.quest?.resolved?.length;
  if (quests) parts.push(quests + ' quests done');
  return parts.join(' \u00B7 ');
}

// ── RENDER SAVE SLOTS ─────────────────────────────────────────
async function renderSaveSlots() {
  const wrap = document.getElementById('save-slots-wrap');
  if (!wrap) return;

  wrap.innerHTML = '<div style="font-size:0.65rem;color:var(--subtext);padding:8px 0">loading saves...</div>';

  let slots = [];
  try { slots = await loadAllSlots(); } catch(e) { slots = []; }

  // Map slot number → row data
  const slotMap = {};
  slots.forEach(s => { slotMap[s.slot] = s; });

  // Build 4 rows: 0=autosave, 1-3=manual
  const SLOT_DEFS = [
    { slot: 0, label: 'AUTO', title: 'autosave', desc: 'written automatically' },
    { slot: 1, label: 'S-1',  title: 'slot 1',   desc: 'manual save' },
    { slot: 2, label: 'S-2',  title: 'slot 2',   desc: 'manual save' },
    { slot: 3, label: 'S-3',  title: 'slot 3',   desc: 'manual save' },
  ];

  wrap.innerHTML = SLOT_DEFS.map(def => {
    const row  = slotMap[def.slot];
    const used = !!row;
    const meta = used ? fmtSlotMeta(row.save_data) : '';
    const date = used ? fmtSlotDate(row.saved_at)  : '';
    const name = used ? row.slot_name : '';
    const isAuto = def.slot === 0;

    // Autosave row — show/load only (no manual save)
    const actionBtns = isAuto
      ? (used ? `
          <button class="slt-btn load" onclick="window._slotLoad(${def.slot}, '${(name || def.title).replace(/'/g, "\\'")}')">load</button>
        ` : '')
      : `
          <button class="slt-btn save" onclick="window._slotSave(${def.slot}, '${(name || '').replace(/'/g, "\\'")}')">save</button>
          ${used ? `<button class="slt-btn load" onclick="window._slotLoad(${def.slot}, '${name.replace(/'/g, "\\'")}')">load</button>` : ''}
          ${used ? `<button class="slt-btn del"  onclick="window._slotDel(${def.slot})">&#xD7;</button>` : ''}
        `;

    return `
      <div class="save-slot-card ${isAuto ? 'autosave' : ''} ${used ? 'has-data' : ''}">
        <div class="save-slot-num">${def.label}</div>
        <div class="save-slot-info">
          ${used
            ? `<div class="save-slot-name">${name || def.title}</div>
               <div class="save-slot-meta">${meta}${meta && date ? ' \u00B7 ' : ''}${date}</div>`
            : `<div class="save-slot-empty">${isAuto ? 'no autosave yet' : 'empty'}</div>`
          }
        </div>
        <div class="save-slot-actions">${actionBtns}</div>
      </div>
    `;
  }).join('');
}

// ── SLOT HANDLERS (window globals for inline onclick) ─────────
function wireSlotHandlers() {
  // Manual save to slot
  window._slotSave = (slot, existingName) => {
    promptSlotName(existingName, async (name) => {
      showSaveToast('saving...', 'ok');
      try {
        await saveToSlot(slot, name);
        showSaveToast('\u2713 saved to slot ' + slot, 'ok');
        renderSaveSlots();
      } catch(e) { showSaveToast('save failed: ' + e.message, 'err'); }
    });
  };

  // Load from slot
  window._slotLoad = (slot, name) => {
    confirmRestore(name, async () => {
      showSaveToast('loading save...', 'ok');
      try {
        await restoreFromSlot(slot);
        showSaveToast('\u2713 restored \u2014 reloading...', 'ok');
        setTimeout(() => location.reload(), 1500);
      } catch(e) { showSaveToast('load failed: ' + e.message, 'err'); }
    });
  };

  // Delete slot
  window._slotDel = async (slot) => {
    if (!confirm('Delete slot ' + slot + '? This cannot be undone.')) return;
    try {
      await wipeSlot(slot);
      showSaveToast('slot ' + slot + ' cleared', 'ok');
      renderSaveSlots();
    } catch(e) { showSaveToast('delete failed', 'err'); }
  };
}

// ── INIT ──────────────────────────────────────────────────────
export function initAccountView() {
  const el = document.getElementById('view-account');
  if (!el) return;
  injectAccountStyles();
  wireSlotHandlers();

  if (!initialized) {
    initialized = true;
    el.innerHTML = `
      <div class="acct-scroll">

        <!-- ── Avatar + email ── -->
        <div class="acct-avatar-wrap">
          <div class="acct-avatar" id="acct-avatar-initial">?</div>
          <div class="acct-email" id="acct-email">\u2014</div>
        </div>

        <!-- ── Credits ── -->
        <div class="acct-section-title">credits</div>
        <div class="acct-credit-hero">
          <div class="acct-credit-amount" id="account-credits">0</div>
          <div class="acct-credit-label">credits remaining</div>
        </div>

        <!-- ── Account actions ── -->
        <div class="acct-section-title">account</div>

        <!-- PWA install banner -->
        <div class="pwa-install-btn" onclick="window.triggerInstall()"
          onmouseenter="this.style.borderColor='var(--teal)'"
          onmouseleave="this.style.borderColor='rgba(0,246,214,0.3)'">
          <div style="font-size:1.4rem;flex-shrink:0;">&#x1F4F1;</div>
          <div style="flex:1;">
            <div style="font-size:0.78rem;color:var(--teal);font-weight:700;letter-spacing:0.04em;">install spiralside</div>
            <div style="font-size:0.62rem;color:var(--subtext);margin-top:2px;line-height:1.4;">add to home screen \u00B7 works offline \u00B7 your files stay on device</div>
          </div>
          <div style="font-size:0.7rem;color:var(--teal);opacity:0.7;">+ add</div>
        </div>

        <button class="acct-signout-btn" onclick="window.handleSignout()">sign out</button>
        <button class="acct-buy-btn" onclick="window.switchView('store')">buy credits</button>

        <!-- ── SAVE SYSTEM ── -->
        <div class="acct-section-title">save data</div>
        <div class="save-system-wrap">

          <!-- Save slots -->
          <div id="save-slots-wrap">
            <div style="font-size:0.65rem;color:var(--subtext);padding:8px 0">loading saves...</div>
          </div>

          <!-- Download / Upload -->
          <div class="save-file-row">
            <button class="save-file-btn" onclick="window._saveDownload()">
              &#x2193; download save
            </button>
            <button class="save-file-btn upload" onclick="window._saveUpload()">
              &#x2191; restore file
            </button>
          </div>
        </div>

        <!-- ── About ── -->
        <div class="acct-section-title">about</div>
        <div class="acct-about-block">
          <p class="acct-about-tagline">
            Spiralside is your space. Everything you create here belongs to you \u2014
            we don't own it, train on it, or sell it. Ever.
          </p>
          <div class="acct-about-links">
            <a class="acct-about-link" href="https://spiralside.com/terms"      target="_blank" rel="noopener">Terms of Service</a>
            <a class="acct-about-link" href="https://spiralside.com/privacy"    target="_blank" rel="noopener">Privacy Policy</a>
            <a class="acct-about-link" href="https://spiralside.com/disclaimer" target="_blank" rel="noopener">Liability Disclaimer</a>
          </div>
          <div class="acct-about-contact">
            Questions? <a href="mailto:support@spiralside.com">support@spiralside.com</a><br>
            Legal: <a href="mailto:legal@spiralside.com">legal@spiralside.com</a><br>
            Complaints: <a href="mailto:complaints@spiralside.com">complaints@spiralside.com</a>
          </div>
          <div class="acct-version">spiralside v1.0 \u00B7 built in tennessee \u00B7 signal clean</div>
        </div>

      </div>
    `;
  }

  // File action globals
  window._saveDownload = async () => {
    showSaveToast('preparing download...', 'ok');
    try {
      const fname = await downloadSave();
      showSaveToast('\u2193 ' + fname, 'ok');
    } catch(e) { showSaveToast('download failed', 'err'); }
  };

  window._saveUpload = () => {
    uploadSave(
      () => { showSaveToast('\u2713 save restored \u2014 reloading...', 'ok'); setTimeout(() => location.reload(), 1800); },
      (msg) => showSaveToast('import failed: ' + msg, 'err')
    );
  };

  updateAccountView();
  renderSaveSlots();
}

export function updateAccountView() {
  const emailEl  = document.getElementById('acct-email');
  const avatarEl = document.getElementById('acct-avatar-initial');
  const crEl     = document.getElementById('account-credits');
  if (emailEl  && state.user?.email) emailEl.textContent  = state.user.email;
  if (avatarEl && state.user?.email) avatarEl.textContent = state.user.email[0].toUpperCase();
  if (crEl) crEl.textContent = state.isPaid ? Math.round(state.credits).toLocaleString() : '\u2014';
}
