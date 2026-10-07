/**
 * Live render helpers for the current save() and the editor preview.
 *
 * The deprecations use their own frozen copy (deprecated/frozen-helpers.js),
 * so changing anything here can never invalidate existing content; the
 * block tests (npm run test:blocks) catch any change to the saved markup.
 */

import {
	SPEED_MAP,
	GAP_MAP,
	MARGIN_MAP,
	ROW_GAP_MAP,
	BALANCE_REF_RATIO,
	BALANCE_MIN_SCALE,
	BALANCE_MAX_SCALE,
	ROW_SPEED_FACTORS,
	CAPSULE_RADIUS_MAP,
	CAPSULE_PADDING_MAP,
	CAPSULE_BORDER_MAP,
	CAPSULE_GLOW_MAP,
	DEFAULT_SPOTLIGHT_COLORS,
	SPOTLIGHT_MIN_DURATION,
	SPOTLIGHT_MAX_DURATION,
} from './constants';

/* -------------------------------------------------------------------------- */
/*  Current save helpers (v1.3+)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Build the slider wrapper class list.
 */
function sliderClasses( attributes ) {
	const classes = [ 'dbw-partner-slider' ];
	if ( attributes.layout === 'rows' ) {
		classes.push( 'dbw-layout-rows' );
	}
	// Spotlight: one logo at a time, swapped on a timer (v2.2).
	if ( attributes.layout === 'spotlight' ) {
		classes.push( 'dbw-layout-spotlight' );
		classes.push( 'dbw-spot-' + getSpotlightTransition( attributes ) );
		classes.push( 'dbw-spot-align-' + getSpotlightAlign( attributes ) );
		if ( attributes.spotlightColorMode !== 'inherit' ) {
			classes.push( 'dbw-spot-tint' );
		}
	}
	if ( ! attributes.overlayEnabled ) {
		classes.push( 'no-overlay' );
	}
	// General logo colour (backward-compat: blackLogos still emits the
	// legacy class; new modes add their own class).
	if ( attributes.blackLogos ) {
		classes.push( 'black-logos' );
	}
	if ( ! attributes.blackLogos && attributes.logoColorMode === 'white' ) {
		classes.push( 'dbw-logos-white' );
	}
	if ( ! attributes.blackLogos && attributes.logoColorMode === 'custom' ) {
		classes.push( 'dbw-logos-custom' );
	}
	if ( ! attributes.blackLogos && attributes.logoColorMode === 'grayscale' ) {
		classes.push( 'dbw-logos-gray' );
	}
	// Restore original logo colors on hover — works with every color mode.
	if (
		attributes.colorOnHover &&
		( attributes.blackLogos ||
			attributes.logoColorMode !== 'original' ||
			( attributes.layout === 'spotlight' &&
				attributes.spotlightColorMode !== 'inherit' ) )
	) {
		classes.push( 'dbw-color-hover' );
	}
	// Balanced logo sizes (area-based). Only added when enabled, so existing
	// content keeps producing identical output.
	if ( attributes.balanceLogos ) {
		classes.push( 'dbw-balance' );
	}
	// v2.4: static logo grid, and the transparent edge fade. Both classes
	// only appear when chosen, so existing content keeps its markup.
	if ( attributes.layout === 'grid' ) {
		classes.push( 'dbw-layout-grid' );
	}
	if ( attributes.overlayEnabled && attributes.overlayStyle === 'fade' ) {
		classes.push( 'dbw-overlay-fade' );
	}
	if ( attributes.capsuleEnabled ) {
		classes.push( 'dbw-capsules' );
		if ( attributes.capsuleStyle === 'outline' ) {
			classes.push( 'dbw-cap-outline' );
		}
		if ( attributes.capsuleGlow ) {
			classes.push( 'dbw-cap-glow' );
		}
		// When a filled capsule's logo colour is explicitly chosen (not the
		// default auto-contrast), tell the frontend script to skip its
		// runtime contrast fix.
		if (
			attributes.capsuleLogoColor !== 'original' &&
			attributes.capsuleStyle !== 'outline'
		) {
			classes.push( 'dbw-cap-logo-manual' );
		}
	}
	return classes.join( ' ' );
}

