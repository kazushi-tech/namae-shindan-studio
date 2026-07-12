<?php
/**
 * Home / Blog index — category-first article discovery.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

global $wp_query;
$total = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;
?>

<main class="site-main site-main--column-home" id="site-main" role="main">
  <div class="column-hub">
    <?php affinger4_child_breadcrumb(); ?>

    <?php get_template_part( 'template-parts/column', 'discovery', array( 'variant' => 'full' ) ); ?>

    <section class="article-library" id="latest-articles" aria-labelledby="latest-articles-title">
      <div class="column-section-heading column-section-heading--articles">
        <div>
          <p class="column-section-heading__eyebrow">Latest articles</p>
          <h2 class="column-section-heading__title" id="latest-articles-title">新着記事</h2>
        </div>
        <?php if ( $total > 0 ) : ?>
          <p class="column-section-heading__description">全 <?php echo esc_html( number_format_i18n( $total ) ); ?> 件の記事があります。</p>
        <?php endif; ?>
      </div>

      <?php if ( have_posts() ) : ?>
        <div class="article-grid article-grid--home">
          <?php $article_index = 0; ?>
          <?php while ( have_posts() ) : the_post(); ?>
            <?php
            get_template_part(
                'template-parts/article',
                'card',
                array(
                    'featured'     => ! is_paged() && 0 === $article_index,
                    'heading_level' => 3,
                )
            );
            $article_index++;
            ?>
          <?php endwhile; ?>
        </div>

        <?php get_template_part( 'template-parts/pagination' ); ?>
      <?php else : ?>
        <div class="column-empty-state">
          <h3 class="column-empty-state__title">記事を準備しています</h3>
          <p class="column-empty-state__text">新しい記事が公開されるまで、少々お待ちください。</p>
        </div>
      <?php endif; ?>
    </section>
  </div>
</main>

<?php
get_footer();
