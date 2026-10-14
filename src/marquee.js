/**
 * Text Marquee block — an infinitely scrolling text ticker that reuses the
 * Logo Slider's animation engine (same wrapper/track/item structure, same
 * frontend script, same CSS custom properties).
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InspectorControls,
	PanelColorSettings,
	URLInput,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	Button,
	CheckboxControl,
	SelectControl,
	TextControl,
	ToggleControl,
	RangeControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { isAllowedLink } from './carousel/logo-list';

const MQ_SPEED_MAP = { slow: '40s', medium: '25s', fast: '15s' };
const MQ_GAP_MAP = {
	small: '20px',
	medium: '40px',
	large: '60px',
	xlarge: '100px',
};
const MQ_MARGIN_MAP = { small: '25px', medium: '50px', large: '75px' };
const MQ_SIZE_MAP = {
	small: '16px',
	medium: '24px',
	large: '36px',
	xlarge: '48px',
};

const MARQUEE_ATTRIBUTES = {
	items: { type: 'array', default: [] },
	// v2.5: optional link per item, same index as items ({ url, newTab }).
	itemLinks: { type: 'array', default: [] },
	separator: { type: 'string', default: '★' },
	speed: { type: 'string', default: 'medium' },
	speedCustom: { type: 'number', default: 60 },
	direction: { type: 'string', default: 'normal' },
	gap: { type: 'string', default: 'medium' },
	gapCustom: { type: 'number', default: 40 },
	marginSize: { type: 'string', default: 'medium' },
	textSize: { type: 'string', default: 'medium' },
	textSizeCustom: { type: 'number', default: 24 },
	textColor: { type: 'string', default: '' },
	separatorColor: { type: 'string', default: '' },
	uppercase: { type: 'boolean', default: false },
	overlayEnabled: { type: 'boolean', default: false },
	overlayColor: { type: 'string', default: '#ffffff' },
	showPauseButton: { type: 'boolean', default: false },
};

/**
 * Number of times the item set is repeated inside the track (same heuristic
 * as the logo slider — short sets need more copies for a seamless loop).
 */
function marqueeRepeatCount( itemCount ) {
	let repeats = 2;
	if ( itemCount < 20 ) {
		repeats++;
	}
	if ( itemCount < 12 ) {
		repeats++;
	}
	if ( itemCount < 6 ) {
		repeats++;
	}
	if ( itemCount < 3 ) {
		repeats++;
	}
	return repeats;
}

function marqueeClasses( attributes ) {
	const classes = [ 'dbw-partner-slider', 'dbw-marquee' ];
	if ( ! attributes.overlayEnabled ) {
		classes.push( 'no-overlay' );
	}
	if ( attributes.uppercase ) {
		classes.push( 'dbw-mq-upper' );
	}
	// Without a separator the items are spaced via their own padding.
	if ( attributes.separator === '' ) {
		classes.push( 'dbw-mq-nosep' );
	}
	return classes.join( ' ' );
}

function marqueeStyle( attributes ) {
	const style = {
		'--scroll-duration':
			( attributes.speed === 'custom'
				? parseInt( attributes.speedCustom, 10 ) || 60
				: parseFloat( MQ_SPEED_MAP[ attributes.speed ] || '25s' ) ) +
			's',
		'--slide-gap':
			attributes.gap === 'custom'
				? ( parseInt( attributes.gapCustom, 10 ) || 40 ) + 'px'
				: MQ_GAP_MAP[ attributes.gap ] || '40px',
		'--outer-margin': MQ_MARGIN_MAP[ attributes.marginSize ] || '50px',
		'--mq-size':
			attributes.textSize === 'custom'
				? ( parseInt( attributes.textSizeCustom, 10 ) || 24 ) + 'px'
				: MQ_SIZE_MAP[ attributes.textSize ] || '24px',
	};
	if ( attributes.overlayEnabled ) {
		style[ '--overlay-color' ] = attributes.overlayColor || '#ffffff';
	}
	if ( attributes.textColor ) {
		style[ '--mq-color' ] = attributes.textColor;
	}
	if ( attributes.separatorColor ) {
		style[ '--mq-sep-color' ] = attributes.separatorColor;
	}
	return style;
}

/**
 * Render the marquee track. Repeated sets are aria-hidden so screen readers
 * announce the content only once.
 */
function renderMarqueeText( text, link, decorative ) {
	if ( ! link || ! link.url ) {
		return <span className="dbw-mq-text">{ text }</span>;
	}
	return (
		<a
			className="dbw-mq-text dbw-mq-link"
			href={ link.url }
			target={ link.newTab ? '_blank' : undefined }
			rel={ link.newTab ? 'noopener noreferrer' : undefined }
			// A copy in the loop must leave the tab order (its item is
			// aria-hidden).
			tabIndex={ decorative ? -1 : undefined }
		>
			{ text }
		</a>
	);
}

