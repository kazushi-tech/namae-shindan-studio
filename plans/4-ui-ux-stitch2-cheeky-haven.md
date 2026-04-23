# 名前診断スタジオ 拡張計画 — SEO集客×マネタイズ×50サイト横展開テンプレ化

## Context

現在の名前診断スタジオは、ナビゲーション4項目（ホーム／姓名判断／五格について／コラム）・実質HTMLは5ページ（index/shindan/about/privacy-policy/404）というミニマム構成で、次のギャップを抱えている。

1. **SEOコンテンツ量が圧倒的に不足**：sitemapに登録済みのURLは4本のみ。ロングテール流入がほぼ発生しない。
2. **マネタイズがキッズ時計CTAのみ**：AdSense・アフィリエイトともに未導入。CSPも厳格で即座には広告を載せられない状態。
3. **赤ちゃん名付け層は「購買意欲MAXの金鉱層」**なのに収益化されていない（出産準備で数万円〜十万円を使う世代）。
4. 将来的に **50サイト横展開で月50万円** を狙う構想があるが、現サイトはブランド名・カラー・コピー・GA4 ID 等がハードコードされており、量産テンプレとして再利用できない。

本計画は「このサイトで月1万円稼げる地合いを作る」ことを一次目標、「そのテンプレを50サイトに量産できる形に整える」ことを二次目標として、5本の新規項目追加＋マネタイズ同時実装＋テンプレ化リファクタを統合したロードマップをまとめる。UI/UXは既存の和モダン×ぬくもりのデザインシステム（Zen Maru Gothic+Noto Sans JP、クリーム/テラコッタ/セージ配色）を踏襲し、新規ページもstitch2で既存トーンを崩さず作成する。

---

## 追加する5項目（新規ページ／機能）

ナビは現4項目を維持しつつ、**辞典ハブ**／**名付けお役立ちハブ**の2項目を足して合計6項目にする（モバイルは既存ハンバーガーメニューで対応）。

### 項目1: 名前候補ジェネレーター `/suggestion`（CLAUDE.md Phase 2 Tier A のみ）

姓＋条件（性別／画数／文字数／読み頭文字／含みたい漢字）で、人気名前DB（2,000件）からフィルタ・ソートして候補名を即提示。APIは不使用。各候補に画数内訳・五格サマリ・「詳しく診断」ボタンを備え、クリックで `/shindan?sei=...&mei=...` へ引き継ぎ。

- **SEO狙い**: 「佐藤 良い名前」「田中 名前 画数 おすすめ」「姓 合う 名前」など姓×条件のロングテール
- **プリレンダリング**: 人気上位500姓は `/suggestion/{姓}` として静的HTMLを事前生成（ビルド時）、Googleにインデックスさせる
- **既存資産**: `css/pages/suggestion.css` すでに存在、UI骨格はそのまま流用可
- **期待PV**: 月2,000〜8,000（shindanと相互送客）

### 項目2: 漢字辞典ページ群 `/kanji/{漢字}`（★SEO本命、ロングテール量産の核）

人名用漢字＋常用漢字の名付け対応分、**約3,000字×1ページ**を静的生成。各ページに「画数（新旧併記）／読み（音訓／名のり）／部首／意味カテゴリ／使用頻度／この漢字を含む人気名前リスト／関連漢字20〜30本／この漢字×姓で即診断」を掲載。

- **SEO狙い**: 「蓮 名前」「結 名前 意味」「陽 画数」「凛 名前 使い方」など（3,000漢字×複数KW）
- **データソース**: 既存 `data/kanji-strokes.json` ＋ 新設 `data/kanji-meanings.json`（意味・読み・名のり）
- **生成方法**: `scripts/build/build-kanji-pages.js` で `templates/kanji.hbs` に当てて全HTMLを事前生成（ランタイムJS不要）
- **Phase分割**: 初期は人気300字のみ公開 → SEO反応を見ながら残り2,700字を段階投入
- **期待PV**: 月10,000〜60,000（成熟後）

### 項目3: 人気名前ランキング `/ranking/*`

