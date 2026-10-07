import { registerBlockType } from "@wordpress/blocks";
import { __ } from "@wordpress/i18n";
import metadata from "../../block.json";
import Edit from "./edit";
import save from "./save";
import deprecated from "./deprecated";

registerBlockType(metadata.name, {
	...metadata,
	// Translated in the editor; block.json strings are translated server-side.
	title: __("Logo Slider", "infinite-logo-carousel-block"),
	description: __(
		"Professional infinity logo carousel with customizable speed, spacing and hover-pause. Perfect for client, partner or sponsor logos.",
		"infinite-logo-carousel-block"
	),
	edit: Edit,
	save,
	deprecated,
});
