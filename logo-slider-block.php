<?php
/**
 * Plugin Name: Logo Slider – Infinite Carousel & Marquee Block
 * Plugin URI: https://www.dennisbuchwald.de/apps/logo-slider
 * Description: A professional infinity logo carousel Gutenberg block with customizable speed, spacing, hover-stop and optional links. Perfect for showcasing partner, client or sponsor logos.
 * Version: 2.3.0
 * Requires at least: 6.0
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
define( 'ILCB_VERSION', '2.3.0' );
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
        'script'        => 'ilcb-frontend',
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
                    __( 'The <strong>Logo Slider</strong> plugin requires WordPress 6.0 or higher. You are using WordPress %s.', 'infinite-logo-carousel-block' ),
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
    if ( version_compare( get_bloginfo( 'version' ), '6.0', '<' ) ) {
        deactivate_plugins( ILCB_PLUGIN_BASENAME );
        wp_die(
            esc_html__( 'This plugin requires WordPress 6.0 or higher.', 'infinite-logo-carousel-block' ),
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
 * Resolve an attachment ID from an image URL, cached for the request.
 *
 * Only ever needed as a fallback: the block stores the attachment ID in its
 * own attributes, so this runs at most for content saved by a version that
 * did not, or for a logo whose URL no longer matches its attachment.
 *
 * @param string $url Image URL.
 * @return int Attachment ID, or 0 when it cannot be resolved.
 */
function ilcb_attachment_id_from_url( $url ) {
    static $cache = array();

    if ( ! $url ) {
        return 0;
    }
    if ( isset( $cache[ $url ] ) ) {
        return $cache[ $url ];
    }

    $id = attachment_url_to_postid( $url );
    if ( ! $id ) {
        // Intermediate sizes ("logo-300x120.png") do not resolve directly —
        // try the original file name.
        $original = preg_replace( '/-\d+x\d+(\.[a-zA-Z0-9]+)$/', '$1', $url );
        if ( $original && $original !== $url ) {
            $id = attachment_url_to_postid( $original );
        }
    }

    $cache[ $url ] = $id ? (int) $id : 0;

    return $cache[ $url ];
}

/**
 * Report a logo that has no alt text anywhere, once per image and request.
 *
 * Silence is what made this problem invisible for so long: the markup simply
 * carried alt="" and nobody noticed. An image with nothing to say is now
 * rendered without an alt attribute at all and named here.
 *
 * @param string $src Image URL.
 */
function ilcb_log_missing_alt( $src ) {
    static $reported = array();

    if ( ! $src || isset( $reported[ $src ] ) ) {
        return;
    }
    $reported[ $src ] = true;

    error_log(
        sprintf(
            '[Logo Slider] No alt text for %s - add one to the attachment in the media library, or per logo in the block.',
            $src
        )
    );
}

/**
 * Repair and improve the saved carousel markup while it is rendered.
 *
 * The block saves static HTML, so everything below was frozen into the
 * database at the last editor save. This filter keeps three things correct
 * for content that nobody is going to open and re-save:
 *
 * 1. Alt texts. An empty or missing alt is filled from the attachment's
 *    _wp_attachment_image_alt, so alt texts maintained in the media library
 *    reach the front end. An alt that carries text is never touched — it is
 *    the author's own wording, entered per logo in the block. When there is
 *    no alt text anywhere the attribute is removed entirely (an empty alt
 *    means "decorative", which a client logo is not) and the image is named
 *    in the error log.
 * 2. Screen reader duplicates. The seamless loop repeats every logo set
 *    several times. Only the first set carries alt text; the copies are
 *    marked aria-hidden and their links leave the tab order, so a client
 *    name is announced once instead of once per copy.
 * 3. Loading. Older versions of this plugin forced loading="eager" on every
 *    logo to work around a measuring bug (see frontend.js). That made a
 *    below-the-fold carousel compete with the content people actually came
 *    for. Images are lazy again unless the block opts into eager loading.
 *
 * @param string $block_content Saved block markup.
 * @param array  $block         Parsed block, including its attributes.
 * @return string Filtered markup.
 */
