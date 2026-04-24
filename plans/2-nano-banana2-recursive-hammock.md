# スマホ表示の致命的不具合修正 ＋ モバイル UX 総合改善

作成日: 2026-04-25
作業者: 主様（Kazushi） + Agent Team 並列実装
所要時間: Phase 1 準備 20 分 / Phase 2 並列実装 60〜90 分 / Phase 3 検証 30 分 / Phase 4 レビュー＆デプロイ 20 分 / **合計 約 2.5 時間**

---

## Context（なぜこの修正が必要か）

主様が本番サイト（https://namae-studio.com/）をスマホで確認したところ、以下の 2 つの致命的問題を発見した:

### 症状 ①: 人気ランキングで 2 位がトップに表示される

[ranking/2026-boys.html](ranking/2026-boys.html) / [ranking/2026-girls.html](ranking/2026-girls.html) の TOP3 カードが、**スマホ（<768px）では金 → 銀 → 銅の順ではなく、銀（2位） → 金（1位） → 銅（3位）の順で並ぶ**。ランキングの意味が完全に壊れている。

**根本原因:** [js/ranking-page.js:63](js/ranking-page.js#L63) で DOM 挿入順を `['silver', 'gold', 'bronze']` に意図的に変更し、[css/pages/ranking.css:204-207](css/pages/ranking.css#L204-L207) の `@media (min-width: 768px)` で CSS Grid `order` プロパティ（silver:1 / gold:2 / bronze:3）により PC 時だけ視覚順を入れ替える設計。**モバイル向けの `order` 指定がないため DOM 順のまま表示され、2 位が先頭に来る**。

### 症状 ②: 姓名判断結果に Nano Banana2 の水彩画像 4 枚が表示されない

結果セクションで五格（天格・人格・地格・外格・総格）の 5 カードの **間に、Nano Banana2 で生成した水彩ディバイダー画像（divider-sakura / divider-leaves / divider-clouds を循環、計 4 箇所）が挿入される設計**だが、スマホで一切表示されない。

**根本原因:** [css/pages/shindan.css:911-919](css/pages/shindan.css#L911-L919) に以下の「縦スペース圧縮」目的の記述があり、mobile で完全非表示にしていた:
```css
@media (max-width: 767px) {
  .gokaku-divider { display: none; }
  .related-items { margin-top: var(--space-3); }
}
```
PC では 240〜320px の水彩画像が挟まって美しいが、主様は「Nano Banana2 で作った画像がスマホで表示されない」と気づいた。意図的な display:none だが UX 的に明らかに劣化しており、主様の期待と乖離している。

### 症状 ③: スマホ表示で他にも複数の表示崩れ・UX 課題

Explore 調査で Critical 3 件 / Major 7 件 / Minor 4 件の潜在問題を発見。放置すれば Google モバイルフレンドリーテスト / Core Web Vitals / AdSense 審査に悪影響。

### 期待される成果

- TOP3 ランキングの順序がモバイルでも正しい（金 → 銀 → 銅）
- 姓名判断結果に 4 枚の水彩画像がスマホでも表示される（モバイル最適化したサイズで）
- 全ページのモバイル表示で横スクロール・タップ誤反応・文字はみ出しがゼロ
- Playwright 実機検証（iPhone 12 Pro 390px / Pixel 7 412px / 360px Android）で崩れゼロ

---

## Done の定義

- [ ] モバイル（375px ビューポート）でランキング TOP3 が金・銀・銅の正しい順で並ぶ
- [ ] モバイルで姓名判断結果の五格カード間に 4 枚の水彩ディバイダー画像が表示される（180px 以下に縮めて縦圧迫を抑える）
- [ ] 360px / 375px / 390px / 412px の 4 サイズで主要 8 ページ（index, shindan, about, ranking hub, ranking detail, kanji hub, guide hub, favorites）に横スクロール発生なし
- [ ] `white-space: nowrap` 起因のはみ出しゼロ（必要箇所は `overflow-x: auto` + スクロールキューで明示）
- [ ] About ページの 5 列五格グリッドが 480px 未満で 2 列または 1 列に折り返す
- [ ] ランキングリスト（4〜30 位）の 4 カラムグリッドが 360px でも読める
- [ ] ホームの Hero イラスト `opacity: 0.25` が本文と重ならないよう再配置
- [ ] Playwright モバイル実機検証スクショ（4 サイズ × 8 ページ = 32 枚）が `test_screenshots/mobile-review-2026-04-25/` に保存
- [ ] `codex-review` skill で Critical/Major が 0 になるまで修正ループ
- [ ] `universal-review` skill で最終 OK 判定
- [ ] master 直 push 完了（主様の memory 方針: コミット＆デプロイは指示を仰がず自走）

**非ゴール:**
- Nano Banana2 で新規画像生成（既存の divider-*.png / shindan-header.png をそのまま活用する）
- BYOK ユーザー向け AI 画像生成機能（[CLAUDE.md](CLAUDE.md) Phase 2 Tier B の別案件）
- コラムサイト（column.namae-studio.com）のモバイル調整（[plans/ui-ux-stitch2-immutable-corbato.md](plans/ui-ux-stitch2-immutable-corbato.md) で別途対応済）

---

## 検出された問題一覧（優先度別）

### 🔴 Critical（致命的、即修正）

| # | 問題 | ファイル | 根拠 |
|---|------|---------|------|
| C1 | ランキング TOP3 の順序がスマホで「銀→金→銅」 | [js/ranking-page.js:63](js/ranking-page.js#L63) / [css/pages/ranking.css:204-207](css/pages/ranking.css#L204-L207) | DOM 順が銀金銅、PC だけ CSS order で修正、モバイル未対応 |
| C2 | 姓名判断結果の水彩ディバイダー 4 枚がスマホで全非表示 | [css/pages/shindan.css:911-919](css/pages/shindan.css#L911-L919) | `display: none` を mobile に適用しており、主様の「Nano Banana2 画像が出ない」認識と直結 |
| C3 | ランキングリスト 4 カラムが 360px で破綻 | [css/pages/ranking.css:308-313](css/pages/ranking.css#L308-L313) | `grid-template-columns: 40px 1fr auto auto` が <480px 用メディアクエリなし |
| C4 | About ページの五格グリッド 5 列が 480px 未満で崩れる | [css/pages/about.css](css/pages/about.css) | `@media (min-width: 768px)` だけで下限未設定 |
| C5 | TOP3 `top3__name` font-size が 44px / 52px 固定 | [css/pages/ranking.css:242-253](css/pages/ranking.css#L242-L253) | 375px でコンテナオーバーフローの可能性、`clamp()` 未使用 |

### 🟡 Major（重要、優先修正）

| # | 問題 | ファイル | 根拠 |
|---|------|---------|------|
| M1 | Hero イラスト（ホーム）が本文テキストに重なる | [css/pages/home.css:78-82](css/pages/home.css#L78-L82) | `@media (max-width: 767px)` で `opacity: 0.25` 維持、位置調整なし |
| M2 | 漢字グリッドが 360px で 3 列のまま窮屈 | [css/pages/kanji.css:64-69](css/pages/kanji.css#L64-L69) | `@media (max-width: 359px)` だけ 2 列化、360〜479px が抜け |
| M3 | Feature Grid（ホーム 3 ポイント）が 480px 以下で 2 列のまま | [css/pages/home.css:233-250](css/pages/home.css#L233-L250) | 375px で 1 列化されない |
| M4 | Promo Card が 640px 以上で横型のまま、スマホで padding 過大 | [css/components.css:991-1001](css/components.css#L991-L1001) | flex-direction: column 化タイミング不適切 |
| M5 | Guide 比較表が `white-space: nowrap` で横溢れ、スクロールヒント無 | [css/pages/guide.css:519](css/pages/guide.css#L519), [css/pages/guide.css:540](css/pages/guide.css#L540) | `overflow-x: auto` 親はあるがユーザーが気づけない |
| M6 | About ページの example-table が 375px で横溢れ | [css/pages/about.css:165](css/pages/about.css#L165), [css/pages/about.css:210](css/pages/about.css#L210) | <480px 用の overflow-x が抜け |
| M7 | 診断結果 share ボタン群の gap が 8px で窮屈 | [css/pages/shindan.css:733-738](css/pages/shindan.css#L733-L738) | 3 ボタン × 14px padding で 375px では折り返しギリ |

### 🟢 Minor（美観、余裕があれば）

| # | 問題 | ファイル | 根拠 |
|---|------|---------|------|
| N1 | ナビドロワー `max-height: calc(100vh - 64px)` で超小ビューポートスクロール不可 | [css/components.css:747-797](css/components.css#L747-L797) | iPhone SE など 667px 縦で 9 項目 + footer が切れる可能性 |
| N2 | Footer が 375px で 6 項目全部縦一列、長大 | [css/components.css:859-868](css/components.css#L859-L868) | 複数列にして縦スクロール量削減の余地 |
| N3 | `body.nav-drawer-open` の skip-link z-index 競合疑義 | [css/components.css:31](css/components.css#L31), [css/components.css:774-776](css/components.css#L774-L776) | 実害は不明だが a11y リスク |
| N4 | Suggestion フォーム max-width が 1200px のまま | [css/pages/suggestion.css:93-100](css/pages/suggestion.css#L93-L100) | 375px でも padding 調整が入らない |

---

## アーキテクチャ（Agent Team 並列実装）

主様選択の「Agent team 並列実装」方針に従い、以下の 3 並列構成で進める。

```text
[Main Agent（司令塔）]
 ├─ Phase 1 準備:
 │   ├── 作業ブランチ確認（master 直 push の方針だが念のため git status 確認）
 │   └── test_screenshots/mobile-review-2026-04-25/ ディレクトリ作成
 │
 ├─ Phase 2 並列実装（一斉に 3 エージェント起動）:
 │   ├── Agent A: ランキング系修正（C1, C3, C5）+ 影響範囲確認
 │   │   → js/ranking-page.js, css/pages/ranking.css のみ
 │   │
 │   ├── Agent B: 姓名判断 & モバイル CSS 一括改善（C2, M7, N3）
 │   │   → css/pages/shindan.css, css/components.css の一部
 │   │
 │   └── Agent C: その他ページのモバイル CSS 改善（C4, M1〜M6, N1, N2, N4）
 │       → css/pages/home.css, about.css, kanji.css, guide.css, suggestion.css
 │
 ├─ Phase 3 検証（Main が集約）:
 │   ├── 3 エージェントの修正差分を確認（git diff）
 │   ├── webapp-testing skill で Playwright 起動、4 サイズ × 8 ページ = 32 枚撮影
 │   └── 32 枚のスクショを目視 + pixel-diff 比較
 │
 ├─ Phase 4 レビュー:
 │   ├── codex-review skill で Plan / Diff / Runtime / Release の 4 ゲート
 │   ├── Critical/Major が 0 になるまで修正ループ
 │   └── universal-review skill で最終軽量確認
 │
 └─ Phase 5 デプロイ:
     ├── git add + commit（fix: スマホ表示の致命的不具合修正 + モバイル UX 改善）
     └── git push origin master（Vercel 自動デプロイ）
```

### 活用する Skills

| Skill | 用途 | 発動タイミング |
|-------|------|--------------|
| `webapp-testing` | Playwright で iPhone 12 Pro / Pixel 7 / 360px / 375px で実機検証、32 枚スクショ | Phase 3 |
| `codex-review` | Critical/Major 0 までの厳格レビュー | Phase 4 前半 |
| `universal-review` | 最終軽量レビュー | Phase 4 後半 |
| `ui-design-review` | 修正後のモバイル UI / a11y 総合チェック（余力時のみ） | Phase 4 後半（オプション） |
| `quick-git` | commit / push 自動化 | Phase 5 |

---

## Phase 1: 準備（Main、20 分）

1. **git status 確認** — 作業中の未コミット変更が `test_screenshots/` の画像 M フラグのみであることを確認
2. **スクショ保存先作成** — `test_screenshots/mobile-review-2026-04-25/before/` と `.../after/` を新設
3. **Playwright 設定確認** — `webapp-testing` skill が動く環境か、Node / npm が使えるか
4. **Baseline スクショ撮影** — 修正前の崩れたスマホ表示を `before/` に 32 枚保存（Agent C と並行でも可）

---

## Phase 2: 並列実装（60〜90 分、3 エージェント同時起動）

### Agent A: ランキング系修正

**責任範囲:** `js/ranking-page.js`, `css/pages/ranking.css`

#### Task A1: DOM 挿入順をそのままにモバイル order を追加（C1）

**採用方針:** JS を書き換えて DOM 順を金銀銅に戻すのではなく、**CSS 側でモバイル用 `order` を追加**する。JS 書き換えは JSON-LD ItemList の position と整合性を取る必要があり影響が大きいため、CSS のみの最小変更で済ませる。

`css/pages/ranking.css:143-150` の `.top3` ブロック直後、または `:197-208` に以下を追記:

```css
/* モバイル: DOM 順 (銀・金・銅) を視覚的に 金・銀・銅 に矯正 */
.top3__card--gold   { order: 1; }
.top3__card--silver { order: 2; }
.top3__card--bronze { order: 3; }

@media (min-width: 768px) {
  /* PC: 2,1,3 の視覚配置（銀→金→銅、金が中央） */
  .top3__card--silver  { order: 1; }
  .top3__card--gold    { order: 2; }
  .top3__card--bronze  { order: 3; }
}
```

`.top3` コンテナはすでに `display: grid` なので `order` は機能する。1 列 grid でも grid item の order は有効。

#### Task A2: ランキングリスト 4 カラムの 360px 対応（C3）

`css/pages/ranking.css:308-313` の `.ranking-list__row` に狭小ビューポート用を追加:

```css
@media (max-width: 480px) {
  .ranking-list__row {
    grid-template-columns: 32px 1fr auto;
    gap: var(--space-2);
    padding: var(--space-3);
  }
  .ranking-list__meta { display: none; }  /* 既存の 560px 以下ルールと統合 */
  .ranking-fav-btn--row {
    grid-column: 3;
    grid-row: 1;
  }
  .ranking-list__action { display: none; } /* 「診断」テキストはモバイルで非表示、行全体がリンクなので OK */
}
```

#### Task A3: TOP3 名前フォントを fluid 化（C5）

`css/pages/ranking.css:242-253`:

```css
.top3__name {
  font-family: var(--font-heading);
  font-size: clamp(32px, 7vw, 44px);
  font-weight: var(--weight-black);
  line-height: 1.1;
  margin-bottom: var(--space-2);
  color: var(--color-dark);
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.top3__card--gold .top3__name {
  font-size: clamp(36px, 8vw, 52px);
  color: #bf8c23;
}
```

**検証:** 360px / 375px / 412px でランキングハブ + 2026-boys + 2026-girls の 3 ページをスクショ。

---

### Agent B: 姓名判断 & 共通コンポーネント改善

**責任範囲:** `css/pages/shindan.css`, `css/components.css`（一部）

#### Task B1: 水彩ディバイダーのモバイル表示を復活（C2 — 最重要）

`css/pages/shindan.css:911-919` を以下に置換:

```css
/* モバイル: 診断結果セクションの縦スペースを圧縮しつつディバイダーは維持 */
@media (max-width: 767px) {
  .gokaku-divider {
    margin: calc(-1 * var(--space-2)) 0;  /* margin を強めに負に取って圧縮 */
    opacity: 0.6;
  }
  .gokaku-divider__img {
    max-width: 160px;  /* PC 240px の 2/3 に縮小 */
  }
  .related-items {
    margin-top: var(--space-3);
  }
}

@media (max-width: 479px) {
  .gokaku-divider__img {
    max-width: 140px;  /* さらに狭いビューポートでは 140px */
  }
}
```

既存の `:905-909` の `@media (max-width: 479px) { .gokaku-divider__img { max-width: 180px } }` は削除（上記で代替）。

#### Task B2: share ボタン群のモバイル間隔調整（M7）

`css/pages/shindan.css:733-738`:

```css
.share-section__buttons {
  display: flex;
  justify-content: center;
  gap: var(--space-3);  /* 8px → 12px */
  flex-wrap: wrap;
}

@media (max-width: 479px) {
  .share-section__buttons {
    gap: var(--space-2);  /* 超狭は 8px に戻す */
  }
}
```

#### Task B3: skip-link z-index の a11y 保険（N3）

`css/components.css:31` 付近の `.skip-link` に:

```css
.skip-link {
  /* 既存定義 */
  z-index: 10000;  /* nav-drawer (通常 1000 前後) より確実に前に */
}
```

**検証:** `shindan.html` で適当な姓名を入力して診断実行、375px でディバイダー 4 枚が表示されることを確認。share ボタン 3 個が 375px で 1 行に収まるか確認。

---

### Agent C: その他ページ一括モバイル CSS 改善

**責任範囲:** `css/pages/home.css`, `about.css`, `kanji.css`, `guide.css`, `suggestion.css`

#### Task C1: About 五格グリッドの下限追加（C4）

`css/pages/about.css` の `.gokaku-explain-grid` 関連:

```css
.gokaku-explain-grid {
  display: grid;
  grid-template-columns: 1fr;  /* デフォルトは 1 列 */
  gap: var(--space-4);
}

@media (min-width: 480px) {
  .gokaku-explain-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 768px) {
  .gokaku-explain-grid { grid-template-columns: repeat(5, 1fr); }
}
```

#### Task C2: Hero イラスト重なり解消（M1）

`css/pages/home.css:78-82`:

```css
@media (max-width: 767px) {
  .hero__illustration {
    width: 60%;
    opacity: 0.18;  /* 0.25 → 0.18 でさらに薄く */
    position: absolute;
    right: -10%;
    bottom: -5%;
    z-index: 0;
    pointer-events: none;
  }
  .hero__content {
    position: relative;
    z-index: 1;
  }
}
```

#### Task C3: 漢字グリッドを 360〜479px で 2 列化（M2）

`css/pages/kanji.css:64-69` 付近:

```css
@media (max-width: 479px) {
  .kanji-grid { grid-template-columns: repeat(2, 1fr); }
}
```

既存の `@media (max-width: 359px)` ルールは `479px` と統合して削除。

#### Task C4: Feature Grid の 1 列化（M3）

`css/pages/home.css:233-250`:

```css
@media (max-width: 479px) {
  .feature-grid { grid-template-columns: 1fr; }
}
```

#### Task C5: Promo Card のスマホ padding 調整（M4）

`css/components.css:991-1001`:

```css
@media (max-width: 767px) {
  .promo-card {
    flex-direction: column;
    padding: var(--space-4);
  }
  .promo-card__img { max-width: 100%; }
}
```

#### Task C6: Guide 比較表のスクロールヒント追加（M5）

`css/pages/guide.css:495` 付近の `.compare-table-wrapper` に:

```css
.compare-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

@media (max-width: 767px) {
  .compare-table-wrapper::after {
    content: "→ 横にスクロール";
    display: block;
    text-align: center;
    font-size: var(--text-xs);
    color: var(--color-muted);
    padding: var(--space-2);
    background: var(--color-cream);
  }
}
```

#### Task C7: About example-table の overflow-x（M6）

`css/pages/about.css:210` 付近:

```css
.example-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 479px) {
  .example-table { font-size: var(--text-xs); }
}
```

**HTML 側も修正必要:** `about.html` で `.example-table` を `<div class="example-table-wrapper">` で囲む。

#### Task C8: Footer 2 列化（N2、余裕があれば）

`css/components.css:859-868`:

```css
@media (min-width: 480px) and (max-width: 767px) {
  .footer__links {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2) var(--space-4);
  }
}
```

#### Task C9: Suggestion フォーム padding（N4、余裕があれば）

`css/pages/suggestion.css:93-100`:

```css
@media (max-width: 479px) {
  .suggestion-form {
    padding: var(--space-6) var(--space-4);
    margin-left: var(--space-3);
    margin-right: var(--space-3);
  }
}
```

**検証:** 各該当ページを 360 / 375 / 390 / 412px でスクショ。

---

## Phase 3: 検証（Main、30 分）

### webapp-testing skill による Playwright モバイル検証

対象ビューポート × ページ = **4 × 8 = 32 パターン**:

| デバイス | 幅 | 高さ | 備考 |
|---------|-----|-----|-----|
| 360px Android | 360 | 800 | 最狭ケース（Xperia Compact / 古 Android）|
| iPhone SE / 12 mini | 375 | 667 / 812 | 一般的 iOS 最狭 |
| iPhone 12 Pro | 390 | 844 | iOS 標準 |
| Pixel 7 | 412 | 915 | Android 標準 |

| ページ | URL |
|--------|-----|
| ホーム | `/` |
| 姓名判断（診断前） | `/shindan` |
| 姓名判断（診断後） | `/shindan?sei=山田&mei=花子&soukaku=19` で即座に結果表示 |
| About | `/about` |
| ランキングハブ | `/ranking/` |
| ランキング女子 | `/ranking/2026-girls.html` |
| 漢字辞典ハブ | `/kanji/` |
| ガイドハブ | `/guide/` |

保存先: `test_screenshots/mobile-review-2026-04-25/after/{device}-{page}.png` の 32 枚。

### 確認項目（自動チェック + 目視）

- [ ] 横スクロールが発生していない（`document.documentElement.scrollWidth <= window.innerWidth`）
- [ ] `console.error` が 0 件
- [ ] ランキング TOP3 が金 → 銀 → 銅の順（DOM 順と視覚順を別々に確認）
- [ ] 姓名判断結果に `.gokaku-divider__img` が 4 枚表示（`document.querySelectorAll('.gokaku-divider img').length === 4`）
- [ ] About ページの `.gokaku-explain-grid` が 1〜2 列で表示（5 列崩れなし）
- [ ] 漢字ハブが 2 列グリッドで表示
- [ ] Hero イラストとタイトルが重なっていない

---

## Phase 4: レビューループ（Main、レビュー agent、合計 20〜40 分）

### 4-1. codex-review skill

以下 4 ゲートで厳格判定:

- **Plan**: 本プランの完全性（Context / Done / Critical Files / Verification が揃っているか）
- **Diff**: 3 エージェントの CSS / JS 修正が意図通りか、デグレードなし
- **Runtime**: Playwright 32 枚スクショで Critical/Major の症状が全部解消されているか
- **Release**: コミットメッセージ / 変更ファイル一覧の妥当性

**Critical/Major が 1 件でも残ったら修正して再レビュー**（主様方針）。

### 4-2. universal-review skill

最終の軽量確認。簡素な PASS 判定のみ。

### 4-3. （オプション）ui-design-review skill

余裕があれば a11y / コントラスト / タップ領域を追加チェック。

---

## Phase 5: デプロイ（Main、10 分）

主様の memory 方針（[feedback_git_workflow.md](../../../.claude-team/projects/c--Users-PEM-N-266-work---------/memory/feedback_git_workflow.md)）に従い **master 直 push で自走**:

```bash
git add css/pages/shindan.css css/pages/ranking.css css/pages/home.css \
        css/pages/about.css css/pages/kanji.css css/pages/guide.css \
        css/pages/suggestion.css css/components.css \
        about.html \
        test_screenshots/mobile-review-2026-04-25/ \
        plans/2-nano-banana2-recursive-hammock.md

git commit -m "$(cat <<'EOF'
fix(mobile): スマホ表示の致命的不具合を修正 + モバイル UX 総合改善

Critical:
- ランキング TOP3 がモバイルで「銀→金→銅」の順に並ぶ不具合を修正
  (css/pages/ranking.css で モバイル order を追加)
- 姓名判断結果の水彩ディバイダー 4 枚がスマホで非表示になる不具合を修正
  (shindan.css の display:none を max-width:160px の縮小表示に変更)
- ランキングリスト 4 カラムが 360px で破綻する問題を修正
- About 五格グリッド 5 列が 480px 未満で崩れる問題を修正
- TOP3 名前フォントを clamp() で fluid 化

Major:
- Hero イラストと本文の重なり解消 (home.css)
- 漢字グリッドを 360〜479px で 2 列化 (kanji.css)
- Feature Grid の 1 列化 (home.css)
- Promo Card のモバイル padding 最適化 (components.css)
- Guide 比較表にスクロールヒント追加 (guide.css)
- About example-table の overflow-x 対応 (about.css)
- 診断結果 share ボタン gap 調整 (shindan.css)

Minor:
- Footer を 480〜767px で 2 列化
- Suggestion フォームのスマホ margin 調整
- skip-link z-index 補強 (a11y 保険)

Verification: Playwright で 360/375/390/412px × 8 ページ = 32 枚スクショ取得、
横スクロール 0 件を確認 (test_screenshots/mobile-review-2026-04-25/)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git push origin master
```

Vercel が自動デプロイ（約 1〜2 分）。主様は数分後に本番スマホで再確認。

---

## Critical Files（修正対象）

### 最重要（Critical 修正）

- [css/pages/ranking.css:197-208](css/pages/ranking.css#L197-L208), [css/pages/ranking.css:308-313](css/pages/ranking.css#L308-L313), [css/pages/ranking.css:242-253](css/pages/ranking.css#L242-L253) — ランキング順序、リストグリッド、名前フォント
- [css/pages/shindan.css:911-919](css/pages/shindan.css#L911-L919), [css/pages/shindan.css:733-738](css/pages/shindan.css#L733-L738) — ディバイダー表示復活、share ボタン間隔
- [css/pages/about.css](css/pages/about.css) — 五格グリッド下限追加

### Major 修正

- [css/pages/home.css:78-82](css/pages/home.css#L78-L82), [css/pages/home.css:233-250](css/pages/home.css#L233-L250) — Hero、Feature Grid
- [css/pages/kanji.css:64-69](css/pages/kanji.css#L64-L69) — 漢字グリッド
- [css/pages/guide.css:495](css/pages/guide.css#L495) — 比較表スクロールヒント
- [css/pages/about.css:165](css/pages/about.css#L165), [css/pages/about.css:210](css/pages/about.css#L210) — example-table
- [css/components.css:991-1001](css/components.css#L991-L1001), [css/components.css:859-868](css/components.css#L859-L868) — Promo、Footer
- [about.html](about.html) — example-table を wrapper で囲む

### Minor / 補助

- [css/components.css:31](css/components.css#L31), [css/components.css:747-797](css/components.css#L747-L797) — skip-link、nav-drawer
- [css/pages/suggestion.css:93-100](css/pages/suggestion.css#L93-L100) — フォーム padding

### 参照・流用（修正しない）

- [ui-controller.js:151-164](js/ui-controller.js#L151-L164) — ディバイダー挿入ロジック（既存のまま活かす）
- [assets/images/divider-sakura.png](assets/images/divider-sakura.png), [divider-leaves.png](assets/images/divider-leaves.png), [divider-clouds.png](assets/images/divider-clouds.png) — Nano Banana2 水彩画像（既存流用）
- [test_screenshots/](test_screenshots/) — Baseline スクショ置き場

---

## Verification（検証の総仕上げ）

### 必須通過項目

1. **Playwright スクショ 32 枚**で崩れゼロを目視確認
2. **本番サイト（https://namae-studio.com/）** を主様がスマホで開き、以下を確認:
   - [ ] `/ranking/2026-girls.html` で 1 位が中央または左端（モバイル時は左端 = 1 位）
   - [ ] `/shindan` で姓名入力 → 診断 → 結果画面に **4 枚の水彩画像が五格カード間に表示される**
   - [ ] `/about` の五格グリッドが崩れなく表示
   - [ ] 全ページで横スクロール発生なし
3. **Chrome Lighthouse モバイル** Performance 70+ / Accessibility 90+

### 推奨追加チェック

4. iPhone Safari と Android Chrome の両方でテスト（主様実機）
5. Core Web Vitals（LCP / CLS / INP）が悪化していないか PageSpeed Insights で確認
6. Search Console のモバイルユーザビリティレポートを数日後に確認

---

## 実行ログ

（各 Phase 完了時に追記）

### Phase 1（準備）

- [ ] ...

### Phase 2（並列実装）

- [ ] Agent A: ranking 系修正完了
- [ ] Agent B: shindan + components 修正完了
- [ ] Agent C: 他ページ一括修正完了

### Phase 3（検証）

- [ ] Playwright 32 枚スクショ取得
- [ ] 横スクロール / console.error チェック通過

### Phase 4（レビュー）

- [ ] codex-review Pass
- [ ] universal-review Pass

### Phase 5（デプロイ）

- [ ] git commit + push origin master
- [ ] Vercel デプロイ成功
- [ ] 本番スマホでの主様目視確認完了

---

## 本プランで扱わない事項（次プラン候補）

- **Nano Banana2 で新規画像追加**: 五格ごとの吉凶イラスト 5 種を生成して更に豪華にする案
- **BYOK AI 画像生成**: [CLAUDE.md](CLAUDE.md) Phase 2 Tier B の Gemini API リアルタイム画像生成
- **モバイルパフォーマンス最適化**: WebP 化、lazy loading 拡充、Critical CSS 抽出
- **GA4 導入**: [CLAUDE.md § GA4 導入メモ](CLAUDE.md) の該当項目
- **column.namae-studio.com 側のモバイル改善**: 本体サイトとは別プランで
