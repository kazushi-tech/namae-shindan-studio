<?php
/**
 * Main index fallback — article listing.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

global $wp_query;
$total = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;

if ( is_home() ) {
    $listing_title = single_post_title( '', false );
    if ( ! $listing_title ) {
        $listing_title = 'コラム一覧';
    }
} elseif ( is_category() ) {
    $listing_title = single_cat_title( '', false );
} elseif ( is_search() ) {
    $listing_title = sprintf( '「%s」の検索結果', get_search_query() );
} elseif ( is_archive() ) {
    $listing_title = get_the_archive_title();
} else {
    $listing_title = '記事一覧';
}
?>

<main class="site-main" id="site-main" role="main">
  <div class="content-layout content-layout--listing">
    <div class="content-layout__main content-layout__main--wide">
      <?php affinger4_child_breadcrumb(); ?>

      <header class="page-header page-header--listing">
        <div class="page-header__content">
          <p class="page-header__eyebrow">Articles</p>
          <h1 class="page-header__title"><?php echo esc_html( $listing_title ); ?></h1>
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
          <h2 class="column-empty-state__title">記事が見つかりませんでした</h2>
          <p class="column-empty-state__text">カテゴリを選ぶか、別のキーワードでお探しください。</p>
          <a class="column-empty-state__link" href="<?php echo esc_url( home_url( '/#column-categories' ) ); ?>">カテゴリ一覧へ戻る</a>
        </div>
      <?php endif; ?>
    </div>
  </div>
</main>

<?php
get_footer();