function ilcb_filter_carousel_output( $block_content, $block ) {
    if ( ! isset( $block['blockName'] ) || 'infinite-logo-carousel-block/carousel' !== $block['blockName'] ) {
        return $block_content;
    }
    if ( false === strpos( $block_content, '<img' ) ) {
        return $block_content;
    }
    // WP_HTML_Tag_Processor ships with WordPress 6.2. On 6.0/6.1 the markup is
    // left exactly as saved rather than edited with something less safe.
    if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
        return $block_content;
    }

    $attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
    $eager = ! empty( $attrs['eagerLoading'] );

    // The block keeps the attachment ID next to every logo — no lookup needed.
    $ids = array();
    if ( ! empty( $attrs['images'] ) && is_array( $attrs['images'] ) ) {
        foreach ( $attrs['images'] as $image ) {
            if ( ! empty( $image['url'] ) && ! empty( $image['id'] ) ) {
                $ids[ $image['url'] ] = (int) $image['id'];
            }
        }
    }

    $tags = new WP_HTML_Tag_Processor( $block_content );

    $per_set    = 0;     // Logos in one set, from the track's data-logo-count.
    $item_index = 0;     // Position of the current item inside its track.
    $decorative = false; // Whether the current item is a repeated copy.

    while ( $tags->next_tag() ) {
        $tag   = $tags->get_tag();
        $class = $tags->get_attribute( 'class' );
        $class = is_string( $class ) ? $class : '';

        if ( 'DIV' === $tag && false !== strpos( $class, 'dbw-slider-track' ) ) {
            $count      = $tags->get_attribute( 'data-logo-count' );
            $per_set    = is_string( $count ) ? (int) $count : 0;
            $item_index = 0;
            $decorative = false;
            continue;
        }

        // The spotlight stage shows every logo once, so nothing there is a copy.
        if ( 'DIV' === $tag && false !== strpos( $class, 'dbw-spotlight-stage' ) ) {
            $per_set    = 0;
            $item_index = 0;
            $decorative = false;
            continue;
        }

        if ( 'DIV' === $tag && false !== strpos( $class, 'dbw-slider-item' ) ) {
            $item_index++;
            $decorative = ( $per_set > 0 && $item_index > $per_set );
            if ( $decorative && null === $tags->get_attribute( 'aria-hidden' ) ) {
                $tags->set_attribute( 'aria-hidden', 'true' );
            }
            continue;
        }

        if ( 'A' === $tag && $decorative ) {
            $tags->set_attribute( 'tabindex', '-1' );
            continue;
        }

        if ( 'IMG' !== $tag ) {
            continue;
        }

        $tags->set_attribute( 'loading', $eager ? 'eager' : 'lazy' );
        if ( null === $tags->get_attribute( 'decoding' ) ) {
            $tags->set_attribute( 'decoding', 'async' );
        }

        if ( $decorative ) {
            // A copy is decoration: empty alt, and the item above hides it.
            $tags->set_attribute( 'alt', '' );
            continue;
        }

        $alt = $tags->get_attribute( 'alt' );
        if ( is_string( $alt ) && '' !== trim( $alt ) ) {
            continue; // Author's own alt text — leave it alone.
        }

        $src = $tags->get_attribute( 'src' );
        $src = is_string( $src ) ? $src : '';

        $id = isset( $ids[ $src ] ) ? $ids[ $src ] : ilcb_attachment_id_from_url( $src );

        $resolved = '';
        if ( $id ) {
            $meta = get_post_meta( $id, '_wp_attachment_image_alt', true );
            if ( is_string( $meta ) ) {
                $resolved = trim( $meta );
            }
        }

        if ( '' !== $resolved ) {
            $tags->set_attribute( 'alt', $resolved );
        } else {
            // Better no alt attribute than an empty one: an empty alt tells
            // assistive technology the image carries no information.
            $tags->remove_attribute( 'alt' );
            ilcb_log_missing_alt( $src );
        }
    }

    return $tags->get_updated_html();
}
add_filter( 'render_block', 'ilcb_filter_carousel_output', 10, 2 );

