# UI/UX: Nano Banana 2 で画像が足りていない項目に画像を追加する

## Context

本サービスは Phase 2 以降、Nano Banana 2（`gemini-3.1-flash-image-preview`）で水彩風の和モダンイラストを [assets/images/](assets/images/) に 14 点生成し、[index.html](index.html) や [shindan.html](shindan.html) / [about.html](about.html) に配置してきた。

しかしその後に追加された下記の機能ページには、**イラストが一切配置されていない**（絵文字のみ or プレーンテキスト）状態が続いておる:

- [suggestion.html](suggestion.html)（名前候補ジェネレーター）
- [favorites.html](favorites.html)（お気に入り）
- [guide/index.html](guide/index.html) と [guide/meimei-tools.html](guide/meimei-tools.html)
- [ranking/index.html](ranking/index.html) / [ranking/2026-boys.html](ranking/2026-boys.html) / [ranking/2026-girls.html](ranking/2026-girls.html)
- [kanji/index.html](kanji/index.html) と [kanji/{漢字}.html](kanji/) テンプレート
- [404.html](404.html)

結果、ページを横断したときに「ホームだけ賑やか、他はテキスト羅列」という視覚的な落差が発生しておる。本プランは **既存の 14 点は一切上書きせず**、画像が欠けているセクションにだけ Nano Banana 2 で新規イラストを追加し、**スマホ表示を第一義に**設計するのじゃ。

既存スクリプトの要所:
- [scripts/generate-images.js](scripts/generate-images.js) — `IMAGE_API_KEY` と `gemini-3.1-flash-image-preview` を使用。`COMMON_STYLE` 定数で水彩風・和モダン・クリーム色ベースのトーンを統一
- ⚠️ 現スクリプトは **冪等性チェックなし** — 同名ファイルを無条件に `fs.writeFileSync()` で上書きするため、**既存画像を守る skip 処理を先に追加する必要がある**

---

## Scope

### In scope
1. `scripts/generate-images.js` に **「ファイル既存時は skip」ロジックを追加**（既存 14 点を保護）
2. 画像が欠けている 10 セクションに対して新規イラスト画像（計 **12 点**）を Nano Banana 2 で生成
3. 各画像を対応 HTML/CSS に配線。**モバイルファースト**で 3 ブレイクポイント (≤479 / ≤767 / ≥768) の表示を調整
4. 生成後、[Playwright] による `test_screenshots/` ベースの目視確認

### Out of scope
- 既存 14 画像の差し替え・リテイク（ユーザー要望で明示的に除外）
- 個別の kanji 詳細ページ 1 枚ずつ専用画像を作ること（テンプレート側で共通プレースホルダ画像を使う）
- 未使用な `divider-*.png` 3 点の HTML 組み込み（別プラン扱い）
- 新機能追加・コピー変更

---

## Design Principles（モバイル第一で貫く）

