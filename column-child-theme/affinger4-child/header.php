<?php
/**
 * Header template — column.namae-studio.com
 *
 * stitch2 `stitch_ (10)` の header 部分を BEM 化、WP フックを差し込み。
 *
 * @package AFFINGER4_Child
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="profile" href="https://gmpg.org/xfn/11">
<?php wp_head(); ?>
</head>
<body <?php body_class( 'site-wrap' ); ?>>
<?php if ( function_exists( 'wp_body_open' ) ) { wp_body_open(); } ?>

<a class="screen-reader-text" href="#site-main">本文へスキップ</a>

<header class="site-header" role="banner">
  <div class="site-header__inner">
    <a class="site-header__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?> ホームへ">
      <span class="site-header__title"><?php bloginfo( 'name' ); ?></span>
      <?php
      $description = get_bloginfo( 'description', 'display' );
      if ( $description || is_customize_preview() ) : ?>
        <span class="site-header__tagline"><?php echo esc_html( $description ); ?></span>
      <?php endif; ?>
    </a>

    <button
      type="button"
      class="site-header__toggle"
      id="site-header-toggle"
      aria-expanded="false"
      aria-controls="site-nav"
      aria-label="メニューを開閉する"
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </button>

    <nav class="site-nav" id="site-nav" aria-label="グローバルナビゲーション">
      <ul class="site-nav__list">
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/">ホーム</a></li>
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/shindan.html">姓名判断</a></li>
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/suggestion.html">名前提案</a></li>
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/ranking/">人気ランキング</a></li>
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/kanji/">漢字図鑑</a></li>
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/about.html">五格</a></li>
        <li class="site-nav__item"><a class="site-nav__link" href="https://namae-studio.com/favorites.html">お気に入り</a></li>
        <li class="site-nav__item"><a class="site-nav__link site-nav__link--active" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-current="page">コラム</a></li>
      </ul>
    </nav>
  </div>
</header>
