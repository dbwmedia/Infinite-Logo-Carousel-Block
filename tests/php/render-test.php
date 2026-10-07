<?php
/**
 * Tests for includes/render.php against real saved markup
 * (tests/fixtures/<version>/, rendered by a released build).
 *
 * Run: php tests/php/render-test.php
 */

require __DIR__ . '/bootstrap.php';

$ilcb_failures = 0;
$ilcb_checks   = 0;

function check( $condition, $message ) {
	global $ilcb_failures, $ilcb_checks;
	$ilcb_checks++;
	if ( ! $condition ) {
		$ilcb_failures++;
		echo "FAIL: $message\n";
	}
}

/**
 * Parse a fixture into [ block name, attributes, inner HTML ].
 */
function fixture( $file ) {
	$raw = file_get_contents( dirname( __DIR__ ) . '/fixtures/v2.3.0/' . $file );
	if ( ! preg_match( '#^<!-- wp:(\S+) (\{.*?\}) -->\n(.*)\n<!-- /wp:\S+ -->#s', trim( $raw ) . "\n", $m ) ) {
		preg_match( '#^<!-- wp:(\S+) (\{.*?\}) -->\s*(.*?)\s*<!-- /wp:\S+ -->#s', $raw, $m );
	}
	return array( 'infinite-logo-carousel-block/' . preg_replace( '#^infinite-logo-carousel-block/#', '', $m[1] ), json_decode( $m[2], true ), $m[3] );
}

function render( $file ) {
	list( $name, $attrs, $html ) = fixture( $file );
	return ilcb_filter_block_output( $html, array( 'blockName' => $name, 'attrs' => $attrs ) );
}

/**
 * Attributes of every tag matching $tag (upper case) in $html.
 */
function tags_of( $html, $tag, $class = null ) {
	$p   = new WP_HTML_Tag_Processor( $html );
	$out = array();
	$q   = array( 'tag_name' => $tag );
	if ( $class ) {
		$q['class_name'] = $class;
	}
	while ( $p->next_tag( $q ) ) {
		$attrs = array();
		foreach ( $p->get_attribute_names_with_prefix( '' ) as $name ) {
			$attrs[ $name ] = $p->get_attribute( $name );
		}
		$out[] = $attrs;
	}
	return $out;
}

// --- Critical CSS: printed once, before the first block -----------------
ilcb_test_reset();
$first  = render( 'carousel-default.html' );
$second = render( 'marquee-default.html' );
check( 0 === strpos( $first, '<style id="ilcb-critical-css">' ), 'critical CSS precedes the first block' );
check( false !== strpos( $first, '<noscript>' ), 'noscript fallback is printed' );
check( false === strpos( $second, 'ilcb-critical-css' ), 'critical CSS is printed only once' );
check( false !== strpos( $first, ':where(.dbw-slider-track){display:flex' ), 'critical CSS has zero-specificity track layout' );

// --- Foreign blocks are untouched ---------------------------------------
check( '<p>x</p>' === ilcb_filter_block_output( '<p>x</p>', array( 'blockName' => 'core/paragraph' ) ), 'other blocks pass through' );
check( '' === ilcb_filter_block_output( '', array( 'blockName' => 'infinite-logo-carousel-block/carousel' ) ), 'empty content passes through' );

// --- Alt texts -----------------------------------------------------------
ilcb_test_reset(
	array(
		'meta'   => array( 102 => 'Beta GmbH' ),
		'titles' => array( 103 => 'Gamma Logo' ),
	)
);
$html = render( 'carousel-alts_and_links.html' );
$imgs = tags_of( $html, 'IMG' );
check( 'Acme' === $imgs[0]['alt'], 'author alt text is kept' );
check( 'Beta GmbH' === $imgs[1]['alt'], 'media library alt fills an empty alt' );
check( 'Gamma Logo' === $imgs[2]['alt'], 'attachment title is the fallback' );
check( ! array_key_exists( 'alt', $imgs[3] ), 'no alt anywhere: attribute removed' );

// --- Copies: aria-hidden, empty alt, out of tab order -------------------
$items = tags_of( $html, 'DIV', 'dbw-slider-item' );
check( count( $items ) > 4, 'fixture repeats the set' );
check( ! isset( $items[0]['aria-hidden'] ), 'first set stays visible to screen readers' );
check( 'true' === $items[4]['aria-hidden'], 'copies are aria-hidden' );
check( '' === $imgs[4]['alt'], 'copies have an empty alt' );

// --- Links ---------------------------------------------------------------
$links = tags_of( $html, 'A' );
check( 'https://acme.example' === $links[0]['href'], 'http link kept' );
check( ! array_key_exists( 'href', $links[1] ), 'javascript: link removed' );
check( false !== strpos( $links[0]['rel'], 'noopener' ), '_blank keeps noopener' );
check( false !== strpos( $links[0]['rel'], 'sponsored' ), 'author rel kept' );
check( ! array_key_exists( 'aria-label', $links[0] ), '"Logo Link" label dropped when the logo has a name' );
$copy_links = array_slice( $links, 3 );
check( count( $copy_links ) > 0 && '-1' === $copy_links[0]['tabindex'], 'copied links leave the tab order' );

$evil = '<div class="wp-block-infinite-logo-carousel-block-carousel dbw-partner-slider"><div class="dbw-slider-wrapper"><div class="dbw-slider-track" data-logo-count="1"><div class="dbw-slider-item"><a href="JaVaScRiPt:alert(1)" target="evil"><img src="https://example.com/x.png" alt="X"></a></div></div></div></div>';
$out  = tags_of( ilcb_filter_block_output( $evil, array( 'blockName' => 'infinite-logo-carousel-block/carousel', 'attrs' => array() ) ), 'A' );
check( ! array_key_exists( 'href', $out[0] ), 'mixed-case javascript: removed' );
check( '_blank' === $out[0]['target'] && 'noopener' === $out[0]['rel'], 'unknown target becomes _blank with noopener' );

