<?php
/**
 * Render-time repairs for the saved block markup.
 *
 * Both blocks save static HTML, so everything in it was frozen into the
 * database at the last editor save. The filter in this file keeps saved
 * content correct and safe without anyone opening and re-saving a post.
 *
 * @package infinite-logo-carousel-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cache group for attachment lookups.
 */
const ILCB_CACHE_GROUP = 'ilcb';

/**
 * Resolve an attachment ID from an image URL.
 *
 * Only a fallback: the block stores the attachment ID next to every logo, so
 * this runs at most for content saved by a version that did not. Results,
 * misses included, are cached so a page view does not repeat the
 * (unindexed) postmeta lookup for every logo.
 *
 * @param string $url Image URL.
 * @return int Attachment ID, or 0 when it cannot be resolved.
 */
function ilcb_attachment_id_from_url( $url ) {
	if ( ! $url ) {
		return 0;
	}

	// A URL outside the uploads folder can never be an attachment.
	$uploads = wp_get_upload_dir();
	$base    = isset( $uploads['baseurl'] ) ? preg_replace( '#^https?:#', '', $uploads['baseurl'] ) : '';
	if ( '' === $base || false === strpos( $url, $base ) ) {
		return 0;
	}

	$key    = 'url_' . md5( $url );
	$cached = wp_cache_get( $key, ILCB_CACHE_GROUP );
	if ( false !== $cached ) {
		return (int) $cached;
	}

	$id = attachment_url_to_postid( $url );
	if ( ! $id ) {
		// Intermediate sizes ("logo-300x120.png") do not resolve directly,
		// try the original file name.
		$original = preg_replace( '/-\d+x\d+(\.[a-zA-Z0-9]+)$/', '$1', $url );
		if ( $original && $original !== $url ) {
			$id = attachment_url_to_postid( $original );
		}
	}

	$id = $id ? (int) $id : 0;
	wp_cache_set( $key, $id, ILCB_CACHE_GROUP, DAY_IN_SECONDS );

	return $id;
}

/**
 * Report a logo that has no alt text anywhere.
 *
 * Only with WP_DEBUG_LOG on: a production log must not grow with every page
 * view. Once per image and request; control characters are stripped because
 * the URL comes from post content.
 *
 * @param string $src Image URL.
 */
function ilcb_log_missing_alt( $src ) {
	static $reported = array();

	if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG || ! defined( 'WP_DEBUG_LOG' ) || ! WP_DEBUG_LOG ) {
		return;
	}
	if ( ! $src || isset( $reported[ $src ] ) ) {
		return;
	}
	$reported[ $src ] = true;

	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug-only hint for site owners.
	error_log(
		sprintf(
			'[Logo Slider] No alt text for %s - add one to the attachment in the media library, or per logo in the block.',
			preg_replace( '/[\x00-\x1F\x7F]/', '', $src )
		)
	);
}

/**
 * Alt text for a logo whose saved alt is empty.
 *
 * The media library alt text first; the attachment title as a fallback,
 * because a link or logo without any name is read out as its file name.
 *
 * @param int $id Attachment ID (0 when unknown).
 * @return string Alt text, or '' when there is none.
 */
function ilcb_resolve_alt( $id ) {
	if ( ! $id ) {
		return '';
	}
	$alt = get_post_meta( $id, '_wp_attachment_image_alt', true );
	$alt = is_string( $alt ) ? trim( $alt ) : '';
	if ( '' === $alt ) {
		$title = get_the_title( $id );
		$alt   = is_string( $title ) ? trim( wp_strip_all_tags( $title ) ) : '';
	}
	return $alt;
}

/**
 * Layout rules the carousel cannot live without, printed once per page.
 *
 * Optimisation plugins (Hummingbird, WP Rocket "async/delay CSS") hold the
 * stylesheet back. Without it the track is a plain block and every logo
 * renders at its full file size, stacked thousands of pixels high. These
 * rules arrive with the markup itself. :where() gives them zero specificity,
 * so the real stylesheet always wins once it has loaded.
 *
 * The <noscript> part keeps the carousel visible without JavaScript (with
 * JavaScript the frontend script reveals it).
 *
 * @return string Markup to print before the first block, or '' after that.
 */
