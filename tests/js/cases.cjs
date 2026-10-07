/**
 * Attribute combinations every save() test renders: one per feature that
 * changes the saved markup.
 */
const image = ( n, extra = {} ) => ( {
	id: 100 + n,
	url: `https://example.com/wp-content/uploads/logo-${ n }.png`,
	alt: '',
	link: '',
	width: 300,
	height: 150,
	...extra,
} );

const five = [ 1, 2, 3, 4, 5 ].map( ( n ) => image( n ) );

const carousel = {
	default: { images: five },
	alts_and_links: {
		images: [
			image( 1, { alt: 'Acme', link: 'https://acme.example' } ),
			image( 2, { link: 'javascript:alert(1)' } ),
			image( 3, { link: 'https://beta.example' } ),
			image( 4 ),
		],
		linkTarget: '_blank',
		linkRel: 'sponsored',
	},
	link_title: {
		images: [ image( 1, { link: 'https://acme.example' } ), image( 2 ) ],
		linkTitle: 'Visit our partner',
	},
	pause_button: { images: five, showPauseButton: true },
	eager_label: { images: five, eagerLoading: true, ariaLabel: 'Our clients' },
	capsules_odd: {
		images: [ image( 1 ), image( 2 ), image( 3 ) ],
		capsuleEnabled: true,
		capsuleStyle: 'alternating',
	},
	capsules_outline_glow: {
		images: five,
		capsuleEnabled: true,
		capsuleStyle: 'outline',
		capsuleGlow: true,
	},
	rows_varied: {
		images: [ ...five, image( 6 ), image( 7 ) ],
		layout: 'rows',
		rowCount: 2,
		rowSpeedMode: 'varied',
	},
	colors: {
		images: five,
		logoColorMode: 'custom',
		logoCustomColor: '#ff0000',
		colorOnHover: true,
		overlayEnabled: false,
	},
	gray_balance: { images: five, logoColorMode: 'gray', balanceLogos: true },
	spotlight: {
		images: five,
		layout: 'spotlight',
		spotlightTransition: 'slide',
		spotlightAlign: 'left',
		showPauseButton: true,
	},
	spotlight_cycle: {
		images: five,
		layout: 'spotlight',
		spotlightColorMode: 'cycle',
		spotlightColors: [ '#ff0000', '#00ff00' ],
	},
	custom_sizes: {
		images: five,
		speed: 'custom',
		speedCustom: 33,
		gap: 'custom',
		gapCustom: 12,
		logoHeight: '80',
		logoHeightMobile: '40',
		marginSize: 'small',
	},
	grid: {
		images: [ image( 1 ), image( 2 ), image( 3 ) ],
		layout: 'grid',
		capsuleEnabled: true,
		capsuleStyle: 'alternating',
	},
	fade_reverse_newtab: {
		images: [
			image( 1, { link: 'https://acme.example', newTab: true } ),
			image( 2 ),
			image( 3 ),
		],
		overlayStyle: 'fade',
		reverseDirection: true,
		marginSize: 'none',
	},
};

const marquee = {
	default: { items: [ 'Design', 'Code', 'Video' ] },
	pause_reverse: {
		items: [ 'Eins', 'Zwei' ],
		showPauseButton: true,
		direction: 'reverse',
		separator: '',
		uppercase: true,
	},
};

// First release whose editor could produce a case. Older fixtures would
// describe content that never existed (e.g. layout "spotlight" in v1.x).
const since = {
	'carousel/custom_sizes': 'v1.7.0',
	'carousel/capsules_outline_glow': 'v1.5.0',
	'carousel/colors': 'v2.1.0',
	'carousel/gray_balance': 'v1.8.0',
	'carousel/pause_button': 'v2.0.0',
	'carousel/eager_label': 'v2.3.0',
	'carousel/spotlight': 'v2.2.0',
	'carousel/spotlight_cycle': 'v2.2.0',
	'carousel/grid': 'v2.4.0',
	'carousel/fade_reverse_newtab': 'v2.4.0',
};

module.exports = { carousel, marquee, since };
