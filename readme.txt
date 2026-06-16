=== Logo Slider – Infinite Carousel & Marquee Block ===
Contributors: dbwmediadennis
Tags: logo carousel, logo slider, logo showcase, logo marquee, client logos
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.2
Stable tag: 1.6.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Infinity logo carousel for client, partner or sponsor logos with custom speed.

== Description ==

**Logo Slider** is a powerful and user-friendly Gutenberg block that displays your logos in an elegant, infinitely scrolling carousel. Perfect for showcasing client logos, partner brands, sponsors, or any collection of logos on your WordPress website.

= Key Features =

* **Infinite Scrolling** - Seamless, continuous loop without interruption
* **Multi-Row Layout** - Spread large logo sets across 2-4 rows with alternating scroll direction
* **Capsule Style** - Rounded containers behind logos: filled (uniform or alternating checkerboard) or outline, with an optional glow effect
* **Hover-Pause** - Animation automatically pauses on mouse hover
* **Customizable Speed** - Choose between slow, medium, and fast scrolling
* **Flexible Logo Spacing** - Small, medium, or large gaps between logos
* **Optional Logo Links** - Link each logo individually to external websites
* **Overlay Control** - Enable/disable edge overlay with custom colors
* **Color Customization** - Adjust overlay color to match your design
* **Logo Color Mode** - Convert all logos to black, white or a custom tint color
* **Adjustable Logo Height** - Set custom height from 30px to 150px
* **Responsive Design** - Perfect display on all devices and screen sizes
* **SEO-Friendly** - Clean, semantic HTML markup
* **Lightweight** - Optimized for performance with minimal impact
* **No jQuery Required** - Pure JavaScript for better performance

= Perfect For =

* Corporate websites showcasing clients or partners
* Portfolio sites displaying brand collaborations
* Event websites showing sponsors
* E-commerce stores featuring brand partnerships
* Non-profit organizations displaying supporters
* Agency websites showcasing client logos
* News/Media sites showing affiliations
* Any website needing a professional logo showcase

= How It Works =

1. Add the Infinite Logo Carousel block to any page or post
2. Upload your logos (supports JPG, PNG, SVG, WebP)
3. Customize speed, spacing, and appearance
4. Optionally add links to each logo
5. Publish and enjoy your professional logo carousel

= Customization Options =

**Speed Settings:**
- Slow (40 seconds per loop)
- Medium (25 seconds per loop)
- Fast (15 seconds per loop)

**Spacing Options:**
- Small (20px between logos)
- Medium (40px between logos)
- Large (60px between logos)

**Visual Options:**
- Enable/disable edge overlay
- Custom overlay color picker
- Logo color mode: Original, Black, White or Custom Color
- Custom top/bottom margins
- Adjustable logo height (30px to 150px)

= Developer Friendly =

Built with modern development practices:
- Uses WordPress Gutenberg best practices
- Clean, well-documented code
- Translation ready
- Follows WordPress coding standards
- Compatible with WordPress 5.8+

== Installation ==

= Automatic Installation =

1. Go to your WordPress Dashboard
2. Click on "Plugins" > "Add New"
3. Search for "Infinite Logo Carousel Block"
4. Click "Install Now" and then "Activate"
5. The block is now ready to use in the Gutenberg editor

= Manual Installation =

1. Download the plugin ZIP file
2. Go to WordPress Dashboard > Plugins > Add New
3. Click "Upload Plugin" and choose the downloaded ZIP file
4. Click "Install Now" and then "Activate"
5. Start using the Infinite Logo Carousel block in your pages or posts

= After Activation =

1. Create or edit a page/post
2. Click the "+" button to add a new block
3. Search for "Infinite Logo Carousel"
4. Add the block and start uploading logos
5. Customize settings in the block sidebar

== Frequently Asked Questions ==

= How many logos can I add? =

