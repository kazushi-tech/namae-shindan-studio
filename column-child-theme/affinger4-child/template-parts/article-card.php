<?php
/**
 * Article card used by column listing screens.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$is_featured   = ! empty( $args['featured'] );
$card_classes  = $is_featured ? 'article-card article-card--featured' : 'article-card';
$title         = get_the_title();
$permalink     = get_permalink();
$categories    = get_the_category();
$primary_cat   = ! empty( $categories ) ? $categories[0] : null;
$thumbnail_size = $is_featured ? 'large' : 'medium_large';
$heading_tag   = isset( $args['heading_level'] ) && 3 === (int) $args['heading_level'] ? 'h3' : 'h2';
?>

<article <?php post_class( $card_classes ); ?>>
  <div class="article-card__media">
    <?php if ( has_post_thumbnail() ) : ?>
      <?php
      the_post_thumbnail(
          $thumbnail_size,
          array(
              'class'    => 'article-card__image',
              'alt'      => '',
              'loading'  => 'lazy',
              'decoding' => 'async',
          )
      );
      ?>
    <?php else : ?>
      <img
        class="article-card__image"
        src="<?php echo esc_url( affinger4_child_placeholder_image_url() ); ?>"
        alt=""
        width="640"
        height="360"
        loading="lazy"
        decoding="async"
      >
    <?php endif; ?>

    <?php if ( $is_featured ) : ?>
      <span class="article-card__featured-label">最新記事</span>
    <?php endif; ?>
  </div>

  <div class="article-card__body">
    <?php if ( $primary_cat ) : ?>
      <a class="article-card__category" href="<?php echo esc_url( get_category_link( $primary_cat->term_id ) ); ?>">
        <?php echo esc_html( $primary_cat->name ); ?>
      </a>
    <?php endif; ?>

    <<?php echo esc_html( $heading_tag ); ?> class="article-card__title">
      <a class="article-card__title-link" href="<?php echo esc_url( $permalink ); ?>">
        <?php echo esc_html( $title ); ?>
      </a>
    </<?php echo esc_html( $heading_tag ); ?>>

    <p class="article-card__excerpt">
      <?php echo esc_html( wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 50, '…' ) ); ?>
    </p>

    <div class="article-card__meta">
      <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
        <?php echo esc_html( get_the_date( 'Y.m.d' ) ); ?>
      </time>
      <span class="article-card__read-more" aria-hidden="true">
        記事を読む
        <span class="article-card__arrow" aria-hidden="true">→</span>
      </span>
    </div>
  </div>
</article>