- `/ranking/` トップ（全体概説＋切替UI）
- `/ranking/2026-girls` `/ranking/2026-boys`（性別×年別）
- `/ranking/yomi-2026`（読み方別）
- `/ranking/kanji-2026`（使用漢字別）
- `/ranking/archive/{年}` 年次アーカイブ

公開統計（たまひよ／明治安田生命／赤ちゃん本舗 等）を自社集計形式に再構成し、出典明記。各名前をクリックすると `/shindan?sei=&mei={名前}` で即診断へ。ソート・フィルタ（画数／文字数／読み頭文字）をJSで提供。年次更新は1月に翌年暫定、12月に確定。

- **SEO狙い**: 「赤ちゃん 名前 ランキング 2026」「女の子 人気 名前」等のビッグKW
- **期待PV**: 月3,000〜20,000

### 項目4: 名付けお役立ちガイド `/guide/*`（マネタイズ記事の主戦場）

AdSense審査通過の要件となる「独自性のある記事コンテンツ」と、アフィリエイト成約の受け皿を兼ねる5記事。

| URL | タイトル | 主な誘導先商材 | 文字数目安 |
|------|---------|--------------|----------|
| `/guide/meimei-tools` | 名付けに役立つアイテム30選 | 名付け本（もしも→Amazon/楽天）、命名書、赤ちゃん筆 | 6,000〜8,000字 |
| `/guide/shussan-junbi` | 出産準備リスト完全版（チェックリスト付） | Amazon/楽天ベビー用品、コズレ無料サンプル、ゼクシィBaby | 8,000〜12,000字 |
| `/guide/meimei-sho-hikaku` | 命名書サービス徹底比較2026 | A8.net 命名紙・筆系プログラム | 5,000字＋比較表 |
| `/guide/omiyamairi-oshichiya` | お宮参り・お七夜の完全ガイド | スタジオアリス／fotowa（afb）、お食い初め食器 | 6,000字 |
| `/guide/faq` | 名付けFAQ＆用語集 | 本体ツールへの内部送客ハブ | 4,000字＋FAQPage JSON-LD |

- 各記事の `<h2>` 直後にインフィード広告を配置（CTR 1.2〜2.0% 想定）
- 出産準備リストはチェックボックスをlocalStorageで保存 → 再訪率UP

### 項目5: 診断結果画面の強化（shindan.html 内の既存セクション拡張）

新規ページではないが、**マネタイズ上最強ポジション**のため拡張必須。

- 既存の「キッズ時計CTA」を「関連アイテム提案カード」として汎用化。カード3枚（命名書／赤ちゃん筆／記念撮影）＋既存キッズ時計を水平スクロール／グリッドで配置
- `gokaku-grid` と `share-section` の間に AdSense ディスプレイ広告を1枠（結果閲覧後の最高CTR位置、RPM 400〜600円想定）
- 結果画面下部に「関連ページ」ブロック：診断で使った漢字の `/kanji/{漢字}` ページ、総格画数の `/gakusuu/{n}` ページ（Phase 2で追加）、同条件の他候補 `/suggestion?sei=...&soukaku=...` へのリンクを自動生成

---

## UI/UX方針（既存デザインシステム踏襲）

- **stitch2での作成**：新規ページも既存`variables.css`のトークン（色・フォント・余白・影）に完全準拠。stitch2プロンプトには「Zen Maru Gothic + Noto Sans JP、テラコッタ#E8725C＋セージ#6EC4A8＋クリーム#FFF8F0、角丸20px、BEM命名」を必ず含める
- **既存コンポーネント流用**：`.card` / `.btn--primary` / `.btn--outline` / `.feature-card` / `.step-card` をそのまま使う。新規クラスはBEM命名で各ページCSSへ
- **モバイルファースト**：768px未満で1列、768px以上でグリッド展開
- **アニメーション控えめ**：既存の `animate-fade-in` / `animate-slide-up` と同じ段階遅延パターンを踏襲
- **広告・アフィリ領域のトーン**：テラコッタ・ゴールドのアクセントで馴染ませ、`[PR]` / `[広告]` ラベルは `--color-muted` + `--text-xs` で小さく明示

