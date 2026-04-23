"""
Playwright 徹底UI監査スクリプト

- 複数viewport × 複数ページを網羅的に叩き、
  console / pageerror / 4xx-5xx / 横スクロール / 画像ロード失敗 /
  空 href / target=_blank の rel 欠落 / h1 数 / shindan 特殊検査 を記録。
- 出力: test_screenshots/audit/report.md + ページ毎のフルページ PNG

使い方:
  python -m http.server 8765   # 別シェルで
  python scripts/playwright-audit.py
"""
from __future__ import annotations

import os
import sys
import json
import time
from pathlib import Path

# Windows cp932 コンソール対策: stdout/stderr を UTF-8 にする
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except Exception:
    pass
from dataclasses import dataclass, field
from typing import Any

from playwright.sync_api import sync_playwright, Page, BrowserContext, ConsoleMessage, Response

BASE = "http://localhost:8765"

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test_screenshots" / "audit"
OUT.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# 対象URL
# ---------------------------------------------------------------------------
ROUTES: list[dict[str, Any]] = [
    {"path": "/", "label": "home"},
    {"path": "/shindan.html", "label": "shindan"},
    {"path": "/shindan.html?sei=%E5%B1%B1%E7%94%B0&mei=%E5%A4%AA%E9%83%8E",
     "label": "shindan-shared"},
    {"path": "/about.html", "label": "about"},
    {"path": "/suggestion.html", "label": "suggestion"},
    {"path": "/favorites.html", "label": "favorites"},
    {"path": "/privacy-policy.html", "label": "privacy-policy"},
    {"path": "/guide/", "label": "guide-index"},
    {"path": "/guide/meimei-tools.html", "label": "guide-meimei-tools"},
    {"path": "/guide/faq.html", "label": "guide-faq"},
    {"path": "/ranking/", "label": "ranking-index"},
    {"path": "/ranking/2026-girls.html", "label": "ranking-girls"},
    {"path": "/ranking/2026-boys.html", "label": "ranking-boys"},
    {"path": "/kanji/", "label": "kanji-index"},
    {"path": "/kanji/%E8%93%AE.html", "label": "kanji-ren"},
    {"path": "/kanji/%E8%91%B5.html", "label": "kanji-aoi"},
]

VIEWPORTS = [
    {"name": "desktop", "width": 1280, "height": 900, "is_mobile": False, "engine": "chromium"},
    {"name": "mobile-chrome", "width": 390, "height": 844, "is_mobile": True, "engine": "chromium"},
    {"name": "mobile-webkit", "width": 375, "height": 812, "is_mobile": True, "engine": "webkit"},
]


@dataclass
class PageAudit:
    url: str
    label: str
    viewport: str
    status: int | None = None
    console_errors: list[str] = field(default_factory=list)
    console_warnings: list[str] = field(default_factory=list)
    page_errors: list[str] = field(default_factory=list)
    bad_responses: list[dict[str, Any]] = field(default_factory=list)
    horizontal_scroll: bool = False
    scroll_delta: int = 0
    broken_images: list[str] = field(default_factory=list)
    empty_hrefs: list[str] = field(default_factory=list)
    missing_rel_noopener: list[str] = field(default_factory=list)
    h1_count: int = 0
    shindan_checks: dict[str, Any] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)

    def severity(self) -> str:
        if self.page_errors or self.console_errors or self.bad_responses or self.broken_images:
            return "🔴"
        # shindan 特殊検査の spec 違反は Critical
        if self.shindan_checks.get("before"):
            b = self.shindan_checks["before"]
            if (not b.get("relatedInDom") or not b.get("relatedVisible")
                    or (b.get("relatedLinkCount", 0) < 1)):
                return "🔴"
        if self.shindan_checks.get("shared"):
            s = self.shindan_checks["shared"]
            if (not s.get("resultSectionInDom") or s.get("cardCount", 0) != 5
                    or s.get("badgeCount", 0) != 5
                    or s.get("resultTopAboveFormBottom") is False):
                return "🔴"
        if (self.horizontal_scroll or self.empty_hrefs or self.missing_rel_noopener
                or (self.h1_count != 1)):
            return "🟡"
        return "🟢"


