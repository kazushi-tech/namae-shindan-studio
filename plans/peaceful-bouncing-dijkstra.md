# 診断結果ページの「もっと知りたい方へ」セクションを削除

## Context

診断結果ページ [shindan.html](../shindan.html) の下部にある「🎋 もっと知りたい方へ」セクション（命名書・赤ちゃん筆・記念写真・キッズ時計の4リンク）について、以下の問題がある：

- **アフィリエイト未提携**: 命名書（a8）・赤ちゃん筆（moshimo）・記念写真（afb）の3プログラムは登録完了しておらず、リンク先は `/guide/meimei-tools#xxx` の内部アンカーに留まる。`[PR] 一部リンクは広告を含みます` と表記しつつ実需を伴わない広告導線は信頼性を損なう。
- **シェア導線との競合**: 診断結果直後は X / LINE / Facebook シェアがメインCTA。未提携アフィリエイトカードが視線を分散させ、シェアCVRの低下要因となる。
- **キッズ時計の重複**: 残り1項目のキッズ時計は既に [index.html](../index.html) / [suggestion.html](../suggestion.html) / [ranking/index.html](../ranking/index.html) に `promo-card--kids-tokei` として掲載済みで、shindan.html での重ねがけは不要。

ユーザー判断： **セクションごと完全削除**（HTML から物理削除）、CSS は将来の再利用に備え保持。

## Scope

影響範囲は `shindan.html` の1ファイルのみ（他ページへの流用なし、調査済み）。JS の計測ロジック（[js/core/boot.js:44-51](../js/core/boot.js#L44-L51) の `sponsored` リンク自動計測）は他ページの promo-card が依存するため無変更。

## Changes

### 1. shindan.html から related-items セクションを削除

**対象**: [shindan.html:164-173](../shindan.html#L164-L173)

削除する HTML ブロック：

```html
<section class="related-items" aria-labelledby="rel-heading" data-reveal="fade" data-reveal-delay="120">
  <h2 class="related-items__heading" id="rel-heading">🎋 もっと知りたい方へ</h2>
  <p class="related-items__notice">[PR] 一部リンクは広告を含みます。</p>
  <ul class="related-items__list">
    <li><a href="/guide/meimei-tools#meimei-sho" ...>命名書について — …</a></li>
    <li><a href="/guide/meimei-tools#akachan-fude" ...>赤ちゃん筆について — …</a></li>
    <li><a href="/guide/meimei-tools#photo" ...>記念写真について — …</a></li>
    <li><a href="https://www.kids-tokei.com/" ...>キッズ時計（外部サイト）— …</a></li>
  </ul>
</section>
```

前後の要素との段間スペースは既存の CSS 変数（`--space-*`）で自動調整されるため、余白の手動調整は不要。

### 2. 保持するもの（触らない）

- **[css/components.css:1451-1494](../css/components.css#L1451-L1494) の `.related-items__*` スタイル**: 将来の再掲載（提携完了時）に備えて残す。未使用 CSS だが、BEM 設計の一貫性とロールバック容易性を優先。
- **[css/pages/shindan.css:916-919](../css/pages/shindan.css#L916-L919) のモバイル微調整**: 同上。
- **[js/core/boot.js:44-51](../js/core/boot.js#L44-L51) のアフィリエイト計測**: 他ページの `rel="sponsored"` リンク（キッズ時計 promo-card 等）が依存。
- **他ページの promo-card（キッズ時計）**: [index.html:174-198](../index.html#L174-L198), [suggestion.html:179-198](../suggestion.html#L179-L198), [ranking/index.html:112-131](../ranking/index.html#L112-L131) は全て維持。

## Verification

### ローカル確認
1. `shindan.html` をブラウザで開き `?sei=不二樹&mei=和志` 等のクエリで診断実行
2. 診断結果表示後、以下を目視確認：
   - 総格カードの下に「もっと知りたい方へ」セクションが**表示されない**こと
   - 「診断結果をシェア」セクション（X/LINE/Facebook）が従来通り表示されること
   - お気に入り登録バナー → 「お気に入りに追加 / OG画像ダウンロード」ボタン → 下部CTAの縦リズムが崩れていないこと
3. モバイルサイズ（〜767px）でも同様に確認

### 他ページのリグレッション確認
- [index.html](../index.html) ホームのキッズ時計 promo-card が表示されること
- [suggestion.html](../suggestion.html) 名前候補ページのキッズ時計 promo-card が表示されること
- [ranking/index.html](../ranking/index.html) ランキングページのキッズ時計 promo-card が表示されること

### 回復手順（将来アフィリエイト提携時）
`git log -- shindan.html` からこのコミットを特定 → 該当ブロックを復元すれば即再掲載可能。CSS (`.related-items__*`) は保持されているため追加作業不要。