---

## SEO戦略

### 構造化データ（JSON-LD）の標準化

全ページに `BreadcrumbList` を必須配置し、ページタイプ別に以下を追加：

| ページ種別 | メインスキーマ | 補助スキーマ |
|-----------|-------------|------------|
| トップ | `WebSite`＋`Organization` | `SearchAction`, `ItemList` |
| `/shindan` | `WebApplication`（既存） | `HowTo`, `FAQPage` |
| `/about` | `Article`（既存） | `FAQPage`, `DefinedTermSet` |
| `/kanji/{漢字}` | `DefinedTerm` | `ItemList`（含む名前）, `FAQPage` |
| `/ranking/*` | `ItemList` | `Article`, `FAQPage` |
| `/suggestion` | `WebApplication` | `HowTo` |
| `/guide/*` | `Article` | `FAQPage`, `HowTo`（該当記事） |

FAQPageは各ツール系・辞典系に「よくある質問5問」を配置しリッチリザルト獲得を狙う。

### 内部リンク設計（4層循環モデル）

```
[入口層] ranking / kanji / guide      ← SEO検索流入
      ↓（各ページの「診断する」CTA）
[CV層]  shindan / suggestion
      ↓（結果画面から）
[深掘り層] kanji/{漢字} / about#anchors
      ↓（関連データ推薦）
[再訪層] 類似ページ（同画数・同読み）／コラム（WP）
```

- `shindan.html` 結果画面に「使った漢字の詳細→/kanji/{漢字}」「同じ総格の候補→/suggestion?soukaku={n}」リンクを自動生成
- 全ページ共通の `shindan-embed` ミニフォームコンポーネントを `components.css` に作り、各新規ページ下部に配置

### sitemap.xml の全件自動生成

`scripts/build/generate-sitemap.js` で、ビルド時に全HTMLを走査してsitemap.xmlを再生成。既存の `sitemap.xml` は手動管理から卒業。

### コラムサブドメインとの棲み分け

- **本体（namae-studio.com）**：ツール系＋辞典系（量産テンプレ）
- **コラム（column.namae-studio.com／WordPress）**：読み物・体験談・時事・ニュース
- 同一キーワードを両方で狙わない（キーワードマッピング表を `plans/keyword-map.md` で別途管理）

---

## マネタイズ実装（同時実装フェーズ）

### AdSense配置9箇所

| # | ページ | 位置 | フォーマット | 注意 |
|---|--------|------|------------|------|
| A1 | `/` | Features直後 | 水平レスポンシブ | ★「広告なし」文言撤去必須 |
| A2 | `/` | disclaimer直前 | インフィード | - |
| A3 | `/shindan` | ヘッダ直下（フォーム上） | 水平 | 「以下に広告含む」ラベル併記 |
| A4 | `/shindan` | 結果グリッド下・シェア上 | 矩形ディスプレイ | **最高RPM位置** |
| A5 | `/shindan` | 結果disclaimer下 | マルチプレックス（関連コンテンツ風） | - |
| A6 | `/about` | 計算例前後 | インフィード | - |
| A7 | `/about` | 評価の見方〜免責の間 | 矩形 | - |
| A8 | 全ページ（SP） | スティッキー最下部 | 320x50 アンカー | 閉じるボタン必須 |
| A9 | `/guide/*` | H2直後ごと | インフィード | 記事系RPMの主力 |

- 自動広告（Auto Ads）は使わず手動配置のみでポリシー違反リスク最小化
- 結果画面は動的挿入のため `js/ui-controller.js` 内で `adsbygoogle.push({})` を結果DOM挿入後に再実行
- 広告コンテナに固定高さを予約してCLS悪化を防ぐ

### アフィリエイト主力5組

