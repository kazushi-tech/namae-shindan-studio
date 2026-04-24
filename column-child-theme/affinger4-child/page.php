<?php
/**
 * Page template — 固定ページ
 *
 * 固定ページも子テーマのレイアウト（content-layout + sidebar）で描画する。
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();
?>

<main class="site-main" id="site-main" role="main">
  <div class="content-layout">
    <div class="content-layout__main">

      <?php affinger4_child_breadcrumb(); ?>

      <?php while ( have_posts() ) : the_post(); ?>

        <div class="page-header">
          <h1 class="page-header__title"><?php the_title(); ?></h1>
        </div>

        <article <?php post_class( 'article-body' ); ?>>
          <?php
          the_content();

          wp_link_pages( array(
              'before' => '<nav class="article-body__pagelinks" aria-label="ページ">',
              'after'  => '</nav>',
          ) );
          ?>
        </article>

      <?php endwhile; ?>

    </div>

    <?php get_sidebar(); ?>
  </div>
</main>

<?php
get_footer();
