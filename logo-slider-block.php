<?php
/**
 * Plugin Name: Logo Slider – Infinite Carousel & Marquee Block
 * Plugin URI: https://www.dennisbuchwald.de/apps/logo-slider
 * Description: A professional infinity logo carousel Gutenberg block with customizable speed, spacing, hover-stop and optional links. Perfect for showcasing partner, client or sponsor logos.
 * Version: 1.8.0
 * Requires at least: 5.8
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
define( 'ILCB_VERSION', '1.8.0' );
define( 'ILCB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ILCB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'ILCB_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

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
    
    // Register frontend script for perfect infinity loop
    $frontend_script = ILCB_PLUGIN_DIR . 'src/frontend.js';
    if ( file_exists( $frontend_script ) ) {
        wp_register_script(
            'ilcb-frontend',
            ILCB_PLUGIN_URL . 'src/frontend.js',
            array(),
            filemtime( $frontend_script ),
            true
        );
    }

    // Register the block
    register_block_type( 'infinite-logo-carousel-block/carousel', array(
        'editor_script' => 'ilcb-editor',
        'editor_style'  => 'ilcb-editor-style',
        'style'         => 'ilcb-style',
        'script'        => 'ilcb-frontend',
        // Kept in sync with BLOCK_ATTRIBUTES in src/index.js.
        'attributes' => array(
            'images'                   => array( 'type' => 'array',   'default' => array() ),
            'speed'                    => array( 'type' => 'string',  'default' => 'medium' ),
            'speedCustom'              => array( 'type' => 'number',  'default' => 60 ),
            'gap'                      => array( 'type' => 'string',  'default' => 'medium' ),
            'gapCustom'                => array( 'type' => 'number',  'default' => 40 ),
            'marginSize'               => array( 'type' => 'string',  'default' => 'medium' ),
            'logoHeight'               => array( 'type' => 'string',  'default' => '50' ),
            'logoHeightMobile'         => array( 'type' => 'string',  'default' => '' ),
            'balanceLogos'             => array( 'type' => 'boolean', 'default' => false ),
            'overlayEnabled'           => array( 'type' => 'boolean', 'default' => true ),
            'overlayColor'             => array( 'type' => 'string',  'default' => '#ffffff' ),
            'blackLogos'               => array( 'type' => 'boolean', 'default' => false ),
            'logoColorMode'            => array( 'type' => 'string',  'default' => 'original' ),
            'logoCustomColor'          => array( 'type' => 'string',  'default' => '#999999' ),
            'linkTarget'               => array( 'type' => 'string',  'default' => '_self' ),
            'linkRel'                  => array( 'type' => 'string',  'default' => '' ),
            'linkTitle'                => array( 'type' => 'string',  'default' => '' ),
            'layout'                   => array( 'type' => 'string',  'default' => 'single' ),
            'rowCount'                 => array( 'type' => 'number',  'default' => 3 ),
            'rowSpeedMode'             => array( 'type' => 'string',  'default' => 'uniform' ),
            'rowGap'                   => array( 'type' => 'string',  'default' => 'medium' ),
            'rowGapCustom'             => array( 'type' => 'number',  'default' => 24 ),
            'capsuleEnabled'           => array( 'type' => 'boolean', 'default' => false ),
            'capsuleStyle'             => array( 'type' => 'string',  'default' => 'alternating' ),
            'capsuleRadius'            => array( 'type' => 'string',  'default' => 'pill' ),
            'capsuleRadiusCustom'      => array( 'type' => 'number',  'default' => 16 ),
            'capsulePadding'           => array( 'type' => 'string',  'default' => 'medium' ),
            'capsulePaddingCustom'     => array( 'type' => 'number',  'default' => 12 ),
            'capsuleColorA'            => array( 'type' => 'string',  'default' => '#000000' ),
            'capsuleColorB'            => array( 'type' => 'string',  'default' => '#ffffff' ),
            'capsuleBorderWidth'       => array( 'type' => 'string',  'default' => 'medium' ),
            'capsuleBorderWidthCustom' => array( 'type' => 'number',  'default' => 2 ),
            'capsuleLogoColor'         => array( 'type' => 'string',  'default' => 'original' ),
            'capsuleGlow'              => array( 'type' => 'boolean', 'default' => false ),
            'capsuleGlowSize'          => array( 'type' => 'string',  'default' => 'medium' ),
            'capsuleGlowSizeCustom'    => array( 'type' => 'number',  'default' => 12 ),
        ),
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

/**
 * Admin notice for Gutenberg requirement
 */
function ilcb_admin_notice() {
    if ( ! function_exists( 'register_block_type' ) ) {
        ?>
        <div class="notice notice-error">
            <p><?php 
                echo wp_kses_post( sprintf(
                    /* translators: %s: WordPress version */
                    __( 'The <strong>Infinite Logo Carousel Block</strong> plugin requires WordPress 5.8 or higher. You are using WordPress %s.', 'infinite-logo-carousel-block' ),
                    esc_html( get_bloginfo( 'version' ) )
                ));
            ?></p>
        </div>
        <?php
    }
}
add_action( 'admin_notices', 'ilcb_admin_notice' );

/**
 * Activation hook
 */
function ilcb_activate() {
    if ( version_compare( get_bloginfo( 'version' ), '5.8', '<' ) ) {
        deactivate_plugins( ILCB_PLUGIN_BASENAME );
        wp_die( 
            esc_html__( 'This plugin requires WordPress 5.8 or higher.', 'infinite-logo-carousel-block' ),
            esc_html__( 'Plugin activation failed', 'infinite-logo-carousel-block' ),
            array( 'back_link' => true )
        );
    }
}
register_activation_hook( __FILE__, 'ilcb_activate' );

/**
 * Deactivation hook
 */
function ilcb_deactivate() {
    // Cleanup if needed
}
register_deactivation_hook( __FILE__, 'ilcb_deactivate' );

/**
 * Fix lazy-loaded images in saved carousel content.
 *
 * Older versions saved images with loading="lazy", which delays image loading
 * and causes the carousel to flash at the wrong speed on initial page load.
 * This filter replaces loading="lazy" with loading="eager" in the rendered
 * block output so existing posts work correctly without being re-saved.
 */
function ilcb_fix_image_loading( $block_content, $block ) {
    if ( 'infinite-logo-carousel-block/carousel' !== $block['blockName'] ) {
        return $block_content;
    }

    return str_replace( 'loading="lazy"', 'loading="eager"', $block_content );
}
add_filter( 'render_block', 'ilcb_fix_image_loading', 10, 2 );

/**
 * Add inline styles for initial rendering
 */
function ilcb_add_inline_styles() {
    if ( has_block( 'infinite-logo-carousel-block/carousel' ) ) {
        echo '<style>
            .dbw-partner-slider { min-height: 70px; }
            .dbw-slider-wrapper { min-height: 70px; }
            .dbw-slider-item { min-height: 50px; }
            .dbw-slider-item img { 
                display: block !important; 
                opacity: 1 !important;
                min-height: var(--logo-height, 50px);
            }
        </style>';

        // Keep the carousel visible when JavaScript is disabled. With JS the
        // reveal is handled by the frontend script (adds the .dbw-ready class).
        echo '<noscript><style>.dbw-partner-slider{opacity:1 !important;animation:none !important;}</style></noscript>';
    }
}
add_action( 'wp_head', 'ilcb_add_inline_styles', 5 );