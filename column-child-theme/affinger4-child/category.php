<?php
/**
 * Category archive template entry point.
 *
 * The parent AFFINGER4 theme provides category.php, which takes precedence over
 * this child theme's archive.php unless the child defines its own category.php.
 * Delegate to the shared child archive layout so category, tag, and date lists
 * keep the same discovery and article-card experience.
 *
 * @package AFFINGER4_Child
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require get_stylesheet_directory() . '/archive.php';
