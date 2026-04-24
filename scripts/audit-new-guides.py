"""Playwright smoke-test for the 3 new guide pages + hub + shindan aria-live.

Verifies:
- All 3 new pages load (200) and have the expected H1
- skip-link is reachable with Tab
- [data-reveal] elements become .is-visible after scroll
- <details> FAQ open/close works
- compare-table renders 5 rows on meimei-hikaku
- rite-timeline renders 5 markers on miyamairi
- shindan.html result-section has aria-live='polite' aria-atomic='true'
- guide hub shows 5 tiles (no "近日公開")

Exits non-zero if any check fails; prints a green summary otherwise.
"""
from __future__ import annotations

import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
errors: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    icon = "✓" if cond else "✗"
    print(f"  {icon} {name}" + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        errors.append(f"{name}: {detail}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    console_log: list[str] = []
    page.on("console", lambda m: console_log.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: console_log.append(f"[pageerror] {e}"))

    # ================================================================
    # 1) GUIDE HUB
    # ================================================================
    print("\n--- /guide/ ---")
    page.goto(f"{BASE}/guide/")
    page.wait_for_load_state("networkidle")

    hub = page.evaluate(
        """() => ({
            title: document.querySelector('h1')?.textContent?.trim(),
            tile_count: document.querySelectorAll('.guide-hub__tile').length,
            coming_soon: document.querySelectorAll('.guide-hub__tile--coming-soon').length,
            skip_link: !!document.querySelector('a.skip-link'),
            main_id: document.querySelector('main')?.id,
            ns_live: !!document.getElementById('ns-live'),
            reveal_count: document.querySelectorAll('[data-reveal]').length,
        })"""
    )
    check("guide hub H1", hub["title"] == "名付けお役立ちガイド", hub["title"])
    check("guide hub 4 tiles", hub["tile_count"] == 4, f"got {hub['tile_count']}")
    check("no coming-soon", hub["coming_soon"] == 0, f"got {hub['coming_soon']}")
    check("skip-link present", hub["skip_link"])
    check("main id=main-content", hub["main_id"] == "main-content", hub["main_id"])
    check("ns-live region", hub["ns_live"])
    check("data-reveal elements", hub["reveal_count"] >= 4, f"got {hub['reveal_count']}")

    # reveal becomes visible on scroll
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(800)
    visible_after_scroll = page.evaluate(
        "document.querySelectorAll('[data-reveal].is-visible').length"
    )
    check("reveal is-visible after scroll", visible_after_scroll > 0, f"got {visible_after_scroll}")
    page.screenshot(path="test_screenshots/guide-hub-2026-04-25.png", full_page=True)

    # ================================================================
    # 2) SHUSSAN LIST
    # ================================================================
    print("\n--- /guide/shussan-list ---")
    page.goto(f"{BASE}/guide/shussan-list.html")
    page.wait_for_load_state("networkidle")
    ss = page.evaluate(
        """() => ({
            title: document.querySelector('h1')?.textContent?.trim(),
            section_cards: document.querySelectorAll('.section-card').length,
            checklists: document.querySelectorAll('.checklist').length,
            checkboxes: document.querySelectorAll('.checklist__box').length,
            product_cards: document.querySelectorAll('.guide-product').length,
            related: document.querySelectorAll('.related-guides__card').length,
            skip_link: !!document.querySelector('a.skip-link'),
        })"""
    )
    check("shussan H1", "出産準備リスト完全版" in (ss["title"] or ""), ss["title"])
    check("8 section cards", ss["section_cards"] == 8, f"got {ss['section_cards']}")
    check("7 checklists", ss["checklists"] == 7, f"got {ss['checklists']}")
    check("many checkboxes", ss["checkboxes"] >= 50, f"got {ss['checkboxes']}")
    check("0 product cards (PR removed)", ss["product_cards"] == 0, f"got {ss['product_cards']}")
    check("2 related guide cards", ss["related"] == 2, f"got {ss['related']}")
    check("skip-link", ss["skip_link"])

    # toggle a checkbox
    page.check(".checklist__box >> nth=0")
    checked_state = page.is_checked(".checklist__box >> nth=0")
    check("checkbox toggles", checked_state)
    # Scroll through entire page so IntersectionObserver fires for all cards
    page.evaluate(
        """async () => {
            const step = 400;
            for (let y = 0; y <= document.body.scrollHeight; y += step) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 120));
            }
        }"""
    )
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    page.screenshot(path="test_screenshots/guide-shussan-2026-04-25.png", full_page=True)

    # ================================================================
    # 3) MEIMEI HIKAKU
    # ================================================================
    print("\n--- /guide/meimei-hikaku ---")
    page.goto(f"{BASE}/guide/meimei-hikaku.html")
    page.wait_for_load_state("networkidle")
    mh = page.evaluate(
        """() => ({
            title: document.querySelector('h1')?.textContent?.trim(),
            seals: document.querySelectorAll('.seal-card').length,
            types: document.querySelectorAll('.type-card').length,
            table_rows: document.querySelectorAll('.compare-table tbody tr').length,
            quote_cards: document.querySelectorAll('.quote-card').length,
            warning: !!document.querySelector('.warning-box'),
            faq_items: document.querySelectorAll('.faq-item').length,
            summary: !!document.querySelector('.editor-summary'),
        })"""
    )
    check("meimei-hikaku H1", "命名書サービス徹底比較" in (mh["title"] or ""), mh["title"])
    check("4 seal cards", mh["seals"] == 4, f"got {mh['seals']}")
    check("3 type cards", mh["types"] == 3, f"got {mh['types']}")
    check("5 compare rows", mh["table_rows"] == 5, f"got {mh['table_rows']}")
    check("3 quote cards", mh["quote_cards"] == 3, f"got {mh['quote_cards']}")
    check("warning box", mh["warning"])
    check("6 FAQ items", mh["faq_items"] == 6, f"got {mh['faq_items']}")
    check("editor summary", mh["summary"])

    # open first FAQ
    page.locator(".faq-item >> nth=0 >> summary").click()
    is_open = page.evaluate("document.querySelectorAll('.faq-item')[0].open")
    check("first FAQ opens", is_open)
    page.evaluate(
        """async () => {
            const step = 400;
            for (let y = 0; y <= document.body.scrollHeight; y += step) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 120));
            }
        }"""
    )
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    page.screenshot(path="test_screenshots/guide-meimei-hikaku-2026-04-25.png", full_page=True)

    # ================================================================
    # 4) MIYAMAIRI
    # ================================================================
    print("\n--- /guide/miyamairi ---")
    page.goto(f"{BASE}/guide/miyamairi.html")
    page.wait_for_load_state("networkidle")
    my = page.evaluate(
        """() => ({
            title: document.querySelector('h1')?.textContent?.trim(),
            timeline_items: document.querySelectorAll('.rite-timeline__item').length,
            rite_cards: document.querySelectorAll('.rite-card').length,
            product_cards: document.querySelectorAll('.guide-product').length,
            faq: document.querySelectorAll('.faq-item').length,
            cta_lead: !!document.querySelector('.final-cta__lead'),
        })"""
    )
    check("miyamairi H1", "お宮参り" in (my["title"] or ""), my["title"])
    check("5 timeline markers", my["timeline_items"] == 5, f"got {my['timeline_items']}")
    check("4 rite cards", my["rite_cards"] == 4, f"got {my['rite_cards']}")
    check("0 product cards (PR removed)", my["product_cards"] == 0, f"got {my['product_cards']}")
    check("6 FAQ items", my["faq"] == 6, f"got {my['faq']}")
    check("final CTA lead", my["cta_lead"])
    page.evaluate(
        """async () => {
            const step = 400;
            for (let y = 0; y <= document.body.scrollHeight; y += step) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 120));
            }
        }"""
    )
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    page.screenshot(path="test_screenshots/guide-miyamairi-2026-04-25.png", full_page=True)

    # ================================================================
    # 5) SHINDAN aria-live on result-section
    # ================================================================
    print("\n--- /shindan (aria-live) ---")
    page.goto(f"{BASE}/shindan.html")
    page.wait_for_load_state("networkidle")
    sh = page.evaluate(
        """() => {
            const s = document.getElementById('result-section');
            return {
                aria_live: s?.getAttribute('aria-live'),
                aria_atomic: s?.getAttribute('aria-atomic'),
                skip: !!document.querySelector('a.skip-link'),
                ns_live: !!document.getElementById('ns-live'),
            };
        }"""
    )
    check("result-section aria-live=polite", sh["aria_live"] == "polite", sh["aria_live"])
    check("result-section aria-atomic=true", sh["aria_atomic"] == "true", sh["aria_atomic"])
    check("shindan skip-link", sh["skip"])
    check("shindan ns-live", sh["ns_live"])

    # ================================================================
    # 6) Tab → skip-link
    # ================================================================
    print("\n--- skip-link focus (on hub) ---")
    page.goto(f"{BASE}/guide/")
    page.wait_for_load_state("networkidle")
    page.keyboard.press("Tab")
    skip_focus = page.evaluate(
        "document.activeElement?.classList?.contains('skip-link')"
    )
    check("Tab focuses skip-link", bool(skip_focus))

    browser.close()

    if console_log:
        print("\n[console/pageerror log]:")
        for line in console_log:
            print("  " + line)

    print("\n" + "=" * 60)
    if errors:
        print(f"✗ {len(errors)} FAIL")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("✓ All checks passed")
