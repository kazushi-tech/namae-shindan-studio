#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
モーション強化 & アクセシビリティ底上げ計画の検証スクリプト。
- scroll-reveal.js が各ページで読み込まれている
- data-reveal 属性がスクロールで is-visible になる
- hero の [data-split-text] が .split-char に分解される
- 五格カードが data-reveal="slide-up" を持つ
- リンク色 / focus-visible 色が変わっている
- #ns-live に診断要約が流れる
"""

import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
OUT = Path(__file__).resolve().parent.parent / "test_screenshots" / "motion-a11y"
OUT.mkdir(parents=True, exist_ok=True)

results = []

def assert_true(cond, msg):
    tag = "OK " if cond else "NG "
    results.append((cond, tag + msg))
    print(tag + msg)


def check_home(page):
    page.goto(f"{BASE}/", wait_until="domcontentloaded")
    page.wait_for_timeout(1200)

    # SplitText
    chars = page.eval_on_selector_all(".hero-title .split-char", "els => els.length")
    assert_true(chars > 0, f"home: hero-title split into {chars} .split-char spans")
    ready = page.eval_on_selector(".hero-title", "el => el.classList.contains('split-text--ready') || el.classList.contains('split-text--reduced')")
    assert_true(ready, "home: hero-title has split-text--ready or split-text--reduced")

    # scroll-reveal.js が読み込まれ window.ScrollReveal が存在
    has_api = page.evaluate("() => !!(window.ScrollReveal && typeof window.ScrollReveal.observe === 'function')")
    assert_true(has_api, "home: window.ScrollReveal.observe exists")

    # step-card スクロールで visible
    page.evaluate("() => window.scrollTo(0, document.querySelector('.how-section').offsetTop)")
    page.wait_for_timeout(800)
    step_visible = page.eval_on_selector_all(".step-card[data-reveal].is-visible", "els => els.length")
    assert_true(step_visible == 3, f"home: step-card visible count = {step_visible} (expected 3)")

    # disclaimer-card
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(800)
    disc_visible = page.eval_on_selector(".disclaimer-card[data-reveal]", "el => el.classList.contains('is-visible')")
    assert_true(disc_visible, "home: disclaimer-card is-visible")

    # デフォルト <a class=...> 色 = #C45E48 (reset.css の a:not([class]) を避ける)
    anchor_color = page.evaluate("""
      () => {
        const a = document.createElement('a');
        a.href = '#test-link';
        a.className = 'test-anchor-probe';
        a.textContent = 'dummy';
        a.style.position = 'fixed';
        a.style.top = '-1000px';
        document.body.appendChild(a);
        const c = getComputedStyle(a).color;
        a.remove();
        return c;
      }
    """)
    assert_true("rgb(196, 94, 72)" in anchor_color, f"home: classed anchor color = {anchor_color} (expect rgb(196, 94, 72))")

    # focus-visible outline color (#D05A46) 確認
    focus_color = page.evaluate("""
      () => {
        const probe = document.createElement('div');
        probe.style.outline = '3px solid var(--color-terracotta-dark)';
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).outlineColor;
        probe.remove();
        return c;
      }
    """)
    assert_true("rgb(208, 90, 70)" in focus_color, f"home: terracotta-dark = {focus_color} (expect rgb(208, 90, 70))")

    page.screenshot(path=str(OUT / "01_home_bottom.png"), full_page=False)


def check_about(page):
    page.goto(f"{BASE}/about.html", wait_until="domcontentloaded")
    page.wait_for_timeout(800)
    has_reveal = page.eval_on_selector_all(".gokaku-explain-card[data-reveal='slide-up']", "els => els.length")
    assert_true(has_reveal == 5, f"about: gokaku-explain-cards with reveal = {has_reveal} (expected 5)")

    # 最初の card has delay=0
    first_delay = page.eval_on_selector(".gokaku-explain-card", "el => el.dataset.revealDelay")
    assert_true(first_delay == "0", f"about: first gokaku-explain-card delay = {first_delay}")

    # scroll down to trigger reveal
    page.evaluate("() => document.querySelector('.gokaku-explain-grid').scrollIntoView({block:'center'})")
    page.wait_for_timeout(1500)
    visible = page.eval_on_selector_all(".gokaku-explain-card.is-visible", "els => els.length")
    assert_true(visible >= 3, f"about: revealed gokaku-explain-card count = {visible}")

    page.screenshot(path=str(OUT / "02_about.png"), full_page=False)


def check_shindan(page):
    page.goto(f"{BASE}/shindan.html", wait_until="domcontentloaded")
    page.wait_for_timeout(600)

    # page-header has data-reveal=fade & became visible
    page_header_vis = page.eval_on_selector(".page-header[data-reveal]", "el => el.classList.contains('is-visible')")
    assert_true(page_header_vis, "shindan: page-header is-visible after load")

    # aria-atomic removed
    atomic = page.eval_on_selector("#result-section", "el => el.hasAttribute('aria-atomic')")
    assert_true(not atomic, "shindan: result-section has no aria-atomic")

    # aria-live removed from stroke-preview
    sei_live = page.eval_on_selector("#sei-stroke-preview", "el => el.hasAttribute('aria-live')")
    assert_true(not sei_live, "shindan: sei-stroke-preview aria-live removed")

    # related-items heading became h2
    rel_h2 = page.eval_on_selector(".related-items__heading", "el => el.tagName")
    assert_true(rel_h2 == "H2", f"shindan: related-items__heading = {rel_h2}")

    rel_pages_h2 = page.eval_on_selector(".related-pages__heading", "el => el.tagName")
    assert_true(rel_pages_h2 == "H2", f"shindan: related-pages__heading = {rel_pages_h2}")

    # do the shindan
    page.fill("#sei-input", "山田")
    page.fill("#mei-input", "太郎")
    page.click("#submit-btn")
    page.wait_for_timeout(1500)

    # result-section revealed
    result_vis = page.eval_on_selector("#result-section", "el => !el.hidden")
    assert_true(result_vis, "shindan: result-section shown")

    # gokaku cards have data-reveal + is-visible after scrolling through all cards
    card_reveal = page.eval_on_selector_all(".gokaku-card[data-reveal='slide-up']", "els => els.length")
    assert_true(card_reveal == 5, f"shindan: gokaku-card with reveal = {card_reveal}")

    # スクロールして全カードを可視化
    for _ in range(6):
        page.mouse.wheel(0, 300)
        page.wait_for_timeout(400)
    visible_cards = page.eval_on_selector_all(".gokaku-card.is-visible", "els => els.length")
    assert_true(visible_cards == 5, f"shindan: visible gokaku-card = {visible_cards}")

    # #ns-live has summary
    live = page.eval_on_selector("#ns-live", "el => el.textContent")
    assert_true("山田太郎" in (live or ""), f"shindan: #ns-live content = {live!r}")
    assert_true(("総格" in (live or "")), "shindan: #ns-live mentions 総格")

    page.screenshot(path=str(OUT / "03_shindan_result.png"), full_page=False)


def check_privacy(page):
    page.goto(f"{BASE}/privacy-policy.html", wait_until="domcontentloaded")
    page.wait_for_timeout(600)
    sections = page.eval_on_selector_all(".about-section[data-reveal]", "els => els.length")
    assert_true(sections >= 9, f"privacy: about-section with reveal = {sections}")

    page_header_vis = page.eval_on_selector(".page-header[data-reveal]", "el => el.classList.contains('is-visible')")
    assert_true(page_header_vis, "privacy: page-header is-visible")

    page.screenshot(path=str(OUT / "04_privacy.png"), full_page=False)


def check_favorites_404(page):
    page.goto(f"{BASE}/favorites.html", wait_until="domcontentloaded")
    page.wait_for_timeout(400)
    has_api = page.evaluate("() => !!(window.ScrollReveal)")
    assert_true(has_api, "favorites: ScrollReveal loaded")

    page.goto(f"{BASE}/404.html", wait_until="domcontentloaded")
    page.wait_for_timeout(400)
    has_api2 = page.evaluate("() => !!(window.ScrollReveal)")
    assert_true(has_api2, "404: ScrollReveal loaded")


def check_reduced_motion():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(reduced_motion="reduce")
        page = ctx.new_page()
        page.goto(f"{BASE}/", wait_until="domcontentloaded")
        page.wait_for_timeout(800)
        # .split-text--reduced should be applied
        reduced = page.eval_on_selector(".hero-title", "el => el.classList.contains('split-text--reduced')")
        assert_true(reduced, "reduced-motion: hero-title has split-text--reduced")
        # step-cards should be visible immediately (via scroll-reveal reduced branch)
        step_vis = page.eval_on_selector_all(".step-card.is-visible", "els => els.length")
        assert_true(step_vis == 3, f"reduced-motion: step-card visible = {step_vis}")
        browser.close()


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        check_home(page)
        check_about(page)
        check_shindan(page)
        check_privacy(page)
        check_favorites_404(page)
        browser.close()

    check_reduced_motion()

    total = len(results)
    failed = [r for ok, r in results if not ok]
    passed = total - len(failed)
    print("\n============================")
    print(f"Result: {passed}/{total} passed")
    if failed:
        print("\nFailures:")
        for msg in failed:
            print(" -", msg)
        sys.exit(1)


if __name__ == "__main__":
    main()
