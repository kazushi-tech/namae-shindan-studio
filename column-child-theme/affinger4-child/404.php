<?php
/**
 * 404 Not Found template
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

      <div class="page-header">
        <h1 class="page-header__title">お探しのページは見つかりませんでした</h1>
      </div>

      <div class="widget" style="text-align: center;">
        <p style="margin: 0 0 var(--space-4); color: var(--color-medium);">
          URL が変更されたか、ページが削除された可能性があります。
        </p>
        <a class="btn btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>">
          トップへ戻る <span class="btn__arrow" aria-hidden="true">→</span>
        </a>
      </div>

    </div>

    <?php get_sidebar(); ?>
  </div>
</main>

<?php
get_footer();
