import { registerBlockType } from "@wordpress/blocks";
import {
	InspectorControls,
	MediaUpload,
	PanelColorSettings,
} from "@wordpress/block-editor";
import {
	PanelBody,
	Button,
	SelectControl,
	TextControl,
	ToggleControl,
	RangeControl,
} from "@wordpress/components";
import { Fragment } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import "./editor.scss";
import "./style.scss";

const SPEED_MAP = { slow: "40s", medium: "25s", fast: "15s" };
const GAP_MAP = { small: "20px", medium: "40px", large: "60px" };
const MARGIN_MAP = { small: "25px", medium: "50px", large: "75px" };

/**
 * Per-row duration multipliers for the "varied" row speed mode. Adjacent rows
 * get noticeably different factors so the rows never move in lockstep.
 */
const ROW_SPEED_FACTORS = [1, 1.22, 0.86, 1.4];

/**
 * Current block attributes (v1.3+).
 */
const BLOCK_ATTRIBUTES = {
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
	layout: { type: "string", default: "single" },
	rowCount: { type: "number", default: 3 },
	rowSpeedMode: { type: "string", default: "uniform" },
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
	if (!attributes.overlayEnabled) classes.push("no-overlay");
	if (attributes.blackLogos) classes.push("black-logos");
	return classes.join(" ");
}

/**
 * Build the CSS custom properties applied to the slider wrapper. The logo
 * count now lives per track (data-logo-count), not on the slider.
 */
