/**
 * Deprecated saves of the Logo Slider block, newest first.
 */

import { useBlockProps } from "@wordpress/block-editor";
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
	BLOCK_ATTRIBUTES,
	LEGACY_ATTRIBUTES,
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
	frozenLogoContent,
	frozenSpotlight,
	frozenTrack,
} from "./frozen-helpers";

/* -------------------------------------------------------------------------- */
/*  Legacy helpers + deprecated saves (frozen — do not modify)                */
/* -------------------------------------------------------------------------- */

function legacySliderClasses(overlayEnabled, blackLogos) {
	const classes = ["dbw-partner-slider"];
	if (!overlayEnabled) classes.push("no-overlay");
	if (blackLogos) classes.push("black-logos");
	return classes.join(" ");
}

function legacySliderStyle(attributes) {
	const { speed, gap, marginSize, overlayColor, images, logoHeight } =
		attributes;
	return {
		"--scroll-duration": SPEED_MAP[speed] || "25s",
		"--slide-gap": GAP_MAP[gap] || "40px",
		"--outer-margin": MARGIN_MAP[marginSize] || "50px",
		"--overlay-color": overlayColor || "#ffffff",
		"--logo-count": images.length,
		"--logo-height": logoHeight + "px",
	};
}

/**
 * Deprecated save v1.1.1 – images without loading="lazy" and alt text support.
 */
const deprecatedSaveV111 = ({ attributes }) => {
	const { images, overlayEnabled, blackLogos, linkTarget, linkRel, linkTitle } =
		attributes;

	const renderImages = () =>
		images.map((image, index) => {
			const imgElement = <img src={image.url} alt="" />;
			return (
				<div key={index} className="dbw-slider-item">
					{image.link ? (
						<a
							href={image.link}
							target={linkTarget || "_self"}
							rel={
								linkTarget === "_blank"
									? `noopener noreferrer${linkRel ? ` ${linkRel}` : ""}`
									: linkRel || undefined
							}
							title={linkTitle || undefined}
							aria-label={linkTitle || "Logo Link"}
						>
							{imgElement}
						</a>
					) : (
						imgElement
					)}
				</div>
			);
		});

	return (
		<div
			className={legacySliderClasses(overlayEnabled, blackLogos)}
			style={legacySliderStyle(attributes)}
		>
			<div className="dbw-slider-wrapper">
				<div className="dbw-slider-track">
					{renderImages()}
					{renderImages()}
					{images.length < 8 && renderImages()}
					{images.length < 5 && renderImages()}
				</div>
			</div>
		</div>
	);
};

/**
 * Deprecated save v1.2.0 – single track, logo count on the slider element.
 */
const deprecatedSaveV120 = ({ attributes }) => {
	const { images, overlayEnabled, blackLogos, linkTarget, linkRel, linkTitle } =
		attributes;

	const renderImages = () =>
		images.map((image, index) => {
			const imgElement = (
				<img src={image.url} alt={image.alt || ""} loading="lazy" />
			);
			return (
				<div key={index} className="dbw-slider-item">
					{image.link ? (
						<a
							href={image.link}
							target={linkTarget || "_self"}
							rel={
								linkTarget === "_blank"
									? `noopener noreferrer${linkRel ? ` ${linkRel}` : ""}`
									: linkRel || undefined
							}
							title={linkTitle || undefined}
							aria-label={linkTitle || "Logo Link"}
						>
							{imgElement}
						</a>
					) : (
						imgElement
					)}
				</div>
			);
		});

	return (
		<div
			className={legacySliderClasses(overlayEnabled, blackLogos)}
			style={legacySliderStyle(attributes)}
		>
			<div className="dbw-slider-wrapper">
				<div className="dbw-slider-track">
					{renderImages()}
					{renderImages()}
					{images.length < 20 && renderImages()}
					{images.length < 12 && renderImages()}
					{images.length < 6 && renderImages()}
					{images.length < 3 && renderImages()}
				</div>
			</div>
		</div>
	);
};

/**
 * Deprecated save v1.6.0 – images with loading="lazy" (causes fast-scroll
 * flash on initial load because lazy images delay measurement).
 */
const deprecatedSaveV160 = ({ attributes }) => {
	const {
		images,
		overlayEnabled,
		blackLogos,
		layout,
		rowCount,
		rowSpeedMode,
		linkTarget,
		linkRel,
		linkTitle,
		capsuleEnabled,
		capsuleStyle,
		capsuleColorA,
		capsuleColorB,
		capsuleLogoColor,
	} = attributes;

	const linkProps = { linkTarget, linkRel, linkTitle };
	const capsuleProps = {
		enabled: capsuleEnabled,
		style: capsuleStyle,
		colorADark: isColorDark(capsuleColorA),
		colorBDark: isColorDark(capsuleColorB),
		logoColor: capsuleLogoColor,
	};

	const capsuleAlternating =
		capsuleEnabled && capsuleStyle === "alternating";

	let rows;
	if (layout === "rows") {
		const count = Math.min(
			Math.max(parseInt(rowCount, 10) || 3, 2),
			4
		);
		rows = distributeRows(images, count, capsuleAlternating);
	} else {
		rows = [images];
	}

	if (capsuleAlternating) {
		rows = rows.map((row) =>
			row.length % 2 === 1 ? row.concat(row) : row
		);
	}

	return (
		<div
			className={sliderClasses(attributes)}
			style={sliderStyle(attributes)}
		>
			{rows.map((rowImages, rowIndex) => {
				const direction = rowIndex % 2 === 1 ? "reverse" : "normal";
				const duration =
					layout === "rows" && rowSpeedMode === "varied"
						? getRowDuration(
								getBaseDurationSeconds(attributes),
								rowIndex
						  )
						: null;
				return frozenTrack(
					rowImages,
					rowIndex,
					direction,
					duration,
					linkProps,
					capsuleProps,
					"lazy"
				);
			})}
		</div>
	);
};

