/**
 * Logo management in the block sidebar: order, replace, remove, alt text and
 * link per logo. The canvas only shows the live preview, like the front end.
 */
import { MediaUpload, URLInput } from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	Notice,
	TextControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Only links the front end keeps: http(s), mailto, tel and relative URLs.
 *
 * @param {string} url Link entered by the author.
 * @return {boolean} Whether the link survives rendering.
 */
export function isAllowedLink( url ) {
	if ( ! url ) {
		return true;
	}
	const scheme = url.trim().match( /^([a-z][a-z0-9+.-]*):/i );
	return (
		! scheme ||
		[ 'http', 'https', 'mailto', 'tel' ].includes(
			scheme[ 1 ].toLowerCase()
		)
	);
}

/**
 * Turn a media library selection (or an upload) into a logo entry.
 *
 * @param {Object} media Media object from the media modal or an upload.
 * @return {Object} Logo entry for the images attribute.
 */
export function mediaToLogo( media ) {
	// Prefer "large" over the original to keep page weight down. WordPress
	// only generates "large" for bigger originals, so this never upscales.
	// The render filter adds a srcset on top.
	const sizes = media.sizes || media.media_details?.sizes || {};
	const large = sizes.large || sizes.full || {};
	const url =
		large.url || large.source_url || media.url || media.source_url || '';
	const logo = {
		id: media.id,
		url,
		link: '',
		alt: media.alt || media.alt_text || '',
	};
	const width = large.width || media.width || media.media_details?.width;
	const height = large.height || media.height || media.media_details?.height;
	if ( width && height ) {
		logo.width = width;
		logo.height = height;
	}
	return logo;
}

export default function LogoList( { images, setAttributes } ) {
	// Alt texts maintained in the media library: the front end uses them
	// when a logo has none of its own, so show them as the placeholder.
	const libraryAlts = useSelect(
		( select ) => {
			const core = select( 'core' );
			const alts = {};
			images.forEach( ( image ) => {
				if ( image.id ) {
					const media = core.getMedia( image.id, {
						context: 'view',
					} );
					alts[ image.id ] = media?.alt_text || '';
				}
			} );
			return alts;
		},
		[ images ]
	);

	const update = ( index, changes ) => {
		const next = [ ...images ];
		next[ index ] = { ...next[ index ], ...changes };
		setAttributes( { images: next } );
	};
	const move = ( index, delta ) => {
		const target = index + delta;
		if ( target < 0 || target >= images.length ) {
			return;
		}
		const next = [ ...images ];
		[ next[ index ], next[ target ] ] = [ next[ target ], next[ index ] ];
		setAttributes( { images: next } );
	};
	const remove = ( index ) =>
		setAttributes( { images: images.filter( ( _, i ) => i !== index ) } );
	const add = ( selection ) =>
		setAttributes( {
			images: [
				...images,
				...( Array.isArray( selection )
					? selection
					: [ selection ]
				).map( mediaToLogo ),
			],
		} );

	const unnamed = images.filter(
		( image ) => ! ( image.alt || '' ).trim() && ! libraryAlts[ image.id ]
	).length;

	return (
		<div className="dbw-logo-list">
			{ unnamed > 0 && (
				<Notice status="warning" isDismissible={ false }>
					{ sprintf(
						/* translators: %d: number of logos without alt text. */
						_n(
							'%d logo has no alt text. Screen readers then only hear its file name.',
							'%d logos have no alt text. Screen readers then only hear their file names.',
							unnamed,
							'infinite-logo-carousel-block'
						),
						unnamed
					) }
				</Notice>
			) }
			{ images.map( ( image, index ) => (
				<div className="dbw-logo-card" key={ index }>
					<div className="dbw-logo-card__head">
						<img src={ image.url } alt="" />
						<span className="dbw-logo-card__actions">
							<Button
								icon="arrow-up-alt2"
								label={ __(
									'Move up',
									'infinite-logo-carousel-block'
								) }
								size="small"
								disabled={ index === 0 }
								onClick={ () => move( index, -1 ) }
							/>
							<Button
								icon="arrow-down-alt2"
								label={ __(
									'Move down',
									'infinite-logo-carousel-block'
								) }
								size="small"
								disabled={ index === images.length - 1 }
								onClick={ () => move( index, 1 ) }
							/>
							<MediaUpload
								onSelect={ ( media ) => {
									const logo = mediaToLogo( media );
									// Keep the link settings, take the new image.
									update( index, {
										...logo,
										link: image.link || '',
										newTab: image.newTab,
									} );
								} }
								allowedTypes={ [ 'image' ] }
								value={ image.id }
								render={ ( { open } ) => (
									<Button
										icon="update"
										label={ __(
											'Replace',
											'infinite-logo-carousel-block'
										) }
										size="small"
										onClick={ open }
									/>
								) }
							/>
							<Button
								icon="trash"
								label={ __(
									'Remove',
									'infinite-logo-carousel-block'
								) }
								size="small"
								isDestructive
								onClick={ () => remove( index ) }
							/>
						</span>
					</div>
					<TextControl
						__nextHasNoMarginBottom
						label={ __(
							'Alt text',
							'infinite-logo-carousel-block'
						) }
						value={ image.alt || '' }
						placeholder={
							libraryAlts[ image.id ] ||
							__( 'Company name', 'infinite-logo-carousel-block' )
						}
						help={
							! ( image.alt || '' ).trim() &&
							libraryAlts[ image.id ]
								? __(
										'Empty: the alt text from the media library is used.',
										'infinite-logo-carousel-block'
									)
								: undefined
						}
						onChange={ ( alt ) => update( index, { alt } ) }
					/>
					<div className="dbw-logo-card__link">
						<span className="components-base-control__label">
							{ __(
								'Link (optional)',
								'infinite-logo-carousel-block'
							) }
						</span>
						<URLInput
							__nextHasNoMarginBottom
							value={ image.link || '' }
							onChange={ ( link ) => update( index, { link } ) }
						/>
						{ ! isAllowedLink( image.link ) && (
							<p className="dbw-logo-card__error">
								{ __(
									'Only web, e-mail and phone links are allowed. This link is removed on the page.',
									'infinite-logo-carousel-block'
								) }
							</p>
						) }
						{ !! image.link && (
							<CheckboxControl
								__nextHasNoMarginBottom
								label={ __(
									'Open in new tab',
									'infinite-logo-carousel-block'
								) }
								checked={ !! image.newTab }
								onChange={ ( newTab ) =>
									update( index, {
										newTab: newTab || undefined,
									} )
								}
							/>
						) }
					</div>
				</div>
			) ) }
			<MediaUpload
				onSelect={ add }
				allowedTypes={ [ 'image' ] }
				multiple
				render={ ( { open } ) => (
					<Button variant="secondary" onClick={ open }>
						{ __( 'Add logos', 'infinite-logo-carousel-block' ) }
					</Button>
				) }
			/>
		</div>
	);
}
