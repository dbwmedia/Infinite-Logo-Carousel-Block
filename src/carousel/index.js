import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import metadata from '../../block.json';
import Edit from './edit';
import save from './save';
import deprecated from './deprecated';

/**
 * Placeholder logos for the inserter preview (never saved).
 *
 * @param {string} label Text in the logo.
 * @param {string} color Fill colour.
 * @return {Object} Logo entry.
 */
const exampleLogo = ( label, color ) => ( {
	url:
		'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect width="200" height="80" rx="10" fill="${ color }"/><text x="100" y="52" font-family="sans-serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">${ label }</text></svg>`
		),
	alt: label,
	width: 200,
	height: 80,
} );

// New blocks start with the pause button (WCAG 2.2.2) and the transparent
// edge fade. Set through variations, so blocks saved before keep their
// stored defaults and their markup.
const motionDefaults = { showPauseButton: true, overlayStyle: 'fade' };

const layoutIs = ( layout ) => ( attributes ) =>
	( attributes.layout || 'single' ) === layout;

registerBlockType( metadata.name, {
	...metadata,
	// Translated in the editor; block.json strings are translated server-side.
	title: __( 'Logo Slider', 'infinite-logo-carousel-block' ),
	description: __(
		'Professional infinity logo carousel with customizable speed, spacing and hover-pause. Perfect for client, partner or sponsor logos.',
		'infinite-logo-carousel-block'
	),
	example: {
		attributes: {
			images: [
				exampleLogo( 'ACME', '#2563eb' ),
				exampleLogo( 'NOVA', '#db2777' ),
				exampleLogo( 'ORBIT', '#059669' ),
				exampleLogo( 'PEAK', '#f59e0b' ),
			],
			logoHeight: '40',
			eagerLoading: true,
		},
	},
	variations: [
		{
			name: 'logo-slider',
			title: __( 'Logo Slider', 'infinite-logo-carousel-block' ),
			description: __(
				'Client or partner logos in an endless row.',
				'infinite-logo-carousel-block'
			),
			isDefault: true,
			attributes: { ...motionDefaults, layout: 'single' },
			scope: [ 'inserter', 'transform' ],
			isActive: layoutIs( 'single' ),
		},
		{
			name: 'logo-wall',
			title: __( 'Logo Wall', 'infinite-logo-carousel-block' ),
			description: __(
				'Several rows of logos moving in opposite directions.',
				'infinite-logo-carousel-block'
			),
			icon: 'grid-view',
			attributes: { ...motionDefaults, layout: 'rows' },
			scope: [ 'inserter', 'transform' ],
			isActive: layoutIs( 'rows' ),
		},
		{
			name: 'logo-spotlight',
			title: __( 'Logo Spotlight', 'infinite-logo-carousel-block' ),
			description: __(
				'One logo at a time in the same spot.',
				'infinite-logo-carousel-block'
			),
			icon: 'visibility',
			attributes: { ...motionDefaults, layout: 'spotlight' },
			scope: [ 'inserter', 'transform' ],
			isActive: layoutIs( 'spotlight' ),
		},
		{
			name: 'logo-grid',
			title: __( 'Logo Grid', 'infinite-logo-carousel-block' ),
			description: __(
				'All logos at once, static and centred.',
				'infinite-logo-carousel-block'
			),
			icon: 'screenoptions',
			attributes: { layout: 'grid' },
			scope: [ 'inserter', 'transform' ],
			isActive: layoutIs( 'grid' ),
		},
	],
	edit: Edit,
	save,
	deprecated,
} );
