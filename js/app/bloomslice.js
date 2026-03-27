// ============================================================
// SPIRALSIDE — BLOOMSLICE TAB v1.0
// Product showcase for Bloomslice modular teak mounting system
// Static frontend — links to Amazon listing for purchase
// Nimbis anchor: js/app/bloomslice.js
// ============================================================

export function initBloomslice() {

  // ── Only stamp HTML once ───────────────────────────────────
  const container = document.getElementById('view-bloomslice');
  if (!container || container.dataset.init) return;
  container.dataset.init = '1';

  // ── Inject styles ─────────────────────────────────────────
  if (!document.getElementById('bloomslice-styles')) {
    const s = document.createElement('style');
    s.id = 'bloomslice-styles';
    s.textContent = `
      #bs-inner { width: 100%; }
      .bs-hero {
        position: relative;
        padding: 32px 20px 28px;
        background: linear-gradient(160deg, #1a0f05 0%, #0d0902 60%, var(--bg) 100%);
        border-bottom: 1px solid #3a2510;
        overflow: hidden;
      }
      .bs-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          45deg, transparent, transparent 12px,
          rgba(200,145,74,0.03) 12px, rgba(200,145,74,0.03) 13px
        );
        pointer-events: none;
      }
      .bs-brand {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 1.8rem;
        letter-spacing: -0.02em;
        color: #C8914A;
        filter: drop-shadow(0 0 20px rgba(200,145,74,0.4));
        margin-bottom: 4px;
        position: relative;
      }
      .bs-tagline {
        font-size: 0.7rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(200,145,74,0.6);
        margin-bottom: 20px;
        position: relative;
      }
      .bs-hero-desc {
        font-size: 0.82rem;
        line-height: 1.65;
        color: var(--text);
        opacity: 0.85;
        max-width: 380px;
        margin-bottom: 24px;
        position: relative;
      }
      .bs-buy-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 24px;
        background: #C8914A;
        border: none;
        border-radius: 10px;
        color: #0d0902;
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 0.9rem;
        letter-spacing: 0.04em;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
        box-shadow: 0 0 30px rgba(200,145,74,0.35);
        position: relative;
      }
      .bs-buy-btn:hover {
        background: #e0a85c;
        box-shadow: 0 0 40px rgba(200,145,74,0.55);
        transform: translateY(-1px);
      }
      .bs-price-badge {
        display: inline-block;
        margin-left: 14px;
        padding: 6px 12px;
        background: rgba(200,145,74,0.12);
        border: 1px solid rgba(200,145,74,0.3);
        border-radius: 20px;
        font-size: 0.78rem;
        color: #C8914A;
        letter-spacing: 0.04em;
        position: relative;
      }
      .bs-hero-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        position: relative;
      }
      .bs-section {
        padding: 20px 20px 0;
      }
      .bs-section-label {
        font-size: 0.6rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #C8914A;
        opacity: 0.65;
        margin-bottom: 12px;
      }
      .bs-product-card {
        background: var(--surface);
        border: 1px solid #3a2510;
        border-radius: 14px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      .bs-card-top {
        background: linear-gradient(135deg, #1a0f05, #120a03);
        padding: 20px;
        display: flex;
        gap: 16px;
        align-items: flex-start;
        border-bottom: 1px solid #3a2510;
      }
      .bs-svg-slot {
        width: 100px;
        height: 100px;
        flex-shrink: 0;
        background: #0d0902;
        border: 1px solid #3a2510;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .bs-card-info { flex: 1; min-width: 0; }
      .bs-product-name {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text);
        margin-bottom: 4px;
        line-height: 1.3;
      }
      .bs-product-sub {
        font-size: 0.68rem;
        color: rgba(200,145,74,0.7);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .bs-stars {
        font-size: 0.75rem;
        color: #FFD93D;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
      }
      .bs-specs {
        padding: 14px 20px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .bs-spec { display: flex; flex-direction: column; gap: 2px; }
      .bs-spec-label {
        font-size: 0.58rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--subtext);
      }
      .bs-spec-value { font-size: 0.78rem; color: var(--text); }
      .bs-card-footer {
        padding: 12px 20px;
        border-top: 1px solid #3a2510;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }
      .bs-amazon-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 18px;
        background: #C8914A;
        border: none;
        border-radius: 8px;
        color: #0d0902;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 0.78rem;
        letter-spacing: 0.04em;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
      }
      .bs-amazon-link:hover { background: #e0a85c; }
      .bs-card-price {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 1.1rem;
        color: #C8914A;
      }
      .bs-coming-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 16px;
      }
      .bs-coming-card {
        background: var(--surface);
        border: 1px dashed #3a2510;
        border-radius: 12px;
        padding: 20px 14px;
        text-align: center;
        min-height: 110px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        opacity: 0.6;
      }
      .bs-coming-icon { font-size: 1.6rem; }
      .bs-coming-label {
        font-size: 0.65rem;
        letter-spacing: 0.1em;
        color: var(--subtext);
        text-transform: uppercase;
      }
      .bs-coming-badge {
        font-size: 0.58rem;
        color: #C8914A;
        border: 1px solid rgba(200,145,74,0.3);
        border-radius: 20px;
        padding: 2px 8px;
        letter-spacing: 0.06em;
      }
      .bs-info-strip {
        margin: 0 20px 20px;
        padding: 14px 16px;
        background: rgba(200,145,74,0.06);
        border: 1px solid rgba(200,145,74,0.2);
        border-radius: 10px;
        font-size: 0.72rem;
        line-height: 1.6;
        color: var(--subtext);
      }
      .bs-info-strip strong { color: #C8914A; }
    `;
    document.head.appendChild(s);
  }

  // Placeholder SVG — replace with real xTool export later
  const PRODUCT_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect x="8" y="18" width="84" height="64" rx="3" fill="none" stroke="#C8914A" stroke-width="1.5" opacity="0.7"/>
    <rect x="14" y="24" width="22" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="40" y="24" width="22" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="66" y="24" width="16" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="14" y="36" width="16" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="34" y="36" width="22" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="60" y="36" width="22" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="14" y="48" width="30" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="48" y="48" width="14" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <rect x="66" y="48" width="16" height="8" rx="1" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.5"/>
    <circle cx="14" cy="62" r="2.5" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.6"/>
    <circle cx="50" cy="62" r="2.5" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.6"/>
    <circle cx="86" cy="62" r="2.5" fill="none" stroke="#C8914A" stroke-width="1" opacity="0.6"/>
    <rect x="8" y="72" width="14" height="6" rx="1" fill="none" stroke="#8B6234" stroke-width="1" opacity="0.5"/>
    <rect x="78" y="72" width="14" height="6" rx="1" fill="none" stroke="#8B6234" stroke-width="1" opacity="0.5"/>
    <text x="50" y="92" font-family="monospace" font-size="5" fill="#C8914A" opacity="0.5" text-anchor="middle">BLOOMSLICE</text>
  </svg>`;

  container.innerHTML = `
    <div id="bs-inner">
      <div class="bs-hero">
        <div class="bs-brand">Bloomslice</div>
        <div class="bs-tagline">Modular Teak Mounting System</div>
        <div class="bs-hero-desc">
          Precision laser-cut teak wood mounting plates for Raspberry Pi, Arduino,
          and electronics. Built for makers, prototypers, and creative desks.
        </div>
        <div class="bs-hero-row">
          <a class="bs-buy-btn" href="https://a.co/d/087erh90" target="_blank" rel="noopener">
            Buy on Amazon
          </a>
          <span class="bs-price-badge">$15.28 · Prime</span>
        </div>
      </div>

      <div class="bs-section">
        <div class="bs-section-label">Featured Product</div>
        <div class="bs-product-card">
          <div class="bs-card-top">
            <div class="bs-svg-slot">${PRODUCT_SVG}</div>
            <div class="bs-card-info">
              <div class="bs-product-name">Bloomslice Modular Teak Mounting Plate</div>
              <div class="bs-product-sub">Teak Veneer · Laser Cut · Unfinished</div>
              <div class="bs-stars">&#9733;&#9733;&#9733;&#9733;&#9733; <span style="color:var(--subtext);font-size:0.65rem">5.0 · Amazon</span></div>
            </div>
          </div>
          <div class="bs-specs">
            <div class="bs-spec"><span class="bs-spec-label">Dimensions</span><span class="bs-spec-value">7 × 10 × 0.5 in</span></div>
            <div class="bs-spec"><span class="bs-spec-label">Material</span><span class="bs-spec-value">Teak veneer</span></div>
            <div class="bs-spec"><span class="bs-spec-label">Finish</span><span class="bs-spec-value">Unfinished</span></div>
            <div class="bs-spec"><span class="bs-spec-label">Brand</span><span class="bs-spec-value">BLOOMSLICE TEAK</span></div>
            <div class="bs-spec"><span class="bs-spec-label">Compatible</span><span class="bs-spec-value">Pi, Arduino, ESP32</span></div>
            <div class="bs-spec"><span class="bs-spec-label">Ships via</span><span class="bs-spec-value">Amazon Prime</span></div>
          </div>
          <div class="bs-card-footer">
            <span class="bs-card-price">$15.28</span>
            <a class="bs-amazon-link" href="https://a.co/d/087erh90" target="_blank" rel="noopener">View on Amazon</a>
          </div>
        </div>
      </div>

      <div class="bs-section">
        <div class="bs-section-label">New Models — Coming Soon</div>
        <div class="bs-coming-grid">
          <div class="bs-coming-card">
            <div class="bs-coming-icon">&#127795;</div>
            <div class="bs-coming-label">Model 2</div>
            <div class="bs-coming-badge">dropping soon</div>
          </div>
          <div class="bs-coming-card">
            <div class="bs-coming-icon">&#128295;</div>
            <div class="bs-coming-label">Model 3</div>
            <div class="bs-coming-badge">dropping soon</div>
          </div>
          <div class="bs-coming-card">
            <div class="bs-coming-icon">&#128208;</div>
            <div class="bs-coming-label">Model 4</div>
            <div class="bs-coming-badge">dropping soon</div>
          </div>
          <div class="bs-coming-card">
            <div class="bs-coming-icon">&#9889;</div>
            <div class="bs-coming-label">Kit Bundle</div>
            <div class="bs-coming-badge">dropping soon</div>
          </div>
        </div>
      </div>

      <div class="bs-info-strip">
        <strong>Bloomslice</strong> is a product line by <strong>quarterbitgames</strong>.
        Modular wood mounting for the maker generation. SVG part viewer and interactive builder coming soon.
      </div>
    </div>
  `;
}
