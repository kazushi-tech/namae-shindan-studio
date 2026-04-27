"""Probe what's 404'ing on each page (local server)."""
from __future__ import annotations
import os
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://localhost:8000")

PAGES = [
    "/suggestion.html",
    "/ranking/2026-boys.html",
    "/kanji/",
    "/kanji/蓮.html",
    "/index.html",
    "/shindan.html",
    "/favorites.html",
    "/about.html",
    "/guide/",
    "/guide/faq.html",
]


def main() -> None:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for path in PAGES:
            ctx = b.new_context(viewport={"width": 1280, "height": 900})
            page = ctx.new_page()
            failed: list[str] = []
            page.on("requestfailed", lambda r: failed.append(f"{r.url} | {r.failure}"))
            page.on(
                "response",
                lambda r: failed.append(f"{r.url} | {r.status}")
                if r.status >= 400
                else None,
            )
            try:
                page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            except Exception as e:
                print(f"[GOTO ERR {path}] {e}")
            print(f"\n=== {path} ===")
            for line in failed:
                print(f"  {line}")
            ctx.close()
        b.close()


if __name__ == "__main__":
    main()