/**
 * Build the CSS custom properties applied to the slider wrapper. The logo
 * count now lives per track (data-logo-count), not on the slider.
 */
function sliderStyle( attributes ) {
	const { gap, marginSize, overlayColor, logoHeight } = attributes;
	const style = {
		'--scroll-duration': getBaseDurationSeconds( attributes ) + 's',
		'--slide-gap':
			gap === 'custom'
				? ( parseInt( attributes.gapCustom, 10 ) || 40 ) + 'px'
				: GAP_MAP[ gap ] || '40px',
		'--outer-margin': MARGIN_MAP[ marginSize ] || '50px',
		'--overlay-color': overlayColor || '#ffffff',
		'--logo-height': logoHeight + 'px',
	};
	// Optional fixed logo height for phones. Only emitted when the user set a
	// value, so existing content keeps producing identical output (the CSS
	// falls back to the fluid clamp() formula when the property is absent).
	const mobileHeight = parseInt( attributes.logoHeightMobile, 10 );
	if ( mobileHeight > 0 ) {
		style[ '--logo-height-mobile' ] = mobileHeight + 'px';
		// Capsule padding presets are proportional to the logo height — emit
		// mobile values matching the mobile height (custom padding is an
		// absolute px value and stays as-is on phones).
		if (
			attributes.capsuleEnabled &&
			attributes.capsulePadding !== 'custom'
		) {
			const f =
				CAPSULE_PADDING_MAP[ attributes.capsulePadding ] ||
				CAPSULE_PADDING_MAP.medium;
			style[ '--capsule-pad-y-mobile' ] =
				Math.round( mobileHeight * f.y * 10 ) / 10 + 'px';
			style[ '--capsule-pad-x-mobile' ] =
				Math.round( mobileHeight * f.x * 10 ) / 10 + 'px';
		}
	}
	// Spotlight with a single tint colour: one filter for every logo, so the
	// items themselves stay style-free (the colour cycle sets it per item).
	if (
		attributes.layout === 'spotlight' &&
		attributes.spotlightColorMode === 'single'
	) {
		// Two ways to the same colour: --spot-color drives the exact mask
		// tint applied by the frontend script, --spot-filter is the
		// approximate CSS-filter fallback for when that script never runs.
		style[ '--spot-color' ] = attributes.spotlightColor || '#2563eb';
		style[ '--spot-filter' ] = computeColorFilter(
			attributes.spotlightColor
		);
	}
	// Custom logo colour filter (emitted regardless of capsules — the
	// capsule CSS reset neutralises it when capsules are active).
	if ( ! attributes.blackLogos && attributes.logoColorMode === 'custom' ) {
		style[ '--logo-filter' ] = computeColorFilter(
			attributes.logoCustomColor
		);
	}
	// Capsule custom properties are only added when capsules are enabled, so
	// that with capsules off the output stays identical to v1.3.
	if ( attributes.capsuleEnabled ) {
		style[ '--capsule-radius' ] = getCapsuleRadius( attributes );
		style[ '--capsule-color-a' ] = attributes.capsuleColorA || '#000000';
		style[ '--capsule-color-b' ] = attributes.capsuleColorB || '#ffffff';
		const pad = getCapsulePadding( attributes );
		style[ '--capsule-pad-y' ] = pad.y;
		style[ '--capsule-pad-x' ] = pad.x;
		// Emitted only for the styles that need them, so existing capsule
		// content keeps producing identical output.
		if ( attributes.capsuleStyle === 'outline' ) {
			style[ '--capsule-border-width' ] =
				getCapsuleBorderWidth( attributes );
		}
		if ( attributes.capsuleGlow ) {
			style[ '--capsule-glow-size' ] = getCapsuleGlowSize( attributes );
		}
	}
	// Row gap is only emitted for a non-default value, so multi-row content
	// created before this option still produces identical output.
	if ( attributes.layout === 'rows' && attributes.rowGap !== 'medium' ) {
		style[ '--row-gap' ] =
			attributes.rowGap === 'custom'
				? ( parseInt( attributes.rowGapCustom, 10 ) || 24 ) + 'px'
				: ROW_GAP_MAP[ attributes.rowGap ] || '24px';
	}
	return style;
}

