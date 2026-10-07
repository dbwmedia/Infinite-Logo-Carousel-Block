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
} from "./constants";
import {
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
} from "./helpers";

const save = ({ attributes }) => {
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

	// A logo carousel usually sits below the fold, so its images are lazy
	// by default. The frontend script switches the images it has to
	// measure to eager the moment the slider comes into view, so lazy
	// loading can no longer break the scroll speed (see frontend.js).
	const loading = attributes.eagerLoading ? "eager" : "lazy";

	// v2.0: the wrapper goes through useBlockProps.save() so block
	// supports (wide/full alignment) work. Content saved before v2.0
	// matches the deprecatedSaveV180 entry and is migrated on next edit.
	const blockProps = useBlockProps.save({
		className: sliderClasses(attributes),
		style: sliderStyle(attributes),
		// Only a labelled carousel becomes a landmark. An unlabelled
		// region would just add an anonymous entry to the landmark list.
		role: attributes.ariaLabel ? "region" : undefined,
		"aria-label": attributes.ariaLabel || undefined,
	});

	// Spotlight mode shows one logo at a time instead of scrolling tracks.
	if (layout === "spotlight") {
		return (
			<div {...blockProps}>
				{renderSpotlight(attributes, linkProps, capsuleProps, 0, {
					loading,
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
	}

	return (
		<div {...blockProps}>
			{rows.map((rowImages, rowIndex) => {
				// Adjacent rows scroll in opposite directions.
				const direction = rowIndex % 2 === 1 ? "reverse" : "normal";
				// Per-row duration only in multi-row "varied" speed mode.
				const duration =
					layout === "rows" && rowSpeedMode === "varied"
						? getRowDuration(
								getBaseDurationSeconds(attributes),
								rowIndex
						  )
						: null;
				return renderTrack(
					rowImages,
					rowIndex,
					direction,
					duration,
					linkProps,
					capsuleProps,
					loading
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

export default save;
