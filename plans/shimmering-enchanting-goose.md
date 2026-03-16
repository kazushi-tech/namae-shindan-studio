# About ページレイアウト改善 + サイト全体の画像追加プラン

## Context

「五格について」ページが縦に長すぎて読みにくい。また、サイト全体に画像が1枚もなく（`assets/images/` は空）、ママ・パパが気軽に使える愛着のあるUIになっていない。水彩イラスト風の画像を Gemini 3.1 Flash Image で生成し、レイアウト改善と合わせてサイト全体の印象を大幅に向上させる。

---

## Step 1: 環境セットアップ + 画像生成スクリプト作成 + 画像生成

### 1-1. Node.js 環境準備
```bash
# プロジェクトルートで実行
npm init -y
npm install dotenv
```

### 1-2. API 仕様
- **モデル**: `gemini-2.0-flash-exp` (画像生成対応)
- **エンドポイント**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **APIキー**: `.env` の `IMAGE_API_KEY`（事前に Google AI Studio で取得）
- **方式**: `responseModalities: ["IMAGE", "TEXT"]` でリクエスト
- **リクエスト構造**:
```json
{
  "contents": [{
    "parts": [{
      "text": "プロンプトテキスト"
    }]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"],
    "responseMimeType": "image/png",
    "responseSchema": {
      "type": "object",
      "properties": {}
    }
  }
}
```

### 1-3. 生成スクリプト
`scripts/generate-images.js` を作成（Node.js）:
- `.env` から APIキー読み込み（`dotenv` パッケージ使用）
- 各プロンプトで API コール（並列リクエスト、レート制限対策に `Promise.allSettled` 使用）
- レスポンスの base64 画像データを PNG としてデコード・保存
- `assets/images/` に出力
- **エラーハンドリング**: API 失敗時はログを出力し、続けて次の画像生成を試行。すべて失敗した場合はエラーメッセージで終了

### 1-4. 生成する画像一覧（8枚）

| # | ファイル名 | 用途 | 解像度 | アスペクト比 | プロンプト方向性 |
|---|-----------|------|-------|-------------|-----------------|
| 1 | `hero-baby.png` | トップページ Hero セクション装飾 | 1200x800 | 横長 | 桜の花びらが舞う中、やわらかいベビーシューズとおくるみが置かれた水彩イラスト。クリーム・コーラル・ミントの暖色系 |
| 2 | `feature-speed.png` | 特徴カード1（瞬時に結果） | 512x512 | 正方形 | キラキラ光る星と風を表現した水彩イラスト。やわらかいゴールドとコーラル |
| 3 | `feature-gokaku.png` | 特徴カード2（五格で診断） | 512x512 | 正方形 | 5つの和柄の円が花のように並んだ水彩イラスト。各円がパステルの異なる色 |
| 4 | `feature-free.png` | 特徴カード3（完全無料） | 512x512 | 正方形 | ハートと小さな贈り物の箱が浮かぶ水彩イラスト。ピンクとミントグリーン |
| 5 | `about-header.png` | 五格ページ ヘッダー装飾 | 1200x600 | 横長 | 筆と墨、和紙の上に桜の花びらが散る水彩イラスト。穏やかで知的な雰囲気 |
| 6 | `gokaku-visual.png` | 五格説明セクション補助図 | 800x800 | 正方形 | 5つの色とりどりの円が五角形に配置された図。天・人・地・外・総を表す抽象的水彩 |
| 7 | `shindan-header.png` | 診断ページ ヘッダー装飾 | 1200x600 | 横長 | 赤ちゃんの手形と名前を書いた短冊が風に揺れる水彩イラスト |
| 8 | `cta-crane.png` | CTA セクション装飾（全ページ共通） | 1200x400 | 横長 | 折り鶴が桜の花びらと共に飛んでいく希望に満ちた水彩イラスト |

### 1-5. プロンプト共通スタイル指示

全画像に以下の共通スタイルを追加:

```
Soft Japanese watercolor illustration, warm cream and coral palette with mint green and gold accents, no text, no people or faces, gentle and cute, white/cream background, baby-themed, traditional Japanese aesthetic, sakura cherry blossom motif
```

### 1-6. 生成時の注意点

- `personGeneration` は避ける（人物はブロックされやすい） → 赤ちゃんグッズ・植物・和モチーフで表現
- API レート制限に注意。並列リクエスト数を 3-4 に制限し、失敗した画像のみ再試行
- 生成後、画像サイズを確認。100KB を超える場合は圧縮ツール（TinyPNG 等）で圧縮

---

## Step 2: About ページ レイアウト大幅改善

### 2-1. コンテナ幅拡大
**ファイル**: `about.html` (L62)