| ASP | 商材 | 配置 |
|------|------|------|
| もしもアフィリエイト（Amazon/楽天経由） | 名付け本・命名辞典 | `/guide/meimei-tools`、診断結果カード |
| A8.net | 命名書・赤ちゃん筆 | `/guide/meimei-sho-hikaku`、診断結果カード |
| afb | 写真スタジオ（スタジオアリス／fotowa） | `/guide/omiyamairi-oshichiya`、診断結果カード |
| もしも（Amazon/楽天） | ベビー用品・出産祝い | `/guide/shussan-junbi` |
| afb / A8.net | 無料登録系（ゼクシィBaby／コズレ） | 結果画面・全ガイド記事（CVR最強の主力） |

- 全アフィリリンクに `rel="sponsored noopener"` を付与、各リンク近傍に `[PR]` 表記（ステマ規制対応）
- 記事冒頭に「本ページはアフィリエイトプログラムによる収益を得ています」を定型挿入

### CSP修正（vercel.json）

**現状**: `default-src 'self'` ベースで広告系は一切許可されていない。

**修正内容**（最小セット）：
- `script-src`: `'unsafe-eval'` ＋ `https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://www.googletagmanager.com https://www.google-analytics.com https://*.doubleclick.net`
- `img-src`: `data: https: blob:` へ拡張
- `connect-src`: `https://www.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net` 等を追加
- `style-src`: `https://*.googlesyndication.com` 追加
- `frame-src`: 新規追加（`https://*.googlesyndication.com https://*.doubleclick.net`）
- `frame-ancestors 'none'` と `object-src 'none'` は維持（クリックジャッキング対策）

### privacy-policy.html 追記3節

1. **広告配信について**：Google含む第三者広告配信事業者のCookie使用、パーソナライズ広告オプトアウトURL（google.com/settings/ads）
2. **アフィリエイトプログラム参加表記**：参加ASP一覧と「リンクを経由した購入により運営者に紹介料が支払われる場合があります」
3. **アクセス解析**：GA4 利用とCookie、オプトアウト方法（GA4導入時同時）

### index.html の「広告なし」文言撤去（最優先）

現在 `feature-card` に「会員登録なし、広告なし。」と記載 → **即撤去**。代替文言「会員登録不要ですぐ使える」へ変更。

### 月1万円達成シミュレーション

| シナリオ | 月間PV | 収益 |
|---------|-------|------|
| 立ち上げ1〜3ヶ月 | 3,000 | 約2,400円 |
| 保守ライン（3〜6ヶ月） | 15,000 | 約30,000円 |
| 成熟（6〜12ヶ月） | 50,000 | 55,000〜80,000円 |

月1万円は両立戦略（AdSense + 無料登録系アフィリ）で **約6,000 PV/月** から達成可能。

---

## 50サイト横展開を見据えたテンプレ化設計（今から着手）

### 3層アーキテクチャ（Core / Shell / Theme）

```
[Core Layer]    全サイト共通・不変
  ├── css/{reset, base, components, layout, animations}.css
  ├── js/core/{favorites, share, og-generator, analytics, storage, router, ab-test}.js
  ├── scripts/build/*.js
  └── templates/{layouts, partials, pages}/*.hbs

[Shell Layer]   サイト固有設定＋出力
  ├── site.config.json        ← ★差し替えの中心
  ├── content/*.json          ← 全ページ本文の外部化
  └── dist/*.html             ← ビルド結果（Vercel公開対象）

[Theme Layer]   ジャンル依存
  ├── tool/engine.js          ← 統一I/Fの計算コア（本サイトは姓名判断）
  ├── tool/schema.json        ← 入出力スキーマ
  ├── data/*.json             ← ジャンル依存辞書
  └── css/pages/*.css         ← ツール画面のページ固有CSS
```

### 新設する共通コアJS（`js/core/`）

| ファイル | 責務 |
|---------|------|
| `storage.js` | localStorage抽象化（JSON＋TTL＋容量制限） |
| `favorites.js` | 診断結果の保存／一覧／削除 |
| `share.js` | X / LINE / Threads / Facebook / URLコピー（汎用） |
| `og-generator.js` | Canvas APIで1200×630の結果OG画像を動的生成 |
| `analytics.js` | GA4ラッパー、共通イベントスキーマ（`tool_completed`, `result_shared`, `favorite_added`, `affiliate_clicked`） |
| `router.js` | `data-page` 属性でページ別初期化 |
| `ab-test.js` | localStorageでバリアント割当、GA4にユーザープロパティ送信 |

