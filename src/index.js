import { registerBlockType } from "@wordpress/blocks";
import {
	InspectorControls,
	MediaUpload,
	PanelColorSettings,
	useBlockProps,
} from "@wordpress/block-editor";
import {
	PanelBody,
	Button,
	SelectControl,
	TextControl,
	ToggleControl,
	RangeControl,
	ColorPalette,
} from "@wordpress/components";
import { Fragment, useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import "./editor.scss";
import "./style.scss";
import "./marquee.js";

const SPEED_MAP = { slow: "40s", medium: "25s", fast: "15s" };
const GAP_MAP = { small: "20px", medium: "40px", large: "60px", xlarge: "100px" };
const MARGIN_MAP = { small: "25px", medium: "50px", large: "75px" };
const ROW_GAP_MAP = { small: "12px", medium: "24px", large: "48px", xlarge: "72px" };

/**
 * Balanced logo sizes: reference aspect ratio and scale bounds. A logo's
 * scale factor is sqrt(REF / ratio) — equal *area* instead of equal height —
 * clamped so extreme shapes stay within sane bounds.
 */
const BALANCE_REF_RATIO = 2;
const BALANCE_MIN_SCALE = 0.65;
const BALANCE_MAX_SCALE = 1.4;

/**
 * Per-row duration multipliers for the "varied" row speed mode. Adjacent rows
 * get noticeably different factors so the rows never move in lockstep.
 */
const ROW_SPEED_FACTORS = [1, 1.22, 0.86, 1.4];

/**
 * Border-radius presets for capsules ("custom" uses capsuleRadiusCustom).
 */
const CAPSULE_RADIUS_MAP = { square: "0", rounded: "14px", pill: "999px" };

/**
 * Capsule padding presets, as factors of the logo height (vertical / horizontal).
 * "large" matches the original fixed padding; "custom" uses capsulePaddingCustom.
 */
const CAPSULE_PADDING_MAP = {
	small: { y: 0.15, x: 0.3 },
	medium: { y: 0.3, x: 0.55 },
	large: { y: 0.45, x: 0.8 },
};

/**
 * Border-width presets for the outline capsule style.
 */
const CAPSULE_BORDER_MAP = { thin: "1px", medium: "2px", thick: "4px" };

/**
 * Glow-size (box-shadow blur) presets for the optional capsule glow.
 */
const CAPSULE_GLOW_MAP = { subtle: "6px", medium: "14px", strong: "26px" };

/**
 * Spotlight mode: colour cycle used when the user switches to "Color cycle"
 * without having picked colours yet.
 */
const DEFAULT_SPOTLIGHT_COLORS = ["#2563eb", "#db2777", "#f59e0b"];

/**
 * Spotlight mode: how long one logo stays visible, in seconds (bounds for the
 * editor control and the saved data-attribute).
 */
const SPOTLIGHT_MIN_DURATION = 0.5;
const SPOTLIGHT_MAX_DURATION = 10;

/**
 * Current block attributes (v1.4+).
 */
const BLOCK_ATTRIBUTES = {
	images: { type: "array", default: [] },
	speed: { type: "string", default: "medium" },
	speedCustom: { type: "number", default: 60 },
	gap: { type: "string", default: "medium" },
	gapCustom: { type: "number", default: 40 },
	marginSize: { type: "string", default: "medium" },
	logoHeight: { type: "string", default: "50" },
	logoHeightMobile: { type: "string", default: "" },
	balanceLogos: { type: "boolean", default: false },
	showPauseButton: { type: "boolean", default: false },
	eagerLoading: { type: "boolean", default: false },
	ariaLabel: { type: "string", default: "" },
	overlayEnabled: { type: "boolean", default: true },
	overlayColor: { type: "string", default: "#ffffff" },
	blackLogos: { type: "boolean", default: false },
	logoColorMode: { type: "string", default: "original" },
	logoCustomColor: { type: "string", default: "#999999" },
	colorOnHover: { type: "boolean", default: false },
	linkTarget: { type: "string", default: "_self" },
	linkRel: { type: "string", default: "" },
	linkTitle: { type: "string", default: "" },
	layout: { type: "string", default: "single" },
	spotlightDuration: { type: "number", default: 2 },
	spotlightTransition: { type: "string", default: "fade" },
	spotlightOrder: { type: "string", default: "sequence" },
	spotlightAlign: { type: "string", default: "center" },
	spotlightColorMode: { type: "string", default: "inherit" },
	spotlightColor: { type: "string", default: "#2563eb" },
	spotlightColors: { type: "array", default: [] },
	rowCount: { type: "number", default: 3 },
	rowSpeedMode: { type: "string", default: "uniform" },
	rowGap: { type: "string", default: "medium" },
	rowGapCustom: { type: "number", default: 24 },
	capsuleEnabled: { type: "boolean", default: false },
	capsuleStyle: { type: "string", default: "alternating" },
	capsuleRadius: { type: "string", default: "pill" },
	capsuleRadiusCustom: { type: "number", default: 16 },
	capsulePadding: { type: "string", default: "medium" },
	capsulePaddingCustom: { type: "number", default: 12 },
	capsuleColorA: { type: "string", default: "#000000" },
	capsuleColorB: { type: "string", default: "#ffffff" },
	capsuleBorderWidth: { type: "string", default: "medium" },
	capsuleBorderWidthCustom: { type: "number", default: 2 },
	capsuleLogoColor: { type: "string", default: "original" },
	capsuleGlow: { type: "boolean", default: false },
	capsuleGlowSize: { type: "string", default: "medium" },
	capsuleGlowSizeCustom: { type: "number", default: 12 },
};

/**
 * Attribute set used by pre-v1.3 saved content (before the layout options
 * existed). Used only for block deprecations.
 */
const LEGACY_ATTRIBUTES = {
	images: { type: "array", default: [] },
	speed: { type: "string", default: "medium" },
	gap: { type: "string", default: "medium" },
	marginSize: { type: "string", default: "medium" },
	logoHeight: { type: "string", default: "50" },
	overlayEnabled: { type: "boolean", default: true },
	overlayColor: { type: "string", default: "#ffffff" },
	blackLogos: { type: "boolean", default: false },
	linkTarget: { type: "string", default: "_self" },
	linkRel: { type: "string", default: "" },
	linkTitle: { type: "string", default: "" },
};

function isValidUrl(string) {
	if (!string) return true;
	try {
		const url = new URL(string);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

/* -------------------------------------------------------------------------- */
/*  Current save helpers (v1.3+)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Build the slider wrapper class list.
 */
function sliderClasses(attributes) {
	const classes = ["dbw-partner-slider"];
	if (attributes.layout === "rows") classes.push("dbw-layout-rows");
	// Spotlight: one logo at a time, swapped on a timer (v2.2).
	if (attributes.layout === "spotlight") {
		classes.push("dbw-layout-spotlight");
		classes.push("dbw-spot-" + getSpotlightTransition(attributes));
		classes.push("dbw-spot-align-" + getSpotlightAlign(attributes));
		if (attributes.spotlightColorMode !== "inherit") {
			classes.push("dbw-spot-tint");
		}
	}
	if (!attributes.overlayEnabled) classes.push("no-overlay");
	// General logo colour (backward-compat: blackLogos still emits the
	// legacy class; new modes add their own class).
	if (attributes.blackLogos) classes.push("black-logos");
	if (!attributes.blackLogos && attributes.logoColorMode === "white")
		classes.push("dbw-logos-white");
	if (!attributes.blackLogos && attributes.logoColorMode === "custom")
		classes.push("dbw-logos-custom");
	if (!attributes.blackLogos && attributes.logoColorMode === "grayscale")
		classes.push("dbw-logos-gray");
	// Restore original logo colors on hover — works with every color mode.
	if (
		attributes.colorOnHover &&
		(attributes.blackLogos ||
			attributes.logoColorMode !== "original" ||
			(attributes.layout === "spotlight" &&
				attributes.spotlightColorMode !== "inherit"))
	)
		classes.push("dbw-color-hover");
	// Balanced logo sizes (area-based). Only added when enabled, so existing
	// content keeps producing identical output.
	if (attributes.balanceLogos) classes.push("dbw-balance");
	if (attributes.capsuleEnabled) {
		classes.push("dbw-capsules");
		if (attributes.capsuleStyle === "outline") {
			classes.push("dbw-cap-outline");
		}
		if (attributes.capsuleGlow) {
			classes.push("dbw-cap-glow");
		}
		// When a filled capsule's logo colour is explicitly chosen (not the
		// default auto-contrast), tell the frontend script to skip its
		// runtime contrast fix.
		if (
			attributes.capsuleLogoColor !== "original" &&
			attributes.capsuleStyle !== "outline"
		) {
			classes.push("dbw-cap-logo-manual");
		}
	}
	return classes.join(" ");
}

/**
 * Build the CSS custom properties applied to the slider wrapper. The logo
 * count now lives per track (data-logo-count), not on the slider.
 */
function sliderStyle(attributes) {
	const { gap, marginSize, overlayColor, logoHeight } = attributes;
	const style = {
		"--scroll-duration": getBaseDurationSeconds(attributes) + "s",
		"--slide-gap":
			gap === "custom"
				? (parseInt(attributes.gapCustom, 10) || 40) + "px"
				: GAP_MAP[gap] || "40px",
		"--outer-margin": MARGIN_MAP[marginSize] || "50px",
		"--overlay-color": overlayColor || "#ffffff",
		"--logo-height": logoHeight + "px",
	};
	// Optional fixed logo height for phones. Only emitted when the user set a
	// value, so existing content keeps producing identical output (the CSS
	// falls back to the fluid clamp() formula when the property is absent).
	const mobileHeight = parseInt(attributes.logoHeightMobile, 10);
	if (mobileHeight > 0) {
		style["--logo-height-mobile"] = mobileHeight + "px";
		// Capsule padding presets are proportional to the logo height — emit
		// mobile values matching the mobile height (custom padding is an
		// absolute px value and stays as-is on phones).
		if (
			attributes.capsuleEnabled &&
			attributes.capsulePadding !== "custom"
		) {
			const f =
				CAPSULE_PADDING_MAP[attributes.capsulePadding] ||
				CAPSULE_PADDING_MAP.medium;
			style["--capsule-pad-y-mobile"] =
				Math.round(mobileHeight * f.y * 10) / 10 + "px";
			style["--capsule-pad-x-mobile"] =
				Math.round(mobileHeight * f.x * 10) / 10 + "px";
		}
	}
	// Spotlight with a single tint colour: one filter for every logo, so the
	// items themselves stay style-free (the colour cycle sets it per item).
	if (
		attributes.layout === "spotlight" &&
		attributes.spotlightColorMode === "single"
	) {
		// Two ways to the same colour: --spot-color drives the exact mask
		// tint applied by the frontend script, --spot-filter is the
		// approximate CSS-filter fallback for when that script never runs.
		style["--spot-color"] = attributes.spotlightColor || "#2563eb";
		style["--spot-filter"] = computeColorFilter(attributes.spotlightColor);
	}
	// Custom logo colour filter (emitted regardless of capsules — the
	// capsule CSS reset neutralises it when capsules are active).
	if (!attributes.blackLogos && attributes.logoColorMode === "custom") {
		style["--logo-filter"] = computeColorFilter(
			attributes.logoCustomColor
		);
	}
	// Capsule custom properties are only added when capsules are enabled, so
	// that with capsules off the output stays identical to v1.3.
	if (attributes.capsuleEnabled) {
		style["--capsule-radius"] = getCapsuleRadius(attributes);
		style["--capsule-color-a"] = attributes.capsuleColorA || "#000000";
		style["--capsule-color-b"] = attributes.capsuleColorB || "#ffffff";
		const pad = getCapsulePadding(attributes);
		style["--capsule-pad-y"] = pad.y;
		style["--capsule-pad-x"] = pad.x;
		// Emitted only for the styles that need them, so existing capsule
		// content keeps producing identical output.
		if (attributes.capsuleStyle === "outline") {
			style["--capsule-border-width"] = getCapsuleBorderWidth(attributes);
		}
		if (attributes.capsuleGlow) {
			style["--capsule-glow-size"] = getCapsuleGlowSize(attributes);
		}
	}
	// Row gap is only emitted for a non-default value, so multi-row content
	// created before this option still produces identical output.
	if (attributes.layout === "rows" && attributes.rowGap !== "medium") {
		style["--row-gap"] =
			attributes.rowGap === "custom"
				? (parseInt(attributes.rowGapCustom, 10) || 24) + "px"
				: ROW_GAP_MAP[attributes.rowGap] || "24px";
	}
	return style;
}

/**
 * Resolve the capsule border-radius from the preset (or custom value).
 */
function getCapsuleRadius(attributes) {
	if (attributes.capsuleRadius === "custom") {
		return (parseInt(attributes.capsuleRadiusCustom, 10) || 0) + "px";
	}
	return CAPSULE_RADIUS_MAP[attributes.capsuleRadius] || "999px";
}

/**
 * Resolve the capsule padding (vertical / horizontal) from the preset, or a
 * uniform pixel value for the custom option.
 */
function getCapsulePadding(attributes) {
	if (attributes.capsulePadding === "custom") {
		const px = (parseInt(attributes.capsulePaddingCustom, 10) || 0) + "px";
		return { y: px, x: px };
	}
	const f =
		CAPSULE_PADDING_MAP[attributes.capsulePadding] ||
		CAPSULE_PADDING_MAP.medium;
	return {
		y: "calc(var(--logo-height, 50px) * " + f.y + ")",
		x: "calc(var(--logo-height, 50px) * " + f.x + ")",
	};
}

/**
 * Resolve the outline border width from the preset (or custom value).
 */
function getCapsuleBorderWidth(attributes) {
	if (attributes.capsuleBorderWidth === "custom") {
		return (parseInt(attributes.capsuleBorderWidthCustom, 10) || 0) + "px";
	}
	return CAPSULE_BORDER_MAP[attributes.capsuleBorderWidth] || "2px";
}

/**
 * Resolve the glow size (box-shadow blur) from the preset (or custom value).
 */
function getCapsuleGlowSize(attributes) {
	if (attributes.capsuleGlowSize === "custom") {
		return (parseInt(attributes.capsuleGlowSizeCustom, 10) || 0) + "px";
	}
	return CAPSULE_GLOW_MAP[attributes.capsuleGlowSize] || "14px";
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
function getSpotlightTransition(attributes) {
	const value = attributes.spotlightTransition;
	return value === "slide" || value === "none" ? value : "fade";
}

/**
 * Resolve the spotlight alignment, guarding against unknown values.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} "left", "center" or "right".
 */
function getSpotlightAlign(attributes) {
	const value = attributes.spotlightAlign;
	return value === "left" || value === "right" ? value : "center";
}

/**
 * Hold time of a single logo, in milliseconds — written to the stage as a
 * data attribute and read by the frontend script.
 *
 * @param {Object} attributes Block attributes.
 * @return {number} Hold time in ms.
 */
function getSpotlightDurationMs(attributes) {
	const seconds = parseFloat(attributes.spotlightDuration);
	const safe = isNaN(seconds) ? 2 : seconds;
	return Math.round(
		Math.min(
			SPOTLIGHT_MAX_DURATION,
			Math.max(SPOTLIGHT_MIN_DURATION, safe)
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
function getSpotlightColors(attributes) {
	const colors = Array.isArray(attributes.spotlightColors)
		? attributes.spotlightColors.filter(Boolean)
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
function usesSpotlightMask(attributes) {
	return (
		attributes.layout === "spotlight" &&
		attributes.spotlightColorMode !== "inherit" &&
		!attributes.capsuleEnabled
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
function getSpotlightItemStyle(attributes, index) {
	if (attributes.spotlightColorMode !== "cycle") {
		return undefined;
	}
	const colors = getSpotlightColors(attributes);
	const color = colors[index % colors.length];
	return {
		"--spot-color": color,
		"--spot-filter": computeColorFilter(color),
	};
}

/**
 * Rough perceived-luminance check — used to pick a contrasting (black or
 * white) logo colour for a given capsule background.
 */
function isColorDark(hex) {
	if (typeof hex !== "string") return true;
	let c = hex.replace("#", "").trim();
	if (c.length === 3) {
		c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
	}
	if (c.length !== 6) return true;
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

/**
 * Compute a CSS filter string that tints any image to the given hex colour.
 * Pipeline: black → white → sepia (warm brown) → adjust hue/saturation/
 * brightness to reach the target. This is an approximation — perfectly exact
 * conversion from hex to CSS filter values is not possible, but the result
 * is close enough for logo tinting.
 */
function computeColorFilter(hex) {
	if (!hex || typeof hex !== "string") return "none";
	let c = hex.replace("#", "").trim();
	if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
	if (c.length !== 6) return "none";

	const r = parseInt(c.slice(0, 2), 16) / 255;
	const g = parseInt(c.slice(2, 4), 16) / 255;
	const b = parseInt(c.slice(4, 6), 16) / 255;

	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) h = ((b - r) / d + 2) / 6;
		else h = ((r - g) / d + 4) / 6;
	}

	// CSS sepia base is approximately HSL(34, 100%, 78.4%).
	const hueRotate = h * 360 - 34;
	const saturate = Math.max(s, 0.01);
	const brightness = Math.max(l / 0.784, 0.01);

	return (
		"brightness(0) invert(1) sepia(1) saturate(" +
		saturate.toFixed(2) +
		") hue-rotate(" +
		hueRotate.toFixed(1) +
		"deg) brightness(" +
		brightness.toFixed(2) +
		")"
	);
}

/**
 * Editor-preview approximation of the balanced logo scale. The front end
 * computes the same factor from the image's natural size at runtime.
 */
function getBalanceScale(image) {
	if (!image || !image.width || !image.height) return 1;
	const ratio = image.width / image.height;
	if (!(ratio > 0)) return 1;
	return Math.min(
		BALANCE_MAX_SCALE,
		Math.max(BALANCE_MIN_SCALE, Math.sqrt(BALANCE_REF_RATIO / ratio))
	);
}

/**
 * Wrap a logo (or its link) in a capsule container. The A/B colour is chosen
 * by position within the set so the pattern stays consistent across every
 * duplicated copy — and offset per row for a checkerboard look.
 */
function wrapInCapsule(content, rowIndex, index, capsuleProps) {
	const useB =
		capsuleProps.style === "alternating" && (rowIndex + index) % 2 === 1;
	const colorClass = useB ? "dbw-cap-b" : "dbw-cap-a";

	let logoClass;
	if (capsuleProps.logoColor === "none") {
		// Explicit "keep original colours" — no filter on any style.
		logoClass = "";
	} else if (capsuleProps.logoColor === "white") {
		logoClass = "dbw-logo-light";
	} else if (capsuleProps.logoColor === "black") {
		logoClass = "dbw-logo-dark";
	} else if (capsuleProps.style === "outline") {
		// Outline + default ("original") → no filter.
		logoClass = "";
	} else {
		// Filled + default ("original") → auto-contrast against background.
		const isDark = useB
			? capsuleProps.colorBDark
			: capsuleProps.colorADark;
		logoClass = isDark ? "dbw-logo-light" : "dbw-logo-dark";
	}

	const className = ("dbw-capsule " + colorClass + " " + logoClass).trim();
	return <div className={className}>{content}</div>;
}

/**
 * Number of times one logo set is repeated inside a track. Fewer logos need
 * more copies so the track stays wider than the viewport for a seamless loop.
 */
function getRepeatCount(logoCount) {
	let repeats = 2;
	if (logoCount < 20) repeats++;
	if (logoCount < 12) repeats++;
	if (logoCount < 6) repeats++;
	if (logoCount < 3) repeats++;
	return repeats;
}

/**
 * Base scroll duration in seconds — from the speed preset, or the custom value.
 */
function getBaseDurationSeconds(attributes) {
	if (attributes.speed === "custom") {
		return parseInt(attributes.speedCustom, 10) || 60;
	}
	return parseFloat(SPEED_MAP[attributes.speed] || "25s");
}

/**
 * Duration for a single row in "varied" speed mode.
 */
function getRowDuration(baseSeconds, rowIndex) {
	const factor = ROW_SPEED_FACTORS[rowIndex % ROW_SPEED_FACTORS.length];
	return Math.round(baseSeconds * factor * 10) / 10 + "s";
}

/**
 * Distribute logos across `rowCount` rows. With `pairwise` the logos are handed
 * out two at a time, so an even total produces only even-length rows — needed
 * for a seamless capsule checkerboard. Otherwise they are interleaved.
 */
function distributeRows(images, rowCount, pairwise) {
	const rows = [];
	for (let r = 0; r < rowCount; r++) {
		rows.push([]);
	}
	if (pairwise) {
		let r = 0;
		for (let i = 0; i < images.length; i += 2) {
			rows[r].push(images[i]);
			if (i + 1 < images.length) {
				rows[r].push(images[i + 1]);
			}
			r = (r + 1) % rowCount;
		}
	} else {
		images.forEach((image, i) => {
			rows[i % rowCount].push(image);
		});
	}
	return rows.filter((row) => row.length > 0);
}

/**
 * Build the per-row image lists for the given attributes. Shared by save(),
 * the v1.8 deprecation and the editor live preview so all three stay in sync.
 *
 * In "rows" layout the logos are distributed across 2–4 rows; a capsule
 * checkerboard uses pair-based distribution and duplicates odd rows so two
 * same-coloured capsules never touch, not even at the loop seam.
 */
function buildSliderRows(attributes) {
	const { images, layout, rowCount, capsuleEnabled, capsuleStyle } =
		attributes;
	const capsuleAlternating = capsuleEnabled && capsuleStyle === "alternating";
	let rows;
	if (layout === "rows") {
		const count = Math.min(Math.max(parseInt(rowCount, 10) || 3, 2), 4);
		rows = distributeRows(images, count, capsuleAlternating);
	} else {
		rows = [images];
	}
	if (capsuleAlternating) {
		rows = rows.map((row) =>
			row.length % 2 === 1 ? row.concat(row) : row
		);
	}
	return rows;
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
function renderLogoContent(image, linkProps, loading, opts, decorative) {
	const { linkTarget, linkRel, linkTitle } = linkProps;
	const imgElement = (
		<img
			src={image.url}
			// Repeated sets exist for the visual loop only. They carry no alt
			// text, so a screen reader announces every logo exactly once
			// instead of once per copy.
			alt={decorative ? "" : image.alt || ""}
			width={image.width || undefined}
			height={image.height || undefined}
			loading={loading}
			decoding="async"
		/>
	);
	return image.link && !opts.noLinks ? (
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
			// A duplicated link must leave the tab order — its item is
			// aria-hidden, and focusable content inside that is an error.
			tabIndex={decorative ? -1 : undefined}
		>
			{imgElement}
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
 * @param {Object}  attributes  Block attributes.
 * @param {Object}  linkProps   linkTarget / linkRel / linkTitle.
 * @param {Object}  capsuleProps Capsule rendering options.
 * @param {number}  activeIndex Index of the logo shown first (editor preview
 *                              passes the currently rotating one).
 * @param {Object}  opts        Editor-preview-only options ({ balance, noLinks }).
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
				data-duration={getSpotlightDurationMs(attributes)}
				data-order={
					attributes.spotlightOrder === "random"
						? "random"
						: "sequence"
				}
			>
				{images.map((image, index) => {
					const content = renderLogoContent(
						image,
						linkProps,
						opts.loading || "lazy",
						opts,
						false
					);
					const style = getSpotlightItemStyle(attributes, index) || {};
					if (opts.balance) {
						style["--logo-scale"] = getBalanceScale(image).toFixed(3);
					}
					// On the front end the script attaches the mask: the URL
					// must not travel inside the saved markup, where post
					// filtering can strip url() values. The editor preview is
					// never saved, so it can mask right away.
					if (opts.mask && image.url) {
						style["--dbw-mask"] = 'url("' + image.url + '")';
					}
					return (
						<div
							key={"spot-" + index}
							className={
								"dbw-slider-item" +
								(index === activeIndex
									? " dbw-spot-active"
									: "") +
								(opts.mask && image.url
									? " dbw-spot-masked"
									: "")
							}
							style={
								Object.keys(style).length > 0 ? style : undefined
							}
						>
							{capsuleProps.enabled
								? wrapInCapsule(content, 0, index, capsuleProps)
								: content}
						</div>
					);
				})}
			</div>
		</div>
	);
}

/**
 * Render one scrolling track (one row).
 *
 * @param {Array}  rowImages Images belonging to this row.
 * @param {number} rowIndex  Zero-based row index (for keys).
 * @param {string} direction "normal" or "reverse" scroll direction.
 * @param {?string} duration Optional per-row scroll duration (varied mode).
 * @param {Object} linkProps linkTarget / linkRel / linkTitle.
 * @param {Object} capsuleProps Capsule rendering options.
 * @param {string} loading   Image loading attribute.
 * @param {Object} opts      Editor-preview-only options ({ balance, noLinks }).
 *                           Never passed by save(), so saved markup stays
 *                           byte-identical.
 */
function renderTrack(
	rowImages,
	rowIndex,
	direction,
	duration,
	linkProps,
	capsuleProps,
	loading = "lazy",
	opts = {}
) {
	const renderSet = (setIndex) =>
		rowImages.map((image, index) => {
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
					key={"s" + setIndex + "-" + index}
					className="dbw-slider-item"
					aria-hidden={decorative ? "true" : undefined}
					style={
						opts.balance
							? { "--logo-scale": getBalanceScale(image).toFixed(3) }
							: undefined
					}
				>
					{capsuleProps.enabled
						? wrapInCapsule(content, rowIndex, index, capsuleProps)
						: content}
				</div>
			);
		});

	const repeats = getRepeatCount(rowImages.length);
	let items = [];
	for (let i = 0; i < repeats; i++) {
		items = items.concat(renderSet(i));
	}

	return (
		<div className="dbw-slider-wrapper" key={"dbw-row-" + rowIndex}>
			<div
				className="dbw-slider-track"
				data-logo-count={rowImages.length}
				data-direction={direction}
				style={duration ? { "--scroll-duration": duration } : undefined}
			>
				{items}
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*  Frozen renderers for the deprecations (do not modify)                     */
/*                                                                            */
/*  These are verbatim copies of the v2.2.x renderers. The deprecated saves    */
/*  below MUST keep producing exactly the markup their version shipped, or     */
/*  every existing block on every installation is flagged as invalid content   */
/*  the next time an editor opens the post. Changes to the live renderers      */
/*  (accessibility attributes, lazy loading, ...) therefore never reach these. */
/* -------------------------------------------------------------------------- */

function frozenLogoContent(image, linkProps, loading, opts) {
	const { linkTarget, linkRel, linkTitle } = linkProps;
	const imgElement = (
		<img
			src={image.url}
			alt={image.alt || ""}
			width={image.width || undefined}
			height={image.height || undefined}
			loading={loading}
		/>
	);
	return image.link && !opts.noLinks ? (
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
	);
}
function frozenSpotlight(
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
				data-duration={getSpotlightDurationMs(attributes)}
				data-order={
					attributes.spotlightOrder === "random"
						? "random"
						: "sequence"
				}
			>
				{images.map((image, index) => {
					const content = frozenLogoContent(
						image,
						linkProps,
						"eager",
						opts
					);
					const style = getSpotlightItemStyle(attributes, index) || {};
					if (opts.balance) {
						style["--logo-scale"] = getBalanceScale(image).toFixed(3);
					}
					// On the front end the script attaches the mask: the URL
					// must not travel inside the saved markup, where post
					// filtering can strip url() values. The editor preview is
					// never saved, so it can mask right away.
					if (opts.mask && image.url) {
						style["--dbw-mask"] = 'url("' + image.url + '")';
					}
					return (
						<div
							key={"spot-" + index}
							className={
								"dbw-slider-item" +
								(index === activeIndex
									? " dbw-spot-active"
									: "") +
								(opts.mask && image.url
									? " dbw-spot-masked"
									: "")
							}
							style={
								Object.keys(style).length > 0 ? style : undefined
							}
						>
							{capsuleProps.enabled
								? wrapInCapsule(content, 0, index, capsuleProps)
								: content}
						</div>
					);
				})}
			</div>
		</div>
	);
}
function frozenTrack(
	rowImages,
	rowIndex,
	direction,
	duration,
	linkProps,
	capsuleProps,
	loading = "eager",
	opts = {}
) {
	const renderSet = (setIndex) =>
		rowImages.map((image, index) => {
			const content = frozenLogoContent(image, linkProps, loading, opts);
			return (
				<div
					key={"s" + setIndex + "-" + index}
					className="dbw-slider-item"
					style={
						opts.balance
							? { "--logo-scale": getBalanceScale(image).toFixed(3) }
							: undefined
					}
				>
					{capsuleProps.enabled
						? wrapInCapsule(content, rowIndex, index, capsuleProps)
						: content}
				</div>
			);
		});

	const repeats = getRepeatCount(rowImages.length);
	let items = [];
	for (let i = 0; i < repeats; i++) {
		items = items.concat(renderSet(i));
	}

	return (
		<div className="dbw-slider-wrapper" key={"dbw-row-" + rowIndex}>
			<div
				className="dbw-slider-track"
				data-logo-count={rowImages.length}
				data-direction={direction}
				style={duration ? { "--scroll-duration": duration } : undefined}
			>
				{items}
			</div>
		</div>
	);
}

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

/* -------------------------------------------------------------------------- */
/*  Block registration                                                        */
/* -------------------------------------------------------------------------- */

registerBlockType("infinite-logo-carousel-block/carousel", {
	apiVersion: 3,
	title: __("Logo Slider", "infinite-logo-carousel-block"),
	description: __(
		"Professional infinity logo carousel with customizable speed, spacing and hover-pause. Perfect for client, partner or sponsor logos.",
		"infinite-logo-carousel-block"
	),
	icon: "images-alt2",
	category: "media",
	supports: {
		html: false,
		align: ["wide", "full"],
	},
	attributes: BLOCK_ATTRIBUTES,

	deprecated: [
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
	],

	edit: ({ attributes, setAttributes }) => {
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
			spotlightColors,
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

		const addImage = (selection) => {
			const selectedImages = Array.isArray(selection)
				? selection
				: [selection];
			const newImages = selectedImages.map((img) => {
				// Prefer the "large" size over the full-size original to keep
				// page weight down. WordPress only generates "large" when the
				// original is bigger, so this never upscales a logo.
				const sizes = img.sizes || {};
				const chosen = sizes.large || sizes.full || {};
				const imageUrl =
					chosen.url || img.url || img.source_url || "";
				const image = {
					id: img.id,
					url: imageUrl,
					link: "",
					alt: img.alt || "",
				};
				// Store intrinsic dimensions matching the chosen size so the
				// front end can emit width/height (reduces layout shift / CLS).
				const width = chosen.width || img.width;
				const height = chosen.height || img.height;
				if (width && height) {
					image.width = width;
					image.height = height;
				}
				return image;
			});
			setAttributes({ images: [...images, ...newImages] });
		};

		// Spotlight colour cycle: the list always mirrors what is rendered, so
		// switching the mode on seeds it with the built-in palette.
		const spotColorList = getSpotlightColors(attributes);
		const setSpotColorList = (list) =>
			setAttributes({ spotlightColors: list });
		const updateSpotColor = (index, color) => {
			const list = [...spotColorList];
			list[index] = color || "#000000";
			setSpotColorList(list);
		};
		const addSpotColor = () => {
			setSpotColorList([
				...spotColorList,
				spotColorList[spotColorList.length - 1] || "#2563eb",
			]);
		};
		const removeSpotColor = (index) => {
			setSpotColorList(spotColorList.filter((_, i) => i !== index));
		};

		// One place for the logo colour, in every layout. In spotlight mode the
		// two extra modes (a single exact colour and the colour cycle) join the
		// same dropdown instead of opening a second colour control elsewhere.
		const logoColorValue =
			layout === "spotlight" && spotlightColorMode === "cycle"
				? "cycle"
				: layout === "spotlight" && spotlightColorMode === "single"
					? "custom"
					: blackLogos
						? "black"
						: logoColorMode;

		const setLogoColorMode = (value) => {
			if (layout !== "spotlight") {
				setAttributes({
					logoColorMode: value,
					blackLogos: value === "black",
				});
				return;
			}
			if (value === "cycle") {
				setAttributes({
					spotlightColorMode: "cycle",
					spotlightColors: spotColorList,
					logoColorMode: "original",
					blackLogos: false,
				});
				return;
			}
			if (value === "custom") {
				setAttributes({
					spotlightColorMode: "single",
					// Carry over a colour the user had already picked for the
					// filter-based custom mode.
					spotlightColor:
						logoColorMode === "custom"
							? logoCustomColor
							: spotlightColor,
					logoColorMode: "original",
					blackLogos: false,
				});
				return;
			}
			setAttributes({
				spotlightColorMode: "inherit",
				logoColorMode: value,
				blackLogos: value === "black",
			});
		};

		const removeImage = (index) => {
			setAttributes({ images: images.filter((_, i) => i !== index) });
		};

		const updateImageField = (field, value, index) => {
			const updated = [...images];
			updated[index] = { ...updated[index], [field]: value };
			setAttributes({ images: updated });
		};

		// Spotlight live preview: the frontend script does not run inside the
		// editor, so the editor rotates the active logo itself.
		const [spotIndex, setSpotIndex] = useState(0);
		const spotCount = images.length;
		useEffect(() => {
			if (layout !== "spotlight" || spotCount < 2) {
				return undefined;
			}
			const interval = setInterval(() => {
				setSpotIndex((current) => (current + 1) % spotCount);
			}, getSpotlightDurationMs(attributes));
			return () => clearInterval(interval);
		}, [layout, spotCount, spotlightDuration]);

		// Live preview: same markup and CSS as the front end, animated by the
		// stylesheet's fallback animation. Links are disabled and the reveal
		// class is pre-applied so the preview shows immediately.
		const previewCapsuleProps = {
			enabled: capsuleEnabled,
			style: capsuleStyle,
			colorADark: isColorDark(capsuleColorA),
			colorBDark: isColorDark(capsuleColorB),
			logoColor: capsuleLogoColor,
		};
		const previewLinkProps = { linkTarget, linkRel, linkTitle };
		const previewRows = buildSliderRows(attributes);

		const blockProps = useBlockProps({
			className: "dbw-partner-slider-editor-wrapper",
		});

		return (
			<div {...blockProps}>
				<InspectorControls>
					<PanelBody title={__("Images", "infinite-logo-carousel-block")}>
						<p>
							{__(
								"Add logos to create your infinity carousel.",
								"infinite-logo-carousel-block"
							)}
						</p>
					</PanelBody>
					<PanelBody
						title={__("Layout", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<SelectControl
							label={__("Display Mode", "infinite-logo-carousel-block")}
							value={layout}
							options={[
								{
									label: __(
										"Single Row",
										"infinite-logo-carousel-block"
									),
									value: "single",
								},
								{
									label: __(
										"Multiple Rows",
										"infinite-logo-carousel-block"
									),
									value: "rows",
								},
								{
									label: __(
										"Spotlight (one logo at a time)",
										"infinite-logo-carousel-block"
									),
									value: "spotlight",
								},
							]}
							onChange={(val) => setAttributes({ layout: val })}
						/>
						{layout === "rows" && (
							<Fragment>
								<RangeControl
									label={__(
										"Number of Rows",
										"infinite-logo-carousel-block"
									)}
									value={rowCount}
									onChange={(val) =>
										setAttributes({ rowCount: val })
									}
									min={2}
									max={4}
									step={1}
								/>
								<SelectControl
									label={__(
										"Row Gap",
										"infinite-logo-carousel-block"
									)}
									value={rowGap}
									options={[
										{ label: __("Small", "infinite-logo-carousel-block"), value: "small" },
										{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
										{ label: __("Large", "infinite-logo-carousel-block"), value: "large" },
										{ label: __("Extra Large", "infinite-logo-carousel-block"), value: "xlarge" },
										{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
									]}
									onChange={(val) =>
										setAttributes({ rowGap: val })
									}
								/>
								{rowGap === "custom" && (
									<RangeControl
										label={__("Custom Row Gap (px)", "infinite-logo-carousel-block")}
										value={rowGapCustom}
										onChange={(val) =>
											setAttributes({ rowGapCustom: val })
										}
										min={0}
										max={150}
										step={2}
									/>
								)}
								<SelectControl
									label={__(
										"Row Speed",
										"infinite-logo-carousel-block"
									)}
									help={__(
										"Uniform: all rows move at the same speed. Varied: each row moves slightly differently for a more dynamic look.",
										"infinite-logo-carousel-block"
									)}
									value={rowSpeedMode}
									options={[
										{
											label: __(
												"Uniform",
												"infinite-logo-carousel-block"
											),
											value: "uniform",
										},
										{
											label: __(
												"Varied",
												"infinite-logo-carousel-block"
											),
											value: "varied",
										},
									]}
									onChange={(val) =>
										setAttributes({ rowSpeedMode: val })
									}
								/>
								<p>
									{__(
										"Logos are distributed evenly across the rows. Adjacent rows scroll in opposite directions.",
										"infinite-logo-carousel-block"
									)}
								</p>
							</Fragment>
						)}
					</PanelBody>
					{layout === "spotlight" && (
						<PanelBody
							title={__("Spotlight", "infinite-logo-carousel-block")}
							initialOpen={true}
						>
							<RangeControl
								label={__(
									"Time per Logo (seconds)",
									"infinite-logo-carousel-block"
								)}
								help={__(
									"How long each logo stays visible before the next one takes over.",
									"infinite-logo-carousel-block"
								)}
								value={spotlightDuration}
								onChange={(val) =>
									setAttributes({
										spotlightDuration:
											val || SPOTLIGHT_MIN_DURATION,
									})
								}
								min={SPOTLIGHT_MIN_DURATION}
								max={SPOTLIGHT_MAX_DURATION}
								step={0.5}
							/>
							<SelectControl
								label={__(
									"Transition",
									"infinite-logo-carousel-block"
								)}
								value={spotlightTransition}
								options={[
									{ label: __("Fade", "infinite-logo-carousel-block"), value: "fade" },
									{ label: __("Slide up", "infinite-logo-carousel-block"), value: "slide" },
									{ label: __("Hard cut", "infinite-logo-carousel-block"), value: "none" },
								]}
								onChange={(val) =>
									setAttributes({
										spotlightTransition: val,
									})
								}
							/>
							<SelectControl
								label={__(
									"Order",
									"infinite-logo-carousel-block"
								)}
								value={spotlightOrder}
								options={[
									{ label: __("As added", "infinite-logo-carousel-block"), value: "sequence" },
									{ label: __("Random", "infinite-logo-carousel-block"), value: "random" },
								]}
								onChange={(val) =>
									setAttributes({ spotlightOrder: val })
								}
							/>
							<SelectControl
								label={__(
									"Alignment",
									"infinite-logo-carousel-block"
								)}
								value={spotlightAlign}
								options={[
									{ label: __("Left", "infinite-logo-carousel-block"), value: "left" },
									{ label: __("Center", "infinite-logo-carousel-block"), value: "center" },
									{ label: __("Right", "infinite-logo-carousel-block"), value: "right" },
								]}
								onChange={(val) =>
									setAttributes({ spotlightAlign: val })
								}
							/>
							<p>
								{__(
									"Every logo takes its turn in the same spot. The edge gradient and the scrolling speed do not apply in this mode.",
									"infinite-logo-carousel-block"
								)}
							</p>
						</PanelBody>
					)}
					<PanelBody
						title={__("Speed", "infinite-logo-carousel-block")}
						initialOpen={true}
					>
						{layout !== "spotlight" && (
							<Fragment>
						<SelectControl
							label={__("Carousel Speed", "infinite-logo-carousel-block")}
							value={speed}
							options={[
								{ label: __("Slow", "infinite-logo-carousel-block"), value: "slow" },
								{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
								{ label: __("Fast", "infinite-logo-carousel-block"), value: "fast" },
								{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
							]}
							onChange={(val) => setAttributes({ speed: val })}
						/>
						{speed === "custom" && (
							<RangeControl
								label={__("Custom Speed (seconds)", "infinite-logo-carousel-block")}
								help={__("A higher value means slower scrolling.", "infinite-logo-carousel-block")}
								value={speedCustom}
								onChange={(val) => setAttributes({ speedCustom: val })}
								min={5}
								max={300}
								step={5}
							/>
						)}
							</Fragment>
						)}
						<ToggleControl
							label={__("Show pause button", "infinite-logo-carousel-block")}
							help={__("Adds a small pause/play button in the corner so visitors can stop the animation (recommended for accessibility).", "infinite-logo-carousel-block")}
							checked={showPauseButton}
							onChange={(val) => setAttributes({ showPauseButton: val })}
						/>
						<ToggleControl
							label={__("Load images immediately", "infinite-logo-carousel-block")}
							help={__("Logos load lazily by default, which keeps the page fast. Turn this on only if the carousel sits at the very top of the page, above the fold.", "infinite-logo-carousel-block")}
							checked={eagerLoading}
							onChange={(val) => setAttributes({ eagerLoading: val })}
						/>
						<TextControl
							label={__("Screen reader label (optional)", "infinite-logo-carousel-block")}
							help={__("Gives the carousel a name for screen readers, e.g. \"Our clients\". Leave empty to add no landmark at all.", "infinite-logo-carousel-block")}
							value={ariaLabel}
							placeholder={__("Our clients", "infinite-logo-carousel-block")}
							onChange={(val) => setAttributes({ ariaLabel: val })}
						/>
					</PanelBody>
					<PanelBody
						title={__("Logo Spacing", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<SelectControl
							label={__("Gap between logos", "infinite-logo-carousel-block")}
							value={gap}
							options={[
								{ label: __("Small", "infinite-logo-carousel-block"), value: "small" },
								{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
								{ label: __("Large", "infinite-logo-carousel-block"), value: "large" },
								{ label: __("Extra Large", "infinite-logo-carousel-block"), value: "xlarge" },
								{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
							]}
							onChange={(val) => setAttributes({ gap: val })}
						/>
						{gap === "custom" && (
							<RangeControl
								label={__("Custom Gap (px)", "infinite-logo-carousel-block")}
								value={gapCustom}
								onChange={(val) => setAttributes({ gapCustom: val })}
								min={0}
								max={200}
								step={5}
							/>
						)}
					</PanelBody>
					<PanelBody
						title={__("Margins", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<SelectControl
							label={__("Top/Bottom Margin", "infinite-logo-carousel-block")}
							value={marginSize}
							options={[
								{ label: __("Small (25px)", "infinite-logo-carousel-block"), value: "small" },
								{ label: __("Medium (50px)", "infinite-logo-carousel-block"), value: "medium" },
								{ label: __("Large (75px)", "infinite-logo-carousel-block"), value: "large" },
							]}
							onChange={(val) => setAttributes({ marginSize: val })}
						/>
					</PanelBody>
					<PanelBody
						title={__("Logo Size", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<RangeControl
							label={__("Maximum Logo Height (px)", "infinite-logo-carousel-block")}
							help={__("Sets the maximum height for logos. Width adjusts automatically.", "infinite-logo-carousel-block")}
							value={parseInt(logoHeight)}
							onChange={(val) => setAttributes({ logoHeight: val.toString() })}
							min={30}
							max={150}
							step={5}
						/>
						<SelectControl
							label={__("Quick Select", "infinite-logo-carousel-block")}
							value={logoHeight}
							options={[
								{ label: __("Small (40px)", "infinite-logo-carousel-block"), value: "40" },
								{ label: __("Medium (50px)", "infinite-logo-carousel-block"), value: "50" },
								{ label: __("Large (70px)", "infinite-logo-carousel-block"), value: "70" },
								{ label: __("Extra Large (100px)", "infinite-logo-carousel-block"), value: "100" },
							]}
							onChange={(val) => setAttributes({ logoHeight: val })}
						/>
						<ToggleControl
							label={__("Balance logo sizes", "infinite-logo-carousel-block")}
							help={__("Compensates different logo proportions: wide logos render slightly smaller, compact logos slightly larger, so every logo carries similar visual weight.", "infinite-logo-carousel-block")}
							checked={balanceLogos}
							onChange={(val) => setAttributes({ balanceLogos: val })}
						/>
						<ToggleControl
							label={__("Custom height on phones", "infinite-logo-carousel-block")}
							help={__("By default, logos scale down automatically on small screens. Enable this to set a fixed logo height for phones instead.", "infinite-logo-carousel-block")}
							checked={logoHeightMobile !== ""}
							onChange={(val) =>
								setAttributes({
									logoHeightMobile: val
										? String(
												Math.max(
													20,
													Math.round(
														(parseInt(logoHeight, 10) * 0.6) / 5
													) * 5
												)
										  )
										: "",
								})
							}
						/>
						{logoHeightMobile !== "" && (
							<RangeControl
								label={__("Mobile Logo Height (px)", "infinite-logo-carousel-block")}
								help={__("Applies on screens narrower than 600px.", "infinite-logo-carousel-block")}
								value={parseInt(logoHeightMobile, 10)}
								onChange={(val) =>
									setAttributes({ logoHeightMobile: val.toString() })
								}
								min={20}
								max={120}
								step={5}
							/>
						)}
					</PanelBody>
					{layout !== "spotlight" && (
					<PanelBody
						title={__("Overlay Settings", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<ToggleControl
							label={__("Show Overlay", "infinite-logo-carousel-block")}
							help={__("Shows a gradient overlay at the edges of the carousel.", "infinite-logo-carousel-block")}
							checked={overlayEnabled}
							onChange={(val) => setAttributes({ overlayEnabled: val })}
						/>
						{overlayEnabled && (
							<PanelColorSettings
								title={__("Overlay Color", "infinite-logo-carousel-block")}
								colorSettings={[
									{
										value: overlayColor,
										onChange: (color) => setAttributes({ overlayColor: color || "#ffffff" }),
										label: __("Background color for overlay", "infinite-logo-carousel-block"),
									},
								]}
							/>
						)}
					</PanelBody>
					)}
					<PanelBody
						title={__("Logo Display", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<SelectControl
							label={__("Logo Color", "infinite-logo-carousel-block")}
							help={
								layout === "spotlight"
									? __("One color, or a color cycle that gives every logo its own color in turn.", "infinite-logo-carousel-block")
									: __("Applies a uniform color to all logos for a cohesive look.", "infinite-logo-carousel-block")
							}
							value={logoColorValue}
							options={[
								{ label: __("Original", "infinite-logo-carousel-block"), value: "original" },
								{ label: __("Black", "infinite-logo-carousel-block"), value: "black" },
								{ label: __("White", "infinite-logo-carousel-block"), value: "white" },
								{ label: __("Grayscale", "infinite-logo-carousel-block"), value: "grayscale" },
								{ label: __("Custom Color", "infinite-logo-carousel-block"), value: "custom" },
								...(layout === "spotlight"
									? [
											{
												label: __("Color cycle", "infinite-logo-carousel-block"),
												value: "cycle",
											},
									  ]
									: []),
							]}
							onChange={setLogoColorMode}
						/>
						{logoColorValue === "custom" && (
							<Fragment>
								<p className="components-base-control__label">
									{__("Custom Color", "infinite-logo-carousel-block")}
								</p>
								<ColorPalette
									value={
										layout === "spotlight"
											? spotlightColor
											: logoCustomColor
									}
									onChange={(color) =>
										setAttributes(
											layout === "spotlight"
												? {
														spotlightColor:
															color || "#2563eb",
												  }
												: {
														logoCustomColor:
															color || "#999999",
												  }
										)
									}
								/>
							</Fragment>
						)}
						{logoColorValue === "cycle" && (
							<div className="dbw-spot-color-list">
								{spotColorList.map((color, index) => (
									<div
										className="dbw-spot-color-row"
										key={"spot-color-" + index}
									>
										<p className="components-base-control__label">
											{__("Color", "infinite-logo-carousel-block") +
												" " +
												(index + 1)}
										</p>
										<ColorPalette
											value={color}
											onChange={(value) =>
												updateSpotColor(index, value)
											}
										/>
										{spotColorList.length > 1 && (
											<Button
												isDestructive
												variant="tertiary"
												onClick={() =>
													removeSpotColor(index)
												}
											>
												{__("Remove color", "infinite-logo-carousel-block")}
											</Button>
										)}
									</div>
								))}
								<Button variant="secondary" onClick={addSpotColor}>
									{__("Add color", "infinite-logo-carousel-block")}
								</Button>
							</div>
						)}
						{logoColorValue !== "original" && (
							<ToggleControl
								label={__("Original colors on hover", "infinite-logo-carousel-block")}
								help={__("The logo returns to its original colors when the visitor hovers over it. Works with every color mode.", "infinite-logo-carousel-block")}
								checked={colorOnHover}
								onChange={(val) => setAttributes({ colorOnHover: val })}
							/>
						)}
					</PanelBody>
					<PanelBody
						title={__("Capsule Style", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<ToggleControl
							label={__("Enable Capsules", "infinite-logo-carousel-block")}
							help={__("Places each logo inside a rounded background container.", "infinite-logo-carousel-block")}
							checked={capsuleEnabled}
							onChange={(val) => setAttributes({ capsuleEnabled: val })}
						/>
						{capsuleEnabled && (
							<Fragment>
								<SelectControl
									label={__("Background Style", "infinite-logo-carousel-block")}
									help={__("Uniform: all capsules use one color. Alternating: capsules alternate between two colors in a checkerboard.", "infinite-logo-carousel-block")}
									value={capsuleStyle}
									options={[
										{ label: __("Uniform", "infinite-logo-carousel-block"), value: "uniform" },
										{ label: __("Alternating", "infinite-logo-carousel-block"), value: "alternating" },
											{ label: __("Outline", "infinite-logo-carousel-block"), value: "outline" },
									]}
									onChange={(val) => setAttributes({ capsuleStyle: val })}
								/>
								<SelectControl
									label={__("Corner Style", "infinite-logo-carousel-block")}
									value={capsuleRadius}
									options={[
										{ label: __("Square", "infinite-logo-carousel-block"), value: "square" },
										{ label: __("Rounded", "infinite-logo-carousel-block"), value: "rounded" },
										{ label: __("Pill", "infinite-logo-carousel-block"), value: "pill" },
										{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
									]}
									onChange={(val) => setAttributes({ capsuleRadius: val })}
								/>
								{capsuleRadius === "custom" && (
									<RangeControl
										label={__("Custom Corner Radius (px)", "infinite-logo-carousel-block")}
										value={capsuleRadiusCustom}
										onChange={(val) => setAttributes({ capsuleRadiusCustom: val })}
										min={0}
										max={100}
										step={1}
									/>
								)}
								<SelectControl
									label={__("Padding", "infinite-logo-carousel-block")}
									value={capsulePadding}
									options={[
										{ label: __("Small", "infinite-logo-carousel-block"), value: "small" },
										{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
										{ label: __("Large", "infinite-logo-carousel-block"), value: "large" },
										{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
									]}
									onChange={(val) => setAttributes({ capsulePadding: val })}
								/>
								{capsulePadding === "custom" && (
									<RangeControl
										label={__("Custom Padding (px)", "infinite-logo-carousel-block")}
										value={capsulePaddingCustom}
										onChange={(val) => setAttributes({ capsulePaddingCustom: val })}
										min={0}
										max={80}
										step={2}
									/>
								)}
								<PanelColorSettings
									title={__("Capsule Colors", "infinite-logo-carousel-block")}
									colorSettings={
										capsuleStyle === "alternating"
											? [
													{
														value: capsuleColorA,
														onChange: (color) => setAttributes({ capsuleColorA: color || "#000000" }),
														label: __("Color A", "infinite-logo-carousel-block"),
													},
													{
														value: capsuleColorB,
														onChange: (color) => setAttributes({ capsuleColorB: color || "#ffffff" }),
														label: __("Color B", "infinite-logo-carousel-block"),
													},
											  ]
											: [
													{
														value: capsuleColorA,
														onChange: (color) => setAttributes({ capsuleColorA: color || "#000000" }),
														label: __("Capsule color", "infinite-logo-carousel-block"),
													},
											  ]
									}
								/>
								{capsuleStyle === "outline" && (
										<SelectControl
											label={__("Border Width", "infinite-logo-carousel-block")}
											value={capsuleBorderWidth}
											options={[
												{ label: __("Thin", "infinite-logo-carousel-block"), value: "thin" },
												{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
												{ label: __("Thick", "infinite-logo-carousel-block"), value: "thick" },
												{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
											]}
											onChange={(val) => setAttributes({ capsuleBorderWidth: val })}
										/>
									)}
									{capsuleStyle === "outline" && capsuleBorderWidth === "custom" && (
										<RangeControl
											label={__("Custom Border Width (px)", "infinite-logo-carousel-block")}
											value={capsuleBorderWidthCustom}
											onChange={(val) => setAttributes({ capsuleBorderWidthCustom: val })}
											min={1}
											max={10}
											step={1}
										/>
									)}
									<SelectControl
									label={__("Logo Color", "infinite-logo-carousel-block")}
									help={
										capsuleStyle === "outline"
											? __("Outline capsules have no background — choose how the logos are colored.", "infinite-logo-carousel-block")
											: __("Auto-Contrast picks white or black based on the capsule background. Choose Original Colors to keep your logos unchanged.", "infinite-logo-carousel-block")
									}
									value={capsuleLogoColor}
									options={
										capsuleStyle === "outline"
											? [
													{ label: __("Original Colors", "infinite-logo-carousel-block"), value: "original" },
													{ label: __("White", "infinite-logo-carousel-block"), value: "white" },
													{ label: __("Black", "infinite-logo-carousel-block"), value: "black" },
											  ]
											: [
													{ label: __("Auto-Contrast", "infinite-logo-carousel-block"), value: "original" },
													{ label: __("Original Colors", "infinite-logo-carousel-block"), value: "none" },
													{ label: __("White", "infinite-logo-carousel-block"), value: "white" },
													{ label: __("Black", "infinite-logo-carousel-block"), value: "black" },
											  ]
									}
									onChange={(val) => setAttributes({ capsuleLogoColor: val })}
								/>
									<ToggleControl
										label={__("Glow Effect", "infinite-logo-carousel-block")}
										help={__("Adds a soft colored glow around each capsule.", "infinite-logo-carousel-block")}
										checked={capsuleGlow}
										onChange={(val) => setAttributes({ capsuleGlow: val })}
									/>
									{capsuleGlow && (
										<SelectControl
											label={__("Glow Intensity", "infinite-logo-carousel-block")}
											value={capsuleGlowSize}
											options={[
												{ label: __("Subtle", "infinite-logo-carousel-block"), value: "subtle" },
												{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
												{ label: __("Strong", "infinite-logo-carousel-block"), value: "strong" },
												{ label: __("Custom", "infinite-logo-carousel-block"), value: "custom" },
											]}
											onChange={(val) => setAttributes({ capsuleGlowSize: val })}
										/>
									)}
									{capsuleGlow && capsuleGlowSize === "custom" && (
										<RangeControl
											label={__("Custom Glow Size (px)", "infinite-logo-carousel-block")}
											value={capsuleGlowSizeCustom}
											onChange={(val) => setAttributes({ capsuleGlowSizeCustom: val })}
											min={0}
											max={60}
											step={2}
										/>
									)}
									{capsuleStyle === "alternating" && (
									<p>
										{__("For a flawless checkerboard, use an even total number of logos.", "infinite-logo-carousel-block")}
									</p>
								)}
							</Fragment>
						)}
					</PanelBody>
					<PanelBody
						title={__("Link Settings", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<SelectControl
							label={__("Link Target", "infinite-logo-carousel-block")}
							help={__("Determines where logo links open.", "infinite-logo-carousel-block")}
							value={linkTarget}
							options={[
								{ label: __("Same window (_self)", "infinite-logo-carousel-block"), value: "_self" },
								{ label: __("New window (_blank)", "infinite-logo-carousel-block"), value: "_blank" },
							]}
							onChange={(val) => setAttributes({ linkTarget: val })}
						/>
						<TextControl
							label={__("Rel Attributes", "infinite-logo-carousel-block")}
							help={__("Separate multiple values with spaces (e.g. 'nofollow sponsored').", "infinite-logo-carousel-block")}
							value={linkRel}
							placeholder="nofollow noopener sponsored"
							onChange={(val) => setAttributes({ linkRel: val })}
						/>
						<TextControl
							label={__("Title Attribute (optional)", "infinite-logo-carousel-block")}
							help={__("Tooltip text for all logo links.", "infinite-logo-carousel-block")}
							value={linkTitle}
							placeholder={__("Visit our partner", "infinite-logo-carousel-block")}
							onChange={(val) => setAttributes({ linkTitle: val })}
						/>
					</PanelBody>
				</InspectorControls>

				{images.length > 0 && (
					<div
						className={
							sliderClasses(attributes) + " dbw-ready dbw-editor-preview"
						}
						style={sliderStyle(attributes)}
					>
						{layout === "spotlight" &&
							renderSpotlight(
								attributes,
								previewLinkProps,
								previewCapsuleProps,
								images.length > 0
									? spotIndex % images.length
									: 0,
								{
									balance: balanceLogos,
									noLinks: true,
									mask: usesSpotlightMask(attributes),
								}
							)}
						{layout !== "spotlight" &&
							previewRows.map((rowImages, rowIndex) => {
							const direction =
								rowIndex % 2 === 1 ? "reverse" : "normal";
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
								previewLinkProps,
								previewCapsuleProps,
								"eager",
								{ balance: balanceLogos, noLinks: true }
							);
						})}
						{showPauseButton && (
							<button
								className="dbw-pause-btn"
								type="button"
								aria-pressed="false"
								tabIndex={-1}
							></button>
						)}
					</div>
				)}

				<div className="dbw-partner-slider-editor">
					<div className="dbw-partner-slider-images">
						{images.map((image, index) => (
							<div className="dbw-partner-slider-image" key={image.id || index}>
								{image.url && (
									<img
										src={image.url}
										alt={image.alt || __("Logo", "infinite-logo-carousel-block")}
										style={{
											filter: blackLogos
												? "brightness(0)"
												: logoColorMode === "white"
													? "brightness(0) invert(1)"
													: logoColorMode === "grayscale"
														? "grayscale(1)"
														: logoColorMode === "custom"
															? computeColorFilter(logoCustomColor)
															: "none",
											maxHeight:
												Math.round(
													parseInt(logoHeight, 10) *
														(balanceLogos
															? getBalanceScale(image)
															: 1)
												) + "px",
										}}
									/>
								)}
								<TextControl
									label={__("Alt Text (optional)", "infinite-logo-carousel-block")}
									value={image.alt || ""}
									onChange={(val) => updateImageField("alt", val, index)}
									placeholder={__("Describe this logo", "infinite-logo-carousel-block")}
								/>
								<TextControl
									label={__("Logo Link (optional)", "infinite-logo-carousel-block")}
									value={image.link || ""}
									onChange={(val) => updateImageField("link", val, index)}
									className={image.link && !isValidUrl(image.link) ? "dbw-invalid-url" : ""}
								/>
								<Button
									isDestructive
									variant="secondary"
									className="dbw-remove-button"
									onClick={() => removeImage(index)}
								>
									{__("Remove", "infinite-logo-carousel-block")}
								</Button>
							</div>
						))}
					</div>
					<MediaUpload
						onSelect={addImage}
						allowedTypes={["image"]}
						multiple
						render={({ open }) => (
							<Button onClick={open} isPrimary>
								{__("Add Images", "infinite-logo-carousel-block")}
							</Button>
						)}
					/>
				</div>
			</div>
		);
	},

	save: ({ attributes }) => {
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
	},
});
