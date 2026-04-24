<?php
/**
 * Single post — 記事詳細
 *
 * stitch2 `stitch_ (11)` の hero + body + 関連記事を BEM 化、WP タグで
 * 動的レンダリング。Google+ ボタンは絶対に含めない。
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();
?>

<main class="site-main" id="site-main" role="main">

  <?php while ( have_posts() ) : the_post(); ?>

    <?php
    $categories  = get_the_category();
    $primary_cat = ! empty( $categories ) ? $categories[0] : null;
    $hero_url    = get_the_post_thumbnail_url( get_the_ID(), 'full' );
    ?>

    <header class="article-hero">
      <div class="article-hero__media">
        <?php if ( $hero_url ) : ?>
          <img class="article-hero__image" src="<?php echo esc_url( $hero_url ); ?>" alt="" loading="eager">
        <?php endif; ?>
        <div class="article-hero__overlay" aria-hidden="true"></div>
      </div>
      <div class="article-hero__inner">
        <div class="article-hero__content">
          <div class="article-hero__meta">
            <?php if ( $primary_cat ) : ?>
              <a class="article-hero__category" href="<?php echo esc_url( get_category_link( $primary_cat->term_id ) ); ?>">
                <?php echo esc_html( $primary_cat->name ); ?>
              </a>
            <?php endif; ?>
            <time class="article-hero__date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
              <?php echo esc_html( get_the_date( 'Y.m.d' ) ); ?>
            </time>
          </div>
          <h1 class="article-hero__title"><?php the_title(); ?></h1>
        </div>
      </div>
    </header>

    <div class="content-layout">
      <div class="content-layout__main">

        <?php affinger4_child_breadcrumb(); ?>

        <article <?php post_class( 'article-body' ); ?>>
          <?php
          the_content();

          wp_link_pages( array(
              'before' => '<nav class="article-body__pagelinks" aria-label="記事ページ">',
              'after'  => '</nav>',
          ) );
          ?>
        </article>

        <?php
        $permalink = get_permalink();
        $title     = wp_strip_all_tags( get_the_title() );
        $encoded_url   = rawurlencode( $permalink );
        $encoded_title = rawurlencode( $title );
        ?>
        <div class="share-bar" role="group" aria-label="記事をシェア">
          <span class="share-bar__label">この記事をシェアする</span>
          <ul class="share-bar__list">
            <li>
              <a
                class="share-bar__link"
                href="https://twitter.com/intent/tweet?text=<?php echo esc_attr( $encoded_title ); ?>&url=<?php echo esc_attr( $encoded_url ); ?>"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter) でシェア"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </li>
            <li>
              <a
                class="share-bar__link"
                href="https://social-plugins.line.me/lineit/share?url=<?php echo esc_attr( $encoded_url ); ?>"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LINE でシェア"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.365 9.863a.631.631 0 0 1 0 1.261H17.61v1.125h1.755a.63.63 0 1 1 0 1.259h-2.386a.631.631 0 0 1-.627-.629V8.108a.632.632 0 0 1 .631-.632h2.386a.632.632 0 0 1-.004 1.263H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 0 1-.438.598.652.652 0 0 1-.195.03.628.628 0 0 1-.508-.25l-2.443-3.325v2.946a.63.63 0 0 1-1.257 0V8.108a.626.626 0 0 1 .43-.594.625.625 0 0 1 .197-.033c.196 0 .378.095.495.244l2.462 3.33V8.108a.631.631 0 0 1 1.257 0v4.771zm-5.741 0a.632.632 0 0 1-.631.632.63.63 0 0 1-.627-.632V8.108a.629.629 0 0 1 .63-.628.631.631 0 0 1 .628.628v4.771zm-2.466.631h-2.387A.634.634 0 0 1 4.28 12.88V8.108a.631.631 0 0 1 1.262 0v4.14h1.762a.629.629 0 1 1 0 1.257M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              </a>
            </li>
            <li>
              <a
                class="share-bar__link"
                href="https://b.hatena.ne.jp/entry/<?php echo esc_attr( wp_parse_url( $permalink, PHP_URL_HOST ) . wp_parse_url( $permalink, PHP_URL_PATH ) ); ?>"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="はてなブックマークに追加"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.47 0C22 0 23.25 1.25 23.25 2.78v18.44c0 1.53-1.25 2.78-2.78 2.78H2.78C1.25 24 0 22.75 0 21.22V2.78C0 1.25 1.25 0 2.78 0h17.69zM12.03 18.45c.73 0 1.33-.6 1.33-1.33s-.6-1.33-1.33-1.33c-.73 0-1.33.6-1.33 1.33 0 .73.6 1.33 1.33 1.33zm-2.12-3.11h4.23c.85 0 1.54-.69 1.54-1.54v-3.09c0-.85-.69-1.54-1.54-1.54h-4.23V6.06h-2.8v9.28h2.8v-.02zm5.73-8.68c0-1.17.95-2.12 2.12-2.12s2.12.95 2.12 2.12-.95 2.12-2.12 2.12-2.12-.95-2.12-2.12zm-5.73 7h3.25v1.31H9.91v-1.31zm0-2.5h3.25v1.31H9.91V11.16z"/></svg>
              </a>
            </li>
            <li>
              <a
                class="share-bar__link"
                href="<?php echo esc_url( $permalink ); ?>"
                data-copy-url="true"
                aria-label="URL をコピー"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg>
              </a>
            </li>
          </ul>
        </div>

        <?php
        $related_posts = affinger4_child_related_posts( get_the_ID(), 3 );
        if ( ! empty( $related_posts ) ) :
        ?>
          <section class="related" aria-labelledby="related-title">
            <h2 class="related__title" id="related-title">関連記事</h2>
            <div class="related__grid">
              <?php foreach ( $related_posts as $related ) :
                  $related_categories = get_the_category( $related->ID );
                  $related_cat        = ! empty( $related_categories ) ? $related_categories[0] : null;
              ?>
                <a class="related__card" href="<?php echo esc_url( get_permalink( $related->ID ) ); ?>">
                  <div class="related__media">
                    <?php if ( has_post_thumbnail( $related->ID ) ) : ?>
                      <?php echo get_the_post_thumbnail( $related->ID, 'medium', array(
                          'class'   => 'related__image',
                          'alt'     => esc_attr( get_the_title( $related->ID ) ),
                          'loading' => 'lazy',
                      ) ); ?>
                    <?php else : ?>
                      <img class="related__image" src="<?php echo esc_url( affinger4_child_placeholder_image_url() ); ?>" alt="" loading="lazy">
                    <?php endif; ?>
                  </div>
                  <div class="related__body">
                    <?php if ( $related_cat ) : ?>
                      <span class="related__category"><?php echo esc_html( $related_cat->name ); ?></span>
                    <?php endif; ?>
                    <h3 class="related__heading"><?php echo esc_html( get_the_title( $related->ID ) ); ?></h3>
                  </div>
                </a>
              <?php endforeach; ?>
            </div>
          </section>
        <?php endif; ?>

      </div>

      <?php get_sidebar(); ?>
    </div>

  <?php endwhile; ?>

</main>

<?php
get_footer();