function sliderStyle(attributes) {
	const { speed, gap, marginSize, overlayColor, logoHeight } = attributes;
	return {
		"--scroll-duration": SPEED_MAP[speed] || "25s",
		"--slide-gap": GAP_MAP[gap] || "40px",
		"--outer-margin": MARGIN_MAP[marginSize] || "50px",
		"--overlay-color": overlayColor || "#ffffff",
		"--logo-height": logoHeight + "px",
	};
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
 * Duration for a single row in "varied" speed mode.
 */
function getRowDuration(speed, rowIndex) {
	const base = parseFloat(SPEED_MAP[speed] || "25s");
	const factor = ROW_SPEED_FACTORS[rowIndex % ROW_SPEED_FACTORS.length];
	return Math.round(base * factor * 10) / 10 + "s";
}

/**
 * Render one scrolling track (one row).
 *
 * @param {Array}  rowImages Images belonging to this row.
 * @param {number} rowIndex  Zero-based row index (for keys).
 * @param {string} direction "normal" or "reverse" scroll direction.
 * @param {?string} duration Optional per-row scroll duration (varied mode).
 * @param {Object} linkProps linkTarget / linkRel / linkTitle.
 */
function renderTrack(rowImages, rowIndex, direction, duration, linkProps) {
	const { linkTarget, linkRel, linkTitle } = linkProps;

	const renderSet = (setIndex) =>
		rowImages.map((image, index) => {
			const imgElement = (
				<img
					src={image.url}
					alt={image.alt || ""}
					width={image.width || undefined}
					height={image.height || undefined}
					loading="lazy"
				/>
			);
			return (
				<div key={"s" + setIndex + "-" + index} className="dbw-slider-item">
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

/* -------------------------------------------------------------------------- */
/*  Block registration                                                        */
/* -------------------------------------------------------------------------- */

registerBlockType("infinite-logo-carousel-block/carousel", {
	title: __("Infinite Logo Carousel", "infinite-logo-carousel-block"),
	description: __(
		"Professional infinity logo carousel with customizable speed, spacing and hover-pause. Perfect for client, partner or sponsor logos.",
		"infinite-logo-carousel-block"
	),
	icon: "images-alt2",
	category: "media",
	attributes: BLOCK_ATTRIBUTES,

	deprecated: [
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
			gap,
			marginSize,
			logoHeight,
			overlayEnabled,
			overlayColor,
			blackLogos,
			linkTarget,
			linkRel,
			linkTitle,
			layout,
			rowCount,
			rowSpeedMode,
		} = attributes;

		const addImage = (selection) => {
			const selectedImages = Array.isArray(selection)
				? selection
				: [selection];
			const newImages = selectedImages.map((img) => {
				const imageUrl =
					img.url || img.sizes?.full?.url || img.source_url || "";
				const image = {
					id: img.id,
					url: imageUrl,
					link: "",
					alt: img.alt || "",
				};
				// Store intrinsic dimensions when available so the front end
				// can emit width/height (reduces layout shift / CLS).
				if (img.width && img.height) {
					image.width = img.width;
					image.height = img.height;
				}
				return image;
			});
			setAttributes({ images: [...images, ...newImages] });
		};

		const removeImage = (index) => {
			setAttributes({ images: images.filter((_, i) => i !== index) });
		};

		const updateImageField = (field, value, index) => {
			const updated = [...images];
			updated[index] = { ...updated[index], [field]: value };
			setAttributes({ images: updated });
		};

		return (
			<div className="dbw-partner-slider-editor-wrapper">
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
					<PanelBody
						title={__("Speed", "infinite-logo-carousel-block")}
						initialOpen={true}
					>
						<SelectControl
							label={__("Carousel Speed", "infinite-logo-carousel-block")}
							value={speed}
							options={[
								{ label: __("Slow", "infinite-logo-carousel-block"), value: "slow" },
								{ label: __("Medium", "infinite-logo-carousel-block"), value: "medium" },
								{ label: __("Fast", "infinite-logo-carousel-block"), value: "fast" },
							]}
							onChange={(val) => setAttributes({ speed: val })}
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
							]}
							onChange={(val) => setAttributes({ gap: val })}
						/>
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
					</PanelBody>
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
					<PanelBody
						title={__("Logo Display", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<ToggleControl
							label={__("Convert to Black", "infinite-logo-carousel-block")}
							help={__("Converts all logos to black for a uniform appearance.", "infinite-logo-carousel-block")}
							checked={blackLogos}
							onChange={(val) => setAttributes({ blackLogos: val })}
						/>
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

				<div className="dbw-partner-slider-editor">
					<div className="dbw-partner-slider-images">
						{images.map((image, index) => (
							<div className="dbw-partner-slider-image" key={image.id || index}>
								{image.url && (
									<img
										src={image.url}
										alt={image.alt || __("Logo", "infinite-logo-carousel-block")}
										style={{
											filter: blackLogos ? "brightness(0)" : "none",
											maxHeight: logoHeight + "px",
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
			images,
			overlayEnabled,
			blackLogos,
			layout,
			rowCount,
			rowSpeedMode,
			speed,
			linkTarget,
			linkRel,
			linkTitle,
		} = attributes;

		const linkProps = { linkTarget, linkRel, linkTitle };

		// Build the rows: in "rows" layout the logos are distributed evenly
		// (interleaved) across 2–4 rows; otherwise a single row holds them all.
		let rows;
		if (layout === "rows") {
			const count = Math.min(
				Math.max(parseInt(rowCount, 10) || 3, 2),
				4
			);
			rows = [];
			for (let r = 0; r < count; r++) rows.push([]);
			images.forEach((image, i) => {
				rows[i % count].push(image);
			});
			rows = rows.filter((row) => row.length > 0);
		} else {
			rows = [images];
		}

		return (
			<div
				className={sliderClasses(attributes)}
				style={sliderStyle(attributes)}
			>
				{rows.map((rowImages, rowIndex) => {
					// Adjacent rows scroll in opposite directions.
					const direction = rowIndex % 2 === 1 ? "reverse" : "normal";
					// Per-row duration only in multi-row "varied" speed mode.
					const duration =
						layout === "rows" && rowSpeedMode === "varied"
							? getRowDuration(speed, rowIndex)
							: null;
					return renderTrack(
						rowImages,
						rowIndex,
						direction,
						duration,
						linkProps
					);
				})}
			</div>
		);
	},
});
