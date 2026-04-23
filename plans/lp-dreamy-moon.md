# サイト不具合の網羅修正プラン — 実走行で検出した P0/P1/P2

## Context

ユーザーから「ページが遷移しない」「キッズ時計のLPに遷移しない」等、動作に多数の問題があるとのフィードバック。わらわが実際に Playwright で `http://localhost:8765`（python -m http.server）を立ち上げ、全 13 HTML ページを巡回＋診断フロー＋ランキング→診断→関連ページ→戻る…といった多経路を踏みながら検証。複数の実害バグと UX 破綻を検出した。本計画はそれらを P0（ユーザ直撃）→ P1（広範囲の体験毀損）→ P2（整備項目）の順で整理し、最短の修正手順とコード・ファイル位置を明示する。

前提メモ:
- 本番は Vercel で `cleanUrls: true`（[vercel.json:2](vercel.json#L2)）。`/shindan` 等の拡張子なし URL は本番で `.html` に書き換えられる。ただしローカル静的サーバーでは全て 404、本番でも内部リンクと sitemap/shindan?mei=... 経由の URL が拡張子の有無で混在しており、脆い。
- `kanji/` 配下には 10 字（蓮・結・凛・咲・心・陽・翔・葵・蒼・優）のみ。`data/kanji-meanings.json` も 10 エントリ。
- Vercel `cleanUrls: true` は `/kanji/太.html` が存在しないと `/kanji/太` も 404 にする。

---

## 検出した問題（優先度順）

### 🔴 P0-1: 診断結果の「📖 『{名の頭文字}』の詳細・由来を見る」が 404 多発

- **症状**: 山田**太**郎で診断すると、関連ページに `/kanji/太` が表示される → クリックすると 404。漢字ページは 10 字しか生成されておらず、それ以外の字で診断すると必ず死リンクになる。
- **影響範囲**: 結果画面の関連ページは最もクリック率が高い導線の一つ。ここが死ぬとサイト内回遊が止まる。
- **原因**: [js/ui-controller.js:331-336](js/ui-controller.js#L331-L336) の `_renderRelatedPages` が、名の頭文字を無条件で `/kanji/{字}` 化している。漢字ページ実在チェックをしていない。
- **修正方針**:
  1. ビルド時 or ランタイムで「漢字ページ実在リスト」を JS から参照可能にする。最小手順は `data/kanji-meanings.json` の `kanji` キーを `window.__KANJI_PAGES__` として [shindan.html](shindan.html) に `<script>` で埋め込む（fetch 不可な静的構成でも動く）。
  2. `_renderRelatedPages` 冒頭で `if (!window.__KANJI_PAGES__?.[firstMei]) skip` のガード。
  3. もしくは、名の各字をループして実在する最初の字を採用（例「太郎」なら太が無ければ郎をチェック → それも無ければ行ごと出さない）。

### 🔴 P0-2: `/suggestion?soukaku=N` の URL パラメータが完全に無視される

- **症状**: 関連ページの「🔢 総画{N}画の他の名前を探す」をクリックすると /suggestion に飛ぶが、フィルタは未適用で 60 件デフォルトが並ぶ → ユーザーは「何も起きなかった」と感じる。
- **原因**: `js/suggestion-page.js` が URLSearchParams を読み取っていない（実装漏れ）。
- **修正方針**:
  1. [js/suggestion-page.js](js/suggestion-page.js) の `init()` 相当箇所で `new URLSearchParams(location.search)` を読み、`soukaku` / `sei` / `gender` / `chars` / `fortune` 等が来ていたら対応フォーム要素に値投入 → 自動で検索実行。
  2. ついでに `/ranking/` や `/kanji/{字}` からの遷移も同じ経路で受け取れるよう、`kanji=` パラメータも想定（含みたい漢字にプリセット）。

### 🔴 P0-3: ランキング／漢字辞典 → 診断 への `?mei=xxx` が無視される

- **症状**: [ranking/2026-girls.html] や [kanji/蓮.html] の「詳細診断」ボタンは `/shindan?mei=陽葵` の形で 名 のみ渡す。ところが shindan 側は sei と mei の**両方が揃わないと何もしない**。結果として名も埋まらず、ユーザーは再度手入力する羽目になる。
- **原因**: [js/app.js:84](js/app.js#L84)  
  ```js
  if (seiParam && meiParam && els.seiInput && els.meiInput) {
    els.seiInput.value = seiParam; els.meiInput.value = meiParam; handleShindan();
  }
  ```
  両方揃わない分岐を定義していない。
- **修正方針**:
  1. 片側だけでも来ていれば入力欄に値を入れる。
  2. 両方揃っていれば自動診断（既存挙動）。
  3. 片側だけなら空いている側にオートフォーカス＋軽いヒント（placeholder更新 or 小さな案内文）。

### 🔴 P0-4: ナビゲーションが全ページでバラバラ（コラム／お気に入りが消失）

各ページのメインナビ構成：

| ページ | コラム | ⭐お気に入り |
|---|:--:|:--:|
| /, /shindan, /about, /privacy-policy | ✅ | ❌ |
| /favorites | ❌ | ✅ |
| /suggestion, /ranking/*, /guide/*, /kanji/*, /404 | ❌ | ❌ |

- **症状**: ユーザーが診断後にランキングへ飛ぶとコラムリンクが突然消える。お気に入りは favorites.html にしか出ないので他ページから到達不能。
- **原因**: ナビが各 HTML にコピペされており、追加タイミングがずれたまま放置。
- **修正方針**:
  1. **共通ナビを1か所に統一**。全 13 HTML を同じ構成に揃える（ホーム / 姓名判断 / 名前候補 / ランキング / 漢字辞典 / ガイド / 五格 / ⭐お気に入り / コラム）。
  2. 恒久策として [js/core/nav.js](js/core/nav.js)（既に存在）を拡張し、ビルド or ランタイムでナビをテンプレ注入する方式に寄せる。今回は最小差分で先に全ページの `<nav>` を手動同期。
  3. 現ページを示す `aria-current="page"` は各ページで正しく当てる。

### 🔴 P0-5: キッズ時計カードに関する疑い（再現はせず／但し副因あり）

- **検証結果**: デスクトップ／モバイル両方で `a[href="https://www.kids-tokei.com/"]` は可視・クリック可能・`target="_blank" rel="noopener noreferrer"` 付き。CSP も外部遷移を阻害しない。→ 単体のリンクとして壊れてはいない。
- **推定される副因**:
  1. **結果セクションが表示されていないと見えない**ため、ユーザーが診断未実行の状態でページを下にスクロールしても出ない → 「遷移しない」と誤認する可能性。
  2. モバイルで `affiliate-card` のラッパが横スクロール化する UI 未整備（今はグリッド、横幅 390px でも1列だがスクロール位置が遠い）。
  3. `data/kanji-meanings.json` に 2 件（実際は kanji キー内に 10 件）しかなく、前述の P0-1 と組み合わさって「診断完了後に表示される関連導線のうち、キッズ時計カードより上の漢字リンクが全部 404」で「ここからどこにも行けない」と感じた可能性。
- **修正方針**:
  - P0-1 を直せば結果画面内の他リンクが生き返り、キッズ時計を含むアフィリ帯の目的が明確化する。
  - 加えて、**診断結果画面で「アフィリ 4 枚の少なくとも 1 枚」は画面内に露出する位置に `affiliate-cards` セクションを上げる**（現在は 3,187px 位置 → モバイルで遠すぎ）。gokaku-grid 直下が理想。実装は [shindan.html](shindan.html) 内のセクション順序を入れ替えるだけで可能。

---

### 🟠 P1-1: URL の拡張子有無の混在（Vercel cleanUrls 前提が脆い）

- ナビの `href` は `/shindan`（拡張子なし）、sitemap やユーザー共有 URL は `/shindan.html`（拡張子あり）の混在。Vercel 以外の静的ホスティング・ローカル確認・一部 CDN での挙動差に繋がる。
- **修正方針**: 方針を一本化（拡張子なしで統一 ＋ `trailingSlash: false` は既設定なので維持）。`sitemap.xml` と shindan.html 内の内部リンクを全面 cleanUrl 形式へ。シェア用カノニカル URL を `<link rel="canonical">` で明示する（[shindan.html](shindan.html) は入っているか要確認）。

### 🟠 P1-2: `<img id="og-preview-img" alt="OG画像プレビュー">` が空 `src` でネット越しに 404 扱い

- ブラウザは空 src を現在 URL 相対で解決しリソース要求→ [shindan.html] のトップに 404 が 1 件発生。CLS/パフォーマンス悪影響。
- **修正方針**: 初期は `src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>"`（透明プレースホルダ）にする、あるいは生成タイミングまで DOM に追加しない。

### 🟠 P1-3: モバイルハンバーガー展開時の項目重複

- 390px でハンバーガーを開くと「ホーム／姓名判断／五格について」等がメインメニューとドロワー側で 2 重に並ぶ（合計 15 リンク表示）。
- **修正方針**: [js/core/nav.js](js/core/nav.js) と CSS で、ドロワー展開中は主ナビのアクセシブルな重複を避ける。ドロワー DOM に主ナビと同じ項目を置く設計なら、片方を `aria-hidden="true"` ＋ `display:none` に制御する。

### 🟠 P1-4: 動的アフィリ配置がモバイル下部すぎる

- 診断結果のアフィリ帯（キッズ時計含む）はモバイルで y=3,187px 付近。結果サマリからスクロール3画面分下。意図したCTR が出ない。
- **修正方針**: [shindan.html](shindan.html) の結果セクション順序を `gokaku-grid → affiliate-cards → share-section → related-pages` の順に並び替え、結果見終わった直後の視界に 1 枚は入る構成に。

---

### 🟡 P2-1: `shindan-embed` 共通ミニフォームが未実装

- 計画書[plans/4-ui-ux-stitch2-cheeky-haven.md:117](plans/4-ui-ux-stitch2-cheeky-haven.md#L117) に全ページ下部配置が書かれているが、どこにも存在しない。
- **修正方針**: 別タスクで計画。今回の修正ではスコープ外。

### 🟡 P2-2: ナビが全 13 ページにハードコード（将来の差分リスク）

- P0-4 の再発防止のため Handlebars 化推奨。但し今回は最小差分優先で、全ページの `<nav>` を同一 HTML スニペットに揃えるところまで。

### 🟡 P2-3: kanji ページの拡充

- 10 字しか無いので P0-1 のホワイトリスト方式で回避するが、SEO目的では最低 300 字のビルド投入（計画 Phase 3）が本丸。別タスク。

---

## Critical Files（修正対象）

- [js/ui-controller.js](js/ui-controller.js) — `_renderRelatedPages` で漢字ページ実在チェック（P0-1）
- [js/app.js](js/app.js) — URLパラメータ処理を片側対応へ拡張（P0-3）
- [js/suggestion-page.js](js/suggestion-page.js) — URLパラメータを読み取り検索プリセット（P0-2）
- [js/core/nav.js](js/core/nav.js) — 可能ならテンプレ注入化（P0-4 恒久策）/ ドロワー制御（P1-3）
- 全 13 HTML（[index.html](index.html), [shindan.html](shindan.html), [about.html](about.html), [privacy-policy.html](privacy-policy.html), [favorites.html](favorites.html), [suggestion.html](suggestion.html), [ranking/index.html](ranking/index.html), [ranking/2026-girls.html](ranking/2026-girls.html), [ranking/2026-boys.html](ranking/2026-boys.html), [guide/index.html](guide/index.html), [guide/meimei-tools.html](guide/meimei-tools.html), [guide/faq.html](guide/faq.html), [kanji/index.html](kanji/index.html), [kanji/{字}.html](kanji/) 10 枚, [404.html](404.html)） — `<nav>` 同期（P0-4）
- [shindan.html](shindan.html) — 結果セクションの順序見直し＋ `og-preview-img` の初期 src（P1-2, P1-4）
- [sitemap.xml](sitemap.xml) — URL 形式の統一（P1-1）

### 新規/参照データ

- `data/kanji-meanings.json` の `kanji` キー群 → shindan.html に `<script>window.__KANJI_PAGES__ = {...}</script>` 形式で inline 埋め込み（P0-1）

---

## 実装順序（最小差分で最大効果）

1. **P0-1**: `_renderRelatedPages` に実在チェック。`window.__KANJI_PAGES__` を `shindan.html` にインライン。→ 結果画面の死リンク撲滅。
2. **P0-3**: `app.js` の URLパラメータ処理分岐を改修。`mei` 単独でもフォーム埋め＆フォーカス。→ ランキング・漢字ページからの送客が生きる。
3. **P0-2**: `suggestion-page.js` に URLParams プリセット。→ 総格リンクが機能。
4. **P0-4**: 全 13 HTML の `<nav>` を同一構成に統一（コラム ＋ ⭐お気に入りを全ページ追加、順序固定）。
5. **P1-4**: shindan 結果セクション並び替え（アフィリ帯を上へ）。
6. **P1-2**: `og-preview-img` の空 src 修正。
7. **P1-3**: ドロワー展開時の重複ナビ処理。
8. **P1-1**: 内部リンク／sitemap を cleanUrl 統一。

---

## Verification（動作確認手順）

ローカル検証:

```bash
cd "c:/Users/PEM N-266/work/名前診断スタジオ"
python -m http.server 8765 &
# Vercel cleanUrls を模した動作確認は `vercel dev` 推奨（但し未インストール）
```

Playwright 確認コマンド（修正後に通るべき期待値）:

1. **P0-1**: `/shindan?sei=山田&mei=太郎` を開く → 関連ページに「太」「郎」の直リンクが**現れない**こと（存在しないから）。逆に `sei=田中&mei=蓮` で開けば「蓮」の直リンクが**表示され 200 応答**すること。
2. **P0-2**: `/suggestion?soukaku=21` を開く → フォームの総格フィルタが `21` プリセット、検索結果カードが 21 画の候補のみになる。
3. **P0-3**: `/shindan?mei=陽葵` を開く → `#mei-input` に "陽葵" が入っており、`#sei-input` にフォーカスが当たっている。Submit は未実行（sei 未入力のため）。
4. **P0-4**: 全 13 ページでナビの項目列挙が完全一致。`.nav__link` の textContent 配列を JS で取得して set で一致確認。⭐お気に入りとコラムが全ページに存在。
5. **P1-4**: モバイル 390px で `/shindan.html?sei=山田&mei=太郎` を開いた時、`a[href*="kids-tokei"]` の `getBoundingClientRect().top` が 2,000px 以下（現状 3,187px → ファーストビュー+2画面で届く位置に下がる）。
6. **P1-2**: DevTools Network で空 src 由来の 404 ログが出ないこと。
7. **P1-1**: `sitemap.xml` の全 URL と全 HTML 内の `href` が拡張子の有無で整合（全て拡張子なし推奨）。

リグレッション確認:

8. 既存の診断フロー（山田太郎で Submit → 五格カード5枚表示 → シェアボタン／やり直しボタン）が従来通り動く。
9. [scripts/debug-shindan-flow.py](scripts/debug-shindan-flow.py) を再実行し全 STEP が通る。
10. test_screenshots/audit/ 配下のスクリーンショット（修正後も再撮影）で視覚回帰なし。

受け入れ:

- ユーザーが「どのページから辿ってもキッズ時計LPに到達できる／結果画面以降で死リンクに出会わない／ランキングから遷移して名がプリフィルされる」と体感できる状態。
