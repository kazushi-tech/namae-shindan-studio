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
 * 主要 SEO プラグインが canonical を管理しているか判定する。
 *
 * canonical の二重出力を避けるため、既知プラグインの定数・クラス・
 * 有効化済みプラグイン名のいずれかが確認できた場合は子テーマから出力しない。
 * 未知の構成では `affinger4_child_front_page_canonical_managed` フィルタで
 * true を返すことで停止できる。
 *
 * @return bool
 */
function affinger4_child_front_page_canonical_is_managed() {
    $known_constants = array(
        'WPSEO_VERSION',
        'RANK_MATH_VERSION',
        'AIOSEO_VERSION',
        'SEOPRESS_VERSION',
    );

    foreach ( $known_constants as $constant ) {
        if ( defined( $constant ) ) {
            return true;
        }
    }

    $known_classes = array(
        'WPSEO_Frontend',
        'RankMath',
        'AIOSEO\\Plugin\\AIOSEO',
        'SEOPress\\Core\\Kernel',
    );

    foreach ( $known_classes as $class_name ) {
        if ( class_exists( $class_name ) ) {
            return true;
        }
    }

    $known_plugin_paths = array(
        'wordpress-seo/',
        'seo-by-rank-math/',
        'all-in-one-seo-pack/',
        'wp-seopress/',
    );
    $active_plugins     = (array) get_option( 'active_plugins', array() );

    if ( is_multisite() ) {
        $active_plugins = array_merge(
            $active_plugins,
            array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) )
        );
    }

    foreach ( $active_plugins as $plugin_path ) {
        foreach ( $known_plugin_paths as $known_path ) {
            if ( 0 === strpos( $plugin_path, $known_path ) ) {
                return true;
            }
        }
    }

    return (bool) apply_filters( 'affinger4_child_front_page_canonical_managed', false );
}

/**
 * 投稿一覧をフロントページにしている場合だけ自己 canonical を補完する。
 *
 * 固定ページをフロントにしている場合は WordPress コアの rel_canonical() が
 * 処理するため対象外。ページ送りにもトップ URL を canonical として付けない。
 */
add_action( 'wp_head', function () {
    if ( ! is_front_page() || is_singular() || is_paged() ) {
        return;
    }

    if ( affinger4_child_front_page_canonical_is_managed() ) {
        return;
    }

    echo '<link rel="canonical" href="' . esc_url( home_url( '/' ) ) . '">' . "\n";
}, 5 );

/**
 * 完全重複している旧スラッグを正規 URL へ恒久転送する。
 *
 * 管理画面、Ajax、プレビュー、GET/HEAD 以外には干渉しない。
 */
add_action( 'template_redirect', function () {
    if ( is_admin() || is_preview() ) {
        return;
    }

    if ( function_exists( 'wp_doing_ajax' ) && wp_doing_ajax() ) {
        return;
    }

    if ( isset( $_GET['preview'] ) || isset( $_GET['preview_id'] ) || isset( $_GET['preview_nonce'] ) ) {
        return;
    }

    $request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) : 'GET';
    if ( ! in_array( $request_method, array( 'GET', 'HEAD' ), true ) ) {
        return;
    }

    $request_uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
    $request_path = trim( (string) wp_parse_url( $request_uri, PHP_URL_PATH ), '/' );
    $home_path    = trim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );

    if ( $home_path && 0 === strpos( $request_path, $home_path . '/' ) ) {
        $request_path = substr( $request_path, strlen( $home_path ) + 1 );
    }

    if ( 'akachan-yobousesshu-schedule-2' !== $request_path ) {
        return;
    }

    wp_safe_redirect(
        home_url( '/akachan-yobousesshu-schedule/' ),
        301,
        'AFFINGER4 Child duplicate slug redirect'
    );
    exit;
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
 * 記事末尾に表示する、内容に応じた次の導線を返す。
 *
 * 投稿スラッグ別の個別導線をここへ追加できる。戻り値はすべてプレーンテキストと
 * URL に正規化し、テンプレート側でもエスケープして表示する。
 * `affinger4_child_article_contextual_cta` フィルタで投稿ごとの上書きも可能。
 *
 * @param int $post_id 投稿 ID
 * @return array<string, mixed>
 */
function affinger4_child_article_contextual_cta( $post_id ) {
    $post = get_post( $post_id );
    if ( ! $post || 'post' !== $post->post_type ) {
        return array();
    }

    $slug_specific_ctas = array(
        'shussan-nyuin-mochimono-list' => array(
            'eyebrow'     => '出産準備の次の一歩',
            'title'       => '入院・出産の持ち物を一覧で確認',
            'description' => '準備状況を確認しやすいチェックリストで、必要な持ち物をまとめて見直せます。',
            'links'       => array(
                array(
                    'url'              => 'https://namae-studio.com/guide/shussan-list',
                    'label'            => '出産準備チェックリストを見る',
                    'variant'          => 'primary',
                    'analytics_target' => 'guide_shussan_list',
                ),
            ),
        ),
    );

    $cta = isset( $slug_specific_ctas[ $post->post_name ] )
        ? $slug_specific_ctas[ $post->post_name ]
        : array(
            'eyebrow'     => '名付けを考えている方へ',
            'title'       => '赤ちゃんの名前を一歩ずつ考える',
            'description' => '苗字との画数を確かめたり、条件に合う名前候補を探したりできます。',
            'links'       => array(
                array(
                    'url'              => 'https://namae-studio.com/shindan',
                    'label'            => '姓名判断で画数を確認',
                    'variant'          => 'primary',
                    'analytics_target' => 'shindan',
                ),
                array(
                    'url'              => 'https://namae-studio.com/suggestion',
                    'label'            => '名前候補を探す',
                    'variant'          => 'outline',
                    'analytics_target' => 'suggestion',
                ),
            ),
        );

    $cta = apply_filters( 'affinger4_child_article_contextual_cta', $cta, $post_id );
    if ( ! is_array( $cta ) || empty( $cta['links'] ) || ! is_array( $cta['links'] ) ) {
        return array();
    }

    $links = array();
    foreach ( $cta['links'] as $link ) {
        if ( ! is_array( $link ) || empty( $link['url'] ) || empty( $link['label'] ) ) {
            continue;
        }

        $url = esc_url_raw( $link['url'] );
        if ( ! $url ) {
            continue;
        }

        $variant = isset( $link['variant'] ) && in_array( $link['variant'], array( 'primary', 'outline' ), true )
            ? $link['variant']
            : 'outline';

        $links[] = array(
            'url'              => $url,
            'label'            => sanitize_text_field( $link['label'] ),
            'variant'          => $variant,
            'analytics_target' => isset( $link['analytics_target'] ) ? sanitize_key( $link['analytics_target'] ) : 'related',
        );
    }

    if ( empty( $links ) ) {
        return array();
    }

    return array(
        'eyebrow'     => isset( $cta['eyebrow'] ) ? sanitize_text_field( $cta['eyebrow'] ) : '',
        'title'       => isset( $cta['title'] ) ? sanitize_text_field( $cta['title'] ) : '',
        'description' => isset( $cta['description'] ) ? sanitize_text_field( $cta['description'] ) : '',
        'links'       => $links,
    );
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
