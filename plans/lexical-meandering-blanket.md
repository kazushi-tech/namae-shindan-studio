# UI/デザイン全体改善 + GitHub連携 + Vercelデプロイ計画

## Context

名前診断スタジオの全体的な見た目を改善し、Vercelにデプロイして確認できるようにする。
**最大の問題**: HTMLクラス名とCSSクラス名の不一致（BEM命名のズレ）により、コンポーネントCSSの大半が適用されていない。これを修正するだけで劇的にビジュアルが改善される。

加えて、GitHub連携を最初に行い、各ステップ完了時にコミット→プッシュすることでセーブポイントを確保する。

---

## Step 0: GitHub連携（セーブポイント確保）

現在gitリモートが未設定。`gh` CLI (v2.86.0) が利用可能。

1. `.gitignore` の確認・整備（node_modules, .vercel 等）
2. `gh repo create` でGitHubリポジトリを作成
3. 初回コミット＆プッシュ
4. 以降、各Step完了ごとにコミット＆プッシュ

### 対象ファイル
- [.gitignore](.gitignore)

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

### JS側のセレクタ更新
- [js/app.js](js/app.js) — `.nav-link` → `.nav__link` 等のセレクタ更新
- [js/ui-controller.js](js/ui-controller.js) — 動的生成部分は既にBEM。`stroke-char`, `char`, `count` 等の非BEMクラスはCSS側と整合確認

### 対象ファイル
- [index.html](index.html)
- [shindan.html](shindan.html)
- [about.html](about.html)
- [js/app.js](js/app.js)
- [js/ui-controller.js](js/ui-controller.js)

**→ 完了後コミット＆プッシュ**

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

### 新規 about.css を作成
- `.about-content`, `.about-section`, `.about-note`, `.about-disclaimer`
- `.gokaku-explain-grid`, `.gokaku-explain-card`, `.gokaku-explain-header`, `.gokaku-explain-tag`
- `.example-box`, `.example-breakdown`, `.example-table`
- `.rating-guide`, `.rating-row`
- `.container-narrow` → `container--narrow`（BEM化）

### 既存 suggestion.css の確認
- [css/pages/suggestion.css](css/pages/suggestion.css) が存在するが元プランに言及なし。関連クラスの整合性を確認

### 対象ファイル
- [css/pages/home.css](css/pages/home.css)
- [css/pages/shindan.css](css/pages/shindan.css)
- 新規: `css/pages/about.css`（+ about.htmlにlink追加）
- [css/pages/suggestion.css](css/pages/suggestion.css) — 確認

**→ 完了後コミット＆プッシュ**

---

## Step 3: ビジュアルポリッシュ（Step 1-2の結果を見て判断）

> **注意**: Step 1-2でBEMが正しく適用されれば見た目が大きく変わる。過剰修正を避けるため、Step 1-2完了後にローカルで確認し、**本当に必要な項目だけ**実施する。

### 候補項目（要否は確認後判断）
- ヒーローセクション: wave SVG → CSS clip-path統一
- カードデザイン: 上部グラデーションボーダー、hover強化
- ボタン: primaryグラデーション背景、active押し込み効果
- 入力フィールド: focus shadowのCSS変数化
- 五格グリッド: タブレットサイズの5枚目カード修正
- セクション間: 交互背景色、デコレーティブdivider

### 対象ファイル
- [css/components.css](css/components.css)
- [css/pages/home.css](css/pages/home.css)
- [css/pages/shindan.css](css/pages/shindan.css)
- [css/animations.css](css/animations.css)

**→ 完了後コミット＆プッシュ**

---

## Step 4: ダークモード修正

- スケルトンローディングのダークモード対応
- input focus shadowのダークモード対応
- nav backdrop filterの適用確認

### 対象ファイル
- [css/variables.css](css/variables.css)
- [css/components.css](css/components.css)

**→ 完了後コミット＆プッシュ**

---

## Step 5: Vercelデプロイ

GitHub連携済みのため、Vercelでリポジトリをインポートして自動デプロイ設定。
```bash
vercel --prod   # または Vercel Dashboard からインポート
```

以降はpushごとに自動プレビューデプロイ。

---

## 検証方法

1. **ローカル確認**: `npx serve .` でローカルサーバー起動、全3ページ確認
2. **クラス適用確認**: DevToolsでナビ・ボタン・フッターにBEMスタイルが適用されていること
3. **レスポンシブ確認**: 375px / 768px / 1024px でレイアウト崩れなし
4. **ダークモード確認**: ブラウザのダークモード切替で表示確認
5. **診断フロー確認**: 姓名入力→診断→結果表示→リトライの全フロー動作確認
6. **Vercel確認**: デプロイURLでモバイル・デスクトップ両方チェック
