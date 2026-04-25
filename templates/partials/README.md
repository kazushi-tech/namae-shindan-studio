# templates/partials/

Handlebars partial 群。`scripts/build.js` の起動時に **kebab-case ファイル名 → camelCase partial 名** で全自動登録される。

## 命名規約

| ファイル名 | partial 名 | 役割 |
|----------|-----------|-----|
| `head-meta.hbs` | `headMeta` | `<head>` 内のメタ・OG・CSS・GTM・JSON-LD |
| `gtm-noscript.hbs` | `gtmNoscript` | `<body>` 直後の noscript GTM iframe |
| `skip-link.hbs` | `skipLink` | a11y: 本文へスキップリンク |
| `nav.hbs` | `nav` | グローバルナビ（`site.nav` 駆動） |
| `footer.hbs` | `footer` | グローバルフッター（`site.footer.links` 駆動） |
| `core-scripts.hbs` | `coreScripts` | `js/core/*` + ページ JS のロード一括 |
| `service-worker-unregister.hbs` | `serviceWorkerUnregister` | 既存 SW を強制解除 |
| `live-region.hbs` | `liveRegion` | a11y: aria-live 通知領域 |
| `json-ld.hbs` | `jsonLd` | `context.jsonLd` を `<script type="application/ld+json">` 注入 |

## 利用方法

`templates/layouts/base.hbs` から `{{> headMeta}}` `{{> nav}}` `{{> footer}}` などで参照。
ページ側 hbs (`templates/pages/*.hbs`) からも自由に呼べる。

## 編集ルール

- 新規 partial を追加したら自動登録されるが、**他ページからの参照は手動で追加が必要**。
- partial 内で `site.*` `meta.*` `path` `buildVersion` 等のグローバル変数を直接参照可能（build.js が context に統合済み）。