function ilcb_critical_css() {
	static $printed = false;

	if ( $printed || is_feed() ) {
		return '';
	}
	$printed = true;

	$css = ':where(.dbw-partner-slider){position:relative;overflow:hidden}'
		. ':where(.dbw-slider-wrapper){overflow:hidden}'
		. ':where(.dbw-slider-track){display:flex;align-items:center;width:max-content}'
		. ':where(.dbw-slider-item){flex:0 0 auto;display:inline-flex;align-items:center}'
		. ':where(.dbw-slider-item img){display:block;width:auto;max-width:none;height:var(--logo-height,50px)}'
		. ':where(.dbw-spotlight-stage){display:grid}'
		. ':where(.dbw-spotlight-stage>.dbw-slider-item){grid-area:1/1}'
		. ':where(.dbw-spotlight-stage>.dbw-slider-item:not(.dbw-spot-active)){visibility:hidden}';

	return '<style id="ilcb-critical-css">' . $css . '</style>'
		. '<noscript><style>.dbw-partner-slider{opacity:1!important;animation:none!important}.dbw-pause-btn{display:none}</style></noscript>';
}

/**
 * Only http(s), mailto and tel links survive. Anything else (javascript:,
 * data:) is dropped.
 *
 * @param string $href Saved href.
 * @return string Safe URL, or '' to remove the link target.
 */
function ilcb_safe_href( $href ) {
	return esc_url( $href, array( 'http', 'https', 'mailto', 'tel' ) );
}

/**
 * Repair the saved markup of both blocks while it is rendered.
 *
 * Carousel:
 * 1. Alt texts. An empty alt is filled from the media library (alt text,
 *    then title). An alt that carries text is the author's own and is never
 *    touched.
 * 2. Screen reader duplicates. The seamless loop repeats every logo set.
 *    Every copy, and any logo repeated inside the first set (alternating
 *    capsules with an odd logo count), is aria-hidden with an empty alt and
 *    its link leaves the tab order: each name is announced once.
 * 3. Links. href is limited to http(s)/mailto/tel, target to _self/_blank,
 *    any target other than _self gets noopener. The generic "Logo Link"
 *    label (and a label that just repeats the link title) is dropped when
 *    the image has an alt text: the logo's own name is the better link name.
 * 4. Loading and images. lazy unless the block opts into eager loading;
 *    srcset/sizes from the attachment, so a 50 px logo no longer downloads
 *    the 1024 px "large" file.
 * 5. Pause button. Gets a translated accessible name.
 *
 * Both blocks: the critical layout CSS before the first block on the page.
 *
 * @param string $block_content Saved block markup.
 * @param array  $block         Parsed block, including its attributes.
 * @return string Filtered markup.
 */
function ilcb_filter_block_output( $block_content, $block ) {
	$name = isset( $block['blockName'] ) ? $block['blockName'] : '';
	if ( 'infinite-logo-carousel-block/carousel' !== $name && 'infinite-logo-carousel-block/marquee' !== $name ) {
		return $block_content;
	}
	if ( '' === trim( (string) $block_content ) ) {
		return $block_content;
	}

	$critical = ilcb_critical_css();

	if ( 'infinite-logo-carousel-block/marquee' === $name ) {
		$tags = new WP_HTML_Tag_Processor( $block_content );
		while ( $tags->next_tag( array( 'tag_name' => 'BUTTON', 'class_name' => 'dbw-pause-btn' ) ) ) {
			$tags->set_attribute( 'aria-label', __( 'Pause animation', 'infinite-logo-carousel-block' ) );
		}
		return $critical . $tags->get_updated_html();
	}

	return $critical . ilcb_filter_carousel_markup( $block_content, isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array() );
}
add_filter( 'render_block', 'ilcb_filter_block_output', 10, 2 );

/**
 * The carousel part of ilcb_filter_block_output().
 *
 * @param string $html  Saved carousel markup.
 * @param array  $attrs Block attributes.
 * @return string Filtered markup.
 */
