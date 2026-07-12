<?php
/**
 * Search and category discovery surface for column listing screens.
 *
 * Variants:
 * - full: blog home hero + large category cards.
 * - compact: search + category chips for archives and search results.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$variant = isset( $args['variant'] ) && 'compact' === $args['variant'] ? 'compact' : 'full';
$categories = get_categories(
    array(
        'hide_empty' => true,
        'orderby'    => 'count',
        'order'      => 'DESC',
    )
);

$current_category_id = is_category() ? get_queried_object_id() : absint( get_query_var( 'cat' ) );
$search_query        = get_search_query();
$has_search_query    = '' !== trim( $search_query );
$form_id             = 'full' === $variant ? 'column-search-full' : 'column-search-compact';
$search_label        = $current_category_id
    ? sprintf( '%sの記事から検索', get_cat_name( $current_category_id ) )
    : 'キーワードで記事を検索';
?>

<?php if ( 'full' === $variant ) : ?>
  <section class="column-discovery" aria-labelledby="column-discovery-title">
    <div class="column-discovery__intro">
      <p class="column-discovery__eyebrow">子育てコラム</p>
      <h1 class="column-discovery__title" id="column-discovery-title">知りたいことから、<br>記事を探せます</h1>
      <p class="column-discovery__lead">
        赤ちゃんのお世話や成長、名付け、ママ・パパの暮らし。今気になるテーマから読み進められます。
      </p>
    </div>

    <div class="column-discovery__search-card">
      <p class="column-discovery__search-kicker">キーワード検索</p>
      <form class="column-search-form" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
        <label class="column-search-form__label" for="<?php echo esc_attr( $form_id ); ?>">気になる言葉で記事を探す</label>
        <div class="column-search-form__controls">
          <span class="column-search-form__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>
          </span>
          <input
            class="column-search-form__input"
            id="<?php echo esc_attr( $form_id ); ?>"
            type="search"
            name="s"
            value="<?php echo esc_attr( $search_query ); ?>"
            placeholder="知りたいことを入力…"
            autocomplete="on"
            enterkeyhint="search"
          >
          <input type="hidden" name="post_type" value="post">
          <button class="column-search-form__button" type="submit">
            記事を検索 <span aria-hidden="true">→</span>
          </button>
        </div>
        <p class="column-search-form__hint">例：寝かしつけ、離乳食、保育園</p>
      </form>
    </div>
  </section>

  <?php if ( ! empty( $categories ) ) : ?>
    <section class="category-explorer" id="column-categories" aria-labelledby="category-explorer-title">
      <div class="column-section-heading">
        <div>
          <p class="column-section-heading__eyebrow">Category</p>
          <h2 class="column-section-heading__title" id="category-explorer-title">悩み・テーマから探す</h2>
        </div>
        <p class="column-section-heading__description">いまの関心に近いカテゴリを選ぶと、関連記事だけをまとめて見られます。</p>
      </div>

      <div class="category-grid">
        <?php foreach ( $categories as $category_index => $category ) : ?>
          <?php
          $category_url = get_category_link( $category->term_id );
          if ( is_wp_error( $category_url ) ) {
              continue;
          }
          $description = wp_strip_all_tags( category_description( $category->term_id ) );
          if ( '' === trim( $description ) ) {
              $description = 'このテーマの記事をまとめて読めます。';
          }
          ?>
          <a
            class="category-card"
            href="<?php echo esc_url( $category_url ); ?>"
            aria-label="<?php echo esc_attr( sprintf( '%1$sの記事%2$s件を見る', $category->name, number_format_i18n( $category->count ) ) ); ?>"
          >
            <span class="category-card__index" aria-hidden="true"><?php echo esc_html( sprintf( '%02d', $category_index + 1 ) ); ?></span>
            <div class="category-card__heading">
              <h3 class="category-card__title"><?php echo esc_html( $category->name ); ?></h3>
              <span class="category-card__count"><?php echo esc_html( number_format_i18n( $category->count ) ); ?> 件</span>
            </div>
            <p class="category-card__description"><?php echo esc_html( wp_html_excerpt( $description, 64, '…' ) ); ?></p>
            <span class="category-card__action">このテーマの記事を見る <span aria-hidden="true">→</span></span>
          </a>
        <?php endforeach; ?>
      </div>
    </section>
  <?php endif; ?>

<?php else : ?>
  <section class="listing-tools" aria-labelledby="listing-tools-title">
    <div class="listing-tools__header">
      <div>
        <p class="listing-tools__eyebrow">Find articles</p>
        <h2 class="listing-tools__title" id="listing-tools-title">記事を絞り込む</h2>
      </div>
      <?php if ( is_search() || is_category() ) : ?>
        <a class="listing-tools__clear" href="<?php echo esc_url( home_url( '/#latest-articles' ) ); ?>">条件をクリア</a>
      <?php endif; ?>
    </div>

    <form class="column-search-form column-search-form--compact" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
      <label class="screen-reader-text" for="<?php echo esc_attr( $form_id ); ?>"><?php echo esc_html( $search_label ); ?></label>
      <div class="column-search-form__controls">
        <span class="column-search-form__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>
        </span>
        <input
          class="column-search-form__input"
          id="<?php echo esc_attr( $form_id ); ?>"
          type="search"
          name="s"
          value="<?php echo esc_attr( $search_query ); ?>"
          placeholder="キーワードで記事を検索…"
          autocomplete="on"
          enterkeyhint="search"
        >
        <input type="hidden" name="post_type" value="post">
        <?php if ( $current_category_id ) : ?>
          <input type="hidden" name="cat" value="<?php echo esc_attr( $current_category_id ); ?>">
        <?php endif; ?>
        <button class="column-search-form__button" type="submit">検索する</button>
      </div>
    </form>

    <?php if ( ! empty( $categories ) ) : ?>
      <nav class="listing-tools__categories" aria-label="カテゴリを選ぶ">
        <span class="listing-tools__categories-label">カテゴリ</span>
        <div class="listing-tools__chips">
          <?php
          $all_articles_url = $has_search_query
              ? add_query_arg(
                  array(
                      's'         => $search_query,
                      'post_type' => 'post',
                  ),
                  home_url( '/' )
              )
              : home_url( '/#latest-articles' );
          ?>
          <?php $all_is_current = is_search() && ! $current_category_id; ?>
          <a
            class="listing-tools__chip<?php echo $all_is_current ? ' is-current' : ''; ?>"
            href="<?php echo esc_url( $all_articles_url ); ?>"
            <?php echo $all_is_current ? 'aria-current="page"' : ''; ?>
          >すべて</a>
          <?php foreach ( $categories as $category ) : ?>
            <?php
            $category_url = get_category_link( $category->term_id );
            if ( is_wp_error( $category_url ) ) {
                continue;
            }
            if ( $has_search_query ) {
                $category_url = add_query_arg(
                    array(
                        's'         => $search_query,
                        'post_type' => 'post',
                        'cat'       => $category->term_id,
                    ),
                    home_url( '/' )
                );
            }
            $is_current = (int) $category->term_id === (int) $current_category_id;
            ?>
            <a
              class="listing-tools__chip<?php echo $is_current ? ' is-current' : ''; ?>"
              href="<?php echo esc_url( $category_url ); ?>"
              <?php echo $is_current && is_category() ? 'aria-current="page"' : ''; ?>
            >
              <?php echo esc_html( $category->name ); ?>
              <span class="listing-tools__chip-count">全 <?php echo esc_html( number_format_i18n( $category->count ) ); ?></span>
              <?php if ( $is_current && ! is_category() ) : ?>
                <span class="screen-reader-text">（選択中）</span>
              <?php endif; ?>
            </a>
          <?php endforeach; ?>
        </div>
      </nav>
    <?php endif; ?>
  </section>
<?php endif; ?>
