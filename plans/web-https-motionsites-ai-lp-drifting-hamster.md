# モーション強化 × アクセシビリティ底上げ計画

## Context

ユーザーが [motionsites.ai](https://motionsites.ai/) のリッチなモーションを見て「もっとおしゃれにしたいが、しつこいのは嫌」と相談。調査の結果、motionsites.ai の実態は **Bolt/Lovable 向け Hero セクション生成プロンプト集（React + Tailwind + Framer Motion 前提）** で、紹介事例は B2B SaaS / Web3 / ダーク×ネオン系。本サイトの「和モダン × ぬくもり × ママ層 × YMYL」とはブランド領域が逆方向で、丸コピーはブランド齟齬を起こす。

一方、既存のモーション基盤（[css/animations.css](css/animations.css) の 14 種キーフレーム+ stagger、[js/core/scroll-reveal.js](js/core/scroll-reveal.js) の IntersectionObserver、`prefers-reduced-motion` 完全対応）は**実は十分すぎるほど整っている**。問題は **適用範囲の狭さ**：[index.html](index.html) / [shindan.html](shindan.html) / [about.html](about.html) / [privacy-policy.html](privacy-policy.html) には `scroll-reveal.js` すら読み込まれておらず、基盤が活きていない。

方針: **既存基盤を全ページ展開し、hero に SplitText 風の見出し演出を1点追加。あわせてモーション強化とセットでアクセシビリティを底上げ**。ライブラリ追加なし、バニラ JS のみ。

---

## 変更スコープ

### Part 1 — 既存モーション基盤の全ページ展開

#### 1-A. `scroll-reveal.js` 読み込み追加
以下の HTML の `</body>` 直前（既存 `<script src="js/app.js">` の後）に 1 行追加:

```html
<script src="/js/core/scroll-reveal.js?v=20260425a" defer></script>
```

対象ファイル:
- [index.html](index.html)
- [shindan.html](shindan.html)
- [about.html](about.html)
- [privacy-policy.html](privacy-policy.html)
- [favorites.html](favorites.html)
- [404.html](404.html)

※ guide/*, kanji/*, ranking/*, suggestion.html は既に読み込み済。

#### 1-B. [shindan.html](shindan.html) の reveal 属性付与
- L94 `.page-header` → `data-reveal="fade"`
- L101 `.shindan-form` → `data-reveal="slide-up" data-reveal-delay="80"`
- L143 `#result-section` → `data-reveal="fade"`（`hidden=false` 切替と整合、下記 Part 1-E で再 observe 対応）
- L164 `.related-items` → `data-reveal="fade" data-reveal-delay="120"`
- L226 `.related-pages` → `data-reveal="fade" data-reveal-delay="160"`

`.input-group` 個別や全段落には **付けない**（しつこさ回避）。

#### 1-C. [about.html](about.html) / [privacy-policy.html](privacy-policy.html)
- `.page-header` → `data-reveal="fade"`
- 各 `<section class="about-section">` → `data-reveal="slide-up"`、連続ブロックは `data-reveal-delay="0|80|160"` でリズム演出
- `.gokaku-explain-card` 5 枚（天格〜総格） → `data-reveal="slide-up"` + `data-reveal-delay={index*60}`

#### 1-D. [index.html](index.html) 追加展開
- L149 `.how-section` の `.step-card` 3 枚に `data-reveal="slide-up" data-reveal-delay="0|80|160"`
- L176 `.disclaimer-card` → `data-reveal="fade"`
- feature-card（L117-143）は既に `animate-slide-up` インライン付与済なので据え置き

#### 1-E. [js/core/scroll-reveal.js](js/core/scroll-reveal.js) の公開 API 追加
`window.ScrollReveal = { observe(nodes) }` を IIFE 末尾で公開。五格カードなど動的生成要素に対し外部から observe を呼べるようにする（DOM 生成後、既発火済みとして無視されるのを防ぐ）。

#### 1-F. [js/ui-controller.js](js/ui-controller.js) の五格カードスタガー
`createGokakuCard(key, data, label, fortune, index)` 内で:
```js
card.setAttribute('data-reveal', 'slide-up');
card.setAttribute('data-reveal-delay', String(index * 80));
```
`showResults` 末尾で `window.ScrollReveal?.observe?.(cards)` を呼ぶ。
→ 診断ボタン押下後、0/80/160/240/320ms で天格→人格→地格→外格→総格が順次登場。

---

### Part 2 — hero の SplitText 風見出し演出

#### 2-A. 新規ファイル [js/core/split-text.js](js/core/split-text.js) 作成（約 40 行）

IIFE でバニラ実装。`[data-split-text]` 属性の要素を走査し、テキストノードを 1 文字ずつ `<span class="split-char" style="--i:N">` に分解。`<br>` など要素ノードは温存。`prefers-reduced-motion: reduce` のとき `.split-text--reduced` を付与してアニメ無効化。

#### 2-B. CSS 追加（[css/animations.css](css/animations.css)）
既存の `@media (prefers-reduced-motion: reduce)` ブロック（L344-379）の**前**に:

```css
@keyframes blurIn {
  from { opacity: 0; filter: blur(8px); transform: translateY(8px); }
  to   { opacity: 1; filter: blur(0);   transform: translateY(0); }
}
.split-char {
  display: inline-block;
  opacity: 0;
  will-change: opacity, filter, transform;
}
.split-text--ready .split-char {
  animation: blurIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 0.04s);
}
.split-text--reduced .split-char {
  animation: none;
  opacity: 1;
  filter: none;
  transform: none;
}
```

L344 の `@media (prefers-reduced-motion: reduce)` ブロック内にも保険として `.split-char { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; }` を追加。

#### 2-C. [index.html](index.html) L92 の書き換え

```html
<!-- Before -->
<h1 class="hero-title animate-fade-in">大切なお子さまに<br>最高の名前を</h1>

<!-- After -->
<h1 class="hero-title" data-split-text>大切なお子さまに<br>最高の名前を</h1>
```

`</body>` 直前に `<script src="js/core/split-text.js?v=20260425a" defer></script>` 追加。
→ 和紙越しにふわっと浮かぶような blur(8px)→0 の柔らかい 1 文字ずつ登場（Zen Maru Gothic と好相性、0.04s ディレイ × 14 文字で合計 560ms の穏やか演出）。

---

### Part 3 — アクセシビリティ底上げ（P1）

#### 3-A. 診断結果 aria-live の責務分担 🔴
[shindan.html](shindan.html) L143 の `aria-atomic="true"` を削除。`result-section` 全体を毎回全文読み上げると関連リンクも含めて騒がしすぎる。代わりに L320 `#ns-live` に「山田太郎さんの総格は大吉、29 画です」のような要約のみを [js/ui-controller.js](js/ui-controller.js) から流し込む設計に。

#### 3-B. リンク色コントラスト修正 🔴
[css/base.css](css/base.css) L97 の `a { color: var(--color-terracotta); }` → `var(--color-link-on-light)` に変更。`#E8725C` は白背景 3.2:1 で WCAG AA 未満。`--color-link-on-light: #C45E48` は [css/variables.css](css/variables.css) L189 に**既に定義されているのに未使用**（4.6:1 / AA pass）。

#### 3-C. focus-visible リングのコントラスト 🔴
[css/base.css](css/base.css) L198 `:focus-visible { outline: 3px solid var(--color-terracotta-light); }` → `var(--color-terracotta-dark)` (#D05A46, 4.8:1) に変更。境界面で見づらい問題を解消。

#### 3-D. 見出し階層の修正 🔴
[shindan.html](shindan.html) の h2 は L145 のみ、L164 / L227 が直接 h3 で階層飛び。L164 `.related-items__heading` を `<h2>` に昇格、または構造調整。

#### 3-E. btn--secondary のコントラスト 🟡
[css/components.css](css/components.css) L167 `.btn--secondary` は `#6EC4A8` 背景 + `#fff` テキスト = 2.0:1（AA Large 3:1 未満）。背景を `--color-sage-dark: #52B090` に変更、または text を `var(--color-dark)` に。

#### 3-F. stroke-preview の aria-live 見直し 🟡
[shindan.html](shindan.html) L115 / L129 `aria-live="polite"` は IME 入力中に毎文字読み上げ騒がしい可能性。`aria-live="off"` にして確定時のみ更新、もしくは `aria-live` を削除しフォーカスブラー時に `#ns-live` へ通知、の二択を検討。

---

## 実装順

1. **Part 3-B / 3-C**（リンク色・focus ring）— [css/variables.css](css/variables.css) と [css/base.css](css/base.css) のみ。全ページ即効、回帰最小。
2. **Part 1-E**（`window.ScrollReveal.observe` 公開 API）— Part 1-F / 2 の前提。
3. **Part 1-A 〜 1-D**（`scroll-reveal.js` 読み込み + `data-reveal` 属性付与）— 見た目が最も変わるので Lighthouse CLS 計測。
4. **Part 1-F**（五格カードのスタガー）— 診断体験の目玉演出。
5. **Part 2**（SplitText）— 独立作業。最後に hero の印象仕上げ。
6. **Part 3-A / 3-D**（aria-live 責務分担 + 見出し階層）— Part 1-F 動作確認後に実施、NVDA で結果読み上げ検証。
7. **Part 3-E / 3-F**（P2 系）— 余裕があれば。

---

## Critical Files

| 種別 | ファイル |
|------|---------|
| 編集 | [js/core/scroll-reveal.js](js/core/scroll-reveal.js) — 公開 API 追加 |
| 編集 | [js/ui-controller.js](js/ui-controller.js) — 五格カードに reveal 属性＋ observe 呼び出し |
| 編集 | [css/animations.css](css/animations.css) — blurIn キーフレーム追加 |
| 編集 | [css/base.css](css/base.css) — リンク色・focus ring |
| 編集 | [css/components.css](css/components.css) — btn--secondary コントラスト |
| 編集 | [shindan.html](shindan.html) — aria-live 整理、見出し階層、data-reveal 付与、scroll-reveal.js 読み込み |
| 編集 | [index.html](index.html) — hero-title に data-split-text、step-card に reveal、scripts 追加 |
| 編集 | [about.html](about.html), [privacy-policy.html](privacy-policy.html), [favorites.html](favorites.html), [404.html](404.html) — scroll-reveal.js 読み込み、data-reveal 付与 |
| 新規 | [js/core/split-text.js](js/core/split-text.js) — 約 40 行の IIFE |

---

## 検証方法

1. **ローカル起動**: `npx serve` でルート配信、`/`, `/shindan`, `/about`, `/privacy-policy`, `/guide/` を巡回。
2. **reduced-motion**: Chrome DevTools → Rendering → `prefers-reduced-motion: reduce` を ON で全ページ確認。`.split-char` と `[data-reveal]` が即時表示、五格カードのスタガー無効化を目視。
3. **Lighthouse Accessibility**: before/after でスコア比較（目標 95+）。"Background and foreground colors do not have a sufficient contrast ratio" と "Heading elements are not in a sequentially-descending order" の警告消失を確認。
4. **NVDA または VoiceOver**:
   - 姓「山田」名「太郎」入力 → 診断。結果が「診断結果。山田太郎さんの総格は大吉、29 画…」と **1 回だけ** 読み上げられる（`aria-atomic` 削除効果）。
   - IME 変換中に stroke-preview が過剰に読まれない。
5. **キーボード操作のみ**: Tab でスキップリンク → nav → 姓 → 名 → 診断ボタン → 結果内リンク → お気に入り → OG → 関連ページまで遷移できる。focus-visible リングが暗めテラコッタ（4.8:1）で視認できる。
6. **WCAG コントラスト**: `webaim.org/resources/contrastchecker/` で `#C45E48` on `#FFF8F0` = 4.6:1 / AA pass、btn--secondary 前後の改善値を記録。
7. **回帰**: 既存 Playwright スクリプト (`test_shindan.py`, `test-ios-safari.py`) 実行、DOM 変更で壊れていないか確認。
8. **実機モバイル**: iPhone Safari / Android Chrome で hero 読み込みカクつきなし、五格カードスタガー自然、focus ring 視認性問題なしを確認。

---

## 非採用案（ユーザー合意済）

- **motionsites.ai 丸コピー** — ブランド齟齬（ハイテク×ダーク ⇄ 和モダン×ぬくもり）、技術スタック不一致（Framer Motion 前提）のため不採用。
- **GSAP / Lenis 等のリッチライブラリ導入** — バンドル 30KB+、古いママ層端末のパフォーマンス懸念から不採用。バニラで完結。
- **カーソル追従・パララックス・3D 変形・カウンタ追従カメラ** — しつこさとブランド齟齬で不採用。リッチモーションはブランド方向性に合う範囲（SplitText 風 1 点）に絞る。