/**
 * Resolve the capsule border-radius from the preset (or custom value).
 */
function getCapsuleRadius( attributes ) {
	if ( attributes.capsuleRadius === 'custom' ) {
		return ( parseInt( attributes.capsuleRadiusCustom, 10 ) || 0 ) + 'px';
	}
	return CAPSULE_RADIUS_MAP[ attributes.capsuleRadius ] || '999px';
}

/**
 * Resolve the capsule padding (vertical / horizontal) from the preset, or a
 * uniform pixel value for the custom option.
 */
function getCapsulePadding( attributes ) {
	if ( attributes.capsulePadding === 'custom' ) {
		const px =
			( parseInt( attributes.capsulePaddingCustom, 10 ) || 0 ) + 'px';
		return { y: px, x: px };
	}
	const f =
		CAPSULE_PADDING_MAP[ attributes.capsulePadding ] ||
		CAPSULE_PADDING_MAP.medium;
	return {
		y: 'calc(var(--logo-height, 50px) * ' + f.y + ')',
		x: 'calc(var(--logo-height, 50px) * ' + f.x + ')',
	};
}

/**
 * Resolve the outline border width from the preset (or custom value).
 */
function getCapsuleBorderWidth( attributes ) {
	if ( attributes.capsuleBorderWidth === 'custom' ) {
		return (
			( parseInt( attributes.capsuleBorderWidthCustom, 10 ) || 0 ) + 'px'
		);
	}
	return CAPSULE_BORDER_MAP[ attributes.capsuleBorderWidth ] || '2px';
}

/**
 * Resolve the glow size (box-shadow blur) from the preset (or custom value).
 */
function getCapsuleGlowSize( attributes ) {
	if ( attributes.capsuleGlowSize === 'custom' ) {
		return ( parseInt( attributes.capsuleGlowSizeCustom, 10 ) || 0 ) + 'px';
	}
	return CAPSULE_GLOW_MAP[ attributes.capsuleGlowSize ] || '14px';
}

/* -------------------------------------------------------------------------- */
/*  Spotlight helpers (v2.2)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the spotlight transition, guarding against unknown values.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} "fade", "slide" or "none".
 */
function getSpotlightTransition( attributes ) {
	const value = attributes.spotlightTransition;
	return value === 'slide' || value === 'none' ? value : 'fade';
}

/**
 * Resolve the spotlight alignment, guarding against unknown values.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} "left", "center" or "right".
 */
function getSpotlightAlign( attributes ) {
	const value = attributes.spotlightAlign;
	return value === 'left' || value === 'right' ? value : 'center';
}

/**
 * Hold time of a single logo, in milliseconds — written to the stage as a
 * data attribute and read by the frontend script.
 *
 * @param {Object} attributes Block attributes.
 * @return {number} Hold time in ms.
 */
function getSpotlightDurationMs( attributes ) {
	const seconds = parseFloat( attributes.spotlightDuration );
	const safe = isNaN( seconds ) ? 2 : seconds;
	return Math.round(
		Math.min(
			SPOTLIGHT_MAX_DURATION,
			Math.max( SPOTLIGHT_MIN_DURATION, safe )
		) * 1000
	);
}

/**
 * The colour cycle for spotlight mode. Falls back to the built-in palette
 * while the user has not picked any colour yet, so the mode never renders
 * uncoloured logos right after being switched on.
 *
 * @param {Object} attributes Block attributes.
 * @return {string[]} Hex colours.
 */
function getSpotlightColors( attributes ) {
	const colors = Array.isArray( attributes.spotlightColors )
		? attributes.spotlightColors.filter( Boolean )
		: [];
	return colors.length > 0 ? colors : DEFAULT_SPOTLIGHT_COLORS;
}

/**
 * Whether the exact tint (a coloured surface masked by the logo itself) can be
 * used. Capsules bring their own background, so they keep the filter tint.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} True when the mask tint applies.
 */
