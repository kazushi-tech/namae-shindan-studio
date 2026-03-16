# UI/デザイン全体改善 + Vercelデプロイ計画

## Context

名前診断スタジオの全体的な見た目を改善し、Vercelにデプロイして確認できるようにする。
Phase 1探索で発見された**最大の問題**: HTMLクラス名とCSSクラス名の不一致（BEM命名のズレ）により、コンポーネントCSSの大半が適用されていない。これを修正するだけで劇的にビジュアルが改善される。

---

## Step 1: CSS-HTMLクラス名の整合性修正（最重要・最大インパクト）

**問題**: CSSはBEM記法（`btn--primary`, `nav__brand`）だが、HTMLはハイフン区切り（`btn-primary`, `nav-logo`）を使用。

**方針**: HTMLクラス名をCSS側のBEM命名に合わせる（CSSの設計が正しいため）

### 主なマッピング

| HTML現在 | CSS（修正先） |
|---|---|
| `nav-logo` | `nav__brand` |
| `nav-logo-icon` | `nav__logo` |
| `nav-logo-text` | `nav__title` |
| `nav-links` | `nav__links` |
| `nav-link` / `nav-link active` | `nav__link` / `nav__link nav__link--active` |
| `btn-primary` / `btn-secondary` / `btn-outline` | `btn--primary` / `btn--secondary` / `btn--outline` |
| `btn-lg` / `btn-full` | `btn--lg` / `btn--block` |
| `hero-content` | `hero__content` |
| `hero-cta` | `hero__cta` |
| `footer-content` | `footer__inner` |
| `footer-brand` | `footer__brand` |
| `footer-logo` | `footer__brand-name` |
| `footer-tagline` | `footer__brand-desc` |
| `footer-links` | `footer__links` |
| `footer-copy` | `footer__copyright` |

### 対象ファイル
- [index.html](index.html) — ナビ、ヒーロー、フィーチャー、フッター
- [shindan.html](shindan.html) — ナビ、フォーム、結果表示、フッター
- [about.html](about.html) — ナビ、コンテンツ、フッター
- [js/app.js](js/app.js) — `.nav-link`セレクタの更新
- [js/ui-controller.js](js/ui-controller.js) — JS生成クラス名の確認・更新

---

## Step 2: 未定義CSSの追加

BEM対応するCSSが存在しないHTMLクラスに対して、新規CSSルールを追加。

### home.css に追加
- `.features-section`, `.how-section`, `.disclaimer-section` — セクション背景・余白
- `.steps-grid`, `.step-card`, `.step-number`, `.step-title`, `.step-text` — ステップカード
- `.feature-icon`, `.feature-title`, `.feature-text` — フィーチャーカード内要素
- `.section-title`, `.section-cta` — セクションヘッダーとCTA

### shindan.css に追加
- `.page-header`, `.page-title`, `.page-subtitle` — ページヘッダー
- `.input-label` — ラベル
- `.error-message`, `.error-message.visible` — エラー表示
- `.result-section.visible` — 結果表示切替
- `.result-header`, `.result-title`, `.result-name-display`, `.result-name-text` — 結果ヘッダー
- `.result-actions`, `.result-disclaimer` — 結果アクション・免責
- `.stroke-char`, `.char`, `.count`, `.stroke-char.unknown` — 画数プレビュー
- `.shindan-form.submitted` — 送信後のフォーム状態

### 新規 about.css を作成（または既存ファイルに追記）
- `.about-content`, `.about-section`, `.about-note`, `.about-disclaimer`
- `.gokaku-explain-grid`, `.gokaku-explain-card`, `.gokaku-explain-header`, `.gokaku-explain-tag`
- `.example-box`, `.example-breakdown`, `.example-table`
- `.rating-guide`, `.rating-row`
- `.container-narrow` → `container--narrow`

### 対象ファイル
- [css/pages/home.css](css/pages/home.css)
- [css/pages/shindan.css](css/pages/shindan.css)
- 新規: `css/pages/about.css`（+ about.htmlにlink追加）

---

## Step 3: ビジュアルポリッシュ（CSSのみ）

Step 1-2完了後、さらに見た目を磨く。

### 3a. ヒーローセクション強化 (home.css)
- SVGのhero-wave divを廃止し、CSS `::after` clip-pathに統一
- ドットパターン透過度を0.3→0.4に
- デコ要素にfloatアニメーション追加

### 3b. カードデザイン (components.css)
- 上部にグラデーションボーダー追加
- hover時のtranslateYを-2pxに強化

### 3c. ボタン (components.css)
- primaryにグラデーション背景
- active状態でtranslateY(1px)の押し込み効果

### 3d. 入力フィールド (components.css)
- focus shadowのハードコードrgbaをCSS変数に置換
- focus時の背景色を微妙にクリーム色に

### 3e. 五格グリッド修正 (shindan.css)
- タブレットサイズでの5枚目カードのmax-width: 50%問題を修正
- `justify-self: center; width: 80%`に変更

### 3f. セクション間の視覚的区切り
- 交互のセクション背景色（クリーム/ホワイト）
- セクション間にデコレーティブ divider追加

---

## Step 4: ダークモード修正

- スケルトンローディングのダークモード対応
- input focus shadowのダークモード対応
- nav backdrop filterの適用確認

### 対象ファイル
- [css/variables.css](css/variables.css)
- [css/components.css](css/components.css)
- [css/animations.css](css/animations.css)

---

## Step 5: Vercelデプロイ

### 方法A: CLI直接デプロイ（推奨 — 素早く確認）
```bash
cd "名前診断スタジオ"
vercel          # プレビューデプロイ（URL発行）
vercel --prod   # 本番デプロイ
```

### 方法B: GitHub連携
1. GitHubにリポジトリ作成・プッシュ
2. Vercelでリポジトリをインポート
3. 以降pushごとに自動デプロイ

---

## 検証方法

1. **ローカル確認**: `npx serve .` でローカルサーバー起動、ブラウザで全3ページ確認
2. **クラス適用確認**: DevToolsでナビ・ボタン・フッターにBEMスタイルが適用されていることを確認
3. **レスポンシブ確認**: 375px / 768px / 1024px でレイアウト崩れがないこと
4. **ダークモード確認**: ブラウザのダークモード切替で表示確認
5. **診断フロー確認**: 姓名入力→診断→結果表示→リトライの全フロー動作確認
6. **Vercel確認**: デプロイURL でモバイル・デスクトップ両方チェック