def _attach_listeners(page: Page, audit: PageAudit) -> None:
    def _on_console(msg: ConsoleMessage) -> None:
        text = f"[{msg.type}] {msg.text}"
        if msg.type == "error":
            audit.console_errors.append(text)
        elif msg.type == "warning":
            audit.console_warnings.append(text)

    def _on_pageerror(err: Exception) -> None:
        audit.page_errors.append(str(err))

    def _on_response(res: Response) -> None:
        try:
            if res.status >= 400:
                audit.bad_responses.append({
                    "url": res.url,
                    "status": res.status,
                })
        except Exception:
            pass

    page.on("console", _on_console)
    page.on("pageerror", _on_pageerror)
    page.on("response", _on_response)


def _run_dom_checks(page: Page, audit: PageAudit) -> None:
    """DOM状態を1回のevaluateでまとめて収集。"""
    data = page.evaluate(
        """() => {
            const docW = document.documentElement.scrollWidth;
            const winW = window.innerWidth;
            const imgs = Array.from(document.images).filter(im =>
                im.complete && im.naturalWidth === 0 && im.getAttribute('src')
            ).map(im => im.getAttribute('src'));

            // hidden 祖先を持つ要素は可視化されないので除外
            const isVisible = (el) => {
                if (!el || el.closest('[hidden]')) return false;
                const s = getComputedStyle(el);
                return s.display !== 'none' && s.visibility !== 'hidden';
            };

            const empty = Array.from(document.querySelectorAll('a'))
                .filter(isVisible)
                .filter(a => {
                    const h = a.getAttribute('href');
                    return !h || h.trim() === '' || h === '#';
                })
                .map(a => (a.textContent || '').trim().slice(0, 40) || '[no text]')
                .slice(0, 20);

            const blankNoRel = Array.from(document.querySelectorAll('a[target="_blank"]'))
                .filter(isVisible)
                .filter(a => {
                    const rel = (a.getAttribute('rel') || '').toLowerCase();
                    return !rel.includes('noopener');
                })
                .map(a => a.getAttribute('href') || '[no-href]')
                .slice(0, 20);

            return {
                scrollWidth: docW,
                innerWidth: winW,
                brokenImages: imgs,
                emptyHrefs: empty,
                missingRelNoopener: blankNoRel,
                h1Count: document.querySelectorAll('h1').length,
            };
        }"""
    )
    audit.horizontal_scroll = data["scrollWidth"] > data["innerWidth"] + 1
    audit.scroll_delta = data["scrollWidth"] - data["innerWidth"]
    audit.broken_images = data["brokenImages"]
    audit.empty_hrefs = data["emptyHrefs"]
    audit.missing_rel_noopener = data["missingRelNoopener"]
    audit.h1_count = data["h1Count"]


def _shindan_audit_direct(page: Page, audit: PageAudit) -> None:
    """診断前（直接アクセス）: related-pages / affiliate-cards が可視か？"""
    r = page.evaluate(
        """() => {
            const section = document.getElementById('result-section');
            const related = document.querySelector('.related-pages');
            const relatedList = document.getElementById('related-pages-links');
            const aff = document.querySelector('.affiliate-cards');
            const inDomRelated = related ? document.contains(related) : false;
            const inDomAff = aff ? document.contains(aff) : false;
            const relatedVisible = related ? (related.offsetParent !== null) : false;
            const affVisible = aff ? (aff.offsetParent !== null) : false;
            return {
                resultSectionInDom: !!(section && document.contains(section)),
                relatedInDom: inDomRelated,
                relatedVisible,
                relatedLinkCount: relatedList ? relatedList.children.length : 0,
                affInDom: inDomAff,
                affVisible,
            };
        }"""
    )
    audit.shindan_checks["before"] = r


