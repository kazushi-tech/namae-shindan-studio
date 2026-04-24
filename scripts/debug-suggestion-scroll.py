"""Debug suggestion page auto-scroll after submit (WS-E / lp-scalable-sonnet Part 3).

Fills the form, clicks submit, and measures scrollY before/after to confirm
the auto-scroll works on real browsers. Also enumerates structural hypotheses
if scroll does not happen.
"""
from __future__ import annotations
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = "https://namae-studio.com"


def check(url: str) -> dict:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1280, "height": 900})
        logs: list[str] = []
        page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: logs.append(f"[pageerror] {e}"))

        page.goto(url, wait_until="networkidle")

        # scroll to top
        page.evaluate("() => window.scrollTo(0, 0)")
        page.wait_for_timeout(200)
        y_before = page.evaluate("() => window.scrollY")

        # fill + submit
        page.fill("#sei-input", "藤木")
        # select male + 3 chars + ta row if inputs exist
        for selector in [
            'input[name="gender"][value="boys"]',
            'input[name="chars"][value="3"]',
            'input[name="headGroup"][value="ta"]',
        ]:
            el = page.query_selector(selector)
            if el:
                el.check()

        page.click('#suggestion-form button[type=submit]')
        page.wait_for_timeout(1500)
        y_after = page.evaluate("() => window.scrollY")

        results = page.evaluate(
            """() => ({
            cards: document.querySelectorAll('.suggestion-card').length,
            resultsVisible: !document.getElementById('suggestion-empty')?.hidden,
            resultsRect: (function() {
                const el = document.querySelector('.suggestion-results');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { top: r.top, height: r.height };
            })(),
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        })"""
        )

        b.close()
        return {
            "y_before": y_before,
            "y_after": y_after,
            "delta": y_after - y_before,
            **results,
            "logs_tail": logs[-5:],
        }


if __name__ == "__main__":
    for url in [f"{BASE}/suggestion.html", "http://localhost:8000/suggestion.html"]:
        try:
            r = check(url)
            print(f"=== {url} ===")
            for k, v in r.items():
                print(f"  {k}: {v}")
            if r["delta"] < 100:
                print(
                    "  [WARN] scroll delta < 100px; auto-scroll may not be working."
                )
            else:
                print("  [OK] auto-scroll delta >= 100px")
        except Exception as e:
            print(f"  [ERR] {url}: {e}")
