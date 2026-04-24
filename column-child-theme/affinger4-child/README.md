# AFFINGER4 Child — namae-studio column

`column.namae-studio.com` 専用 WordPress 子テーマ。
本体 [namae-studio.com](https://namae-studio.com/) の和モダン×ぬくもりデザインを継承し、stitch2 で生成した HTML を BEM 化して組み上げたもの。

## ファイル構成

```
affinger4-child/
├── style.css          — テーマメタ + デザイントークン + 全コンポーネント
├── functions.php      — 親 enqueue / メニュー / ウィジェット登録 / ヘルパ
├── header.php         — グローバルナビ 6 項目（運営者情報なし）
├── sidebar.php        — dynamic_sidebar('sidebar-1') を描画
├── footer.php         — CTA + コピーライト
├── index.php          — 記事一覧（Loop + paginate_links）
├── single.php         — 記事詳細（hero + 本文 + 関連記事 + シェア）
├── README.md          — このファイル
└── assets/
    ├── js/nav.js      — ハンバーガー / ESC / URL コピー / reveal
    └── images/placeholder-eyecatch.svg — アイキャッチ未設定時の代替画像
```

## デプロイ手順

1. `affinger4-child/` フォルダごと Zip に圧縮。
2. Xserver ファイルマネージャで以下にアップロード:
   ```
   /home/pem/namae-studio.com/public_html/column.namae-studio.com/wp-content/themes/
   ```
3. アップロードした Zip を右クリック → 展開。`affinger4-child/` フォルダができたら Zip 本体は削除。
4. WP 管理画面 → 外観 → テーマ → 「AFFINGER4 Child — namae-studio column」で **有効化**。
5. 外観 → メニュー → グローバルナビ（子テーマ）に 6 項目を割り当て:
   - ホーム / 姓名判断 / 名前提案 / 人気ランキング / 漢字図鑑 / 名付けガイド
   - **「運営者情報」は入れない**（プランの症状 2 を解消）
6. 外観 → カスタマイズ → 追加 CSS を **全削除**（`enumerated-booping-perlis` で暫定投入した CSS は子テーマに移管済み）。

## ローカル検証

- PHP 文法: リポジトリルートで `bash scripts/verify-column-child.sh`（または各 PHP に対して `php -l`）。
- PowerShell の場合: `pwsh -Command "Get-ChildItem column-child-theme/affinger4-child -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }"`。

## デザイン主要ポイント

| 項目 | 値 |
|---|---|
| 見出し | Zen Maru Gothic 700 / 900 |
| 本文 | Noto Sans JP 300–700 |
| 主要色 | テラコッタ #E8725C / セージ #6EC4A8 / ゴールド #F0B84D |
| 背景 | クリーム #FFF8F0 + 淡いラジアルグラデ |
| カード装飾 | 上部に 3px グラデライン（テラコッタ→ゴールド→セージ） |
| CTA | `.btn--primary` テラコッタグラデ + ホバーで translateY(-2px) |
| モバイル | ≤767px でハンバーガー → 全幅ドロワー |

## 管理画面での推奨ウィジェット構成（サイドバー）

1. 検索
2. カテゴリ一覧
3. カスタム HTML ウィジェット:
   ```html
   <div class="widget--cta">
     <p>姓と名を入れるだけで五格の運勢がすぐわかります。</p>
     <a class="btn btn--primary btn--block" href="https://namae-studio.com/shindan.html">診断ページへ →</a>
   </div>
   ```

## 復帰手順（緊急）

子テーマで重大な崩れが出た場合:
1. FTP で `style.css` の `Theme Name:` を一時改名（例: `AFFINGER4 Child (DISABLED)`）。
2. 管理画面 → 外観 → テーマで親 AFFINGER4 に戻す。

## 関連プラン

- [ui-ux-stitch2-immutable-corbato.md](../../plans/ui-ux-stitch2-immutable-corbato.md) — 本子テーマを生んだ親プラン
- [enumerated-booping-perlis.md](../../plans/enumerated-booping-perlis.md) — 手動カスタマイズ作業ログ（段階的に解体予定）