| 指針 | 具体 |
|------|------|
| **画像寸法は常に 2 系列** | ① ページヘッダ系: 600×300px（幅 2:1 の横長） ② アイコン/タイル系: 512×512px（正方形） — 両方とも retina 対応のため実寸の 1.5〜2 倍で生成 |
| **CSS で縮小、元画像は大きめ** | 既存の `max-width: 400px`（PC）→ `max-width: 280px`（≤479px） パターンを踏襲。アイコンは `88x88` → `64x64` に縮小 |
| **CLS 対策の `width` / `height` 属性必須** | `<img width="600" height="300" …>` を全画像に付与し、loading 時のレイアウトシフトを抑制 |
| **`loading="lazy"` デフォルト** | ファーストビュー以外は全て lazy。favorites の空状態のような条件付き要素は lazy 固定で OK |
| **ファイルサイズ目安** | 各 PNG 120KB 以下を目標（装飾用は `opacity: 0.5` 相当で粗さが目立ちにくい）。超える場合は [squoosh](https://squoosh.app/) などで手動最適化または Canvas 圧縮を検討 |
| **装飾は `opacity` で溶け込ませる** | CTA/ヒーロー背景は `opacity: 0.4〜0.7`、アイコンは `opacity: 1.0` |
| **タップターゲット侵害禁止** | タイル内にイラスト配置する際は `pointer-events: none;` を必ず付与 |
| **絵文字は残す or 置換** | guide/ranking の絵文字タイルは **画像を追加しつつ絵文字も残す**（アクセシビリティと軽量フォールバック） |
| **`alt=""` を徹底** | 装飾画像は空 alt。情報を持つ画像のみ alt テキストを書く |
| **prefers-reduced-motion** | 装飾のフェードイン等は既存の animations.css パターンに合わせる |

### モバイル専用のブレイクポイント指針

| BP | 画像の扱い |
|----|-----------|
| ≥768px（タブレット〜PC） | フル寸法で表示（`max-width` を原寸以内に） |
| 480〜767px | ヘッダ画像は 280px 幅へ縮小。タイル画像は 2 カラム維持のため 120px 程度 |
| ≤479px（iPhone SE 等） | ヘッダ画像 240px、タイル画像 96px。ヒーロー背景のような大きな装飾は `opacity` を落とすか非表示 |

---

## 新規生成する画像一覧（12 点）

すべて `COMMON_STYLE` のトーン（Soft Japanese watercolor, 和モダン, クリーム+コーラル+セージ+ゴールド, 人物の顔なし, 桜モチーフ）を継承する。

| # | ファイル名 | 寸法目安 | 用途 | プロンプト要点 |
|---|---|---|---|---|
| 1 | `suggestion-header.png` | 600×300 | [suggestion.html](suggestion.html) ページヘッダ | 花びらに添えられた命名札・リボン・ハートが風にそよぐ構図 |
| 2 | `favorites-header.png` | 600×300 | [favorites.html](favorites.html) ページヘッダ | 木の棚に並ぶ和紙のしおり・星モチーフ・金の星屑 |
| 3 | `favorites-empty.png` | 512×512 | 空状態イラスト（`#favorites-empty` 内の 🌱 置換） | 小さな双葉と空のカゴ、優しい「これから始まる」雰囲気 |
| 4 | `guide-hero.png` | 600×300 | [guide/index.html](guide/index.html) の `guide-hero__illust`（🎋 と併置） | 和綴じの本・筆・若葉・結び紐が並ぶフラットレイ |
| 5 | `guide-tile-meimei.png` | 512×512 | `meimei-tools` タイル | 命名書に筆で字を書こうとする瞬間（手は不可視） |
| 6 | `guide-tile-faq.png` | 512×512 | `faq` タイル | 疑問符モチーフと吹き出し、紙風船 |
| 7 | `guide-tile-shussan.png` | 512×512 | 出産準備リストタイル | 哺乳瓶・畳まれたベビー肌着・ガラガラ |
| 8 | `guide-tile-miyamairi.png` | 512×512 | お宮参りタイル | 鳥居と桜・小さな絵馬 |
| 9 | `ranking-hero.png` | 600×300 | [ranking/index.html](ranking/index.html) ヒーロー | トロフィー・ランキング台・花吹雪（ジェンダーニュートラル） |
| 10 | `ranking-tile-girls.png` | 512×512 | 女の子タイル | 桃色リボン・花冠・ベビーピンク系の水彩 |
| 11 | `ranking-tile-boys.png` | 512×512 | 男の子タイル | 藍色リボン・折り鶴・風車・セージ系 |
| 12 | `kanji-hero.png` | 600×300 | [kanji/index.html](kanji/index.html) と [kanji/*.html](kanji/) テンプレ共通のヘッダ | 筆・硯・墨の滴・和紙、抽象的な字体のにじみ |

**注**: 404 と about の五格カード（5 つ）、guide/meimei-tools の商品カテゴリ 4 セクションへのイラスト追加は、本プランの **Phase B（後続）** に分離する。まず上記 12 点で主要画面を整える。

---

## Implementation Plan

### Step 1. `scripts/generate-images.js` に冪等性チェックを追加

`IMAGES` 配列のループ内で、出力先ファイルが既に存在する場合は生成をスキップする処理を追加する。既存 14 点の上書きを防ぐ必須ガード。

```js
// main() 内、Promise.allSettled のマップ関数の冒頭に追加
const outputPath = path.join(OUTPUT_DIR, img.filename);
if (fs.existsSync(outputPath)) {
  console.log(`  ⊘ Skip: ${img.filename} (already exists)`);
  return { filename: img.filename, success: true, skipped: true };
}
```

さらに `--force` フラグで明示的に上書きできるエスケープハッチも用意（将来のリテイク用）:
```js
const FORCE = process.argv.includes('--force');
if (!FORCE && fs.existsSync(outputPath)) { … skip … }
```

### Step 2. `IMAGES` 配列に 12 点を追記

既存 8 エントリの後ろに、上記一覧のプロンプトを `COMMON_STYLE` サフィックス付きで追記する。`aspect ratio` はプロンプト内で明示（"horizontal 2:1 landscape composition" / "square 1:1 composition"）。

### Step 3. 画像生成実行

```bash
npm run generate-images
```

既存 14 点は `Skip` ログが出て保護される。新規 12 点だけが `assets/images/` に書き出される。API レート制限に当たった場合は失敗分のみ再実行（既生成分は再度 skip）。

### Step 4. HTML 配線

- **[suggestion.html](suggestion.html)** (L86 の `page-header` に `<img class="page-header__illustration">` を挿入)
- **[favorites.html](favorites.html)** (L73 の `page-header` にヘッダ画像、L81 の `favorites-empty` 内の 🌱 を画像に置換 or 併置)
- **[guide/index.html](guide/index.html)** (L88 の `guide-hero__illust` 絵文字の直後/代わりに画像追加、L92〜L116 の各 `guide-hub__tile` 内 `guide-hub__tile-icon` を画像 or 絵文字+画像併置)
- **[ranking/index.html](ranking/index.html)** (L83 の `ranking-hero` に画像、L90・L95 の `ranking-hub__tile` にタイル画像)
- **[ranking/2026-boys.html](ranking/2026-boys.html) / [ranking/2026-girls.html](ranking/2026-girls.html)** (各ヘッダに対応の `ranking-tile-*.png` を流用して大きめ表示)
- **[kanji/index.html](kanji/index.html)** (ヒーロー領域に `kanji-hero.png`)
- **[scripts/build-kanji-pages.mjs](scripts/build-kanji-pages.mjs)** のテンプレに `kanji-hero.png` を組み込み、**ビルド済み全 kanji ページ**を再生成（同画像を共通利用）

### Step 5. CSS 調整

各ページの CSS に、既存 [css/pages/about.css:36-48](css/pages/about.css#L36-L48) の `.page-header__illustration` パターンを踏襲してスタイルを追加する。具体的に触るファイル:

- [css/pages/suggestion.css](css/pages/suggestion.css) — `.page-header__illustration` ルール追加 & ≤479 の 280px ルール
- [css/pages/favorites.css](css/pages/favorites.css) — 同上 + `.favorites-empty__img { max-width: 180px; margin: 0 auto var(--space-4); }` と ≤479 で 140px
- [css/pages/guide.css](css/pages/guide.css) — `.guide-hero__illust img`、`.guide-hub__tile-icon img { width: 88px; height: 88px; object-fit: contain; }` と ≤479 で 64px
- [css/pages/ranking.css](css/pages/ranking.css) — `.ranking-hero__illust`、`.ranking-hub__tile-icon img`
- [css/pages/kanji.css](css/pages/kanji.css) — `.kanji-hero__illust`

**共通の media query テンプレ** (新規追加する各ルールに適用):
```css
.foo__illustration { max-width: 400px; height: auto; margin: 0 auto var(--space-6); }
@media (max-width: 767px) { .foo__illustration { max-width: 320px; } }
@media (max-width: 479px) { .foo__illustration { max-width: 240px; } }
```

### Step 6. キャッシュバスター更新

全対象 HTML の `<link rel="stylesheet" ?v=YYYYMMDDb>` クエリを次リビジョンに繰り上げる（例: `20260423b` → `20260424a`）。

### Step 7. 動作確認（モバイル含む）

1. `npx vercel dev` または `python -m http.server` でローカル起動
2. **Playwright 既存スクリプト** ([scripts/playwright-audit.py](scripts/playwright-audit.py)) をモバイルビューポート (375×667) で実行しスクリーンショット取得
3. [test_screenshots/audit/](test_screenshots/audit/) に新規スクショを保存し、以下を目視確認:
   - ページヘッダ画像が 240〜280px 幅で過大にならない
   - タイル画像がフォールバック絵文字と重ならない／整列している
   - 画像ロード中のレイアウトシフト (CLS) がない — `width`/`height` 属性が効いている
   - `opacity` が効いて装飾画像がテキストを潰していない
4. 実機 iPhone Safari で [test-ios-safari.py](test-ios-safari.py) を実行し、実寸確認
5. Lighthouse Mobile スコア（Performance / CLS / LCP）が劣化していないこと

---

## Critical Files to Modify

| ファイル | 変更内容 |
|---|---|
| [scripts/generate-images.js](scripts/generate-images.js) | 冪等 skip + `--force` フラグ + 新規 12 エントリ追記 |
| [suggestion.html](suggestion.html) | page-header に img 挿入 |
| [favorites.html](favorites.html) | page-header + empty 状態に img 挿入 |
| [guide/index.html](guide/index.html) | hero と 5 タイルに img |
| [ranking/index.html](ranking/index.html) | hero と 2 タイルに img |
| [ranking/2026-boys.html](ranking/2026-boys.html) / [ranking/2026-girls.html](ranking/2026-girls.html) | hero に img |
| [kanji/index.html](kanji/index.html) | hero に img |
| [scripts/build-kanji-pages.mjs](scripts/build-kanji-pages.mjs) | テンプレに kanji-hero.png 組み込み + 再ビルド |
| [css/pages/suggestion.css](css/pages/suggestion.css) | `.page-header__illustration` 追加 |
| [css/pages/favorites.css](css/pages/favorites.css) | `.page-header__illustration` + `.favorites-empty__img` |
| [css/pages/guide.css](css/pages/guide.css) | `.guide-hero__illust img`, `.guide-hub__tile-icon img` |
| [css/pages/ranking.css](css/pages/ranking.css) | `.ranking-hero__illust`, `.ranking-hub__tile-icon img` |
| [css/pages/kanji.css](css/pages/kanji.css) | `.kanji-hero__illust` |

## Reused Existing Patterns

- `.page-header__illustration` — [css/pages/about.css:36-48](css/pages/about.css#L36-L48) に既存。同パターンをコピーして各 CSS へ展開
- `.feature-icon img` — [css/pages/home.css:86-90](css/pages/home.css#L86-L90) のタイル画像スタイル。`.guide-hub__tile-icon img` 等に応用
- `.hero__illustration` の `opacity: 0.45` + モバイル `opacity: 0.25` 手法 — [css/pages/home.css:61-83](css/pages/home.css#L61-L83) を装飾ヘッダに応用
- `.cta-illustration` のモバイル幅縮小 — [css/components.css:908-922](css/components.css#L908-L922)

## Verification

- [ ] `npm run generate-images` が既存 14 点を `⊘ Skip` で保護し、新規 12 点のみ書き出す
- [ ] `assets/images/` のサイズ合計が 2MB 以内に収まる（各 120KB 目安 × 12 点）
- [ ] [scripts/playwright-audit.py](scripts/playwright-audit.py) を 375px 幅で走らせ、[test_screenshots/audit/](test_screenshots/audit/) に 10 ページ分のスクショ取得
- [ ] DevTools の Performance タブで CLS < 0.1 を確認
- [ ] 実機 iPhone（iOS Safari）で各ページを開き、画像がはみ出ない・読み込みが遅延しないことを確認
- [ ] 全 HTML の `?v=` キャッシュバスターが更新済み
- [ ] `git diff assets/images/` に既存 14 ファイルの変更がないこと