### ツール統一スキーマ（`tool/schema.json`）

```json
{
  "resultVersion": "1.0",
  "title": "string",
  "summary": "string",
  "rating": "大吉 | 吉 | 半吉 | 凶 | 大凶",
  "scores": [{ "label": "string", "value": "number", "rating": "string", "description": "string" }],
  "keywords": ["string"],
  "shareable": true,
  "permalinkParams": { "sei": "string", "mei": "string" }
}
```

全ジャンルツールがこのスキーマで結果を返せば、`share.js` / `favorites.js` / `og-generator.js` は全50サイトで共通のまま動く。

### `site.config.json` 雛形

ブランド名・タグライン・ドメイン・カラー・フォント・GA4 ID・Search Console 確認ID・アフィリタグ・AdSense client を全部ここに集約。このファイルと `content/*.json`・`data/*.json` を差し替えるだけで別ドメイン別ジャンルのサイトが立ち上がる。

### ビルドスクリプト（`scripts/build.js`）

Handlebars で `templates/*.hbs` に `site.config.json` と `content/*.json` を当てて `dist/*.html` を出力。同時に以下を自動生成：

- `dist/manifest.json`（PWA）
- `dist/sitemap.xml`
- `dist/robots.txt`
- `dist/assets/og/*.png`（静的OG画像）
- `dist/index.html` 等に GA4 スニペット・JSON-LD 注入

Vercel設定：`buildCommand: "node scripts/build.js"`, `outputDirectory: "dist"`。

### 量産時の品質担保チェックリスト（公開前必須）

- [ ] `site.config.json` が JSON Schema 検証をパス
- [ ] `content/*.json` のdiff率 ≥ 80%（既存サイトと別物）
- [ ] about / FAQ 合計 3,000 字以上
- [ ] hero / feature / cta のイラストがサイト固有
- [ ] カラーパレットが他サイトと重複しない
- [ ] Lighthouse: Performance 90+ / Accessibility 95+ / SEO 100
- [ ] Rich Results Test で JSON-LD 通過
- [ ] GA4 / Search Console 登録済み、sitemap送信済み

### 横展開時のSEOリスク回避

- 50サイト同日公開しない（週1〜2サイトずつ、約半年〜1年で段階ローンチ）
- 同一IPでも相互リンクは3〜5サイトに絞る（PBN判定回避）
- ハブサイト方式（50サイトを束ねるポータル）は要検討（初期は不要）
- GA4 プロパティはサイト毎に独立、Looker Studio で横断集計

---

## stitch2 ワークフロー（Phase 3 冒頭で必須）

**重要：実装エージェントは Phase 2 完了時点で必ず一度停止し、ユーザーに戻ること。**

Phase 3 の新規5ページ（`/suggestion`, `/kanji/{漢字}`, `/ranking/*`, `/guide/*`, 診断結果強化モジュール）のUIは、ユーザーがstitch2で生成したモックアップをZipで受け取り、リポジトリに貼り付ける形で供給される。実装エージェントはユーザーから「stitch2 生成物の貼り付け完了」報告を受けてから Phase 3 のタスク17以降に着手する。

### フロー全体像

```text
[Phase 2 完了]
     ↓
[⏸ 停止：ユーザーに報告]
     ↓
[ユーザー作業：stitch2 でUI生成 → Zip DL → リポジトリへ貼り付け]
     ↓
[ユーザーから「貼り付け完了」報告]
     ↓
[Phase 3 標準化タスク開始]
```

### stitch2 プロンプト設計指針（ユーザー側で使用）

生成時のプロンプトに以下を必ず含める：