function usesSpotlightMask( attributes ) {
	return (
		attributes.layout === 'spotlight' &&
		attributes.spotlightColorMode !== 'inherit' &&
		! attributes.capsuleEnabled
	);
}

/**
 * Per-item CSS custom properties for spotlight mode. Only the colour cycle
 * needs them — a single tint colour is inherited from the slider element.
 *
 * @param {Object} attributes Block attributes.
 * @param {number} index      Position of the logo.
 * @return {?Object} Style object, or undefined when nothing is needed.
 */
function getSpotlightItemStyle( attributes, index ) {
	if ( attributes.spotlightColorMode !== 'cycle' ) {
		return undefined;
	}
	const colors = getSpotlightColors( attributes );
	const color = colors[ index % colors.length ];
	return {
		'--spot-color': color,
		'--spot-filter': computeColorFilter( color ),
	};
}

/**
 * Rough perceived-luminance check — used to pick a contrasting (black or
 * white) logo colour for a given capsule background.
 */
function isColorDark( hex ) {
	if ( typeof hex !== 'string' ) {
		return true;
	}
	let c = hex.replace( '#', '' ).trim();
	if ( c.length === 3 ) {
		c = c[ 0 ] + c[ 0 ] + c[ 1 ] + c[ 1 ] + c[ 2 ] + c[ 2 ];
	}
	if ( c.length !== 6 ) {
		return true;
	}
	const r = parseInt( c.slice( 0, 2 ), 16 );
	const g = parseInt( c.slice( 2, 4 ), 16 );
	const b = parseInt( c.slice( 4, 6 ), 16 );
	return ( 0.299 * r + 0.587 * g + 0.114 * b ) / 255 < 0.55;
}

/**
 * Compute a CSS filter string that tints any image to the given hex colour.
 * Pipeline: black → white → sepia (warm brown) → adjust hue/saturation/
 * brightness to reach the target. This is an approximation — perfectly exact
 * conversion from hex to CSS filter values is not possible, but the result
 * is close enough for logo tinting.
 */
function computeColorFilter( hex ) {
	if ( ! hex || typeof hex !== 'string' ) {
		return 'none';
	}
	let c = hex.replace( '#', '' ).trim();
	if ( c.length === 3 ) {
		c = c[ 0 ] + c[ 0 ] + c[ 1 ] + c[ 1 ] + c[ 2 ] + c[ 2 ];
	}
	if ( c.length !== 6 ) {
		return 'none';
	}

	const r = parseInt( c.slice( 0, 2 ), 16 ) / 255;
	const g = parseInt( c.slice( 2, 4 ), 16 ) / 255;
	const b = parseInt( c.slice( 4, 6 ), 16 ) / 255;

	const max = Math.max( r, g, b ),
		min = Math.min( r, g, b );
	let h = 0,
		s = 0;
	const l = ( max + min ) / 2;
	if ( max !== min ) {
		const d = max - min;
		s = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );
		if ( max === r ) {
			h = ( ( g - b ) / d + ( g < b ? 6 : 0 ) ) / 6;
		} else if ( max === g ) {
			h = ( ( b - r ) / d + 2 ) / 6;
		} else {
			h = ( ( r - g ) / d + 4 ) / 6;
		}
	}

	// CSS sepia base is approximately HSL(34, 100%, 78.4%).
	const hueRotate = h * 360 - 34;
	const saturate = Math.max( s, 0.01 );
	const brightness = Math.max( l / 0.784, 0.01 );

	return (
		'brightness(0) invert(1) sepia(1) saturate(' +
		saturate.toFixed( 2 ) +
		') hue-rotate(' +
		hueRotate.toFixed( 1 ) +
		'deg) brightness(' +
		brightness.toFixed( 2 ) +
		')'
	);
}

/**
 * Editor-preview approximation of the balanced logo scale. The front end
 * computes the same factor from the image's natural size at runtime.
 */
function getBalanceScale( image ) {
	if ( ! image || ! image.width || ! image.height ) {
		return 1;
	}
	const ratio = image.width / image.height;
	if ( ! ( ratio > 0 ) ) {
		return 1;
	}
	return Math.min(
		BALANCE_MAX_SCALE,
		Math.max( BALANCE_MIN_SCALE, Math.sqrt( BALANCE_REF_RATIO / ratio ) )
	);
}

