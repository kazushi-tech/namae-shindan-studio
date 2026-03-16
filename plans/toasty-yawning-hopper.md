# デザインリフレッシュ: ポップ化 + ダークモード削除

## Context

名前診断スタジオは赤ちゃんの姓名判断サービスだが、現在のデザインが「和モダン×渋さ」に寄りすぎて、赤ちゃん向けサービスらしいポップさ・明るさが不足している。

**方針変更**: 赤ちゃん向けサービスのポップで明るいデザインとダークモードは方向性が矛盾するため、ダークモードを完全に削除し、ライトモード特化でポップ化に全工数を集中する。

**目標**: 既存の暖色系デザインシステムを活かしつつ、カラーパレットをより明るく・ポップに調整する。

---

## Step 1: ダークモード CSS 削除 ✅

**対象ファイル:**
- [variables.css](css/variables.css) — `@media (prefers-color-scheme: dark)` ブロック全体を削除
- [components.css](css/components.css) — nav の dark mode ルールを削除
- [animations.css](css/animations.css) — skeleton/shimmer の dark mode ルールを削除（`prefers-reduced-motion` は残す）

---

## Step 2: カラーパレットのポップ化 ✅

**対象ファイル:** [variables.css](css/variables.css)

「秋の午後」→「春の朝」へシフト。変数名はそのまま、値だけ変更。

| 変数 | 旧値 | 新値 | 方向性 |
|------|------|------|--------|
| `--color-terracotta` | `#C4704B` | `#E8725C` | 渋テラコッタ→明るいコーラル |
| `--color-terracotta-light` | `#D4896A` | `#F09080` | ライトコーラル |
| `--color-terracotta-dark` | `#A45C3A` | `#D05A46` | ディープコーラル |
| `--color-sage` | `#8BA888` | `#6EC4A8` | くすみグリーン→ミント |
| `--color-sage-light` | `#A3BDA0` | `#90D8C0` | ライトミント |
| `--color-sage-dark` | `#6F8E6C` | `#52B090` | ディープミント |
| `--color-gold` | `#D4A853` | `#F0B84D` | 渋ゴールド→明るいイエロー |
| `--color-gold-light` | `#E0BE78` | `#F5CC70` | ブライトゴールド |

新規追加:
```css
--color-cream-warm: #FFF2E0;
--color-accent-pink: #FF8FA3;
--color-accent-lavender: #B8A9E8;
```

ハードコードされていた `#FFF2E0` を `var(--color-cream-warm)` に置換（home.css, shindan.css）。

**注記**: Fortune Rating Colors（`--color-daikichi` 等）は `--color-gold` とは独立した変数のため、パレット変更の影響を受けない。

---

## Step 3: Heroセクションの視覚強化 ✅

**対象ファイル:** [home.css](css/pages/home.css)

### 3a. 背景をグラデーションメッシュ化
heroの `background` にピンク・ミントの放射グラデーションを重ねて奥行き感を出す。

```css
.hero {
  background:
    radial-gradient(ellipse 80% 50% at 20% 30%, rgba(255, 143, 163, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 80% 70%, rgba(110, 196, 168, 0.10) 0%, transparent 70%),
    linear-gradient(160deg, var(--color-cream) 0%, var(--color-cream-warm) 40%, var(--color-light-bg) 100%);
}
```

### 3b. 装飾円のアップグレード
- `.hero__deco` opacity: `0.08` → `0.12`
- 各円の色をアクセントカラーに変更（pink, sage, lavender）
- `float` アニメーション付与（各円で異なるduration: 5s/7s/8s）

### 3c. タイトル下線の強化
- `.hero-title__keyword::after` opacity: `0.4` → `0.6`

---

## Step 4: マイクロインタラクション追加 ✅

**対象ファイル:**
- [components.css](css/components.css) — ボタン
- [home.css](css/pages/home.css) — フィーチャーカード・ステップ番号
- [animations.css](css/animations.css) — 新keyframe

### 4a. ボタンのホバーにバウンス感
`.btn--primary:hover` のみ `transform: translateY(-2px) scale(1.02)` を適用。secondary/outline 等の他バリアントは既存の `.btn:hover { transform: translateY(-1px); }` を継承する。

### 4b. フィーチャーカードの微チルト
```css
.feature-card:hover {
  transform: translateY(-6px) rotate(-1deg);
}
```

### 4c. ステップ番号のpopInアニメーション
```css
@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); }
}
```

### 4d. フィーチャーアイコンにパステルグラデーション背景
nth-childで各カードに異なるパステル色:
- 1番目: pink
- 2番目: mint
- 3番目: lavender
- 4番目: gold
- 5番目: coral
- 6番目: mint→lavender

### 4e. ステップ番号バッジの色バリエーション
1番目=コーラル（terracotta）, 2番目=ミント（sage）, 3番目=ゴールド（gold）

---

## 実装順序

1. **Step 1** (ダークモード削除) → ライトモード特化に移行
2. **Step 2** (パレット変更) → 全体の印象が一気にポップに
3. **Step 3** (Hero強化) → ファーストビューのインパクト向上
4. **Step 4** (インタラクション) → 楽しさ・動きの追加

各ステップ後にVercelプレビューで確認。

---

## 注意事項

- テキスト色（`--color-dark`, `--color-medium`）は変更しない → コントラスト比を維持
- Fortune Rating Colors（`--color-daikichi`, `--color-kichi` 等）は `--color-gold` とは別変数。パレットが変わっても Fortune の色は独立して管理される
- `prefers-reduced-motion: reduce` 時はアニメーション無効化済み（既存対応を維持）
- コーラル色 `#E8725C` はボタンや見出し等の大きいテキスト用（小さい本文には使わない）

---

## 検証方法

1. ライトモードで全体的にポップな印象になっていることを目視確認
2. ボタン・カードのホバーインタラクションが動くことを確認
3. WCAG AA コントラスト比チェック（コーラル `#E8725C` × クリーム背景 `#FFF8F0`、DevTools Accessibility パネルで確認）
4. 全3ページ（index.html, shindan.html, about.html）でレイアウト崩れがないことを確認
5. モバイル表示でもレイアウト崩れがないことを確認
6. 本番URL (namae-shindan-studio.vercel.app) にpush後のVercel自動デプロイで確認
