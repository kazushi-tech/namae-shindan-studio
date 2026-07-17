# AFFINGER4 Child — namae-studio column

`column.namae-studio.com` 専用 WordPress 子テーマ。
本体 [namae-studio.com](https://namae-studio.com/) の和モダン×ぬくもりデザインを継承し、stitch2 で生成した HTML を BEM 化して組み上げたもの。

## ファイル構成

```
affinger4-child/
├── style.css          — テーマメタ + デザイントークン + 全コンポーネント
├── functions.php      — enqueue / canonical・重複転送 / メニュー / CTA ヘルパ
├── header.php         — グローバルナビ 6 項目（運営者情報なし）
├── sidebar.php        — dynamic_sidebar('sidebar-1') を描画
├── footer.php         — CTA + コピーライト
├── home.php           — コラムトップ（検索 + カテゴリカード + 新着記事）
├── category.php       — 親テーマのカテゴリテンプレートを上書きする入口
├── archive.php        — カテゴリ / タグ / 日付別一覧
├── search.php         — 記事検索結果
├── index.php          — 記事一覧フォールバック
├── single.php         — 記事詳細（著者・日付 + 本文 + 文脈 CTA + 関連記事）
├── template-parts/
│   ├── column-discovery.php — 検索・カテゴリ探索UI
│   ├── article-card.php     — 一覧共通の記事カード
│   └── pagination.php       — 一覧共通のページネーション
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
   - ホーム / 姓名判断 / 名前提案 / 人気ランキング / 漢字図鑑 / コラム
   - **「運営者情報」は入れない**（プランの症状 2 を解消）
6. 外観 → カスタマイズ → 追加 CSS を **全削除**（`enumerated-booping-perlis` で暫定投入した CSS は子テーマに移管済み）。

## ローカル検証

- PHP CLI が使える環境では、リポジトリルートから次を実行:
  ```powershell
  Get-ChildItem column-child-theme/affinger4-child -Recurse -Filter *.php |
    ForEach-Object { php -l $_.FullName }
  ```
- 差分の空白エラー: `git diff --check -- column-child-theme/affinger4-child`
- 実表示は WordPress 環境へ反映後、375px / 768px / 1280px でトップ・カテゴリ・検索結果を確認する。

## デザイン主要ポイント

| 項目 | 値 |
|---|---|
| 見出し | Zen Maru Gothic 700 / 900 |
| 本文 | Noto Sans JP 300–700 |
| 主要色 | テラコッタ #E8725C / セージ #6EC4A8 / ゴールド #F0B84D |
| 背景 | クリーム #FFF8F0 + 淡いラジアルグラデ |
| カード装飾 | 上部に 3px グラデライン（テラコッタ→ゴールド→セージ） |
| コラムトップ | 検索 → 大きなカテゴリカード → 新着記事の順で探索 |
| 記事一覧 | サイドバーを外した2列。先頭記事のみ横長の注目カード |
| CTA | `.btn--primary` テラコッタグラデ + ホバーで translateY(-2px) |
| モバイル | ≤767px でハンバーガー → 全幅ドロワー |

## 管理画面での推奨ウィジェット構成（サイドバー）

1. 検索
2. カテゴリ一覧
3. カスタム HTML ウィジェット:
   ```html
   <div class="widget--cta">
     <p>姓と名を入れるだけで五格の運勢がすぐわかります。</p>
     <a class="btn btn--primary btn--block" href="https://namae-studio.com/shindan">診断ページへ →</a>
   </div>
   ```

## 復帰手順（緊急）

子テーマで重大な崩れが出た場合:
1. FTP で `style.css` の `Theme Name:` を一時改名（例: `AFFINGER4 Child (DISABLED)`）。
2. 管理画面 → 外観 → テーマで親 AFFINGER4 に戻す。

## SEO・内部導線

- 本体サイトへのリンクは `.html` を付けず、公開 canonical と同じクリーン URL を使う。
- `/akachan-yobousesshu-schedule-2/` は公開 GET/HEAD のみ正規記事へ 301 転送する。管理画面・プレビューには干渉しない。
- フロントページが投稿一覧の場合だけ自己 canonical を補完する。主要 SEO プラグイン稼働時と固定フロントページでは子テーマから出力しない。
- 記事 hero に WordPress の実在著者・公開日・更新日を表示する。医療監修者など、投稿データに存在しない肩書きは表示しない。
- 記事末尾の導線は `affinger4_child_article_contextual_cta()` のスラッグ別配列へ追加できる。さらに `affinger4_child_article_contextual_cta` フィルタで投稿 ID ごとに上書き可能。
- CTA リンクには `data-column-cta` が付くため、GTM のクリックトリガーで遷移先別に計測できる。

## 変更履歴

- `1.5.2`: クリーン URL、重複記事 301、フロント canonical、著者・公開/更新日、記事末尾の文脈 CTA を追加。親テーマ互換の `#footer` を復元し、公開日以前の更新日は表示しない。

## 関連プラン

- [ui-ux-stitch2-immutable-corbato.md](../../plans/ui-ux-stitch2-immutable-corbato.md) — 本子テーマを生んだ親プラン
- [enumerated-booping-perlis.md](../../plans/enumerated-booping-perlis.md) — 手動カスタマイズ作業ログ（段階的に解体予定）
