# アフィリエイト導線トーンダウン計画 — AdSense 審査通過までの暫定運用

## Context

名前診断スタジオの現状 UI は `shindan.html` の診断結果直下と `guide/meimei-tools.html` の全3セクションに **合計11枚の商品カード** が並び、「詳細を見る」CTA ボタン・価格表示・テラコッタ色グラデーションで強いアフィリ訴求を行っている。しかし以下の問題がある。

1. **機能していない CTA が目立つ**：`guide/meimei-tools.html` の `guide-product` カード **7個すべてが `href="#"` の死リンク**（クリックしても何も起きない）。`shindan.html` の 4 カードも 3 個は `/guide/meimei-tools#...` への内部リンクで、記事読了前のユーザーには「押しても何も変わらない」体験。
2. **AdSense 審査リスク**：ASP 申請前／未承認の状態で「購買誘導感」の強い UI が並ぶサイトは、AdSense ポリシー上「価値の低い広告枠（低品質コンテンツ）」と判定されやすい。
3. **ステマ規制上は [PR]表記を維持する必要がある**：完全撤去ではなく「情報提供として残す + 購買 CTA を削る」が最適。

本計画の目的は **AdSense 1 万円達成までの暫定状態を作る** こと。アフィリ資産（data-af-* 属性、クラス構造、CSSトークン）は温存し、CTA／価格表示／派手な装飾のみを削って「情報記事内のコンパクトな商品紹介」トーンへ格下げする。将来 ASP 承認後に CSS と HTML を元に戻すだけで復活できる構造にする。

stitch2 マスタープラン（[plans/4-ui-ux-stitch2-cheeky-haven.md](plans/4-ui-ux-stitch2-cheeky-haven.md)）の Phase 4「マネタイズ本格稼働」とは相反するため、本計画は **Phase 4 着手を AdSense 承認後まで遅延させる** 位置づけ。マスタープラン自体は修正せず、本計画で暫定 UI を上書きし、後で Phase 4 タスクを再実行する形。

---

## 変更対象サマリ

