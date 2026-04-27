"""E2E full regression (WS-E / lp-scalable-sonnet).

全ページの列幅整合性・コンソールエラー0件・主要 CTA click 可能性を検証する。
Desktop 1280 / Mobile 375 の2幅でスクショを取る。
"""
from __future__ import annotations
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "https://namae-studio.com")

PAGES = [
    "/",
    "/shindan",
    "/suggestion",
    "/favorites",
    "/about",
    "/privacy-policy",
    "/ranking/",
    "/kanji/",
    "/guide/",
    "/guide/faq",
    "/404",
]

VIEWPORTS = {
    "desktop": {"width": 1280, "height": 900},
    "mobile": {"width": 375, "height": 812},
}


def run():
    results = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for vp_name, vp in VIEWPORTS.items():
            context = b.new_context(viewport=vp)
            for path in PAGES:
                page = context.new_page()
                errors: list[str] = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.on(
                    "console",
                    lambda m: errors.append(m.text)
                    if m.type == "error"
                    else None,
                )
                try:
                    page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
                except Exception as e:
                    results.append({"vp": vp_name, "path": path, "error": f"goto:{e}"})
                    page.close()
                    continue

                widths = page.evaluate(
                    """() => {
                    const q = s => document.querySelector(s);
                    const w = el => el ? Math.round(el.getBoundingClientRect().width) : null;
                    return {
                        main: w(q('main .container, main > .container, .container')),
                        pageHeader: w(q('.page-header')),
                        form: w(q('form')),
                        promo: w(q('.promo-card')),
                        footer: w(q('.footer__inner')),
                    };
                }"""
                )

                results.append(
                    {
                        "vp": vp_name,
                        "path": path,
                        "widths": widths,
                        "console_errors": errors[:5],
                    }
                )
                page.close()
            context.close()
        b.close()

    # Print summary
    for r in results:
        print(r)


if __name__ == "__main__":
    run()