There's no hard limit. We recommend 5-20 logos for optimal performance and user experience. The carousel automatically adjusts for smooth infinite scrolling regardless of the number.

= Can I change the animation speed? =

Yes! You can choose between three predefined speeds: Slow (40s), Medium (25s), or Fast (15s) for a complete loop.

= Does it work on mobile devices? =

Absolutely! The carousel is fully responsive and works perfectly on all devices and screen sizes.

= Can I link the logos to websites? =

Yes, each logo can be individually linked to any URL. Links open in a new tab by default for better user experience.

= How do I customize the overlay color? =

In the block settings sidebar, you'll find a color picker under "Overlay Settings" where you can choose any color to match your design.

= What does the "Logo Color" option do? =

This setting lets you convert all logos to a uniform color — Black, White, or a Custom Color of your choice. It's particularly useful when you have colorful logos but want a consistent, monochrome appearance.

= Can I use SVG logos? =

Yes! The carousel supports all common image formats including SVG, PNG, JPG, and WebP.

= Does it slow down my website? =

No, the carousel is optimized for performance. It uses pure CSS animations and vanilla JavaScript, making it very lightweight.

= Is it compatible with page builders? =

The block is designed for the Gutenberg editor. For other page builders like Elementor or Divi, you can use it within a WordPress block widget or shortcode block.

= Can I have multiple carousels on one page? =

Yes, you can add as many Infinite Logo Carousel blocks as you need on a single page, each with different settings and logos.

= How do I make all logos the same height? =

Use the "Logo Size" setting in the block sidebar. You can set a maximum height from 30px to 150px, and all logos will scale proportionally.

= My logos look too small on mobile. How can I fix that? =

The logo height you set in the editor is treated as the desktop maximum. On smaller screens the logos scale down automatically to prevent overflow. If they appear too small on phones, simply increase the "Logo Size" value in the block sidebar (e.g. from 50 px to 80-100 px). The desktop ceiling rises, which also raises the mobile size proportionally.

= Is it GDPR compliant? =

Yes, the plugin doesn't collect, store, or transmit any personal data. It's completely GDPR compliant.

== Screenshots ==

1. Logo carousel in action on the frontend - showing smooth infinite scroll
2. Block editor interface - easy logo upload and management
3. Speed and spacing settings in the sidebar
4. Overlay color customization options
5. Black logos mode for uniform appearance
6. Responsive display on mobile devices
7. Multiple logos with individual link settings
8. Logo size adjustment controls

== Changelog ==

= 1.6.1 =
* FIXED: Carousel flashing at wrong speed on initial page load. Caused by `loading="lazy"` on images delaying width measurement. Images now use `loading="eager"` so the animation starts at the correct speed immediately. Existing posts are automatically fixed without re-saving. Props to Bernd for reporting!

= 1.6.0 =
* NEW: Logo Color mode — choose Original, Black, White or a Custom Color to tint all logos uniformly
* NEW: Custom Color picker for logo tinting (CSS filter approximation — works with any image format)
* NEW: Capsule Logo Color control now available for ALL capsule styles (uniform, alternating, outline)
* NEW: "Original Colors" option for filled capsules — keep your logos unchanged inside capsules instead of the automatic black/white contrast
* IMPROVED: "Logo Display" panel now uses a dropdown instead of a single toggle, replacing the old "Convert to Black" option
* Fully backward-compatible — existing blocks produce identical output without re-saving

= 1.5.3 =
* IMPROVED: Mobile carousel now shows ~2 uniform capsules per row instead of one oversized capsule. Below 600 px viewport the slider locks each item to a fluid width (`clamp(140px, 46vw, 220px)`) and lets the logo image shrink with `object-fit: contain`, so very wide logos (5:1+) no longer fill an entire phone row. Desktop behaviour is unchanged.

