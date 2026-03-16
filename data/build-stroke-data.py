#!/usr/bin/env python3
"""
build-stroke-data.py — Generate kanji-strokes.json from Unicode Unihan data.

Downloads the official Unicode Unihan kTotalStrokes data and produces a JSON
mapping of CJK characters (and kana) to their stroke counts.

Usage:
    python data/build-stroke-data.py

Output:
    data/kanji-strokes.json
"""

import json
import os
import sys
import urllib.request
import tempfile
import re
from pathlib import Path

UNIHAN_URL = "https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip"
UNIHAN_STROKES_URL = (
    "https://www.unicode.org/Public/UCD/latest/ucd/Unihan/Unihan_IRGSources.txt"
)

# Fallback: direct kTotalStrokes file from Unihan
UNIHAN_STROKES_DIRECT = (
    "https://www.unicode.org/Public/UCD/latest/ucd/Unihan/Unihan_DictionaryLikeData.txt"
)

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = SCRIPT_DIR / "kanji-strokes.json"

# ---------------------------------------------------------------------------
# Hiragana stroke counts (standard calligraphic counts)
# ---------------------------------------------------------------------------
HIRAGANA_STROKES = {
    "あ": 3, "い": 2, "う": 2, "え": 2, "お": 3,
    "か": 3, "き": 3, "く": 1, "け": 3, "こ": 2,
    "さ": 3, "し": 1, "す": 2, "せ": 3, "そ": 1,
    "た": 4, "ち": 2, "つ": 1, "て": 1, "と": 2,
    "な": 4, "に": 3, "ぬ": 2, "ね": 2, "の": 1,
    "は": 3, "ひ": 1, "ふ": 4, "へ": 1, "ほ": 4,
    "ま": 3, "み": 2, "む": 3, "め": 2, "も": 3,
    "や": 3, "ゆ": 2, "よ": 2,
    "ら": 2, "り": 2, "る": 1, "れ": 1, "ろ": 1,
    "わ": 2, "を": 3, "ん": 1,
    # Small kana
    "ぁ": 3, "ぃ": 2, "ぅ": 2, "ぇ": 2, "ぉ": 3,
    "ゃ": 3, "ゅ": 2, "ょ": 2, "っ": 1,
    # Additional hiragana
    "ゎ": 2, "ゐ": 3, "ゑ": 4,
}

# ---------------------------------------------------------------------------
# Katakana stroke counts
# ---------------------------------------------------------------------------
KATAKANA_STROKES = {
    "ア": 2, "イ": 2, "ウ": 3, "エ": 3, "オ": 3,
    "カ": 2, "キ": 3, "ク": 2, "ケ": 3, "コ": 2,
    "サ": 3, "シ": 3, "ス": 2, "セ": 2, "ソ": 2,
    "タ": 3, "チ": 3, "ツ": 3, "テ": 3, "ト": 2,
    "ナ": 2, "ニ": 2, "ヌ": 2, "ネ": 4, "ノ": 1,
    "ハ": 2, "ヒ": 2, "フ": 1, "ヘ": 1, "ホ": 4,
    "マ": 2, "ミ": 3, "ム": 2, "メ": 2, "モ": 3,
    "ヤ": 2, "ユ": 2, "ヨ": 3,
    "ラ": 2, "リ": 2, "ル": 2, "レ": 1, "ロ": 3,
    "ワ": 2, "ヲ": 3, "ン": 2,
    # Small katakana
    "ァ": 2, "ィ": 2, "ゥ": 3, "ェ": 3, "ォ": 3,
    "ャ": 2, "ュ": 2, "ョ": 3, "ッ": 3,
    # Additional katakana
    "ヮ": 2, "ヴ": 4, "ヵ": 2, "ヶ": 3,
}


def download_unihan_strokes() -> dict[str, int]:
    """Download and parse Unihan kTotalStrokes data."""
    strokes = {}

    print(f"Downloading Unihan data from {UNIHAN_STROKES_DIRECT} ...")
    try:
        with urllib.request.urlopen(UNIHAN_STROKES_DIRECT, timeout=30) as resp:
            data = resp.read().decode("utf-8")
    except Exception as e:
        print(f"  Failed: {e}")
        print("  Trying alternate URL ...")
        try:
            with urllib.request.urlopen(UNIHAN_STROKES_URL, timeout=30) as resp:
                data = resp.read().decode("utf-8")
        except Exception as e2:
            print(f"  Also failed: {e2}")
            return strokes

    for line in data.splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) >= 3 and parts[1] == "kTotalStrokes":
            codepoint = int(parts[0].replace("U+", ""), 16)
            # kTotalStrokes may have multiple values (J/C sources); take first
            stroke_val = parts[2].strip().split()[0]
            char = chr(codepoint)
            strokes[char] = int(stroke_val)

    print(f"  Parsed {len(strokes)} characters from Unihan.")
    return strokes


def filter_japanese_kanji(strokes: dict[str, int]) -> dict[str, int]:
    """
    Filter to ~3000 commonly used Japanese kanji (常用漢字 + 人名用漢字).
    CJK Unified Ideographs: U+4E00 - U+9FFF
    CJK Extension A:        U+3400 - U+4DBF
    """
    result = {}
    for char, count in strokes.items():
        cp = ord(char)
        # Keep CJK Unified Ideographs (covers 常用 + 人名用)
        if 0x4E00 <= cp <= 0x9FFF:
            result[char] = count
        # Some 人名用漢字 are in Extension A
        elif 0x3400 <= cp <= 0x4DBF:
            result[char] = count
    return result


def build_stroke_data() -> dict[str, int]:
    """Build the complete stroke count dictionary."""
    # Try downloading Unihan data
    unihan = download_unihan_strokes()

    if unihan:
        kanji = filter_japanese_kanji(unihan)
        print(f"  Filtered to {len(kanji)} Japanese kanji.")
    else:
        print("  WARNING: Could not download Unihan data.")
        print("  Using fallback: loading existing kanji-strokes.json if available.")
        fallback = SCRIPT_DIR / "kanji-strokes.json"
        if fallback.exists():
            with open(fallback, "r", encoding="utf-8") as f:
                return json.load(f)
        else:
            print("  ERROR: No fallback data available. Exiting.")
            sys.exit(1)

    # Merge kana
    result = {}
    result.update(kanji)
    result.update(HIRAGANA_STROKES)
    result.update(KATAKANA_STROKES)

    return result


def main():
    print("=== build-stroke-data.py ===")
    data = build_stroke_data()

    # Sort by Unicode codepoint for stable output
    sorted_data = dict(sorted(data.items(), key=lambda x: ord(x[0])))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=2)

    print(f"\nWrote {len(sorted_data)} entries to {OUTPUT_PATH}")
    print("Done.")


if __name__ == "__main__":
    main()