/**
 * Fill empty alt attributes from the attachment meta.
 *
 * Static blocks bake alt="" into the saved HTML at edit time. If the
 * attachment had no alt back then, every subsequent render carries an
 * empty alt — even after someone fills it in on the attachment. This
 * filter patches the gap at render time so the fix works on every site
 * that uses the plugin, not just the one where someone remembered.
 *
 * - Only runs on this plugin's blocks, not globally.
 * - Never overwrites a non-empty alt that was saved in the block.
 * - Resolves the attachment ID from the wp-image-<ID> class.
 * - Logs a notice when an attachment has no alt either.
 */
function ilcb_fill_image_alt( $block_content, $block ) {
	if ( 'infinite-logo-carousel-block/carousel' !== ( $block['blockName'] ?? '' )
		&& 'infinite-logo-carousel-block/marquee' !== ( $block['blockName'] ?? '' )
	) {
		return $block_content;
	}

	return preg_replace_callback(
		'/<img\b([^>]*)>/i',
		function ( $match ) {
			$tag = $match[1];

			// Already has a non-empty alt? Leave it alone.
			if ( preg_match( '/\balt="([^"]+)"/', $tag ) ) {
				return $match[0];
			}

			// Extract attachment ID from wp-image-<ID> class.
			if ( ! preg_match( '/\bwp-image-(\d+)\b/', $tag, $id_match ) ) {
				return $match[0];
			}

			$att_id  = (int) $id_match[1];
			$alt     = get_post_meta( $att_id, '_wp_attachment_image_alt', true );
			$alt     = is_string( $alt ) ? trim( $alt ) : '';

			if ( $alt === '' ) {
				$src = '';
				if ( preg_match( '/\bsrc="([^"]*)"/', $tag, $src_match ) ) {
					$src = $src_match[1];
				}
				error_log( sprintf(
					'[infinite-logo-carousel] Attachment %d has no alt text (%s).',
					$att_id,
					$src
				) );
				// Remove the empty alt entirely rather than asserting emptiness.
				$tag = preg_replace( '/\s*alt=""/', '', $tag );
				return '<img' . $tag . '>';
			}

			// Replace alt="" with the attachment value.
			if ( strpos( $tag, 'alt=""' ) !== false ) {
				$tag = str_replace( 'alt=""', 'alt="' . esc_attr( $alt ) . '"', $tag );
			} else {
				// No alt attribute at all — add one.
				$tag .= ' alt="' . esc_attr( $alt ) . '"';
			}

			return '<img' . $tag . '>';
		},
		$block_content
	);
}
add_filter( 'render_block', 'ilcb_fill_image_alt', 11, 2 );

/**
 * Add inline styles for initial rendering
 */
function ilcb_add_inline_styles() {
    if ( has_block( 'infinite-logo-carousel-block/carousel' ) || has_block( 'infinite-logo-carousel-block/marquee' ) ) {
        echo '<style>
            .dbw-partner-slider { min-height: 70px; }
            .dbw-slider-wrapper { min-height: 70px; }
            .dbw-slider-item { min-height: 50px; }
            .dbw-slider-item img { 
                display: block !important; 
                min-height: var(--logo-height, 50px);
            }
            /* Spotlight logos tinted through a mask are drawn by the item
               background, so the image itself has to stay invisible. */
            .dbw-slider-item:not(.dbw-spot-masked) img { opacity: 1 !important; }
        </style>';

        // Keep the carousel visible when JavaScript is disabled. With JS the
        // reveal is handled by the frontend script (adds the .dbw-ready
        // class). The pause button needs JS, so it is hidden without it.
        echo '<noscript><style>.dbw-partner-slider{opacity:1 !important;animation:none !important;}.dbw-pause-btn{display:none;}</style></noscript>';
    }
}
add_action( 'wp_head', 'ilcb_add_inline_styles', 5 );