// --- linkTitle label is dropped, title kept -----------------------------
ilcb_test_reset( array( 'meta' => array( 101 => 'Acme' ) ) );
$links = tags_of( render( 'carousel-link_title.html' ), 'A' );
check( ! array_key_exists( 'aria-label', $links[0] ), 'link title is no longer forced as aria-label' );
check( 'Visit our partner' === $links[0]['title'], 'link title attribute kept' );

ilcb_test_reset();
$links = tags_of( render( 'carousel-link_title.html' ), 'A' );
check( 'Visit our partner' === $links[0]['aria-label'], 'label kept when the logo has no name' );

// --- Repeats inside the first set (alternating capsules, odd count) ----
ilcb_test_reset( array( 'meta' => array( 101 => 'A', 102 => 'B', 103 => 'C' ) ) );
$html  = render( 'carousel-capsules_odd.html' );
$items = tags_of( $html, 'DIV', 'dbw-slider-item' );
$imgs  = tags_of( $html, 'IMG' );
$named = array_filter( $imgs, function ( $img ) { return isset( $img['alt'] ) && '' !== $img['alt']; } );
check( 3 === count( $named ), 'each logo is named exactly once (got ' . count( $named ) . ')' );
check( 'true' === $items[3]['aria-hidden'], 'repeat inside the first set is aria-hidden' );

// --- Pause button --------------------------------------------------------
ilcb_test_reset();
$btn = tags_of( render( 'carousel-pause_button.html' ), 'BUTTON' );
check( 'Pause animation' === $btn[0]['aria-label'], 'carousel pause button has a name' );
$btn = tags_of( render( 'marquee-pause_reverse.html' ), 'BUTTON' );
check( 'Pause animation' === $btn[0]['aria-label'], 'marquee pause button has a name' );

// --- Loading + srcset ----------------------------------------------------
ilcb_test_reset( array( 'srcsets' => array( 101 => 'a.png 300w, b.png 150w' ) ) );
$imgs = tags_of( render( 'carousel-default.html' ), 'IMG' );
check( 'lazy' === $imgs[0]['loading'], 'lazy by default' );
check( 'a.png 300w, b.png 150w' === $imgs[0]['srcset'], 'srcset added from the attachment' );
check( '100px' === $imgs[0]['sizes'], 'sizes = logo height x aspect ratio (got ' . $imgs[0]['sizes'] . ')' );
check( ! isset( $imgs[1]['srcset'] ), 'no srcset without one from the attachment' );
$imgs = tags_of( render( 'carousel-eager_label.html' ), 'IMG' );
check( 'eager' === $imgs[0]['loading'], 'eager loading honoured' );
$imgs = tags_of( render( 'carousel-gray_balance.html' ), 'IMG' );
check( '140px' === $imgs[0]['sizes'], 'balanced logos may grow by 1.4 (got ' . $imgs[0]['sizes'] . ')' );

// --- URL lookup: only for uploads, cached --------------------------------
ilcb_test_reset();
check( 0 === ilcb_attachment_id_from_url( 'https://cdn.other.example/logo.png' ), 'foreign URL resolves to 0' );
check( 0 === $GLOBALS['ilcb_test']['lookups'], 'foreign URL costs no query' );
ilcb_attachment_id_from_url( 'https://example.com/wp-content/uploads/a-300x150.png' );
ilcb_attachment_id_from_url( 'https://example.com/wp-content/uploads/a-300x150.png' );
check( 2 === $GLOBALS['ilcb_test']['lookups'], 'miss is cached (2 lookups for size + original, then none)' );

// --- Spotlight: nothing is a copy ---------------------------------------
ilcb_test_reset( array( 'meta' => array( 101 => 'A', 102 => 'B', 103 => 'C', 104 => 'D', 105 => 'E' ) ) );
$items = tags_of( render( 'carousel-spotlight.html' ), 'DIV', 'dbw-slider-item' );
$hidden = array_filter( $items, function ( $i ) { return isset( $i['aria-hidden'] ); } );
check( 0 === count( $hidden ), 'spotlight logos are never hidden as copies' );

// --- CSS fallback animation shifts by exactly one set -------------------
ilcb_test_reset();
$tracks = tags_of( render( 'carousel-default.html' ), 'DIV', 'dbw-slider-track' );
$items  = count( tags_of( render( 'carousel-default.html' ), 'DIV', 'dbw-slider-item' ) );
check( false !== strpos( $tracks[0]['style'], '--dbw-loop-shift:calc(-100% / ' . ( $items / 5 ) . ')' ), 'loop shift = one set (' . $tracks[0]['style'] . ')' );
$tracks = tags_of( render( 'carousel-rows_varied.html' ), 'DIV', 'dbw-slider-track' );
check( 2 === count( $tracks ) && false !== strpos( $tracks[1]['style'], '--scroll-duration' ) && false !== strpos( $tracks[1]['style'], '--dbw-loop-shift' ), 'row duration kept next to the loop shift (' . $tracks[1]['style'] . ')' );

// --- Idempotent ----------------------------------------------------------
ilcb_test_reset( array( 'meta' => array( 102 => 'Beta' ) ) );
list( , $attrs, $inner ) = fixture( 'carousel-alts_and_links.html' );
$once  = ilcb_filter_carousel_markup( $inner, $attrs );
$twice = ilcb_filter_carousel_markup( $once, $attrs );
check( $once === $twice, 'running the filter twice changes nothing' );

echo "$ilcb_checks checks, $ilcb_failures failed\n";
exit( $ilcb_failures ? 1 : 0 );
