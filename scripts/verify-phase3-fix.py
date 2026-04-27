"""Phase 3 検索系機能の動作確認 — ローカル / 本番両対応。

Plan: plans/soft-splashing-eclipse.md 検証ケース A/B/C/D。

- ローカル: BASE_URL=http://localhost:8000 (dist/ を python -m http.server でホスト)
- 本番:    BASE_URL=https://namae-studio.com

ローカルでは cleanUrls 不可なので URL に .html を補完する PATH_SUFFIX を切り替える。
"""
from __future__ import annotations
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://localhost:8000")
LOCAL = "localhost" in BASE or "127.0.0.1" in BASE


def url_for(path: str) -> str:
    """ローカル http.server には cleanUrls がないので .html を補完。
    末尾 / のディレクトリパスはそのまま (index.html が解決される)。"""
    if not LOCAL:
        return f"{BASE}{path}"
    if path.endswith("/") or path.endswith(".html"):
        return f"{BASE}{path}"
    return f"{BASE}{path}.html"


CASES_RESULTS: list[dict] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    mark = "OK" if ok else "FAIL"
    print(f"[{mark}] {name}{(' — ' + detail) if detail else ''}")
    CASES_RESULTS.append({"name": name, "ok": ok, "detail": detail})


def case_suggestion(ctx) -> None:
    page = ctx.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    def _on_console(m):
        if m.type != "error":
            return
        text = m.text
        # ノイズ除外: ネットワーク失敗 (4xx/CORS/GA collect/AdSense) は requestfailed 側で扱う想定。
        # 機能停止の徴候となる JS 例外のみ拾う。
        if "Failed to load resource" in text:
            return
        if "net::ERR_" in text:
            return
        errors.append(f"console.error: {text}")

    page.on("console", _on_console)
    try:
        page.goto(url_for("/suggestion"), wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(500)

        info = page.evaluate(
            """() => ({
                hasScriptTag: !!document.querySelector('script[src*="suggestion-page.js"]'),
                hasForm: !!document.getElementById('suggestion-form'),
                hasSeiInput: !!document.getElementById('sei-input'),
            })"""
        )
        record(
            "/suggestion: suggestion-page.js loaded",
            bool(info["hasScriptTag"]),
            f"hasScriptTag={info['hasScriptTag']}",
        )

        # 性別「男」を選択 — radio[name=gender][value=boy] を click
        page.fill("#sei-input", "山田")
        try:
            page.check('input[name="gender"][value="boy"]')
        except Exception:
            pass
        # 画数 5+8 — input があれば
        page.click("#suggestion-form button[type=submit]")
        page.wait_for_timeout(2000)

        cards = page.evaluate("() => document.querySelectorAll('.suggestion-card').length")
        record("/suggestion: card rendered", cards >= 1, f"cards={cards}")

        page.screenshot(path="test_screenshots/phase3_suggestion.png", full_page=True)
        record(
            "/suggestion: console error 0",
            len(errors) == 0,
            "; ".join(errors[:3]) if errors else "",
        )
    finally:
        page.close()


def case_ranking(ctx, gender: str) -> None:
    path = f"/ranking/2026-{'boys' if gender == 'boys' else 'girls'}"
    page = ctx.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    def _on_console(m):
        if m.type != "error":
            return
        text = m.text
        # ノイズ除外: ネットワーク失敗 (4xx/CORS/GA collect/AdSense) は requestfailed 側で扱う想定。
        # 機能停止の徴候となる JS 例外のみ拾う。
        if "Failed to load resource" in text:
            return
        if "net::ERR_" in text:
            return
        errors.append(f"console.error: {text}")

    page.on("console", _on_console)
    try:
        page.goto(url_for(path), wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(1500)

        info = page.evaluate(
            """() => ({
                top3: document.querySelectorAll('#ranking-top3 .top3__card').length,
                rows: document.querySelectorAll('#ranking-list .ranking-list__row').length,
                errorVisible: !!(document.getElementById('ranking-error') &&
                                 !document.getElementById('ranking-error').hidden &&
                                 document.getElementById('ranking-error').offsetParent !== null),
            })"""
        )
        record(f"{path}: top3=3", info["top3"] == 3, f"top3={info['top3']}")
        record(f"{path}: rows=27", info["rows"] == 27, f"rows={info['rows']}")
        record(f"{path}: error hidden", not info["errorVisible"])

        page.screenshot(path=f"test_screenshots/phase3_ranking_{gender}.png", full_page=True)
        record(
            f"{path}: console error 0",
            len(errors) == 0,
            "; ".join(errors[:3]) if errors else "",
        )
    finally:
        page.close()


def case_kanji_hub(ctx) -> None:
    page = ctx.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    def _on_console(m):
        if m.type != "error":
            return
        text = m.text
        # ノイズ除外: ネットワーク失敗 (4xx/CORS/GA collect/AdSense) は requestfailed 側で扱う想定。
        # 機能停止の徴候となる JS 例外のみ拾う。
        if "Failed to load resource" in text:
            return
        if "net::ERR_" in text:
            return
        errors.append(f"console.error: {text}")

    page.on("console", _on_console)
    try:
        page.goto(url_for("/kanji/"), wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(800)

        info = page.evaluate("""() => ({
            items: document.querySelectorAll('.kanji-grid__item').length,
            hasFilter: !!document.getElementById('kanji-filter-input'),
        })""")
        record("/kanji/: kanji items rendered", info["items"] >= 1, f"items={info['items']}")
        record("/kanji/: filter input present", bool(info["hasFilter"]))

        if info["hasFilter"]:
            page.fill("#kanji-filter-input", "蓮")
            page.wait_for_timeout(500)
            visible = page.evaluate(
                """() => Array.from(document.querySelectorAll('.kanji-grid__item'))
                    .filter(e => e.offsetParent !== null)
                    .map(e => (e.textContent || '').trim().slice(0,1))"""
            )
            ok = bool(visible) and all("蓮" in s for s in visible)
            record("/kanji/: filter '蓮' narrows results",
                   ok, f"visible={visible[:5]} count={len(visible)}")

        page.screenshot(path="test_screenshots/phase3_kanji_hub.png", full_page=True)
        record("/kanji/: console error 0", len(errors) == 0,
               "; ".join(errors[:3]) if errors else "")
    finally:
        page.close()


def case_kanji_detail(ctx) -> None:
    page = ctx.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    def _on_console(m):
        if m.type != "error":
            return
        text = m.text
        # ノイズ除外: ネットワーク失敗 (4xx/CORS/GA collect/AdSense) は requestfailed 側で扱う想定。
        # 機能停止の徴候となる JS 例外のみ拾う。
        if "Failed to load resource" in text:
            return
        if "net::ERR_" in text:
            return
        errors.append(f"console.error: {text}")

    page.on("console", _on_console)
    try:
        # ローカルでは /kanji/蓮.html、本番(cleanUrls)では /kanji/蓮
        path = "/kanji/蓮"
        page.goto(url_for(path), wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(500)
        body = page.evaluate("() => document.body.textContent")
        record("/kanji/蓮: body rendered", "蓮" in body)
        record("/kanji/蓮: console error 0", len(errors) == 0,
               "; ".join(errors[:3]) if errors else "")
    finally:
        page.close()


def case_regression(ctx) -> None:
    paths = ["/", "/shindan", "/favorites", "/about", "/guide/", "/guide/faq"]
    for path in paths:
        page = ctx.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on(
            "console",
            lambda m: errors.append(f"console.error: {m.text}") if m.type == "error" else None,
        )
        try:
            page.goto(url_for(path), wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(500)
            record(
                f"{path}: console error 0",
                len(errors) == 0,
                "; ".join(errors[:3]) if errors else "",
            )
        finally:
            page.close()

    # /shindan 五格レンダ
    page = ctx.new_page()
    try:
        page.goto(url_for("/shindan"), wait_until="networkidle", timeout=20000)
        page.fill("#sei-input", "山田")
        page.fill("#mei-input", "太郎")
        page.click("#shindan-form button[type=submit], button[type=submit]")
        page.wait_for_timeout(1200)
        info = page.evaluate("""() => ({
            anyResult: document.body.textContent.includes('天格') &&
                       document.body.textContent.includes('総格'),
        })""")
        record("/shindan: 五格表示", bool(info["anyResult"]), f"info={info}")
    finally:
        page.close()


def main() -> int:
    print(f"BASE_URL = {BASE}")
    print(f"LOCAL = {LOCAL}")
    os.makedirs("test_screenshots", exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 1280, "height": 900})
        case_suggestion(ctx)
        case_ranking(ctx, "boys")
        case_ranking(ctx, "girls")
        case_kanji_hub(ctx)
        case_kanji_detail(ctx)
        case_regression(ctx)
        ctx.close()
        b.close()

    fail = sum(1 for r in CASES_RESULTS if not r["ok"])
    print(f"\n=== SUMMARY: {len(CASES_RESULTS) - fail} OK / {fail} FAIL / {len(CASES_RESULTS)} total ===")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