```
変更前: <div class="container container--narrow">
変更後: <div class="container">
```

これにより `max-width` が 560px → 1200px になり、デスクトップでの空間を最大活用。

### 2-2. テキストセクション用の幅制限クラス追加
**ファイル**: `css/pages/about.css`

テキストが長すぎる行にならないよう、テキスト主体のセクションに `about-section--narrow` を適用:
```css
.about-section--narrow {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
```

**適用箇所** (about.html):
- 「姓名判断とは」セクション (L72)
- 「1文字の姓・名の場合」セクション (L220)
- 「免責事項」セクション (L269)

### 2-3. 五格カードグリッド → デスクトップ5列
**ファイル**: `css/pages/about.css`

```css
@media (min-width: 1024px) {
  .gokaku-explain-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```
5つの格がデスクトップで一行に横並びになり、一覧性が大幅向上。

### 2-4. 計算例を横配置
**ファイル**: `css/pages/about.css`

```css
@media (min-width: 768px) {
  .example-breakdown {
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
  }
  .example-table {
    max-width: none;
    flex: 1;
  }
}
```
「山田太郎」の漢字表示とテーブルが横並びに。

### 2-5. 評価ガイドをカード型5列グリッドに
**ファイル**: `css/pages/about.css`

```css
@media (min-width: 768px) {
  .rating-guide {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-4);
  }
  .rating-row {
    flex-direction: column;
    text-align: center;
    padding: var(--space-4);
    border-radius: var(--radius-lg);
  }
}
```
大吉〜大凶が横一列のカードとして並び、視認性アップ。

### 2-6. ページヘッダーに画像追加
**ファイル**: `about.html` (L65付近)

```html
<div class="page-header">
  <img src="assets/images/about-header.png" alt="" class="page-header__illustration" loading="lazy">
  <h1 class="page-title">五格について</h1>
  <p class="page-subtitle">...</p>
</div>
```

### 2-7. 五格セクションに図解画像追加
五格の説明文の横（デスクトップ）/ 上（モバイル）に `gokaku-visual.png` を配置:
```html
<div class="about-gokaku-intro">
  <div class="about-gokaku-intro__text">
    <h2>五格の種類と計算方法</h2>
    <p>...</p>
  </div>
  <div class="about-gokaku-intro__image">
    <img src="assets/images/gokaku-visual.png" alt="五格の図解" loading="lazy">
  </div>
</div>
```

CSS:
```css
.about-gokaku-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}
@media (min-width: 768px) {
  .about-gokaku-intro {
    flex-direction: row;
    align-items: flex-start;
  }
  .about-gokaku-intro__text { flex: 1; }
  .about-gokaku-intro__image { flex: 0 0 200px; }
}
```

---

## Step 3: トップページ（index.html）画像追加

### 3-1. Hero セクションに装飾画像
Hero 背景またはコンテンツ横に `hero-baby.png` を配置:
```html
<div class="hero__illustration">
  <img src="assets/images/hero-baby.png" alt="" class="hero__illustration-img" loading="eager">
</div>
```

CSS（`css/pages/home.css`）:
```css
.hero__illustration {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 40%;
  max-width: 500px;
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}
.hero__illustration-img {
  width: 100%;
  height: auto;
}
@media (max-width: 767px) {
  .hero__illustration { width: 60%; opacity: 0.15; }
}
```

### 3-2. 特徴カードの絵文字を画像に置換
**ファイル**: `index.html` (L92, L99, L105)

```html
<!-- 変更前 -->
<div class="feature-icon">⚡</div>
<!-- 変更後 -->
<div class="feature-icon">
  <img src="assets/images/feature-speed.png" alt="" width="64" height="64">
</div>
```
3枚すべて同様に置換。

CSS（`css/pages/home.css` or `css/components.css`）:
```css
.feature-icon img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
```

### 3-3. CTA セクションに装飾画像
**ファイル**: `index.html` (L137), `about.html` (L285)

`.section-cta` 内に `cta-crane.png` を装飾的に追加:

```html
<!-- index.html -->
<div class="section-cta">
  <img src="assets/images/cta-crane.png" alt="" class="cta-illustration" loading="lazy">
  <a href="shindan.html" class="btn btn--primary">さっそく診断してみる</a>
</div>

<!-- about.html -->
<div class="section-cta">
  <img src="assets/images/cta-crane.png" alt="" class="cta-illustration" loading="lazy">
  <a href="shindan.html" class="btn btn--primary btn--lg">姓名判断を試す</a>
</div>
```