def _shindan_audit_shared(page: Page, audit: PageAudit) -> None:
    """共有URL経路: 自動診断完了後に結果DOMがフォーム直下に入ったか？"""
    # app.js の自動診断待ち
    try:
        page.wait_for_selector(
            "#result-section .gokaku-card",
            state="attached",
            timeout=5000,
        )
        page.wait_for_timeout(400)
    except Exception as e:
        audit.notes.append(f"shared: wait result failed: {e}")

    r = page.evaluate(
        """() => {
            const section = document.getElementById('result-section');
            const form = document.getElementById('shindan-form');
            const sRect = section ? section.getBoundingClientRect() : null;
            const fRect = form ? form.getBoundingClientRect() : null;
            return {
                resultSectionInDom: !!(section && document.contains(section)),
                cardCount: document.querySelectorAll('#gokaku-grid .gokaku-card').length,
                badgeCount: document.querySelectorAll('#gokaku-grid .badge').length,
                resultTopAboveFormBottom: (sRect && fRect)
                    ? (sRect.top >= fRect.bottom - 2)
                    : null,
                relatedLinkCount: document.querySelectorAll('#related-pages-links > *').length,
            };
        }"""
    )
    audit.shindan_checks["shared"] = r


def audit_route(
    context: BrowserContext,
    route: dict[str, Any],
    viewport_name: str,
) -> PageAudit:
    url = BASE + route["path"]
    audit = PageAudit(url=url, label=route["label"], viewport=viewport_name)
    page = context.new_page()
    _attach_listeners(page, audit)

    try:
        resp = page.goto(url, wait_until="domcontentloaded", timeout=15000)
        audit.status = resp.status if resp else None
        page.wait_for_load_state("networkidle", timeout=8000)
    except Exception as e:
        audit.notes.append(f"goto/networkidle failed: {e}")

    try:
        _run_dom_checks(page, audit)
    except Exception as e:
        audit.notes.append(f"dom checks failed: {e}")

    # shindan 特殊検査
    try:
        if route["label"] == "shindan":
            _shindan_audit_direct(page, audit)
        elif route["label"] == "shindan-shared":
            _shindan_audit_shared(page, audit)
    except Exception as e:
        audit.notes.append(f"shindan audit failed: {e}")

    # スクリーンショット
    try:
        png = OUT / f"{viewport_name}_{route['label']}.png"
        page.screenshot(path=str(png), full_page=True)
    except Exception as e:
        audit.notes.append(f"screenshot failed: {e}")

    page.close()
    return audit


