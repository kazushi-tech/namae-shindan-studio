"""Measure actual vertical gaps around the hero on the live page (with v1.2.0 CSS injected)."""
from playwright.sync_api import sync_playwright

URL = "https://column.namae-studio.com/akachan-benpi-kaishouhou/?cb=measure"

OVERRIDE_CSS = """
.article-hero {
  position: relative !important;
  display: block !important;
  max-width: 1200px !important;
  margin: 0 auto 24px !important;
  padding: 0 16px !important;
  background: transparent !important;
  aspect-ratio: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow: visible !important;
}
.article-hero__media {
  position: relative !important;
  inset: auto !important;
  width: 100% !important;
  aspect-ratio: 16 / 9 !important;
  max-height: 480px !important;
  overflow: hidden !important;
  background-color: #FFF8F0 !important;
  border-radius: 20px !important;
  box-shadow: 0 2px 16px rgba(36,25,23,0.06) !important;
}
.article-hero__image { width: 100% !important; height: 100% !important; object-fit: contain !important; object-position: center !important; }
.article-hero__overlay { display: none !important; }
.article-hero__inner { position: relative !important; padding: 16px 0 4px !important; display: block !important; min-height: 0 !important; }
.article-hero__content { max-width: 720px !important; color: inherit !important; }
.article-hero__date { color: #5C4F44 !important; }
.article-hero__title { color: #3D3D29 !important; text-shadow: none !important; }
@media (min-width: 768px) {
  .article-hero__inner { padding: 20px 0 8px !important; }
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.add_style_tag(content=OVERRIDE_CSS)
    page.wait_for_timeout(500)
    boxes = page.evaluate(
        """() => {
          const sel = ['.site-header', '.site-main', '.article-hero', '.article-hero__media', '.article-hero__inner', '.article-hero__title', '.content-layout', '.article-body'];
          const out = {};
          for (const s of sel) {
            const el = document.querySelector(s);
            if (!el) { out[s] = null; continue; }
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            out[s] = {
              top: Math.round(r.top + window.scrollY),
              bottom: Math.round(r.bottom + window.scrollY),
              height: Math.round(r.height),
              marginTop: cs.marginTop,
              marginBottom: cs.marginBottom,
              paddingTop: cs.paddingTop,
              paddingBottom: cs.paddingBottom,
            };
          }
          return out;
        }"""
    )
    for k, v in boxes.items():
        print(f"{k}: {v}")
    page.screenshot(path="test_screenshots/column-hero-fix/measure_full.png", full_page=True)
    ctx.close()
    browser.close()
