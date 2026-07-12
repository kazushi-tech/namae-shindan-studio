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
    // バージョン文字列にファイル mtime を採用 — ファイル更新時に必ず ?ver= が変わり、
    // ブラウザキャッシュを自動的にバストする。Theme Header の Version は人間用の名札として
    // 残すが、enqueue 側はファイル実体の更新時刻に追従させる。
    $child_css_path = get_stylesheet_directory() . '/style.css';
    $child_css_ver  = file_exists( $child_css_path ) ? filemtime( $child_css_path ) : wp_get_theme()->get( 'Version' );
    wp_enqueue_style(
        'affinger4-child',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'affinger4-parent' ),
        $child_css_ver
    );

    // 親テーマ AFFINGER4 が `wp_enqueue_style('style-css', get_stylesheet_uri())`
    // を版指定なしで投げてくる結果、子テーマ style.css が ?ver=<WP-version> という
    // 動かない URL で重複ロードされ、ブラウザがそこに古い内容をキャッシュし続ける。
    // 親側の登録版数も filemtime に揃えて、URL の不変性を解消する。
    global $wp_styles;
    if ( isset( $wp_styles->registered['style-css'] ) ) {
        $wp_styles->registered['style-css']->ver = $child_css_ver;
    }

    // ナビゲーション用 JS
    $child_nav_path = get_stylesheet_directory() . '/assets/js/nav.js';
    $child_nav_ver  = file_exists( $child_nav_path ) ? filemtime( $child_nav_path ) : wp_get_theme()->get( 'Version' );
    wp_enqueue_script(
        'affinger4-child-nav',
        get_stylesheet_directory_uri() . '/assets/js/nav.js',
        array(),
        $child_nav_ver,
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
 * フロント HTML のキャッシュ設定 — テーマ更新が確実にユーザに届くよう、
 * HTML は毎回再検証させる（ETag による 304 は通る）。
 * CSS/JS は filemtime ベースの ?ver= でバストする運用。
 */
add_action( 'send_headers', function () {
    if ( is_admin() ) {
        return;
    }
    if ( is_user_logged_in() ) {
        return; // 管理者の編集中プレビュー等を阻害しないよう既存挙動を維持
    }
    if ( ! headers_sent() ) {
        header( 'Cache-Control: no-cache, must-revalidate, max-age=0', true );
    }
}, 1 );

/**
 * 記事ページ hero の critical CSS を HTML 内にインライン出力。
 *
 * 外部 style.css はブラウザが max-age 7 日でキャッシュ保持するため、CSS 設計を
 * 変更しても旧端末で旧レイアウトが残る事故が起きやすい。これを回避するために、
 * hero の決定的なレイアウトルールだけ wp_head から `<style>` で出力し、`!important`
 * で外部 CSS のキャッシュ状態に依存しない最終決定権を持たせる。
 *
 * HTML 自体は send_headers 側で no-cache を出しているため、このインライン CSS は
 * 毎リクエストで最新が届く。functions.php を更新すれば即座に全ユーザに反映される。
 */
add_action( 'wp_head', function () {
    if ( ! is_singular( 'post' ) ) {
        return;
    }
    ?>
    <style id="article-hero-critical">
    /* hero card layout — overrides any cached external CSS */
    .article-hero {
        position: relative !important;
        max-width: 1200px !important;
        margin: 0 auto 24px !important;
        padding: 0 24px !important;
        background: transparent !important;
        width: auto !important;
        min-height: 0 !important;
        aspect-ratio: auto !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
    }
    .article-hero__media {
        position: relative !important;
        inset: auto !important;
        width: 100% !important;
        aspect-ratio: 16 / 9 !important;
        max-height: 480px !important;
        min-height: 0 !important;
        overflow: hidden !important;
        background-color: #FFF0E1 !important;
        border-radius: 20px !important;
        box-shadow: 0 2px 16px rgba(36, 25, 23, 0.06) !important;
    }
    .article-hero__image {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        object-position: center !important;
    }
    .article-hero__overlay {
        display: none !important;
    }
    .article-hero__inner {
        position: relative !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 16px 0 4px !important;
        display: block !important;
        min-height: 0 !important;
    }
    .article-hero__content {
        max-width: 720px !important;
        color: inherit !important;
    }
    .article-hero__date {
        color: #5C4F44 !important;
    }
    .article-hero__title {
        color: #3D3D29 !important;
        text-shadow: none !important;
        font-family: "Zen Maru Gothic", "Hiragino Maru Gothic ProN", serif !important;
    }
    @media (min-width: 768px) {
        .article-hero__inner { padding: 20px 0 8px !important; }
    }
    </style>
    <?php
}, 99 );

/**
 * メニュー位置の登録（グローバルナビ 6 項目）
 *
 * 管理画面 → 外観 → メニュー → 「グローバルナビ（子テーマ）」を割り当てる。
 */
add_action( 'after_setup_theme', function () {
    // 親テーマ AFFINGER4 が `primary-menu` / `footer-menu` 等のスラッグを既に使っているため、
    // 子テーマ固有の一意スラッグで登録する。
    register_nav_menus( array(
        'child-primary' => __( 'グローバルナビ（子テーマ）', 'affinger4-child' ),
        'child-footer'  => __( 'フッターナビ（子テーマ）', 'affinger4-child' ),
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
    if ( isset( $args->theme_location ) && 'child-primary' === $args->theme_location ) {
        $classes     = isset( $atts['class'] ) ? $atts['class'] . ' site-nav__link' : 'site-nav__link';
        $atts['class'] = trim( $classes );
    }
    if ( isset( $args->theme_location ) && 'child-footer' === $args->theme_location ) {
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
 * コラム内の検索結果を投稿記事だけに限定する。
 *
 * 一覧上部の専用検索フォームだけでなく、記事詳細のサイドバーにある
 * WordPress 標準検索フォームから検索した場合も同じ結果になるよう統一する。
 */
add_action( 'pre_get_posts', function ( $query ) {
    if ( is_admin() || ! $query->is_main_query() || ! $query->is_search() ) {
        return;
    }

    $query->set( 'post_type', 'post' );
}, 9 );

/**
 * 親テーマの不要な出力を抑える（必要に応じて追加）
 */
add_action( 'wp_enqueue_scripts', function () {
    // 親テーマの古いスタイルが競合したらここでデキュー
    // wp_dequeue_style( 'some-affinger-style' );
}, 100 );

/**
 * 下書きプレビューモード
 *
 * 管理者がログインした状態で URL に `?preview_drafts` を付けると、
 * 一覧ページ（ホーム / アーカイブ / カテゴリ / 検索）で下書き投稿も
 * 表示される。記事公開前にカードグリッドの見た目を確認する用途。
 *
 * 非ログインの読者には一切影響しない。
 */
add_action( 'pre_get_posts', function ( $query ) {
    if ( is_admin() || ! $query->is_main_query() ) {
        return;
    }
    if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) ) {
        return;
    }
    if ( ! isset( $_GET['preview_drafts'] ) ) {
        return;
    }
    if ( $query->is_home() || $query->is_archive() || $query->is_search() ) {
        $query->set( 'post_status', array( 'publish', 'draft', 'pending', 'future', 'private' ) );
    }
} );

/**
 * 管理バーに「下書きを含めて一覧プレビュー」ショートカットを追加
 */
add_action( 'admin_bar_menu', function ( $admin_bar ) {
    if ( is_admin() || ! current_user_can( 'edit_posts' ) ) {
        return;
    }
    $current_url = ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['HTTP_HOST'] . strtok( $_SERVER['REQUEST_URI'], '?' );
    $preview_url = add_query_arg( 'preview_drafts', '1', $current_url );
    $clean_url   = remove_query_arg( 'preview_drafts', ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] );

    if ( isset( $_GET['preview_drafts'] ) ) {
        $admin_bar->add_node( array(
            'id'    => 'affinger4-child-drafts-off',
            'title' => '下書き表示を解除',
            'href'  => esc_url( $clean_url ),
            'meta'  => array( 'title' => '通常の公開記事のみを表示' ),
        ) );
    } else {
        $admin_bar->add_node( array(
            'id'    => 'affinger4-child-drafts-on',
            'title' => '下書きも一覧に表示',
            'href'  => esc_url( $preview_url ),
            'meta'  => array( 'title' => 'カードグリッドのレイアウト確認用' ),
        ) );
    }
}, 200 );

/**
 * 下書きプレビュー中であることをフロントで可視化
 */
add_action( 'wp_head', function () {
    if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) || ! isset( $_GET['preview_drafts'] ) ) {
        return;
    }
    ?>
    <style>
      body::after {
        content: "📝 下書きプレビュー中（あなた以外には見えません）";
        position: fixed;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: #3D3029;
        color: #FFF8F0;
        font-family: "Noto Sans JP", sans-serif;
        font-size: 12px;
        font-weight: 700;
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999;
        pointer-events: none;
      }
    </style>
    <?php
}, 20 );
