<?php
/**
 * Footer template — column.namae-studio.com
 *
 * stitch2 `stitch_ (10)` の footer を BEM 化し、本体サイト導線を組み込む。
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<footer class="site-footer" id="footer" role="contentinfo">
  <div class="site-footer__inner">
    <p class="site-footer__brand"><?php bloginfo( 'name' ); ?></p>
    <p class="site-footer__tagline">赤ちゃんの名付けを楽しく学ぶコラム</p>

    <?php if ( has_nav_menu( 'child-footer' ) ) : ?>
      <?php
      wp_nav_menu( array(
          'theme_location' => 'child-footer',
          'menu_class'     => 'site-footer__nav',
          'container'      => false,
          'depth'          => 1,
          'fallback_cb'    => false,
      ) );
      ?>
    <?php else : ?>
      <ul class="site-footer__nav">
        <li><a class="site-footer__nav-link" href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a></li>
        <li><a class="site-footer__nav-link" href="https://namae-studio.com/">本体サイト</a></li>
        <li><a class="site-footer__nav-link" href="https://namae-studio.com/privacy-policy">プライバシーポリシー</a></li>
      </ul>
    <?php endif; ?>

    <div class="site-footer__cta">
      <a class="btn btn--outline" href="https://namae-studio.com/shindan">
        本体サイトで姓名判断を試す <span class="btn__arrow" aria-hidden="true">→</span>
      </a>
    </div>

    <p class="site-footer__copyright">
      &copy; <?php echo esc_html( date_i18n( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?> — 赤ちゃんの名付けを楽しく学ぶ
    </p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
