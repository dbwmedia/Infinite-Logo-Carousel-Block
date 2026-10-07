/**
 * Lists translatable strings in src/ and includes/ that are missing from the
 * German translation (JSON for the editor script, PO for PHP).
 * Usage: node bin/i18n-missing.cjs
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const ROOT = path.resolve( __dirname, '..' );

function walk( dir, ext ) {
	return fs.readdirSync( dir, { withFileTypes: true } ).flatMap( ( e ) => {
		const p = path.join( dir, e.name );
		if ( e.isDirectory() ) {
			return walk( p, ext );
		}
		return p.endsWith( ext ) ? [ p ] : [];
	} );
}
// A JS string literal in either quote style.
const STR = `("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')`;
const unq = ( lit ) =>
	lit[ 0 ] === '"'
		? JSON.parse( lit )
		: JSON.parse(
				'"' +
					lit
						.slice( 1, -1 )
						.replace( /\\'/g, "'" )
						.replace( /"/g, '\\"' ) +
					'"'
			);
const strings = new Set();
for ( const file of walk( path.join( ROOT, 'src' ), '.js' ) ) {
	const src = fs.readFileSync( file, 'utf8' );
	const re = new RegExp( `\\b(?:__|_n)\\(\\s*${ STR }`, 'g' );
	for ( const m of src.matchAll( re ) ) {
		strings.add( unq( m[ 1 ] ) );
	}
}
const php = new Set();
for ( const file of [
	...walk( path.join( ROOT, 'includes' ), '.php' ),
	path.join( ROOT, 'logo-slider-block.php' ),
] ) {
	const src = fs.readFileSync( file, 'utf8' );
	for ( const m of src.matchAll(
		/(?:__|esc_html__|esc_attr__)\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'infinite-logo-carousel-block'/g
	) ) {
		php.add( m[ 1 ] );
	}
}
const json = JSON.parse(
	fs.readFileSync(
		path.join(
			ROOT,
			'languages/infinite-logo-carousel-block-de_DE-ilcb-editor.json'
		),
		'utf8'
	)
).locale_data.messages;
const po = fs.readFileSync(
	path.join( ROOT, 'languages/infinite-logo-carousel-block-de_DE.po' ),
	'utf8'
);
const inPo = ( s ) =>
	po.includes( 'msgid ' + JSON.stringify( s.split( '\u0000' )[ 0 ] ) );
const out = {
	editor: [ ...strings ].filter( ( s ) => ! ( s in json ) ),
	php: [ ...php ].filter( ( s ) => ! inPo( s ) ),
	unusedInJson: Object.keys( json ).filter(
		( k ) => k && ! strings.has( k )
	),
};
console.log( JSON.stringify( out, null, 2 ) );

if ( process.argv.includes( '--strict' ) && ( out.editor.length || out.php.length ) ) {
	process.exitCode = 1;
}
