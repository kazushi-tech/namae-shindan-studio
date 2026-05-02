"""Open the live page from a brand-new Playwright context (no cache, no SW)
and inspect what's actually rendering. Captures DOM box for .article-hero
and saves a viewport screenshot for visual comparison with the user's screen."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("test_screenshots/column-hero-fix/live-truth")
OUT.mkdir(parents=True, exist_ok=True)

URL = "https://column.namae-studio.com/akachan-benpi-kaishouhou/"

with sync_playwright() as p:
    browser = p.chromium.launch()
    # Match a typical desktop viewport similar to user's
    ctx = browser.new_context(viewport={"width": 1900, "height": 900})
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=30000)

    info = page.evaluate(
        """() => {
          const hero = document.querySelector('.article-hero');
          const media = document.querySelector('.article-hero__media');
          const overlay = document.querySelector('.article-hero__overlay');
          if (!hero) return { error: 'no .article-hero' };
          const heroRect = hero.getBoundingClientRect();
          const mediaRect = media?.getBoundingClientRect();
          const heroCs = getComputedStyle(hero);
          const mediaCs = media ? getComputedStyle(media) : null;
          const overlayCs = overlay ? getComputedStyle(overlay) : null;
          // Find the loaded child theme stylesheet
          const sheets = [...document.styleSheets].filter(s => s.href && s.href.includes('affinger4-child/style.css'));
          return {
            css_url: sheets.map(s => s.href),
            hero_rect: { left: heroRect.left, right: heroRect.right, top: heroRect.top, width: heroRect.width },
            hero_max_width: heroCs.maxWidth,
            hero_padding: heroCs.padding,
            hero_margin: heroCs.margin,
            media_rect: mediaRect ? { left: mediaRect.left, right: mediaRect.right, top: mediaRect.top, width: mediaRect.width, height: mediaRect.height } : null,
            media_aspect_ratio: mediaCs?.aspectRatio,
            media_max_height: mediaCs?.maxHeight,
            media_border_radius: mediaCs?.borderRadius,
            overlay_display: overlayCs?.display,
          };
        }"""
    )
    for k, v in info.items():
        print(f"{k}: {v}")
    page.screenshot(path=str(OUT / "live_1900x900.png"), full_page=False)
    print(f"saved {OUT / 'live_1900x900.png'}")
    ctx.close()
    browser.close()