def render_report(audits: list[PageAudit]) -> str:
    lines: list[str] = []
    lines.append("# Playwright 監査レポート")
    lines.append("")
    lines.append(f"生成: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    # 凡例
    lines.append("凡例: 🔴=Critical  🟡=Major  🟢=OK")
    lines.append("")

    # 集計
    crit = [a for a in audits if a.severity() == "🔴"]
    major = [a for a in audits if a.severity() == "🟡"]
    ok = [a for a in audits if a.severity() == "🟢"]
    lines.append(f"**合計: {len(audits)}  /  🔴 {len(crit)} / 🟡 {len(major)} / 🟢 {len(ok)}**")
    lines.append("")

    # サマリ表
    lines.append("## サマリ")
    lines.append("")
    lines.append("| viewport | label | status | sev | console err | page err | 4xx/5xx | h-scroll | broken img | empty href | h1 |")
    lines.append("|---|---|---|---|---|---|---|---|---|---|---|")
    for a in audits:
        lines.append(
            "| {vp} | {lb} | {st} | {sev} | {ce} | {pe} | {br} | {hs} | {bi} | {eh} | {h1} |".format(
                vp=a.viewport,
                lb=a.label,
                st=a.status,
                sev=a.severity(),
                ce=len(a.console_errors),
                pe=len(a.page_errors),
                br=len(a.bad_responses),
                hs=("yes(+{}px)".format(a.scroll_delta) if a.horizontal_scroll else "no"),
                bi=len(a.broken_images),
                eh=len(a.empty_hrefs),
                h1=a.h1_count,
            )
        )
    lines.append("")

    # 詳細
    lines.append("## 詳細（問題があるものだけ）")
    lines.append("")
    for a in audits:
        if a.severity() == "🟢":
            continue
        lines.append(f"### {a.severity()} {a.viewport} — {a.label} ({a.url})")
        lines.append("")
        if a.console_errors:
            lines.append("- **Console errors**:")
            for e in a.console_errors[:10]:
                lines.append(f"  - `{e}`")
        if a.page_errors:
            lines.append("- **Page errors**:")
            for e in a.page_errors[:10]:
                lines.append(f"  - `{e}`")
        if a.bad_responses:
            lines.append("- **4xx/5xx**:")
            for r in a.bad_responses[:10]:
                lines.append(f"  - {r['status']} — {r['url']}")
        if a.horizontal_scroll:
            lines.append(f"- **横スクロール発生**: scrollWidth - innerWidth = +{a.scroll_delta}px")
        if a.broken_images:
            lines.append("- **画像ロード失敗**:")
            for u in a.broken_images[:10]:
                lines.append(f"  - `{u}`")
        if a.empty_hrefs:
            lines.append("- **空href/#のみのa要素**:")
            for t in a.empty_hrefs[:10]:
                lines.append(f"  - `{t}`")
        if a.missing_rel_noopener:
            lines.append("- **target=_blank で rel=noopener 欠落**:")
            for u in a.missing_rel_noopener[:10]:
                lines.append(f"  - `{u}`")
        if a.h1_count != 1:
            lines.append(f"- **h1数異常**: {a.h1_count}個（期待値 1）")
        if a.shindan_checks:
            lines.append(f"- **shindan特殊検査**: `{json.dumps(a.shindan_checks, ensure_ascii=False)}`")
        if a.notes:
            lines.append("- **notes**:")
            for n in a.notes:
                lines.append(f"  - {n}")
        lines.append("")

    # shindan 全文詳細
    lines.append("## shindan 特殊検査（全件）")
    lines.append("")
    for a in audits:
        if a.label in ("shindan", "shindan-shared"):
            lines.append(
                f"- **{a.viewport} / {a.label}**: `{json.dumps(a.shindan_checks, ensure_ascii=False)}`"
            )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    audits: list[PageAudit] = []
    with sync_playwright() as p:
        for vp in VIEWPORTS:
            engine = getattr(p, vp["engine"])
            try:
                browser = engine.launch(headless=True)
            except Exception as e:
                print(f"[skip] {vp['name']}: launch failed: {e}")
                continue
            ctx = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                is_mobile=vp["is_mobile"],
                device_scale_factor=2 if vp["is_mobile"] else 1,
                user_agent=(
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                    "Version/17.0 Mobile/15E148 Safari/604.1"
                ) if vp["is_mobile"] else None,
            )
            print(f"\n==== {vp['name']} ====")
            for route in ROUTES:
                print(f"  -> {route['label']} ({route['path']})")
                a = audit_route(ctx, route, vp["name"])
                audits.append(a)
                print(f"     {a.severity()} status={a.status} errs={len(a.console_errors)} "
                      f"pageerr={len(a.page_errors)} bad={len(a.bad_responses)} "
                      f"h-scroll={'yes' if a.horizontal_scroll else 'no'}")
            ctx.close()
            browser.close()

    report = render_report(audits)
    (OUT / "report.md").write_text(report, encoding="utf-8")
    print(f"\n[done] report: {OUT / 'report.md'}")

    # 終了コード: Critical があれば 1
    has_crit = any(a.severity() == "🔴" for a in audits)
    return 1 if has_crit else 0


if __name__ == "__main__":
    sys.exit(main())
