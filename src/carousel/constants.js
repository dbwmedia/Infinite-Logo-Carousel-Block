/**
 * Shared constants and the attribute schema of the Logo Slider block.
 */

const SPEED_MAP = { slow: '40s', medium: '25s', fast: '15s' };
const GAP_MAP = {
	small: '20px',
	medium: '40px',
	large: '60px',
	xlarge: '100px',
};
const MARGIN_MAP = {
	none: '0px',
	small: '25px',
	medium: '50px',
	large: '75px',
};
const ROW_GAP_MAP = {
	small: '12px',
	medium: '24px',
	large: '48px',
	xlarge: '72px',
};

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
const ROW_SPEED_FACTORS = [ 1, 1.22, 0.86, 1.4 ];

/**
 * Border-radius presets for capsules ("custom" uses capsuleRadiusCustom).
 */
const CAPSULE_RADIUS_MAP = { square: '0', rounded: '14px', pill: '999px' };

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
const CAPSULE_BORDER_MAP = { thin: '1px', medium: '2px', thick: '4px' };

/**
 * Glow-size (box-shadow blur) presets for the optional capsule glow.
 */
const CAPSULE_GLOW_MAP = { subtle: '6px', medium: '14px', strong: '26px' };

/**
 * Spotlight mode: colour cycle used when the user switches to "Color cycle"
 * without having picked colours yet.
 */
const DEFAULT_SPOTLIGHT_COLORS = [ '#2563eb', '#db2777', '#f59e0b' ];

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
	images: { type: 'array', default: [] },
	speed: { type: 'string', default: 'medium' },
	speedCustom: { type: 'number', default: 60 },
	gap: { type: 'string', default: 'medium' },
	gapCustom: { type: 'number', default: 40 },
	marginSize: { type: 'string', default: 'medium' },
	logoHeight: { type: 'string', default: '50' },
	logoHeightMobile: { type: 'string', default: '' },
	balanceLogos: { type: 'boolean', default: false },
	showPauseButton: { type: 'boolean', default: false },
	eagerLoading: { type: 'boolean', default: false },
	ariaLabel: { type: 'string', default: '' },
	overlayEnabled: { type: 'boolean', default: true },
	overlayColor: { type: 'string', default: '#ffffff' },
	blackLogos: { type: 'boolean', default: false },
	logoColorMode: { type: 'string', default: 'original' },
	logoCustomColor: { type: 'string', default: '#999999' },
	colorOnHover: { type: 'boolean', default: false },
	linkTarget: { type: 'string', default: '_self' },
	linkRel: { type: 'string', default: '' },
	linkTitle: { type: 'string', default: '' },
	layout: { type: 'string', default: 'single' },
	spotlightDuration: { type: 'number', default: 2 },
	spotlightTransition: { type: 'string', default: 'fade' },
	spotlightOrder: { type: 'string', default: 'sequence' },
	spotlightAlign: { type: 'string', default: 'center' },
	spotlightColorMode: { type: 'string', default: 'inherit' },
	spotlightColor: { type: 'string', default: '#2563eb' },
	spotlightColors: { type: 'array', default: [] },
	rowCount: { type: 'number', default: 3 },
	rowSpeedMode: { type: 'string', default: 'uniform' },
	rowGap: { type: 'string', default: 'medium' },
	rowGapCustom: { type: 'number', default: 24 },
	capsuleEnabled: { type: 'boolean', default: false },
	capsuleStyle: { type: 'string', default: 'alternating' },
	capsuleRadius: { type: 'string', default: 'pill' },
	capsuleRadiusCustom: { type: 'number', default: 16 },
	capsulePadding: { type: 'string', default: 'medium' },
	capsulePaddingCustom: { type: 'number', default: 12 },
	capsuleColorA: { type: 'string', default: '#000000' },
	capsuleColorB: { type: 'string', default: '#ffffff' },
	capsuleBorderWidth: { type: 'string', default: 'medium' },
	capsuleBorderWidthCustom: { type: 'number', default: 2 },
	capsuleLogoColor: { type: 'string', default: 'original' },
	capsuleGlow: { type: 'boolean', default: false },
	capsuleGlowSize: { type: 'string', default: 'medium' },
	capsuleGlowSizeCustom: { type: 'number', default: 12 },
};

/**
 * Attribute set used by pre-v1.3 saved content (before the layout options
 * existed). Used only for block deprecations.
 */
const LEGACY_ATTRIBUTES = {
	images: { type: 'array', default: [] },
	speed: { type: 'string', default: 'medium' },
	gap: { type: 'string', default: 'medium' },
	marginSize: { type: 'string', default: 'medium' },
	logoHeight: { type: 'string', default: '50' },
	overlayEnabled: { type: 'boolean', default: true },
	overlayColor: { type: 'string', default: '#ffffff' },
	blackLogos: { type: 'boolean', default: false },
	linkTarget: { type: 'string', default: '_self' },
	linkRel: { type: 'string', default: '' },
	linkTitle: { type: 'string', default: '' },
};

export {
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
};