= 1.5.2 =
* IMPROVED: Logo size now scales down automatically on small viewports. The height you pick in the editor (30–150 px) is treated as the desktop ceiling — on phones and tablets the rendered logo (and its capsule padding) shrink with the viewport via a single `clamp(28px, 12vw, your-height)` formula, so capsules no longer overflow a phone screen with large logo heights.
* No save-format change — existing logo blocks render with the new responsive behaviour without any update on your part.

= 1.5.1 =
* FIXED: Unwanted thin border around the slider container on some themes (caused by theme/WP-core resets that auto-apply `border-style: solid` whenever the inline style contains the substring "border-width" — our `--capsule-border-width` custom property accidentally matched)
* IMPROVED: Capsule glow now extends vertically beyond the slider edge instead of being cut off (uses `overflow: clip` + `overflow-clip-margin-block` to keep horizontal logo clipping strict while allowing the glow to bleed out top and bottom)

= 1.5.0 =
* NEW: Outline capsule style - transparent capsules with a colored border instead of a filled background
* NEW: Optional glow effect for capsules with adjustable intensity - ideal for neon-style logo walls
* NEW: Adjustable outline border width (Thin / Medium / Thick / Custom)
* NEW: Logo color control for the outline style (Original / White / Black)
* FIXED: Capsule logo contrast now works correctly when capsule colors use theme palette variables
* CHANGED: Plugin renamed to "Logo Slider – Infinite Carousel & Marquee Block" for clarity and discoverability

= 1.4.0 =
* NEW: Capsule style - place each logo inside a rounded background container
* NEW: Corner style with Square / Rounded / Pill presets plus a custom radius
* NEW: Uniform or alternating (checkerboard) capsule backgrounds with custom colors
* NEW: Capsule logos render monochrome and automatically contrast their background
* NEW: Adjustable capsule padding (Small / Medium / Large / Custom)
* NEW: Adjustable gap between rows in the multi-row layout
* NEW: Custom carousel speed - set your own scroll duration when the presets are too fast or slow
* IMPROVED: Scroll speed now stays consistent regardless of the number of logos - large sets (20+) no longer scroll too fast
* IMPROVED: Newly added logos use an appropriately sized image instead of the full-size original - lighter pages and faster loading

= 1.3.0 =
* NEW: Multi-row layout - display logos across 2 to 4 rows, ideal for large logo collections
* NEW: Alternating scroll direction - in multi-row layout, adjacent rows scroll in opposite directions
* NEW: Row speed modes - choose uniform speed for all rows or varied speed for a livelier, more dynamic look
* NEW: Respects the "prefers-reduced-motion" accessibility setting - the carousel stays static for visitors who prefer reduced motion
* FIXED: Carousel could stay frozen when logo images were lazy-loaded (scroll width was measured before the images had loaded)
* IMPROVED: Logo images now include width and height attributes - less layout shift (CLS) and better Core Web Vitals
* IMPROVED: Frontend script re-measures automatically via ResizeObserver - self-healing animation on responsive changes and late-loading images
* IMPROVED: Smoother initial load - the carousel now fades in once it is fully ready instead of visibly building up / shifting
* IMPROVED: Corrected block category - the block now appears under "Media" in the block inserter
* Confirmed compatibility with WordPress 7.0

= 1.2.0 =
* NEW: Alt text field for each logo (accessibility & SEO)
* NEW: Touch support - tap to pause/resume on mobile devices
* NEW: URL validation indicator for logo links in editor
* FIXED: Overlay gradient now works correctly with custom colors (no more white fallback)
* FIXED: Layout overflow in nested containers (.dbw-slider-track) with max-width containment
* FIXED: Removed non-functional CSS aspect-ratio: attr() declaration
* IMPROVED: Smarter logo duplication for reliable infinite scroll with 20+ logos
* IMPROVED: Per-slider style management instead of shared innerHTML (better performance)
* IMPROVED: Lazy loading on all logo images (loading="lazy")
* IMPROVED: Stable React keys using image IDs
* IMPROVED: English base strings with proper German translations (i18n best practice)
* IMPROVED: Backward compatibility via deprecated block save for existing installations
* Confirmed compatibility with WordPress 6.9 and 6.9.x

