<?php
/**
 * Sidebar template — column.namae-studio.com
 *
 * 管理画面 → 外観 → ウィジェットで「サイドバーウィジェット」に
 * 検索 / カテゴリ / CTA カードのウィジェットを配置する設計。
 * 未設定時はビルトインのフォールバックを描画する。
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<aside class="sidebar content-layout__aside" role="complementary" aria-label="サイドバー">
  <?php if ( is_active_sidebar( 'sidebar-1' ) ) : ?>
    <?php dynamic_sidebar( 'sidebar-1' ); ?>
  <?php else : ?>
    <section class="widget widget_search">
      <h3 class="widget__title">記事を探す</h3>
      <?php get_search_form(); ?>
    </section>

    <section class="widget widget_categories">
      <h3 class="widget__title">カテゴリ</h3>
      <ul>
        <?php
        wp_list_categories( array(
            'title_li'   => '',
            'hide_empty' => 0,
            'show_count' => 1,
        ) );
        ?>
      </ul>
    </section>

    <section class="widget widget--cta">
      <h3 class="widget__title">無料で姓名判断を試す</h3>
      <p>姓と名を入れるだけで五格の運勢がすぐわかります。</p>
      <a class="btn btn--primary btn--block" href="https://namae-studio.com/shindan">
        診断ページへ <span class="btn__arrow" aria-hidden="true">→</span>
      </a>
    </section>
  <?php endif; ?>
</aside>
