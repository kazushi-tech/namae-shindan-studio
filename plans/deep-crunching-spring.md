# column「名付けガイド」上部ハブタイル追加

## Context

column.namae-studio.com（WordPress / affinger4-child 子テーマ）の「名付けガイド」ページにアクセスすると、現在は `home.php` が投稿一覧テンプレートとして動作しており、投稿が 0 件のため「まだ記事が投稿されておりません。」のみが表示される。

ユーザーは本体サイト namae-studio.com の `/guide/` のようなハブ型レイアウト（項目タイルが上部に並ぶ）を期待しており、「項目が上部に表示されないのか？五格についてとか」と指摘。

対応方針は以下で確定:
- **リンク先**: 本体サイト namae-studio.com の既存 HTML ページへ絶対 URL で飛ばす（WordPress カテゴリーや固定ページは作らない）
- **表示タイミング**: 投稿の有無に関わらず常に上部に表示（下に既存の投稿ループを残す）
- **並べる項目**: 本体サイトのナビ全項目（「コラム」は自身なので除外）の 8 タイル

**ねらい**: 投稿ゼロの現状でもページが空に見えず、本体サイトへの導線としてもワークする。本体 `/guide/index.html:95-133` のタイル UI 言語を子テーマに移植する形。

---

## 修正対象ファイル

| ファイル | 変更内容 |
|---|---|
| [column-child-theme/affinger4-child/home.php](column-child-theme/affinger4-child/home.php) | ハブタイル配列定義 + セクション HTML を挿入 |
| [column-child-theme/affinger4-child/style.css](column-child-theme/affinger4-child/style.css) | `.site-hub` 系 BEM クラスを末尾に追加 |

他ファイル（header.php / functions.php / archive.php / single.php）は触らない。

---

## home.php 変更内容

### 1. 配列定義を追加（[home.php:13](column-child-theme/affinger4-child/home.php#L13) の直後、`get_header()` の前）

```php
$hub_tiles = array(
    array( 'url' => 'https://namae-studio.com/',                    'icon' => '🏠', 'title' => 'ホーム',     'desc' => '名前診断スタジオのトップへ。' ),
    array( 'url' => 'https://namae-studio.com/shindan.html',        'icon' => '🔮', 'title' => '姓名判断',   'desc' => '画数・五格から運勢を無料鑑定。' ),
    array( 'url' => 'https://namae-studio.com/meimei-list.html',    'icon' => '✨', 'title' => '名前候補',   'desc' => '響き・願いから候補を一覧で提案。' ),
    array( 'url' => 'https://namae-studio.com/ranking.html',        'icon' => '📊', 'title' => 'ランキング', 'desc' => '人気の名前・漢字のランキング。' ),
    array( 'url' => 'https://namae-studio.com/kanji-dictionary.html','icon' => '📖','title' => '漢字辞典',   'desc' => '名付けに使える漢字の意味と読み。' ),
    array( 'url' => 'https://namae-studio.com/guide/',              'icon' => '📘', 'title' => 'ガイド',     'desc' => '名付け FAQ・出産準備・お宮参り。' ),
    array( 'url' => 'https://namae-studio.com/about.html',          'icon' => '🎋', 'title' => '五格',       'desc' => '天格・人格・地格・外格・総格の意味。' ),
    array( 'url' => 'https://namae-studio.com/favorites.html',      'icon' => '⭐', 'title' => 'お気に入り', 'desc' => '保存した名前候補をここで管理。' ),
);
```

### 2. セクション HTML を挿入（[home.php:33](column-child-theme/affinger4-child/home.php#L33) の `</div>` 直後、[home.php:35](column-child-theme/affinger4-child/home.php#L35) の `if ( have_posts() )` の前）

```php
<section class="site-hub" aria-label="サイト内メインメニュー">
  <h2 class="site-hub__heading">名前診断スタジオの主要ページ</h2>
  <ul class="site-hub__grid">
    <?php foreach ( $hub_tiles as $t ) : ?>
      <li class="site-hub__item">
        <a class="site-hub__tile" href="<?php echo esc_url( $t['url'] ); ?>" rel="noopener">
          <span class="site-hub__tile-icon" aria-hidden="true"><?php echo esc_html( $t['icon'] ); ?></span>
          <span class="site-hub__tile-title"><?php echo esc_html( $t['title'] ); ?></span>
          <span class="site-hub__tile-desc"><?php echo esc_html( $t['desc'] ); ?></span>
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
</section>
```

