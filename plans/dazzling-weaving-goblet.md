# ガイド記事の情報部分のみ復活 (PR 要素削除)

## Context

2026-04-24 のコミット [0df3437](https://github.com/) 「lp-scalable-sonnet 実装」で、提携先 (アフィリエイト) が未確定の 4 ガイド記事 (`meimei-tools` / `shussan-list` / `meimei-hikaku` / `miyamairi`) が一括で下書き化された。結果、本番 (namae-studio.com/guide) では FAQ 1 枚しか見えない状態になっており、ユーザーから「ガイドがほとんど消えている」との指摘を受けた。

方針は、**商品カード / PR セクション / 比較表のダミー部分を削って、純粋な情報・解説コンテンツだけを復活** する。提携先が決まり次第、再度 PR ブロックを追加する形に戻せるよう、ファイルは温存して中身を編集する。

### 復活スコープ

| 記事 | 状態 | 理由 |
|---|---|---|
| [guide/meimei-tools.html](guide/meimei-tools.html) | ✅ 復活 | 商品カード 7 個を削除、§1-§3 の解説テキストと §4 のリストは情報として成立 |
| [guide/shussan-list.html](guide/shussan-list.html) | ✅ 復活 | 「記念に残るアイテム」セクション 1 個だけ削除、チェックリスト §1-§7 は独立した情報コンテンツ |
| [guide/miyamairi.html](guide/miyamairi.html) | ✅ 復活 | 「記念品・撮影のアイデア」セクションだけ削除、儀礼カレンダー + rite-card + FAQ は独立成立 |
| [guide/meimei-hikaku.html](guide/meimei-hikaku.html) | 🚧 下書き維持 | 比較表が「サンプル A/B/C/D/E」というダミーデータで、削除すると「徹底比較」というタイトルが成立しない。実サービス名が入るまで保留 |

---

## 変更ファイル

### 1. [guide/meimei-tools.html](guide/meimei-tools.html)

- L2: `<html lang="ja" data-draft="true">` → `<html lang="ja">`
- `<meta name="robots" content="noindex,nofollow">` 行を削除
- L99: `<p class="pr-notice">…</p>` を削除
- L106-131: §1 商品グリッド (命名書 3 個) を削除
- L136-153: §2 商品グリッド (赤ちゃん筆 2 個) を削除
- L155-159: Ad Slot を削除
- L164-181: §3 商品グリッド (写真 2 個) を削除
- タイトル検討: 「名付けに必要なアイテム 30 選」 → 30 選の根拠が消えるため、**「名付けの記念アイテム入門」** に変更 (`<title>` / `og:title` / `h1` / guide/index.html のタイル見出し・description を合わせて更新)
- §1-§3 の見出し直下に残る解説テキストは保持。§4 の「その他の名付け関連アイテム」リストは保持

### 2. [guide/shussan-list.html](guide/shussan-list.html)

- L2: `<html lang="ja" data-draft="true">` → `<html lang="ja">`
- `<meta name="robots" content="noindex,nofollow">` 行を削除
- L99: `<p class="pr-notice">…</p>` を削除
- L181-208: `<h2>記念に残るアイテム</h2>` + `.guide-product-grid` (命名書 / 赤ちゃん筆 / 手形足形 の 3 カード) 一式を削除
- タイトル「出産準備リスト完全版 2026」は §1-§7 のチェックリストで成立するため変更不要

### 3. [guide/miyamairi.html](guide/miyamairi.html)

- L2: `<html lang="ja" data-draft="true">` → `<html lang="ja">`
- `<meta name="robots" content="noindex,nofollow">` 行を削除
- L236: `<p class="pr-notice">…</p>` を削除
- L237-262: 「記念品・撮影のアイデア」セクション (見出し + 3 カード) を削除
- タイトル「お宮参り・お七夜の完全ガイド」は儀礼カレンダー + rite-card + FAQ で成立するため変更不要

### 4. [guide/index.html](guide/index.html)

- L103-132 の HTML コメントを再構成:
  - `meimei-tools` / `shussan-list` / `miyamairi` の 3 タイルをコメントから出す
  - `meimei-hikaku` タイル (L118-124) だけ別コメントで残す
  - 冒頭コメント文面を「meimei-hikaku は比較表データ確定待ちで下書き化中」に更新
- L135-141 の「準備中の記事」セクション: 文言を「**『命名書サービス徹底比較 2026』は現在準備中です**」に絞る (4 記事列挙をやめる)
- タイル順の見直し: FAQ → meimei-tools → shussan-list → miyamairi の 4 枚表示 (meimei-hikaku は復活時に末尾追加予定)

### 5. [sitemap.xml](sitemap.xml)

L116 の `/guide/faq` エントリの後ろに以下 3 URL を追加 (`<lastmod>2026-04-24</lastmod>` / `<changefreq>monthly</changefreq>` / `<priority>0.7</priority>`):

- `https://namae-studio.com/guide/meimei-tools`
- `https://namae-studio.com/guide/shussan-list`
- `https://namae-studio.com/guide/miyamairi`

`meimei-hikaku` は追加しない。

---

## 破綻リスクと対処

| リスク | 対処 |
|---|---|
| meimei-tools タイトル「30 選」が実態と合わなくなる | タイトル・`<title>`・`og:title`・h1・index タイルを「名付けの記念アイテム入門」に統一 |
| 商品グリッド削除後、セクションが薄くなる | §1-§3 の解説テキスト (書体 / 赤ちゃん筆 / 写真) は 1〜2 段落保持されているので情報として成立。§4 の箇条書きリストで補強 |
| 目次アンカー (`id="compare-table"` 等) がリンク切れにならないか | 各記事で目次はテキストリンクではなく単なる `<h2 id>` 参照なので、セクション見出しごと消せば問題なし。meimei-hikaku は保留なので影響外 |
| CSS (`.guide-product`, `.pr-notice`, etc.) が未使用になって肥大 | meimei-hikaku が将来復活するため CSS は温存。今回は削除しない |
| `.claude/settings.local.json` が git 追跡外 | 本件に無関係。そのまま放置 |

---

## 検証手順

1. **ローカル静的サーバー起動**: リポジトリルートで `python -m http.server 8080`
2. **ブラウザで手動確認**:
   - `http://localhost:8080/guide/` で 4 タイル (FAQ + 3 復活) が表示され、「準備中の記事」が命名書比較 1 件になっている
   - `http://localhost:8080/guide/meimei-tools` で商品カードが一切表示されず、§1-§4 の解説だけ残っている
   - `http://localhost:8080/guide/shussan-list` で「記念に残るアイテム」セクションが消え、チェックリストのみ表示
   - `http://localhost:8080/guide/miyamairi` で「記念品・撮影のアイデア」セクションが消え、儀礼カレンダー + rite-card + FAQ だけ表示
   - `http://localhost:8080/guide/meimei-hikaku` は相変わらず下書きで index から辿れない
3. **メタタグ確認**: 復活 3 記事の HTML ソースに `noindex,nofollow` が残っていないこと / `data-draft` 属性が消えていること
4. **sitemap 確認**: `http://localhost:8080/sitemap.xml` で復活 3 URL が追加されていること
5. **スクリーンショット**: `scripts/capture-motion-screens.py` があれば guide ページのスクショを撮り直し
6. **コミット & push**: master 直 push で本番反映 (Vercel 自動デプロイ)

---

## 参考: meimei-hikaku の今後

比較表を実サービス名 (提携確定後) に差し替えるか、「比較」ではなく「選び方ガイド」にタイトル/角度を変更するかは、提携先が 1 社でも決まった段階で再判断。それまでは noindex + data-draft 維持で、index.html からも非表示のまま。