function ilcb_filter_carousel_markup( $html, $attrs ) {
	$eager       = ! empty( $attrs['eagerLoading'] );
	$link_title  = isset( $attrs['linkTitle'] ) && is_string( $attrs['linkTitle'] ) ? trim( $attrs['linkTitle'] ) : '';
	$logo_height = isset( $attrs['logoHeight'] ) ? (float) $attrs['logoHeight'] : 50;
	$logo_height = $logo_height > 0 ? $logo_height : 50;
	// Balanced sizes scale a logo by up to 1.4 (frontend.js).
	$max_scale = ! empty( $attrs['balanceLogos'] ) ? 1.4 : 1;

	// The block keeps the attachment ID next to every logo.
	$ids = array();
	if ( ! empty( $attrs['images'] ) && is_array( $attrs['images'] ) ) {
		foreach ( $attrs['images'] as $image ) {
			if ( is_array( $image ) && ! empty( $image['url'] ) && ! empty( $image['id'] ) ) {
				$ids[ $image['url'] ] = (int) $image['id'];
			}
		}
	}
	if ( $ids && function_exists( 'update_meta_cache' ) ) {
		// One query for every logo's alt text instead of one per logo.
		update_meta_cache( 'post', array_values( $ids ) );
	}

	// Items per track, for the CSS fallback animation below.
	$track_sizes = array();
	$count_tags  = new WP_HTML_Tag_Processor( $html );
	while ( $count_tags->next_tag( 'DIV' ) ) {
		if ( $count_tags->has_class( 'dbw-slider-track' ) ) {
			$track_sizes[] = 0;
		} elseif ( $count_tags->has_class( 'dbw-spotlight-stage' ) ) {
			$track_sizes[] = null;
		} elseif ( $count_tags->has_class( 'dbw-slider-item' ) && $track_sizes && null !== end( $track_sizes ) ) {
			$track_sizes[ count( $track_sizes ) - 1 ]++;
		}
	}

	$tags = new WP_HTML_Tag_Processor( $html );

	$fallback_count = 0;       // --logo-count from the slider (content before v1.3).
	$per_set        = 0;       // Logos in one set.
	$item_index     = 0;       // Position of the current item in its track.
	$seen_srcs      = array(); // Images already shown in the current track's first set.
	$in_item        = false;
	$decorative     = false;   // Whether the current item is a copy.
	$has_link       = false;
	$label          = '';      // aria-label of the current item's link.

	while ( $tags->next_tag() ) {
		$tag   = $tags->get_tag();
		$class = $tags->get_attribute( 'class' );
		$class = is_string( $class ) ? ' ' . $class . ' ' : '';

		if ( 'DIV' === $tag && false !== strpos( $class, ' dbw-partner-slider ' ) ) {
			$style = $tags->get_attribute( 'style' );
			if ( is_string( $style ) && preg_match( '/--logo-count:\s*(\d+)/', $style, $m ) ) {
				$fallback_count = (int) $m[1];
			}
			continue;
		}

		if ( 'DIV' === $tag && false !== strpos( $class, ' dbw-slider-track ' ) ) {
			$count      = $tags->get_attribute( 'data-logo-count' );
			$per_set    = is_string( $count ) ? (int) $count : $fallback_count;
			$item_index = 0;
			$seen_srcs  = array();

			// Until the frontend script has measured the track, the CSS
			// animation runs. It has to shift by exactly one set, and the
			// number of saved copies varies with the logo count.
			$size = array_shift( $track_sizes );
			if ( $per_set > 0 && $size >= 2 * $per_set ) {
				$style = $tags->get_attribute( 'style' );
				$style = is_string( $style ) ? trim( $style ) : '';
				if ( false === strpos( $style, '--dbw-loop-shift' ) ) {
					$style = '' !== $style ? rtrim( $style, ';' ) . ';' : '';
					$tags->set_attribute( 'style', $style . '--dbw-loop-shift:calc(-100% / ' . (int) round( $size / $per_set ) . ')' );
				}
			}
			continue;
		}

		// The spotlight stage shows every logo once, so nothing there is a copy.
		if ( 'DIV' === $tag && false !== strpos( $class, ' dbw-spotlight-stage ' ) ) {
			array_shift( $track_sizes );
			$per_set    = 0;
			$item_index = 0;
			$seen_srcs  = array();
			continue;
		}

		if ( 'DIV' === $tag && false !== strpos( $class, ' dbw-slider-item ' ) ) {
			$item_index++;
			$in_item    = true;
			$has_link   = false;
			$label      = '';
			$decorative = ( $per_set > 0 && $item_index > $per_set );
			if ( $decorative ) {
				if ( null === $tags->get_attribute( 'aria-hidden' ) ) {
					$tags->set_attribute( 'aria-hidden', 'true' );
				}
			} else {
				// Only needed for a repeat inside the first set, found later.
				$tags->set_bookmark( 'ilcb-item' );
			}
			continue;
		}

		if ( 'BUTTON' === $tag && false !== strpos( $class, ' dbw-pause-btn ' ) ) {
			$tags->set_attribute( 'aria-label', __( 'Pause animation', 'infinite-logo-carousel-block' ) );
			continue;
		}

		if ( 'A' === $tag && $in_item ) {
			ilcb_sanitize_link( $tags );
			$has_link = true;
			if ( $decorative ) {
				$tags->set_attribute( 'tabindex', '-1' );
			} else {
				$aria  = $tags->get_attribute( 'aria-label' );
				$label = is_string( $aria ) ? $aria : '';
				$tags->set_bookmark( 'ilcb-link' );
			}
			continue;
		}

		if ( 'IMG' !== $tag ) {
			continue;
		}

		$src = $tags->get_attribute( 'src' );
		$src = is_string( $src ) ? $src : '';
		$id  = isset( $ids[ $src ] ) ? $ids[ $src ] : 0;

		$tags->set_attribute( 'loading', $eager ? 'eager' : 'lazy' );
		if ( null === $tags->get_attribute( 'decoding' ) ) {
			$tags->set_attribute( 'decoding', 'async' );
		}
		ilcb_add_srcset( $tags, $id, $src, $logo_height * $max_scale );

		if ( ! $in_item ) {
			continue;
		}
		$in_item = false;

		if ( $decorative ) {
			$tags->set_attribute( 'alt', '' );
			continue;
		}

		// A logo repeated inside the first set is a copy as well.
		$repeat = ( $per_set > 0 && isset( $seen_srcs[ $src ] ) );
		$seen_srcs[ $src ] = true;

		$name = '';
		if ( $repeat ) {
			$tags->set_attribute( 'alt', '' );
		} else {
			$alt = $tags->get_attribute( 'alt' );
			$name = is_string( $alt ) ? trim( $alt ) : '';
			if ( '' === $name ) {
				if ( ! $id ) {
					$id = ilcb_attachment_id_from_url( $src );
				}
				$name = ilcb_resolve_alt( $id );
				if ( '' !== $name ) {
					$tags->set_attribute( 'alt', $name );
				} else {
					// Better no alt attribute than an empty one: an empty alt
					// tells assistive technology the logo is decoration.
					$tags->remove_attribute( 'alt' );
					ilcb_log_missing_alt( $src );
				}
			}
		}

		$fix_label = $has_link && '' !== $name && ( 'Logo Link' === $label || ( '' !== $link_title && $label === $link_title ) );
		if ( ! $repeat && ! $fix_label ) {
			continue;
		}

		// Item and link come before the image; go back and update them.
		$tags->set_bookmark( 'ilcb-img' );
		if ( $repeat && $tags->seek( 'ilcb-item' ) && null === $tags->get_attribute( 'aria-hidden' ) ) {
			$tags->set_attribute( 'aria-hidden', 'true' );
		}
		if ( $has_link && $tags->seek( 'ilcb-link' ) ) {
			if ( $repeat ) {
				$tags->set_attribute( 'tabindex', '-1' );
			}
			if ( $fix_label ) {
				$tags->remove_attribute( 'aria-label' );
			}
		}
		if ( ! $tags->seek( 'ilcb-img' ) ) {
			break;
		}
	}

	return $tags->get_updated_html();
}

