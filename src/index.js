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
import { __ } from "@wordpress/i18n";
import "./editor.scss";
import "./style.scss";

const SPEED_MAP = { slow: "40s", medium: "25s", fast: "15s" };
const GAP_MAP = { small: "20px", medium: "40px", large: "60px" };
const MARGIN_MAP = { small: "25px", medium: "50px", large: "75px" };

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

function buildSliderClasses(overlayEnabled, blackLogos) {
	const classes = ["dbw-partner-slider"];
	if (!overlayEnabled) classes.push("no-overlay");
	if (blackLogos) classes.push("black-logos");
	return classes.join(" ");
}

function buildSliderStyle(attributes) {
	const { speed, gap, marginSize, overlayColor, images, logoHeight } = attributes;
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
 * Deprecated save v1.1.1 – without loading="lazy" and alt text support
 */
const deprecatedSaveV1 = ({ attributes }) => {
	const { images, overlayEnabled, blackLogos, linkTarget, linkRel, linkTitle } = attributes;

	const renderImages = () =>
		images.map((image, index) => {
			const imgElement = <img src={image.url} alt="" />;
			return (
				<div key={index} className="dbw-slider-item">
					{image.link ? (
						<a
							href={image.link}
							target={linkTarget || "_self"}
							rel={linkTarget === "_blank" ? `noopener noreferrer${linkRel ? ` ${linkRel}` : ""}` : linkRel || undefined}
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
			className={buildSliderClasses(overlayEnabled, blackLogos)}
			style={buildSliderStyle(attributes)}
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

registerBlockType("infinite-logo-carousel-block/carousel", {
	title: __("Infinite Logo Carousel", "infinite-logo-carousel-block"),
	description: __(
		"Professional infinity logo carousel with customizable speed, spacing and hover-pause. Perfect for client, partner or sponsor logos.",
		"infinite-logo-carousel-block"
	),
	icon: "images-alt2",
	category: "common",
	attributes: BLOCK_ATTRIBUTES,

	deprecated: [
		{
			attributes: BLOCK_ATTRIBUTES,
			save: deprecatedSaveV1,
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
		} = attributes;

		const addImage = (selection) => {
			const selectedImages = Array.isArray(selection) ? selection : [selection];
			const newImages = selectedImages.map((img) => {
				const imageUrl = img.url || img.sizes?.full?.url || img.source_url || "";
				return { id: img.id, url: imageUrl, link: "", alt: img.alt || "" };
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
		const { images, overlayEnabled, blackLogos, linkTarget, linkRel, linkTitle } = attributes;

		const renderImages = () =>
			images.map((image, index) => {
				const imgElement = (
					<img
						src={image.url}
						alt={image.alt || ""}
						loading="lazy"
					/>
				);
				return (
					<div key={index} className="dbw-slider-item">
						{image.link ? (
							<a
								href={image.link}
								target={linkTarget || "_self"}
								rel={linkTarget === "_blank" ? `noopener noreferrer${linkRel ? ` ${linkRel}` : ""}` : linkRel || undefined}
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
				className={buildSliderClasses(overlayEnabled, blackLogos)}
				style={buildSliderStyle(attributes)}
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
	},
});
