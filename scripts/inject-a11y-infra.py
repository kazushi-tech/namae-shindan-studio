#!/usr/bin/env python3
"""Bulk inject skip-link / main-id / aria-live / scroll-reveal.js into existing
public HTML pages, plus bump ?v= cache bust to 20260425a.

Idempotent: skips files that already contain the inserted markers.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TARGETS = [
    "index.html",
    "shindan.html",
    "suggestion.html",
    "about.html",
    "favorites.html",
    "privacy-policy.html",
    "404.html",
    "ranking/index.html",
    "ranking/2026-boys.html",
    "ranking/2026-girls.html",
    "kanji/index.html",
    "guide/faq.html",
    "guide/meimei-tools.html",
]
# kanji detail pages — 10 files
for k in ["優", "凛", "咲", "心", "結", "翔", "葵", "蒼", "蓮", "陽"]:
    TARGETS.append(f"kanji/{k}.html")

SKIP_LINK_TAG = '<a class="skip-link" href="#main-content">本文へスキップ</a>'
LIVE_REGION = """  <div id="ns-live" class="sr-only" aria-live="polite" role="status"></div>
  <div id="ns-live-alert" class="sr-only" aria-live="assertive"></div>

"""
SCROLL_REVEAL_SCRIPT = '  <script src="/js/core/scroll-reveal.js?v=20260425a" defer></script>\n'

NEW_VERSION = "20260425a"

# Regexes
RE_VERSION = re.compile(r'\?v=20260424[a-z]?\b')
# <body ...>
RE_BODY_OPEN = re.compile(r'(<body[^>]*>)', re.IGNORECASE)
# <main ...> (without id=)
RE_MAIN_NO_ID = re.compile(r'<main(\s+[^>]*?)?>', re.IGNORECASE)
# <script ...src="/js/core/boot.js...>...</script> — used as anchor to insert scroll-reveal.js after
RE_BOOT_SCRIPT = re.compile(
    r'(<script\s+src="/js/core/boot\.js\?v=[^"]+"[^>]*></script>)',
    re.IGNORECASE,
)
# closing </body>
RE_BODY_CLOSE = re.compile(r'(\s*</body>)', re.IGNORECASE)


def transform(text: str) -> str:
    original = text

    # 1) cache-bust — replace any old ?v=20260424x with NEW_VERSION
    text = RE_VERSION.sub(f'?v={NEW_VERSION}', text)

    # 2) skip-link right after <body ...>
    if SKIP_LINK_TAG not in text:
        text = RE_BODY_OPEN.sub(
            lambda m: m.group(1) + '\n\n  ' + SKIP_LINK_TAG + '\n', text, count=1,
        )

    # 3) main id + tabindex — only when missing
    def _main_repl(m):
        attrs = m.group(1) or ''
        if re.search(r'\bid\s*=', attrs, re.IGNORECASE):
            return m.group(0)
        return f'<main{attrs} id="main-content" tabindex="-1">'
    text = RE_MAIN_NO_ID.sub(_main_repl, text, count=1)

    # 4) scroll-reveal script — right after boot.js
    if 'scroll-reveal.js' not in text:
        def _boot_repl(m):
            return m.group(1) + '\n' + SCROLL_REVEAL_SCRIPT.rstrip()
        if RE_BOOT_SCRIPT.search(text):
            text = RE_BOOT_SCRIPT.sub(_boot_repl, text, count=1)

    # 5) aria-live regions — before </body>
    if 'id="ns-live"' not in text and 'id=\'ns-live\'' not in text:
        text = RE_BODY_CLOSE.sub(
            lambda m: '\n' + LIVE_REGION.rstrip('\n') + m.group(1),
            text,
            count=1,
        )

    return text


def main():
    changed = 0
    for rel in TARGETS:
        path = ROOT / rel
        if not path.exists():
            print(f'SKIP  {rel} (not found)')
            continue
        src = path.read_text(encoding='utf-8')
        dst = transform(src)
        if src == dst:
            print(f'NOOP  {rel}')
        else:
            path.write_text(dst, encoding='utf-8')
            changed += 1
            print(f'WROTE {rel}')
    print(f'\n=== {changed} files modified ===')


if __name__ == '__main__':
    sys.exit(main())
