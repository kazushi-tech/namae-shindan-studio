# Phase 3 検索系機能の表示障害修正 + ビルド検証強化

## Context

ユーザー報告:「ランキング表示されてない」「名前候補ジェネレーターも使えない」「漢字辞典も使えない、検索系全部死んでる」。

現地調査の結果、根本原因は **Handlebars ビルドパイプラインの構造的欠陥**：

1. ソース版 HTML（リポジトリ直下の `suggestion.html` など）には `<script src="/js/suggestion-page.js">` がベタ書きされていた
2. しかし Phase 3 で導入した [scripts/build.js](scripts/build.js) は `templates/pages/*.hbs` + `content/*.json` から dist/ を生成するため、ソース HTML のスクリプトタグはビルド時に**消失**する
3. Handlebars テンプレートは `content/*.json` の `extraScripts` 配列を読んで `<script>` を出力する仕組みだが、Phase 3 で追加された content JSON には `extraScripts` が**未定義**
4. 結果: dist/ に page-specific JS の `<script>` タグが入らず、機能が完全に停止

さらに重要なのは、`b6c5dad fix(build): C1-C4 + Major 4 件 — verify 強化` が「通った」状態でこの不具合がデプロイされていること。理由は [scripts/build-verify.js](scripts/build-verify.js) が **外部 `<script src="...">` の存在検証をしていない**ため。title/description/OG/JSON-LD/inline script identifier しか見ていない。

つまり「Phase 3 機能死亡」と「品質ゲートが見逃した」の二段の問題で、両方を直さないと再発する。

## 影響範囲（確定）

| 機能 | パス | 状態 | 原因 |
|------|------|------|------|
| 名前候補ジェネレーター | `/suggestion` | **完全停止** | dist に `suggestion-page.js` の `<script>` 欠落 |
| ランキング詳細(男) | `/ranking/2026-boys` | **完全停止** | dist に `ranking-page.js` の `<script>` 欠落 |
| ランキング詳細(女) | `/ranking/2026-girls` | **完全停止** | dist に `ranking-page.js` の `<script>` 欠落 |
| ランキングハブ | `/ranking/` | 静的表示は OK（タイル誘導のみ） | スクリプト不要 |
| 漢字辞典ハブ | `/kanji/` | inline フィルタ script は dist に出ている | **要・実機再現** |
| 漢字辞典詳細 | `/kanji/{字}` | 静的表示のみで設計上スクリプト不要 | **要・実機再現** |
| ガイド | `/guide/*` | 静的ページ・スクリプト不要 | 影響なし |

漢字辞典は dist 上は inline script が出力されておりフィルタは動くはず。ユーザー報告との齟齬は実機で再現確認する。

## 修正方針

### A. 緊急修正（Phase 3 機能の復旧）

content JSON 3 つに `extraScripts` を追加するだけで直る。build.js / テンプレートは既にこのフィールドをサポート済み。

| ファイル | 追加内容 |
|---------|---------|
| [content/suggestion.json](content/suggestion.json) | `"extraScripts": ["/js/suggestion-page.js"]` |
| [content/ranking/2026-boys.json](content/ranking/2026-boys.json) | `"extraScripts": ["/js/ranking-page.js"]` |
| [content/ranking/2026-girls.json](content/ranking/2026-girls.json) | `"extraScripts": ["/js/ranking-page.js"]` |

レンダリング側（参考）:
- [templates/partials/core-scripts.hbs](templates/partials/core-scripts.hbs) — `extraScripts` を `<script src="...?v=buildVersion">` で展開
- [scripts/build.js](scripts/build.js) — content JSON のフィールドはそのままテンプレートコンテキストに渡る

### B. 漢字辞典の実機再現（必要に応じて追加修正）

`dist/kanji/index.html` の末尾に inline フィルタ script は確認済み。
ローカル `vercel dev` (or `python -m http.server` で `dist/` をホスト) で実機確認:

- `/kanji/` フィルタ入力 → 絞り込みが動くか
- `/kanji/蓮` 等の詳細ページ → 表示できるか
- ユーザー言う「使えない」が「フィルタ未動作」「詳細リンク 404」「JS 例外」のどれか特定

齟齬が判明したらこの Plan に追記して対応。

### C. 再発防止 — `build-verify.js` 強化

[scripts/build-verify.js](scripts/build-verify.js) に **外部 `<script src="...">` 存在検証**を追加:

ロジック:
1. ソース HTML（リポジトリ直下の `suggestion.html` など）から `<script src="/js/...">` を抽出
2. dist 側の対応 HTML から同じパスの `<script src="...">`（バージョンクエリ無視）を抽出
3. ソースに存在して dist に存在しない src があったらエラー
4. 既存の PAIRS 配列（line 20-38）の各ペアに対してこの検査を追加

これで「content JSON に extraScripts を入れ忘れた」事故は build:verify で必ず捕まる。

### D. レビューフローの再確認

CLAUDE.md の "Review gate"（重要マイルストーンで codex-review → 修正 → 再レビュー）に加え、ビルド検証側に以下を追加すべき:

- `npm run build:verify` を merge gate にする（CI 化は別 Plan）
- Phase 機能追加時は **必ず** ローカルブラウザで主要動線（ランキング閲覧→診断遷移、候補生成→結果表示、漢字フィルタ）を**人手で叩く**

## 修正対象ファイル（最小セット）

| 種別 | ファイル | 変更 |
|------|---------|-----|
| データ | [content/suggestion.json](content/suggestion.json) | `extraScripts` 追加 |
| データ | [content/ranking/2026-boys.json](content/ranking/2026-boys.json) | `extraScripts` 追加 |
| データ | [content/ranking/2026-girls.json](content/ranking/2026-girls.json) | `extraScripts` 追加 |
| 検証 | [scripts/build-verify.js](scripts/build-verify.js) | 外部 `<script src>` 存在検証ロジック追加 |
| 成果物 | `dist/**` | `npm run build` で再生成 |

## 検証手順（Playwright で実機確認）

### Step 1: ビルド & 静的検証
1. `npm run build` で dist 再生成
2. `npm run build:verify`（強化後）が pass — 外部 `<script src>` 欠落検査が通る

### Step 2: ローカルサーバ起動
別ターミナルで `dist/` をホスト:
```bash
cd dist && python -m http.server 8000
```
（Vercel の絶対パス `/data/...` を解決するため、`dist/` をルートにしてホストすること。プロジェクトルートでホストするとパスが二重になる）

### Step 3: Playwright スクリプトで実機検証

既存スクリプトを **ローカル向け改造**して走らせる。`BASE` 定数を `https://namae-studio.com` → `http://localhost:8000` に切り替え（環境変数 `BASE_URL` で上書きできるよう改造する）:

| スクリプト | 用途 | 改造内容 |
|----------|-----|---------|
| [scripts/e2e-full-regression.py](scripts/e2e-full-regression.py) | 全ページ console error 0 + スクショ | `BASE = os.getenv("BASE_URL", "https://namae-studio.com")` 化 |
| [scripts/debug-suggestion.py](scripts/debug-suggestion.py) | 候補生成の動作確認 | 同上 |

検証ケース（新規 or 既存活用）:

#### A. /suggestion — 名前候補ジェネレーター
- ページ遷移後 console error 0
- `window.generateSuggestions` 等の suggestion-page.js が export する関数が `function` 型で存在
- 性別「男」、画数 5+8 を選択して送信 → `.suggestion-card` が **1 枚以上** 描画される
- カードの「診断する」リンクで `/shindan?...` に遷移できる

#### B. /ranking/2026-boys, /ranking/2026-girls
- ページ遷移後 console error 0
- `#ranking-top3` 内に `.top3__card` が **3 枚** 描画
- `#ranking-list` 内に `.ranking-list__row` が **27 行**（4-30位）描画
- `#ranking-error`（hidden 維持）が表示されていない
- 行クリックで `/shindan?mei=...&autofav=1` に遷移する