/**
 * Wrap a logo (or its link) in a capsule container. The A/B colour is chosen
 * by position within the set so the pattern stays consistent across every
 * duplicated copy — and offset per row for a checkerboard look.
 */
function wrapInCapsule( content, rowIndex, index, capsuleProps ) {
	const useB =
		capsuleProps.style === 'alternating' && ( rowIndex + index ) % 2 === 1;
	const colorClass = useB ? 'dbw-cap-b' : 'dbw-cap-a';

	let logoClass;
	if ( capsuleProps.logoColor === 'none' ) {
		// Explicit "keep original colours" — no filter on any style.
		logoClass = '';
	} else if ( capsuleProps.logoColor === 'white' ) {
		logoClass = 'dbw-logo-light';
	} else if ( capsuleProps.logoColor === 'black' ) {
		logoClass = 'dbw-logo-dark';
	} else if ( capsuleProps.style === 'outline' ) {
		// Outline + default ("original") → no filter.
		logoClass = '';
	} else {
		// Filled + default ("original") → auto-contrast against background.
		const isDark = useB ? capsuleProps.colorBDark : capsuleProps.colorADark;
		logoClass = isDark ? 'dbw-logo-light' : 'dbw-logo-dark';
	}

	const className = ( 'dbw-capsule ' + colorClass + ' ' + logoClass ).trim();
	return <div className={ className }>{ content }</div>;
}

/**
 * Number of times one logo set is repeated inside a track. Fewer logos need
 * more copies so the track stays wider than the viewport for a seamless loop.
 */
function getRepeatCount( logoCount ) {
	let repeats = 2;
	if ( logoCount < 20 ) {
		repeats++;
	}
	if ( logoCount < 12 ) {
		repeats++;
	}
	if ( logoCount < 6 ) {
		repeats++;
	}
	if ( logoCount < 3 ) {
		repeats++;
	}
	return repeats;
}

/**
 * Base scroll duration in seconds — from the speed preset, or the custom value.
 */
function getBaseDurationSeconds( attributes ) {
	if ( attributes.speed === 'custom' ) {
		return parseInt( attributes.speedCustom, 10 ) || 60;
	}
	return parseFloat( SPEED_MAP[ attributes.speed ] || '25s' );
}

/**
 * Duration for a single row in "varied" speed mode.
 */
function getRowDuration( baseSeconds, rowIndex ) {
	const factor = ROW_SPEED_FACTORS[ rowIndex % ROW_SPEED_FACTORS.length ];
	return Math.round( baseSeconds * factor * 10 ) / 10 + 's';
}

/**
 * Distribute logos across `rowCount` rows. With `pairwise` the logos are handed
 * out two at a time, so an even total produces only even-length rows — needed
 * for a seamless capsule checkerboard. Otherwise they are interleaved.
 */
function distributeRows( images, rowCount, pairwise ) {
	const rows = [];
	for ( let r = 0; r < rowCount; r++ ) {
		rows.push( [] );
	}
	if ( pairwise ) {
		let r = 0;
		for ( let i = 0; i < images.length; i += 2 ) {
			rows[ r ].push( images[ i ] );
			if ( i + 1 < images.length ) {
				rows[ r ].push( images[ i + 1 ] );
			}
			r = ( r + 1 ) % rowCount;
		}
	} else {
		images.forEach( ( image, i ) => {
			rows[ i % rowCount ].push( image );
		} );
	}
	return rows.filter( ( row ) => row.length > 0 );
}

/**
 * Build the per-row image lists for the given attributes. Shared by save(),
 * the v1.8 deprecation and the editor live preview so all three stay in sync.
 *
 * In "rows" layout the logos are distributed across 2–4 rows; a capsule
 * checkerboard uses pair-based distribution and duplicates odd rows so two
 * same-coloured capsules never touch, not even at the loop seam.
 */
