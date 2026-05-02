"""Compare multiple hero layout candidates at multiple viewports.

Variants:
  A) Container-bound, 16:9 capped at 480px, rounded card
  B) Container-bound, 16:9 capped at 360px, rounded card (tighter)
  C) Edge-to-edge but capped at 380px (balanced)
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("test_screenshots/column-hero-fix/variants")
OUT.mkdir(parents=True, exist_ok=True)

URL = "https://column.namae-studio.com/akachan-benpi-kaishouhou/?cb=variants"

# Common hide-overlay reset shared by all variants (clears v1.1.0 state)
BASE_RESET = """
.article-hero__overlay { display: none !important; }
.article-hero__title { color: #3D3D29 !important; text-shadow: none !important; }
.article-hero__date { color: #5C4F44 !important; }
"""

VARIANTS = {
    "A_container_480": BASE_RESET + """
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
.article-hero__inner {
  position: relative !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 24px 16px 8px !important;
  display: block !important;
  min-height: 0 !important;
}
.article-hero__content { max-width: 720px !important; color: inherit !important; }
""",
    "B_container_360": BASE_RESET + """
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
  max-height: 360px !important;
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
.article-hero__inner {
  position: relative !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 20px 16px 4px !important;
  display: block !important;
  min-height: 0 !important;
}
.article-hero__content { max-width: 720px !important; color: inherit !important; }
""",
    "C_fullbleed_380": BASE_RESET + """
.article-hero {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  margin: 0 0 32px !important;
  padding: 0 !important;
  background-color: #FFF8F0 !important;
  aspect-ratio: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow: visible !important;
}
.article-hero__media {
  position: relative !important;
  inset: auto !important;
  width: 100% !important;
  height: 380px !important;
  max-height: 50vh !important;
  aspect-ratio: auto !important;
  overflow: hidden !important;
  background-color: #FFF8F0 !important;
}
.article-hero__image {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
}
.article-hero__inner {
  position: relative !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 24px 16px 8px !important;
  display: block !important;
  min-height: 0 !important;
}
.article-hero__content { max-width: 720px !important; color: inherit !important; }
""",
}

VIEWPORTS = [("mobile", 375, 812), ("desktop", 1440, 900)]


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, css in VARIANTS.items():
            for vlabel, w, h in VIEWPORTS:
                ctx = browser.new_context(viewport={"width": w, "height": h})
                page = ctx.new_page()
                page.goto(URL, wait_until="networkidle", timeout=30000)
                page.add_style_tag(content=css)
                page.wait_for_timeout(500)
                target = OUT / f"{name}_{vlabel}_{w}x{h}.png"
                page.screenshot(path=str(target), full_page=False)
                print(f"saved {target}")
                ctx.close()
        browser.close()


if __name__ == "__main__":
    run()
