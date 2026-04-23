# content/

50サイト量産テンプレ化に向けた**本文コンテンツの外部化ファイル**。

## 役割

各HTMLページの本文（見出し、段落、リスト項目、CTA文言など）を JSON として切り出したもの。
`scripts/build.js` がビルド時に `templates/*.hbs` に注入してHTMLを生成する想定。

## 状態

**現時点では参照元（build.js）が未実装のため、これらのJSONは書き換えてもルート直下のHTMLには反映されない。**
本番の表示を変えるには、対応するHTMLファイル（`index.html` 等）を直接編集する必要がある。

Phase 1.11 のビルド本実装が完了した段階で、編集の主戦場がこちらに移行する。

## ファイル一覧

| ファイル | 対応ページ |
|---------|----------|
| `home.json` | `/` (index.html) |
| `shindan.json` | `/shindan` (shindan.html) |
| `about.json` | `/about` (about.html) |

将来的に `guide/*.json`、`ranking/*.json` を追加していく。