- **フォント**：見出し Zen Maru Gothic（700/900）、本文 Noto Sans JP（300/400/500/700）。Inter/Roboto/Arial/system-ui は禁止
- **カラートークン**：テラコッタ `#E8725C`（主要CTA）、セージグリーン `#6EC4A8`、ソフトゴールド `#F0B84D`、クリーム背景 `#FFF8F0`、ダークブラウン `#3D3029`（本文）
- **コンポーネント**：既存の `.card`（20px角丸＋上部3pxグラデーション）、`.btn--primary`（テラコッタグラデ）、`.btn--outline`、`.feature-card`（ホバーで6px上昇＋-1deg回転）を踏襲
- **命名規約**：BEM（`.block__element--modifier`）
- **アニメーション**：`animate-fade-in` / `animate-slide-up` の段階遅延パターン（0.2s, 0.4s刻み）
- **モバイルファースト**：768px未満で1列、768px以上でグリッド展開
- **参考画像**：既存 `index.html` と `shindan.html` のスクショを必ず添付し「このトーンを維持」と指示

### 貼り付け受入先（Zip展開ルール）

stitch2のZipは以下のルールで配置：

- HTML → 一旦 `stitch-raw/{page-name}.html` に退避（標準化前の生HTMLを保管）
- CSS → `stitch-raw/{page-name}.css`
- 画像 → `stitch-raw/assets/`

標準化後に `templates/pages/*.hbs` / `css/pages/*.css` / `assets/images/` へ分配するので、**生のstitch2出力を直接 production 側に置かない**。

### Phase 3 開始直後の標準化タスク（実装エージェント担当）

