// ============================================================
// SPIRALSIDE — SYNC STORAGE UI helpers
// Paste these functions into js/app/views/account.js
// OR inject from main.js after onAppReady
// Nimbis anchor: sync_storage_ui
// ============================================================

// Shows storage usage bar in account view
// Call after onAppReady — needs _sb and state
export async function renderStorageBar(containerEl) {
  if (!containerEl) return;
  const { getStorageUsage, getStoragePlan } = await import('./sync.js');
  const { db_bytes, plan } = await getStorageUsage();

  const FREE_LIMIT    = 5 * 1024 * 1024;   // 5MB
  const ARCHIVE_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB
  const limit = plan === 'archive' ? ARCHIVE_LIMIT : FREE_LIMIT;
  const pct   = Math.min(100, Math.round((db_bytes / limit) * 100));
  const color = pct > 90 ? 'var(--pink)' : pct > 70 ? '#FFD93D' : 'var(--teal)';

  const fmtBytes = b => b < 1024 ? b + ' B'
    : b < 1024*1024 ? Math.round(b/1024) + ' KB'
    : (b/1024/1024).toFixed(1) + ' MB';

  containerEl.innerHTML = `
    <div style="margin:16px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--subtext);">cloud storage</span>
        <span style="font-size:0.68rem;color:var(--subtext);">${fmtBytes(db_bytes)} / ${plan === 'archive' ? '2 GB' : '5 MB'}</span>
      </div>
      <div style="height:4px;background:var(--muted);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width 0.5s;"></div>
      </div>
      <div style="font-size:0.6rem;color:var(--subtext);margin-top:5px;">
        ${plan === 'archive'
          ? '&#10022; archive plan &middot; 2 GB cloud storage'
          : 'free plan &middot; text data only &middot; <a href="#" onclick="window.switchView(\'store\')" style="color:var(--teal);text-decoration:none;">upgrade $2/mo for 2 GB image backup</a>'}
      </div>
    </div>`;
}

// Saves you_card to cloud — strips images, optionally backs up avatar to Storage
export async function syncYouCard(youCardData) {
  const { syncSave, syncSaveImage, getStoragePlan } = await import('./sync.js');

  // Always save text fields to DB (stripped)
  await syncSave('you_card', youCardData);

  // If user has archive plan and has avatar image, back it up to Storage
  const avatarData = youCardData.portrait_base64 || youCardData.avatar_base64;
  if (avatarData && avatarData.startsWith('data:image/')) {
    const plan = await getStoragePlan();
    if (plan === 'archive') {
      await syncSaveImage('you_card/avatar.png', avatarData);
      console.log('[sync] you_card avatar backed up to Storage');
    } else {
      console.log('[sync] you_card avatar stays on device (free plan)');
    }
  }
}

// Saves a print/character card — text to DB, portrait to Storage if archive
export async function syncPrint(printData) {
  const { syncSave, syncSaveImage, getStoragePlan } = await import('./sync.js');
  const id = printData.id || printData.card_id;
  if (!id) return;

  await syncSave('print_' + id, printData);

  const portrait = printData.portrait_base64;
  if (portrait && portrait.startsWith('data:image/')) {
    const plan = await getStoragePlan();
    if (plan === 'archive') {
      await syncSaveImage('prints/' + id + '.png', portrait);
    }
  }
}

// Saves a scene — metadata to DB, panel images to Storage if archive
export async function syncScene(sceneData) {
  const { syncSave, syncSaveImage, getStoragePlan } = await import('./sync.js');
  const id = sceneData.id;
  if (!id) return;

  await syncSave('scene_' + id, sceneData);

  // Panel images
  const panels = sceneData.panels || [];
  if (panels.length) {
    const plan = await getStoragePlan();
    if (plan === 'archive') {
      for (let i = 0; i < panels.length; i++) {
        const img = panels[i]?.dataURL || panels[i]?.image;
        if (img && img.startsWith('data:image/')) {
          await syncSaveImage('scenes/' + id + '/panel_' + i + '.png', img);
        }
      }
    }
  }
}
