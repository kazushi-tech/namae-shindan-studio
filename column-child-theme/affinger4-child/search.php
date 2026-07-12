<?php
/**
 * Search results template.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

global $wp_query;
$total        = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;
$search_query = get_search_query();
?>

<main class="site-main" id="site-main" role="main">
  <div class="content-layout content-layout--listing">
    <div class="content-layout__main content-layout__main--wide">
      <?php affinger4_child_breadcrumb(); ?>

      <header class="page-header page-header--listing">
        <div class="page-header__content">
          <p class="page-header__eyebrow">Search results</p>
          <h1 class="page-header__title">「<?php echo esc_html( $search_query ); ?>」の検索結果</h1>
        </div>
        <span class="page-header__count">全 <?php echo esc_html( number_format_i18n( $total ) ); ?> 件</span>
      </header>

      <?php get_template_part( 'template-parts/column', 'discovery', array( 'variant' => 'compact' ) ); ?>

      <?php if ( have_posts() ) : ?>
        <div class="article-grid">
          <?php while ( have_posts() ) : the_post(); ?>
            <?php get_template_part( 'template-parts/article', 'card' ); ?>
          <?php endwhile; ?>
        </div>

        <?php get_template_part( 'template-parts/pagination' ); ?>
      <?php else : ?>
        <div class="column-empty-state">
          <h2 class="column-empty-state__title">該当する記事が見つかりませんでした</h2>
          <p class="column-empty-state__text">短い言葉に変えるか、上のカテゴリから近いテーマを選んでみてください。</p>
          <a class="column-empty-state__link" href="<?php echo esc_url( home_url( '/#column-categories' ) ); ?>">カテゴリ一覧から探す</a>
        </div>
      <?php endif; ?>
    </div>
  </div>
</main>

<?php
get_footer();
