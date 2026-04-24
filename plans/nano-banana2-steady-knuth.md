# ガイドページ 3 本新設 + アニメーション強化 + a11y 底上げ

## Context

[guide/index.html:108-126](guide/index.html#L108-L126) に「近日公開」の空カードが 3 枚残っており、
ハブとしての完結感が弱い。加えて:

- スクロール連動アニメーションが未導入で、和モダンの世界観に対して動きが平板
- `skip-link` / `aria-live` / `:focus-visible` のコンポーネント統一 / コントラストトークンが未整備
- Nano Banana 2 生成画像（`guide-tile-shussan.png` / `guide-tile-miyamairi.png`）は既に用意済みで
  ガイド 3 本実装のビジュアル資産も揃っている

動画生成は採用しない（CSS keyframes + IntersectionObserver + SVG で十二分、
`prefers-reduced-motion` 制御・容量・LCP 観点でも優位）。
コラム側 (column.namae-studio.com / AFFINGER4) の stitch2 リニューアルは別プラン。

**目的**: ガイドハブを完結させ、全ページを通じて動きとアクセシビリティを和モダンの仕上がりに引き上げる。

**ワークフロー方針**: 本体 Phase 2 と同様に **stitch2 でデザインを先に生成 → `stitch2-raw/` に貼付 → 既存デザインシステム (CSS 変数 / `guide-hub__tile` / `guide-product-grid` / `.pr-notice` 等) に整合させて実装** の三段階で進める。stitch2 出力は "デザイン方向性のソース" で、最終 HTML/CSS は手作業でプロジェクト規約 (BEM / 和モダン × ぬくもり) に落とし込む。

---

## Phase 0 — stitch2 でデザイン生成

### 0-a. stitch2 プロンプト準備

3 ページ分のプロンプトを作成。共通コンテキスト:

- **ブランド**: 「赤ちゃん名前診断」/ 和モダン × ぬくもり
- **カラー**: cream (#FFF8F0) / terracotta (#E8725C) / sage (#6EC4A8) / gold (#F0B84D)
- **フォント**: Zen Maru Gothic (見出し) / Noto Sans JP (本文)
- **禁止**: Inter, Roboto, Arial, system-ui / 冷たいミニマル / 青主体
- **参照**: 既存 [guide/meimei-tools.html](guide/meimei-tools.html) / [guide/faq.html](guide/faq.html) の雰囲気
- **モバイルファースト**、空間の非対称性 / 紙・和紙質感 / 水彩アクセント

ページ別プロンプト骨子:

1. **出産準備リスト完全版**: 8 つのチェックリスト section + 控えめな記念品カード 2〜3 点 + 印刷 CTA
2. **命名書サービス徹底比較 2026**: PR 注記 → 4 軸説明 → タイプ別カード → 比較表 → 口コミ → FAQ → 編集部まとめ。**「◎おすすめ」バッジ禁止 / アフィリ導線は記事末 CTA 1 箇所のみ / 情報中立性優先**
3. **お宮参り・お七夜の完全ガイド**: 新生児儀礼カレンダー → 各行事詳細 → 記念品 → FAQ

### 0-a-1. stitch2 プロンプト本文（ページ単位・ASCII 構造図付き）

**使い方**: 以下の 3 本のコードブロックを **順番に個別で** stitch2 に投入する。1 本 = 1 画面。3 画面一括プロンプトは attention 分散でセクション欠落が起きやすいため採用せず、ページ単位に分けて精度を確保する方式。

**投入順**: ① 命名書比較 → ② お宮参り → ③ 出産準備(微調整のみ)

以下 3 本の個別プロンプト（shussan-list はすでに概ね良好なので今回は 2 本だけ集中）:

#### ① 命名書比較（meimei-hikaku）

```text
You are rendering ONE complete editorial magazine article page. Output MUST
contain every section listed below. Missing any section = failed output.

PAGE STRUCTURE (ALL sections REQUIRED — render top to bottom):

  ┌──────────────────────────────────────────────────────┐
  │ TOP NAV: 🌸 赤ちゃん名前診断                          │
  │  (nav links only, NO search/bell/person icons right)  │
  ├──────────────────────────────────────────────────────┤
  │ §0 PR NOTICE BAND (full-viewport-width, 3+ lines)     │
  ├──────────────────────────────────────────────────────┤
  │ BREADCRUMB: ホーム / ガイド / 命名書サービス徹底比較  │
  ├──────────────────────────────────────────────────────┤
  │ HERO                                                  │
  │  H1 + 2-line copy + watercolor illustration (NO people│
  │  NO 3D shapes, NO pyramid, NO anime, NO cars)         │
  ├──────────────────────────────────────────────────────┤
  │ §1 「選び方の4軸」                                    │
  │     4 circular seal cards: 価格 / 納期 / 書体 / 額装  │
  ├──────────────────────────────────────────────────────┤
  │ §2 「タイプ別おすすめ」                               │
  │     3 editorial cards: 書家直筆 / デザイン / アプリ   │
  │     Each card illustration = watercolor ONLY          │
  │     (NO red wallet, NO car, NO abstract blob)         │
  ├──────────────────────────────────────────────────────┤
  │ §3 「サービス比較表」 ← MUST EXIST                    │
  │     HTML <table> with these exact columns:            │
  │       サービス名 / タイプ / 価格帯 / 納期 /           │
  │       書体数 / 額装 / 特徴メモ                        │
  │     Rows: 5 (サンプルA〜E). Not empty. Has real data.  │
  ├──────────────────────────────────────────────────────┤
  │ §4 「口コミと注意点」 ← MUST EXIST                    │
  │     LEFT: 3 quote cards with watercolor avatar        │
  │     RIGHT: gold-tinted 注意点 box, 3 bullets          │
  ├──────────────────────────────────────────────────────┤
  │ §5 「よくある質問」 ← MUST EXIST                      │
  │     <details>/<summary> accordion, 6 items            │
  ├──────────────────────────────────────────────────────┤
  │ §6 「編集部まとめ」 ← MUST EXIST                      │
  │     Long paragraph + italic 読者さまへ note           │
  ├──────────────────────────────────────────────────────┤
  │ FINAL CTA block (single outlined pill + text link)    │
  ├──────────────────────────────────────────────────────┤
  │ FOOTER: 🌸 赤ちゃん名前診断 + standard footer links   │
  └──────────────────────────────────────────────────────┘

Before finalizing, scroll from top to bottom and confirm: §1, §2, §3, §4,
§5, §6 ALL exist with meaningful content. Do NOT collapse any section
into a Table of Contents placeholder — render the ACTUAL content for each.

HERO IMAGE (critical — prior iterations placed a 3D pyramid, a comic hero,
a wood-desk photo):
  Watercolor still-life painting. Subject = one Japanese calligraphy brush
  laying diagonally on a half-unrolled cream washi scroll, next to a small
  round inkstone with a drop of sumi. Soft cream #FFF8F0 background.
  A few cherry-blossom petals scattered. NO people. NO 3D geometric shapes.
  NO pyramids. NO manga characters. NO cars. NO photograph.

§1 SEAL CARDS image spec:
  4 circular watercolor seals, each with a simple sumi-ink brush pictogram:
    - 価格 (terracotta tint, coin-purse brush icon)
    - 納期 (sage tint, hourglass brush icon)
    - 書体 (gold tint, calligraphy brush icon)
    - 額装 (lavender tint, picture-frame brush icon)

§2 TYPE CARDS image spec:
  - 書家直筆型 card: watercolor of a forearm with a brush painting on washi
  - デザイン命名紙型 card: watercolor of a folded washi card with modern
    cherry-blossom geometric pattern
  - アプリ連携型 card: watercolor of a stylized smartphone showing a
    calligraphy preview
  EXPLICITLY FORBIDDEN in these card illustrations: red wallet, toy car,
  abstract blob, any 3D render, any stock photograph, any anime figure.

§3 TABLE content (use these placeholder rows literally):
  | サービス名  | タイプ       | 価格帯   | 納期  | 書体数 | 額装 | 特徴メモ        |
  | サンプルA   | 書家直筆型   | 8,000〜  | 7日   | 6     | 有   | 伝統的な力強い筆致 |
  | サンプルB   | デザイン命名紙 | 5,500〜 | 3日   | 4     | 無   | モダンで洋室に合う |
  | サンプルC   | アプリ連携型 | 2,980〜  | 即日  | 10    | 無   | スマホで手軽に作成 |
  | サンプルD   | 書家直筆型   | 12,000〜 | 10日  | 8     | 有   | 格式高い木製額装付 |
  | サンプルE   | デザイン命名紙 | 6,800〜 | 5日   | 5     | 有   | 水彩風イラスト入り |

§4 QUOTE CARDS content (use these literally):
  Aさま (3歳ママ): 「シンプルで洋室に馴染むものを探していて、デザイン型
                    にしました。家族写真と一緒に飾れて満足です。」
  Bさま (0歳ママ): 「お宮参りまで時間がなく、アプリ連携型に。即日データ
                    ダウンロードできて、額装は街のお店で手配しました。」
  Cさま (5歳児ママ): 「一生モノなので書家直筆型で奮発。実物を見たとき、
                     ほんとに感動しました。」
  注意点 box (gold tint): 納期に余裕を / 書体サンプル必ず確認 / 返品不可あり

§5 FAQ 6 items (render each with actual answer paragraphs, not empty):
  Q1 いつ注文すべき？ / Q2 名前の表記揺れ対応は？ / Q3 額装は自分で可能？
  Q4 返品保証は？ / Q5 複数サービス併用は可能？ / Q6 お食い初め用も同じ？

§6 編集部まとめ: one meaningful paragraph of ~4 sentences about balancing
   tradition and lifestyle, ending with an italicized 読者さまへ line.

TOP NAV (EXACTLY these links, nothing else on the right):
  ホーム / 姓名判断 / 名前候補 / ランキング / 漢字辞典 / ガイド / 五格 /
  お気に入り / コラム
  RIGHT SIDE = EMPTY. No 🔔 icon, no 👤 icon, no 🔍 icon, no "無料診断" button.
  Active = ガイド with terracotta underline.

CTA POLICY: exactly ONE CTA on the page, at the very bottom. NO CTA in hero.

DELIVER: one static HTML file + scoped <style>. BEM. Mobile-first. No
Tailwind. No React. Semantic HTML5.

── BRAND REFERENCE (use for colors/fonts only, do not replace page content) ──
Colors: cream #FFF8F0 / terracotta #E8725C / sage #6EC4A8 / gold #F0B84D /
        text #3D3029 / muted-AA #6B5D52 / border #E8DDD0
Fonts:  Heading = Zen Maru Gothic 500-900 / Body = Noto Sans JP 300-500
        FORBIDDEN: Inter, Roboto, Arial, system-ui
Canonical brand name: 赤ちゃん名前診断 (never BabyPrep Guide / Name Studio /
        名前診断スタジオ / 命名の社 / 結び名前).
```

#### ② お宮参り・お七夜（miyamairi）

```text
You are rendering ONE complete editorial guide article page. Output MUST
render every section below with ACTUAL content, not placeholders or a TOC.

CRITICAL: Do NOT render this page as a "table-of-contents landing page with
a giant CTA button and empty sections". The prior iteration did exactly
that. Every section §1..§7 MUST contain real inline content visible on
first scroll.

PAGE STRUCTURE (ALL required, render top to bottom):

  ┌──────────────────────────────────────────────────────┐
  │ TOP NAV (nav-only, no right-side icons)               │
  ├──────────────────────────────────────────────────────┤
  │ BREADCRUMB: ホーム / ガイド / お宮参り・お七夜の完全ガイド │
  ├──────────────────────────────────────────────────────┤
  │ HERO (H1 + 2-line sub-copy + watercolor torii+crane)  │
  │  NO CTA button in the hero area. None. Zero.          │
  ├──────────────────────────────────────────────────────┤
  │ §1 「新生児儀礼カレンダー」                           │
  │  Horizontal timeline desktop, vertical mobile.        │
  │  EXACTLY 5 milestones (NO extra "ご誕生" node):       │
  │   [生後7日 お七夜]─[生後30-33日 お宮参り]─            │
  │   [生後100日 お食い初め]─[初節句]─[満1歳 初誕生]      │
  │  Thread between markers = sumi-ink brush SVG.         │
  ├──────────────────────────────────────────────────────┤
  │ §2 お七夜(命名式)   — FULL CONTENT (not empty)        │
  │ §3 お宮参り         — FULL CONTENT                    │
  │ §4 お食い初め       — FULL CONTENT                    │
  │ §5 初節句・初誕生   — FULL CONTENT                    │
  │   On desktop: 2-column grid pairing (§2,§3) (§4,§5).  │
  │   Each card has:                                      │
  │     • H2 + small seal icon + day-marker chip          │
  │     • 3 mini-panels: 時期 / 伝統的な意味 / 現代のアレンジ│
  │     • 準備チェック list (5-8 items, actual text)      │
  │     • 1 watercolor illustration (NOT photo)           │
  │     • 読み物 callout box (gold-tint left border)      │
  ├──────────────────────────────────────────────────────┤
  │ §6 記念品・撮影                                       │
  │   3-card product grid, watercolor only.               │
  ├──────────────────────────────────────────────────────┤
  │ §7 よくある質問                                       │
  │   <details>/<summary> × 6 (with real answers).        │
  ├──────────────────────────────────────────────────────┤
  │ FINAL CTA (single pill) + FOOTER                      │
  └──────────────────────────────────────────────────────┘

Section content seeds (use these literally so output is not empty):

§2 お七夜(命名式)
  時期: 生後7日目の夜
  伝統的な意味: 赤ちゃんが無事に1週間を迎えたことを祝い、名前を披露する儀式
  現代のアレンジ: 退院直後で体力が戻らないため、家族だけでケーキを囲む簡素版が主流
  準備チェック: 命名書 / 筆ペンまたは毛筆 / 祝い膳またはケーキ / 手形足形キット /
              記念撮影の衣装 / 家族へのお知らせハガキ
  読み物: 「命名書は印刷サービスでも構いません。無理せず記念に残る方法を選びましょう。」

§3 お宮参り
  時期: 生後30-33日頃 (地域により異なる)
  伝統的な意味: 氏神様に赤ちゃんの誕生を報告し、健やかな成長を祈願する
  現代のアレンジ: 気候や赤ちゃんの体調を最優先に日程調整。写真館での記念撮影を兼ねるご家庭も多数
  準備チェック: 祝着(のしめ)またはベビードレス / 神社の初穂料(5,000〜10,000円) /
              両家祖父母との日程調整 / 記念撮影 / 会食の手配
  読み物: 「祝着は購入よりレンタルで十分。フォトスタジオ付きプランが便利です。」

§4 お食い初め
  時期: 生後100日頃 (100日〜120日)
  伝統的な意味: 一生食べ物に困らないように祈る「歯固め」の儀式
  現代のアレンジ: 祝い膳セットの通販が主流。家族3世代で囲むご家庭が多い
  準備チェック: 祝い膳セット(尾頭付き鯛・赤飯・お吸い物・煮物・香の物) / 歯固め石 /
              記念撮影 / 養い親役の決定
  読み物: 「食べる真似だけで十分。赤ちゃんの機嫌を優先しましょう。」

§5 初節句・初誕生
  時期: 初節句=男児5月5日/女児3月3日、初誕生=満1歳
  伝統的な意味: 健やかな成長の節目を祝う
  現代のアレンジ: 雛人形・五月人形はコンパクトサイズも人気。初誕生は一升餅+選び取り
  準備チェック: 人形の準備(祖父母との相談) / 初節句の会食 / 一升餅 /
              選び取りの品々 / 記念撮影
  読み物: 「人形は飾る場所を先に決めてからサイズを選ぶと失敗しません。」

§6 記念品・撮影 (3 cards, watercolor):
  お祝い命名書 / 手形足形キット / 初着(お宮参り衣装)レンタル

§7 FAQ (6 items, with real answer paragraphs):
  Q1 地域による作法の違いにはどう対応する？
  Q2 祖父母との日程調整のコツは？
  Q3 天候不良で延期するときの目安は？
  Q4 赤ちゃんの体調を最優先する判断基準は？
  Q5 食べさせ役(養い親)は誰に頼むべき？
  Q6 記念撮影はいつが最適？

HERO IMAGE: Keep the vermilion watercolor torii + origami crane from the
prior iteration — that worked beautifully. Asymmetric left on desktop.

TIMELINE ICONS (sumi-ink watercolor pictograms):
  お七夜    → tiny brush writing "名" on washi
  お宮参り  → miniature torii outline
  お食い初め → small lacquer bowl with chopsticks
  初節句   → koinobori streamer
  初誕生   → single candle on round cake

CTA POLICY: Exactly ONE CTA pill at the very bottom of the article, preceded
by lead line "お子さまの名前をもっと深く知りたい方へ". NO CTA anywhere else.
Absolutely NO CTA in or near the hero.

TOP NAV: same rules as meimei-hikaku page — right side EMPTY, no icons.

DELIVER: one static HTML file + scoped <style>. BEM. Mobile-first.
Semantic HTML5.

── BRAND REFERENCE ──
(identical to meimei-hikaku appendix — keep consistent)
```

#### ③ 出産準備リスト（shussan-list）— 微調整のみ

前回出力でほぼ合格。残る調整は (a) nav 右側アイコン除去 (b) ヒーローを木目机写真から watercolor に置換 (c) セクション名 §2 を「退院〜新生児期の肌着・ウェア」へ統一。上記 3 点のみの小修正プロンプト。**前回の出産準備デザインを開いた状態で投げる** こと:

```text
Regenerate ONLY these three corrections on the shussan-list page. Keep
everything else exactly as the current version. Do NOT restructure sections.

(1) TOP NAV right side: remove the bell icon 🔔, remove the person icon 👤,
    remove the search icon 🔍 if present. The right side must be completely
    empty. Only the nav text links remain.

(2) HERO image: replace the current wood-desk photograph with a
    WATERCOLOR PAINTING. Subject: soft knitted pastel-pink baby booties
    resting on a folded cream washi card, with two or three pressed cherry-
    blossom petals nearby. Cream background, no wood grain, no photographic
    realism. The whole image must read as a painting, not a photo.

(3) Section 2 heading: change from "退院〜新生児期の肌着" to the full
    "退院〜新生児期の肌着・ウェア" (add "・ウェア").

All other content, layout, illustrations (§1..§8, product grid, footer)
stays as-is. Do NOT change the comment cards, do NOT change the timeline,
do NOT remove sections.
```

### 0-a-1-v2. 追加差分プロンプト（部分修正）

2025 回目の出力で ② お宮参りは合格ライン到達。残る修正は ① 命名書比較の部分追加と ③ 出産準備の完全再生成の 2 本。

#### ①-追 命名書比較 — §4 口コミ・§5 FAQ・末尾 CTA の 3 箇所を追加

現在の出力に対する **差分追加プロンプト**。既存 §1–§3・§6 はそのまま保持。

```text
Keep the current meimei-hikaku page exactly as-is. Do NOT touch §1 4軸,
§2 タイプ別, §3 比較表, §6 編集部まとめ, hero, or footer.

Only ADD these three missing blocks, in this exact order, BETWEEN §3
比較表 and §6 編集部まとめ, AND replace the current bottom CTA:

═════════════════════════════════════════════════════════
ADD §4 「口コミと注意点」 (place AFTER the §3 comparison table)
═════════════════════════════════════════════════════════

Two-column layout on desktop (60% / 40%), stacked on mobile.

LEFT column — 3 stacked quote cards on washi-paper background. Each card:
  - Small circular WATERCOLOR avatar (never photo — abstract mom-and-baby
    silhouette or simple closed-eye smile face). Pastel palette.
  - Attribution line in small muted text
  - Quote body in body-size italic
  Use these three quotes literally:

  Aさま (3歳ママ):
    「シンプルで洋室に馴染むものを探していて、デザイン型にしました。
    家族写真と一緒に飾れて満足です。」

  Bさま (0歳ママ):
    「お宮参りまで時間がなく、アプリ連携型に。即日データダウンロードで
    きて、額装は街のお店で手配しました。」

  Cさま (5歳児ママ):
    「一生モノなので書家直筆型で奮発。実物を見たとき、ほんとに感動しま
    した。」

RIGHT column — a gold-tinted (#FFF0D0 bg, #F0B84D left border 3px) warning
box with H3「注意点」and exactly these 3 bullets:
  - 納期に余裕をもってご注文を
  - 書体サンプルは必ず事前確認
  - 返品不可のサービスが多い点にご注意を

═════════════════════════════════════════════════════════
ADD §5 「よくある質問」 (place AFTER the new §4 and BEFORE §6 編集部まとめ)
═════════════════════════════════════════════════════════

Native <details>/<summary> accordion with 6 items. Closed state = flat
cream bg. Open state = soft terracotta 3px left border + cream-warm bg.
Chevron rotates 90deg in 200ms on open.

Use these exact Q/A pairs (each A is a real 2-3 sentence paragraph, NOT
placeholder text):

Q1 いつ頃注文するのがおすすめ？
A1 書家直筆型なら出産予定日の2週間前までに、アプリ連携型なら出産後でも
   間に合います。お宮参り(生後1ヶ月頃)までに手元にあると安心です。

Q2 名前の表記(漢字/ひらがな)で揺れがある場合は？
A2 多くのサービスでは注文時に表記を指定できます。戸籍と異なる愛称表記
   での作成も可能ですが、公的場面での使用は戸籍表記を推奨します。

Q3 額装は自分で用意しても大丈夫？
A3 額装なしの命名書単体プランも各社で提供されています。市販のA4/B4額に
   収まるサイズを選ぶと、街の額装店で仕上げが可能です。

Q4 返品・交換はできる？
A4 オーダーメイド品のため基本的に返品不可です。ただし誤字脱字などサー
   ビス側の不備については無償再作成に応じるところが多数です。

Q5 複数のサービスを併用するのはあり？
A5 問題ありません。書家直筆をリビングに、デザイン型を子ども部屋にな
   ど、使い分けるご家庭もあります。予算と飾る場所を基準にご検討を。

Q6 お食い初めや七五三でも使える？
A6 命名書は恒久的な記念品です。お食い初めや七五三、入学祝いの記念写真
   の背景としても活躍します。保管用の筒型ケースもご検討ください。

═════════════════════════════════════════════════════════
REPLACE the current bottom CTA ("トップページへ戻る") with this exact
two-part CTA block:
═════════════════════════════════════════════════════════

Remove the "トップページへ戻る" pill button entirely.

Replace with this structure:
  1. An OUTLINED terracotta pill button with text "比較表をもう一度見る",
     which anchor-jumps back to §3 サービス比較表 (href="#compare-table").
  2. Below it, a small secondary text link (not a button):
     "命名書選びで迷ったら、まずは姓名判断から →"
     Link target: /shindan
     Style: terracotta color, underline on hover, body text size.

Leave everything else on the page untouched.
```

#### ③-v2 出産準備 — 完全再生成（ブランド drift と §2–§8 欠落のため）

前回の微調整プロンプトで stitch2 が破壊的再生成を行い、ブランド名が「結び名」に化け、§2–§8 が消失した。差分アプローチを放棄して ① と同じ full-structure プロンプトでゼロから作り直す。

```text
You are rendering ONE complete editorial guide article page. Output MUST
contain every section listed below with ACTUAL content. Do NOT collapse
sections into placeholders. Do NOT drift the brand name.

BRAND (canonical, never substitute):
  赤ちゃん名前診断
  🌸 terracotta cherry-blossom seal + "赤ちゃん名前診断" in Zen Maru Gothic 700
  Tagline: 大切なお子さまに最高の名前を
  FORBIDDEN alternates (do not use ANY of these): 結び名前 / 結び名 /
  BabyPrep Guide / Name Studio / 名前診断スタジオ / 命名の社

PAGE STRUCTURE (ALL sections REQUIRED — render top to bottom):

  ┌──────────────────────────────────────────────────────┐
  │ TOP NAV: 🌸 赤ちゃん名前診断                          │
  │  (nav links only, NO right-side icons)                │
  │  Links: ホーム / 姓名判断 / 名前候補 / ランキング /    │
  │         漢字辞典 / ガイド(active) / 五格 /             │
  │         お気に入り / コラム                            │
  ├──────────────────────────────────────────────────────┤
  │ BREADCRUMB: ホーム / ガイド / 出産準備リスト完全版 2026│
  ├──────────────────────────────────────────────────────┤
  │ HERO                                                  │
  │  H1 "出産準備リスト完全版 2026"                       │
  │  2-line caring-older-sister sub-copy                  │
  │  Hero illustration: WATERCOLOR pastel-pink knitted    │
  │    baby booties on folded cream washi card, a few     │
  │    cherry-blossom petals. NO photograph. NO wood desk.│
  │  Quick-jump chips (3): 陣痛バッグ / 新生児期 / 回復期ケア│
  ├──────────────────────────────────────────────────────┤
  │ §1–§8 SECTION CARDS (ALL 8 REQUIRED, not just 1)      │
  │   2-column grid desktop: (§1,§2)(§3,§4)(§5,§6)(§7,§8) │
  │   Single column mobile.                               │
  │   Each card:                                          │
  │    • Small sumi-ink seal 其ノ一..其ノ八 top-left       │
  │    • H2 Zen Maru Gothic                               │
  │    • 1-line lead in #6B5D52                           │
  │    • <ul class="checklist"> 8-12 items                │
  │    • Circle checkbox: outlined 2px → filled terracotta│
  │      on check, 200ms pop (reduced-motion safe)        │
  ├──────────────────────────────────────────────────────┤
  │ PRODUCT GRID (BETWEEN §4 and §5)                      │
  │   3 watercolor cards: 和紙の命名書 / 赤ちゃん筆 /     │
  │                       手形足形キット                  │
  │   NO photograph, NO badges, NO price.                 │
  ├──────────────────────────────────────────────────────┤
  │ ARTICLE FOOTER                                        │
  │   "チェックリストを印刷" sage pill +                  │
  │   "ブックマーク推奨" note +                           │
  │   related-guides row (2 cards)                        │
  ├──────────────────────────────────────────────────────┤
  │ FINAL CTA: single terracotta pill                     │
  │   "無料で名前を診断する" → /shindan                   │
  ├──────────────────────────────────────────────────────┤
  │ FOOTER: 🌸 赤ちゃん名前診断 + standard links           │
  │   © 2026 赤ちゃん名前診断 — 伝統と新しい命を繋ぐ       │
  └──────────────────────────────────────────────────────┘

SECTION CONTENT SEEDS (use literally, do NOT leave empty):

§1 入院バッグ必需品
  Lead: 陣痛から入院中まで、慌てずに済む必需品を厳選
  Items: 母子手帳・健康保険証・診察券 / 産褥ショーツ(3〜4枚) /
         授乳用ブラジャー(3〜4枚) / 前開きパジャマ(2〜3着) /
         ペットボトル用ストローキャップ / 産褥パッド L・M /
         骨盤ベルト / ガーゼハンカチ(5〜6枚) / スマホ充電器(長め) /
         軽食・飲み物

§2 退院〜新生児期の肌着・ウェア
  Lead: 赤ちゃんの繊細なお肌に、上品な素材を
  Items: 短肌着(5〜6枚) / コンビ肌着(5〜6枚) /
         ツーウェイオール(2〜3枚) / おくるみ / ガーゼケット /
         ミトン / 帽子 / 靴下

§3 授乳・ミルク用品
  Lead: 母乳・混合・ミルク育児、どのスタイルでも対応できる基本セット
  Items: 哺乳瓶(大小1〜2本ずつ) / 粉ミルク・液体ミルク /
         授乳クッション / 哺乳瓶ブラシ・消毒セット /
         母乳パッド / 搾乳機 / ミルクウォーマー

§4 おむつ・沐浴セット
  Lead: 初めての1ヶ月を乗り切る必需品
  Items: 紙おむつ(新生児用) / おしりふき(たっぷり) /
         ベビーバス・沐浴剤・ベビーソープ / 保湿ローション・クリーム /
         バスタオル・ガーゼタオル / 爪切りハサミ / 体温計 /
         おむつ替えシート

§5 ねんね環境(ベビー布団・ベッド)
  Lead: 安全なねんねスペースで安心の睡眠を
  Items: ベビーベッド・布団セット / 防水シーツ・キルトパッド /
         スリーパー / 温湿度計 / 加湿器 / 室温計 /
         メリー(モビール) / ベッドガード

§6 お出かけグッズ
  Lead: 退院時から日常まで、外出に欠かせないアイテム
  Items: チャイルドシート(退院時に必須) / 抱っこ紐 /
         マザーズバッグ / ベビーカー / おむつポーチ /
         授乳ケープ / 日除けシェード / 虫除けグッズ

§7 ママの回復期ケア
  Lead: 産後ママの体を優しくいたわるアイテム
  Items: 骨盤ベルト / 骨盤矯正ガードル / 円座クッション /
         乳頭保護クリーム / リラックスウェア(前開き) /
         悪露用ショーツ / 温湿布 / 産後サプリ

§8 先輩ママからのひとこと (render as 3 QUOTE CARDS on washi bg, NOT a
checklist):
  カード1 「あれもこれもと焦らなくて大丈夫。最低限必要なものだけ揃えて、
          あとは産後にネットで調達するのが正解でした！」 — 1歳男児のママ
  カード2 「ベビー用品は季節で変わるので、冬生まれ夏生まれで差が出ます。
          季節に合わせた肌着選びを優先して。」 — 2歳女児のママ
  カード3 「高い買い物は退院後に実物を見てから。レンタルやお下がりで済む
          ものも多いです。」 — 0歳男児のママ

PRODUCT GRID content (3 cards, all WATERCOLOR):
  Card 1 和紙の命名書 — 職人手漉きの和紙を使用した記念の一枚
  Card 2 赤ちゃん筆(胎毛筆) — 初めての髪で作る、一生の宝物
  Card 3 手形足形キット — ちいさな成長の記録を形に

TOP NAV (EXACTLY these 9 text links, nothing else on the right):
  ホーム / 姓名判断 / 名前候補 / ランキング / 漢字辞典 / ガイド /
  五格 / お気に入り / コラム
  RIGHT SIDE = EMPTY. No 🔔 🔍 👤 icons, no "無料診断" button.
  Active = ガイド with terracotta underline.

CTA POLICY: exactly ONE terracotta pill at the very bottom. NO CTA in hero.

DELIVER: one static HTML file + scoped <style>. BEM. Mobile-first. No
Tailwind. No React. Semantic HTML5.

── BRAND REFERENCE ──
Colors: cream #FFF8F0 / terracotta #E8725C / sage #6EC4A8 / gold #F0B84D /
        text #3D3029 / muted-AA #6B5D52 / border #E8DDD0
Fonts:  Heading = Zen Maru Gothic 500-900 / Body = Noto Sans JP 300-500
        FORBIDDEN: Inter, Roboto, Arial, system-ui
```

### 0-a-1-v3. 出産準備 §3–§8 追加プロンプト

stitch2 は §1 §2 まで描画して停止するパターンが 2 回連続。grid 指示を理解できず「2 セクションで 1 行完結」と解釈している疑い。対策として **残り 6 セクションを既存 §2 の直後に append せよ** と明示する差分プロンプト:

```text
Keep the current shussan-list page exactly as-is. Do NOT touch:
- top nav / breadcrumb / hero / quick-jump chips
- §1 入院バッグ必需品 card
- §2 退院〜新生児期の肌着・ウェア card
- footer / CTA

The page currently STOPS after §2. You must APPEND six more section cards
immediately below §2, continuing the 2-column grid layout on desktop
(single column on mobile). DO NOT regenerate §1 or §2.

EXACTLY SIX MORE CARDS TO APPEND (in this order):

  Row 2 desktop: (§3, §4)
  Row 3 desktop: (§5, §6)
  Row 4 desktop: (§7, §8)

All six cards use the SAME visual style as existing §1/§2: washi-paper
card, small sumi-ink seal top-left (其ノ三..其ノ八), H2 Zen Maru Gothic,
1-line lead in muted color, circle checkboxes.

═════ §3 授乳・ミルク用品 (seal: 其ノ三) ═════
Lead: 母乳・混合・ミルク育児、どのスタイルでも対応できる基本セット
Checklist:
  - 哺乳瓶(大小1〜2本ずつ)
  - 粉ミルク・液体ミルク
  - 授乳クッション
  - 哺乳瓶ブラシ・消毒セット
  - 母乳パッド
  - 搾乳機(手動または電動)
  - ミルクウォーマー

═════ §4 おむつ・沐浴セット (seal: 其ノ四) ═════
Lead: 初めての1ヶ月を乗り切る必需品
Checklist:
  - 紙おむつ(新生児用)
  - おしりふき(たっぷり)
  - ベビーバス・沐浴剤
  - ベビーソープ
  - 保湿ローション・クリーム
  - バスタオル・ガーゼタオル
  - 爪切りハサミ
  - 体温計
  - おむつ替えシート

═════ ここに PRODUCT GRID「記念に残るアイテム」を配置 ═════
(between §4 and §5, NOT at page bottom)
3 watercolor cards: 和紙の命名書 / 赤ちゃん筆(胎毛筆) / 手形足形キット
Same style as existing "月齢カードセット" style but all three are
watercolor illustrations (no stock photo).

═════ §5 ねんね環境(ベビー布団・ベッド) (seal: 其ノ五) ═════
Lead: 安全なねんねスペースで安心の睡眠を
Checklist:
  - ベビーベッド・布団セット
  - 防水シーツ・キルトパッド
  - スリーパー
  - 温湿度計
  - 加湿器
  - メリー(モビール)
  - ベッドガード

═════ §6 お出かけグッズ (seal: 其ノ六) ═════
Lead: 退院時から日常まで、外出に欠かせないアイテム
Checklist:
  - チャイルドシート(退院時に必須)
  - 抱っこ紐
  - マザーズバッグ
  - ベビーカー
  - おむつポーチ
  - 授乳ケープ
  - 日除けシェード

═════ §7 ママの回復期ケア (seal: 其ノ七) ═════
Lead: 産後ママの体を優しくいたわるアイテム
Checklist:
  - 骨盤ベルト
  - 骨盤矯正ガードル
  - 円座クッション
  - 乳頭保護クリーム
  - リラックスウェア(前開き)
  - 悪露用ショーツ
  - 温湿布
  - 産後サプリ

═════ §8 先輩ママからのひとこと (seal: 其ノ八) ═════
This section is NOT a checklist. Render as THREE stacked quote cards on
washi-paper background. Each quote card: small watercolor avatar (abstract
mom silhouette), italic body, attribution line.

Quote 1:
  「あれもこれもと焦らなくて大丈夫。最低限必要なものだけ揃えて、あとは
  産後にネットで調達するのが正解でした！」
  — 1歳男児のママ

Quote 2:
  「ベビー用品は季節で変わります。冬生まれ夏生まれで差が出るので、季節
  に合わせた肌着選びを優先して。」
  — 2歳女児のママ

Quote 3:
  「高い買い物は退院後に実物を見てから。レンタルやお下がりで済むものも
  多く、焦って揃える必要はありません。」
  — 0歳男児のママ

═════ ARTICLE FOOTER (append AFTER §8) ═════
Add a "チェックリストを印刷" sage pill button + "ブックマーク推奨" note
with bookmark glyph + related-guides row (2 cards linking to
/guide/meimei-hikaku and /guide/miyamairi with watercolor thumbnails).

═════ Keep the final CTA + global footer as-is. ═════

FINAL CHECK before delivery — scroll the page top to bottom and confirm:
  [ ] §1 still rendered (existing)
  [ ] §2 still rendered (existing)
  [ ] §3 rendered with checklist
  [ ] §4 rendered with checklist
  [ ] Product grid (3 watercolor cards) BETWEEN §4 and §5
  [ ] §5 rendered with checklist
  [ ] §6 rendered with checklist
  [ ] §7 rendered with checklist
  [ ] §8 rendered as 3 QUOTE cards (not checklist)
  [ ] Article footer (print button + related guides)
  [ ] Final CTA + global footer unchanged

If any of §3..§8 is missing after rendering, the output is incorrect.
All 8 section cards MUST be present before you finish.
```

### 0-a-2. プロンプト投入のコツ

- **最初の 1 投目**: 共通コンテキスト + プロンプト 1 の全文を丸ごと貼る。長い出力が返るが stitch2 のフルコンテキスト維持に必要
- **再生成依頼**: 「3章の比較表だけ、mobile で card-stack になる版を」のようにスコープを狭めて叩く。全体再生成は避ける
- **3 ページ間のトーン統一**: プロンプト 2 を生成した後、「1 ページ目と同じ hero illustration のタッチで」を明示すると brand-consistency が保たれやすい
- **イテレーション上限**: 各ページ 3 回までに採用を確定。それを超えたら実装フェーズで手動調整へ

### 0-b. stitch2 出力の格納

- 本体 Phase 2 と同じく `stitch2-raw/guide/` 配下に生成物一式を保存
  - `stitch2-raw/guide/shussan-list/`
  - `stitch2-raw/guide/meimei-hikaku/`
  - `stitch2-raw/guide/miyamairi/`
- イテレーション回数の目安は本体 Phase 2 の実績 (4 回前後) に合わせて、各ページ 2〜3 回で合意

### 0-c. レビュー → 採用版確定

- stitch2 の raw 出力を主様が確認し採用版を選定
- 気になる点は stitch2 側で再生成、または Phase 1 の実装フェーズで手動調整
- 採用版のスクショを `test_screenshots/stitch2-picks/` に保存し、Phase 1 以降の実装基準に

### 0-d. 既存デザインシステムとの整合表を作成

- stitch2 が提案する新コンポーネント (例: 比較テーブル / カレンダー帯 / チェックリスト) を
  既存の `guide-hub__tile` / `guide-product` / `details` / BEM 命名に翻訳する対応表を
  [plans/nano-banana2-steady-knuth.md](plans/nano-banana2-steady-knuth.md) に追記
- 完全新規 CSS が必要な部品は `css/pages/guide.css` に追加、共通化可能なら `css/components.css` に昇格

---

## Phase 1 — 共通基盤（a11y + アニメ基盤）

先に横展開の下地を固め、Phase 2 のページ量産で同じ部品を流用する構成。

### 1-a. コントラストトークン追加
- [css/variables.css](css/variables.css) `:root` 末尾に追加:
  - `--color-text-on-cream: #3D3029` (cream 背景で 12.3:1 / AAA)
  - `--color-text-muted-aa: #6B5D52` (cream 背景で 5.1:1 / AA)
  - `--color-link-on-light: #C45E48` (4.6:1 / AA)
  - `--focus-ring: 0 0 0 3px rgba(232,114,92,0.45)` (focus-visible 統一)
- 既存 `--color-muted` (#8A7D73, cream で 3.9:1) は装飾・12px 以下のみ利用。本文では
  `--color-text-muted-aa` へエイリアス方式で段階移行（破壊回避）。
- [css/pages/guide.css](css/pages/guide.css) など本文の `color: var(--color-muted)` 箇所を
  `--color-text-muted-aa` へ置換（置換対象は grep で洗い出す）。

### 1-b. :focus-visible 統一
- [css/base.css](css/base.css) の focus スタイルを box-shadow 併用に変更。
- [css/components.css](css/components.css) の input 系 `:focus` → `:focus-visible` へ統一。
  既存の `--shadow-input-focus` を流用しつつ `--focus-ring` を外形 outline として併用。

### 1-c. skip-link + aria-live 領域のスタイル
- [css/components.css](css/components.css) に追加:
  - `.skip-link`: 初期は `.sr-only`、`:focus` で左上 fixed 表示 (z-index: `--z-modal` + 1)
  - `.scroll-reveal` 初期 `opacity:0; transform:translateY(24px)` →
    `.is-visible` 付与で `animation: fadeIn/slideUp …` 発火

### 1-d. scroll-reveal.js 新規
- 置き場所: [js/core/scroll-reveal.js](js/core/scroll-reveal.js) (新規、既存の `js/core/*` 規約に合わせる)
- `app.js` に混ぜない理由: shindan 以外のページでも共通利用、単独ロード/アンロードしやすい
- 擬似コード:
  ```js
  (() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const delay = Number(e.target.dataset.revealDelay) || 0;
        e.target.style.animationDelay = delay + 'ms';
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  })();
  ```
- `data-reveal="fade|slide-up|slide-left|slide-right|scale|pop"` を CSS 側でマップ
- スタガーは `data-reveal-delay="0|120|240|…"` を n 番目ごとに付与

### 1-e. 全ページ共通差分（一括反映対象 = 公開 HTML 全て）
対象: [index.html](index.html), [shindan.html](shindan.html), [suggestion.html](suggestion.html),
[ranking.html](ranking.html), [kanji.html](kanji.html), [about.html](about.html),
[favorites.html](favorites.html), [privacy-policy.html](privacy-policy.html),
[404.html](404.html), [guide/index.html](guide/index.html),
[guide/meimei-tools.html](guide/meimei-tools.html), [guide/faq.html](guide/faq.html)
＋ Phase 2 の新規 3 本。

差分内容:
- `<body>` 直後に `<a class="skip-link" href="#main-content">本文へスキップ</a>`
- `<main>` に `id="main-content" tabindex="-1"`
- `<body>` 末尾に
  ```html
  <div id="ns-live" class="sr-only" aria-live="polite" role="status"></div>
  <div id="ns-live-alert" class="sr-only" aria-live="assertive"></div>
  ```
- `<script src="/js/core/scroll-reveal.js?v=20260425a" defer></script>` 追加
- CSS キャッシュバスタ `?v=` を `20260425a` に一括更新

### 1-f. shindan 結果コンテナの aria-live
- [shindan.html](shindan.html) の結果表示 section に `aria-live="polite" aria-atomic="true"` を付与
- 既存 `#error-message` の `aria-live="assertive"` は保持

---

## Phase 2 — ガイドページ 3 本新設

3 本とも [guide/meimei-tools.html](guide/meimei-tools.html) を骨格テンプレとして複製し、
`data-page` 属性と JSON-LD BreadcrumbList と主要セクションを差し替える。
H2 ごとに `data-reveal="slide-up"`、grid 子要素に `data-reveal="fade" data-reveal-delay="0|120|240"`。

### 2-a. [guide/shussan-list.html](guide/shussan-list.html) — 出産準備リスト完全版
- H1: 「出産準備リスト完全版 2026」
- H2 構成:
  1. 入院バッグ必需品
  2. 退院〜新生児期の肌着・ウェア
  3. 授乳・ミルク用品
  4. おむつ・沐浴セット
  5. ねんね環境（ベビー布団・ベッド）
  6. お出かけグッズ
  7. ママの回復期ケア
  8. チェックリスト印刷用
- 各 H2 下に `<ul class="checklist">` (`<li><label><input type="checkbox">…</label></li>`)
  将来 localStorage 進捗保存に拡張できる構造で HTML だけ用意
- 既存 `guide-product-grid` ([css/pages/guide.css:142-159](css/pages/guide.css#L142-L159)) を 2〜3 箇所のみ控えめに配置
- タイル画像: `assets/images/guide-tile-shussan.png` (既存・流用)

### 2-b. [guide/meimei-hikaku.html](guide/meimei-hikaku.html) — 命名書サービス徹底比較 2026
- H1: 「命名書サービス徹底比較 2026」
- H2 構成:
  1. 選び方の 4 軸（価格・納期・書体・額装）
  2. タイプ別おすすめ（書家直筆 / デザイン命名紙 / アプリ連携）
  3. サービス比較表
  4. 口コミと注意点
  5. FAQ（`<details>` アコーディオン、[guide/faq.html](guide/faq.html) パターン流用）
  6. 編集部まとめ
- 比較表は `<table class="compare-table">` を新規。CSS は [css/pages/guide.css](css/pages/guide.css)
  に 30 行程度追記（モバイルはカード風スタック、md 以上で table レイアウト）
- **アフィリ導線は [commit d9b6aa8](git show d9b6aa8) のトーンダウン方針に整合**:
  - 「◎ おすすめ」バッジは置かない
  - 冒頭 `.pr-notice` を拡張:「編集部が実費比較 / 広告を含む / 最終判断は読者」を明示
  - 記事末尾に CTA 1 箇所のみ（`.btn--outline`）
  - `data-af-program="a8"` は既存 [guide/meimei-tools.html](guide/meimei-tools.html) の運用を踏襲
- タイル画像: `assets/images/guide-tile-meimei-hikaku.png` を **Nano Banana 2 で追加生成**
  （既存 2 枚と同テイスト、毛筆と料金表を組み合わせた水彩イラスト）。
  生成は [scripts/generate-images.js](scripts/generate-images.js) のプロンプト配列追記で運用。

### 2-c. [guide/miyamairi.html](guide/miyamairi.html) — お宮参り・お七夜の完全ガイド
- H1: 「お宮参り・お七夜の完全ガイド」
- H2 構成:
  1. 日本の新生児儀礼カレンダー
  2. お七夜（命名式）
  3. お宮参り
  4. お食い初め
  5. 初節句・初誕生
  6. 記念品・撮影（`guide-product-grid` を控えめに流用）
  7. よくある質問（`<details>` アコーディオン）
- タイル画像: `assets/images/guide-tile-miyamairi.png` (既存・流用)

---

## Phase 3 — ハブ更新 + 導線整備

### 3-a. [guide/index.html:108-126](guide/index.html#L108-L126) を編集
- 3 箇所の `<div class="guide-hub__tile guide-hub__tile--coming-soon" aria-disabled="true" style="opacity:0.55">`
  を `<a href="/guide/xxx" class="guide-hub__tile">` に置換
- `aria-disabled`, inline style, 「（近日公開）」表記を削除
- 全 5 タイルに `data-reveal="slide-up"` + `data-reveal-delay` をスタガー付与

### 3-b. [sitemap.xml](sitemap.xml) 更新
- `guide/shussan-list`, `guide/meimei-hikaku`, `guide/miyamairi` の 3 URL 追加
  (priority 0.6, changefreq monthly)

### 3-c. [css/pages/guide.css](css/pages/guide.css) の `.guide-hub__tile--coming-soon` 残置
- 将来別の「近日公開」を復活させる可能性があるためスタイルは残す。未使用 lint で削除しない。

---

## Phase 4 — 検証

1. **ローカル起動**: `python -m http.server 8080` → `http://localhost:8080/guide/` 目視
2. **Playwright**: [scripts/debug-shindan-flow.py](scripts/debug-shindan-flow.py) の構造を流用し
   `scripts/audit-new-guides.py`（新規）で 3 URL について以下を assert:
   - nav / main / footer DOM 存在
   - 初期ロード時 Tab 1 回で `.skip-link` がフォーカス可視化
   - スクロールで `[data-reveal]` 要素が `.is-visible` 取得
   - `<details>` 開閉動作
3. **Lighthouse**: `--preset=desktop` / mobile の両方で A11y 95+ / Performance 90+ を 3 本で確認
4. **手動 a11y**:
   - Tab 順: skip-link → main → h1 → 最初の reveal アンカー → …
   - NVDA or VoiceOver で aria-live 領域の読み上げ確認（shindan 結果・エラー）
   - macOS/Safari で「視差効果を減らす」ON 時に animation 停止を確認
   - Lighthouse Contrast 監査で `--color-text-muted-aa` 置換済みセクション全て pass
5. **リグレッション**: [test_screenshots/](test_screenshots/) の差分を手動確認（focus-visible
   変更の影響が出やすい箇所: input / card / nav link）

---

## Critical Files

| 種別 | パス | 責務 |
|------|------|------|
| 新規 | [guide/shussan-list.html](guide/shussan-list.html) | 出産準備リスト本体 |
| 新規 | [guide/meimei-hikaku.html](guide/meimei-hikaku.html) | 命名書比較本体 |
| 新規 | [guide/miyamairi.html](guide/miyamairi.html) | お宮参り・お七夜本体 |
| 新規 | [js/core/scroll-reveal.js](js/core/scroll-reveal.js) | IntersectionObserver ベースの reveal 発火 |
| 新規 | `assets/images/guide-tile-meimei-hikaku.png` | Nano Banana 2 で生成 |
| 新規 | `scripts/audit-new-guides.py` | Playwright リグレッション |
| 編集 | [guide/index.html](guide/index.html) | 3 枚の「近日公開」を `<a>` に昇格、reveal 付与 |
| 編集 | [css/variables.css](css/variables.css) | コントラストトークン + `--focus-ring` |
| 編集 | [css/base.css](css/base.css) | focus-visible 強化 |
| 編集 | [css/components.css](css/components.css) | skip-link / scroll-reveal / focus-visible 統一 |
| 編集 | [css/pages/guide.css](css/pages/guide.css) | `.compare-table` / `.checklist` スタイル追記 |
| 編集 | [css/animations.css](css/animations.css) | `.scroll-reveal[data-reveal="…"].is-visible` マップ |
| 編集 | 全公開 HTML | skip-link / aria-live / main id / scroll-reveal.js / キャッシュバスタ |
| 編集 | [sitemap.xml](sitemap.xml) | 新 3 URL 登録 |
| 編集 | [shindan.html](shindan.html) | 結果 section に aria-live="polite" |

---

## 再利用する既存資産

- `guide-hub__tile` / `guide-product-grid` ([css/pages/guide.css](css/pages/guide.css))
- `<details>` アコーディオン ([guide/faq.html](guide/faq.html) の記述パターン)
- `.pr-notice` / `data-af-program="a8"` ([guide/meimei-tools.html](guide/meimei-tools.html))
- `.sr-only` ([css/base.css:248-258](css/base.css#L248-L258))
- 14 keyframes + `prefers-reduced-motion` 完全対応 ([css/animations.css](css/animations.css))
- `js/core/` 規約（boot.js / nav.js 等と同階層で scroll-reveal.js を追加）
- [scripts/generate-images.js](scripts/generate-images.js) の Nano Banana 2 呼び出し

---

## 懸念点・代替案

- **A8.net 提携状況**: 命名書比較の掲載商品数が変動。MVP は「書家直筆 / デザイン命名紙 /
  アプリ連携」の代表 3 件に絞り、後日追加運用。
- **`--color-muted` 本文利用箇所の置換**: 破壊回避のためエイリアス方式で段階移行。
  AA 必須なのは「本文」のみと割り切る。
- **focus-visible 変更の副作用**: [js/ranking-page.js](js/ranking-page.js) 等の動的生成カードで
  フォーカス外形が変わる。Phase 4 スクショ差分で確認。
- **IntersectionObserver の代替として `animation-timeline: view()`**: Safari/iOS 未対応範囲が
  まだ残るので採用見送り。`.is-visible` 単独発火の単純構造にして将来入れ替え可能に保つ。
- **チェックリスト進捗保存**: localStorage 保存は今回スコープ外。HTML 構造だけ用意して
  後日 Phase 拡張で実装。
