import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	PanelColorSettings,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
	Button,
	SelectControl,
	TextControl,
	ToggleControl,
	RangeControl,
	ColorPalette,
} from '@wordpress/components';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import LogoList, { mediaToLogo } from './logo-list';
import { SPOTLIGHT_MIN_DURATION, SPOTLIGHT_MAX_DURATION } from './constants';
import {
	sliderClasses,
	sliderStyle,
	getSpotlightDurationMs,
	getSpotlightColors,
	usesSpotlightMask,
	isColorDark,
	getBaseDurationSeconds,
	getRowDuration,
	buildSliderRows,
	renderSpotlight,
	renderTrack,
	getTrackDirection,
} from './helpers';

const Edit = ( { attributes, setAttributes } ) => {
	const {
		images,
		speed,
		speedCustom,
		gap,
		gapCustom,
		marginSize,
		logoHeight,
		logoHeightMobile,
		balanceLogos,
		showPauseButton,
		eagerLoading,
		ariaLabel,
		overlayEnabled,
		overlayColor,
		overlayStyle,
		reverseDirection,
		blackLogos,
		logoColorMode,
		logoCustomColor,
		colorOnHover,
		linkTarget,
		linkRel,
		linkTitle,
		layout,
		spotlightDuration,
		spotlightTransition,
		spotlightOrder,
		spotlightAlign,
		spotlightColorMode,
		spotlightColor,
		rowCount,
		rowSpeedMode,
		rowGap,
		rowGapCustom,
		capsuleEnabled,
		capsuleStyle,
		capsuleRadius,
		capsuleRadiusCustom,
		capsulePadding,
		capsulePaddingCustom,
		capsuleColorA,
		capsuleColorB,
		capsuleBorderWidth,
		capsuleBorderWidthCustom,
		capsuleLogoColor,
		capsuleGlow,
		capsuleGlowSize,
		capsuleGlowSizeCustom,
	} = attributes;

	const addImage = ( selection ) => {
		const selected = Array.isArray( selection ) ? selection : [ selection ];
		setAttributes( {
			images: [ ...images, ...selected.map( mediaToLogo ) ],
		} );
	};

	// Spotlight colour cycle: the list always mirrors what is rendered, so
	// switching the mode on seeds it with the built-in palette.
	const spotColorList = getSpotlightColors( attributes );
	const setSpotColorList = ( list ) =>
		setAttributes( { spotlightColors: list } );
	const updateSpotColor = ( index, color ) => {
		const list = [ ...spotColorList ];
		list[ index ] = color || '#000000';
		setSpotColorList( list );
	};
	const addSpotColor = () => {
		setSpotColorList( [
			...spotColorList,
			spotColorList[ spotColorList.length - 1 ] || '#2563eb',
		] );
	};
	const removeSpotColor = ( index ) => {
		setSpotColorList( spotColorList.filter( ( _, i ) => i !== index ) );
	};

	// One place for the logo colour, in every layout. In spotlight mode the
	// two extra modes (a single exact colour and the colour cycle) join the
	// same dropdown instead of opening a second colour control elsewhere.
	let logoColorValue = blackLogos ? 'black' : logoColorMode;
	if ( layout === 'spotlight' && spotlightColorMode === 'cycle' ) {
		logoColorValue = 'cycle';
	} else if ( layout === 'spotlight' && spotlightColorMode === 'single' ) {
		logoColorValue = 'custom';
	}

	const setLogoColorMode = ( value ) => {
		if ( layout !== 'spotlight' ) {
			setAttributes( {
				logoColorMode: value,
				blackLogos: value === 'black',
			} );
			return;
		}
		if ( value === 'cycle' ) {
			setAttributes( {
				spotlightColorMode: 'cycle',
				spotlightColors: spotColorList,
				logoColorMode: 'original',
				blackLogos: false,
			} );
			return;
		}
		if ( value === 'custom' ) {
			setAttributes( {
				spotlightColorMode: 'single',
				// Carry over a colour the user had already picked for the
				// filter-based custom mode.
				spotlightColor:
					logoColorMode === 'custom'
						? logoCustomColor
						: spotlightColor,
				logoColorMode: 'original',
				blackLogos: false,
			} );
			return;
		}
		setAttributes( {
			spotlightColorMode: 'inherit',
			logoColorMode: value,
			blackLogos: value === 'black',
		} );
	};

	// Spotlight live preview: the frontend script does not run inside the
	// editor, so the editor rotates the active logo itself.
	const [ spotIndex, setSpotIndex ] = useState( 0 );
	const spotCount = images.length;
	const spotDuration = getSpotlightDurationMs( attributes );
	useEffect( () => {
		if ( layout !== 'spotlight' || spotCount < 2 ) {
			return undefined;
		}
		const interval = setInterval( () => {
			setSpotIndex( ( current ) => ( current + 1 ) % spotCount );
		}, spotDuration );
		return () => clearInterval( interval );
	}, [ layout, spotCount, spotDuration ] );

	// Live preview: same markup and CSS as the front end, animated by the
	// stylesheet's fallback animation. Links are disabled and the reveal
	// class is pre-applied so the preview shows immediately.
	const previewCapsuleProps = {
		enabled: capsuleEnabled,
		style: capsuleStyle,
		colorADark: isColorDark( capsuleColorA ),
		colorBDark: isColorDark( capsuleColorB ),
		logoColor: capsuleLogoColor,
	};
	const previewLinkProps = { linkTarget, linkRel, linkTitle };
	const previewRows = buildSliderRows( attributes );

	const blockProps = useBlockProps( {
		className: 'dbw-partner-slider-editor-wrapper',
	} );

	return (
		<div { ...blockProps }>
			{ images.length > 0 && (
				<BlockControls>
					<ToolbarGroup>
						<MediaUpload
							onSelect={ addImage }
							allowedTypes={ [ 'image' ] }
							multiple
							render={ ( { open } ) => (
								<ToolbarButton onClick={ open }>
									{ __(
										'Add logos',
										'infinite-logo-carousel-block'
									) }
								</ToolbarButton>
							) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			<InspectorControls>
				<PanelBody
					title={ __( 'Logos', 'infinite-logo-carousel-block' ) }
				>
					<LogoList
						images={ images }
						setAttributes={ setAttributes }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Layout', 'infinite-logo-carousel-block' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __(
							'Display Mode',
							'infinite-logo-carousel-block'
						) }
						value={ layout }
						options={ [
							{
								label: __(
									'Single Row',
									'infinite-logo-carousel-block'
								),
								value: 'single',
							},
							{
								label: __(
									'Multiple Rows',
									'infinite-logo-carousel-block'
								),
								value: 'rows',
							},
							{
								label: __(
									'Static Grid (no motion)',
									'infinite-logo-carousel-block'
								),
								value: 'grid',
							},
							{
								label: __(
									'Spotlight (one logo at a time)',
									'infinite-logo-carousel-block'
								),
								value: 'spotlight',
							},
						] }
						onChange={ ( val ) => setAttributes( { layout: val } ) }
					/>
					{ layout === 'rows' && (
						<Fragment>
							<RangeControl
								label={ __(
									'Number of Rows',
									'infinite-logo-carousel-block'
								) }
								value={ rowCount }
								onChange={ ( val ) =>
									setAttributes( { rowCount: val } )
								}
								min={ 2 }
								max={ 4 }
								step={ 1 }
							/>
							<SelectControl
								label={ __(
									'Row Gap',
									'infinite-logo-carousel-block'
								) }
								value={ rowGap }
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
									setAttributes( { rowGap: val } )
								}
							/>
							{ rowGap === 'custom' && (
								<RangeControl
									label={ __(
										'Custom Row Gap (px)',
										'infinite-logo-carousel-block'
									) }
									value={ rowGapCustom }
									onChange={ ( val ) =>
										setAttributes( { rowGapCustom: val } )
									}
									min={ 0 }
									max={ 150 }
									step={ 2 }
								/>
							) }
							<SelectControl
								label={ __(
									'Row Speed',
									'infinite-logo-carousel-block'
								) }
								help={ __(
									'Uniform: all rows move at the same speed. Varied: each row moves slightly differently for a more dynamic look.',
									'infinite-logo-carousel-block'
								) }
								value={ rowSpeedMode }
								options={ [
									{
										label: __(
											'Uniform',
											'infinite-logo-carousel-block'
										),
										value: 'uniform',
									},
									{
										label: __(
											'Varied',
											'infinite-logo-carousel-block'
										),
										value: 'varied',
									},
								] }
								onChange={ ( val ) =>
									setAttributes( { rowSpeedMode: val } )
								}
							/>
							<p>
								{ __(
									'Logos are distributed evenly across the rows. Adjacent rows scroll in opposite directions.',
									'infinite-logo-carousel-block'
								) }
							</p>
						</Fragment>
					) }
				</PanelBody>
				{ layout === 'spotlight' && (
					<PanelBody
						title={ __(
							'Spotlight',
							'infinite-logo-carousel-block'
						) }
						initialOpen={ true }
					>
						<RangeControl
							label={ __(
								'Time per Logo (seconds)',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'How long each logo stays visible before the next one takes over.',
								'infinite-logo-carousel-block'
							) }
							value={ spotlightDuration }
							onChange={ ( val ) =>
								setAttributes( {
									spotlightDuration:
										val || SPOTLIGHT_MIN_DURATION,
								} )
							}
							min={ SPOTLIGHT_MIN_DURATION }
							max={ SPOTLIGHT_MAX_DURATION }
							step={ 0.5 }
						/>
						<SelectControl
							label={ __(
								'Transition',
								'infinite-logo-carousel-block'
							) }
							value={ spotlightTransition }
							options={ [
								{
									label: __(
										'Fade',
										'infinite-logo-carousel-block'
									),
									value: 'fade',
								},
								{
									label: __(
										'Slide up',
										'infinite-logo-carousel-block'
									),
									value: 'slide',
								},
								{
									label: __(
										'Hard cut',
										'infinite-logo-carousel-block'
									),
									value: 'none',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( {
									spotlightTransition: val,
								} )
							}
						/>
						<SelectControl
							label={ __(
								'Order',
								'infinite-logo-carousel-block'
							) }
							value={ spotlightOrder }
							options={ [
								{
									label: __(
										'As added',
										'infinite-logo-carousel-block'
									),
									value: 'sequence',
								},
								{
									label: __(
										'Random',
										'infinite-logo-carousel-block'
									),
									value: 'random',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { spotlightOrder: val } )
							}
						/>
						<SelectControl
							label={ __(
								'Alignment',
								'infinite-logo-carousel-block'
							) }
							value={ spotlightAlign }
							options={ [
								{
									label: __(
										'Left',
										'infinite-logo-carousel-block'
									),
									value: 'left',
								},
								{
									label: __(
										'Center',
										'infinite-logo-carousel-block'
									),
									value: 'center',
								},
								{
									label: __(
										'Right',
										'infinite-logo-carousel-block'
									),
									value: 'right',
								},
							] }
							onChange={ ( val ) =>
								setAttributes( { spotlightAlign: val } )
							}
						/>
						<p>
							{ __(
								'Every logo takes its turn in the same spot. The edge gradient and the scrolling speed do not apply in this mode.',
								'infinite-logo-carousel-block'
							) }
						</p>
					</PanelBody>
				) }
				<PanelBody
					title={ __( 'Motion', 'infinite-logo-carousel-block' ) }
					initialOpen={ true }
				>
					{ layout !== 'spotlight' && layout !== 'grid' && (
						<Fragment>
							<SelectControl
								label={ __(
									'Carousel Speed',
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
							<ToggleControl
								label={ __(
									'Reverse direction',
									'infinite-logo-carousel-block'
								) }
								help={ __(
									'Logos move from left to right instead. With several rows, every row flips.',
									'infinite-logo-carousel-block'
								) }
								checked={ !! reverseDirection }
								onChange={ ( val ) =>
									setAttributes( { reverseDirection: val } )
								}
							/>
						</Fragment>
					) }
					{ layout !== 'grid' && (
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
					) }
					{ layout === 'grid' && (
						<p>
							{ __(
								'The static grid shows every logo once, without any motion.',
								'infinite-logo-carousel-block'
							) }
						</p>
					) }
				</PanelBody>
				<PanelBody
					title={ __(
						'Accessibility & Loading',
						'infinite-logo-carousel-block'
					) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __(
							'Load images immediately',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Logos load lazily by default, which keeps the page fast. Turn this on only if the carousel sits at the very top of the page, above the fold.',
							'infinite-logo-carousel-block'
						) }
						checked={ eagerLoading }
						onChange={ ( val ) =>
							setAttributes( { eagerLoading: val } )
						}
					/>
					<TextControl
						label={ __(
							'Screen reader label (optional)',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Gives the carousel a name for screen readers, e.g. "Our clients". Leave empty to add no landmark at all.',
							'infinite-logo-carousel-block'
						) }
						value={ ariaLabel }
						placeholder={ __(
							'Our clients',
							'infinite-logo-carousel-block'
						) }
						onChange={ ( val ) =>
							setAttributes( { ariaLabel: val } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Spacing', 'infinite-logo-carousel-block' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __(
							'Gap between logos',
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
						onChange={ ( val ) => setAttributes( { gap: val } ) }
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
									'None',
									'infinite-logo-carousel-block'
								),
								value: 'none',
							},
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
					title={ __( 'Logo Size', 'infinite-logo-carousel-block' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __(
							'Maximum Logo Height (px)',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Sets the maximum height for logos. Width adjusts automatically.',
							'infinite-logo-carousel-block'
						) }
						value={ parseInt( logoHeight ) }
						onChange={ ( val ) =>
							setAttributes( { logoHeight: val.toString() } )
						}
						min={ 30 }
						max={ 150 }
						step={ 5 }
					/>
					<SelectControl
						label={ __(
							'Quick Select',
							'infinite-logo-carousel-block'
						) }
						value={ logoHeight }
						options={ [
							{
								label: __(
									'Small (40px)',
									'infinite-logo-carousel-block'
								),
								value: '40',
							},
							{
								label: __(
									'Medium (50px)',
									'infinite-logo-carousel-block'
								),
								value: '50',
							},
							{
								label: __(
									'Large (70px)',
									'infinite-logo-carousel-block'
								),
								value: '70',
							},
							{
								label: __(
									'Extra Large (100px)',
									'infinite-logo-carousel-block'
								),
								value: '100',
							},
						] }
						onChange={ ( val ) =>
							setAttributes( { logoHeight: val } )
						}
					/>
					<ToggleControl
						label={ __(
							'Balance logo sizes',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Compensates different logo proportions: wide logos render slightly smaller, compact logos slightly larger, so every logo carries similar visual weight.',
							'infinite-logo-carousel-block'
						) }
						checked={ balanceLogos }
						onChange={ ( val ) =>
							setAttributes( { balanceLogos: val } )
						}
					/>
					<ToggleControl
						label={ __(
							'Custom height on phones',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'By default, logos scale down automatically on small screens. Enable this to set a fixed logo height for phones instead.',
							'infinite-logo-carousel-block'
						) }
						checked={ logoHeightMobile !== '' }
						onChange={ ( val ) =>
							setAttributes( {
								logoHeightMobile: val
									? String(
											Math.max(
												20,
												Math.round(
													( parseInt(
														logoHeight,
														10
													) *
														0.6 ) /
														5
												) * 5
											)
										)
									: '',
							} )
						}
					/>
					{ logoHeightMobile !== '' && (
						<RangeControl
							label={ __(
								'Mobile Logo Height (px)',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'Applies on screens narrower than 600px.',
								'infinite-logo-carousel-block'
							) }
							value={ parseInt( logoHeightMobile, 10 ) }
							onChange={ ( val ) =>
								setAttributes( {
									logoHeightMobile: val.toString(),
								} )
							}
							min={ 20 }
							max={ 120 }
							step={ 5 }
						/>
					) }
				</PanelBody>
				{ layout !== 'spotlight' && layout !== 'grid' && (
					<PanelBody
						title={ __(
							'Edge Fade',
							'infinite-logo-carousel-block'
						) }
						initialOpen={ false }
					>
						<ToggleControl
							label={ __(
								'Fade out at the edges',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'Logos fade in and out at the left and right edge.',
								'infinite-logo-carousel-block'
							) }
							checked={ overlayEnabled }
							onChange={ ( val ) =>
								setAttributes( { overlayEnabled: val } )
							}
						/>
						{ overlayEnabled && (
							<SelectControl
								label={ __(
									'Fade style',
									'infinite-logo-carousel-block'
								) }
								value={
									overlayStyle === 'fade' && ! capsuleGlow
										? 'fade'
										: 'color'
								}
								options={ [
									{
										label: __(
											'Transparent (any background)',
											'infinite-logo-carousel-block'
										),
										value: 'fade',
									},
									{
										label: __(
											'Color overlay',
											'infinite-logo-carousel-block'
										),
										value: 'color',
									},
								] }
								disabled={ capsuleGlow }
								help={
									capsuleGlow
										? __(
												'Capsules with a glow use the color overlay, so the glow is not cut off.',
												'infinite-logo-carousel-block'
											)
										: __(
												'Transparent works on images and gradients too. The color overlay paints the edges in one color.',
												'infinite-logo-carousel-block'
											)
								}
								onChange={ ( val ) =>
									setAttributes( { overlayStyle: val } )
								}
							/>
						) }
						{ overlayEnabled &&
							( overlayStyle !== 'fade' || capsuleGlow ) && (
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
				) }
				<PanelBody
					title={ __(
						'Logo Display',
						'infinite-logo-carousel-block'
					) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __(
							'Logo Color',
							'infinite-logo-carousel-block'
						) }
						help={
							layout === 'spotlight'
								? __(
										'One color, or a color cycle that gives every logo its own color in turn.',
										'infinite-logo-carousel-block'
									)
								: __(
										'Applies a uniform color to all logos for a cohesive look.',
										'infinite-logo-carousel-block'
									)
						}
						value={ logoColorValue }
						options={ [
							{
								label: __(
									'Original',
									'infinite-logo-carousel-block'
								),
								value: 'original',
							},
							{
								label: __(
									'Black',
									'infinite-logo-carousel-block'
								),
								value: 'black',
							},
							{
								label: __(
									'White',
									'infinite-logo-carousel-block'
								),
								value: 'white',
							},
							{
								label: __(
									'Grayscale',
									'infinite-logo-carousel-block'
								),
								value: 'grayscale',
							},
							{
								label: __(
									'Custom Color',
									'infinite-logo-carousel-block'
								),
								value: 'custom',
							},
							...( layout === 'spotlight'
								? [
										{
											label: __(
												'Color cycle',
												'infinite-logo-carousel-block'
											),
											value: 'cycle',
										},
									]
								: [] ),
						] }
						onChange={ setLogoColorMode }
					/>
					{ logoColorValue === 'custom' && (
						<Fragment>
							<p className="components-base-control__label">
								{ __(
									'Custom Color',
									'infinite-logo-carousel-block'
								) }
							</p>
							<ColorPalette
								value={
									layout === 'spotlight'
										? spotlightColor
										: logoCustomColor
								}
								onChange={ ( color ) =>
									setAttributes(
										layout === 'spotlight'
											? {
													spotlightColor:
														color || '#2563eb',
												}
											: {
													logoCustomColor:
														color || '#999999',
												}
									)
								}
							/>
						</Fragment>
					) }
					{ logoColorValue === 'cycle' && (
						<div className="dbw-spot-color-list">
							{ spotColorList.map( ( color, index ) => (
								<div
									className="dbw-spot-color-row"
									key={ 'spot-color-' + index }
								>
									<p className="components-base-control__label">
										{ sprintf(
											/* translators: %d: position of the colour in the cycle. */
											__(
												'Color %d',
												'infinite-logo-carousel-block'
											),
											index + 1
										) }
									</p>
									<ColorPalette
										value={ color }
										onChange={ ( value ) =>
											updateSpotColor( index, value )
										}
									/>
									{ spotColorList.length > 1 && (
										<Button
											isDestructive
											variant="tertiary"
											onClick={ () =>
												removeSpotColor( index )
											}
										>
											{ __(
												'Remove color',
												'infinite-logo-carousel-block'
											) }
										</Button>
									) }
								</div>
							) ) }
							<Button
								variant="secondary"
								onClick={ addSpotColor }
							>
								{ __(
									'Add color',
									'infinite-logo-carousel-block'
								) }
							</Button>
						</div>
					) }
					{ logoColorValue !== 'original' && (
						<ToggleControl
							label={ __(
								'Original colors on hover',
								'infinite-logo-carousel-block'
							) }
							help={ __(
								'The logo returns to its original colors when the visitor hovers over it. Works with every color mode.',
								'infinite-logo-carousel-block'
							) }
							checked={ colorOnHover }
							onChange={ ( val ) =>
								setAttributes( { colorOnHover: val } )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __(
						'Capsule Style',
						'infinite-logo-carousel-block'
					) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __(
							'Enable Capsules',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Places each logo inside a rounded background container.',
							'infinite-logo-carousel-block'
						) }
						checked={ capsuleEnabled }
						onChange={ ( val ) =>
							setAttributes( { capsuleEnabled: val } )
						}
					/>
					{ capsuleEnabled && (
						<Fragment>
							<SelectControl
								label={ __(
									'Background Style',
									'infinite-logo-carousel-block'
								) }
								help={ __(
									'Uniform: all capsules use one color. Alternating: capsules alternate between two colors in a checkerboard.',
									'infinite-logo-carousel-block'
								) }
								value={ capsuleStyle }
								options={ [
									{
										label: __(
											'Uniform',
											'infinite-logo-carousel-block'
										),
										value: 'uniform',
									},
									{
										label: __(
											'Alternating',
											'infinite-logo-carousel-block'
										),
										value: 'alternating',
									},
									{
										label: __(
											'Outline',
											'infinite-logo-carousel-block'
										),
										value: 'outline',
									},
								] }
								onChange={ ( val ) =>
									setAttributes( { capsuleStyle: val } )
								}
							/>
							<SelectControl
								label={ __(
									'Corner Style',
									'infinite-logo-carousel-block'
								) }
								value={ capsuleRadius }
								options={ [
									{
										label: __(
											'Square',
											'infinite-logo-carousel-block'
										),
										value: 'square',
									},
									{
										label: __(
											'Rounded',
											'infinite-logo-carousel-block'
										),
										value: 'rounded',
									},
									{
										label: __(
											'Pill',
											'infinite-logo-carousel-block'
										),
										value: 'pill',
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
									setAttributes( { capsuleRadius: val } )
								}
							/>
							{ capsuleRadius === 'custom' && (
								<RangeControl
									label={ __(
										'Custom Corner Radius (px)',
										'infinite-logo-carousel-block'
									) }
									value={ capsuleRadiusCustom }
									onChange={ ( val ) =>
										setAttributes( {
											capsuleRadiusCustom: val,
										} )
									}
									min={ 0 }
									max={ 100 }
									step={ 1 }
								/>
							) }
							<SelectControl
								label={ __(
									'Padding',
									'infinite-logo-carousel-block'
								) }
								value={ capsulePadding }
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
											'Custom',
											'infinite-logo-carousel-block'
										),
										value: 'custom',
									},
								] }
								onChange={ ( val ) =>
									setAttributes( { capsulePadding: val } )
								}
							/>
							{ capsulePadding === 'custom' && (
								<RangeControl
									label={ __(
										'Custom Padding (px)',
										'infinite-logo-carousel-block'
									) }
									value={ capsulePaddingCustom }
									onChange={ ( val ) =>
										setAttributes( {
											capsulePaddingCustom: val,
										} )
									}
									min={ 0 }
									max={ 80 }
									step={ 2 }
								/>
							) }
							<PanelColorSettings
								title={ __(
									'Capsule Colors',
									'infinite-logo-carousel-block'
								) }
								colorSettings={
									capsuleStyle === 'alternating'
										? [
												{
													value: capsuleColorA,
													onChange: ( color ) =>
														setAttributes( {
															capsuleColorA:
																color ||
																'#000000',
														} ),
													label: __(
														'Color A',
														'infinite-logo-carousel-block'
													),
												},
												{
													value: capsuleColorB,
													onChange: ( color ) =>
														setAttributes( {
															capsuleColorB:
																color ||
																'#ffffff',
														} ),
													label: __(
														'Color B',
														'infinite-logo-carousel-block'
													),
												},
											]
										: [
												{
													value: capsuleColorA,
													onChange: ( color ) =>
														setAttributes( {
															capsuleColorA:
																color ||
																'#000000',
														} ),
													label: __(
														'Capsule color',
														'infinite-logo-carousel-block'
													),
												},
											]
								}
							/>
							{ capsuleStyle === 'outline' && (
								<SelectControl
									label={ __(
										'Border Width',
										'infinite-logo-carousel-block'
									) }
									value={ capsuleBorderWidth }
									options={ [
										{
											label: __(
												'Thin',
												'infinite-logo-carousel-block'
											),
											value: 'thin',
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
												'Thick',
												'infinite-logo-carousel-block'
											),
											value: 'thick',
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
										setAttributes( {
											capsuleBorderWidth: val,
										} )
									}
								/>
							) }
							{ capsuleStyle === 'outline' &&
								capsuleBorderWidth === 'custom' && (
									<RangeControl
										label={ __(
											'Custom Border Width (px)',
											'infinite-logo-carousel-block'
										) }
										value={ capsuleBorderWidthCustom }
										onChange={ ( val ) =>
											setAttributes( {
												capsuleBorderWidthCustom: val,
											} )
										}
										min={ 1 }
										max={ 10 }
										step={ 1 }
									/>
								) }
							<SelectControl
								label={ __(
									'Logo Color',
									'infinite-logo-carousel-block'
								) }
								help={
									capsuleStyle === 'outline'
										? __(
												'Outline capsules have no background — choose how the logos are colored.',
												'infinite-logo-carousel-block'
											)
										: __(
												'Auto-Contrast picks white or black based on the capsule background. Choose Original Colors to keep your logos unchanged.',
												'infinite-logo-carousel-block'
											)
								}
								value={ capsuleLogoColor }
								options={
									capsuleStyle === 'outline'
										? [
												{
													label: __(
														'Original Colors',
														'infinite-logo-carousel-block'
													),
													value: 'original',
												},
												{
													label: __(
														'White',
														'infinite-logo-carousel-block'
													),
													value: 'white',
												},
												{
													label: __(
														'Black',
														'infinite-logo-carousel-block'
													),
													value: 'black',
												},
											]
										: [
												{
													label: __(
														'Auto-Contrast',
														'infinite-logo-carousel-block'
													),
													value: 'original',
												},
												{
													label: __(
														'Original Colors',
														'infinite-logo-carousel-block'
													),
													value: 'none',
												},
												{
													label: __(
														'White',
														'infinite-logo-carousel-block'
													),
													value: 'white',
												},
												{
													label: __(
														'Black',
														'infinite-logo-carousel-block'
													),
													value: 'black',
												},
											]
								}
								onChange={ ( val ) =>
									setAttributes( { capsuleLogoColor: val } )
								}
							/>
							<ToggleControl
								label={ __(
									'Glow Effect',
									'infinite-logo-carousel-block'
								) }
								help={ __(
									'Adds a soft colored glow around each capsule.',
									'infinite-logo-carousel-block'
								) }
								checked={ capsuleGlow }
								onChange={ ( val ) =>
									setAttributes( { capsuleGlow: val } )
								}
							/>
							{ capsuleGlow && (
								<SelectControl
									label={ __(
										'Glow Intensity',
										'infinite-logo-carousel-block'
									) }
									value={ capsuleGlowSize }
									options={ [
										{
											label: __(
												'Subtle',
												'infinite-logo-carousel-block'
											),
											value: 'subtle',
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
												'Strong',
												'infinite-logo-carousel-block'
											),
											value: 'strong',
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
										setAttributes( {
											capsuleGlowSize: val,
										} )
									}
								/>
							) }
							{ capsuleGlow && capsuleGlowSize === 'custom' && (
								<RangeControl
									label={ __(
										'Custom Glow Size (px)',
										'infinite-logo-carousel-block'
									) }
									value={ capsuleGlowSizeCustom }
									onChange={ ( val ) =>
										setAttributes( {
											capsuleGlowSizeCustom: val,
										} )
									}
									min={ 0 }
									max={ 60 }
									step={ 2 }
								/>
							) }
							{ capsuleStyle === 'alternating' && (
								<p>
									{ __(
										'For a flawless checkerboard, use an even total number of logos.',
										'infinite-logo-carousel-block'
									) }
								</p>
							) }
						</Fragment>
					) }
				</PanelBody>
				<PanelBody
					title={ __(
						'Link Settings',
						'infinite-logo-carousel-block'
					) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __(
							'Link Target',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Determines where logo links open.',
							'infinite-logo-carousel-block'
						) }
						value={ linkTarget }
						options={ [
							{
								label: __(
									'Same window (_self)',
									'infinite-logo-carousel-block'
								),
								value: '_self',
							},
							{
								label: __(
									'New window (_blank)',
									'infinite-logo-carousel-block'
								),
								value: '_blank',
							},
						] }
						onChange={ ( val ) =>
							setAttributes( { linkTarget: val } )
						}
					/>
					<TextControl
						label={ __(
							'Rel Attributes',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							"Separate multiple values with spaces (e.g. 'nofollow sponsored').",
							'infinite-logo-carousel-block'
						) }
						value={ linkRel }
						placeholder="nofollow noopener sponsored"
						onChange={ ( val ) =>
							setAttributes( { linkRel: val } )
						}
					/>
					<TextControl
						label={ __(
							'Title Attribute (optional)',
							'infinite-logo-carousel-block'
						) }
						help={ __(
							'Tooltip text for all logo links.',
							'infinite-logo-carousel-block'
						) }
						value={ linkTitle }
						placeholder={ __(
							'Visit our partner',
							'infinite-logo-carousel-block'
						) }
						onChange={ ( val ) =>
							setAttributes( { linkTitle: val } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			{ images.length > 0 && (
				<div
					className={
						sliderClasses( attributes ) +
						' dbw-ready dbw-editor-preview'
					}
					style={ sliderStyle( attributes ) }
				>
					{ layout === 'spotlight' &&
						renderSpotlight(
							attributes,
							previewLinkProps,
							previewCapsuleProps,
							images.length > 0 ? spotIndex % images.length : 0,
							{
								balance: balanceLogos,
								noLinks: true,
								mask: usesSpotlightMask( attributes ),
							}
						) }
					{ layout !== 'spotlight' &&
						previewRows.map( ( rowImages, rowIndex ) => {
							const direction = getTrackDirection(
								attributes,
								rowIndex
							);
							const duration =
								layout === 'rows' && rowSpeedMode === 'varied'
									? getRowDuration(
											getBaseDurationSeconds(
												attributes
											),
											rowIndex
										)
									: null;
							return renderTrack(
								rowImages,
								rowIndex,
								direction,
								duration,
								previewLinkProps,
								previewCapsuleProps,
								'eager',
								{
									balance: balanceLogos,
									noLinks: true,
									repeats: layout === 'grid' ? 1 : undefined,
								}
							);
						} ) }
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

			{ images.length === 0 && (
				<MediaPlaceholder
					icon="images-alt2"
					labels={ {
						title: __(
							'Logo Slider',
							'infinite-logo-carousel-block'
						),
						instructions: __(
							'Drop logo files here, upload them, or pick them from the media library. Select several at once.',
							'infinite-logo-carousel-block'
						),
					} }
					onSelect={ addImage }
					accept="image/*"
					allowedTypes={ [ 'image' ] }
					multiple
				/>
			) }
		</div>
	);
};

export default Edit;
