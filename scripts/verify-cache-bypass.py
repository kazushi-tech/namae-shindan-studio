"""Simulate browser-cache-stuck scenario:
inject the OLD v1.1.0 hero CSS rules first (as if browser used cached old CSS),
then inject the NEW critical inline CSS that the v1.4.0 functions.php would emit.
Verify the NEW rules win cascade-wise.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("test_screenshots/column-hero-fix/cache-bypass")
OUT.mkdir(parents=True, exist_ok=True)
URL = "https://column.namae-studio.com/akachan-benpi-kaishouhou/"

# Pretend the browser still has these v1.1.0 rules cached (no !important)
OLD_CACHED_CSS = """
.article-hero {
    position: relative;
    width: 100%;
    background-color: #FFF0E1;
    margin-bottom: 32px;
}
.article-hero__media {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: 60vh;
    overflow: hidden;
    background-color: #FFF0E1;
}
.article-hero__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.article-hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(36,25,23,0.92) 0%, transparent 100%);
}
.article-hero__inner {
    position: relative;
    min-height: 240px;
    display: flex;
    align-items: flex-end;
}
.article-hero__title { color: #fff; }
"""

# What functions.php now emits via wp_head (the !important rules)
NEW_INLINE_CSS = """
.article-hero {
    position: relative !important;
    max-width: 1200px !important;
    margin: 0 auto 24px !important;
    padding: 0 24px !important;
    background: transparent !important;
    width: auto !important;
    min-height: 0 !important;
    aspect-ratio: auto !important;
    max-height: none !important;
    overflow: visible !important;
    display: block !important;
}
.article-hero__media {
    position: relative !important;
    inset: auto !important;
    width: 100% !important;
    aspect-ratio: 16 / 9 !important;
    max-height: 480px !important;
    min-height: 0 !important;
    overflow: hidden !important;
    background-color: #FFF0E1 !important;
    border-radius: 20px !important;
    box-shadow: 0 2px 16px rgba(36, 25, 23, 0.06) !important;
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
    max-width: none !important;
    margin: 0 !important;
    padding: 20px 0 8px !important;
    display: block !important;
    min-height: 0 !important;
}
.article-hero__content { max-width: 720px !important; color: inherit !important; }
.article-hero__date { color: #5C4F44 !important; }
.article-hero__title { color: #3D3D29 !important; text-shadow: none !important; }
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    for label, w, h in [("desktop", 1900, 900), ("mobile", 375, 812)]:
        ctx = browser.new_context(viewport={"width": w, "height": h})
        page = ctx.new_page()
        page.goto(URL, wait_until="networkidle", timeout=30000)
        # Inject OLD as if cached (loaded first, no !important)
        page.add_style_tag(content=OLD_CACHED_CSS)
        # Inject NEW as inline critical (loaded later with !important)
        page.add_style_tag(content=NEW_INLINE_CSS)
        page.wait_for_timeout(500)
        # Read computed styles to verify the NEW rules won
        result = page.evaluate(
            """() => {
              const hero = document.querySelector('.article-hero');
              const media = document.querySelector('.article-hero__media');
              const overlay = document.querySelector('.article-hero__overlay');
              const heroR = hero.getBoundingClientRect();
              const mediaR = media.getBoundingClientRect();
              const heroCs = getComputedStyle(hero);
              const mediaCs = getComputedStyle(media);
              const overlayCs = overlay ? getComputedStyle(overlay) : null;
              return {
                hero_max_width: heroCs.maxWidth,
                hero_width: Math.round(heroR.width),
                hero_background: heroCs.backgroundColor,
                media_max_height: mediaCs.maxHeight,
                media_border_radius: mediaCs.borderRadius,
                media_height: Math.round(mediaR.height),
                overlay_display: overlayCs?.display,
              };
            }"""
        )
        print(f"=== {label} ({w}x{h})")
        for k, v in result.items():
            print(f"  {k}: {v}")
        page.screenshot(path=str(OUT / f"bypass_{label}_{w}x{h}.png"), full_page=False)
        ctx.close()
    browser.close()
print("done")
