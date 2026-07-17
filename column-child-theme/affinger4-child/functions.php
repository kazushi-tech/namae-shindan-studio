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
 * 主要 SEO プラグインが有効か判定する。
 *
 * 既知プラグインの定数・クラス・有効化済みプラグイン名の
 * いずれかが確認できた場合は、子テーマ側のSEO補完を停止する。
 *
 * @return bool
 */
function affinger4_child_known_seo_plugin_is_active() {
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

    return false;
}

/**
 * 外部実装が canonical を管理しているか判定する。
 *
 * @return bool
 */
function affinger4_child_front_page_canonical_is_managed() {
    return affinger4_child_known_seo_plugin_is_active()
        || (bool) apply_filters( 'affinger4_child_front_page_canonical_managed', false );
}

/**
 * 外部実装が meta description を管理しているか判定する。
 *
 * 未知のSEOプラグインや独自実装を導入した場合は、
 * `affinger4_child_meta_description_managed` で true を返すことで停止できる。
 *
 * @return bool
 */
function affinger4_child_meta_description_is_managed() {
    return affinger4_child_known_seo_plugin_is_active()
        || (bool) apply_filters( 'affinger4_child_meta_description_managed', false );
}

/**
 * 外部実装が構造化データを管理しているか判定する。
 *
 * @return bool
 */
function affinger4_child_structured_data_is_managed() {
    return affinger4_child_known_seo_plugin_is_active()
        || (bool) apply_filters( 'affinger4_child_structured_data_managed', false );
}

/**
 * AFFINGER4 のカテゴリ固有タイトル設定を PHP 8 系でも安全な形へ正規化する。
 *
 * 親テーマ st-title.php は未設定カテゴリで get_option() が false を返した場合も
 * `['st_cattitle']` を直接参照する。該当カテゴリの option/default_option フィルター
 * だけを補い、親テーマ本体やデータベースは書き換えない。
 *
 * @param mixed $value カテゴリ設定値
 * @return array<string, mixed>
 */
function affinger4_child_normalize_category_title_option( $value ) {
    if ( ! is_array( $value ) ) {
        $value = array();
    }

    if ( ! array_key_exists( 'st_cattitle', $value ) ) {
        $value['st_cattitle'] = '';
    }

    return $value;
}

/**
 * カテゴリアーカイブを独立した検索流入ページとして扱えるか判定する。
 *
 * 記事が3件未満の薄いカテゴリは noindex とし、記事が増えれば自動で index 対象へ戻す。
 *
 * @param WP_Term|null $term カテゴリ
 * @return bool
 */
function affinger4_child_category_is_indexable( $term = null ) {
    if ( null === $term ) {
        $term = get_queried_object();
    }

    return $term instanceof WP_Term
        && 'category' === $term->taxonomy
        && (int) $term->count >= 3;
}

add_action( 'wp', function () {
    if ( ! is_category() ) {
        return;
    }

    $category_id = (int) get_queried_object_id();
    if ( $category_id <= 0 ) {
        return;
    }

    $option_name = 'cat_' . $category_id;
    add_filter( 'option_' . $option_name, 'affinger4_child_normalize_category_title_option', 99 );
    add_filter( 'default_option_' . $option_name, 'affinger4_child_normalize_category_title_option', 99 );
}, 1 );

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
 * 記事があるカテゴリの先頭ページへ自己 canonical を補完する。
 *
 * 記事が3件未満のカテゴリと2ページ目以降は noindex 対象のため canonical を出さない。
 */
add_action( 'wp_head', function () {
    if ( ! is_category() || is_paged() || affinger4_child_front_page_canonical_is_managed() ) {
        return;
    }

    global $wp_query;
    if ( ! $wp_query || (int) $wp_query->post_count <= 0 ) {
        return;
    }

    $term = get_queried_object();
    if ( ! $term instanceof WP_Term ) {
        return;
    }

    if ( ! affinger4_child_category_is_indexable( $term ) ) {
        return;
    }

    $canonical = get_term_link( $term );
    if ( is_wp_error( $canonical ) ) {
        return;
    }

    echo '<link rel="canonical" href="' . esc_url( $canonical ) . '">' . "\n";
}, 5 );

