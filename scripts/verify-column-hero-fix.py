"""
Verify column hero contain-fix by injecting the new CSS overrides on the live
column.namae-studio.com pages and capturing before/after screenshots at three
viewports.

Usage: python scripts/verify-column-hero-fix.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path("test_screenshots/column-hero-fix")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# CSS that mirrors the edits in column-child-theme/affinger4-child/style.css
OVERRIDE_CSS = """
.article-hero {
  position: relative !important;
  display: block !important;
  max-width: 1200px !important;
  margin: 16px auto 32px !important;
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
.article-hero__image {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
}
.article-hero__overlay { display: none !important; }
.article-hero__inner {
  position: relative !important;
  padding: 24px 0 8px !important;
  display: block !important;
  min-height: 0 !important;
}
.article-hero__content { max-width: 720px !important; color: inherit !important; }
.article-hero__date { color: #5C4F44 !important; }
.article-hero__title { color: #3D3D29 !important; text-shadow: none !important; }
@media (min-width: 768px) {
  .article-hero__inner { padding: 32px 0 16px !important; }
}
"""

PAGES = [
    ("akachan-benpi", "https://column.namae-studio.com/akachan-benpi-kaishouhou/"),
    ("waamama", "https://column.namae-studio.com/waamama-asa-jitan-routine/"),
    ("hoikuen", "https://column.namae-studio.com/hoikuen-junbi-list/"),
    ("top", "https://column.namae-studio.com/"),
]

VIEWPORTS = [
    ("mobile", 375, 812),
    ("tablet", 768, 1024),
    ("desktop", 1280, 900),
]


def capture(page, slug, label, w, h):
    page.set_viewport_size({"width": w, "height": h})
    page.wait_for_load_state("networkidle", timeout=15000)
    # Wait for any hero image to settle
    page.wait_for_timeout(800)
    target = OUT_DIR / f"{slug}_{label}_{w}x{h}.png"
    # Capture viewport (hero region) for clarity
    page.screenshot(path=str(target), full_page=False)
    print(f"  saved {target}")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, url in PAGES:
            print(f"\n=== {slug} :: {url}")
            for label_kind in ("before", "after"):
                ctx = browser.new_context()
                page = ctx.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                if label_kind == "after":
                    page.add_style_tag(content=OVERRIDE_CSS)
                for vp_label, w, h in VIEWPORTS:
                    capture(page, slug, f"{label_kind}_{vp_label}", w, h)
                ctx.close()
        browser.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