function renderMarqueeTrack( attributes ) {
	const links = attributes.itemLinks || [];
	// Keep each item's link with it while dropping empty items.
	const items = attributes.items
		.map( ( text, index ) => ( { text, link: links[ index ] } ) )
		.filter( ( item ) => item.text && item.text.trim() !== '' );
	const separator = attributes.separator;

	const renderSet = ( setIndex ) =>
		items.map( ( { text, link }, index ) => (
			<div
				key={ 's' + setIndex + '-' + index }
				className="dbw-slider-item"
				aria-hidden={ setIndex > 0 ? 'true' : undefined }
			>
				{ renderMarqueeText( text, link, setIndex > 0 ) }
				{ separator !== '' && (
					<span className="dbw-mq-sep" aria-hidden="true">
						{ separator }
					</span>
				) }
			</div>
		) );

	const repeats = marqueeRepeatCount( items.length );
	let trackItems = [];
	for ( let i = 0; i < repeats; i++ ) {
		trackItems = trackItems.concat( renderSet( i ) );
	}

	return (
		<div className="dbw-slider-wrapper">
			<div
				className="dbw-slider-track"
				data-logo-count={ items.length }
				data-direction={ attributes.direction }
			>
				{ trackItems }
			</div>
		</div>
	);
}

registerBlockType( 'infinite-logo-carousel-block/marquee', {
	apiVersion: 3,
	title: __( 'Text Marquee', 'infinite-logo-carousel-block' ),
	description: __(
		'Infinitely scrolling text ticker for reviews, badges, offers or announcements. Same smooth engine as the Logo Slider.',
		'infinite-logo-carousel-block'
	),
	icon: 'controls-forward',
	category: 'media',
	supports: {
		html: false,
		align: [ 'wide', 'full' ],
	},
	attributes: MARQUEE_ATTRIBUTES,

	edit: function MarqueeEdit( { attributes, setAttributes } ) {
		const {
			items,
			separator,
			speed,
			speedCustom,
			direction,
			gap,
			gapCustom,
			marginSize,
			textSize,
			textSizeCustom,
			textColor,
			separatorColor,
			uppercase,
			overlayEnabled,
			overlayColor,
			showPauseButton,
		} = attributes;

		const updateItem = ( value, index ) => {
			const updated = [ ...items ];
			updated[ index ] = value;
			setAttributes( { items: updated } );
		};

		const itemLinks = attributes.itemLinks || [];
		const updateLink = ( index, changes ) => {
			const next = [ ...itemLinks ];
			while ( next.length < items.length ) {
				next.push( null );
			}
			const merged = { ...( next[ index ] || {} ), ...changes };
			next[ index ] = merged.url ? merged : null;
			// No links left: store nothing, so the markup stays as before.
			setAttributes( {
				itemLinks: next.some( Boolean ) ? next : [],
			} );
		};

		const removeItem = ( index ) => {
			const nextLinks = itemLinks.filter( ( _, i ) => i !== index );
			setAttributes( {
				items: items.filter( ( _, i ) => i !== index ),
				itemLinks: nextLinks.some( Boolean ) ? nextLinks : [],
			} );
		};

		const blockProps = useBlockProps( {
			className: 'dbw-marquee-editor-wrapper',
		} );

		const hasContent = items.some( ( t ) => t && t.trim() !== '' );

		return (
			<div { ...blockProps }>
				<InspectorControls>
					<PanelBody
						title={ __( 'Speed', 'infinite-logo-carousel-block' ) }
						initialOpen={ true }
					>
						<SelectControl
							label={ __(
								'Scroll Speed',
								'infinite-logo-carousel-block'
							) }
							value={ speed }
							options={ [
								{
									label: __(
										'Slow',
										'infinite-logo-carousel-block'
									),
									value: 'slow',
								},
								{
									label: __(
										'Medium',
										'infinite-logo-carousel-block'
									),
									value: 'medium',
								},
								{
									label: __(
										'Fast',
										'infinite-logo-carousel-block'
									),
									value: 'fast',
								},
								{
									label: __(
										'Custom',
										'infinite-logo-carousel-block'
									),
									value: 'custom',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { speed: val } )
							}
						/>
						{ speed === 'custom' && (
							<RangeControl
								label={ __(
									'Custom Speed (seconds)',
									'infinite-logo-carousel-block'
								) }
								help={ __(
									'A higher value means slower scrolling.',
									'infinite-logo-carousel-block'
								) }
								value={ speedCustom }
								onChange={ ( val ) =>
									setAttributes( { speedCustom: val } )
								}
								min={ 5 }
								max={ 300 }
								step={ 5 }
							/>
						) }
						<SelectControl
							label={ __(
								'Direction',
								'infinite-logo-carousel-block'
							) }
							value={ direction }
							options={ [
								{
									label: __(
										'Right to left',
										'infinite-logo-carousel-block'
									),
									value: 'normal',
								},
								{
									label: __(
										'Left to right',
										'infinite-logo-carousel-block'
									),
									value: 'reverse',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { direction: val } )
							}
						/>
						<ToggleControl
							label={ __(
								'Show pause button',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'Adds a small pause/play button in the corner so visitors can stop the animation (recommended for accessibility).',
								'infinite-logo-carousel-block'
							) }
							checked={ showPauseButton }
							onChange={ ( val ) =>
								setAttributes( { showPauseButton: val } )
							}
						/>
					</PanelBody>
					<PanelBody
						title={ __(
							'Text Style',
							'infinite-logo-carousel-block'
						) }
						initialOpen={ false }
					>
						<SelectControl
							label={ __(
								'Text Size',
								'infinite-logo-carousel-block'
							) }
							value={ textSize }
							options={ [
								{
									label: __(
										'Small',
										'infinite-logo-carousel-block'
									),
									value: 'small',
								},
								{
									label: __(
										'Medium',
										'infinite-logo-carousel-block'
									),
									value: 'medium',
								},
								{
									label: __(
										'Large',
										'infinite-logo-carousel-block'
									),
									value: 'large',
								},
								{
									label: __(
										'Extra Large',
										'infinite-logo-carousel-block'
									),
									value: 'xlarge',
								},
								{
									label: __(
										'Custom',
										'infinite-logo-carousel-block'
									),
									value: 'custom',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { textSize: val } )
							}
						/>
						{ textSize === 'custom' && (
							<RangeControl
								label={ __(
									'Custom Text Size (px)',
									'infinite-logo-carousel-block'
								) }
								value={ textSizeCustom }
								onChange={ ( val ) =>
									setAttributes( { textSizeCustom: val } )
								}
								min={ 10 }
								max={ 120 }
								step={ 2 }
							/>
						) }
						<ToggleControl
							label={ __(
								'Uppercase',
								'infinite-logo-carousel-block'
							) }
							checked={ uppercase }
							onChange={ ( val ) =>
								setAttributes( { uppercase: val } )
							}
						/>
						<TextControl
							label={ __(
								'Separator',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'Character(s) shown between the items, e.g. ★ • | /. Leave empty for none.',
								'infinite-logo-carousel-block'
							) }
							value={ separator }
							onChange={ ( val ) =>
								setAttributes( { separator: val } )
							}
						/>
						<PanelColorSettings
							title={ __(
								'Colors',
								'infinite-logo-carousel-block'
							) }
							colorSettings={ [
								{
									value: textColor,
									onChange: ( color ) =>
										setAttributes( {
											textColor: color || '',
										} ),
									label: __(
										'Text color',
										'infinite-logo-carousel-block'
									),
								},
								{
									value: separatorColor,
									onChange: ( color ) =>
										setAttributes( {
											separatorColor: color || '',
										} ),
									label: __(
										'Separator color',
										'infinite-logo-carousel-block'
									),
								},
							] }
						/>
					</PanelBody>
					<PanelBody
						title={ __(
							'Spacing',
							'infinite-logo-carousel-block'
						) }
						initialOpen={ false }
					>
						<SelectControl
							label={ __(
								'Gap between items',
								'infinite-logo-carousel-block'
							) }
							value={ gap }
							options={ [
								{
									label: __(
										'Small',
										'infinite-logo-carousel-block'
									),
									value: 'small',
								},
								{
									label: __(
										'Medium',
										'infinite-logo-carousel-block'
									),
									value: 'medium',
								},
								{
									label: __(
										'Large',
										'infinite-logo-carousel-block'
									),
									value: 'large',
								},
								{
									label: __(
										'Extra Large',
										'infinite-logo-carousel-block'
									),
									value: 'xlarge',
								},
								{
									label: __(
										'Custom',
										'infinite-logo-carousel-block'
									),
									value: 'custom',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { gap: val } )
							}
						/>
						{ gap === 'custom' && (
							<RangeControl
								label={ __(
									'Custom Gap (px)',
									'infinite-logo-carousel-block'
								) }
								value={ gapCustom }
								onChange={ ( val ) =>
									setAttributes( { gapCustom: val } )
								}
								min={ 0 }
								max={ 200 }
								step={ 5 }
							/>
						) }
						<SelectControl
							label={ __(
								'Top/Bottom Margin',
								'infinite-logo-carousel-block'
							) }
							value={ marginSize }
							options={ [
								{
									label: __(
										'Small (25px)',
										'infinite-logo-carousel-block'
									),
									value: 'small',
								},
								{
									label: __(
										'Medium (50px)',
										'infinite-logo-carousel-block'
									),
									value: 'medium',
								},
								{
									label: __(
										'Large (75px)',
										'infinite-logo-carousel-block'
									),
									value: 'large',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { marginSize: val } )
							}
						/>
					</PanelBody>
					<PanelBody
						title={ __(
							'Overlay Settings',
							'infinite-logo-carousel-block'
						) }
						initialOpen={ false }
					>
						<ToggleControl
							label={ __(
								'Show Overlay',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'Shows a gradient overlay at the edges of the carousel.',
								'infinite-logo-carousel-block'
							) }
							checked={ overlayEnabled }
							onChange={ ( val ) =>
								setAttributes( { overlayEnabled: val } )
							}
						/>
						{ overlayEnabled && (
							<PanelColorSettings
								title={ __(
									'Overlay Color',
									'infinite-logo-carousel-block'
								) }
								colorSettings={ [
									{
										value: overlayColor,
										onChange: ( color ) =>
											setAttributes( {
												overlayColor:
													color || '#ffffff',
											} ),
										label: __(
											'Background color for overlay',
											'infinite-logo-carousel-block'
										),
									},
								] }
							/>
						) }
					</PanelBody>
				</InspectorControls>

				{ hasContent && (
					<div
						className={
							marqueeClasses( attributes ) +
							' dbw-ready dbw-editor-preview'
						}
						style={ marqueeStyle( attributes ) }
					>
						{ renderMarqueeTrack( attributes ) }
						{ showPauseButton && (
							<button
								className="dbw-pause-btn"
								type="button"
								aria-pressed="false"
								tabIndex={ -1 }
							></button>
						) }
					</div>
				) }

				<div className="dbw-marquee-editor">
					{ items.map( ( text, index ) => (
						<div className="dbw-marquee-editor-item" key={ index }>
							<TextControl
								label={ sprintf(
									/* translators: %d: position of the text item. */
									__(
										'Item %d',
										'infinite-logo-carousel-block'
									),
									index + 1
								) }
								value={ text }
								onChange={ ( val ) => updateItem( val, index ) }
								placeholder={ __(
									'e.g. ★ 5.0 Google Reviews',
									'infinite-logo-carousel-block'
								) }
							/>
							<div className="dbw-marquee-editor-link">
								<span className="components-base-control__label">
									{ __(
										'Link (optional)',
										'infinite-logo-carousel-block'
									) }
								</span>
								<URLInput
									__nextHasNoMarginBottom
									value={ itemLinks[ index ]?.url || '' }
									onChange={ ( url ) =>
										updateLink( index, { url } )
									}
								/>
								{ ! isAllowedLink(
									itemLinks[ index ]?.url
								) && (
									<p className="dbw-logo-card__error">
										{ __(
											'Only web, e-mail and phone links are allowed. This link is removed on the page.',
											'infinite-logo-carousel-block'
										) }
									</p>
								) }
								{ !! itemLinks[ index ]?.url && (
									<CheckboxControl
										__nextHasNoMarginBottom
										label={ __(
											'Open in new tab',
											'infinite-logo-carousel-block'
										) }
										checked={
											!! itemLinks[ index ]?.newTab
										}
										onChange={ ( newTab ) =>
											updateLink( index, {
												newTab: newTab || undefined,
											} )
										}
									/>
								) }
							</div>
							<Button
								isDestructive
								variant="secondary"
								className="dbw-remove-button"
								onClick={ () => removeItem( index ) }
							>
								{ __(
									'Remove',
									'infinite-logo-carousel-block'
								) }
							</Button>
						</div>
					) ) }
					<Button
						variant="primary"
						onClick={ () =>
							setAttributes( { items: [ ...items, '' ] } )
						}
					>
						{ __(
							'Add Text Item',
							'infinite-logo-carousel-block'
						) }
					</Button>
				</div>
			</div>
		);
	},

	save: ( { attributes } ) => {
		const blockProps = useBlockProps.save( {
			className: marqueeClasses( attributes ),
			style: marqueeStyle( attributes ),
		} );

		return (
			<div { ...blockProps }>
				{ renderMarqueeTrack( attributes ) }
				{ attributes.showPauseButton && (
					<button
						className="dbw-pause-btn"
						type="button"
						aria-pressed="false"
					></button>
				) }
			</div>
		);
	},
} );
