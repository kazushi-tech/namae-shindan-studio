# Playwright 徹底UIレビュー & 発見した問題の修正

## Context

ユーザーから「ちょいちょい変な動作がある」「**五格の項目をクリックしないと『コラム記事』が見れなかったりする**」との報告。Phase 3 実装（`ec73561`）でページ数とUIが大幅に増え、短期間で積み上がってきたためリグレッションが溜まっている可能性が高い。Playwright で**全ページ・全シナリオを網羅的に叩いて変な挙動を全部洗い出し**、優先度を付けて一気に潰す。

---

## 事前調査で既に見えている「ほぼ確定」のバグ

### 🔴 P0: 診断するまで「📚もっと詳しく知る／アフィリエイトカード／もう一度診断する」が全部見えない

- [shindan.html:137-252](shindan.html#L137-L252) — `<section id="result-section">` が、五格グリッドだけでなく以下も**全部内包**している:
  - L189〜225: `affiliate-cards`（🎋決まった名前を、形に残しませんか？）
  - L228〜233: `related-pages`（📚もっと詳しく知る）
  - L235〜246: 「もう一度診断する」/「五格について詳しく」/「お気に入り一覧」ボタン群
  - L249〜251: 免責事項
- [js/ui-controller.js:42-47](js/ui-controller.js#L42-L47) — 初期化時に `resultSection.remove()` で丸ごと DOM から剥がす
- [js/ui-controller.js:168-171](js/ui-controller.js#L168-L171) — 診断成功時に `insertBefore()` で戻す
- **結果**: 診断ボタンを押すまで「関連ページ（コラム導線を含む）」「アフィリエイトカード」まで不可視。ユーザーの主訴と完全一致。

### 🟡 P1: 共有URL直アクセス時の DOM 参照の脆さ

- [js/ui-controller.js:45](js/ui-controller.js#L45) — `_resultNextSibling` を初期化時のスナップショットで保持
- ページ読込と同時に `?sei=X&mei=Y` で自動診断する経路があるとタイミング次第で DOM の位置がズレる懸念

### 🟡 P2: privacy-policy.html が診断用 `js/app.js` を読み込みコンソールエラー

- [plans/release-followup-2026-03-20.md](plans/release-followup-2026-03-20.md) で既知だが未対応

### 🟡 P3: iOS Safari モバイル幅での横膨張（修正済み領域の再検証）

- `test-ios-safari.py` が過去に走っており、`.gokaku-card`/`.gokaku-grid` の `offsetWidth` 計測コードが残っている

### 🟢 その他の怪しげな箇所

- [shindan.html:194,202,210](shindan.html#L194) — `<span class="pr-label affiliate-card__label"></span>` が空（CSS `::before` で PR 表示する前提なら要確認）
- [shindan.html:164](shindan.html#L164) — `#og-preview` が `hidden` 属性、他は JS で `display:none` 切替 → 制御の混在
- SW (`sw.js`) を [shindan.html:296-299](shindan.html#L296-L299) で毎回 unregister している → キャッシュが崩れているユーザー救済中？要確認

---

## アプローチ

Playwright 徹底監査 → 発見リストをユーザーと合意 → 修正 → 再監査 の 3 段。

### Phase A: Playwright 監査スクリプトの作成・実行（読み取りのみ）

**既存資産を活かす**:
- [test_shindan.py](test_shindan.py) — Chromium / localhost:8765 での E2E（1ケースのみ）
- [test-ios-safari.py](test-ios-safari.py) — WebKit iPhone エミュレーション
- `test_screenshots/` に過去出力あり

**新規作成**: `scripts/playwright-audit.py`

機能:
1. **3 viewports** で全ページ巡回
   - Chromium デスクトップ 1280×900
   - Chromium モバイル 390×844 (iPhone 14)
   - WebKit iPhone 375×812（可能なら）
2. **対象ルート**（`site.config.json`／`sitemap.xml` 準拠）
   - `/`, `/shindan.html`, `/shindan.html?sei=山田&mei=太郎`（共有URL経路）, `/about.html`, `/suggestion.html`, `/favorites.html`, `/privacy-policy.html`
   - `/guide/meimei-tools.html`, `/guide/faq.html`
   - `/kanji/蓮.html` ほか 1〜2 漢字
   - `/ranking/2026-girls.html`, `/ranking/2026-boys.html`
3. **各ページで収集**
   - `page.on('console')` で全エラー/警告
   - `page.on('pageerror')` で JS 例外
   - `page.on('response')` で 4xx/5xx 応答
   - `document.documentElement.scrollWidth > window.innerWidth` （横スクロール検出）
   - `<img>` の `naturalWidth===0`（画像ロード失敗）
   - `<a>` の空 href / text empty / target="_blank" で rel 欠落
   - `h1` が 1 個か、見出し階層の抜け
4. **インタラクション検査**（shindan.html のみ）
   - 直接アクセス → 「🎋アフィリカード」「📚もっと詳しく知る」が DOM に**いるか**（= 診断前の可視性）
   - 共有URL アクセス → 結果 DOM の位置が form 直下に収まるか（body 末尾などに飛んでいないか）
   - 「もう一度診断する」クリック後の状態
   - お気に入りトグル、OG 生成ボタン、シェアリンク生成
5. **出力**
   - `test_screenshots/audit/` にページごとのフルページ PNG
   - `test_screenshots/audit/report.md`：URL × viewport × 検出項目の表
   - コンソールにサマリ

### Phase B: 発見物の仕分け（ユーザー合意）

Phase A のレポートを共有して、以下を合意する:
- 🔴 P0 コラム見えない問題 → 構造変更が必要（案は下記）
- 🟡 P1〜P3 → ついでに修正
- 🟢 発見した細かい不具合 → 修正する／PR 起票で棚上げ

### Phase C: 修正

**主対応（P0）**: `shindan.html` の `#result-section` 内部から以下を外に出す
- `related-pages`（📚もっと詳しく知る）は **結果の有無に関係なく常時表示**。位置はフォームの下あたりが自然（または結果セクションとは別の固定セクションとして form 上に置く案も検討）
- `affiliate-cards` は **診断後だけ**で良さそうなので `#result-section` 内のままで問題ないが、ユーザー意図によっては常時表示に変更
- retry/favorites/about ボタン群は診断後だけで OK → 現状維持
- `disclaimer` も診断後だけで OK → 現状維持

**副次対応**:
- [js/ui-controller.js:42-47, 168-171](js/ui-controller.js#L42-L47) — `remove()/insertBefore()` 方式をやめ、**CSS の `hidden` 属性トグル**に戻す（DOM 参照の脆さと挿入位置ズレを同時に解消）
- [privacy-policy.html](privacy-policy.html) — 不要な `js/app.js` 読み込みを削除
- Phase A で発見した細かいコンソールエラー・リンク切れ・alt 抜け等を都度修正

### Phase D: 再監査

Phase A スクリプトを同じ条件で再実行し、差分を確認。**Critical/Major がゼロになるまでループ**。

---

## 変更候補ファイル

| ファイル | 予定内容 |
|----------|----------|
| `scripts/playwright-audit.py` | 新規。全ページ×複数viewport監査 |
| `shindan.html` | `related-pages` を `#result-section` 外へ移動 |
| `js/ui-controller.js` | DOM remove/insert 方式 → `hidden` 属性 or クラスに変更。`_renderRelatedPages` の呼出位置を検討 |
| `privacy-policy.html` | 不要な `js/app.js` の `<script>` 削除 |
| `css/pages/shindan.css` | 結果非表示時のレイアウト調整（必要なら） |
| その他 | 監査で発見した箇所を随時 |

---

## 再利用する既存ユーティリティ

- `test_shindan.py`, `test-ios-safari.py` のパターン（`page.on('console')`, `page.evaluate()` での DOM 測定）
- `site.config.json` / `sitemap.xml` からの URL 列挙
- 既存の `hidden` 属性パターン（`#og-preview` L164 で既に使っているので整合性が取れる）

---

## 検証（完了条件）

1. `python -m http.server 8765` で起動した状態で `python scripts/playwright-audit.py` を走らせ、`report.md` の **Critical/Major が 0**
2. `/shindan.html` に**診断前に直接アクセス**しても、`#related-pages-links` および外部コラムリンク（`column.namae-studio.com`）が可視（目視＋ Playwright `is_visible()` 確認）
3. `/shindan.html?sei=山田&mei=太郎` の**共有URL直アクセス**で、結果セクションが form の直下に正しく挿入される（`bounding box` の top が form の bottom より下）
4. `/privacy-policy.html` で**コンソールエラーが出ない**
5. Chromium desktop / Chromium iPhone14 / (可能なら) WebKit iPhone の 3 環境で横スクロール・コンソールエラーなし
6. 既存の `test_shindan.py` も pass のまま（5 枚のカード、5 つの badge が出る）

---

## 留意点

- Plan モード中は編集禁止のため、Phase A の実行は本プラン承認後に開始
- `node_modules/` に playwright パッケージが**ない**ため、Python 側 `playwright` 利用が前提（既存 `.py` テストと同じ）。未インストールなら `pip install playwright && playwright install chromium webkit` を案内
- 修正方針の P0（`related-pages` を外出し）はユーザーの意図次第で変わる可能性があるので、Phase B で合意を取ってから進む
