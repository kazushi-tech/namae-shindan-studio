<?php
/**
 * Home / Blog index — 最新の投稿をフロントに表示する設定時に使われる
 *
 * 親テーマ AFFINGER4 の home.php を子テーマでオーバーライドする目的で作成。
 * index.php と同等のカードグリッド + Pagination を描画する。
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

      <div class="page-header">
        <h1 class="page-header__title">コラム一覧</h1>
        <?php
        global $wp_query;
        $total = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;
        if ( $total > 0 ) :
        ?>
          <span class="page-header__count">全 <?php echo esc_html( number_format_i18n( $total ) ); ?> 件</span>
        <?php endif; ?>
      </div>

      <?php if ( have_posts() ) : ?>
        <div class="article-grid">
          <?php while ( have_posts() ) : the_post(); ?>
            <article <?php post_class( 'article-card' ); ?>>
              <a class="article-card__link" href="<?php the_permalink(); ?>" aria-label="<?php echo esc_attr( wp_strip_all_tags( get_the_title() ) ); ?> を読む" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;flex:1;">
                <div class="article-card__media">
                  <?php if ( has_post_thumbnail() ) : ?>
                    <?php the_post_thumbnail( 'medium_large', array(
                        'class'   => 'article-card__image',
                        'alt'     => esc_attr( get_the_title() ),
                        'loading' => 'lazy',
                    ) ); ?>
                  <?php else : ?>
                    <img
                      class="article-card__image"
                      src="<?php echo esc_url( affinger4_child_placeholder_image_url() ); ?>"
                      alt=""
                      loading="lazy"
                    >
                  <?php endif; ?>
                </div>

                <div class="article-card__body">
                  <?php
                  $categories = get_the_category();
                  if ( ! empty( $categories ) ) :
                    $primary_cat = $categories[0];
                  ?>
                    <span class="article-card__category"><?php echo esc_html( $primary_cat->name ); ?></span>
                  <?php endif; ?>
                  <h2 class="article-card__title"><?php the_title(); ?></h2>
                  <p class="article-card__excerpt"><?php echo esc_html( wp_trim_words( wp_strip_all_tags( get_the_excerpt() ), 45, '…' ) ); ?></p>
                  <div class="article-card__meta">
                    <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'Y.m.d' ) ); ?></time>
                  </div>
                </div>
              </a>
            </article>
          <?php endwhile; ?>
        </div>

        <?php
        $pagination = paginate_links( array(
            'prev_text' => '‹',
            'next_text' => '›',
            'type'      => 'array',
            'end_size'  => 1,
            'mid_size'  => 2,
        ) );

        if ( is_array( $pagination ) && count( $pagination ) > 1 ) :
        ?>
          <nav class="pagination" aria-label="ページネーション">
            <?php foreach ( $pagination as $link ) : ?>
              <?php echo $link; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            <?php endforeach; ?>
          </nav>
        <?php endif; ?>

      <?php else : ?>
        <p style="padding: 2rem 0; color: var(--color-muted);">まだ記事が投稿されておりません。</p>
      <?php endif; ?>

    </div>

    <?php get_sidebar(); ?>
  </div>
</main>

<?php
get_footer();