function buildSliderRows( attributes ) {
	const { images, layout, rowCount, capsuleEnabled, capsuleStyle } =
		attributes;
	const capsuleAlternating = capsuleEnabled && capsuleStyle === 'alternating';
	let rows;
	if ( layout === 'rows' ) {
		const count = Math.min(
			Math.max( parseInt( rowCount, 10 ) || 3, 2 ),
			4
		);
		rows = distributeRows( images, count, capsuleAlternating );
	} else {
		rows = [ images ];
	}
	// The checkerboard doubles an odd row so the colours keep alternating
	// across the loop seam; a static grid has no seam.
	if ( capsuleAlternating && layout !== 'grid' ) {
		rows = rows.map( ( row ) =>
			row.length % 2 === 1 ? row.concat( row ) : row
		);
	}
	return rows;
}

/**
 * Scroll direction of a row: adjacent rows run in opposite directions, and
 * "Reverse direction" (v2.4) flips them all.
 *
 * @param {Object} attributes Block attributes.
 * @param {number} rowIndex   Row index.
 * @return {string} "normal" or "reverse".
 */
function getTrackDirection( attributes, rowIndex ) {
	const reverse = ( rowIndex % 2 === 1 ) !== !! attributes.reverseDirection;
	return reverse ? 'reverse' : 'normal';
}

/**
 * Render a single logo — the <img>, wrapped in its link when one is set.
 * Shared by the scrolling tracks and the spotlight stage so both produce
 * byte-identical logo markup.
 *
 * @param {Object} image     Image data ({ url, alt, link, width, height }).
 * @param {Object} linkProps linkTarget / linkRel / linkTitle.
 * @param {string} loading   Image loading attribute.
 * @param {Object} opts      Editor-preview-only options ({ noLinks }).
 * @return {Object} The logo element.
 */
function renderLogoContent( image, linkProps, loading, opts, decorative ) {
	const { linkRel, linkTitle } = linkProps;
	// v2.4: a single logo can open in a new tab on its own.
	const linkTarget = image.newTab ? '_blank' : linkProps.linkTarget;
	const imgElement = (
		<img
			src={ image.url }
			// Repeated sets exist for the visual loop only. They carry no alt
			// text, so a screen reader announces every logo exactly once
			// instead of once per copy.
			alt={ decorative ? '' : image.alt || '' }
			width={ image.width || undefined }
			height={ image.height || undefined }
			loading={ loading }
			decoding="async"
		/>
	);
	return image.link && ! opts.noLinks ? (
		<a
			href={ image.link }
			target={ linkTarget || '_self' }
			rel={
				linkTarget === '_blank'
					? `noopener noreferrer${ linkRel ? ` ${ linkRel }` : '' }`
					: linkRel || undefined
			}
			title={ linkTitle || undefined }
			aria-label={ linkTitle || 'Logo Link' }
			// A duplicated link must leave the tab order — its item is
			// aria-hidden, and focusable content inside that is an error.
			tabIndex={ decorative ? -1 : undefined }
		>
			{ imgElement }
		</a>
	) : (
		imgElement
	);
}

/**
 * Render the spotlight stage: every logo stacked in the same grid cell, with
 * exactly one of them carrying .dbw-spot-active. The frontend script moves
 * that class along on a timer; without JavaScript the first logo simply
 * stays put.
 *
 * @param {Object} attributes   Block attributes.
 * @param {Object} linkProps    linkTarget / linkRel / linkTitle.
 * @param {Object} capsuleProps Capsule rendering options.
 * @param {number} activeIndex  Index of the logo shown first (editor preview
 *                              passes the currently rotating one).
 * @param {Object} opts         Editor-preview-only options ({ balance, noLinks }).
 * @return {Object} The stage element.
 */
