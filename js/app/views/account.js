// ============================================================
// SPIRALSIDE — ACCOUNT VIEW v2.1
// Full module — owns its own HTML and CSS like store.js
// Nimbis anchor: js/app/views/account.js
import { syncLoadAll, syncSave } from '../sync.js';
import { generateSoulPrint }          from '../pdf.js';

export async function exportSoulPrintPDF() {
  // Read directly from IDB -- window.CHARACTERS may not be populated yet
  const { dbGet } = await import('../db.js');
  const you = await dbGet('sheets', 'you') || {};
  await generateSoulPrint(you);
}

export async function exportUserData() {
  const records = await syncLoadAll();
  if (!records.length) { alert('No cloud data yet. Save your You card and Quest character first.'); return; }
  const blob = new Blob([JSON.stringify({ spiralside_backup: true, exported_at: new Date().toISOString(), records }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'spiralside-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
}

export function importUserData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async e => {
    try {
      const parsed = JSON.parse(await e.target.files[0].text());
      if (!parsed.spiralside_backup || !parsed.records?.length) { alert('Invalid backup file.'); return; }
      for (const rec of parsed.records) await syncSave(rec.record_type, rec.data);
      alert('Restored ' + parsed.records.length + ' records. Reload to see your data.');
    } catch(err) { alert('Could not read file: ' + err.message); }
  };
  input.click();
}
// Added: About section at bottom with legal links + version
// ============================================================
import { state } from '../state.js';

let initialized = false;

function injectAccountStyles() {
  if (document.getElementById('ss-account-styles')) return;
  const s = document.createElement('style');
  s.id = 'ss-account-styles';
  s.textContent = `
    #view-account { flex-direction: column; overflow: hidden; }
    .acct-scroll { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px 16px 40px; }
    .acct-avatar-wrap { text-align: center; padding: 32px 0 24px; }
    .acct-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--teal), var(--accent)); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; border: 3px solid var(--border); color: #0a0a0f; }
    .acct-email { font-size: 0.8rem; color: var(--subtext); text-align: center; margin-bottom: 4px; }
    .acct-credit-hero { background: linear-gradient(135deg, rgba(0,246,214,0.08), rgba(124,106,247,0.08)); border: 1px solid var(--border); border-radius: 16px; padding: 28px 20px; text-align: center; margin-bottom: 20px; }
    .acct-credit-amount { font-family: var(--font-display); font-size: 2.8rem; font-weight: 800; color: var(--teal); line-height: 1; }
    .acct-credit-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin-top: 6px; }
    .acct-section-title { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; }
    .acct-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .acct-signout-btn { width: 100%; padding: 13px; background: transparent; border: 1px solid var(--border); border-radius: 12px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.8rem; cursor: pointer; letter-spacing: 0.04em; transition: all 0.2s; margin-bottom: 10px; display: block; }
    .acct-signout-btn:hover { border-color: var(--accent2); color: var(--accent2); }
    .acct-buy-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--teal), var(--accent)); border: none; border-radius: 12px; color: #fff; font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s; display: block; }
    .acct-buy-btn:hover { opacity: 0.88; }

    
    /* ── SAVE SLOT (game-style) ── */
    .save-section-title { font-size: 0.52rem; letter-spacing: 0.22em; color: var(--subtext); text-transform: uppercase; margin-bottom: 10px; }
    .save-slot { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; background: var(--surface); font-family: 'DM Mono', monospace; }
    .save-slot.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; opacity: 0.4; }
    .save-slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .save-slot-label { font-size: 0.5rem; letter-spacing: 0.2em; color: var(--subtext); text-transform: uppercase; }
    .save-slot-ver { font-size: 0.5rem; color: var(--teal); letter-spacing: 0.1em; border: 1px solid rgba(0,246,214,0.2); border-radius: 4px; padding: 1px 6px; }
    .save-slot-name { font-size: 1rem; font-family: var(--font-display); font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .save-slot-sub { font-size: 0.6rem; color: var(--subtext); margin-bottom: 10px; }
    .save-slot-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
    .sv-stat { background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 7px 4px; text-align: center; }
    .sv-stat-val { font-size: 0.88rem; font-weight: 700; color: var(--text); font-family: var(--font-display); }
    .sv-stat-lbl { font-size: 0.46rem; letter-spacing: 0.1em; color: var(--subtext); text-transform: uppercase; margin-top: 2px; }
    .save-slot-time { font-size: 0.54rem; color: var(--subtext); letter-spacing: 0.03em; }
    .save-slot-empty-text { font-size: 0.7rem; letter-spacing: 0.2em; color: var(--subtext); margin-top: 8px; }
    .save-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin-bottom: 10px; }
    .sv-btn { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 10px 6px; border-radius: 8px; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 0.58rem; letter-spacing: 0.08em; text-transform: uppercase; transition: all 0.15s; border: 1px solid transparent; }
    .sv-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .sv-btn-primary { background: linear-gradient(135deg, var(--teal), var(--accent)); color: #0a0a0f; }
    .sv-btn-primary:hover:not(:disabled) { opacity: 0.85; }
    .sv-btn-secondary { background: var(--surface); border-color: var(--border); color: var(--subtext); }
    .sv-btn-secondary:hover:not(:disabled) { border-color: var(--teal); color: var(--text); }
    .save-status { font-size: 0.62rem; letter-spacing: 0.06em; min-height: 18px; margin-bottom: 6px; text-align: center; }
    .save-status.ok  { color: var(--teal); }
    .save-status.err { color: var(--pink, #f76a8a); }
    .save-tip { font-size: 0.56rem; color: var(--subtext); text-align: center; line-height: 1.5; padding: 4px 0 0; opacity: 0.6; }

    /* __ About section __ */
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


// ── SAVE SLOT UI ──────────────────────────────────────────────
function renderSaveSlot(container) {
  const info = window.getSaveInfo ? window.getSaveInfo() : null;
  const slot = info ? `
    <div class="save-slot filled">
      <div class="save-slot-header">
        <div class="save-slot-label">SLOT 01</div>
        <div class="save-slot-ver">v${info.version}</div>
      </div>
      <div class="save-slot-name">${info.botName}</div>
      <div class="save-slot-sub">${info.userEmail}</div>
      <div class="save-slot-stats">
        <div class="sv-stat"><div class="sv-stat-val">${info.level}</div><div class="sv-stat-lbl">LVL</div></div>
        <div class="sv-stat"><div class="sv-stat-val">${info.streak}d</div><div class="sv-stat-lbl">STREAK</div></div>
        <div class="sv-stat"><div class="sv-stat-val">${info.questCount}</div><div class="sv-stat-lbl">QUESTS</div></div>
        <div class="sv-stat"><div class="sv-stat-val">${info.gold}g</div><div class="sv-stat-lbl">GOLD</div></div>
      </div>
      <div class="save-slot-time">\u23F0 ${info.savedAt} &nbsp;&middot;&nbsp; ${info.savedAtFull}</div>
    </div>
  ` : `
    <div class="save-slot empty">
      <div class="save-slot-label">SLOT 01</div>
      <div class="save-slot-empty-text">NO DATA</div>
    </div>
  `;
  container.innerHTML = `
    <div class="save-section-title">SAVE DATA</div>
    ${slot}
    <div class="save-actions">
      <button class="sv-btn sv-btn-primary" id="sv-save-now">\u{1F4BE} SAVE</button>
      <button class="sv-btn sv-btn-secondary" id="sv-download">\u2B07 DOWNLOAD</button>
      <button class="sv-btn sv-btn-secondary" id="sv-restore-btn">\u2B06 RESTORE</button>
    </div>
    <div class="save-status" id="sv-status"></div>
    <input type="file" id="sv-file-input" accept=".json" style="display:none" />
    <div class="save-tip">files are portable &mdash; download to back up &middot; restore to migrate devices</div>
  `;

  const status = container.querySelector('#sv-status');

  container.querySelector('#sv-save-now').onclick = async () => {
    const btn = container.querySelector('#sv-save-now');
    btn.disabled = true; btn.textContent = '\u23F3 SAVING...'; status.textContent = '';
    try {
      if (window.masterSave) await window.masterSave();
      status.textContent = '\u2714 saved to cloud'; status.className = 'save-status ok';
      setTimeout(() => renderSaveSlot(container), 700);
    } catch(e) {
      status.textContent = '\u2716 save failed \u2014 check connection'; status.className = 'save-status err';
    }
    btn.disabled = false; btn.innerHTML = '\u{1F4BE} SAVE';
  };

  container.querySelector('#sv-download').onclick = async () => {
    const btn = container.querySelector('#sv-download');
    btn.disabled = true; btn.textContent = '\u23F3 PACKING...';
    try {
      const fname = await window.downloadSave();
      status.textContent = '\u2714 ' + fname; status.className = 'save-status ok';
    } catch(e) {
      status.textContent = '\u2716 download failed'; status.className = 'save-status err';
    }
    btn.disabled = false; btn.innerHTML = '\u2B07 DOWNLOAD';
  };

  container.querySelector('#sv-restore-btn').onclick = () => container.querySelector('#sv-file-input').click();
  container.querySelector('#sv-file-input').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const btn = container.querySelector('#sv-restore-btn');
    btn.disabled = true; btn.textContent = '\u23F3 LOADING...'; status.textContent = '';
    try {
      await window.uploadSave(file);
      status.textContent = '\u2714 restored! reloading...'; status.className = 'save-status ok';
      setTimeout(() => window.location.reload(), 1200);
    } catch(err) {
      status.textContent = '\u2716 ' + (err.message || 'restore failed'); status.className = 'save-status err';
    }
    btn.disabled = false; btn.innerHTML = '\u2B06 RESTORE';
    e.target.value = '';
  };
}

export function initAccountView() {
  const el = document.getElementById('view-account');
  if (!el) return;
  injectAccountStyles();
  if (!initialized) {
    initialized = true;
    el.innerHTML = `
      <div class="acct-scroll">

        <!-- ── Avatar + email ── -->
        <div class="acct-avatar-wrap">
          <div class="acct-avatar" id="acct-avatar-initial">?</div>
          <div class="acct-email" id="acct-email">—</div>
        </div>

        <!-- ── Credits ── -->
        <div class="acct-section-title">credits</div>
        <div class="acct-credit-hero">
          <div class="acct-credit-amount" id="account-credits">0</div>
          <div class="acct-credit-label">credits remaining</div>
        </div>

        <!-- ── Save slot ── -->
        <div class="acct-section-title">save game</div>
        <div id="acct-save-slot"></div>

        <!-- ── Account actions ── -->
        <div class="acct-section-title">account</div>
        <!-- ── PWA Install Banner — hidden until beforeinstallprompt fires ── -->
        <div class="pwa-install-btn" onclick="window.triggerInstall()" style="
          display:none;align-items:center;gap:12px;
          background:linear-gradient(135deg,rgba(0,246,214,0.1),rgba(123,95,255,0.1));
          border:1px solid rgba(0,246,214,0.3);border-radius:12px;
          padding:14px 16px;margin-bottom:12px;cursor:pointer;transition:all 0.2s;"
          onmouseenter="this.style.borderColor='var(--teal)'"
          onmouseleave="this.style.borderColor='rgba(0,246,214,0.3)'">
          <div style="font-size:1.4rem;flex-shrink:0;">📱</div>
          <div style="flex:1;">
            <div style="font-size:0.78rem;color:var(--teal);font-weight:700;letter-spacing:0.04em;">install spiralside</div>
            <div style="font-size:0.62rem;color:var(--subtext);margin-top:2px;line-height:1.4;">add to home screen · works offline · your files stay on device</div>
          </div>
          <div style="font-size:0.7rem;color:var(--teal);opacity:0.7;">+ add</div>
        </div>
        <button class="acct-signout-btn" onclick="window.handleSignout()">sign out</button>
        <button class="acct-buy-btn" onclick="window.switchView('store')">buy credits</button>

        <!-- ── About ── -->
        <div class="acct-section-title">about</div>
        <div class="acct-about-block">
          <p class="acct-about-tagline">
            Spiralside is your space. Everything you create here belongs to you —
            we don't own it, train on it, or sell it. Ever.
          </p>
          <div class="acct-about-links">
            <a class="acct-about-link" href="https://spiralside.com/terms" target="_blank" rel="noopener">Terms of Service</a>
            <a class="acct-about-link" href="https://spiralside.com/privacy" target="_blank" rel="noopener">Privacy Policy</a>
            <a class="acct-about-link" href="https://spiralside.com/disclaimer" target="_blank" rel="noopener">Liability Disclaimer</a>
          </div>
          <div class="acct-about-contact">
            Questions? <a href="mailto:support@spiralside.com">support@spiralside.com</a><br>
            Legal: <a href="mailto:legal@spiralside.com">legal@spiralside.com</a><br>
            Complaints: <a href="mailto:complaints@spiralside.com">complaints@spiralside.com</a>
          </div>
          <div class="acct-version">spiralside v1.0 · built in tennessee · signal clean</div>
        </div>

      </div>
    `;
  }
  updateAccountView();
  // Render save slot
  const _svEl = document.getElementById('acct-save-slot');
  if (_svEl) renderSaveSlot(_svEl);
}

export function updateAccountView() {
  const emailEl  = document.getElementById('acct-email');
  const avatarEl = document.getElementById('acct-avatar-initial');
  const crEl     = document.getElementById('account-credits');
  if (emailEl  && state.user?.email) emailEl.textContent  = state.user.email;
  if (avatarEl && state.user?.email) avatarEl.textContent = state.user.email[0].toUpperCase();
  if (crEl) crEl.textContent = state.isPaid ? Math.round(state.credits).toLocaleString() : '—';
}
