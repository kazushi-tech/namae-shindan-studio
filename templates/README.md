# templates/

Handlebars テンプレート（50サイト量産時のテンプレ化リファクタ用スキャフォールド）。

## 状態

**現時点では scripts/build.js はスキャフォールドとして存在するが、実際にHTMLを生成する処理は未実装。**
ゆえに `vercel.json` の `buildCommand` はまだ設定していない（現状のルート直下HTMLがそのまま公開される）。

完全移行には以下が必要:

1. `package.json` に `handlebars` を追加
2. `scripts/build.js` を実装し、すべての既存ページを `dist/` に再生成
3. 出力が現行HTMLと bytewise 同一（もしくは semantic 同一）であることを確認
4. `vercel.json` に `"buildCommand": "node scripts/build.js"`, `"outputDirectory": "dist"` を追加

## 構造

```
templates/
├── README.md                (このファイル)
├── layouts/
│   └── base.hbs             (HTML骨格: head-meta / nav / main / footer)
├── partials/
│   ├── head-meta.hbs        (<head> 内のmeta/og/link/JSON-LD)
│   ├── nav.hbs              (ナビゲーション)
│   ├── footer.hbs           (フッター)
│   └── service-worker.hbs   (SW解除スクリプト)
└── pages/
    ├── index.hbs
    ├── shindan.hbs
    ├── about.hbs
    └── privacy-policy.hbs
```

## データソース

ビルドスクリプトは以下を当ててレンダリングする:
- `site.config.json` — ブランド・ドメイン・カラー・GA4/AdSense ID
- `content/*.json` — 各ページの本文
- `tool/schema.json` — ツール結果のスキーマ参照
