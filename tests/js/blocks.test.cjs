/**
 * Block validation tests: content saved by every released version must stay
 * valid with the current build, and save() must not change by accident.
 *
 * Run: npm run test:blocks (after npm run build)
 */
const test = require( 'node:test' );
const assert = require( 'node:assert' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const h = require( './harness.cjs' );
const cases = require( './cases.cjs' );

const FIXTURES = path.join( h.ROOT, 'tests/fixtures' );

const semver = ( v ) => v.replace( /^v/, '' ).split( '.' ).map( Number );
const versions = fs
	.readdirSync( FIXTURES )
	.filter( ( d ) => /^v\d+\.\d+\.\d+$/.test( d ) )
	.sort( ( a, b ) => {
		const [ x, y ] = [ semver( a ), semver( b ) ];
		return x[ 0 ] - y[ 0 ] || x[ 1 ] - y[ 1 ] || x[ 2 ] - y[ 2 ];
	} );
const newest = versions[ versions.length - 1 ];

const current = h.loadBuild();
for ( const name of Object.keys( current ) ) {
	h.useBlockType( name, current[ name ] );
}

// The block editor logs every validation problem; collect them per test.
const logged = [];
for ( const level of [ 'log', 'info', 'warn', 'error' ] ) {
	const original = console[ level ];
	console[ level ] = ( ...args ) => {
		logged.push( args.join( ' ' ) );
		if ( process.env.DEBUG ) {
			original( ...args );
		}
	};
}

for ( const version of versions ) {
	for ( const file of fs.readdirSync( path.join( FIXTURES, version ) ) ) {
		test( `${ version }/${ file } is valid with the current build`, () => {
			logged.length = 0;
			const content = fs.readFileSync(
				path.join( FIXTURES, version, file ),
				'utf8'
			);
			const parsed = h.blocks.parse( content ).filter( ( b ) => b.name );
			assert.strictEqual( parsed.length, 1 );
			const [ block ] = parsed;
			assert.ok(
				block.isValid,
				`invalid block:\n${ logged.join( '\n' ) }`
			);
			// Re-saving migrated content must produce valid current markup.
			const again = h.blocks
				.parse( h.blocks.serialize( block ) )
				.filter( ( b ) => b.name )[ 0 ];
			assert.ok( again.isValid, 're-saved content is invalid' );
			assert.deepStrictEqual(
				again.attributes.images || again.attributes.items,
				block.attributes.images || block.attributes.items
			);
		} );
	}
}

const { since, ...kinds } = cases;
for ( const [ kind, list ] of Object.entries( kinds ) ) {
	for ( const [ key, attributes ] of Object.entries( list ) ) {
		test( `save() of ${ kind }/${ key } round-trips as a valid block`, () => {
			const now = h.serializeBlock(
				`infinite-logo-carousel-block/${ kind }`,
				attributes
			);
			const [ block ] = h.blocks.parse( now ).filter( ( b ) => b.name );
			assert.ok( block.isValid );
		} );

		const expected = path.join(
			FIXTURES,
			newest,
			`${ kind }-${ key }.html`
		);
		if ( ! fs.existsSync( expected ) ) {
			// A feature newer than the last release: no saved content yet.
			continue;
		}
		test( `save() of ${ kind }/${ key } is unchanged since ${ newest }`, () => {
			const now =
				h.serializeBlock(
					`infinite-logo-carousel-block/${ kind }`,
					attributes
				) + '\n';
			assert.strictEqual(
				now,
				fs.readFileSync( expected, 'utf8' ),
				`save() output changed. Existing content would turn invalid unless a deprecation covers ${ newest }. ` +
					'Add the deprecation, release, then run: node tests/js/make-fixtures.cjs <new tag>'
			);
		} );
	}
}
