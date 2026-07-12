<?php
/**
 * Pagination shared by column listing screens.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$pagination = paginate_links(
    array(
        'prev_text' => '<span aria-hidden="true">‹</span><span class="screen-reader-text">前のページ</span>',
        'next_text' => '<span aria-hidden="true">›</span><span class="screen-reader-text">次のページ</span>',
        'type'      => 'array',
        'end_size'  => 1,
        'mid_size'  => 2,
    )
);

if ( is_array( $pagination ) && count( $pagination ) > 1 ) :
?>
  <nav class="pagination" aria-label="記事一覧のページネーション">
    <?php foreach ( $pagination as $link ) : ?>
      <?php echo wp_kses_post( $link ); ?>
    <?php endforeach; ?>
  </nav>
<?php endif; ?>