/**
 * SEO プラグイン未導入時だけ、検索結果向けの meta description を補完する。
 *
 * 投稿は抜粋を優先し、未設定なら本文冒頭を利用する。ページ送りには
 * description を出さず、同じ説明文が複数ページへ広がるのを避ける。
 */
add_action( 'wp_head', function () {
    if ( is_admin() || is_feed() || is_paged() || affinger4_child_meta_description_is_managed() ) {
        return;
    }

    $description = '';

    if ( is_singular( 'post' ) ) {
        $post = get_queried_object();

        if ( $post instanceof WP_Post ) {
            $description = get_the_excerpt( $post );

            if ( ! $description ) {
                $description = strip_shortcodes( $post->post_content );
            }
        }
    } elseif ( is_front_page() ) {
        $description = '赤ちゃんの名付け・姓名判断を中心に、妊娠・出産準備、育児、子どもの成長やママの暮らしに役立つ情報を、根拠とともにわかりやすく届けるコラムです。';
    } elseif ( is_category() || is_tag() || is_tax() ) {
        $description = term_description();
    }

    $description = html_entity_decode(
        wp_strip_all_tags( (string) $description, true ),
        ENT_QUOTES,
        get_bloginfo( 'charset' )
    );
    $description = preg_replace( '/\s+/u', ' ', trim( $description ) );

    if ( ! $description ) {
        return;
    }

    $description = wp_html_excerpt( $description, 120, '…' );
    echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
}, 6 );

/**
 * SEO プラグイン未導入時に WebSite / BlogPosting 構造化データを補完する。
 */
