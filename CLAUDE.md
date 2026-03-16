# 赤ちゃん名前診断サービス

姓名判断（画数診断）＋名前提案の Web サービス。

---

## Tech Stack

| 項目 | 選定 |
|------|------|
| フロントエンド | HTML + CSS + JS（バニラ、フレームワークなし） |
| デプロイ | Vercel（静的サイト無料枠） |
| デザイン | 和モダン × ぬくもり。モバイルファースト |
| フォント | Zen Maru Gothic（見出し）+ Noto Sans JP（本文） |

---

## Key Paths

| カテゴリ | パス |
|---------|------|
| HTML | `index.html`, `shindan.html`, `about.html` |
| CSS | `css/` (reset, variables, base, components, layout, animations) |
| JS コア | `js/seimei-handan.js`（五格計算）, `js/kanji-strokes.js`（画数） |
| JS UI | `js/ui-controller.js`, `js/app.js` |
| データ | `data/kanji-strokes.json`, `data/fortune-meanings.json` |
| 画像 | `assets/images/` |
| Vercel | `vercel.json` |

---

## Conventions

- **完全クライアントサイド**: サーバー往復なし（Phase 1）
- **セマンティック HTML**: アクセシビリティ重視
- **禁止フォント**: Inter, Roboto 等の定番フォント
- **YMYL 注意**: 医学的・確定的表現を避け「占い・参考情報」と明記
- **カラー**: クリーム / テラコッタ / セージグリーン / ソフトゴールド

---

## Design Philosophy

**コンセプト: "和モダン × ぬくもり"**

- **タイポグラフィ**: 個性的なフォント必須。Inter/Roboto/Arial/system-ui 禁止
- **カラー**: CSS変数で一貫管理。主要色＋アクセントの明確な体系
- **モーション**: 意味のあるアニメーション。ページロード時のスタガー表示、スクロール連動、ホバーエフェクト
- **空間構成**: 非対称レイアウト、意図的な余白、グリッドブレイク要素
- **背景・質感**: ベタ塗り回避。グラデーション・ノイズテクスチャ・パターン・透過レイヤー活用
- **BEM命名**: CSS は BEM（`.block__element--modifier`）で統一

---

## Skills

| Skill | 用途 |
|-------|------|
| `codex-review` | マイルストーン品質レビュー |
| `universal-review` | 日常レビュー |
| `ui-design-review` | UI品質・デザイン・アクセシビリティ総合レビュー |
| `deep-research` | 体系的Webリサーチ（SEO・競合分析・技術調査） |
