# Handlebars ビルドパイプライン稼働 + DESIGN.md 導入

## Context

### なぜ今この計画なのか
直近コミット `c54a0ec feat(tracking): Google Tag Manager (GTM-TKF64R7Q) を全公開ページに導入` で **27 ファイルに同じ 11 行の GTM スニペットを手作業挿入**したばかり。今後やりたい以下の作業がすべて「**27 ファイル一括編集**」になる：

| 今後やりたいこと | 現状の必要編集ファイル数 |
|----------------|----------------------|
| ナビに項目追加（例：辞典ハブ、お役立ちハブ） | 27 |
| OGP/Twitter Card メタの調整 | 27 |
| GTM コンテナ ID 切替・GA4 直接スニペット併用 | 27 |
| GDPR Cookie 同意バナー追加 | 27 |
| Phase 3 の追加ページ（漢字辞典 残 290 字、ranking 続編、guide 続編） | 都度新規 27 ページ手書き |

加えて Google Stitch（stitch.withgoogle.com）が **2026-04-21 に DESIGN.md 仕様を Apache-2.0 で OSS 公開**。これによって以下が可能になった：

- DESIGN.md（プロジェクトルートの Markdown 1 枚）に色・フォント・コンポーネント・命名規約を YAML で記述
- Claude Code / Cursor / Copilot / Stitch2 が機械可読で参照
- **stitch2 の「Import Design」機能で frontmatter を直接吸い込み、再生成時のブレを根絶**（[plans/4-ui-ux-stitch2-cheeky-haven.md:347](../plans/4-ui-ux-stitch2-cheeky-haven.md#L347) の「再生成すると既存セクションが消える問題」に直接効く）

### 既存基盤（実装済み・再利用可）
- [templates/layouts/base.hbs](../templates/layouts/base.hbs) — HTML 骨格スカフォールド
- [templates/partials/head-meta.hbs](../templates/partials/head-meta.hbs) — `{{meta}}` 動的化済み（GTM スニペットだけ未統合）
- [templates/partials/nav.hbs](../templates/partials/nav.hbs) — `site.nav` ループ対応
- [templates/partials/footer.hbs](../templates/partials/footer.hbs) — 3 カラム実装済み
- [scripts/build.js](../scripts/build.js) — スカフォールドのみ（**未実装、本計画の本丸**）
- [content/home.json](../content/home.json) / [content/shindan.json](../content/shindan.json) / [content/about.json](../content/about.json) — 3 本の本文外部化済み（スキーマの正）
- [site.config.json](../site.config.json) — ブランド名・ドメイン・カラー・GA4 ID 等を完全外部化
- [js/core/](../js/core/) — storage / favorites / share / analytics / og-generator / router / ab-test 大部分実装済み
- [css/variables.css](../css/variables.css) — 43 カラー＋8 タイポ＋17 余白＋5 角丸＋11 影トークン完備（DESIGN.md の素材 85% 揃っている）

### 期待される成果
- **GTM 変更が 1 partial 修正で 27 ページ反映**
- ナビ追加が `site.config.json` の `nav` 配列に 1 行追加するだけで完了
- Phase 3 以降の新ページが「コンテンツ JSON 1 つ書くだけ」で自動生成
- Claude Code に DESIGN.md を読ませれば stitch2 を経由せずに直接 BEM・トークン準拠のページが書ける
- 50 サイト横展開構想（[plans/4-ui-ux-stitch2-cheeky-haven.md:199-283](../plans/4-ui-ux-stitch2-cheeky-haven.md#L199-L283)）の `site.config.json` + `DESIGN.md` 差し替えで別サイト化できる構造が実現

---

## スコープ外（本プランではやらない）

- Phase 3 の追加ページ実装（漢字辞典 残 290 字、ranking 続編、guide 続編）→ 基盤だけ整える
- AdSense `<ins>` タグの実配置
- GA4 カスタムイベント追加
- sitemap 自動生成（既存の手動 `sitemap.xml` をコピーのみ）
- OG 画像静的生成スクリプト
- PWA / Service Worker 復活（既存の SW 解除運用維持）
- vercel.json `headers` セクション・CSP の変更
- Husky / pre-commit フック導入
- column-child-theme / tool / netlify 周辺の統合

---

## 実装ステップ（11 段階）

### Step 1: 依存パッケージ追加
**触るファイル**: [package.json](../package.json)

```bash
npm i --save-dev handlebars fast-glob fs-extra gray-matter diff
```

`scripts` セクションに追加：
```json
{
  "build": "node scripts/build.js",
  "build:verify": "node scripts/build-verify.js",
  "build:diff": "node scripts/build-diff.js"
}
```

理由：`gray-matter` は DESIGN.md frontmatter のパース、`diff` はビルド前後のセマンティック差分検証用。

### Step 2: コンテンツ JSON スキーマ確定
**新規作成**: `scripts/schemas/page.schema.json`

統一スキーマ（既存 [content/home.json](../content/home.json) の構造を正として拡張）：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": ["page", "path", "meta", "layout"],
  "properties": {
    "page":         { "type": "string" },
    "path":         { "type": "string" },
    "layout":       { "enum": ["base", "kanji", "guide", "ranking", "minimal-404"] },
    "pageCss":      { "type": "string" },
    "bodyClass":    { "type": "string" },
    "navActive":    { "type": "string" },
    "meta":         { "$ref": "#/definitions/Meta" },
    "jsonLd":       { "type": ["array", "object", "null"] },
    "extraScripts": { "type": "array", "items": { "type": "string" } },
    "extraInlineScript": { "type": "string" },
    "sections":     { "type": "array" }
  }
}
```

### Step 3: scripts/build.js 本実装
**触るファイル**: [scripts/build.js](../scripts/build.js)（既存 scaffold 全書き換え）

実装機能：
1. `gray-matter` で `DESIGN.md` の frontmatter 読み出し → `site.design` にマージ
2. `site.config.json` を読み込み → `context.site` 構築
3. `templates/partials/*.hbs` を全 `Handlebars.registerPartial` 登録（kebab-case → camelCase 変換、命名規則は `templates/partials/README.md` に明記）
4. `templates/layouts/base.hbs` をルート、`templates/pages/*.hbs` を `{{{body}}}` slot にコンパイル
5. `content/**/*.json` を `fast-glob` で全列挙 → 各ページ context 構築 → レンダ → `dist/{path}.html` 出力
6. `kanji/_detail.hbs` × `data/kanji-meanings.json` のループで 11 漢字ページを一括生成（既存 `scripts/build-kanji-pages.mjs` のロジックを移植）
7. `fs-extra` で `css/`, `js/`, `assets/`, `data/`, `tool/`, `manifest.json`, `robots.txt`, `sitemap.xml`, `sw.js` を `dist/` へ再帰コピー
8. ビルドバージョンタグは `git rev-parse --short HEAD` を `buildVersion` として注入

**追加 helper**：
```js
Handlebars.registerHelper('isActive', (matchArr, currentPath) => /* nav */);
Handlebars.registerHelper('jsonLd', (obj) => new Handlebars.SafeString(
  '<script type="application/ld+json">' + JSON.stringify(obj, null, 2) + '</script>'
));
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('encodeURI', encodeURIComponent);
```

### Step 4: 既存 partial の追補
- [templates/partials/head-meta.hbs](../templates/partials/head-meta.hbs) — **GTM スニペットを `<title>` 直前に挿入**、`site.analytics.gtm.containerId` を変数化
- 新規 `templates/partials/gtm-noscript.hbs` — `<body>` 直後の noscript iframe
- [templates/partials/nav.hbs](../templates/partials/nav.hbs) — `nav__toggle` ボタン追加（モバイルメニュー）
- 新規 `templates/partials/skip-link.hbs` — a11y スキップリンク
- 新規 `templates/partials/json-ld.hbs` — `context.jsonLd` から SafeString レンダ
- 新規 `templates/partials/core-scripts.hbs` — `js/core/*` と page-specific スクリプトのロード一括
- 新規 `templates/partials/service-worker-unregister.hbs` — SW 解除ロジック切り出し

[templates/layouts/base.hbs](../templates/layouts/base.hbs) を以下構造に更新：
```handlebars
<!DOCTYPE html>
<html lang="{{site.locale.lang}}">
<head>{{> headMeta}}{{> jsonLd}}</head>
<body data-page="{{page}}"{{#if bodyClass}} class="{{bodyClass}}"{{/if}}>
{{> gtmNoscript}}
{{> skipLink}}
{{> nav}}
<main class="section" id="main-content" tabindex="-1">{{{body}}}</main>
{{> footer}}
{{> coreScripts}}
{{#if extraInlineScript}}<script>{{{extraInlineScript}}}</script>{{/if}}
{{> serviceWorkerUnregister}}
</body>
</html>
```

### Step 5: 27 ページ分の templates/pages 作成
ルート HTML から「`<nav>...</nav>` 直後 〜 `<footer>` 直前」のみを切り出して `templates/pages/{name}.hbs` に移植。kanji 11 ページは `kanji/_detail.hbs` 1 枚 + `data/kanji-meanings.json` 駆動。

### Step 6: site.config.json に GTM 追加
[site.config.json](../site.config.json) に `analytics.gtm.containerId: "GTM-TKF64R7Q"` を追加。

### Step 7: DESIGN.md 作成
**新規作成**: [DESIGN.md](../DESIGN.md)（プロジェクトルート）

Apache-2.0 OSS 仕様準拠、YAML frontmatter（colors / typography / spacing / radius / shadows / motion / layout / components / imagery / import）+ Markdown 8 セクション本文（Brand Voice / Color System / Typography / Spacing / Component Patterns / Motion / Accessibility / Operational Guide）。

YAML frontmatter ドラフト全体は [付録 A](#付録-a-designmd-yaml-frontmatter-ドラフト) を参照。**variables.css の全トークンを 1 対 1 でマッピング**し、各トークンに `role`（意味論）を付ける。

### Step 8: vercel.json 更新
[vercel.json](../vercel.json) に追加：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./templates ./content ./scripts ./site.config.json ./DESIGN.md ./data ./css ./js ./assets"
}
```
`headers` / CSP は不変（GTM/AdSense/GA4 は既に許可済み）。`cleanUrls: true` 維持で `dist/shindan.html` → `/shindan` ルーティング継続。

### Step 9: 検証スクリプト
**新規作成**: `scripts/build-verify.js`

ロジック：
1. ルート `*.html` と `dist/*.html` をペアで比較
2. `<title>`, `<meta description>`, OG/Twitter, GTM ID `GTM-TKF64R7Q` 文字列存在、`<noscript>` 内 GTM iframe 存在、JSON-LD の `JSON.parse` 可能性、CSS link 順序、JS script 順序を確認
3. 不一致が許容セット（バージョンタグ・空白・インデント）外なら exit 1

**新規作成**: `scripts/build-diff.js` — 人間レビュー用 unified diff Markdown 出力

### Step 10: .gitignore 更新
- `dist/` を追加（コミット禁止）
- `node_modules/` 既存維持

### Step 11: ロールバックパス確保
ルート直下 `*.html` は **削除しない**。`outputDirectory: dist` 切替後は使われないが、残しておけば `vercel.json` を revert するだけで即旧運用に戻れる。本番 7 日安定稼働後に別 PR で `_legacy/` 配下に `git mv` 退避（履歴保全）。

---

## Wave 戦略（段階移行）

「**index.html 1 枚で E2E 検証 → 採用 5 画面 → 残り 22 ページ**」の 3 波を強く推奨。一気にやるとロールバック時の単位がデカすぎる。

### Wave 1: index.html だけで E2E 検証（1 日）
1. Step 1〜3, 4 完了（依存追加、build.js 実装、partial 整備）
2. `templates/pages/index.hbs` のみ作成
3. `npm run build` → `dist/index.html` 生成
4. `npm run build:verify` で `index.html` vs `dist/index.html` の semantic diff = 0 確認
5. **vercel.json はまだ変更しない**（プレビュー専用ブランチでのみ outputDirectory 切替テスト）

### Wave 2: 既存 6 画面拡大（2 日）
1. `home, shindan, about, favorites, privacy-policy, 404` の 6 本追加
2. それぞれ build-verify が通ることを確認
3. **OK なら vercel.json を main にマージ**（残り 21 ページはルート直下にあるが outputDirectory: dist で無視される）
4. 本番デプロイ後 24 時間 GTM/GA4 計測継続を確認

### Wave 3: 残り 21 ページ（3〜5 日）
1. kanji 11 ページは `_detail.hbs` 1 枚 + JSON ループで一気に
2. ranking 3, guide 6, suggestion 1 を 1 ページずつ移植 + verify
3. 全部通ったら別 PR で `_legacy/` 退避

---

## Critical Files

### 修正対象（既存）
- [package.json](../package.json) — 依存と scripts 追加
- [vercel.json](../vercel.json) — buildCommand / outputDirectory
- [scripts/build.js](../scripts/build.js) — scaffold → 本実装（**最重要**）
- [templates/partials/head-meta.hbs](../templates/partials/head-meta.hbs) — GTM 統合
- [templates/partials/nav.hbs](../templates/partials/nav.hbs) — toggle 追加
- [templates/layouts/base.hbs](../templates/layouts/base.hbs) — partial 構成更新
- [site.config.json](../site.config.json) — `analytics.gtm.containerId` 追加
- [.gitignore](../.gitignore) — `dist/` 追加

### 新規作成（最重要 5 本）
- `DESIGN.md`（プロジェクトルート）
- `templates/pages/index.hbs`
- `templates/partials/json-ld.hbs`
- `scripts/build-verify.js`
- `scripts/schemas/page.schema.json`

### 新規作成（量産フェーズ）
- 24 本の `content/*.json`（privacy-policy / 404 / favorites / suggestion / kanji 系 / ranking 系 / guide 系）
- 26 本の `templates/pages/*.hbs`（kanji は `_detail.hbs` 1 枚で代替）
- 6 本の partial（gtm-noscript / skip-link / json-ld / core-scripts / service-worker-unregister / live-region）

### 再利用すべき既存資産（触らずコピー or 流用）
- [content/home.json](../content/home.json) / [content/shindan.json](../content/shindan.json) / [content/about.json](../content/about.json) — スキーマの正
- [js/core/](../js/core/) 全部 — そのままコピー
- [data/kanji-meanings.json](../data/kanji-meanings.json) — kanji ループ駆動データ
- [scripts/build-kanji-pages.mjs](../scripts/build-kanji-pages.mjs) の `renderPage` ロジック — Handlebars に移植して廃止
- [css/variables.css](../css/variables.css) 全トークン — DESIGN.md frontmatter のソースオブトゥルース

---

## 検証手順

### A. ビルド前後の差分検証（自動）
```bash
npm run build
npm run build:verify   # exit 0 必須（semantic diff = 0）
npm run build:diff     # 人間レビュー用 markdown 出力
```

### B. Vercel Preview で本番同等動作確認
1. branch push → Preview URL で全 27 ページ目視
2. `/shindan` フォーム送信、`/favorites` localStorage、`/kanji/蓮` 関連リンクの動作確認
3. Lighthouse: Performance 85+, Accessibility 95+, SEO 100
4. DevTools Network で CSS/JS 順序確認

### C. GTM 計測継続確認
1. GTM プレビューモード（Tag Manager の「プレビュー」）で Preview URL 入力
2. 各ページで `gtm.js`, `dataLayer.push`, GA4 `page_view` 発火確認
3. 既存タグの `Tags Fired` リストが 27 ページ全てで本番と同一

### D. DESIGN.md を Claude Code に読ませて新規ページ生成試行
1. 別セッションで `@DESIGN.md` を読み込ませる
2. プロンプト：「DESIGN.md に従って `/guide/akachan-fude` の hbs テンプレと content JSON を生成して」
3. 出力検証：色は frontmatter の token 経由のみ、フォントは `typography.families.{heading,body}` のみ、BEM 命名、JSON-LD が `Article` または `FAQPage`
4. stitch2 にも DESIGN.md を「Import Design」でアップロードし同等結果を確認

### E. CSP / セキュリティ
DevTools Network で AdSense/GTM/GA4 が想定通り動作確認、SW 解除確認（Application → Service Workers が空）

---

## ロールバック手順

### 即時（5 分以内）
1. Vercel Dashboard → Deployments → 直前安定デプロイで「Promote to Production」
2. `vercel.json` の旧版（buildCommand なし）が再公開、ルート HTML が再び使われる

### git レベル
1. `git revert <buildCommand追加コミット>`
2. `dist/` は `.gitignore` 済みなので無害
3. `package.json` の handlebars 依存は残しても害なし

### Wave 3 完了後の `_legacy/` 退避失敗時
`git mv _legacy/*.html ./` で全戻し、PR を revert

---

## 想定リスクと対策

| # | リスク | 対策 |
|---|-------|-----|
| R1 | dist/ と source の二重管理混乱 | `.gitignore` で dist 除外、ルート HTML 上部に `<!-- DEPRECATED -->` コメント、README で source-of-truth 明記 |
| R2 | git 履歴の汚染 | `_legacy/` 退避は単一コミット `git mv`、rename detection で履歴保全 |
| R3 | Vercel ビルド失敗 | `ignoreCommand` で関連ファイル変更時のみビルド、try/catch + 詳細ログ、CI（別タスク）で `npm run build:verify` 必須化 |
| R4 | partial 名衝突 | kebab → camelCase 規約を `templates/partials/README.md` に明記 |
| R5 | JSON-LD のエスケープ劣化 | `Handlebars.SafeString` ヘルパー、build-verify で `JSON.parse` 必須チェック |
| R6 | cleanUrls 互換性 | Wave 1 で動作確認、`dist/*.html` → 拡張子なし URL 自動生成は既存挙動と同一 |
| R7 | SW 解除スクリプト重複 | partial に集約、verify で「`getRegistrations` が 1 回だけ出現」チェック |
| R8 | A/B テスト用 IIFE の保持 | `content/home.json` の `extraInlineScript` フィールドで保持、`base.hbs` で SafeString 注入 |

---

## 付録 A: DESIGN.md YAML frontmatter ドラフト

```yaml
---
license: Apache-2.0
spec_version: stitch.opensource/v1
project:
  name: "赤ちゃん名前診断"
  short_name: "名前診断"
  domain: "namae-studio.com"
  brand_voice: "warm-modern-japanese"
  tagline: "大切なお子さまに最高の名前を"

colors:
  primary:
    cream:            { hex: "#FFF8F0", role: "background-base",   token: "--color-cream" }
    cream_warm:       { hex: "#FFF2E0", role: "background-accent", token: "--color-cream-warm" }
    terracotta:       { hex: "#E8725C", role: "cta-primary",       token: "--color-terracotta" }
    terracotta_light: { hex: "#F09080", role: "cta-hover",         token: "--color-terracotta-light" }
    terracotta_dark:  { hex: "#D05A46", role: "cta-active",        token: "--color-terracotta-dark" }
  secondary:
    sage:       { hex: "#6EC4A8", role: "calm-accent",      token: "--color-sage" }
    sage_light: { hex: "#90D8C0", role: "calm-bg",          token: "--color-sage-light" }
    sage_dark:  { hex: "#52B090", role: "calm-deep",        token: "--color-sage-dark" }
    gold:       { hex: "#F0B84D", role: "celebration",      token: "--color-gold" }
    gold_light: { hex: "#F5CC70", role: "celebration-soft", token: "--color-gold-light" }
    gold_dark:  { hex: "#D4A040", role: "celebration-deep", token: "--color-gold-dark" }
  neutral:
    dark:        { hex: "#3D3029", role: "text-primary",   token: "--color-dark" }
    medium:      { hex: "#5C4F44", role: "text-secondary", token: "--color-medium" }
    muted:       { hex: "#8A7D73", role: "text-muted",     token: "--color-muted" }
    light_bg:    { hex: "#FEFAF5", role: "section-bg",     token: "--color-light-bg" }
    white:       { hex: "#FFFFFF", role: "card-bg",        token: "--color-white" }
    card_border: { hex: "#E8DDD0", role: "border-soft",    token: "--color-card-border" }
    divider:     { hex: "#EDE5DA", role: "divider",        token: "--color-divider" }
  fortune:
    daikichi: { hex: "#D4A853", role: "rating-best",  token: "--color-daikichi" }
    kichi:    { hex: "#8BA888", role: "rating-good",  token: "--color-kichi" }
    hankichi: { hex: "#64B5F6", role: "rating-mid",   token: "--color-hankichi" }
    kyo:      { hex: "#E8974F", role: "rating-bad",   token: "--color-kyo" }
    daikyo:   { hex: "#E57373", role: "rating-worst", token: "--color-daikyo" }
  semantic:
    success: { hex: "#4CAF50", token: "--color-success" }
    error:   { hex: "#E57373", token: "--color-error" }
    info:    { hex: "#64B5F6", token: "--color-info" }
    warning: { hex: "#FFB74D", token: "--color-warning" }

typography:
  families:
    heading:
      stack: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c', sans-serif"
      token: "--font-heading"
      role: "h1-h6, .hero-title, .feature-title"
      forbidden_for: "本文・段落・キャプション"
    body:
      stack: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif"
      token: "--font-body"
      role: "p, li, .disclaimer-text"
  scale:
    xs:    { token: "--text-xs",   role: "label, badge" }
    sm:    { token: "--text-sm",   role: "caption" }
    base:  { token: "--text-base", role: "body" }
    lg:    { token: "--text-lg",   role: "lead" }
    xl:    { token: "--text-xl",   role: "h3" }
    "2xl": { token: "--text-2xl",  role: "h2" }
    "3xl": { token: "--text-3xl",  role: "h1, .section-title" }
    "4xl": { token: "--text-4xl",  role: ".hero-title" }
  weights:
    light:   { value: 300, token: "--weight-light" }
    regular: { value: 400, token: "--weight-regular", role: "body" }
    medium:  { value: 500, token: "--weight-medium",  role: "label, button" }
    bold:    { value: 700, token: "--weight-bold",    role: "h2-h6" }
    black:   { value: 900, token: "--weight-black",   role: "h1, hero" }

spacing:
  base: 4
  gutter: { value: "clamp(1rem, 0.5rem + 2.5vw, 2rem)", token: "--gutter" }

radius:
  sm:   { value: "8px",    token: "--radius-sm",   role: "input, badge" }
  md:   { value: "12px",   token: "--radius-md",   role: "button" }
  lg:   { value: "20px",   token: "--radius-lg",   role: "card" }
  xl:   { value: "32px",   token: "--radius-xl",   role: "hero, modal" }
  full: { value: "9999px", token: "--radius-full", role: "avatar, pill" }

motion:
  fast:    { duration: "150ms", easing: "ease",                            token: "--transition-fast" }
  default: { duration: "300ms", easing: "ease",                            token: "--transition-default" }
  slow:    { duration: "500ms", easing: "ease",                            token: "--transition-slow" }
  spring:  { duration: "500ms", easing: "cubic-bezier(0.34,1.56,0.64,1)",  token: "--transition-spring" }
  reduced_motion_policy: "prefers-reduced-motion: reduce で全アニメーション 150ms 以下、card-hover 上昇は無効化"

layout:
  containers:
    max:    { value: "1200px", token: "--container-max" }
    form:   { value: "720px",  token: "--container-form" }
    narrow: { value: "560px",  token: "--container-narrow" }
  breakpoints: { sm: 480, md: 768, lg: 1024 }

components:
  buttons:
    primary:   { class: ".btn--primary",   bg: "--color-terracotta", text: "white",                role: "main-cta", rule: "1 page = 1 instance preferred" }
    secondary: { class: ".btn--secondary", bg: "--color-sage",       text: "white" }
    outline:   { class: ".btn--outline",   bg: "transparent",        border: "--color-terracotta", text: "--color-terracotta" }
  cards:
    default: { class: ".card",         radius: "--radius-lg", shadow: "--shadow-card",  has_top_gradient: true }
    feature: { class: ".feature-card", hover: "translateY(-6px) rotate(-1deg)" }
    promo:   { class: ".promo-card",   role: "affiliate sponsored placement" }
  navigation:
    nav:      { class: ".nav" }
    nav_link: { class: ".nav__link", active_modifier: ".nav__link--active" }

imagery:
  style: "和風パステル × 線画 × やわらかい影"
  forbidden: ["3D rendering", "photo-realistic stock", "harsh shadows", "neon colors"]
  approved_motifs: ["蓮", "桜", "鶴", "雲", "葉", "赤ちゃん", "命名書", "毛筆"]

import:
  stitch2_import_design: true
  stitch2_locked_tokens: ["colors.primary.terracotta", "typography.families.heading", "components.buttons.primary"]
  forbidden_fonts: ["Inter", "Roboto", "Arial", "system-ui", "Helvetica"]
  forbidden_colors_off_palette: true
---
```

本文は以下 8 セクションを Markdown で記述：
1. **Brand Voice & Identity** — 「和モダン × ぬくもり」、テラコッタ = 信頼性 + 行動喚起、Zen Maru Gothic 見出し限定の理由
2. **Color System** — 各トークンの意味論的記述
3. **Typography** — h1=900 / h2-h3=700 の境界、本文 wght 400/500 の使い分け
4. **Spacing & Rhythm** — 4px ベース、セクション間 `--space-16`、カード内 `--space-6` の根拠
5. **Component Patterns** — `.btn--primary` は CTA 1 ページ 1 個原則、`.card` 上部グラデの意図
6. **Motion** — 標準 300ms、Spring はホバー特殊用途のみ
7. **Accessibility** — `--color-text-on-cream` の AAA 根拠、`--focus-ring` 統一
8. **Operational Guide** — Claude Code への渡し方 / Stitch2 の Import Design 経由の渡し方