add_action( 'wp_head', function () {
    if ( affinger4_child_structured_data_is_managed() ) {
        return;
    }

    $schema = array();

    if ( is_front_page() && ! is_paged() ) {
        $schema = array(
            '@context'    => 'https://schema.org',
            '@type'       => 'WebSite',
            '@id'         => home_url( '/#website' ),
            'url'         => home_url( '/' ),
            'name'        => get_bloginfo( 'name', 'display' ),
            'description' => '赤ちゃんの名付け・姓名判断を中心に、妊娠・出産準備、育児、子どもの成長やママの暮らしに役立つ情報を届けるコラムです。',
            'inLanguage'  => str_replace( '_', '-', get_locale() ),
        );
    } elseif ( is_singular( 'post' ) ) {
        $post = get_queried_object();
        if ( ! $post instanceof WP_Post ) {
            return;
        }

        $description = get_the_excerpt( $post );
        if ( ! $description ) {
            $description = strip_shortcodes( $post->post_content );
        }
        $description = preg_replace(
            '/\s+/u',
            ' ',
            trim( wp_strip_all_tags( html_entity_decode( (string) $description, ENT_QUOTES, get_bloginfo( 'charset' ) ), true ) )
        );

        $schema = array(
            '@context'         => 'https://schema.org',
            '@type'            => 'BlogPosting',
            '@id'              => get_permalink( $post ) . '#article',
            'mainEntityOfPage' => array(
                '@type' => 'WebPage',
                '@id'   => get_permalink( $post ),
            ),
            'isPartOf'          => array(
                '@id' => home_url( '/#website' ),
            ),
            'headline'          => wp_html_excerpt( wp_strip_all_tags( get_the_title( $post ), true ), 110, '…' ),
            'description'       => wp_html_excerpt( $description, 180, '…' ),
            'datePublished'     => get_post_time( DATE_W3C, true, $post ),
            'dateModified'      => gmdate( DATE_W3C, affinger4_child_post_lastmod_timestamp( $post ) ),
            'author'            => array(
                '@type' => 'Person',
                'name'  => get_the_author_meta( 'display_name', $post->post_author ),
            ),
            'publisher'         => array(
                '@type' => 'Organization',
                'name'  => get_bloginfo( 'name', 'display' ),
                'url'   => home_url( '/' ),
            ),
            'inLanguage'        => str_replace( '_', '-', get_locale() ),
        );

        $image_url = get_the_post_thumbnail_url( $post, 'full' );
        if ( $image_url ) {
            $schema['image'] = array( esc_url_raw( $image_url ) );
        }

        $sections = wp_get_post_categories( $post->ID, array( 'fields' => 'names' ) );
        if ( ! empty( $sections ) && ! is_wp_error( $sections ) ) {
            $schema['articleSection'] = array_values( array_map( 'sanitize_text_field', $sections ) );
        }
    }

    if ( empty( $schema ) ) {
        return;
    }

    echo '<script type="application/ld+json" id="affinger4-child-structured-data">';
    echo wp_json_encode(
        $schema,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
    echo '</script>' . "\n";
}, 7 );

/**
 * 薄い一覧を検索インデックスへ含めず、記事リンクの巡回は許可する。
 *
 * 対象: 2ページ目以降、タグ、著者、日付、検索結果、記事が3件未満のカテゴリ。
 */
add_filter( 'wp_robots', function ( $robots ) {
    $is_paged_listing = is_paged() && ( is_home() || is_archive() );
    $is_thin_category = is_category() && ! affinger4_child_category_is_indexable();
    $should_noindex = $is_paged_listing
        || $is_thin_category
        || is_tag()
        || is_author()
        || is_date()
        || is_search();

    if ( ! $should_noindex ) {
        return $robots;
    }

    unset( $robots['index'], $robots['nofollow'] );
    $robots['noindex'] = true;
    $robots['follow']  = true;

    return $robots;
}, 99 );

/**
 * XMLサイトマップへ掲載するカテゴリも index 対象（3記事以上）だけに絞る。
 *
 * @param int[] $term_ids 除外するターム ID
 * @return int[]
 */
add_filter( 'sm_exclude_from_sitemap_by_term_ids', function ( $term_ids ) {
    $term_ids   = array_map( 'intval', (array) $term_ids );
    $categories = get_categories( array( 'hide_empty' => false ) );

    foreach ( $categories as $category ) {
        if ( ! affinger4_child_category_is_indexable( $category ) ) {
            $term_ids[] = (int) $category->term_id;
        }
    }

    return array_values( array_unique( $term_ids ) );
} );

/**
 * robots_txt フィルター内の Sitemap 宣言は検索エンジン向け XML だけに絞る。
 *
 * do_robots アクションから後置される行には届かないため、Google XML
 * Sitemaps 側でも「HTML 形式のサイトマップを含める」を無効にする。
 */
add_filter( 'robots_txt', function ( $output ) {
    $output = preg_replace(
        '#^\s*Sitemap:\s*https?://[^\r\n]+/sitemap\.html\s*$#mi',
        '',
        (string) $output
    );
    $output = preg_replace( "/\n{3,}/", "\n\n", $output );

    return rtrim( $output ) . "\n";
}, 999 );

/**
 * 公開日時と更新日時のうち、検索エンジンへ伝えるべき新しい方を返す。
 *
 * 予約投稿は記事の保存・更新日時より公開日時が後になるため、更新日時だけを使う
 * サイトマップ実装では公開直後から古い lastmod が出る。その差を子テーマ側で補う。
 *
 * @param int|WP_Post $post 投稿
 * @return int Unix timestamp
 */
function affinger4_child_post_lastmod_timestamp( $post ) {
    $post = get_post( $post );
    if ( ! $post instanceof WP_Post ) {
        return 0;
    }

    $published_gmt = '0000-00-00 00:00:00' !== $post->post_date_gmt
        ? $post->post_date_gmt
        : get_gmt_from_date( $post->post_date );
    $modified_gmt  = '0000-00-00 00:00:00' !== $post->post_modified_gmt
        ? $post->post_modified_gmt
        : get_gmt_from_date( $post->post_modified );

    $published = strtotime( $published_gmt . ' UTC' );
    $modified  = strtotime( $modified_gmt . ' UTC' );

    return max( (int) $published, (int) $modified );
}

/**
 * カテゴリ内の公開済み記事だけから、最新の公開・更新日時を返す。
 *
 * Google XML Sitemaps は予約投稿をカテゴリの lastmod 計算へ含めるため、
 * 未来日の lastmod が出ないよう子テーマ側で公開済み記事に限定する。
 *
 * @param int $category_id カテゴリ ID
 * @return int Unix timestamp
 */
function affinger4_child_category_lastmod_timestamp( $category_id ) {
    $query_base = array(
        'post_type'           => 'post',
        'post_status'         => 'publish',
        'category__in'        => array( (int) $category_id ),
        'posts_per_page'      => 1,
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
    );

    $latest_by_date = get_posts(
        array_merge(
            $query_base,
            array(
                'orderby' => 'date',
                'order'   => 'DESC',
            )
        )
    );
    $latest_by_modified = get_posts(
        array_merge(
            $query_base,
            array(
                'orderby' => 'modified',
                'order'   => 'DESC',
            )
        )
    );

    $lastmod = 0;
    foreach ( array_merge( $latest_by_date, $latest_by_modified ) as $post ) {
        $lastmod = max( $lastmod, affinger4_child_post_lastmod_timestamp( $post ) );
    }

    return $lastmod;
}

/**
 * Google XML Sitemaps の各投稿 URL に正しい lastmod を設定する。
 *
 * プラグイン本体を改変せず、公開 API の sm_addurl アクションを利用する。
 *
 * @param object $page GoogleSitemapGeneratorPage
 */
add_action( 'sm_addurl', function ( $page ) {
    if (
        ! is_object( $page )
        || ! method_exists( $page, 'get_post_id' )
        || ! method_exists( $page, 'get_last_mod' )
        || ! method_exists( $page, 'set_last_mod' )
    ) {
        return;
    }

    $post_id = (int) $page->get_post_id();
    if ( $post_id > 0 ) {
        $lastmod = affinger4_child_post_lastmod_timestamp( $post_id );
        if ( $lastmod > (int) $page->get_last_mod() ) {
            $page->set_last_mod( $lastmod );
        }

        return;
    }

    if ( ! method_exists( $page, 'get_url' ) ) {
        return;
    }

    $page_url   = untrailingslashit( (string) $page->get_url() );
    $categories = get_categories( array( 'hide_empty' => false ) );

    foreach ( $categories as $category ) {
        if ( ! affinger4_child_category_is_indexable( $category ) ) {
            continue;
        }

        $category_url = get_category_link( $category->term_id );
        if ( is_wp_error( $category_url ) || untrailingslashit( $category_url ) !== $page_url ) {
            continue;
        }

        $lastmod = affinger4_child_category_lastmod_timestamp( $category->term_id );
        if ( $lastmod > 0 ) {
            $page->set_last_mod( $lastmod );
        }

        break;
    }
}, 10, 1 );

/**
 * 投稿サイトマップを含む索引にも、最新の公開・更新日時を反映する。
 *
 * @param object $sitemap GoogleSitemapGeneratorSitemapEntry
 */
add_action( 'sm_addsitemap', function ( $sitemap ) {
    if (
        ! is_object( $sitemap )
        || ! method_exists( $sitemap, 'get_url' )
        || ! method_exists( $sitemap, 'get_last_mod' )
        || ! method_exists( $sitemap, 'set_last_mod' )
    ) {
        return;
    }

    $url = (string) $sitemap->get_url();
    if ( false === strpos( $url, 'post-sitemap' ) ) {
        return;
    }

    $latest_by_date = get_posts(
        array(
            'post_type'           => 'post',
            'post_status'         => 'publish',
            'posts_per_page'      => 1,
            'orderby'             => 'date',
            'order'               => 'DESC',
            'ignore_sticky_posts' => true,
            'no_found_rows'       => true,
        )
    );
    $latest_by_modified = get_posts(
        array(
            'post_type'           => 'post',
            'post_status'         => 'publish',
            'posts_per_page'      => 1,
            'orderby'             => 'modified',
            'order'               => 'DESC',
            'ignore_sticky_posts' => true,
            'no_found_rows'       => true,
        )
    );

    $lastmod = 0;
    foreach ( array_merge( $latest_by_date, $latest_by_modified ) as $post ) {
        $lastmod = max( $lastmod, affinger4_child_post_lastmod_timestamp( $post ) );
    }

    if ( $lastmod > (int) $sitemap->get_last_mod() ) {
        $sitemap->set_last_mod( $lastmod );
    }
}, 10, 1 );

/**
 * 旧スラッグと不要なサイトマップ面を正規 URL へ恒久転送する。
 *
 * XML サイトマッププラグインが parse_request より後でレスポンスを確定する前に
 * /wp-sitemap.xml を捕捉するため、init の最優先で実行する。
 * 管理画面、Ajax、プレビュー、GET/HEAD 以外には干渉しない。
 */
add_action( 'init', function () {
    if ( is_admin() ) {
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

    $redirects = array(
        'akachan-yobousesshu-schedule-2'         => '/akachan-yobousesshu-schedule/',
        'kodomo-teashikuchibyo-shojo-taisho-2'  => '/kodomo-jikokouteikan-sodatekata/',
        'sitemap.html'                           => '/sitemap.xml',
        'wp-sitemap.xml'                         => '/sitemap.xml',
    );

    if ( ! isset( $redirects[ $request_path ] ) ) {
        return;
    }

    wp_safe_redirect(
        home_url( $redirects[ $request_path ] ),
        301,
        'AFFINGER4 Child canonical redirect'
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
 * カスタムパンくずの表示項目を返す。
 *
 * @return array<int, array{name: string, url: string}>
 */
function affinger4_child_breadcrumb_items() {
    $items = array(
        array(
            'name' => 'ホーム',
            'url'  => home_url( '/' ),
        ),
    );

    if ( is_singular( 'post' ) ) {
        $categories = get_the_category();
        if ( ! empty( $categories ) ) {
            $cat = $categories[0];
            $items[] = array(
                'name' => $cat->name,
                'url'  => get_category_link( $cat->term_id ),
            );
        }
        $items[] = array(
            'name' => get_the_title(),
            'url'  => get_permalink(),
        );
    } elseif ( is_category() ) {
        $items[] = array(
            'name' => single_cat_title( '', false ),
            'url'  => get_category_link( get_queried_object_id() ),
        );
    } elseif ( is_tag() ) {
        $items[] = array(
            'name' => single_tag_title( '', false ),
            'url'  => get_tag_link( get_queried_object_id() ),
        );
    } elseif ( is_search() ) {
        $items[] = array(
            'name' => '検索結果',
            'url'  => get_search_link(),
        );
    } elseif ( is_page() ) {
        $items[] = array(
            'name' => get_the_title(),
            'url'  => get_permalink(),
        );
    } elseif ( is_archive() ) {
        $items[] = array(
            'name' => wp_strip_all_tags( get_the_archive_title(), true ),
            'url'  => get_pagenum_link(),
        );
    }

    return $items;
}

/**
 * カスタムパンくず出力ヘルパ
 *
 * 親テーマの breadcrumb が不揃いなので、子テーマ側で BEM 化した版を使う。
 * 全項目を BreadcrumbList/ListItem として構造化する。
 */
function affinger4_child_breadcrumb() {
    $items = affinger4_child_breadcrumb_items();
    if ( empty( $items ) ) {
        return;
    }

    echo '<nav class="breadcrumb" aria-label="パンくずリスト"><ol class="breadcrumb__list" itemscope itemtype="https://schema.org/BreadcrumbList">';

    $last_position = count( $items );
    foreach ( $items as $index => $item ) {
        $position = $index + 1;
        $is_last  = $position === $last_position;

        echo '<li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        if ( $position > 1 ) {
            echo '<span class="breadcrumb__sep" aria-hidden="true">›</span>';
        }

        if ( ! $is_last || 1 === $last_position ) {
            echo '<a class="breadcrumb__link" href="' . esc_url( $item['url'] ) . '" itemprop="item">';
            echo '<span itemprop="name">' . esc_html( $item['name'] ) . '</span></a>';
        } else {
            echo '<span class="breadcrumb__current" aria-current="page" itemprop="name">' . esc_html( $item['name'] ) . '</span>';
            echo '<meta itemprop="item" content="' . esc_url( $item['url'] ) . '" />';
        }

        echo '<meta itemprop="position" content="' . esc_attr( $position ) . '" /></li>';
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
 * 関連記事（同カテゴリの前後記事）を取得
 *
 * 1記事だけのカテゴリでは、同じタグを持つ公開記事で補完し、
 * 小カテゴリの記事が関連記事・内部リンクとも0件になるのを防ぐ。
 *
 * @param int $post_id 現在の投稿 ID
 * @param int $count   取得件数
 * @return WP_Post[]
 */
function affinger4_child_related_posts( $post_id, $count = 3 ) {
    $post_id = (int) $post_id;
    $count   = max( 1, (int) $count );

    $categories = wp_get_post_categories( $post_id );
    if ( empty( $categories ) ) {
        return array();
    }

    $category_post_ids = get_posts(
        array(
            'category__in'        => $categories,
            'post_status'         => 'publish',
            'posts_per_page'      => -1,
            'fields'              => 'ids',
            'orderby'             => 'date',
            'order'               => 'DESC',
            'ignore_sticky_posts' => true,
            'no_found_rows'       => true,
        )
    );

    $category_post_ids = array_values( array_unique( array_map( 'intval', $category_post_ids ) ) );
    $total             = count( $category_post_ids );
    $current_index     = array_search( $post_id, $category_post_ids, true );

    $selected_ids = array();
    if ( $total > 1 && false !== $current_index ) {
        for ( $distance = 1; $distance < $total && count( $selected_ids ) < $count; $distance++ ) {
            foreach ( array( 1, -1 ) as $direction ) {
                $candidate_index = ( $current_index + ( $distance * $direction ) + $total ) % $total;
                $candidate_id    = $category_post_ids[ $candidate_index ];

                if ( $candidate_id !== $post_id && ! in_array( $candidate_id, $selected_ids, true ) ) {
                    $selected_ids[] = $candidate_id;
                }

                if ( count( $selected_ids ) >= $count ) {
                    break;
                }
            }
        }
    }

    if ( empty( $selected_ids ) ) {
        $tag_ids = wp_get_post_tags( $post_id, array( 'fields' => 'ids' ) );
        if ( ! empty( $tag_ids ) && ! is_wp_error( $tag_ids ) ) {
            $selected_ids = get_posts(
                array(
                    'post_type'           => 'post',
                    'post_status'         => 'publish',
                    'post__not_in'        => array( $post_id ),
                    'tag__in'             => array_map( 'intval', $tag_ids ),
                    'posts_per_page'      => $count,
                    'fields'              => 'ids',
                    'orderby'             => 'date',
                    'order'               => 'DESC',
                    'ignore_sticky_posts' => true,
                    'no_found_rows'       => true,
                )
            );
            $selected_ids = array_values( array_unique( array_map( 'intval', $selected_ids ) ) );
        }
    }

    if ( empty( $selected_ids ) ) {
        return array();
    }

    return get_posts(
        array(
            'post_type'           => 'post',
            'post_status'         => 'publish',
            'post__in'            => $selected_ids,
            'posts_per_page'      => count( $selected_ids ),
            'orderby'             => 'post__in',
            'ignore_sticky_posts' => true,
            'no_found_rows'       => true,
        )
    );
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
