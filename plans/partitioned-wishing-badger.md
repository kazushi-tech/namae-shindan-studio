# Plan: toasty-yawning-hopper.md の修正

## Context

`toasty-yawning-hopper.md`（デザインリフレッシュ計画）をレビューした結果、ダークモードの必要性自体を再検討。赤ちゃん名前診断サービスにダークモードは不要と判断し、**ダークモード削除 + ポップ化に全工数を集中**する方針に変更する。

---

## 修正方針

### 大方針: ダークモードを削除し、ライトモード特化に変更

**理由**: 赤ちゃん向けサービスのポップで明るいデザインとダークモードは方向性が矛盾する。ダークモード対応の工数をポップ化に集中させる。

### プラン全体の再構成

**旧 Step 1**（ダークモードバグ修正）→ **削除** → 代わりに「ダークモード CSS 削除」に変更
**旧 Step 2**（パレット変更）→ ダークモード対応値の記載をすべて削除、ライトモード値のみに
**旧 Step 3**（Hero強化）→ ダークモード用オーバーライドの記載を削除
**旧 Step 4**（インタラクション）→ 変更なし

### 具体的な編集箇所

#### 1. Step 1 を「ダークモード削除」に書き換え

**対象ファイル:**
- [css/variables.css](css/variables.css) — `@media (prefers-color-scheme: dark)` ブロック全体を削除
- [css/components.css](css/components.css) — dark mode 関連ルールがあれば削除
- [css/animations.css](css/animations.css) — `prefers-reduced-motion` は残す、dark mode のみ削除

#### 2. Step 2 からダークモード対応値を削除

ダークモード側のコードブロック（`--color-terracotta: #F09080;` 等）をすべて削除。

#### 3. Step 3a からダークモード記述を削除

「ダークモード用のオーバーライドも追加（rgbaの色を調整、不透明度を下げる）」の一文を削除。

#### 4. 注意事項の修正

- 「新しいCSS変数を追加したら必ずダークモード側にも対応値を入れる」→ 削除
- 追加: Fortune Rating Colors（`--color-daikichi` 等）は `--color-gold` とは別変数のため変更されない旨の注記

#### 5. Step 4a に注記追加

既存の `.btn:hover { transform: translateY(-1px); }` との関係を明記。primary のみバウンス強調、他バリアントは従来通り。

#### 6. 検証方法の修正

- ダークモード関連の検証項目を削除
- WCAG AA コントラスト比チェック追加（コーラル `#E8725C` × クリーム背景）
- about.html を含む全3ページの確認を明記

---

## 対象ファイル

- [plans/toasty-yawning-hopper.md](plans/toasty-yawning-hopper.md) — 上記の通り全面修正

## 検証

- 修正後のプランにダークモード関連の記述が残っていないことを確認
- `prefers-reduced-motion`（アクセシビリティ）は残すことを確認