function renderSpotlight(
	attributes,
	linkProps,
	capsuleProps,
	activeIndex = 0,
	opts = {}
) {
	const images = attributes.images || [];

	return (
		<div className="dbw-slider-wrapper">
			<div
				className="dbw-spotlight-stage"
				data-duration={ getSpotlightDurationMs( attributes ) }
				data-order={
					attributes.spotlightOrder === 'random'
						? 'random'
						: 'sequence'
				}
			>
				{ images.map( ( image, index ) => {
					const content = renderLogoContent(
						image,
						linkProps,
						opts.loading || 'lazy',
						opts,
						false
					);
					const style =
						getSpotlightItemStyle( attributes, index ) || {};
					if ( opts.balance ) {
						style[ '--logo-scale' ] =
							getBalanceScale( image ).toFixed( 3 );
					}
					// On the front end the script attaches the mask: the URL
					// must not travel inside the saved markup, where post
					// filtering can strip url() values. The editor preview is
					// never saved, so it can mask right away.
					if ( opts.mask && image.url ) {
						style[ '--dbw-mask' ] = 'url("' + image.url + '")';
					}
					return (
						<div
							key={ 'spot-' + index }
							className={
								'dbw-slider-item' +
								( index === activeIndex
									? ' dbw-spot-active'
									: '' ) +
								( opts.mask && image.url
									? ' dbw-spot-masked'
									: '' )
							}
							style={
								Object.keys( style ).length > 0
									? style
									: undefined
							}
						>
							{ capsuleProps.enabled
								? wrapInCapsule(
										content,
										0,
										index,
										capsuleProps
									)
								: content }
						</div>
					);
				} ) }
			</div>
		</div>
	);
}

/**
 * Render one scrolling track (one row).
 *
 * @param {Array}   rowImages    Images belonging to this row.
 * @param {number}  rowIndex     Zero-based row index (for keys).
 * @param {string}  direction    "normal" or "reverse" scroll direction.
 * @param {?string} duration     Optional per-row scroll duration (varied mode).
 * @param {Object}  linkProps    linkTarget / linkRel / linkTitle.
 * @param {Object}  capsuleProps Capsule rendering options.
 * @param {string}  loading      Image loading attribute.
 * @param {Object}  opts         Editor-preview-only options ({ balance, noLinks }).
 *                               Never passed by save(), so saved markup stays
 *                               byte-identical.
 */
function renderTrack(
	rowImages,
	rowIndex,
	direction,
	duration,
	linkProps,
	capsuleProps,
	loading = 'lazy',
	opts = {}
) {
	const renderSet = ( setIndex ) =>
		rowImages.map( ( image, index ) => {
			// Everything past the first set is a visual copy.
			const decorative = setIndex > 0;
			const content = renderLogoContent(
				image,
				linkProps,
				loading,
				opts,
				decorative
			);
			return (
				<div
					key={ 's' + setIndex + '-' + index }
					className="dbw-slider-item"
					aria-hidden={ decorative ? 'true' : undefined }
					style={
						opts.balance
							? {
									'--logo-scale':
										getBalanceScale( image ).toFixed( 3 ),
								}
							: undefined
					}
				>
					{ capsuleProps.enabled
						? wrapInCapsule(
								content,
								rowIndex,
								index,
								capsuleProps
							)
						: content }
				</div>
			);
		} );

	// A static grid shows every logo once.
	const repeats = opts.repeats || getRepeatCount( rowImages.length );
	let items = [];
	for ( let i = 0; i < repeats; i++ ) {
		items = items.concat( renderSet( i ) );
	}

	return (
		<div className="dbw-slider-wrapper" key={ 'dbw-row-' + rowIndex }>
			<div
				className="dbw-slider-track"
				data-logo-count={ rowImages.length }
				data-direction={ direction }
				style={
					duration ? { '--scroll-duration': duration } : undefined
				}
			>
				{ items }
			</div>
		</div>
	);
}

export {
	sliderClasses,
	sliderStyle,
	getCapsuleRadius,
	getCapsulePadding,
	getCapsuleBorderWidth,
	getCapsuleGlowSize,
	getSpotlightTransition,
	getSpotlightAlign,
	getSpotlightDurationMs,
	getSpotlightColors,
	usesSpotlightMask,
	getSpotlightItemStyle,
	isColorDark,
	computeColorFilter,
	getBalanceScale,
	wrapInCapsule,
	getRepeatCount,
	getBaseDurationSeconds,
	getRowDuration,
	distributeRows,
	buildSliderRows,
	renderLogoContent,
	renderSpotlight,
	renderTrack,
	getTrackDirection,
};