1. **クラス名のBEM統一**：stitch2生成クラス（例：`.hero-section-wrapper-1`）を既存命名規約に合わせてリネーム
2. **variables.css トークンへ置換**：インラインスタイル・ハードコード色値を `var(--color-terracotta)` 等に置換
3. **既存コンポーネント再利用**：重複した独自カード/ボタンを `.card` / `.btn--primary` へ置換
4. **Handlebars partial化**：nav/footer/head-meta/disclaimer 等の共通部品をstitch2側の生成物から剥がし、既存partialに差し替え
5. **templates/pages/*.hbs へ移植**：stitch2の骨格を content JSON 駆動に変換
6. **JSON-LD 注入**：各ページタイプに応じた構造化データ（DefinedTerm / ItemList / Article / FAQPage 等）を追加
7. **アクセシビリティチェック**：`lang="ja"`、`aria-label`、見出しレベル、コントラスト比
8. **Lighthouse確認**：Performance 85+/SEO 100/Accessibility 95+

### 50サイト横展開での再利用

- stitch2プロンプト自体を `plans/stitch-prompt-template.md` として資産化（`site.config.json` の値を埋め込む変数プロンプト）
- 2サイト目以降はプロンプトの色・フォント・タグラインを差し替えるだけでUI生成が可能になる

---

## 実装ロードマップ（5フェーズ）

### Phase 0: 基盤整備＆広告受入準備（Week 1）

1. `vercel.json` CSP 修正（AdSense/GA4 許可）
2. `index.html` の「広告なし」文言撤去
3. `privacy-policy.html` に広告配信・アフィリ参加・アクセス解析の3節を追記
4. `css/components.css` に `[PR]` / `[広告]` ラベルクラス追加
5. `site.config.json` 新規作成（現サイトの値を全て外部化、まだHTMLからは参照しない状態でOK）

### Phase 1: テンプレ化リファクタ＆共通JS整備（Week 2–3）

6. `js/core/` ディレクトリ作成と既存汎用ロジック抽出
7. `js/core/{storage, favorites, share, analytics, og-generator, router, ab-test}.js` 実装
8. `tool/schema.json` 定義、`SeimeiHandan.calculate()` の戻り値を新スキーマ準拠に移行
9. `content/home.json` / `content/shindan.json` / `content/about.json` 新規作成（既存HTML本文を外部化）
10. `templates/` ディレクトリ＋ Handlebars パーシャル作成
11. `scripts/build.js` 実装、`vercel.json` の `buildCommand` 更新
12. 既存5ページをビルド経由で再生成し、挙動が完全同一であることを確認

### Phase 2: 追加機能＆GA4（Week 3–4）

13. お気に入り保存機能（`/favorites` ページ追加、shindan結果に☆ボタン）
14. 動的OG画像生成（シェア時に結果込みの画像生成）
15. GA4 導入＋ Search Console 登録、カスタムイベント配線
16. A/Bテスト基盤（初回はHero CTAコピーのA/B）

---

### ⏸ USER CHECKPOINT: stitch2 UI 生成（Phase 2 → Phase 3 の境界）

**実装エージェントはここで必ず停止し、ユーザーに報告すること。**

Phase 2 完了を報告 → ユーザーが stitch2 で5ページ分のUI（`/suggestion`, `/kanji` テンプレ, `/ranking` テンプレ, `/guide` 記事テンプレ, 診断結果強化カード）を生成 → Zip をリポジトリの `stitch-raw/` 配下に展開 → ユーザーから「stitch2 貼り付け完了」報告を受けた後に Phase 3 タスク17以降へ着手。

詳細は本ファイル上部の「stitch2 ワークフロー」セクション参照。

---

### Phase 3: SEO集客5本盛り（Week 4–8）

17. `/suggestion` 実装（人気名前DB `data/popular-names.json` 用意、Tier Aエンジン、上位500姓のプリレンダ）
18. `/kanji/{漢字}` ジェネレータ＋初回300字投入（`data/kanji-meanings.json` キュレーション）
19. `/ranking/` トップ＋年別性別別3ページ＋読み方別1ページ
20. `/guide/meimei-tools` 記事公開
21. `/guide/shussan-junbi`（localStorageチェックリスト付）
22. `/guide/meimei-sho-hikaku` 記事公開
23. `/guide/omiyamairi-oshichiya` 記事公開
24. `/guide/faq` ハブ公開
25. 診断結果画面に「関連ページ」ブロック自動生成機能追加
26. sitemap.xml 自動再生成、全ページのJSON-LD追加

### Phase 4: マネタイズ本格稼働（Week 6–10／Phase3と並行）

27. もしも／A8.net／afb の申請・承認取得
28. 診断結果画面の「関連アイテム提案カード」実装（キッズ時計CTAと統合）
29. コラム側（WordPress）でAdSense審査申請
30. AdSense承認後、配置A1〜A9を段階実装
31. Looker Studio 横断ダッシュボード初版（将来50サイト対応の雛形）

### Phase 5: 量産準備（Week 10–12）

32. `scripts/validate-config.js`（site.config.json JSON Schema検証）
33. テンプレリポジトリとして git submodule 化 or monorepo 化判断
34. 2サイト目候補ジャンルの選定（ペット名前診断 or 夢占い辞典など、本計画のジャンル50候補から）
35. 量産手順書 `plans/site-clone-howto.md` 作成

---

## Critical Files

### 既存（修正対象）
- [index.html](index.html) — 「広告なし」文言撤去、GA4スニペット挿入、ナビ追加
- [shindan.html](shindan.html) — 結果画面の関連アイテムカード／広告／関連ページブロック拡張
- [about.html](about.html) — 広告2箇所（A6/A7）、内部リンク強化
- [privacy-policy.html](privacy-policy.html) — 広告配信／アフィリ／アクセス解析の3節追加
- [vercel.json](vercel.json) — CSP修正（AdSense／GA4／広告ドメイン許可）、`buildCommand`設定
- [sitemap.xml](sitemap.xml) — 自動生成に移行
- [css/variables.css](css/variables.css) — `site.config.json` から注入可能な形に再構成
- [css/components.css](css/components.css) — `[PR]`／`[広告]` ラベル、`shindan-embed` コンポーネント追加
- [css/pages/shindan.css](css/pages/shindan.css) — 関連アイテムカードのスタイル
- [js/seimei-handan.js](js/seimei-handan.js) — `tool/schema.json` 準拠の戻り値へ移行
- [js/ui-controller.js](js/ui-controller.js) — 結果DOM挿入後の `adsbygoogle.push({})`、関連ページ自動生成
- [js/app.js](js/app.js) — `js/core/router.js` ベースへ再構築
- [data/kanji-strokes.json](data/kanji-strokes.json) — 漢字辞典ジェネレータの基礎データ
- [data/fortune-meanings.json](data/fortune-meanings.json) — 画数解説の本文ソース

### 新規作成
- `site.config.json`
- `content/home.json` / `content/shindan.json` / `content/about.json` / `content/guide/*.json`
- `data/kanji-meanings.json`（意味・読み・名のり）
- `data/popular-names.json`（2,000件の人気名前DB）
- `data/rankings/2026.json`
- `tool/schema.json`
- `js/core/{storage, favorites, share, analytics, og-generator, router, ab-test}.js`
- `css/pages/suggestion.css`（既存ファイルあり、拡張）
- `css/pages/kanji.css` / `css/pages/ranking.css` / `css/pages/guide.css`
- `templates/layouts/base.hbs`、`templates/partials/{nav,footer,head-meta,json-ld,disclaimer,share,shindan-embed}.hbs`
- `templates/pages/{index,shindan,about,privacy,kanji,ranking,suggestion,guide}.hbs`
- `scripts/build.js`
- `scripts/build/generate-og.js`
- `scripts/build/generate-sitemap.js`
- `scripts/build/build-kanji-pages.js`
- `scripts/validate-config.js`
- `scripts/schemas/site.config.schema.json`

---

## Verification（動作確認手順）

### Phase 0 完了時
1. `npm run build`（将来的）または現状は `vercel dev` で起動
2. ブラウザDevTools→Networkで `pagead2.googlesyndication.com` がCSPで拒否されていないこと（まだAdSenseコードは入れない、CSPだけ通ること）
3. `/privacy-policy` に3節追記が反映されていること
4. `/`の「広告なし」表記が消えていること

### Phase 1 完了時
5. `node scripts/build.js` が成功し `dist/` に5ページが出力される
6. `dist/index.html` の表示が現行 `index.html` と完全一致（差分なし）
7. `js/core/*.js` がユニットレベルで期待値を返す（簡易テストスクリプトで確認）

### Phase 2 完了時
8. 診断→☆保存→/favorites で表示される
9. シェアで動的OG画像が生成され、URLパラメータでも復元される
10. GA4 DebugViewで `tool_completed` / `favorite_added` / `result_shared` が受信される

### Phase 3 完了時
11. `/suggestion` で姓＋条件を入れて候補が100件表示される
12. `/kanji/蓮` など人気300字がすべて200で返り、JSON-LDがRich Results Testを通過
13. `/ranking/2026-girls` がItemListスキーマを出力、各名前クリックで診断に遷移
14. `/guide/*` 5記事が公開、記事内H2直後の広告枠が描画される（後フェーズで実広告投入）
15. Lighthouse: Performance 85+, SEO 100, Accessibility 95+
16. `sitemap.xml` がビルド時に全URL網羅して再生成される

### Phase 4 完了時
17. AdSense承認コードが全ページの `</head>` 直前に配置され、A1〜A9の広告枠がブラウザで実際に描画される（iframeで）
18. 診断結果のアフィリリンク（命名書／赤ちゃん筆／記念撮影）がクリック可能で、GA4に `affiliate_clicked` イベントが記録
19. CLS ≤ 0.1（広告コンテナの高さ予約が効いている）
20. Looker Studio ダッシュボードでPV／収益イベントが確認できる

### Phase 5 完了時
21. `site.config.json` を別ドメイン・別カラーに書き換えて `node scripts/build.js` → 別サイトとして成立することをローカルで確認
22. 量産手順書に沿って2サイト目のリポジトリを作成、デプロイまで実行（実ドメイン取得は判断後）

### 継続観測（公開後2〜8週間）
23. Search Consoleでインデックス登録数 ≥ ページ数の80%
24. 自然検索流入が発生、`tool_completed` コンバージョン率 ≥ 20%
25. 月間PV・RPM・アフィリ成約を集計し、保守ライン（15,000PV／月 = 約3万円）への到達進捗を評価
