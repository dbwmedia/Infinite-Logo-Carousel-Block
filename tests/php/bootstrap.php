<?php
/**
 * Minimal WordPress surface for testing includes/render.php without a
 * WordPress install. The HTML API classes are the real ones (fetch-wp.sh).
 */

define( 'ABSPATH', __DIR__ . '/' );
define( 'DAY_IN_SECONDS', 86400 );

foreach ( array( 'class-wp-html-attribute-token', 'class-wp-html-span', 'class-wp-html-text-replacement', 'class-wp-html-tag-processor' ) as $ilcb_file ) {
	$ilcb_path = __DIR__ . '/.wp/' . $ilcb_file . '.php';
	if ( ! file_exists( $ilcb_path ) ) {
		fwrite( STDERR, "Run tests/php/fetch-wp.sh first.\n" );
		exit( 1 );
	}
	require_once $ilcb_path;
}

// Test fixtures: attachment meta, titles, URL lookups, srcsets.
$GLOBALS['ilcb_test'] = array(
	'meta'    => array(),
	'titles'  => array(),
	'url_ids' => array(),
	'srcsets' => array(),
	'lookups' => 0,
	'logs'    => array(),
	'filters' => array(),
);

function ilcb_test_reset( $data = array() ) {
	$GLOBALS['ilcb_test'] = array_merge(
		array(
			'meta'    => array(),
			'titles'  => array(),
			'url_ids' => array(),
			'srcsets' => array(),
			'lookups' => 0,
			'logs'    => array(),
			'filters' => $GLOBALS['ilcb_test']['filters'],
		),
		$data
	);
	$GLOBALS['ilcb_cache'] = array();
}

function add_filter( $hook, $callback ) {
	$GLOBALS['ilcb_test']['filters'][ $hook ][] = $callback;
}
function __( $text ) {
	return $text;
}
function esc_attr( $text ) {
	return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
}
function esc_url( $url, $protocols = null ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}
	if ( preg_match( '/^([a-z][a-z0-9+.-]*):/i', $url, $m ) ) {
		$protocols = $protocols ? $protocols : array( 'http', 'https', 'mailto', 'tel' );
		if ( ! in_array( strtolower( $m[1] ), $protocols, true ) ) {
			return '';
		}
	}
	return str_replace( ' ', '%20', $url );
}
function wp_strip_all_tags( $text ) {
	return trim( strip_tags( $text ) );
}
function is_feed() {
	return false;
}
function get_post_meta( $id, $key ) {
	return isset( $GLOBALS['ilcb_test']['meta'][ $id ] ) ? $GLOBALS['ilcb_test']['meta'][ $id ] : '';
}
function get_the_title( $id ) {
	return isset( $GLOBALS['ilcb_test']['titles'][ $id ] ) ? $GLOBALS['ilcb_test']['titles'][ $id ] : '';
}
function update_meta_cache() {
	return true;
}
function wp_get_upload_dir() {
	return array( 'baseurl' => 'https://example.com/wp-content/uploads' );
}
function attachment_url_to_postid( $url ) {
	$GLOBALS['ilcb_test']['lookups']++;
	return isset( $GLOBALS['ilcb_test']['url_ids'][ $url ] ) ? $GLOBALS['ilcb_test']['url_ids'][ $url ] : 0;
}
function wp_get_attachment_image_srcset( $id ) {
	return isset( $GLOBALS['ilcb_test']['srcsets'][ $id ] ) ? $GLOBALS['ilcb_test']['srcsets'][ $id ] : false;
}
function wp_cache_get( $key, $group ) {
	return isset( $GLOBALS['ilcb_cache'][ $group ][ $key ] ) ? $GLOBALS['ilcb_cache'][ $group ][ $key ] : false;
}
function wp_cache_set( $key, $value, $group ) {
	$GLOBALS['ilcb_cache'][ $group ][ $key ] = $value;
	return true;
}

require_once dirname( __DIR__, 2 ) . '/includes/render.php';