= 1.1.1 =
* Confirmed compatibility with WordPress 6.9 and 6.9.x.
* Documented layout overflow issue in logo slider (.dbw-slider-track).

= 1.1.0 =
* NEW: Centralized Link Settings panel - Configure all logo links from one location
* NEW: Link Target option - Choose between same window (_self) or new window (_blank) for all logos
* NEW: Rel Attributes control - Add custom rel attributes (nofollow, sponsored, noopener) to all logo links
* NEW: Title Attribute option - Set tooltip text for all logo links
* IMPROVED: Smart rel attribute handling - Automatically includes noopener noreferrer for _blank targets
* IMPROVED: Enhanced German translations for all new link settings
* IMPROVED: Better accessibility with configurable aria-labels for logo links
* ENHANCED: Individual logo links now use centralized settings while maintaining backward compatibility

= 1.0.2 =
* Complete German translation implementation with Plugin Check compliance
* Full German translation support (43 translated strings)
* Created German .po/.mo files for backend/PHP strings
* Added JavaScript translation .json file for Gutenberg editor interface
* Professional German WordPress terminology used throughout
* FIXED: Plugin Check compliance - Removed load_plugin_textdomain() as discouraged by WordPress.org
* WordPress.org automatic translation loading via Text Domain and Domain Path headers
* Maintains JavaScript translation support via wp_set_script_translations()
* Added 'Tested up to: 6.8' for latest WordPress compatibility
* All interface strings available in German with zero functionality changes

= 1.0.1 =
* Added developer source files for JS and CSS to comply with WordPress.org guidelines
* Updated readme.txt with correct "Contributors" including WordPress.org username
* Documented build process and source code location in readme

= 1.0.0 =
* Initial release
* Infinite scrolling for logos
* Customizable speed and spacing
* Hover-pause functionality
* Optional links for each logo
* Overlay controls with color picker
* Black logos option
* Adjustable logo height (30-150px)
* Fully responsive design
* WordPress 6.8 compatibility

== Upgrade Notice ==

= 1.6.1 =
Fixes the carousel briefly scrolling too fast on page load. No action needed — existing posts are patched automatically.

= 1.6.0 =
Logo Color mode with Black, White and Custom Color options. Capsule Logo Color now available for all capsule styles including a new "Original Colors" option.

= 1.5.3 =
Mobile layout now shows ~2 uniform capsules per row instead of one oversized capsule. Desktop is unchanged.

= 1.5.2 =
Logo height now scales down automatically on phones and tablets — the height you pick in the editor stays the desktop ceiling, smaller viewports shrink it via a single fluid formula. No action required.

= 1.5.1 =
Bugfix release: removes an unwanted thin border that some themes drew around the slider in v1.5.0, and lets the capsule glow extend vertically instead of being cropped at the slider edge.

= 1.5.0 =
New outline capsule style with an optional glow effect. The plugin has also been renamed to "Logo Slider – Infinite Carousel & Marquee Block".

= 1.4.0 =
New capsule style: display your logos inside rounded containers, with a uniform or alternating checkerboard look.

= 1.3.0 =
New multi-row layout for large logo collections, plus a fix for carousels that could freeze with lazy-loaded images.

= 1.0.0 =
Initial release of Infinite Logo Carousel Block. Start showcasing your client, partner, or sponsor logos professionally!

== Source Code ==

The source code for this plugin is available at:
https://github.com/dbw-media/Infinite-Logo-Carousel-Block

Build instructions:
1. Clone the repository
2. Run npm install
3. Run npm run build

== Privacy Policy ==

This plugin does not collect, store, or transmit any personal data. It does not set any cookies and does not connect to any external services. All logos and settings are stored locally in your WordPress database.

== License ==

This plugin is licensed under the GPL v2 or later.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.