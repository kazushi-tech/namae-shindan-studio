#!/usr/bin/env python3
"""全ページの <ul class="nav__links"> を共通構成に同期する。

目標ナビ構成:
  ホーム / 姓名判断 / 名前候補 / ランキング / 漢字辞典 / ガイド / 五格 / ⭐お気に入り / コラム
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (label, href, active-key)
NAV_ITEMS: list[tuple[str, str, str]] = [
    ("ホーム", "/", "home"),
    ("姓名判断", "/shindan", "shindan"),
    ("名前候補", "/suggestion", "suggestion"),
    ("ランキング", "/ranking/", "ranking"),
    ("漢字辞典", "/kanji/", "kanji"),
    ("ガイド", "/guide/", "guide"),
    ("五格", "/about", "about"),
    ("⭐お気に入り", "/favorites", "favorites"),
    ("コラム", "https://column.namae-studio.com/", "column"),
]

# ページ相対パス -> active key
PAGE_MAP: dict[str, str] = {
    "index.html": "home",
    "shindan.html": "shindan",
    "suggestion.html": "suggestion",
    "about.html": "about",
    "favorites.html": "favorites",
    "privacy-policy.html": "",
    "404.html": "",
    "ranking/index.html": "ranking",
    "ranking/2026-girls.html": "ranking",
    "ranking/2026-boys.html": "ranking",
    "guide/index.html": "guide",
    "guide/faq.html": "guide",
    "guide/meimei-tools.html": "guide",
    "kanji/index.html": "kanji",
}
# 漢字ページ (10 枚) も kanji active
for ch in ["蓮", "結", "凛", "陽", "心", "咲", "葵", "優", "蒼", "翔"]:
    PAGE_MAP[f"kanji/{ch}.html"] = "kanji"


def build_nav(active_key: str) -> str:
    lines = ['<ul class="nav__links">']
    for label, href, key in NAV_ITEMS:
        cls = "nav__link"
        aria = ""
        if key == active_key and active_key:
            cls += " nav__link--active"
            aria = ' aria-current="page"'
        rel = ""
        if href.startswith("http"):
            rel = ' rel="noopener"'
        lines.append(f'        <li><a href="{href}" class="{cls}"{aria}{rel}>{label}</a></li>')
    lines.append("      </ul>")
    return "\n".join(lines)


NAV_RE = re.compile(r'<ul class="nav__links">.*?</ul>', re.DOTALL)


def sync_file(rel: str, active: str) -> bool:
    path = ROOT / rel
    src = path.read_text(encoding="utf-8")
    new_nav = build_nav(active)
    new_src, n = NAV_RE.subn(new_nav, src, count=1)
    if n == 0:
        print(f"  SKIP (no nav__links): {rel}")
        return False
    if new_src == src:
        print(f"  unchanged: {rel}")
        return False
    path.write_text(new_src, encoding="utf-8")
    print(f"  updated : {rel} (active={active or 'none'})")
    return True


def main() -> int:
    changed = 0
    for rel, active in PAGE_MAP.items():
        if sync_file(rel, active):
            changed += 1
    print(f"\nchanged {changed}/{len(PAGE_MAP)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
