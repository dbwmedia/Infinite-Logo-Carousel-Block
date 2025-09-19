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

registerBlockType("infinite-logo-carousel-block/carousel", {
	title: __("Infinite Logo Carousel", "infinite-logo-carousel-block"),
	description: __(
		"Professional infinity logo carousel with customizable speed, spacing and hover-pause. Perfect for client, partner or sponsor logos.",
		"infinite-logo-carousel-block"
	),
	icon: "images-alt2",
	category: "common",
	attributes: {
		images: {
			type: "array",
			default: [],
		},
		speed: {
			type: "string",
			default: "medium",
		},
		gap: {
			type: "string",
			default: "medium",
		},
		marginSize: {
			type: "string",
			default: "medium",
		},
		logoHeight: {
			type: "string",
			default: "50",
		},
		overlayEnabled: {
			type: "boolean",
			default: true,
		},
		overlayColor: {
			type: "string",
			default: "#ffffff",
		},
		blackLogos: {
			type: "boolean",
			default: false,
		},
		linkTarget: {
			type: "string",
			default: "_self",
		},
		linkRel: {
			type: "string",
			default: "",
		},
		linkTitle: {
			type: "string",
			default: "",
		},
	},
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
				const imageUrl =
					img.url || img.sizes?.full?.url || img.source_url || "";
				return { id: img.id, url: imageUrl, link: "" };
			});
			setAttributes({ images: [...images, ...newImages] });
		};

		const removeImage = (index) => {
			const updated = images.filter((_, i) => i !== index);
			setAttributes({ images: updated });
		};

		const updateImageLink = (linkValue, index) => {
			const updated = [...images];
			updated[index].link = linkValue;
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
								{
									label: __("Slow", "infinite-logo-carousel-block"),
									value: "slow",
								},
								{
									label: __("Medium", "infinite-logo-carousel-block"),
									value: "medium",
								},
								{
									label: __("Fast", "infinite-logo-carousel-block"),
									value: "fast",
								},
							]}
							onChange={(newSpeed) => setAttributes({ speed: newSpeed })}
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
								{
									label: __("Small", "infinite-logo-carousel-block"),
									value: "small",
								},
								{
									label: __("Medium", "infinite-logo-carousel-block"),
									value: "medium",
								},
								{
									label: __("Large", "infinite-logo-carousel-block"),
									value: "large",
								},
							]}
							onChange={(newGap) => setAttributes({ gap: newGap })}
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
								{
									label: __("Small (25px)", "infinite-logo-carousel-block"),
									value: "small",
								},
								{
									label: __("Medium (50px)", "infinite-logo-carousel-block"),
									value: "medium",
								},
								{
									label: __("Large (75px)", "infinite-logo-carousel-block"),
									value: "large",
								},
							]}
							onChange={(newMargin) => setAttributes({ marginSize: newMargin })}
						/>
					</PanelBody>

					<PanelBody
						title={__("Logo Size", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<RangeControl
							label={__(
								"Maximum Logo Height (px)",
								"infinite-logo-carousel-block"
							)}
							help={__(
								"Sets the maximum height for logos. Width adjusts automatically.",
								"infinite-logo-carousel-block"
							)}
							value={parseInt(logoHeight)}
							onChange={(value) =>
								setAttributes({ logoHeight: value.toString() })
							}
							min={30}
							max={150}
							step={5}
						/>
						<SelectControl
							label={__("Quick Select", "infinite-logo-carousel-block")}
							value={logoHeight}
							options={[
								{
									label: __("Small (40px)", "infinite-logo-carousel-block"),
									value: "40",
								},
								{
									label: __("Medium (50px)", "infinite-logo-carousel-block"),
									value: "50",
								},
								{
									label: __("Large (70px)", "infinite-logo-carousel-block"),
									value: "70",
								},
								{
									label: __(
										"Extra Large (100px)",
										"infinite-logo-carousel-block"
									),
									value: "100",
								},
							]}
							onChange={(newHeight) => setAttributes({ logoHeight: newHeight })}
						/>
					</PanelBody>

					<PanelBody
						title={__("Overlay Settings", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<ToggleControl
							label={__("Show Overlay", "infinite-logo-carousel-block")}
							help={__(
								"Shows a gradient overlay at the edges of the carousel.",
								"infinite-logo-carousel-block"
							)}
							checked={overlayEnabled}
							onChange={(value) => setAttributes({ overlayEnabled: value })}
						/>
						{overlayEnabled && (
							<PanelColorSettings
								title={__("Overlay Color", "infinite-logo-carousel-block")}
								colorSettings={[
									{
										value: overlayColor,
										onChange: (color) =>
											setAttributes({ overlayColor: color || "#ffffff" }),
										label: __(
											"Background color for overlay",
											"infinite-logo-carousel-block"
										),
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
							help={__(
								"Converts all logos to black for a uniform appearance.",
								"infinite-logo-carousel-block"
							)}
							checked={blackLogos}
							onChange={(value) => setAttributes({ blackLogos: value })}
						/>
					</PanelBody>

					<PanelBody
						title={__("Link-Einstellungen", "infinite-logo-carousel-block")}
						initialOpen={false}
					>
						<SelectControl
							label={__("Link Target", "infinite-logo-carousel-block")}
							help={__("Bestimmt, wo Logo-Links geöffnet werden.", "infinite-logo-carousel-block")}
							value={linkTarget}
							options={[
								{
									label: __("Gleiches Fenster (_self)", "infinite-logo-carousel-block"),
									value: "_self",
								},
								{
									label: __("Neues Fenster (_blank)", "infinite-logo-carousel-block"),
									value: "_blank",
								},
							]}
							onChange={(newTarget) => setAttributes({ linkTarget: newTarget })}
						/>
						<TextControl
							label={__("Rel-Attribute", "infinite-logo-carousel-block")}
							help={__("Mehrere Werte mit Leerzeichen trennen (z.B. 'nofollow sponsored').", "infinite-logo-carousel-block")}
							value={linkRel}
							placeholder="nofollow noopener sponsored"
							onChange={(newRel) => setAttributes({ linkRel: newRel })}
						/>
						<TextControl
							label={__("Title-Attribut (optional)", "infinite-logo-carousel-block")}
							help={__("Tooltip-Text für alle Logo-Links.", "infinite-logo-carousel-block")}
							value={linkTitle}
							placeholder={__("Besuche unseren Partner", "infinite-logo-carousel-block")}
							onChange={(newTitle) => setAttributes({ linkTitle: newTitle })}
						/>
					</PanelBody>
				</InspectorControls>

				<div className="dbw-partner-slider-editor">
					<div className="dbw-partner-slider-images">
						{images.map((image, index) => (
							<div className="dbw-partner-slider-image" key={index}>
								{image.url && (
									<img
										src={image.url}
										alt={__("Logo", "infinite-logo-carousel-block")}
										style={{
											filter: blackLogos ? "brightness(0)" : "none",
											maxHeight: logoHeight + "px",
										}}
									/>
								)}
								<TextControl
									label={__(
										"Logo Link (optional)",
										"infinite-logo-carousel-block"
									)}
									value={image.link || ""}
									onChange={(val) => updateImageLink(val, index)}
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

		const speedMap = {
			slow: "40s",
			medium: "25s",
			fast: "15s",
		};
		const duration = speedMap[speed] || "25s";

		const gapMap = {
			small: "20px",
			medium: "40px",
			large: "60px",
		};
		const gapValue = gapMap[gap] || "40px";

		const marginMap = {
			small: "25px",
			medium: "50px",
			large: "75px",
		};
		const marginValue = marginMap[marginSize] || "50px";

		const sliderClasses = ["dbw-partner-slider"];
		if (!overlayEnabled) {
			sliderClasses.push("no-overlay");
		}
		if (blackLogos) {
			sliderClasses.push("black-logos");
		}

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
				className={sliderClasses.join(" ")}
				style={{
					"--scroll-duration": duration,
					"--slide-gap": gapValue,
					"--outer-margin": marginValue,
					"--overlay-color": overlayColor || "#ffffff",
					"--logo-count": images.length,
					"--logo-height": logoHeight + "px",
				}}
			>
				<div className="dbw-slider-wrapper">
					<div className="dbw-slider-track">
						{/* First set of logos */}
						{renderImages()}
						{/* Duplicate for seamless loop */}
						{renderImages()}
						{/* Extra duplicates for few logos */}
						{images.length < 8 && renderImages()}
						{images.length < 5 && renderImages()}
					</div>
				</div>
			</div>
		);
	},
});
