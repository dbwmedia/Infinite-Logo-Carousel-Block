<?php
/**
 * Plugin Name: Logo Slider – Infinite Carousel & Marquee Block
 * Plugin URI: https://www.dennisbuchwald.de/apps/logo-slider
 * Description: A professional infinity logo carousel Gutenberg block with customizable speed, spacing, hover-stop and optional links. Perfect for showcasing partner, client or sponsor logos.
 * Version: 2.4.0
 * Requires at least: 6.6
 * Tested up to: 7.0
 * Requires PHP: 7.2
 * Author: Dennis Buchwald
 * Author URI: https://www.dennisbuchwald.de
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: infinite-logo-carousel-block
 * Domain Path: /languages
 * 
 * @package infinite-logo-carousel-block
 */

// Security: Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define plugin constants
define( 'ILCB_VERSION', '2.4.0' );
define( 'ILCB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ILCB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'ILCB_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

require_once ILCB_PLUGIN_DIR . 'includes/render.php';

/**
 * Load the plugin's bundled translations.
 *
 * WordPress auto-loads translations only from wp-content/languages/plugins
 * (the WordPress.org language packs). German language packs for this plugin
 * are not complete on translate.wordpress.org yet, so the bundled files in
 * /languages need an explicit load — this also makes the translated plugin
 * Name/Description on the Plugins screen work. Language packs, when present,
 * still take precedence over the bundled files.
 */
function ilcb_load_textdomain() {
    load_plugin_textdomain(
        'infinite-logo-carousel-block',
        false,
        dirname( ILCB_PLUGIN_BASENAME ) . '/languages'
    );
}
add_action( 'init', 'ilcb_load_textdomain' );

/**
 * Register the Gutenberg Block
 */
function ilcb_register_block() {
    // Check if Gutenberg is available
    if ( ! function_exists( 'register_block_type' ) ) {
        return;
    }

    // Register block scripts
    $script_asset_path = ILCB_PLUGIN_DIR . 'build/index.asset.php';
    $script_asset = file_exists( $script_asset_path )
        ? require( $script_asset_path )
        : array(
            'dependencies' => array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
            'version' => ILCB_VERSION,
        );

    wp_register_script(
        'ilcb-editor',
        ILCB_PLUGIN_URL . 'build/index.js',
        $script_asset['dependencies'],
        $script_asset['version'],
        false
    );

    // Register editor styles
    $editor_css = ILCB_PLUGIN_DIR . 'build/index.css';
    if ( file_exists( $editor_css ) ) {
        wp_register_style(
            'ilcb-editor-style',
            ILCB_PLUGIN_URL . 'build/index.css',
            array( 'wp-edit-blocks' ),
            filemtime( $editor_css )
        );
    }

    // Register frontend styles
    $style_css = ILCB_PLUGIN_DIR . 'build/style-index.css';
    if ( file_exists( $style_css ) ) {
        wp_register_style(
            'ilcb-style',
            ILCB_PLUGIN_URL . 'build/style-index.css',
            array(),
            filemtime( $style_css )
        );
    }
    
    // Front-end engine (built and minified from src/frontend.js). Deferred:
    // it never blocks rendering and initialises once the DOM is parsed.
    $frontend_asset_path = ILCB_PLUGIN_DIR . 'build/frontend.asset.php';
    if ( file_exists( $frontend_asset_path ) ) {
        $frontend_asset = require $frontend_asset_path;
        wp_register_script(
            'ilcb-frontend',
            ILCB_PLUGIN_URL . 'build/frontend.js',
            $frontend_asset['dependencies'],
            $frontend_asset['version'],
            array(
                'in_footer' => true,
                'strategy'  => 'defer',
            )
        );
    }

    // Register the Logo Slider block from its metadata. block.json holds the
    // attribute definitions and references the script/style handles
    // registered above.
    register_block_type( ILCB_PLUGIN_DIR . 'block.json' );

    // Register the Text Marquee block (v2.0). It shares the slider's scripts,
    // styles and frontend engine; the attribute definitions live in
    // src/marquee.js (static save, client-side registration).
    register_block_type( 'infinite-logo-carousel-block/marquee', array(
        'api_version'   => 3,
        'editor_script' => 'ilcb-editor',
        'editor_style'  => 'ilcb-editor-style',
        'style'         => 'ilcb-style',
        // view_script: the engine only runs on the front end, and only on
        // pages that actually contain the block.
        'view_script'   => 'ilcb-frontend',
    ) );

    // Set script translations
    wp_set_script_translations( 
        'ilcb-editor', 
        'infinite-logo-carousel-block',
        ILCB_PLUGIN_DIR . 'languages'
    );
}
add_action( 'init', 'ilcb_register_block' );

/**
 * Plugin action links
 */
function ilcb_plugin_links( $links ) {
    $plugin_links = array(
        '<a href="' . esc_url( 'https://wordpress.org/support/plugin/infinite-logo-carousel-block/' ) . '">' . 
            esc_html__( 'Support', 'infinite-logo-carousel-block' ) . '</a>',
        '<a href="' . esc_url( 'https://wordpress.org/plugins/infinite-logo-carousel-block/#description' ) . '">' . 
            esc_html__( 'Documentation', 'infinite-logo-carousel-block' ) . '</a>',
    );
    
    return array_merge( $links, $plugin_links );
}
add_filter( 'plugin_action_links_' . ILCB_PLUGIN_BASENAME, 'ilcb_plugin_links' );