CSS（`css/components.css`）:
```css
.section-cta {
  position: relative;
  text-align: center;
}
.cta-illustration {
  position: absolute;
  top: -50px;
  right: 0;
  width: 200px;
  max-width: 30%;
  opacity: 0.2;
  pointer-events: none;
  z-index: 0;
}
@media (max-width: 767px) {
  .cta-illustration { width: 120px; top: -30px; opacity: 0.15; }
}
```

---

## Step 4: 診断ページ（shindan.html）画像追加

### 4-1. ページヘッダーに装飾画像
`shindan-header.png` を診断フォーム上部に配置:
```html
<div class="page-header">
  <img src="assets/images/shindan-header.png" alt="" class="page-header__illustration" loading="lazy">
  <h1 class="page-title">姓名判断</h1>
  <p class="page-subtitle">...</p>
</div>
```

CSS（`css/components.css` or `css/pages/shindan.css`）:
```css
.page-header__illustration {
  display: block;
  max-width: 300px;
  height: auto;
  margin: 0 auto var(--space-6);
  border-radius: var(--radius-lg);
}
@media (max-width: 479px) {
  .page-header__illustration { max-width: 200px; }
}
```

---

## Step 5: 全ページ共通の仕上げ

### 5-1. CTA セクションに折り鶴画像
各ページの CTA ボタン周辺に `cta-crane.png` を装飾的に配置。

### 5-2. モバイル対応の確認
- 画像に `loading="lazy"` を付与（Hero のみ `eager`）
- `width`/`height` 属性で CLS 防止
- モバイルでは画像サイズ縮小 + opacity 調整で控えめに

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `scripts/generate-images.js` | **新規作成** — 画像生成スクリプト |
| `about.html` | コンテナ幅変更、narrow ラッパー追加、画像要素追加 |
| `css/pages/about.css` | narrow クラス、5列グリッド、横配置、画像スタイル |
| `index.html` | Hero 画像、特徴カード画像、CTA 画像 |
| `css/pages/home.css` | Hero illustration スタイル、feature-icon img |
| `shindan.html` | ヘッダー画像追加 |
| `css/pages/shindan.css` | ヘッダー画像スタイル |
| `css/components.css` | `.page-header__illustration` 共通スタイル |

---

## 検証方法

1. **画像生成確認**: `assets/images/` に8枚のPNGが生成されていること
2. **About ページ PC表示**: 五格カードが5列横並び、計算例が横配置、評価が5列カード
3. **About ページ モバイル**: 1列スタック、画像が適切にリサイズ
4. **トップページ**: Hero に水彩画像、特徴カードに個別イラスト
5. **診断ページ**: ヘッダーに水彩画像
6. **パフォーマンス**: 画像合計サイズが妥当（各100KB以下目標）
7. **Vercel デプロイ**: 本番環境で全ページ表示確認

---

## ロールバック手順

各Stepで問題が発生した場合の復旧方法：

### 画像生成に失敗した場合
- `.env` の `IMAGE_API_KEY` が正しいか確認
- API キーの無料枠を使い切っている場合は、Google AI Studio で新しいキーを取得
- 失敗した画像のみ再生成: `node scripts/generate-images.js --only hero-baby,feature-speed`

### HTML/CSS 変更を取り消す場合
```bash
# 特定ファイルを元に戻す
git checkout HEAD -- about.html
git checkout HEAD -- index.html
git checkout HEAD -- shindan.html
git checkout HEAD -- css/pages/about.css
git checkout HEAD -- css/pages/home.css
git checkout HEAD -- css/components.css

# 全変更を取り消す
git checkout HEAD -- .
```

### 画像を削除する場合
```bash
# 生成された画像をすべて削除
rm -rf assets/images/*.png

# または特定の画像のみ削除
rm assets/images/hero-baby.png
```

### npm パッケージを削除する場合
```bash
# dotenv パッケージのみ削除
npm uninstall dotenv

# package.json ごと削除（完全リセット）
rm package.json package-lock.json node_modules -rf
```

### Step 単位でのロールバック

| Step | 影響範囲 | ロールバック方法 |
| ---- | -------- | ---------------- |
| Step 1 | `scripts/`, `assets/images/`, `package.json` | `rm -rf scripts assets/images/*.png && npm uninstall dotenv` |
| Step 2 | `about.html`, `css/pages/about.css` | `git checkout HEAD -- about.html css/pages/about.css` |
| Step 3 | `index.html`, `css/pages/home.css`, `css/components.css` | `git checkout HEAD -- index.html css/pages/home.css css/components.css` |
| Step 4 | `shindan.html`, `css/pages/shindan.css` | `git checkout HEAD -- shindan.html css/pages/shindan.css` |
| Step 5 | 全ファイル | `git checkout HEAD -- .` |