| # | ファイル | 現状 | 変更後 |
|---|---------|------|-------|
| 1 | [shindan.html:160-197](shindan.html#L160-L197) | 4 枚の派手なカード（価格・CTA 矢印・ホバー上昇） | 「関連情報」シンプルテキストリンク4本 |
| 2 | [guide/meimei-tools.html:102-184](guide/meimei-tools.html#L102-L184) | 7 枚の死リンクカード（PRラベル・CTAボタン・価格） | 情報カード（`<a>`→`<div>`）、CTA/価格削除、PRラベル維持 |
| 3 | [css/components.css:1110-1230](css/components.css#L1110-L1230) | `.affiliate-card` グリッド＋テラコッタ CTA 矢印 | `.related-items` のリストトーンに縮小 |
| 4 | [css/pages/guide.css:94-196](css/pages/guide.css#L94-L196) | `.guide-product` テラコッタ上部グラデ＋丸ボタン CTA | 上部ボーダー削除 or グレー化、CTA スタイル削除 |

HTML/CSS 両方で「資産温存・装飾削減」の方針を徹底する。データ属性（`data-af-program` / `data-af-product`）、`rel="sponsored noopener"`、`pr-label` 要素は温存。

JavaScript（`js/core/analytics.js` の `affiliate_clicked` イベント、`js/core/boot.js` のクリックハンドラ）は **一切変更しない**。DOM から CTA 要素が消えればイベントは発火しなくなるが、将来復活時にコードをそのまま使える。

---

## 具体変更内容

### 1. shindan.html — 診断結果下を「関連情報リンク」へ格下げ

**現状（[shindan.html:160-197](shindan.html#L160-L197)）**: `section.affiliate-cards` に 4 枚のカード（各カードに icon・title・desc・price・CTA）。

**変更後**: 同じ `section` を維持しつつ、内部構造を「関連情報リスト」に置換。

```html
<section class="related-items" aria-labelledby="rel-heading">
  <h3 class="related-items__heading" id="rel-heading">🎋 もっと知りたい方へ</h3>
  <p class="related-items__notice">[PR] 一部リンクは広告を含みます。</p>
  <ul class="related-items__list">
    <li><a href="/guide/meimei-tools#meimei-sho" data-af-program="a8" data-af-product="meimei-sho" rel="sponsored noopener">命名書について — プロの書家が残す一生の宝物</a></li>
    <li><a href="/guide/meimei-tools#akachan-fude" data-af-program="moshimo" data-af-product="akachan-fude" rel="sponsored noopener">赤ちゃん筆について — 初めての髪の毛で作る記念品</a></li>
    <li><a href="/guide/meimei-tools#photo" data-af-program="afb" data-af-product="photo-studio" rel="sponsored noopener">記念写真について — プロのカメラマンが残す一瞬</a></li>
    <li><a href="https://www.kids-tokei.com/" target="_blank" rel="noopener noreferrer" data-af-program="kids-tokei" data-af-product="audition">キッズ時計（外部サイト）— 毎日の成長を刻むアプリ</a></li>
  </ul>
</section>
```

ポイント:
- クラス名を `affiliate-cards` → `related-items` に変更（SEO／ポリシー上の「アフィリ露骨感」削減）
- 価格・絵文字アイコン・CTA矢印をすべて削除
- `[PR]` notice は 1 行にコンパクト化
- data 属性は温存（将来復活・イベントトラッキング用）
- キッズ時計のみ外部リンクと明示

### 2. guide/meimei-tools.html — 商品カードを「情報カード」へ

**現状（[guide/meimei-tools.html:102-184](guide/meimei-tools.html#L102-L184)）**: 3 セクション × 7 枚の `a.guide-product`（全て `href="#"` 死リンク）。

**変更後**: `<a>` → `<div>` に変更し、クリック不能な情報ブロックに。CTA 要素と価格部分を削除。

```html
<!-- 各 guide-product を以下に置換 -->
<div class="guide-product" data-af-program="a8" data-af-product="meimei-sho-standard">
  <span class="guide-product__pr">PR</span>
  <div class="guide-product__body">
    <span class="guide-product__icon" aria-hidden="true">📜</span>
    <h3 class="guide-product__title">書家直筆 命名書（スタンダード）</h3>
    <p class="guide-product__desc">プロの書家が和紙に毛筆で清書。額装付きで、そのまま飾れます。出生日・時刻入り。</p>
    <!-- guide-product__cta は削除 -->
  </div>
</div>
```

削除要素（7 カード × 各要素）:
- `href="#"` → 要素ごと `<a>` を `<div>` に置換
- `rel="sponsored noopener"` → `<div>` には不要なので削除
- `.guide-product__cta`（「¥1,800〜 詳細を見る」等）→ まるごと削除

温存要素:
- `.guide-product__pr`（PR ラベル）→ ステマ規制対応上、情報カードでも表記維持
- `data-af-program` / `data-af-product` 属性
- body 内の icon / title / desc

記事冒頭の `pr-notice`（[guide/meimei-tools.html:95](guide/meimei-tools.html#L95)）は **文言を 1 点修正**:
- 現在: 「本ページはアフィリエイトプログラムによる収益を得ています。リンク経由で商品をご購入いただくと〜」
- 修正後: 「本ページは記念品・サービスのご紹介を含みます。一部リンクには広告を含む場合があります。」（購買誘導ニュアンス抑制）

### 3. css/components.css — `.affiliate-card` を `.related-items` へ

**変更対象**: [css/components.css:1110-1230](css/components.css#L1110-L1230) の 117 行ブロック全体を、**短い `.related-items` スタイル** に置換。

```css
/* =======================================================================
   Related Items — 診断結果下の関連情報リンク（暫定：控えめトーン）
   ======================================================================= */

.related-items {
  margin-top: var(--space-8);
  padding: var(--space-5);
  background-color: var(--color-cream);
  border-radius: var(--radius-lg);
}

.related-items__heading {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
  color: var(--color-dark);
  margin-bottom: var(--space-2);
}

.related-items__notice {
  font-size: var(--text-xs);
  color: var(--color-muted);
  margin-bottom: var(--space-3);
}

.related-items__list {
  list-style: disc;
  padding-left: var(--space-5);
  margin: 0;
}

.related-items__list li {
  margin-bottom: var(--space-2);
  line-height: var(--leading-relaxed);
}

.related-items__list a {
  color: var(--color-medium);
  text-decoration: underline;
  text-decoration-color: var(--color-card-border);
  text-underline-offset: 3px;
}

.related-items__list a:hover {
  color: var(--color-terracotta);
  text-decoration-color: var(--color-terracotta);
}
```

**旧 `.affiliate-card` 系は全削除**（将来復活時は `git revert` で戻る）。

### 4. css/pages/guide.css — `.guide-product` 装飾を控えめに

**変更対象**: [css/pages/guide.css:94-196](css/pages/guide.css#L94-L196)

削除する要素:
- `.guide-product::before`（3色グラデーション上部ボーダー） → 削除
- `.guide-product__cta` と `.guide-product:hover .guide-product__cta` → ブロックごと削除
- `.guide-product:hover` の `transform: translateY(-4px)` → 削除（`<div>` なのでホバー上昇は不要）

変更する要素:
- `.guide-product` の `transition` → `box-shadow` のみ残す
- `.guide-product__pr` の背景色 `#5C4F44` はそのまま（ステマ対応で PR 表記は可視性必要）

グリッド構造（`.guide-product-grid` とブレイクポイント）は維持。

---

## Critical Files

- [shindan.html](shindan.html) — L160-L197 置換
- [guide/meimei-tools.html](guide/meimei-tools.html) — L95 文言修正、L102-L184 の `<a class="guide-product">` × 7 を `<div>` 化 + CTA 削除
- [css/components.css](css/components.css) — L1110-L1230 の `.affiliate-card` 系 → `.related-items` 系に置換
- [css/pages/guide.css](css/pages/guide.css) — L94-L196 の `.guide-product` 装飾削減

変更対象外（そのまま温存）:
- [js/core/analytics.js](js/core/analytics.js) — `affiliate_clicked` イベント定義
- [js/core/boot.js](js/core/boot.js) — アフィリクリックハンドラ
- [privacy-policy.html](privacy-policy.html) — プライバシー節は既存通り維持

---

## Verification

### 1. 静的確認（ブラウザ目視）

Vercel dev 起動:
```bash
npx vercel dev
```

以下を確認:
- `http://localhost:3000/shindan.html` で「山田 太郎」等を入力 → 診断実行
  - 結果下に「🎋 もっと知りたい方へ」の **コンパクトな4項目リスト** が表示される（派手なカードでない）
  - `[PR]` 表記が 1 行で存在する
  - クリックすると `/guide/meimei-tools#meimei-sho` 等の適切なアンカーへ遷移する
- `http://localhost:3000/guide/meimei-tools.html` を開く
  - 商品カード 7 枚が **CTA ボタンと価格表示なしで** 表示される
  - どのカードをクリックしても **何も起きない**（`<div>` のため意図した挙動）
  - 記事冒頭の pr-notice 文言が「記念品・サービスのご紹介を含みます〜」に変わっている
  - 商品カード右上の `PR` ラベルは残っている

### 2. DevTools 確認

Chrome DevTools Elements:
- `shindan.html` 結果画面に `.affiliate-cards` クラスが **存在しない**、`.related-items` クラスが存在
- `guide/meimei-tools.html` の全 `.guide-product` が `<div>` である（`<a>` ではない）
- `href="#"` を grep しても検索ヒットがゼロ（死リンク完全撲滅）

### 3. モバイル表示確認

Chrome DevTools モバイルエミュレート（iPhone 14 Pro, Galaxy S20）:
- shindan 結果下の related-items が 1 列表示で違和感なく見える
- guide-product の 1 列表示で CTA なしカードが不自然でない

### 4. 既存スクリプトでの動作確認

[scripts/debug-shindan-flow.py](scripts/debug-shindan-flow.py) または [test-ios-safari.py](test-ios-safari.py) を流用し:
```bash
python scripts/debug-shindan-flow.py
```
スクショが `test_screenshots/04_results.png` に保存されることを確認し、**変更前のスクショ** と比較して見た目が「控えめ」になっていることを目視確認。

### 5. AdSense 審査準備チェック

- [ ] `shindan.html` / `guide/meimei-tools.html` に「購買を強く促す文言」が残っていない
- [ ] [PR]／広告表記は適切に残っている（完全削除すると逆にステマ規制違反）
- [ ] プライバシーポリシーにアフィリエイト参加表記がある（既存確認）
- [ ] 「広告なし」文言が `index.html` に残存していないか grep 確認:
  ```bash
  grep -r "広告なし" *.html
  ```
  もし見つかれば同時に「会員登録不要ですぐ使える」等に修正

---

## 作業時間見積もり

- HTML 修正（2 ファイル）: 20 分
- CSS 修正（2 ファイル）: 30 分
- ローカル動作確認 + スクショ比較: 20 分
- Git commit + master 直 push: 10 分

**合計: 約 1.5 時間**

実装完了後、本プランの Phase 4（マネタイズ本格稼働）は AdSense 承認通知が届いてから再開する。