/**
 * Limit a logo link to safe values (see ilcb_filter_block_output()).
 *
 * @param WP_HTML_Tag_Processor $tags Processor positioned on an <a>.
 */
function ilcb_sanitize_link( $tags ) {
	$href = $tags->get_attribute( 'href' );
	if ( is_string( $href ) ) {
		$safe = ilcb_safe_href( $href );
		if ( '' === $safe ) {
			$tags->remove_attribute( 'href' );
		} elseif ( $safe !== $href ) {
			$tags->set_attribute( 'href', $safe );
		}
	}

	$target = $tags->get_attribute( 'target' );
	if ( is_string( $target ) ) {
		if ( '_self' !== $target && '_blank' !== $target ) {
			$tags->set_attribute( 'target', '_blank' );
			$target = '_blank';
		}
		if ( '_blank' === $target ) {
			$rel    = $tags->get_attribute( 'rel' );
			$tokens = is_string( $rel ) ? preg_split( '/\s+/', trim( $rel ) ) : array();
			$tokens = array_filter( $tokens );
			if ( ! in_array( 'noopener', $tokens, true ) ) {
				$tokens[] = 'noopener';
				$tags->set_attribute( 'rel', implode( ' ', $tokens ) );
			}
		}
	}
}

/**
 * Add srcset/sizes so the browser picks a file close to the rendered size.
 *
 * Skipped for SVGs (no intermediate sizes), unknown attachments and images
 * that already carry a srcset.
 *
 * @param WP_HTML_Tag_Processor $tags      Processor positioned on an <img>.
 * @param int                   $id        Attachment ID (0 when unknown).
 * @param string                $src       Image URL.
 * @param float                 $max_height Largest rendered logo height in px.
 */
function ilcb_add_srcset( $tags, $id, $src, $max_height ) {
	if ( ! $id || null !== $tags->get_attribute( 'srcset' ) || preg_match( '/\.svg(\?|$)/i', $src ) ) {
		return;
	}
	if ( ! function_exists( 'wp_get_attachment_image_srcset' ) ) {
		return;
	}
	$srcset = wp_get_attachment_image_srcset( $id, 'full' );
	if ( ! $srcset ) {
		return;
	}
	$width  = (float) $tags->get_attribute( 'width' );
	$height = (float) $tags->get_attribute( 'height' );
	if ( $width <= 0 || $height <= 0 ) {
		return;
	}
	$tags->set_attribute( 'srcset', $srcset );
	$tags->set_attribute( 'sizes', (int) ceil( $max_height * $width / $height ) . 'px' );
}