#### C. /kanji/
- フィルタ input に「蓮」を入力 → `.kanji-grid__item` のうち「蓮」を含むもの以外が `display:none` になる
- 漢字カードクリックで `/kanji/{字}` に遷移できる
- 詳細ページ表示で console error 0

#### D. リグレッション（既存機能の生存確認）
- `/`, `/shindan`, `/favorites`, `/about`, `/guide/`, `/guide/faq` が console error 0 で表示
- `/shindan` で姓「山田」+ 名「太郎」入力 → 五格結果が描画

### Step 4: 結果記録
- 全ケース緑（console error 0 + 期待 DOM 要素存在）を Plan の末尾に追記
- スクショを `test_screenshots/` に保存
- 1 つでも赤なら原因切り分けして Plan を更新、再ループ

### Step 5: master 直 push
全緑後、master ブランチに commit & push（Vercel 自動デプロイ）。本番 URL でも同じ Playwright スクリプトを走らせて再確認。

## なぜこれを推奨するか（代替案を採らない理由）

- **ソース HTML 側を真にする方式**（テンプレートを廃止して直接 HTML を編集する）→ Handlebars 化したばかりのアーキテクチャを巻き戻すことになる。コスト過大
- **build.js でソース HTML を直接コピー**する → テンプレートエンジンと二系統管理になり混乱を生む
- **content JSON に extraScripts を補う + build-verify で検出**する本案は、既存アーキテクチャに沿った最小修正で、構造的欠陥（verify の検証範囲不足）も同時に塞げる

---

## 実装結果（2026-04-27）

### 実装した変更

| 種別 | ファイル | 変更内容 |
|------|---------|---------|
| データ | `content/suggestion.json` | `"extraScripts": ["/js/suggestion-page.js"]` 追加 |
| データ | `content/ranking/2026-boys.json` | `"extraScripts": ["/js/ranking-page.js"]` 追加 |
| データ | `content/ranking/2026-girls.json` | `"extraScripts": ["/js/ranking-page.js"]` 追加 |
| 検証 | `scripts/build-verify.js` | `checkExternalScripts()` 追加（`/js/...` の `<script src>` がソースに在って dist に無いと FAIL） |
| 検証 | `scripts/build-verify.js` | `checkStaticAssets` に `site.config.json` を追加 |
| ビルド | `scripts/build.js` | `copyStaticAssets` に `site.config.json` を追加（boot.js が `/site.config.json` を fetch するため、本来コピー必要だった） |
| テンプレ | `templates/pages/shindan.hbs` | `<img id="og-preview-img" src="/data:image...">` の先頭スラッシュ削除（404 ノイズ除去） |
| 検証 | `scripts/verify-phase3-fix.py` | 新規追加：Plan の検証ケース A/B/C/D を網羅する Playwright スクリプト（`BASE_URL` で本番/ローカル切替） |
| 補助 | `scripts/e2e-full-regression.py` / `scripts/debug-suggestion.py` | `BASE_URL` 環境変数化 |

### ローカル Playwright 検証（dist/ を `python -m http.server 8000` でホスト）

```
=== SUMMARY: 24 OK / 0 FAIL / 24 total ===
```

主要結果:
- `/suggestion`: suggestion-page.js タグ存在 ✅、`.suggestion-card` 60 件描画 ✅、console error 0 ✅
- `/ranking/2026-boys`, `/ranking/2026-girls`: TOP3 カード=3、`.ranking-list__row`=27、`#ranking-error` 非表示、console error 0 ✅
- `/kanji/`: 漢字 10 件描画、フィルタ「蓮」で 1 件に絞り込み、console error 0 ✅
- `/kanji/蓮`: 詳細ページ表示、console error 0 ✅
- リグレッション: `/`, `/shindan`, `/favorites`, `/about`, `/guide/`, `/guide/faq` 全て console error 0、`/shindan` で「山田 太郎」入力 → 五格描画 ✅

### 残課題

- 本番デプロイ後に `BASE_URL=https://namae-studio.com` で同スクリプトを再実行し本番でも全緑であることを確認する。
