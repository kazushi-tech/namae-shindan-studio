<?php
/**
 * AFFINGER4 Child theme functions
 *
 * column.namae-studio.com 専用。親テーマ AFFINGER4 を継承し、
 * 本体 namae-studio.com の和モダン×ぬくもりトーンを流し込む。
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * スタイル／フォントの enqueue
 *
 * 読み込み順:
 *   1. Google Fonts (Noto Sans JP + Zen Maru Gothic)
 *   2. 親テーマ style.css
 *   3. 子テーマ style.css（親を上書き）
 */
add_action( 'wp_enqueue_scripts', function () {
    // Google Fonts
    wp_enqueue_style(
        'affinger4-child-google-fonts',
        'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap',
        array(),
        null
    );

    // 親テーマ
    wp_enqueue_style(
        'affinger4-parent',
        get_template_directory_uri() . '/style.css',
        array( 'affinger4-child-google-fonts' ),
        wp_get_theme( 'affinger4' )->get( 'Version' )
    );

    // 子テーマ（親とフォントに依存）
    wp_enqueue_style(
        'affinger4-child',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'affinger4-parent' ),
        wp_get_theme()->get( 'Version' )
    );

    // ナビゲーション用 JS
    wp_enqueue_script(
        'affinger4-child-nav',
        get_stylesheet_directory_uri() . '/assets/js/nav.js',
        array(),
        wp_get_theme()->get( 'Version' ),
        true
    );
}, 20 );

/**
 * preconnect で Google Fonts の TTFB 短縮
 */
add_action( 'wp_head', function () {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 1 );

/**
 * メニュー位置の登録（グローバルナビ 6 項目）
 *
 * 管理画面 → 外観 → メニュー → 「グローバルナビ（子テーマ）」を割り当てる。
 */
add_action( 'after_setup_theme', function () {
    register_nav_menus( array(
        'primary-menu' => __( 'グローバルナビ（子テーマ）', 'affinger4-child' ),
        'footer-menu'  => __( 'フッターナビ（子テーマ）', 'affinger4-child' ),
    ) );

    // テーマサポート
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );
    add_theme_support( 'custom-logo', array(
        'height'      => 80,
        'width'       => 320,
        'flex-width'  => true,
        'flex-height' => true,
    ) );
} );

/**
 * サイドバーのウィジェットエリア登録
 *
 * BEM 命名の外側コンテナを付与し、子テーマの .widget ルールで受け取れるようにする。
 */
add_action( 'widgets_init', function () {
    register_sidebar( array(
        'name'          => __( 'サイドバーウィジェット', 'affinger4-child' ),
        'id'            => 'sidebar-1',
        'description'   => __( '記事一覧・記事詳細で表示されるサイドバー。検索・カテゴリ・CTA カード推奨。', 'affinger4-child' ),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget__title">',
        'after_title'   => '</h3>',
    ) );
} );

/**
 * wp_nav_menu のリンクに .site-nav__link を付与（BEM 整合）
 */
add_filter( 'nav_menu_link_attributes', function ( $atts, $item, $args ) {
    if ( isset( $args->theme_location ) && 'primary-menu' === $args->theme_location ) {
        $classes     = isset( $atts['class'] ) ? $atts['class'] . ' site-nav__link' : 'site-nav__link';
        $atts['class'] = trim( $classes );
    }
    if ( isset( $args->theme_location ) && 'footer-menu' === $args->theme_location ) {
        $classes     = isset( $atts['class'] ) ? $atts['class'] . ' site-footer__nav-link' : 'site-footer__nav-link';
        $atts['class'] = trim( $classes );
    }
    return $atts;
}, 10, 3 );

/**
 * カスタムパンくず出力ヘルパ
 *
 * 親テーマの breadcrumb が不揃いなので、子テーマ側で BEM 化した版を使う。
 */
function affinger4_child_breadcrumb() {
    echo '<nav class="breadcrumb" aria-label="パンくずリスト"><ol class="breadcrumb__list" itemscope itemtype="https://schema.org/BreadcrumbList">';
    echo '<li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
    echo '<a class="breadcrumb__link" href="' . esc_url( home_url( '/' ) ) . '" itemprop="item"><span itemprop="name">ホーム</span></a>';
    echo '<meta itemprop="position" content="1" /></li>';

    if ( is_singular( 'post' ) ) {
        $categories = get_the_category();
        if ( ! empty( $categories ) ) {
            $cat = $categories[0];
            echo '<li class="breadcrumb__item"><span class="breadcrumb__sep" aria-hidden="true">›</span>';
            echo '<a class="breadcrumb__link" href="' . esc_url( get_category_link( $cat->term_id ) ) . '">' . esc_html( $cat->name ) . '</a></li>';
        }
        echo '<li class="breadcrumb__item"><span class="breadcrumb__sep" aria-hidden="true">›</span>';
        echo '<span class="breadcrumb__current" aria-current="page">' . esc_html( get_the_title() ) . '</span></li>';
    } elseif ( is_category() ) {
        echo '<li class="breadcrumb__item"><span class="breadcrumb__sep" aria-hidden="true">›</span>';
        echo '<span class="breadcrumb__current" aria-current="page">' . esc_html( single_cat_title( '', false ) ) . '</span></li>';
    } elseif ( is_search() ) {
        echo '<li class="breadcrumb__item"><span class="breadcrumb__sep" aria-hidden="true">›</span>';
        echo '<span class="breadcrumb__current" aria-current="page">検索結果</span></li>';
    } elseif ( is_page() ) {
        echo '<li class="breadcrumb__item"><span class="breadcrumb__sep" aria-hidden="true">›</span>';
        echo '<span class="breadcrumb__current" aria-current="page">' . esc_html( get_the_title() ) . '</span></li>';
    }

    echo '</ol></nav>';
}

/**
 * 記事抜粋の末尾を本体サイトのトーンに
 */
add_filter( 'excerpt_more', function () {
    return '…';
} );

add_filter( 'excerpt_length', function () {
    return 80;
} );

/**
 * 関連記事（同カテゴリ 3 件）を取得
 *
 * @param int $post_id 現在の投稿 ID
 * @param int $count   取得件数
 * @return WP_Post[]
 */
function affinger4_child_related_posts( $post_id, $count = 3 ) {
    $categories = wp_get_post_categories( $post_id );
    if ( empty( $categories ) ) {
        return array();
    }

    $args = array(
        'category__in'   => $categories,
        'post__not_in'   => array( $post_id ),
        'posts_per_page' => $count,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'no_found_rows'  => true,
    );

    return get_posts( $args );
}

/**
 * アイキャッチ未設定時のプレースホルダ画像 URL
 */
function affinger4_child_placeholder_image_url() {
    return get_stylesheet_directory_uri() . '/assets/images/placeholder-eyecatch.svg';
}

/**
 * 親テーマの不要な出力を抑える（必要に応じて追加）
 */
add_action( 'wp_enqueue_scripts', function () {
    // 親テーマの古いスタイルが競合したらここでデキュー
    // wp_dequeue_style( 'some-affinger-style' );
}, 100 );
