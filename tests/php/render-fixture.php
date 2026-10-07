<?php
/**
 * Prints a fixture as the front end serves it: run through the render
 * filter, critical CSS included. Used by the browser tests.
 *
 * Usage: php tests/php/render-fixture.php v2.3.0/carousel-default.html
 */

require __DIR__ . '/bootstrap.php';

$ilcb_raw = file_get_contents( dirname( __DIR__ ) . '/fixtures/' . $argv[1] );
preg_match( '#^<!-- wp:(\S+) (\{.*?\}) -->\s*(.*?)\s*<!-- /wp:\S+ -->#s', $ilcb_raw, $ilcb_m );

// Every logo gets an alt text from the "media library".
ilcb_test_reset( array( 'meta' => array_fill( 100, 20, 'Logo' ) ) );

echo ilcb_filter_block_output(
	$ilcb_m[3],
	array(
		'blockName' => 'infinite-logo-carousel-block/' . preg_replace( '#^infinite-logo-carousel-block/#', '', $ilcb_m[1] ),
		'attrs'     => json_decode( $ilcb_m[2], true ),
	)
);
