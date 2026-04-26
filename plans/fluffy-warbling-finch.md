# Handlebars 緊急修正プラン — Critical 4 + Major 4 / Agent Teams 並列実行 + 多層レビュー

## Context

[plans/shimmying-foraging-fountain.md](shimmying-foraging-fountain.md) の Handlebars ビルドパイプライン (commit `7fb2a1e` + `27ad924`) は本番稼働中で `npm run build:verify` が PASS を返しているが、ultrareview で **PASS が嘘をついている** 状態が判明した。

### 確認済みの本番影響

1. **C1: `__KANJI_PAGES__` 消失** — 本番 `https://namae-studio.com/shindan` の grep で 0 件確認済み。診断結果画面の動的内部リンク（「『蓮』の詳細・由来を見る」等）が完全消滅。SEO 内部リンク資産の損失
2. **C2: shindan の `favorites.css` 二重 link が欠落** — お気に入り UI のスタイル崩れの可能性
3. **C3: `<main class="section shindan-main">` が `class="section"` に退化** — ページ固有レイアウトクラスが落ちている
4. **C4: build-verify.js が「メタデータ層」しか見ておらず C1-C3 を全て見逃した構造的盲点**

### 根本原因

[scripts/extract-pages.mjs:101-103](../scripts/extract-pages.mjs#L101-L103) の `pickInlineScriptsAfterMain()` が `</footer>` 以降の inline script しか拾わず、`<head>` 内 inline script・複数 `<link rel="stylesheet">`・`<main class>` を全て捨てた。verify 側にも対応する保持チェックが無いため自動検出できなかった。

### 修正の方針

- **C1 はデータ駆動で根本解決**：`data/kanji-meanings.json` から build.js が動的にホワイトリストを生成して partial に注入。手動メンテ不要
- **C2/C3 は content JSON のスキーマ拡張**で吸収（`extraCss`/`pageCss` 配列、`mainClass` 既定値）
- **C4 は verify を「機能保持」レベルに格上げ**し同種バグの再発を構造的に防ぐ
- **Major 4 件はついで対応**で破壊スクリプトのガード・URL 整合・lockfile 復活・自動デプロイブロック化
- **タスクの並列性を最大化**：4 ワーカー並走で実工数を 3.5h → 約 1.5h に短縮

---

## スコープ外

- Phase 3 の追加ページ実装（漢字辞典 残 290 字、ranking 続編、guide 続編）
- AdSense 配置・GA4 カスタムイベント追加
- Minor 群（m1-m6 のうち本プランで触れないもの）— 別 PR でまとめて
- DESIGN.md の shadows トークン乖離（m2）— 設計判断が必要なので別タスク

---

## Agent Teams 並列実行戦略

### 全体フロー

```text
[Phase 0: Explore] ─── 1 Explore agent で影響範囲監査（5 分）
       │
       ▼
[Phase 1: TDD ベースライン] ─── 1 worker で verify 強化（順序依存あり、最初に走らせる）
       │
       ▼
[Phase 2: 並列実装] ─── 3 worker 並走で C1/C2/C3+M1+M3 を実装（最大 30 分）
       │           ┌─ Worker A: C1 (ホワイトリスト動的注入)
       │           ├─ Worker B: C2 (pageCss 配列対応)
       │           └─ Worker C: C3 + M1 + M3 (mainClass 完備 + 破壊ガード + URL 整合)
       ▼
[Phase 3: 結合 + 仕上げ] ─── 1 worker で M4 + m3 + ローカル統合テスト
       │
       ▼
[Phase 4: 多層レビュー] ─── universal-review skill → codex-review skill ゲート
       │
       ▼
[Phase 5: デプロイ + 本番確認] ─── master push → Vercel デプロイ → 本番 curl 検証
```

### 並列性 vs 順序依存マトリクス

| Step | 並列可能? | 依存先 | 担当 |
|------|----------|-------|-----|
| Phase 0: 影響範囲監査 | ─ | なし | Explore agent |
| Phase 1: verify 強化 | ─（最初） | Phase 0 | Worker (general-purpose) |
| Phase 2A: C1 (build.js + head-meta + shindan.json) | ✓ | Phase 1 | Worker A |
| Phase 2B: C2 (head-meta + pageCss 監査) | ✓ | Phase 1 | Worker B |
| Phase 2C: C3 + M1 + M3 (mainClass + ガード + URL) | ✓ | Phase 1 | Worker C |
| Phase 3: M4 + m3 + 統合テスト | ─ | Phase 2 全完了 | Worker (general-purpose) |
| Phase 4: レビュー | ─ | Phase 3 | universal-review → codex-review |
| Phase 5: デプロイ + 本番確認 | ─ | Phase 4 PASS | わらわ自身 |

### 起用する Agent タイプと Skills

| 用途 | 種別 | 名前 | 役割 |
|------|-----|------|------|
| 影響範囲監査 | Explore agent | `pre-fix-audit` | 17 ページの inline script / 複数 CSS / main class を grep して影響表を作る |
| verify 強化 | general-purpose agent | `verify-strengthen` | C1-C3 を FAIL させるテスト追加、TDD ベースライン |
| C1 実装 | general-purpose agent | `c1-kanji-whitelist` | build.js + head-meta.hbs + shindan.json |
| C2 実装 | general-purpose agent | `c2-pagecss-array` | head-meta.hbs + 該当 content JSON の配列化 |
| C3+M1+M3 実装 | general-purpose agent | `c3-mainclass-and-misc` | 監査 + 修正 + 破壊ガード + URL 整合 |
| 仕上げ | general-purpose agent | `final-integration` | M4 lockfile + m3 verify 連結 + 統合テスト |
| 中間レビュー | Skill | `/universal-review` | Diff モード、軽量チェック |
| 最終ゲート | Skill | `/codex-review` | Plan/Diff/Runtime/Release 4 ゲート、Critical/Major 0 まで反復 |

> **重要**: Phase 2 の 3 worker は **同一メッセージ内で 3 つの Agent ツール呼び出し** を並列起動する。プロンプトには触ってよいファイルを明示し、競合を回避する。

---

## Phase 0: 影響範囲監査（Explore agent）

**目的**: C1-C3 のような漏れが他ページにもないか、修正前に全量把握する。Phase 2 の 3 worker が触る範囲を確定させる。

### 起用エージェント
```
Agent({
  subagent_type: "Explore",
  description: "Pre-fix audit: inline scripts / multi CSS / main class",
  prompt: <下記>
})
```

### プロンプト要旨
名前診断スタジオの 17 本のソース HTML を調査し、以下を全量列挙せよ：

1. **`<head>` 内 inline script**（src 属性なし、GTM スニペット除外）
   - ファイルパスと識別子（`window.__XXX__` または関数名）
2. **複数 `<link rel="stylesheet" href="/css/pages/...">`**
   - ファイルパスと CSS ファイル名リスト
3. **`<main class="...">` で `section` 以外のクラスを持つもの**
   - ファイルパスと class 文字列

調査対象: `index.html`, `shindan.html`, `about.html`, `favorites.html`, `privacy-policy.html`, `suggestion.html`, `404.html`, `kanji/index.html`, `ranking/index.html`, `ranking/2026-boys.html`, `ranking/2026-girls.html`, `guide/{index,faq,meimei-hikaku,meimei-tools,miyamairi,shussan-list}.html`

報告は表形式で構造化し、Phase 2 の各 worker が「触るべき content JSON ファイル」が一目で分かる粒度にすること。300 語以内。

### 期待される出力例
```
| Page | Inline Script | Multi CSS | Main Class |
|------|--------------|-----------|------------|
| shindan.html | __KANJI_PAGES__ | shindan, favorites | section shindan-main |
| favorites.html | (なし) | favorites | section ??? |
| index.html | applyHeroCTA | (なし) | (section のみ) |
```

---

## Phase 1: verify 強化（TDD ベースライン）

**目的**: 修正前に強化版 verify を走らせて C1-C3（および Phase 0 で発見された全漏れ）を **FAIL として明示的に検出** する。修正後に PASS に転じることで実装完了を機械的に証明する。

### 起用エージェント
```
Agent({
  subagent_type: "general-purpose",
  description: "Strengthen build-verify with inline-script / multi-CSS / main-class checks",
  prompt: <下記>
})
```

### プロンプト要旨

[scripts/build-verify.js](../scripts/build-verify.js) に以下 3 つの保持チェックを追加せよ：

1. **inline script 識別子保持** — 元 HTML から `<script>` (src 無し) を抽出し主要識別子（`window.__X__` 系または関数名）を抜き出し、dist 側の inline script のいずれかに同識別子が含まれることを確認。GTM スニペット (`/gtm\.start/`, `/googletagmanager/`) はスキップ
2. **CSS link 集合一致** — `href="/?css/..."` を全列挙し、src 集合 ⊆ dist 集合を保証（順序は問わない）
3. **`<main class>` 完全一致** — src と dist の最初の `<main>` の class 属性が一致

実装後、**修正せずに `npm run build:verify` を走らせ FAIL ログを記録**して報告せよ。新たな errors が C1-C3 + Phase 0 監査結果と一致することを確認。

### 期待される FAIL（最低限）
```
[shindan.html] inline script with identifier "__KANJI_PAGES__" lost in dist
[shindan.html] CSS missing in dist: pages/favorites.css
[shindan.html] main class mismatch: src="section shindan-main" dist="section"
```

---

## Phase 2: 並列実装（3 worker 並走、同一メッセージ内で起動）

**実行方法**: 1 つのメッセージに 3 つの Agent tool call を含めて並列起動する。

### Worker A: C1 (ホワイトリスト動的注入)

```
Agent({
  subagent_type: "general-purpose",
  description: "C1: Kanji whitelist dynamic injection via build.js",
  prompt: <下記>
})
```

**触るファイル（Worker B/C と非競合）**:
- [scripts/build.js](../scripts/build.js) — `loadKanjiWhitelist()` 追加、`buildSiteContext()` 拡張、`json` helper は流用
- [templates/partials/head-meta.hbs](../templates/partials/head-meta.hbs) — JSON-LD partial 直前 (行 67 付近) に `__KANJI_PAGES__` 注入ブロック追加
- [content/shindan.json](../content/shindan.json) — `injectKanjiWhitelist: true` フィールド追加のみ（pageCss/mainClass は Worker B/C 担当）

**実装内容**:
```js
// scripts/build.js
function loadKanjiWhitelist() {
  if (!fs.existsSync(KANJI_DATA_PATH)) return {};
  const data = readJson(KANJI_DATA_PATH);
  const map = {};
  for (const k of Object.keys(data.kanji || {})) map[k] = 1;
  return map;
}
function buildSiteContext() {
  const config = readJson(CONFIG_PATH);
  const design = loadDesignFrontmatter();
  const kanjiPages = loadKanjiWhitelist();
  return { ...config, design, kanjiPages };
}
```

```handlebars
{{!-- templates/partials/head-meta.hbs (json-ld 呼び出し直前) --}}
{{#if injectKanjiWhitelist}}
  <script>window.__KANJI_PAGES__ = {{{json site.kanjiPages}}};</script>
{{/if}}
```

**完了基準**: build → 強化 verify で `__KANJI_PAGES__` 関連の FAIL が消える

### Worker B: C2 (pageCss 配列対応)

```
Agent({
  subagent_type: "general-purpose",
  description: "C2: pageCss array support in head-meta",
  prompt: <下記>
})
```

**触るファイル**:
- [templates/partials/head-meta.hbs](../templates/partials/head-meta.hbs) — 行 44 を配列対応へ拡張
- [scripts/build.js](../scripts/build.js) — `isArray` helper 追加（`registerHelpers()` 内）
- Phase 0 監査で「複数 CSS 持ち」と判定された content JSON 各種 — `pageCss` を配列化

**重要**: head-meta.hbs と build.js は Worker A も触る。**Worker A の編集を待ってから Worker B 起動するか、ブランチ分けるか、3 者の編集箇所が干渉しないことを確認した上で同時起動**。本プランでは「Worker A の編集箇所は head-meta.hbs の行 67 付近 + buildSiteContext、Worker B は head-meta.hbs の行 44 + registerHelpers」と物理的に分けるので同時実行可能。ただし安全策として Worker A → Worker B/C の順で 1 サイクル待つ手もある。

**実装内容**:
```handlebars
{{#if pageCss}}
  {{#if (isArray pageCss)}}
    {{#each pageCss}}
  <link rel="stylesheet" href="/css/pages/{{this}}.css?v={{../buildVersion}}">
    {{/each}}
  {{else}}
  <link rel="stylesheet" href="/css/pages/{{pageCss}}.css?v={{buildVersion}}">
  {{/if}}
{{/if}}
```

**完了基準**: dist/shindan.html に `shindan.css` と `favorites.css` の両方、強化 verify の CSS チェック PASS

### Worker C: C3 + M1 + M3 (mainClass 完備 + 破壊ガード + URL 整合)

```
Agent({
  subagent_type: "general-purpose",
  description: "C3+M1+M3: mainClass + extract-pages guard + JSON-LD URL trailing slash",
  prompt: <下記>
})
```

**触るファイル**:
- Phase 0 監査で `section` 以外の main class を持つ content JSON 各種 — `mainClass` フィールド追加
- [templates/layouts/base.hbs](../templates/layouts/base.hbs) 行 12 — main class ロジック整理（オプショナル）
- [scripts/extract-pages.mjs](../scripts/extract-pages.mjs) — 先頭に `ALLOW_DESTRUCTIVE_EXTRACT` ガード追加
- [scripts/build.js](../scripts/build.js) の `buildKanjiDetailPages()` 内 — JSON-LD breadcrumb URL の末尾スラッシュ削除（行 228, 234）

**実装内容**:
```js
// scripts/extract-pages.mjs (shebang 直後)
if (!process.env.ALLOW_DESTRUCTIVE_EXTRACT) {
  console.error('⛔ extract-pages.mjs は一回限りのマイグレーションスクリプトです。');
  console.error('   再実行すると content/*.json と templates/pages/*.hbs が全上書きされます。');
  console.error('   本当に再実行する場合: ALLOW_DESTRUCTIVE_EXTRACT=1 node scripts/extract-pages.mjs');
  process.exit(1);
}

// scripts/build.js (buildKanjiDetailPages 内)
{ '@type': 'ListItem', position: 2, name: '漢字辞典', item: 'https://namae-studio.com/kanji' }
// ↑ 末尾 / を削除
```

**完了基準**: 強化 verify の main class チェック PASS、`node scripts/extract-pages.mjs` で即 exit 1

### Worker A/B/C 起動の干渉回避ルール

| ファイル | 担当 worker | 競合チェック |
|---------|------------|------------|
| `scripts/build.js` | A (loadKanjiWhitelist + buildSiteContext) ＋ B (isArray helper) ＋ C (kanji breadcrumb) | 3 者で異なる関数を触るので干渉なし。ただし git 上の競合解消は `final-integration` worker で実施 |
| `templates/partials/head-meta.hbs` | A (行 67 付近) ＋ B (行 44) | 同一ファイル別行、git auto-merge 可能 |
| `content/shindan.json` | A (injectKanjiWhitelist) ＋ B (pageCss 配列化) ＋ C (mainClass) | 同一 JSON ファイル、Phase 3 で結合修正がベター → **shindan.json は Worker A のみが触り、B/C は他ページの該当 content JSON のみ触る** ように区分 |
| Other content JSON | B (pageCss) ＋ C (mainClass) のみ | shindan 以外のページは B/C で住み分け |

**運用上の安全策**: 干渉懸念があれば `isolation: "worktree"` オプションで各 worker を独立 worktree で実行し、Phase 3 で手動マージする。本プラン推奨はこの worktree 分離方式。

---

## Phase 3: 結合 + 仕上げ（Worker `final-integration`）

```
Agent({
  subagent_type: "general-purpose",
  description: "M4 + m3 + integration test",
  prompt: <下記>
})
```

### タスク

1. **Phase 2 の worktree マージ**（worktree 分離した場合）
2. **M4: package-lock.json 復活**
   - [.gitignore](../.gitignore) から `package-lock.json` 行削除
   - `npm install` で生成、`git add package-lock.json`
   - [vercel.json:6](../vercel.json#L6) `installCommand` を `npm install` → `npm ci`
3. **m3: vercel.json buildCommand に verify 連結**
   - [vercel.json:4](../vercel.json#L4) `"buildCommand": "npm run build && npm run build:verify"`
4. **クリーンビルド統合テスト**
   ```bash
   rm -rf dist node_modules
   npm ci
   npm run build
   npm run build:verify   # exit 0 必須
   ```
5. **ローカルブラウザ検証**（ローカル http サーバー起動して以下確認）
   - `/shindan` で姓 `山田` 名 `蓮太郎` の診断 → 「『蓮』の詳細・由来を見る」リンク表示
   - DevTools Network で `shindan.css` と `favorites.css` の両方が 200
   - DevTools Elements で `<main class="section shindan-main">`
6. **コミット**: 「fix(build): C1-C4 + Major 4 件修正 — verify 強化と機能保持」

---

## Phase 4: 多層レビュー

### 中間レビュー: `/universal-review`

```
Skill({ skill: "universal-review", args: "diff" })
```

軽量チェック:
- Phase 3 のコミット差分が意図と整合しているか
- 影響範囲が想定通りか（壊した既存機能がないか）
- 命名・コーディング規約逸脱がないか

### 最終ゲート: `/codex-review`

```
Skill({ skill: "codex-review" })
```

4 ゲート（Plan/Diff/Runtime/Release）で Critical/Major が 0 になるまで反復ループ。
- **Plan ゲート**: 本プラン書類との整合
- **Diff ゲート**: コード品質・命名・テスト
- **Runtime ゲート**: ローカル動作確認・verify PASS
- **Release ゲート**: ロールバック手順・本番影響説明の網羅

Critical/Major が出た場合、Phase 2/3 に巻き戻して再修正 → 再レビュー。

---

## Phase 5: デプロイ + 本番確認（わらわ自身が実行）

### A. master push & Vercel デプロイ
```bash
git push origin master
```
Vercel Dashboard で ✓ Ready 待ち（強化 verify が通らない場合はデプロイブロック、原因確認）

### B. 本番影響の修復確認
1. `curl -s https://namae-studio.com/shindan | grep -c "__KANJI_PAGES__"` → **1** が返ること
2. `curl -s https://namae-studio.com/shindan | grep -c "favorites.css"` → **1 以上** が返ること
3. ブラウザで `/shindan` 実機検証：
   - 姓「山田」名「蓮太郎」で診断
   - 結果画面下部「関連ページ」に「『蓮』の詳細・由来を見る」リンク表示
   - クリックで `/kanji/蓮` へ遷移
4. GTM プレビューモードで全 27 ページの `gtm.js` 継続発火確認

### C. JSON-LD 整合確認（M3）
1. Google Rich Results Test (search.google.com/test/rich-results) で `https://namae-studio.com/kanji/蓮` を検証
2. breadcrumb の警告が解消されていること

### D. デプロイブロック動作確認（m3）
- 別ブランチで一時的に `injectKanjiWhitelist` を削除して push
- Vercel デプロイが verify FAIL でブロックされること
- revert で復元、デプロイ ✓ Ready

---

## Critical Files

### 修正対象（既存）
- [scripts/build.js](../scripts/build.js) — Worker A/B/C が分担
- [scripts/build-verify.js](../scripts/build-verify.js) — verify-strengthen worker
- [scripts/extract-pages.mjs](../scripts/extract-pages.mjs) — Worker C
- [templates/partials/head-meta.hbs](../templates/partials/head-meta.hbs) — Worker A/B 分担
- [templates/layouts/base.hbs](../templates/layouts/base.hbs) — Worker C（オプショナル）
- [content/shindan.json](../content/shindan.json) — Worker A 単独
- 他の `content/*.json` — Worker B/C で住み分け（Phase 0 監査結果に基づく）
- [vercel.json](../vercel.json) — final-integration worker
- [.gitignore](../.gitignore) — final-integration worker

### 新規追加
- `package-lock.json` — `npm install` で自動生成、git add で commit
- 既存 `plans/` ディレクトリへの本プラン (`plans/fluffy-warbling-finch.md`)

### 再利用すべき既存資産
- [data/kanji-meanings.json](../data/kanji-meanings.json) — ホワイトリストの単一データソース
- [scripts/build.js:75](../scripts/build.js#L75) `json` helper — そのまま流用
- [js/ui-controller.js:354-396](../js/ui-controller.js#L354-L396) `_renderRelatedPages` — 一切触らない
- [content/home.json](../content/home.json) — `extraInlineScript` のスキーマ参照例として再利用

---

## 検証手順

### A. 修正前ベースライン取得（Phase 1 完了時）
```bash
npm run build
npm run build:verify   # 強化版で C1-C3 が FAIL すること、件数を記録
```

### B. C1-C4 修正完了後（Phase 3 完了時）
```bash
rm -rf dist node_modules
npm ci
npm run build
npm run build:verify   # exit 0 (PASS) 必須、FAIL 件数 = 0
```

### C. 本番影響の修復確認（Phase 5）

Phase 5 セクション参照。

---

## ロールバック手順

### 即時（Vercel）
1. Vercel Dashboard → Deployments → `7fb2a1e` または `27ad924` を「Promote to Production」
2. `__KANJI_PAGES__` 欠落状態に戻るが、サイト本体は動作

### git レベル
```bash
git revert <修正PRのコミット群>
git push origin master
```

ルート HTML は前プランのロールバック方針通り残置されているので、`vercel.json` から `buildCommand` を消せば旧 27 ファイル直接配信に戻る。

### ファイル個別
- `package-lock.json` を `.gitignore` に戻すだけで M4 だけロールバック可能
- `buildCommand` から `&& npm run build:verify` を削るだけで m3 だけロールバック可能

---

## 想定リスクと対策

| # | リスク | 対策 |
|---|-------|-----|
| RR1 | 強化 verify が誤検出して既存ページもFAIL扱いになる | Phase 1 で FAIL 件数を全量把握、想定外は許容リスト化（GTM スニペットの skipPatterns と同様） |
| RR2 | `pageCss` 配列対応で他ページに副作用 | Phase 0 監査で全該当ページを事前列挙、影響範囲を可視化 |
| RR3 | `npm ci` への切替で Vercel ビルド失敗 | Phase 3 ローカル `npm ci` 動作確認後にコミット、preview ブランチで検証 |
| RR4 | extract-pages.mjs ガードが緊急再実行を妨げる | env var エスケープハッチ `ALLOW_DESTRUCTIVE_EXTRACT=1` を残す |
| RR5 | injectKanjiWhitelist フラグ忘れで他ページに展開できない | DESIGN.md の Operational Guide にフラグ説明を追記（別 PR） |
| RR6 | data/kanji-meanings.json 更新時に build 走らせない | Vercel 自動ビルドあり、ただし local dev は要手動 `npm run build` |
| **RR7** | **Phase 2 の 3 worker が同一ファイル編集で競合** | **`isolation: "worktree"` で各 worker を独立 worktree 起動、Phase 3 で手動マージ。または Worker A → B/C の順次起動でも回避可** |
| RR8 | codex-review が Critical を新たに発見 | プラン通り反復ループ、Phase 2 に巻き戻し |
| RR9 | Vercel デプロイ ✓ Ready なのに本番 grep で `__KANJI_PAGES__` が 0 件 | キャッシュ Hard Reload で再確認、それでも 0 ならデプロイログを確認して build.js 出力を再検証 |

---

## 想定工数（並列効果込み）

| Phase | 内容 | 並列前 | 並列後 |
|-------|-----|--------|--------|
| Phase 0 | 影響範囲監査 (Explore) | 5 分 | 5 分 |
| Phase 1 | verify 強化 (TDD ベースライン) | 60 分 | 60 分 |
| Phase 2 | C1 + C2 + C3+M1+M3 を 3 worker 並列 | 70 分 (30+30+10 直列) | **30 分** |
| Phase 3 | M4 + m3 + 統合テスト | 30 分 | 30 分 |
| Phase 4 | universal-review + codex-review | 20 分 | 20 分 |
| Phase 5 | デプロイ + 本番確認 | 15 分 | 15 分 |
| **合計** | | **3.3 時間** | **約 2.7 時間** |

並列短縮効果: 約 35 分削減 (-18%)。さらに Phase 1 と Phase 0 を並列化 (verify 強化と監査が独立) すれば追加 5 分削減可能。

---

## 完了基準

- [ ] `npm run build && npm run build:verify` がローカルで exit 0
- [ ] 本番 `curl -s https://namae-studio.com/shindan | grep -c "__KANJI_PAGES__"` が 1 を返す
- [ ] 本番 `/shindan` で姓 `山田` 名 `蓮太郎` の診断 → 結果画面に「『蓮』の詳細・由来を見る」リンクが表示される
- [ ] 本番 `/shindan` で `shindan.css` と `favorites.css` の両方が 200 で読まれる
- [ ] 本番 `/shindan` の `<main>` に `shindan-main` クラスが付いている
- [ ] Vercel ビルドが `npm ci` で成功し、`npm run build:verify` がデプロイゲートとして機能している
- [ ] `package-lock.json` がリポジトリに commit 済み
- [ ] `extract-pages.mjs` が ALLOW_DESTRUCTIVE_EXTRACT 無しで即 exit 1
- [ ] Google Rich Results Test で `/kanji/蓮` の breadcrumb 警告が解消
- [ ] codex-review の 4 ゲート全て Critical/Major 0 で通過

---

## 補足: Agent / Skill 使用ルール（このプラン専用）

1. **Phase 2 の 3 worker は `isolation: "worktree"` 必須**。本リポジトリは Windows + 日本語パスで競合解消が複雑になりがちなので物理分離が安全
2. **codex-review が Critical を出したら必ず巻き戻し**。Major のみなら次 PR 化を検討してよい（本プラン Major 4 件のように）
3. **本プランの最終 commit メッセージには「fix(build): C1-C4 + Major 4 件 — verify 強化と機能保持の二段構え」と明記**して将来のコードアーキテクトが意図を読めるようにする
4. **Phase 2 の各 worker のプロンプトには本プランのリンク `plans/fluffy-warbling-finch.md` を冒頭に貼り**、各 worker が独立にコンテキストを再構築できるようにする
