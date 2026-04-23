"""
Mobile viewport screenshot check for the new illustration rollout.

使い方:
  (別シェル) python -m http.server 8765
  python scripts/mobile-screenshot-check.py
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test_screenshots" / "audit"
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("suggestion", "/suggestion.html"),
    ("favorites", "/favorites.html"),
    ("guide-index", "/guide/"),
    ("ranking-index", "/ranking/"),
    ("ranking-boys", "/ranking/2026-boys.html"),
    ("ranking-girls", "/ranking/2026-girls.html"),
    ("kanji-index", "/kanji/"),
    ("kanji-detail-ren", "/kanji/%E8%93%AE.html"),
]

VIEWPORTS = [
    ("mobile-375", 375, 812),
    ("tablet-768", 768, 1024),
]


def main() -> int:
    console_errors: list[str] = []
    bad_resources: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for vp_name, w, h in VIEWPORTS:
            context = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2 if vp_name == "mobile-375" else 1,
                is_mobile=vp_name == "mobile-375",
                has_touch=vp_name == "mobile-375",
            )
            page = context.new_page()

            page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
            page.on("response", lambda r: bad_resources.append(f"{r.status} {r.url}") if r.status >= 400 else None)

            for label, path in PAGES:
                try:
                    url = BASE + path
                    page.goto(url, wait_until="networkidle", timeout=15000)
                    out_path = OUT / f"{vp_name}_{label}.png"
                    page.screenshot(path=str(out_path), full_page=True)
                    print(f"  [{vp_name}] {label}: OK")
                except Exception as e:
                    print(f"  [{vp_name}] {label}: FAILED ({e})")

            context.close()
        browser.close()

    print("\n--- Summary ---")
    print(f"Console errors: {len(console_errors)}")
    for msg in console_errors[:20]:
        print(f"  {msg}")
    print(f"Bad resources (>=400): {len(bad_resources)}")
    for r in bad_resources[:20]:
        print(f"  {r}")

    return 0 if not (console_errors or bad_resources) else 1


if __name__ == "__main__":
    sys.exit(main())