**設計メモ**:
- クラス名は `.site-hub` 採用（`.guide-hub` は本体サイトで使用中のため衝突回避）
- `target="_blank"` は付けない（同ブランド内遷移）。`rel="noopener"` のみ安全側で付与
- 絵文字は `aria-hidden="true"` でスクリーンリーダー読み上げ回避
- `<section aria-label>` でランドマーク識別

---

## style.css 追加内容

[style.css](column-child-theme/affinger4-child/style.css) 末尾に追記。既存 CSS 変数（`--color-terracotta` / `--color-cream` / `--color-border` / `--color-white` / `--color-medium` / `--color-muted` / `--space-*` / `--radius-lg` / `--shadow-card` / `--shadow-card-hover` / `--font-heading` / `--text-*` / `--transition-default`）をフル流用し、新規変数は増やさない。

```css
.site-hub { margin: 0 0 var(--space-10); }

.site-hub__heading {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-medium);
  margin: 0 0 var(--space-5);
  padding-left: var(--space-3);
  border-left: 4px solid var(--color-terracotta);
}

.site-hub__grid {
  display: grid;
  gap: var(--space-5);
  padding: 0;
  margin: 0;
  list-style: none;
  grid-template-columns: 1fr;
}
@media (min-width: 600px)  { .site-hub__grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px)  { .site-hub__grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1200px) { .site-hub__grid { grid-template-columns: repeat(4, 1fr); } }

.site-hub__tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  color: inherit;
  min-height: 140px;
  transition: transform var(--transition-default), box-shadow var(--transition-default);
}
.site-hub__tile:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}
.site-hub__tile:hover .site-hub__tile-title { color: var(--color-terracotta); }

.site-hub__tile-icon  { font-size: 32px; line-height: 1; }
.site-hub__tile-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-medium);
  transition: color var(--transition-default);
}
.site-hub__tile-desc  {
  font-size: var(--text-sm);
  color: var(--color-muted);
  line-height: 1.6;
}
```

**デザイン整合**: 既存 `.article-card` のホバー挙動（`translateY(-4px)` + `shadow-card-hover`）を踏襲。ビジュアル一貫性を保ちつつ、`.article-card` とのクラス衝突なし。

---

## 検証手順

1. **ローカル表示確認**
   - WordPress ローカル環境（LocalWP / wp-env 等）の有無は要確認。存在すれば `/` にアクセスして 8 タイル表示と「まだ記事が…」が下に来ることを確認。
   - ローカル環境無しの場合、本番（column.namae-studio.com）へ子テーマファイルを反映して確認。

2. **レスポンシブ確認**
   - DevTools のデバイスツールで 375px / 600px / 960px / 1200px 各ブレークポイントでカラム数が 1 → 2 → 3 → 4 と変化することを確認。
   - モバイルで各タイルのタップ領域が十分（`min-height: 140px`）。

3. **リンク動作確認**
   - 全 8 タイルクリックで本体サイト namae-studio.com の該当ページへ遷移。
   - 特に `favorites.html` は実ファイル存在確認済みだが、ブラウザでの 200 応答を念のため確認。

4. **既存投稿ループ非破壊確認**
   - 投稿を 1 件仮公開（または下書きプレビュー）して、ハブの下に `article-grid` が正常描画されることを確認。
   - 削除して「まだ記事が投稿されておりません」がハブの下に出ることを確認。

5. **アクセシビリティ**
   - スクリーンリーダー（NVDA / VoiceOver）で `section[aria-label]` がランドマークとして読み上げられ、絵文字が読み上げられないことを確認。
   - キーボード操作でタイルにフォーカス可能・Enter で遷移することを確認。

---

## トレードオフ

- **絶対 URL のベタ書き**: サブドメイン越境のため必須。デメリットは本体ドメイン変更時の一斉置換が必要になる点 → PHP 配列に集約しているので影響箇所は 1 ファイル 8 行で済む。
- **WordPress メニュー API 不採用**: 管理画面から編集できる利点はあるが、絵文字 + 短説明 + カードタイル UI を標準 `wp_nav_menu()` で表現するには walker 自作が必要でオーバーキル。配列直書きの方が保守性が高い。
- **絵文字アイコン**: 本体 `/guide/` は PNG 画像だが、第一弾は画像追加コスト回避のためテキスト絵文字で軽量に実装。必要なら後続で `/assets/images/hub-*.png` への差し替え可能（タイル HTML の `.site-hub__tile-icon` 中身だけ入れ替えれば済む設計）。
- **「コラム」の除外**: column 自身のページなので意図的に除外。ナビ 9 項目中 8 項目が表示される。
