// ============================================================
// SPIRALSIDE -- SYNC v1.0
// Supabase cloud backup for all user data
// Nimbis anchor: js/app/sync.js
// ============================================================

import { state } from './state.js';

const SUPA_URL = 'https://qfawusrelwthxabfbglg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E';

export async function syncSave(record_type, data) {
  const token = state.session?.access_token;
  if (!token) return;
  try {
    await fetch(SUPA_URL + '/rest/v1/user_data', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey':        SUPA_KEY,
        'Prefer':        'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: state.user.id, record_type, data, updated_at: new Date().toISOString() }),
    });
  } catch(e) { console.warn('[sync] save failed:', record_type, e); }
}

export async function syncLoad(record_type) {
  const token = state.session?.access_token;
  if (!token) return null;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&record_type=eq.' + record_type + '&select=data',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    return (rows && rows[0]) ? rows[0].data : null;
  } catch(e) { console.warn('[sync] load failed:', record_type, e); return null; }
}

export async function syncLoadAll() {
  const token = state.session?.access_token;
  if (!token) return [];
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&select=record_type,data,updated_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    return await r.json() || [];
  } catch(e) { console.warn('[sync] loadAll failed:', e); return []; }
}
