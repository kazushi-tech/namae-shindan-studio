"""Debug suggestion page — why generator does not produce results."""
from __future__ import annotations
import os
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "https://namae-studio.com")
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={"width": 1280, "height": 900})
    logs: list[str] = []
    page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: logs.append(f"[pageerror] {e}"))
    page.on("requestfailed", lambda r: logs.append(f"[reqfail] {r.url} {r.failure}"))

    page.goto(f"{BASE}/suggestion.html")
    page.wait_for_load_state("networkidle")

    info = page.evaluate("""() => ({
        sei: !!document.getElementById('sei-input'),
        form: !!document.getElementById('suggestion-form'),
        submitBtn: document.querySelector('#suggestion-form button[type=submit]')?.textContent?.trim(),
        resultContainer: !!document.getElementById('suggestion-results'),
        scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
        hasSuggestGenerator: typeof window.generateSuggestions,
    })""")
    print("INFO:", info)

    # Try filling and submitting
    try:
        # Do NOT prefill — try clicking submit on empty form (mimic user)
        page.click("#suggestion-form button[type=submit]")
        page.wait_for_timeout(800)
        r0 = page.evaluate("""() => ({
            cards: document.querySelectorAll('.suggestion-card').length,
            errors: Array.from(document.querySelectorAll('.error-message, .input-group__error')).map(e=>e.textContent?.trim()).filter(Boolean),
            liveText: document.getElementById('ns-live')?.textContent?.trim(),
        })""")
        print("EMPTY SUBMIT:", r0)

        page.fill("#sei-input", "山田")
        page.click("#suggestion-form button[type=submit]")
        page.wait_for_timeout(1500)
        r = page.evaluate("""() => {
            const cards = document.querySelectorAll('.suggestion-card');
            const first = cards[0];
            const firstStyle = first ? getComputedStyle(first) : null;
            // find any ancestor with data-reveal that's not is-visible
            let hiddenAncestor = null;
            if (first) {
                let el = first;
                while (el && el !== document.body) {
                    if (el.hasAttribute && el.hasAttribute('data-reveal') && !el.classList.contains('is-visible')) {
                        hiddenAncestor = { tag: el.tagName, cls: el.className, reveal: el.getAttribute('data-reveal') };
                        break;
                    }
                    el = el.parentElement;
                }
            }
            return {
                card_count: cards.length,
                first_visible: first ? (first.offsetParent !== null) : null,
                first_opacity: firstStyle?.opacity,
                first_dataReveal: first?.getAttribute('data-reveal'),
                first_isVisible: first?.classList?.contains('is-visible'),
                hiddenAncestor,
                result_wrap_id: first?.closest('section,[id]')?.id,
            };
        }""")
        print("RESULT:", r)
    except Exception as e:
        print("EXC:", e)

    print("\n--- console/errors ---")
    for l in logs:
        print(l)
    b.close()
