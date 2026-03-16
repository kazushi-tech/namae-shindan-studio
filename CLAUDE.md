# 赤ちゃん名前診断サービス

姓名判断（画数診断）＋名前提案の Web サービス。
育児ブログ（childcare_blog）とは別の独立サービスとして運営し、将来的に相互送客を目指す。

---

## Tech Stack

| 項目 | 選定 |
|------|------|
| フロントエンド | HTML + CSS + JS（バニラ、フレームワークなし） |
| AI API | Gemini API（BYOK — ユーザー自身が Google AI Studio でキー取得） |
| デプロイ | Vercel（静的サイト無料枠） |
| デザイン | 和モダン × ぬくもり。モバイルファースト |
| フォント | Zen Maru Gothic（見出し）+ Noto Sans JP（本文） |

---

## Phase 計画

### Phase 1: MVP — 姓名判断ツール ✅ 完了

姓＋名を入力 → 五格（天格・人格・地格・外格・総格）の画数診断結果を即座に表示。
完全クライアントサイド、API 不要。

### Phase 2: 名前提案機能

条件を入力 → 名前候補を提案。

- **Tier A（クライアントサイド）**: 人気名前 DB 2,000件から条件フィルタ
  - 性別、画数、読みパターン、好みの漢字で絞り込み
  - 入力した姓との相性スコア自動計算
- **Tier B（AI 提案 / BYOK）**: Gemini API で自由文から名前提案
  - 「自然をイメージする名前」「古風だけど現代的」等のリクエスト対応
  - ユーザーが自分の Gemini API キーを入力して利用（サーバーコストゼロ）
  - API キーは `localStorage` に保存（ブラウザ内のみ）
  - キー未入力でも Tier A は利用可能

### Phase 3: ブログ連携

- 育児ブログに名前診断の紹介記事を作成
- サービス側に「関連記事」セクション追加
- UTM パラメータで流入トラッキング

### Phase 4: 拡張機能

- 旧字体画数トグル
- 三才（天・人・地の五行）配置判定
- 名前比較モード（候補 2-3 個を並べて比較）
- お気に入り保存（localStorage）
- SNS シェア用 OG 画像自動生成（Canvas API）
- Google Analytics 4 導入

---

## BYOK（Bring Your Own Key）設計

Phase 2 Tier B で Gemini API を使う際の方針:

| 項目 | 方針 |
|------|------|
| API | Gemini API（`gemini-2.0-flash` 等の安価モデル） |
| キー取得 | ユーザーが Google AI Studio (aistudio.google.com) で無料取得 |
| キー入力 | サイト内の設定パネルで入力 |
| キー保存 | `localStorage`（ブラウザ内のみ、サーバーに送信しない） |
| サーバー | 不要（クライアントから直接 Gemini API を呼び出し） |
| キー未入力時 | Tier A（DB フィルタ）のみ利用可能、AI 提案はグレーアウト |

**UI で伝えるべきこと:**
- API キーはブラウザ内にのみ保存され、外部に送信されないこと
- Google AI Studio での取得手順（スクリーンショット付きガイド）
- 無料枠の範囲で十分利用できること

---

## Key Paths

| カテゴリ | パス |
|---------|------|
| HTML | `index.html`, `shindan.html`, `about.html` |
| CSS | `css/` (reset, variables, base, components, layout, animations, pages/) |
| JS コア | `js/seimei-handan.js`（五格計算）, `js/kanji-strokes.js`（画数） |
| JS UI | `js/ui-controller.js`, `js/app.js`, `js/fortune-data.js` |
| データ | `data/kanji-strokes.json`, `data/fortune-meanings.json` |
| 画像 | `assets/images/` |
| Vercel | `vercel.json` |

---

## Conventions

- **完全クライアントサイド**: サーバー往復なし（Phase 2 AI 提案もクライアント→Gemini 直接）
- **セマンティック HTML**: アクセシビリティ重視
- **禁止フォント**: Inter, Roboto, Arial, system-ui 等の定番フォント
- **YMYL 注意**: 医学的・確定的表現を避け「占い・参考情報」と明記
- **カラー**: クリーム / テラコッタ / セージグリーン / ソフトゴールド
- **BEM 命名**: CSS は BEM（`.block__element--modifier`）で統一

---

## Design Philosophy

**コンセプト: "和モダン × ぬくもり"**

- **タイポグラフィ**: 個性的なフォント必須。Inter/Roboto/Arial/system-ui 禁止
- **カラー**: CSS変数で一貫管理。主要色＋アクセントの明確な体系
- **モーション**: 意味のあるアニメーション。ページロード時のスタガー表示、スクロール連動、ホバーエフェクト
- **空間構成**: 非対称レイアウト、意図的な余白、グリッドブレイク要素
- **背景・質感**: ベタ塗り回避。グラデーション・ノイズテクスチャ・パターン・透過レイヤー活用

---

## Skills

| Skill | 用途 |
|-------|------|
| `codex-review` | マイルストーン品質レビュー |
| `universal-review` | 日常レビュー |
| `ui-design-review` | UI品質・デザイン・アクセシビリティ総合レビュー |
| `deep-research` | 体系的Webリサーチ（SEO・競合分析・技術調査） |