/**
 * Deprecated save v1.8.0 – identical output to the current save, but without
 * the useBlockProps.save() wrapper (no wp-block-* class) and without the
 * optional pause button. Matches all content saved between v1.6.1 and v1.8.x.
 */
const deprecatedSaveV180 = ({ attributes }) => {
	const {
		layout,
		rowSpeedMode,
		linkTarget,
		linkRel,
		linkTitle,
		capsuleEnabled,
		capsuleStyle,
		capsuleColorA,
		capsuleColorB,
		capsuleLogoColor,
	} = attributes;

	const linkProps = { linkTarget, linkRel, linkTitle };
	const capsuleProps = {
		enabled: capsuleEnabled,
		style: capsuleStyle,
		colorADark: isColorDark(capsuleColorA),
		colorBDark: isColorDark(capsuleColorB),
		logoColor: capsuleLogoColor,
	};

	const rows = buildSliderRows(attributes);

	return (
		<div
			className={sliderClasses(attributes)}
			style={sliderStyle(attributes)}
		>
			{rows.map((rowImages, rowIndex) => {
				const direction = rowIndex % 2 === 1 ? "reverse" : "normal";
				const duration =
					layout === "rows" && rowSpeedMode === "varied"
						? getRowDuration(
								getBaseDurationSeconds(attributes),
								rowIndex
						  )
						: null;
				return frozenTrack(
					rowImages,
					rowIndex,
					direction,
					duration,
					linkProps,
					capsuleProps
				);
			})}
		</div>
	);
};

/**
 * Deprecated save v2.2.1 – the markup shipped from v2.0.0 through v2.2.1:
 * images with loading="eager", no decoding hint, and no aria-hidden on the
 * repeated logo sets. Content saved by those versions is matched here and
 * migrated the next time the block is edited.
 */
const deprecatedSaveV221 = ({ attributes }) => {
	const {
		layout,
		rowSpeedMode,
		linkTarget,
		linkRel,
		linkTitle,
		capsuleEnabled,
		capsuleStyle,
		capsuleColorA,
		capsuleColorB,
		capsuleLogoColor,
		showPauseButton,
	} = attributes;

	const linkProps = { linkTarget, linkRel, linkTitle };
	const capsuleProps = {
		enabled: capsuleEnabled,
		style: capsuleStyle,
		colorADark: isColorDark(capsuleColorA),
		colorBDark: isColorDark(capsuleColorB),
		logoColor: capsuleLogoColor,
	};

	const rows = buildSliderRows(attributes);

	const blockProps = useBlockProps.save({
		className: sliderClasses(attributes),
		style: sliderStyle(attributes),
	});

	if (layout === "spotlight") {
		return (
			<div {...blockProps}>
				{frozenSpotlight(attributes, linkProps, capsuleProps)}
				{showPauseButton && (
					<button
						className="dbw-pause-btn"
						type="button"
						aria-pressed="false"
					></button>
				)}
			</div>
		);
	}

	return (
		<div {...blockProps}>
			{rows.map((rowImages, rowIndex) => {
				const direction = rowIndex % 2 === 1 ? "reverse" : "normal";
				const duration =
					layout === "rows" && rowSpeedMode === "varied"
						? getRowDuration(
								getBaseDurationSeconds(attributes),
								rowIndex
						  )
						: null;
				return frozenTrack(
					rowImages,
					rowIndex,
					direction,
					duration,
					linkProps,
					capsuleProps
				);
			})}
			{showPauseButton && (
				<button
					className="dbw-pause-btn"
					type="button"
					aria-pressed="false"
				></button>
			)}
		</div>
	);
};


const deprecated = [
	{
		attributes: BLOCK_ATTRIBUTES,
		save: deprecatedSaveV221,
	},
	{
		attributes: BLOCK_ATTRIBUTES,
		save: deprecatedSaveV180,
	},
	{
		attributes: BLOCK_ATTRIBUTES,
		save: deprecatedSaveV160,
	},
	{
		attributes: LEGACY_ATTRIBUTES,
		save: deprecatedSaveV120,
	},
	{
		attributes: LEGACY_ATTRIBUTES,
		save: deprecatedSaveV111,
	},
];

export default deprecated;
