import sys

FILE = r"C:/Users/quart/spiralside/js/app/views/store.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read()

print("lines:", src.count("\n"))

# Find video generation row dynamically
idx = src.find("video generation")
if idx < 0:
    print("MISS: video generation")
    sys.exit(1)

row_start = src.rfind('<div class="feature-row">', 0, idx)
row_end   = src.find('</div>', idx) + len('</div>')
old_video_row = src[row_start:row_end]
print("found video row ok, length:", len(old_video_row))

# Build new rows using only safe unicode -- NO surrogate-pair emoji
cannonize_row = (
    '\n      <div class="feature-row">'
    '<div class="feature-icon" style="font-size:0.85rem;">\u2234</div>'
    '<div class="feature-name">cannonize thread'
    '<div class="feature-sub">haiku \u00b7 5 free then cost+17%</div></div>'
    '<div class="feature-cost">~140 cr</div>'
    '</div>'
)

storage_section = (
    '\n      <div class="view-section-title" style="margin-top:24px;">storage plans</div>'

    '\n      <div class="feature-row" style="background:linear-gradient(135deg,'
    'rgba(0,246,214,0.06),rgba(123,95,255,0.06));border-color:rgba(0,246,214,0.2);">'
    '<div class="feature-icon" style="font-size:0.75rem;letter-spacing:0;">[free]</div>'
    '<div class="feature-name">free storage'
    '<div class="feature-sub">canon blocks only \u00b7 5 MB</div></div>'
    '<div class="feature-cost" style="color:var(--subtext)">free</div>'
    '</div>'

    '\n      <div class="feature-row" style="position:relative;overflow:hidden;">'
    '<div style="position:absolute;top:0;left:0;right:0;height:2px;'
    'background:linear-gradient(90deg,var(--teal),var(--purple));"></div>'
    '<div class="feature-icon" style="font-size:0.85rem;">\u2726</div>'
    '<div class="feature-name">archive plan'
    '<div class="feature-sub">2 GB total \u00b7 images, files, canon</div></div>'
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">'
    '<div class="feature-cost">$2 / mo</div>'
    '<div id="storage-plan-btn" onclick="window.toggleStoragePlan()" '
    'style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.08em;'
    'padding:3px 10px;border-radius:20px;cursor:pointer;'
    'border:1px solid var(--teal);color:var(--teal);background:transparent;">'
    'loading...</div>'
    '</div>'
    '</div>'
)

new_rows = old_video_row + cannonize_row + storage_section
src = src.replace(old_video_row, new_rows)
print("OK: new rows added")

# Tighten pricing explainer
old_exp = "1 credit = $0.0001 (1/100th of a penny). You pay exact API cost + 17% to cover hosting, taxes, and maintenance. No markup beyond that. Unused credits never expire."
new_exp = "1 cr = $0.0001. You pay API cost + 17% for hosting. No markup beyond that. Credits never expire."
if old_exp in src:
    src = src.replace(old_exp, new_exp)
    print("OK: explainer tightened")

# Add storage plan functions before toggleAdsOff
storage_js = '''
// -- STORAGE PLAN ----------------------------------------------------------
async function updateStoragePlanBtn() {
  const btn = document.getElementById('storage-plan-btn');
  if (!btn || !window._sb) return;
  try {
    const { data: { session } } = await window._sb.auth.getSession();
    if (!session) { btn.textContent = 'sign in'; return; }
    const { data } = await window._sb
      .from('user_usage')
      .select('storage_plan, storage_expires_at')
      .eq('user_id', session.user.id)
      .single();
    const plan = data?.storage_plan || 'free';
    const exp  = data?.storage_expires_at;
    if (plan === 'archive' && exp && new Date(exp) > new Date()) {
      btn.textContent = 'active until ' + new Date(exp).toLocaleDateString();
      btn.style.background = 'rgba(0,246,214,0.08)';
    } else {
      btn.textContent = 'subscribe $2/mo';
      btn.style.background = 'transparent';
    }
  } catch(e) { btn.textContent = 'subscribe $2/mo'; }
}

window.toggleStoragePlan = async function() {
  if (!state.user) { alert('Sign in first.'); return; }
  try {
    let token = state.session?.access_token;
    if (!token) { const {data} = await window._sb.auth.getSession(); token = data?.session?.access_token; }
    const r = await fetch('https://web-production-4e6f3.up.railway.app/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ amount: '2', storage_plan: 'archive' })
    });
    const d = await r.json();
    if (!r.ok) { alert(d.detail || 'Error'); return; }
    window.location.href = d.approve_url;
  } catch(e) { alert('Payment error. Try again.'); }
};

'''

anchor = "// -- TOGGLE ADS OFF"
if anchor not in src:
    # try alternate
    anchor = "window.toggleAdsOff"

if anchor in src:
    src = src.replace(anchor, storage_js + anchor, 1)
    print("OK: storage plan JS added")
else:
    # just append before last line
    src = src.rstrip() + "\n" + storage_js
    print("OK: storage plan JS appended")

# Wire updateStoragePlanBtn into initStoreView
if "setTimeout(updateStoragePlanBtn" not in src:
    src = src.replace(
        "updateAdsOffBtn();\n}",
        "updateAdsOffBtn();\n  setTimeout(updateStoragePlanBtn, 500);\n}",
        1
    )
    print("OK: updateStoragePlanBtn wired")

with open(FILE, "w", encoding="utf-8") as f:
    f.write(src)
print("DONE — lines:", src.count("\n"))
