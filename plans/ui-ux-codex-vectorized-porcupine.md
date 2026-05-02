# Plan: コラム記事ヒーロー画像の見切れ修正（contain 化）

## Context

**問題**: コラム記事ページ（column.namae-studio.com/akachan-benpi-kaishouhou/）でヒーロー画像（インフォグラフィック）の上半分しか表示されず、下部のケア手順や情報が見切れている。記事「赤ちゃんの便秘解消法」では「離乳食開始」「水分・繊維質」等の重要情報が隠れてしまっている。

**原因**: WordPress 子テーマ `affinger4-child/style.css:946-1038` の `.article-hero` 系 CSS が、`min-height: 400px` の枠に対して画像を `object-fit: cover` で当てているため、横長画像でも `1280×400px` (= 16:5 比) の枠に対し縦が余って中央クロップされる。

**ゴール**: 全コラム記事で画像本来のアスペクト比を保ったまま全体表示し、タイトル/カテゴリのオーバーレイ可読性も維持する。CSS のみの軽量修正で完結させる。

---

## 修正方針（ユーザー合意済み）

- 全コラム共通で `object-fit: cover` → `contain` 化
- 画像は横長（16:9 〜 4:3 寄り）想定で `aspect-ratio: 16 / 9` を採用
- 画像が完全表示されるよう、必要に応じてクリーム色余白を許容
- タイトル/カテゴリの黒グラデオーバーレイは画像下部のみに短縮し、画像上部のクリアな視認性を確保

---

## 修正対象ファイル（1 ファイルのみ）

- [column-child-theme/affinger4-child/style.css](column-child-theme/affinger4-child/style.css#L946-L1038) — ヒーロー画像セクション CSS

`single.php` テンプレートは構造変更不要のため触らない。

---

## 具体的な変更内容

### 1. `.article-hero` ([style.css:946-952](column-child-theme/affinger4-child/style.css#L946-L952))

```css
/* Before */
.article-hero {
  position: relative;
  width: 100%;
  min-height: 240px;
  overflow: hidden;
  margin-bottom: var(--space-8);
}

/* After */
.article-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;        /* ← 追加：画像比に合わせた枠固定 */
  max-height: 70vh;            /* ← 追加：縦に伸びすぎ防止（モバイル対策） */
  overflow: hidden;
  background-color: var(--color-cream-warm);  /* ← 追加：contain 余白用フォールバック */
  margin-bottom: var(--space-8);
}
```

- `min-height` は削除（aspect-ratio 主導に切り替え）
- `max-height: 70vh` でモバイルでヒーローが画面を埋め尽くすのを防ぐ
- 親に直接 `background-color` を持たせ、contain 時の余白がクリーム色で塗られる

### 2. `.article-hero__image` ([style.css:960-964](column-child-theme/affinger4-child/style.css#L960-L964))

```css
/* Before */
.article-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* After */
.article-hero__image {
  width: 100%;
  height: 100%;
  object-fit: contain;         /* ← 変更：画像全体を表示 */
  object-position: center;
}
```

### 3. `.article-hero__overlay` ([style.css:966-976](column-child-theme/affinger4-child/style.css#L966-L976))

```css
/* Before */
.article-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(36, 25, 23, 0.92) 0%,
    rgba(36, 25, 23, 0.65) 45%,
    rgba(36, 25, 23, 0.20) 75%,
    transparent 100%
  );
}

/* After */
.article-hero__overlay {
  position: absolute;
  inset: auto 0 0 0;           /* ← 変更：下端配置 */
  height: 55%;                 /* ← 追加：下半分のみグラデ */
  background: linear-gradient(
    to top,
    rgba(36, 25, 23, 0.92) 0%,
    rgba(36, 25, 23, 0.65) 45%,
    rgba(36, 25, 23, 0.20) 75%,
    transparent 100%
  );
}
```

- 黒グラデが画像下半分（タイトル領域）にのみ被さる
- 画像上部はクリアに見える → インフォグラフィック上部の情報も視認可能

### 4. `@media (min-width: 768px)` 内の `.article-hero` ([style.css:1030-1038](column-child-theme/affinger4-child/style.css#L1030-L1038))

```css
/* Before */
@media (min-width: 768px) {
  .article-hero {
    min-height: 400px;
  }
  .article-hero__inner {
    min-height: 400px;
    padding: var(--space-16) var(--gutter) var(--space-12);
  }
}

/* After */
@media (min-width: 768px) {
  /* .article-hero の min-height は削除（aspect-ratio で制御） */
  .article-hero__inner {
    min-height: 400px;         /* タイトル領域は維持 */
    padding: var(--space-16) var(--gutter) var(--space-12);
  }
}
```

- `.article-hero` の `min-height: 400px` を削除（aspect-ratio に一本化）
- `.article-hero__inner` の `min-height: 400px` は **維持**（タイトル/メタの配置領域確保）

---

## 影響範囲

- **対象**: column.namae-studio.com の全コラム記事ページ（`single.php` 経由でレンダリングされる全記事）
- **変更しない**: メインサイト namae-studio.com（別ドメイン・別テーマ）、コラム一覧ページ、関連記事カード（`.related__image` 系は別 CSS）
- **見え方の変化**:
  - 横長画像（16:9 寄り）: 余白ほぼゼロ、現状とほぼ変わらず見える
  - 4:3 寄り画像: 左右にクリーム色余白が少し
  - 縦長画像（万一あった場合）: 左右に大きめのクリーム色余白、ただし全体表示される

---

## 検証手順

1. **ローカルプレビュー（可能なら）**: WordPress ローカル環境があれば `column-child-theme` を当てて `/akachan-benpi-kaishouhou/` を表示
2. **本番デプロイ後**:
   - column.namae-studio.com/akachan-benpi-kaishouhou/ を開き、インフォグラフィック画像の下部（「離乳食開始」「水分・繊維質」等）が見えることを確認
   - タイトル「赤ちゃんの便秘解消法」とカテゴリチップ「赤ちゃんのお世話」、日付「2026.05.02」がオーバーレイで読めることを確認
   - 別記事（横長アイキャッチ画像の通常記事）も開き、レイアウト崩れがないことを確認
3. **レスポンシブ確認**:
   - モバイル幅（375px）: ヒーローが画面を埋め尽くさず、`max-height: 70vh` 内で収まる
   - タブレット幅（768px）: タイトル領域（inner.min-height: 400px）が確保されている
   - デスクトップ幅（1280px+）: 16:9 のヒーローが正しく表示される
4. **DevTools チェック**: `.article-hero__image` の computed style で `object-fit: contain` を確認

---

## 修正規模

- **編集ファイル数**: 1 ファイル（style.css）
- **変更行数**: 約 15 行（追加・置換含む）
- **テンプレート (PHP) 変更**: なし
- **新規ファイル**: なし
- **判定**: 「サクッと」レベルの軽量 CSS 修正
