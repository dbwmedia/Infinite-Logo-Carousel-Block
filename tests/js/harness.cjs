/**
 * Loads a built editor bundle (build/index.js of any version) in Node with
 * the real `@wordpress/blocks` and `@wordpress/element`, so its save() output
 * can be rendered and compared, and saved markup can be parsed and
 * validated exactly as the block editor does.
 *
 * Only edit() needs the editor UI packages; they are stubbed, edit() is
 * never rendered here.
 */
const vm = require( 'node:vm' );
const { execFileSync } = require( 'node:child_process' );
const path = require( 'node:path' );
const fs = require( 'node:fs' );

const blocks = require( '@wordpress/blocks' );
const element = require( '@wordpress/element' );
const i18n = require( '@wordpress/i18n' );
const React = require( 'react' );
const ReactJSXRuntime = require( 'react/jsx-runtime' );

// The block parser reads saved HTML through document (hpq). Set it only
// after the WordPress packages are loaded, so they do not mistake Node for a
// browser.
const { JSDOM } = require( 'jsdom' );
globalThis.document = new JSDOM(
	'<!doctype html><body></body>'
).window.document;

const ROOT = path.resolve( __dirname, '../..' );

// The block editor adds the generated "wp-block-<name>" class to every saved
// block (block-editor/src/hooks/generated-class-name.js). Mirror it, so the
// rendered markup is the markup a real post stores.
require( '@wordpress/hooks' ).addFilter(
	'blocks.getSaveContent.extraProps',
	'ilcb-tests/generated-class-name',
	( props, blockType ) => {
		if ( ! blocks.hasBlockSupport( blockType, 'className', true ) ) {
			return props;
		}
		const classes = [
			blocks.getBlockDefaultClassName( blockType.name ),
			...( props.className || '' ).split( ' ' ),
		].filter( Boolean );
		return { ...props, className: [ ...new Set( classes ) ].join( ' ' ) };
	}
);

// Any property is a no-op component / function.
const stub = new Proxy(
	{},
	{
		get: ( target, key ) => ( key === '__esModule' ? false : () => null ),
	}
);

function useBlockProps( props ) {
	return props || {};
}
useBlockProps.save = blocks.__unstableGetBlockProps;

const blockEditor = new Proxy(
	{ useBlockProps },
	{ get: ( target, key ) => ( key in target ? target[ key ] : () => null ) }
);

/**
 * Run a bundle and return the block settings it registers, by name.
 *
 * @param {string} code Bundle source.
 * @return {Object<string, Object>} Block name => settings.
 */
function loadBundle( code ) {
	const registered = {};
	const wpBlocks = Object.assign( {}, blocks, {
		registerBlockType( name, settings ) {
			registered[ name ] = settings;
		},
	} );
	const window = {
		React,
		ReactJSXRuntime,
		wp: {
			blocks: wpBlocks,
			element,
			i18n,
			blockEditor,
			components: stub,
			data: stub,
		},
	};
	vm.runInNewContext( code, { window, console, setTimeout, clearTimeout } );
	return registered;
}

/**
 * Bundle of the working tree, or of a Git revision.
 *
 * @param {string} [rev] Git revision (e.g. "v2.3.0"); omitted = working tree.
 * @return {Object<string, Object>} Block name => settings.
 */
function loadBuild( rev ) {
	const code = rev
		? execFileSync( 'git', [ 'show', `${ rev }:build/index.js` ], {
				cwd: ROOT,
				encoding: 'utf8',
				maxBuffer: 20 * 1024 * 1024,
			} )
		: fs.readFileSync( path.join( ROOT, 'build/index.js' ), 'utf8' );
	return loadBundle( code );
}

/**
 * Make `settings` the live definition of `name` in the real registry.
 *
 * @param {string} name     Block name.
 * @param {Object} settings Block settings.
 */
function useBlockType( name, settings ) {
	if ( blocks.getBlockType( name ) ) {
		blocks.unregisterBlockType( name );
	}
	blocks.registerBlockType( name, settings );
}

/**
 * Serialized block (comment delimiters + saved HTML), as stored in a post.
 *
 * @param {string} name       Block name.
 * @param {Object} attributes Attributes.
 * @return {string} Post content.
 */
function serializeBlock( name, attributes ) {
	return blocks.serialize( blocks.createBlock( name, attributes ) );
}

module.exports = {
	blocks,
	loadBuild,
	loadBundle,
	useBlockType,
	serializeBlock,
	ROOT,
};
