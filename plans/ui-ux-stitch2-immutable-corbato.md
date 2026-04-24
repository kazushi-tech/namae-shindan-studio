# column.namae-studio.com 子テーマ化 + stitch2 による UI/UX 全面刷新

作成日: 2026-04-24
対象: `https://column.namae-studio.com/`（WordPress 6.9 + AFFINGER4）
作業者: 主様（Kazushi） + 実装エージェント（並列 Agent Team 起用）
採用 stitch2 バージョン: **記事一覧 = `stitch_ (10)`、記事詳細 = `stitch_ (11)`**（どちらも Tailwind CDN 依存、Phase 2 で BEM 化）
所要時間目安: 準備 1 時間 / Phase 2 並列実装 2〜3 時間 / デプロイ＋検証 1 時間 / 合計 **4〜5 時間**
前提プラン:
- [plans/wp-install-handoff-2026-04-20.md](wp-install-handoff-2026-04-20.md)（WP インストール完了）
- [plans/enumerated-booping-perlis.md](enumerated-booping-perlis.md)（UI/UX 設定完了 + 子テーマ化を積み残し）

---

## Context（なぜこの作業が必要か）

column サイトは本体 [namae-studio.com](https://namae-studio.com/) との **ビジュアル乖離** が大きく、主様が以下の症状を主張しておる:

### 症状 1: ナビゲーションメニューの浮き

PC 表示で 7 項目（ホーム／姓名判断／名前提案／人気ランキング／漢字図鑑／名付けガイド／**運営者情報**）のうち、最後の「運営者情報」だけが 2 行目に溢れる。[enumerated-booping-perlis.md § ⑥](enumerated-booping-perlis.md) で追加 CSS（font-size/padding タイト化）を投入してもなお 7 項目は PC 1 行に収まらぬ構造問題。

### 症状 2: 「運営者情報」クリックで「五格について」に遷移

「運営者情報」のリンク先が本体 [about.html](../about.html)（五格解説）に誤設定されておる。実在しない 運営者情報ページへの暫定リンクじゃったようじゃが、ユーザー体験上は完全に壊れとる。

### 症状 3: 全体のトーンが本体サイトと揃わぬ

[enumerated-booping-perlis.md](enumerated-booping-perlis.md) でカラーパレット（テラコッタ/セージ/クリーム）は反映済みじゃが、フォント（Zen Maru Gothic/Noto Sans JP 未適用）、カードの角丸+3px グラデ装飾、`.btn--primary` のグラデボタン、`.feature-card` のホバー浮き等、**本体サイトのコンポーネント言語が一切使われておらぬ**。AFFINGER4 デフォルトのタイポグラフィ/コンポーネントが透けて見えるため「明らかに浮いている」と感じられる。

### なぜ子テーマ化か

[enumerated-booping-perlis.md § 🎯 次セッション最優先](enumerated-booping-perlis.md) にて 2026-04-24 に確定済の方針:「AFFINGER4 カスタマイザーで 300 項目近い手動設定を探す作業は AI 時代の体験として許容できない」。コードベースで一元管理できる **子テーマ `affinger4-child`** を作成し、`style.css` / `functions.php` / `header.php` / `sidebar.php` / `footer.php` をオーバーライドする形で本体サイトトーンを流し込む。

### なぜ stitch2 か

本体サイトの既存ページ（[index.html](../index.html) / [shindan.html](../shindan.html) / [about.html](../about.html)）を視覚参照として stitch2 に投入し、column 専用 UI を生成する。手書き移植より早く、主様が DevTools で苦しまずに済む。[plans/4-ui-ux-stitch2-cheeky-haven.md § stitch2 ワークフロー](4-ui-ux-stitch2-cheeky-haven.md) で確立済みのフロー（Zip → `stitch-raw/` 展開 → BEM 化 → テーマ移植）を踏襲。

---

## Done の定義

- [ ] `wp-content/themes/affinger4-child/` 子テーマが有効化されている
- [ ] PC 表示でグローバルナビ 6 項目（運営者情報削除後）が **1 行横並び** で、本体サイトの `.nav` トーン（Zen Maru Gothic / テラコッタホバー）になっている
- [ ] モバイル（≤768px）でハンバーガーメニューが本体サイトと同等のモーション・配色で動作
- [ ] ヘッダー、サイドバー、フッターが本体サイトの `.card` / `.btn--primary` / `.feature-card` コンポーネント言語で統一
- [ ] 記事一覧・記事詳細も本体サイトのタイポグラフィ／間隔になっている
- [ ] 「運営者情報」メニュー項目が削除され、「運営者情報 → 五格について」誤遷移が消滅
- [ ] WP カスタマイザー「追加 CSS」パネルから [enumerated-booping-perlis.md § ⑥](enumerated-booping-perlis.md) の暫定 CSS を **削除**（子テーマへ移管したため）
- [ ] テスト記事 `kodomo-naraigoto-itsukara` を含む既存ページが壊れていない
- [ ] Lighthouse: Performance 75+ / Accessibility 90+ / Best Practices 90+

**非ゴール**: 記事投稿（`ブログ記事作成スタジオ/wp_publisher` 担当）、お問い合わせページ新設、Google+ SNS ボタン問題の根本解決（[enumerated-booping-perlis.md § 🚨 ③](enumerated-booping-perlis.md) TODO のまま）、Nano Banana 2 画像差し込み（別プラン）。

---

## アーキテクチャ

### サーバー側ファイル配置

```text
/home/pem/namae-studio.com/public_html/column.namae-studio.com/
└── wp-content/
    └── themes/
        ├── affinger4/                 ← 親テーマ（触らない）
        └── affinger4-child/           ← ★新設
            ├── style.css               ← ヘッダメタ + 全 CSS を集約
            ├── functions.php           ← 親スタイル enqueue + メニュー/ウィジェット登録
            ├── header.php              ← ヘッダー + グローバルナビ オーバーライド
            ├── footer.php              ← フッター オーバーライド
            ├── sidebar.php             ← ウィジェット領域 オーバーライド
            ├── single.php              ← 記事詳細（任意、必要なら後追い）
            ├── index.php               ← 記事一覧（任意、必要なら後追い）
            ├── screenshot.png          ← テーマ画像（テーマ選択画面用）
            └── assets/
                ├── fonts/              ← 不要（Google Fonts CDN 経由で読み込み）
                └── images/
                    └── logo-icon.png   ← 本体サイト流用（40×40）
```

### ローカル（リポジトリ）での作業先

リポジトリは namae-studio 本体のため、column 子テーマは直接リポジトリ直下に置かず、**作業ディレクトリ** を切る:

```text
名前診断スタジオ/
├── column-child-theme/            ← ★作業ルート（新設、.gitignore は外す）
│   └── affinger4-child/           ← このフォルダごと Xserver にアップロード
├── stitch-raw/
│   └── column/                    ← stitch2 生成 Zip の展開先（新設）
└── plans/
    ├── ui-ux-stitch2-immutable-corbato.md  ← 本プラン
    └── stitch-prompt-column-child.md       ← stitch2 プロンプト（新設）
```

### 依存関係とリスク

| リスク | 緩和策 |
|---|---|
| AFFINGER4 親テーマのアップデートで子テーマの前提が崩れる | 親テーマ関数を直接呼ばず、WP コア関数（`wp_head`/`wp_footer`/`wp_nav_menu`/`dynamic_sidebar`）のみ使用 |
| 既存カスタマイザー設定（カラー 3 系統）との二重適用 | 子テーマ `style.css` で `!important` を乱用せず、CSS 変数経由で上書き。競合時は DevTools で調査 |
| プラグイン（SiteGuard / BackWPup / XML Sitemap Generator）との干渉 | `wp_head()` / `wp_footer()` を必ず呼ぶ。ログイン URL `/kodomo-login/` を忘れない |
| テーマ切替時に WP 内部キャッシュが残る | 切替後 `Ctrl+F5` + （もしあれば）キャッシュプラグインのクリア |
| Xserver ファイルマネージャでのアップロード事故 | Zip 圧縮してアップ → サーバー側で展開、Dry run は FTP クライアントでも可 |

---

## Phase 1: 準備（エージェント担当、約 2〜3 時間）

### 1. AFFINGER4 親テーマ構造の調査

Xserver ファイルマネージャ（または FTP）で以下を取得し、ローカル `column-child-theme/parent-ref/` に保存（読み取り専用、参考資料）:

- `wp-content/themes/affinger4/header.php`
- `wp-content/themes/affinger4/footer.php`
- `wp-content/themes/affinger4/sidebar.php`
- `wp-content/themes/affinger4/functions.php`（関数名・フック名だけ把握）
- `wp-content/themes/affinger4/style.css`（既存 CSS 変数の有無確認）

目的: 子テーマで **残すべき WP フック**（`wp_head()`, `body_class()`, `wp_nav_menu()`, `dynamic_sidebar()`, `wp_footer()`, `get_search_form()` 等）を把握し、stitch2 生成 HTML に後から差し込む位置を決める。

### 2. 本体サイトの参考スクリーンショット撮影

主様が手動で撮影（各ページ PC + モバイル 375px）:

| ページ | URL | 撮影 | 保存先 |
| --- | --- | --- | --- |
| トップ | `https://namae-studio.com/` | PC 全景 + モバイル 全景 | `stitch-raw/column/ref/home-pc.png` 等 |
| 姓名判断 | `https://namae-studio.com/shindan.html` | フォーム周辺 + 結果画面 | `stitch-raw/column/ref/shindan-*.png` |
| 五格について | `https://namae-studio.com/about.html` | ヘッダ+カード本文 | `stitch-raw/column/ref/about-*.png` |
| フッター | 任意ページ下部 | フッター部アップ | `stitch-raw/column/ref/footer-pc.png` |

**撮影ツール**: Chrome DevTools → Device Toolbar → Capture Full Size Screenshot。

### 3. stitch2 プロンプト（一発投入用、コピペして stitch2 に貼るだけ）

下記ブロックをそのまま stitch2 の入力欄にコピペ。あわせて `stitch-raw/column/ref/*.png`（本体サイトのスクショ一式）を添付すると、参考画像として使ってくれる。

```text
【案件】
赤ちゃんの名付け育児コラム「子供の名付け診断コラム」（column.namae-studio.com、WordPress + AFFINGER4 子テーマ運用）のグローバル UI を全面リニューアルしたい。本体サイト「名前診断スタジオ」（namae-studio.com、添付スクショ参照）のトーンを完全踏襲し、コラム側も全く同じ世界観にしてほしい。

【コンセプト】
和モダン × ぬくもり。赤ちゃんの名付けに悩むママ・パパに寄り添う、やさしくあたたかい世界観。装飾は控えめ、余白を活かし、カードの丸みとグラデ装飾で親しみを出す。

【タイポグラフィ】
- 見出し: "Zen Maru Gothic"（Google Fonts、ウェイト 700 / 900）
- 本文: "Noto Sans JP"（Google Fonts、ウェイト 300 / 400 / 500 / 700）
- 以下は絶対禁止: Inter / Roboto / Arial / Helvetica / system-ui / sans-serif 総称

【カラートークン】（必ず CSS 変数経由で使用、直値ベタ書きは禁止）
--color-terracotta: #E8725C       /* メイン、CTA、リンク、アクセント */
--color-terracotta-dark: #D05A46  /* ホバー */
--color-sage: #6EC4A8             /* サブ */
--color-gold: #F0B84D             /* アクセント */
--color-cream: #FFF8F0            /* ページ背景 */
--color-white: #FFFFFF            /* カード背景 */
--color-dark: #3D3029             /* 本文 */
--color-medium: #5C4F44
--color-muted: #8A7D73            /* キャプション・日付 */
--color-border: #EDE5DA           /* 区切り線 */

【コアコンポーネント（本体サイトから継承、必ず準拠）】
- .card: 白背景 / 角丸 20px / 上部に 3px グラデライン（テラコッタ→ゴールド→セージ）/ 影 0 2px 8px rgba(61,48,41,0.08)
- .btn--primary: テラコッタのリニアグラデ / 白文字 / 角丸 full / パディング 14px 28px / ホバーで translateY(-2px) + 影強調
- .btn--outline: 2px テラコッタ枠線 / 背景透明 / ホバーで塗りテラコッタ
- .feature-card: .card の派生、ホバーで translateY(-6px) + rotate(-1deg)
- .badge: セージ塗り / 白文字 / 角丸 full / 極小

【命名規約】
BEM 厳守（.block__element--modifier）。独自の wrapper-1 / container-v2 等の無意味な連番は禁止。本体サイトの既存クラス名（.card, .btn--primary, .feature-card, .page-header, .site-nav, .site-footer）が流用できる箇所は優先して使う。

【モーション】
- 登場: fade-in + slide-up を 0.2s / 0.4s / 0.6s の段階遅延で
- ホバー: 150〜300ms ease-out
- ダークモード対応は不要

【レスポンシブ】
モバイルファースト。≤767px で 1 列スタック、768px〜 で 2〜3 列グリッド。コンテナ最大幅 1200px。

【生成する画面・パーツ（この順で）】

1. Site Header（header.php の静的骨格として）
   - 上段: サイト名「子供の名付け診断コラム」（h1, Zen Maru Gothic 900, ダーク色）+ キャッチ「赤ちゃんの名付けを楽しく学ぶコラム」（小さめ, muted 色）
   - 下段: グローバルナビ（横並び **6 項目固定**, センター寄せ）
     - ホーム / 姓名判断 / 名前提案 / 人気ランキング / 漢字図鑑 / 名付けガイド
     - ホバー背景: rgba(232,114,92,0.12), テキスト色はテラコッタに
     - aria-current="page" 対応
   - モバイル（≤767px）はハンバーガー → 右からスライドインのドロワー
   - 「運営者情報」「お問い合わせ」「About」などは絶対に入れない

2. Sidebar（sidebar.php、PC 300px 幅、モバイルでは本文下に折り畳み）
   - 検索ボックス（角丸 full の白背景 + 虫眼鏡アイコン + プレースホルダ「キーワードで探す」）
   - カテゴリーリスト（bullet の代わりにテラコッタの小円、ホバーで下線）
   - CTA カード（.card として）:
     見出し「無料で姓名判断を試す」
     本文「姓と名を入れるだけで 五格の運勢がすぐわかります」
     .btn--primary「診断ページへ →」（href="https://namae-studio.com/shindan.html"）
   - 新着記事ウィジェット（サムネ 64px + タイトル 2 行 + 日付）

3. Site Footer（footer.php 用）
   - クリーム背景
   - ブランド名 + タグライン（センター）
   - カテゴリーリンク 2 列
   - 「本体サイトで姓名判断を試す」.btn--outline（href="https://namae-studio.com/"）
   - コピーライト「© 2026 子供の名付け診断コラム」

4. Article List Item（.article-card、記事一覧ページ用）
   - アイキャッチ（16:9、角丸 20px）
   - 左上にカテゴリ .badge
   - タイトル（Zen Maru Gothic 700、2 行クランプ）
   - 抜粋（Noto Sans JP 400、3 行クランプ）
   - 日付 + 読了時間（muted、小さめ）
   - カード全体クリッカブル、ホバーで translateY(-4px) + 影強調

5. Article Detail Layout（single.php 相当、記事詳細ページ）
   - ヒーロー: アイキャッチフル幅（高さ PC 400px / モバイル 240px）+ タイトル（白文字 + ダークオーバーレイ）+ 日付 + カテゴリ
   - パンくず: home > カテゴリ > タイトル（区切り ">"、muted）
   - 本文エリア最大幅 720px、Noto Sans JP 17px、行間 1.9
   - h2: 下線テラコッタ 3px、Zen Maru Gothic 700
   - h3: 左線テラコッタ 4px、パディング左 12px
   - p: マージン 1.5em 縦
   - blockquote: クリーム背景 + 左線テラコッタ + パディング 20px
   - ul / ol: マーカーをテラコッタ小円に置換
   - シェアボタン: X / LINE / はてブ / URL コピー の 4 つだけ（Google+ は絶対に含めない）
   - 記事下に「関連記事」.feature-card 3 枚横並び（モバイルで縦積み）

6. Pagination
   - 数字ボタン（角丸 full、間隔 8px）
   - 現在ページはテラコッタ塗りで白文字、他は白背景でテラコッタ文字
   - 先頭末尾に「‹」「›」の矢印アイコン

7. Breadcrumb Partial（ヘッダーと本文の間に置く小パーツ）
   - muted カラー / 14px / 区切り ">"

【出力形式】
- セマンティック HTML5（header / nav / main / article / aside / footer / section）
- <html lang="ja">
- 見出し階層を守る（h1 → h2 → h3）
- aria-label / aria-current / role を適切に付与
- CSS は <style> タグでも別ファイルでも可。CSS 変数 --color-* / --font-* をベースに
- 静的骨格で OK（WordPress の動的部 wp_nav_menu / dynamic_sidebar は後で差し込む）

【絶対禁止】
- React / Vue / Svelte / Next.js 等フレームワーク禁止、素の HTML/CSS のみ
- TailwindCSS / Bootstrap 禁止、ユーティリティクラスは自作
- Google Fonts 以外のカスタムフォント読み込み禁止
- 色の直値ベタ書き禁止（必ず var(--color-*) 経由）
- ダークモード対応コード不要
- 「運営者情報」「About Us」「お問い合わせ」などのメニュー項目は入れない

【参考画像】
添付した本体サイトスクショ（home-pc / home-mobile / shindan-pc / shindan-result / about-pc / footer-pc）のトーンを column 専用に展開してほしい。特に次の 4 点は必ず再現:
1. .card 上部の 3px グラデライン（テラコッタ→ゴールド→セージ）
2. ボタンの丸み（角丸 full）とテラコッタグラデ
3. Zen Maru Gothic 見出しのやわらかい雰囲気
4. ホバー時の translateY 浮き上がりモーション
```

### 4. 子テーマ雛形の作成（ローカル）

本プランに従い、`column-child-theme/affinger4-child/` に以下を先にセットアップ:

#### `style.css`（ヘッダメタ + 最低限の変数定義）

```css
/*
Theme Name: AFFINGER4 Child — namae-studio column
Theme URI: https://column.namae-studio.com/
Description: column.namae-studio.com 専用 AFFINGER4 子テーマ。本体 namae-studio.com の和モダン×ぬくもりデザインを継承。
Author: namae-studio
Template: affinger4
Version: 1.0.0
Text Domain: affinger4-child
*/

/* === Design Tokens（本体 css/variables.css からポート） === */
:root {
  --color-terracotta: #E8725C;
  --color-terracotta-dark: #D05A46;
  --color-sage: #6EC4A8;
  --color-gold: #F0B84D;
  --color-cream: #FFF8F0;
  --color-white: #FFFFFF;
  --color-dark: #3D3029;
  --color-medium: #5C4F44;
  --color-muted: #8A7D73;
  --color-border: #EDE5DA;

  --font-heading: "Zen Maru Gothic", serif;
  --font-body: "Noto Sans JP", sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 32px;
  --radius-full: 9999px;

  --shadow-card: 0 2px 8px rgba(61, 48, 41, 0.08);
  --shadow-card-hover: 0 8px 24px rgba(61, 48, 41, 0.12);

  --transition-fast: 150ms;
  --transition-default: 300ms;
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* === Phase 2 で stitch2 生成 CSS がここに追記される === */
```

#### `functions.php`

```php
<?php
/**
 * AFFINGER4 Child theme functions
 */

// Google Fonts + 親テーマ + 子テーマスタイルを順序付きで読み込み
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'google-fonts-zen-maru',
        'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'affinger4-parent',
        get_template_directory_uri() . '/style.css',
        ['google-fonts-zen-maru'],
        wp_get_theme('affinger4')->get('Version')
    );
    wp_enqueue_style(
        'affinger4-child',
        get_stylesheet_directory_uri() . '/style.css',
        ['affinger4-parent'],
        wp_get_theme()->get('Version')
    );
});

// グローバルナビのメニューロケーション登録（親と整合）
add_action('after_setup_theme', function () {
    register_nav_menus([
        'primary-menu' => __('グローバルナビ', 'affinger4-child'),
    ]);
});

// サイドバーのウィジェットエリア登録（親と整合、enumerated-booping-perlis で設定済のものが引き継がれる）
add_action('widgets_init', function () {
    register_sidebar([
        'name' => __('サイドバーウィジェット', 'affinger4-child'),
        'id' => 'sidebar-1',
        'before_widget' => '<div class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget__title">',
        'after_title' => '</h3>',
    ]);
});
```

#### `screenshot.png`

[assets/images/og-image.png](../assets/images/og-image.png) を 1200×900 にリサイズして流用、または本体トップのキャプチャを使う。

**この時点では `header.php` / `footer.php` / `sidebar.php` は作らない**。stitch2 生成 HTML を貼り付ける土台として Phase 2 で生成する。

### 5. `.gitignore` の確認

`column-child-theme/` と `stitch-raw/` は **リポジトリに含める**（Git 管理する）。すでに `.gitignore` で `stitch-raw/` 等が除外されている可能性があるので確認し、必要なら除外を解除。

---

## ⏸ USER CHECKPOINT: stitch2 生成（主様担当、1〜2 時間）

Phase 1 完了時点でエージェントは **必ず停止** し、主様に以下を依頼する:

1. `plans/stitch-prompt-column-child.md` を stitch2 に投入
2. 参考スクショ `stitch-raw/column/ref/*.png` をアップロード
3. stitch2 で生成 → Zip ダウンロード
4. Zip を `stitch-raw/column/` に展開（raw ファイルをそのまま）
5. 主様から「stitch2 貼り付け完了」の報告を受けたらエージェントは Phase 2 に進む

> [plans/4-ui-ux-stitch2-cheeky-haven.md § 貼り付け受入先](4-ui-ux-stitch2-cheeky-haven.md) と同じルール。生の stitch2 出力は production 側（`column-child-theme/affinger4-child/`）に直接置かず、`stitch-raw/` で一旦受けてから標準化する。

---

## Phase 2: 標準化＋子テーマ組み立て（エージェント担当、約 5〜6 時間）

### stitch2 生成物の実測（2026-04-24 受領、`stitch2/` フォルダ）

受領した Zip の内訳:

- `stitch2/stitch_ (8)/stitch_/_1/` → **記事詳細ページ** HTML + DESIGN.md + screen.png
- `stitch2/stitch_ (8)/stitch_/_2/` → **記事一覧ページ** HTML + screen.png
- `stitch2/stitch_ (9)/` → `_1/` と完全重複（削除可）

生成物がプロンプト指示を無視している項目（Phase 2 で矯正必須）:

| プロンプト指示 | stitch2 実出力 | 対処 |
| --- | --- | --- |
| TailwindCSS 禁止 | `<script src="https://cdn.tailwindcss.com">` 使用 | `<script>` タグ削除、Tailwind utility を全 BEM CSS に書き直し |
| 色の直値ベタ書き禁止 | `text-[#D05A46]` `bg-[#FCFAF8]` 等多数 | `var(--color-*)` に全置換 |
| ダークモード対応不要 | `dark:text-stone-400` 等が全要素に付与 | `dark:*` prefix を全削除 |
| primary は #E8725C | Material Design 3 の primary #A23E2C（暗い赤） | primary を `--color-terracotta #E8725C` に矯正 |
| （指示なし） | Material Symbols アイコン使用 | SVG or Unicode（`›` `‹` `＋`）に置換、`<link>` 削除 |
| BEM 厳守 | 一部 `.article-card` のみ BEM、残りは Tailwind utility | 全要素を BEM ブロック/エレメントに再編成 |

良い点（そのまま活かせる）:

- HTML セマンティック構造（`<nav>` `<header>` `<main>` `<article>` `<aside>` `<footer>`）
- `<html lang="ja">`、`aria-label`、`aria-current` 等 a11y 属性
- 3px グラデライン装飾（`bg-gradient-to-r from-[#E8725C] via-[#bf8c23] to-[#006b54]`）の構造
- レイアウトグリッド（2 カラム、カード 2×2）とコンテンツコピー

### 6. 採用バージョン選別と Agent Team 並列実装

**採用版を 2026-04-24 確定**:

- 記事一覧: `stitch2/stitch_ (10)/code.html`（ドット背景が強め、サイドバー CTA が refine された版）
- 記事詳細: `stitch2/stitch_ (11)/code.html`（v1 とほぼ同等だが最新版）
- 不採用（削除可）: `stitch_ (8)` と `stitch_ (9)` のフォルダ

**Agent Team 並列構成（メイン + 2 並列サブエージェント）**:

```text
[Main Agent]
 ├─ Phase 1 準備（雛形作成、style.css メタ、functions.php、screenshot）
 ├─ Phase 2 並列起動:
 │   ├── Agent A: stitch_ (10) → 一覧 BEM HTML + CSS 抽出（header + sidebar + index ブロック）
 │   └── Agent B: stitch_ (11) → 詳細 BEM HTML + CSS 抽出（single + hero + 関連記事ブロック）
 ├─ Phase 2 マージ（Main が両出力を合成）:
 │   ├── header.php（Agent A の header 部分 + WP フック挿入）
 │   ├── footer.php（両者の footer を統合）
 │   ├── sidebar.php（Agent A + B の sidebar を統合、dynamic_sidebar 化）
 │   ├── index.php（Agent A の記事カードグリッド + WP Loop）
 │   ├── single.php（Agent B の hero + 本文 + 関連記事 + WP タグ）
 │   └── style.css（両者の抽出 CSS をマージ、BEM 重複排除）
 ├─ Phase 2 検証: Playwright（webapp-testing skill）で静的プレビュー検証
 └─ Phase 3 デプロイ: Zip 化 → 主様へ手順通知 → commit/push
```

Agent A / B の具体タスクは「stitch2 code.html を入力、下記 6 項目を実行、BEM 化された成果物を出力」:

1. **ヘッダ整理**: `<script src="https://cdn.tailwindcss.com">` と Material Symbols の `<link>` を削除
2. **色矯正**: インライン `#A23E2C` / `#FCFAF8` 等を `var(--color-terracotta)` `var(--color-cream)` 等に置換
3. **ダークモード除去**: `dark:*` prefix を全削除（sed で一括可能）
4. **Tailwind utility → BEM 化**:
   - `flex justify-between items-center` → `.site-header__container`（display:flex; 等を子テーマ CSS に）
   - `w-10 h-10 rounded-full bg-primary-container` → `.pagination__btn--current`
   - 命名規則は本体サイト [css/components.css](../css/components.css) と揃える
5. **Material Symbols 代替**:
   - `chevron_left` / `chevron_right` → Unicode `‹` `›` or SVG
   - `bookmark_add` → SVG（`<svg>` インライン、`--color-muted` 基調）
   - `calendar_today` → 削除 or SVG
6. **本体既存コンポーネント再利用**: `.card` / `.btn--primary` / `.feature-card` に寄せる
7. **ブレークポイント統一**: Tailwind `md:` (768px) は本体と同一なので保持、`lg:` (1024px) は本体慣習に合わせ 960px で上書き

### 7. `header.php` を作成（新規）

stitch2 の Header HTML を `column-child-theme/affinger4-child/header.php` に移植。必須の WP フック/関数:

- `<!DOCTYPE html>` + `<html <?php language_attributes(); ?>>`
- `<head>` 内: `<meta charset>` / `<meta viewport>` / `<?php wp_head(); ?>`
- `<body <?php body_class(); ?>>`
- サイトタイトル部分: `<?php bloginfo('name'); ?>` / `<?php bloginfo('description'); ?>` or `<?php echo get_bloginfo('name'); ?>`
- ロゴ: `<?php if (has_custom_logo()) { the_custom_logo(); } ?>`
- ナビ: `<?php wp_nav_menu(['theme_location' => 'primary-menu', 'container_class' => 'site-nav', 'menu_class' => 'site-nav__list']); ?>`
- モバイルハンバーガーのトグル JS は stitch2 生成物をそのまま使うか、最小のインライン JS に

### 8. `footer.php` を作成（新規）

stitch2 の Footer HTML を移植。必須:

- `<?php wp_footer(); ?>` を `</body>` 直前に
- コピーライト動的: `<?php echo date('Y'); ?>`

### 9. `sidebar.php` を作成（新規）

stitch2 の Sidebar HTML を移植。既存ウィジェット（検索 + カテゴリー + CTA カードの HTML ウィジェット）は **WP 管理画面側の設定をそのまま活かす** ので:

- 検索: `<?php get_search_form(); ?>` or `<?php dynamic_sidebar('sidebar-1'); ?>`
- シンプルに `<aside class="sidebar"><?php dynamic_sidebar('sidebar-1'); ?></aside>` にし、具体的なウィジェット中身は管理画面に任せる設計を推奨

### 10. `style.css` に stitch2 CSS を追記

`column-child-theme/affinger4-child/style.css` の「Phase 2 で追記」コメント以降に:

- 本体 [css/components.css](../css/components.css) から `.card` / `.btn--primary` / `.btn--outline` / `.feature-card` / `.badge` 定義をポート
- stitch2 抽出 CSS を BEM 化した上で追記
- 親テーマ CSS を **上書き** するためにセレクタ特異性を意識（ただし `!important` は最終手段）

### 11. `single.php` / `index.php`（今回は作成）

主様が全面リニューアル方針を選んだため両方作成:

- `index.php`: Agent A の記事カードグリッド + WordPress Loop（`have_posts()` / `the_post()` / `the_title()` / `the_permalink()` / `the_post_thumbnail()` / `the_excerpt()` / `get_the_category()` / `the_time('Y.m.d')`）
- `single.php`: Agent B の hero（`the_post_thumbnail('full')` + `the_title()` + `the_time`）+ 本文（`the_content()`）+ 関連記事（`get_posts` で同カテゴリ 3 件）

### 12. Playwright による静的プレビュー検証（webapp-testing skill）

子テーマ実装完了後、以下を検証:

1. `column-child-theme/affinger4-child/preview/index.html`（PHP タグを展開したスタティック版）を生成
2. `column-child-theme/affinger4-child/preview/single.html`（同上）
3. webapp-testing skill で起動:
   - Chromium で両 HTML 表示
   - PC 1200px / タブレット 768px / モバイル 375px で screenshot
   - コンソールエラー ゼロ確認
   - 主要セレクタ存在確認（`.site-header`, `.site-nav`, `.article-card`, `.btn--primary`, `.card` の 3px グラデライン）
4. スクショを `stitch-raw/column/verify/*.png` に保存し、stitch2 の screen.png と目視比較

### 12-b. ビルド時チェック（ローカル）

- HTML lint（W3C Validator 経由、任意）
- アクセシビリティ: `lang="ja"`, `aria-label`, 見出しレベル, コントラスト比
- CSS: 未使用ルール整理、`!important` 使用数 < 5
- PHP 文法: `php -l` で各 `.php` ファイルをチェック

---

## Phase 3: デプロイ＋メニュー整理（エージェント + 主様、約 30 分〜1 時間）

### 13. git commit + push（エージェント実施、主様の memory 方針に従い承認不要で自走）

- commit メッセージ: `feat: column 子テーマ affinger4-child 新設 (stitch2 → BEM 変換、UI/UX 本体統一)`
- push 先: `origin master`
- 対象ファイル:
  - `column-child-theme/affinger4-child/**/*`
  - `plans/ui-ux-stitch2-immutable-corbato.md`（本プラン、実行ログ追記）
  - `stitch-raw/column/verify/*.png`（Playwright 検証結果）
  - `.gitignore` 調整（`stitch2/` フォルダは履歴に含めるか判断）

### 14. 子テーマ Zip を作成 → 主様が Xserver にアップロード

エージェント実施: `column-child-theme/affinger4-child.zip` を作成し、リポジトリ直下 or `dist/` に置く。

主様実施（手動、5 分）:
1. 生成された `affinger4-child.zip` を Xserver ファイルマネージャへアップ
2. アップロード先: `/home/pem/namae-studio.com/public_html/column.namae-studio.com/wp-content/themes/`
3. サーバー側で Zip 右クリック → 展開 → `affinger4-child/` フォルダが生成される
4. Zip 本体は削除

### 14. WP 管理画面でテーマを有効化

1. `https://column.namae-studio.com/kodomo-login/` からログイン
2. **外観 → テーマ**
3. `AFFINGER4 Child — namae-studio column` カードで **「有効化」** クリック
4. フロントページを別タブで確認、大崩れしていなければ OK

### 15. メニュー項目「運営者情報」削除

1. **外観 → メニュー**
2. 編集対象メニューを開き、「運営者情報」項目を削除
3. メニュー位置: 子テーマで `primary-menu` 登録した場所にチェック
4. 「メニューを保存」

### 16. カスタマイザー追加 CSS のクリーンアップ

[enumerated-booping-perlis.md § ⑥](enumerated-booping-perlis.md) で暫定投入した `#headbox-bg` 等の CSS は子テーマに移管済のため **全削除**:

1. **外観 → カスタマイズ → 追加 CSS**
2. 既存の暫定 CSS を全削除
3. 「公開」

### 17. サイドバーウィジェットの再確認

enumerated-booping-perlis で設定した 検索 + CTA カード が子テーマでも正しく表示されているかチェック。崩れていたら HTML/CSS 調整。

---

## Phase 4: 検証（エージェント + 主様、約 30 分）

### 18. Playwright による live サイト検証（webapp-testing skill、エージェント実施）

主様が Xserver アップロード＋テーマ有効化完了を報告した直後、エージェントが以下を実施:

- Chromium で `https://column.namae-studio.com/` をロード、PC/タブレット/モバイル 3 解像度で screenshot
- `https://column.namae-studio.com/kodomo-naraigoto-itsukara/` 記事詳細でも同様
- 主要セレクタ存在確認（`.site-header`、`.site-nav`、`.article-card`、`.btn--primary`）
- console.error が出ていないこと
- 404/リソース読込失敗がないこと
- スクショを `stitch-raw/column/verify/live-*.png` に保存、commit に含める

表示確認（シークレットウィンドウ、主様が目視）:

- `https://column.namae-studio.com/` トップ
- `https://column.namae-studio.com/kodomo-naraigoto-itsukara/` テスト記事（記事詳細レイアウト）
- 任意カテゴリーページ（アーカイブレイアウト）

### 19. 機能確認チェックリスト

- [ ] PC 表示: グローバルナビ 6 項目が 1 行横並び、Zen Maru Gothic + テラコッタホバー
- [ ] モバイル 375px: ハンバーガー → ドロワー、タップで開閉
- [ ] サイドバー: 検索 + カテゴリ + CTA カード、本体トーンで表示
- [ ] 記事一覧カード: タイトル Zen Maru Gothic、本文 Noto Sans JP、カード角丸 20px
- [ ] 記事詳細: h1/h2/h3 タイポグラフィ、本文間隔、シェアボタン
- [ ] フッター: ブランド + コピーライト、クリーム背景
- [ ] 「運営者情報」がナビに存在しない
- [ ] 既存本体サイトからの UTM 付きリンク（PR #1 で設置済）が壊れていない

### 20. Lighthouse（DevTools → Lighthouse タブ）

- Performance: 75+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

記事 1 本だけの状態なので Performance は低めでも可。カスタムフォント読み込みで LCP がやや重くなる可能性あり（`font-display: swap` で緩和）。

### 21. 保険として元テーマへの復帰手順

万一重大な崩れが出たら:
1. FTP で `affinger4-child/style.css` を開き、Theme Name を一時改名（例: `AFFINGER4 Child (DISABLED)`）
2. 管理画面リロード → AFFINGER4 親に自動フォールバック
3. または管理画面から手動で親テーマに戻す

---

## Critical Files

### 新規作成（ローカル）

- [plans/stitch-prompt-column-child.md](stitch-prompt-column-child.md) — stitch2 投入用プロンプト
- `column-child-theme/affinger4-child/style.css` — メタ + CSS 変数 + stitch2 CSS 合成
- `column-child-theme/affinger4-child/functions.php` — 親スタイル enqueue + メニュー/ウィジェット登録
- `column-child-theme/affinger4-child/header.php` — stitch2 Header 移植
- `column-child-theme/affinger4-child/footer.php` — stitch2 Footer 移植
- `column-child-theme/affinger4-child/sidebar.php` — stitch2 Sidebar 移植
- `column-child-theme/affinger4-child/screenshot.png` — テーマピッカー用
- `column-child-theme/parent-ref/*.php` — AFFINGER4 親テーマの参照コピー（読み取り専用）
- `stitch-raw/column/ref/*.png` — 本体サイトスクショ（stitch2 投入用）
- `stitch-raw/column/*.html`, `*.css` — stitch2 生成物（raw）

### 参照・流用（修正しない）

- [css/variables.css](../css/variables.css) — デザイントークン一次資料
- [css/components.css](../css/components.css) — `.card` / `.btn--primary` / `.feature-card` 定義
- [css/pages/about.css](../css/pages/about.css) — `.page-header` パターン参考
- [index.html](../index.html) / [shindan.html](../shindan.html) / [about.html](../about.html) — スクショ撮影対象

### サーバー配置先

- `/home/pem/namae-studio.com/public_html/column.namae-studio.com/wp-content/themes/affinger4-child/`

---

## Verification（総合確認）

### 必須通過項目

1. 子テーマ有効化後、フロントの大崩れなし
2. グローバルナビ 6 項目 PC 1 行表示
3. 「運営者情報」クリック → 404 or 未設定の状態（削除済）
4. モバイルでハンバーガーメニュー動作
5. カスタマイザー追加 CSS パネルが空に戻っている
6. Lighthouse: Accessibility 90+ / SEO 90+

### 推奨追加チェック

7. シークレットモードで別ブラウザ（Firefox / Safari）でも破綻なし
8. 記事詳細ページで h2/h3 の行間が 1.6〜1.8 に揃う
9. テラコッタホバー（リンク色）が 150ms で滑らかに

### 長期観測（デプロイ後 1 週間）

10. Search Console に新たなクロールエラーが出ていないか
11. GA4（導入後）で直帰率・滞在時間の変化を観察
12. AdSense 審査を将来出す際、ページ体験スコアが上がっているか

---

## 本プランで扱わない事項（次プラン種）

### A. お問い合わせページ新設

AdSense 審査 / アフィリ審査で必要になる可能性。Contact Form 7 + 固定ページで対応、別プラン。

### B. Nano Banana 2 画像挿入

ヒーロー画像、サイドバー装飾等に和風イラストを差し込む。[enumerated-booping-perlis.md § 今回やらないこと](enumerated-booping-perlis.md) に記載済の積み残し。本プランで子テーマ基盤ができれば、カスタム HTML ブロックで簡単に追加できるようになる。

### C. 投稿ページの SNS ボタン問題（Google+）

[enumerated-booping-perlis.md § 🚨 ③](enumerated-booping-perlis.md) TODO。AddToAny プラグイン導入 or 子テーマ CSS で `.google-plus-btn` 非表示。本プラン完了後、記事自動投入（`ブログ記事作成スタジオ/wp_publisher`）の前に別プランで着手。

### D. 本体サイトの `/kanji/{漢字}` 等 SEO コンテンツ量産

[plans/4-ui-ux-stitch2-cheeky-haven.md § Phase 3 SEO 集客 5 本盛り](4-ui-ux-stitch2-cheeky-haven.md) の積み残し。column 側の UI が整ったら、本体側の量産テンプレ化に戻る流れ。

---

## 実行ログ

（作業完了時に各 Phase ごと追記）

### Phase 1 & 2（エージェント実装、2026-04-24）

採用バージョン: `stitch_ (10)`（記事一覧）+ `stitch_ (11)`（記事詳細）。メインエージェントが BEM 化と組み立てを一括で担当（並列分割はコンテキスト的に非効率のため 1 エージェントで実行）。

成果物 `column-child-theme/affinger4-child/`:

- [x] `style.css` — 1481 行。デザイントークン（テラコッタ/セージ/ゴールド/クリーム）、Site Header（6 項目ナビ）、Article card grid、Article hero、Article body タイポグラフィ、Share bar、Related、Sidebar widgets、Site footer、Pagination、Reveal アニメを全て BEM で定義。Tailwind / dark mode / Material Symbols 依存は完全排除。
- [x] `functions.php` — 親スタイル→子スタイルの順序付き enqueue、`primary-menu` / `footer-menu` 登録、`sidebar-1` ウィジェットエリア登録、`nav_menu_link_attributes` で自動 BEM クラス付与、`affinger4_child_breadcrumb()` / `affinger4_child_related_posts()` ヘルパ、preconnect 最適化。
- [x] `header.php` — `site-header__brand` + タグライン、ハンバーガー、`wp_nav_menu(primary-menu)` + 未設定時フォールバック 6 項目（運営者情報なし）。
- [x] `sidebar.php` — `dynamic_sidebar('sidebar-1')` 優先、未設定時フォールバック（検索 + カテゴリ + CTA ボタン）。
- [x] `footer.php` — ブランド + タグライン + footer-menu + 本体サイト導線 `.btn--outline` + 動的年号コピーライト。
- [x] `index.php` — WP Loop + アイキャッチ + カテゴリバッジ + `paginate_links()` の BEM ラッパ。
- [x] `single.php` — `article-hero`（アイキャッチ全幅 + グラデオーバーレイ）+ パンくず + `article-body`（h2/h3 タイポ、blockquote、ul 再マーク）+ X/LINE/はてブ/URL コピーの share-bar（**Google+ 完全除外**）+ 関連記事 3 件グリッド。
- [x] `assets/js/nav.js` — ハンバーガー開閉（aria-expanded 連動）、ESC で閉じる、リンククリックで閉じる、`data-copy-url` で Clipboard API コピー、IntersectionObserver で reveal。
- [x] `assets/images/placeholder-eyecatch.svg` — アイキャッチ未設定時のグラデプレースホルダ（640×360、3px グラデ装飾付き）。
- [x] `README.md` — ファイル構成、デプロイ手順、復帰手順、推奨ウィジェット HTML。

構文検証: CSS brace `{=180, }=180`、全 PHP ファイルの `{}` と `()` カウントも一致、`node --check nav.js` 通過。PHP は Windows ローカルに入っていないため `php -l` はスキップ（本番 WordPress は PHP 8.x で実行されるため、本番前に管理画面のテーマ有効化で構文エラーは即検出可能）。

### Phase 3（デプロイ、主様担当）

エージェントが生成した `dist/affinger4-child.zip`（約 21 KB）を主様が Xserver にアップロードし、以下を実施する:

- [ ] `/home/pem/namae-studio.com/public_html/column.namae-studio.com/wp-content/themes/` に Zip アップロード → サーバー側で展開
- [ ] WP 管理画面 → 外観 → テーマ → 「AFFINGER4 Child — namae-studio column」を **有効化**
- [ ] 外観 → メニュー → グローバルナビ（子テーマ）に 6 項目（ホーム／姓名判断／名前提案／人気ランキング／漢字図鑑／名付けガイド）を割り当て、**「運営者情報」は削除**
- [ ] 外観 → カスタマイズ → 追加 CSS を **全削除**（子テーマに移管済み）
- [ ] サイドバーウィジェット確認（検索 + カテゴリ + CTA カードの HTML）

### Phase 4（検証、有効化後）

- [ ] トップ `https://column.namae-studio.com/` 表示確認（PC/タブレット/モバイル）
- [ ] 記事詳細 `https://column.namae-studio.com/kodomo-naraigoto-itsukara/` 表示確認
- [ ] PC でグローバルナビ 6 項目が 1 行横並び
- [ ] モバイルでハンバーガー開閉
- [ ] 「運営者情報」クリック → 存在しない状態であることを確認
- [ ] Lighthouse: Accessibility 90+ / SEO 90+

### git

- [x] commit: `feat: column 子テーマ affinger4-child 新設 (stitch2 → BEM 変換)`
- [x] push: `origin master`
- `dist/affinger4-child.zip` は `.gitignore` 上の `dist/` にマッチするため未コミット（毎回 `Compress-Archive` で再生成する運用）。
