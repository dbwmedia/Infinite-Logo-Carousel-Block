# Logo Slider – Infinite Carousel & Marquee Block

[![WordPress Plugin Version](https://img.shields.io/badge/version-2.3.0-blue)](https://wordpress.org/plugins/infinite-logo-carousel-block/)
[![License](https://img.shields.io/badge/license-GPL%20v2-green)](https://www.gnu.org/licenses/gpl-2.0.html)
[![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-blue)](https://wordpress.org/)
[![Tested up to](https://img.shields.io/badge/tested%20up%20to-7.0-blue)](https://wordpress.org/)
[![PHP](https://img.shields.io/badge/PHP-7.2%2B-purple)](https://php.net/)

A professional infinity logo carousel Gutenberg block with customizable speed, spacing and hover-pause. Perfect for showcasing client, partner or sponsor logos.

## Features

### Core Functionality

- **Infinite Scrolling** - Seamless, continuous loop without interruption
- **Multi-Row Layout** - Spread large logo sets across 2-4 rows with alternating scroll direction and optional varied speeds
- **Spotlight Mode** - One logo at a time in a single slot; the logos hand over on a timer with a fade, a slide or a hard cut, in fixed or random order
- **Alt Texts from the Media Library** - Missing alt texts are resolved from the attachment at render time, for existing content too
- **Screen Reader Friendly Loop** - Repeated logo sets are aria-hidden and out of the tab order, so each logo is announced once
- **Lazy Loading** - Logos load lazily; the animation is measured once the carousel comes into view
- **Spotlight Color Cycle** - One brand color for every spotlight logo, or a rotating set of colors (applied through a mask, so the color is exact)
- **Capsule Style** - Rounded containers behind logos: filled (uniform/alternating checkerboard) or outline, with an optional glow effect
- **Hover-Pause** - Animation automatically pauses on mouse hover
- **Touch Support** - Tap to pause/resume on mobile devices
- **Customizable Speed** - Slow (40s), medium (25s), or fast (15s) scrolling
- **Flexible Logo Spacing** - Small (20px), medium (40px), or large (60px) gaps
- **Adjustable Logo Height** - Custom height from 30px to 150px
- **Optional Logo Links** - Link each logo individually with configurable target and rel attributes
- **Alt Text Support** - Individual alt text per logo for accessibility and SEO

### Design Options

- **Edge Overlay Control** - Enable/disable gradient overlay
- **Custom Overlay Color** - Match your site's design
- **Black Logos Mode** - Convert all logos to black for uniform appearance
- **Margin Control** - Adjustable top/bottom spacing

### Link Settings

- **Link Target** - Open in same window or new window
- **Rel Attributes** - Add nofollow, sponsored, noopener etc.
- **Title Attribute** - Tooltip text for all logo links

### Technical Features

- **Gutenberg Native** - Built specifically for the block editor
- **No jQuery Required** - Pure JavaScript for better performance
- **Responsive Design** - Works on all devices
- **Lightweight** - Minimal impact on page load
- **Lazy Loading** - Images load on demand for better performance
- **URL Validation** - Visual feedback for invalid link URLs in the editor

## Installation

### From WordPress Admin

1. Navigate to **Plugins > Add New**
2. Search for "Infinite Logo Carousel Block"
3. Click **Install Now** and then **Activate**

### Manual Installation

1. Download the plugin ZIP file
2. Upload to `/wp-content/plugins/`
3. Activate through the WordPress admin

### For Developers

```bash
# Clone repository
git clone https://github.com/dbwmedia/Infinite-Logo-Carousel-Block.git

# Install dependencies
cd Infinite-Logo-Carousel-Block
npm install

# Development
npm run start

# Production build
npm run build
```

## Usage

1. Add new block in Gutenberg editor
2. Search for "Logo Slider"
3. Upload your logos
4. Pick a display mode: Single Row, Multiple Rows or Spotlight
5. Configure settings in the sidebar:
   - Layout (single row / multiple rows / spotlight)
   - Spotlight: time per logo, transition, order, alignment
   - Speed (slow/medium/fast/custom)
   - Logo spacing and logo height (desktop + optional mobile height)
   - Overlay settings
   - Logo color: original, black, white, grayscale, custom color, or a color cycle in spotlight mode
   - Capsule style
   - Link settings
   - Alt text per logo

## Block Settings

| Setting                | Options                                                              | Default    |
| ---------------------- | -------------------------------------------------------------------- | ---------- |
| Layout                 | Single Row / Multiple Rows (2-4 rows) / Spotlight                    | Single Row |
| Row Speed              | Uniform / Varied (multi-row only)                                     | Uniform    |
| Time per Logo          | 0.5s - 10s (spotlight only)                                           | 2s         |
| Transition             | Fade / Slide up / Hard cut (spotlight only)                           | Fade       |
| Order                  | As added / Random (spotlight only)                                    | As added   |
| Alignment              | Left / Center / Right (spotlight only)                                | Center     |
| Speed                  | Slow (40s), Medium (25s), Fast (15s), Custom (5-300s)                 | Medium     |
| Logo Spacing           | Small (20px), Medium (40px), Large (60px), XL (100px), Custom         | Medium     |
| Logo Height            | 30px - 150px, optional separate mobile height                         | 50px       |
| Balance Logo Sizes     | On/Off (area-based size equalization)                                 | Off        |
| Top/Bottom Margin      | Small (25px), Medium (50px), Large (75px)                             | Medium     |
| Overlay                | On/Off with color picker (not used in spotlight)                      | On (white) |
| Logo Color             | Original / Black / White / Grayscale / Custom Color / Color cycle*    | Original   |
| Original Colors on Hover | On/Off                                                              | Off        |
| Capsule Style          | Off / Uniform / Alternating / Outline, corner, padding, glow          | Off        |
| Pause Button           | On/Off (WCAG 2.2.2)                                                   | Off        |
| Load Images Immediately | On/Off (off = lazy loading)                                          | Off        |
| Screen Reader Label    | Free text, empty = no landmark                                        | Empty      |
| Link Target            | Same window / New window                                              | Same       |
| Rel Attributes         | Custom (nofollow, sponsored, etc.)                                    | None       |
| Title Attribute        | Custom tooltip text                                                   | None       |

\* Color cycle is available in spotlight mode. There the tint is applied through a mask, so the logos take the exact color; the other modes use a CSS filter.

## Compatibility

- WordPress 6.0 or higher (tested up to 7.0)
- PHP 7.2 or higher
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Gutenberg editor (required)

### Page Builder Compatibility

This is a Gutenberg block and works natively only in the block editor. For other page builders:

- **Elementor**: Use WordPress Block widget
- **Divi**: Use WordPress Block module
- **Classic Editor**: Not supported without Gutenberg

## Development

### File Structure

```
infinite-logo-carousel-block/
├── src/
│   ├── index.js         # Carousel block: registration, editor UI, save output
│   ├── marquee.js       # Text marquee block
│   ├── frontend.js      # Frontend engine: scroll animation, spotlight timer, pause
│   ├── editor.scss      # Editor styles
│   └── style.scss       # Frontend styles
├── build/               # Compiled files
├── languages/           # Translations (de_DE)
├── logo-slider-block.php # Main plugin file
├── uninstall.php        # Cleanup on uninstall
└── deploy.sh            # WordPress.org SVN deployment
```

### Build Commands

```bash
npm run start    # Development with hot reload
npm run build    # Production build
npm run lint:js  # Code linting
npm run format   # Code formatting
```

## Support

- **Documentation**: Check the [plugin page](https://wordpress.org/plugins/infinite-logo-carousel-block/)
- **Support Forum**: [WordPress.org Support](https://wordpress.org/support/plugin/infinite-logo-carousel-block/)
- **Plugin Website**: [dennisbuchwald.de/apps/logo-slider](https://www.dennisbuchwald.de/apps/logo-slider)

## Author

Developed by [Dennis Buchwald](https://www.dennisbuchwald.de) — WordPress development, Gutenberg blocks and performance optimization.

## Changelog

### 2.3.0

- FIXED: Alt texts maintained in the media library never reached the front end (static markup froze the empty alt at save time). A `render_block` filter now fills missing alt texts from `_wp_attachment_image_alt`, using the attachment IDs the block already stores. Author-entered alt texts are never overwritten
- FIXED: An image without any alt text is rendered without an `alt` attribute instead of `alt=""`, and reported once in the error log
- FIXED: The repeated logo sets are `aria-hidden` with their links out of the tab order, so screen readers announce each logo once instead of once per copy (existing content included, via the same filter)
- FIXED: Forced eager loading removed; images are lazy again. The frontend script initialises a carousel via IntersectionObserver and takes the images it measures out of lazy loading at that moment, so the old measuring bug cannot return
- NEW: "Load images immediately" option, and an optional screen reader label for the carousel
- IMPROVED: Reduced-motion users get a static grid of all logos instead of a stopped row; images carry `decoding="async"`
- Existing blocks are migrated through a deprecation entry — no invalid-content warnings

### 2.2.1

- IMPROVED: Spotlight settings moved into their own "Spotlight" panel
- IMPROVED: One logo color control again — the spotlight color modes joined the existing Logo Color selector under "Logo Display"
- IMPROVED: Carousel speed and overlay settings are hidden in spotlight mode, where they have no effect
- Saved content unchanged (editor-only release)

### 2.2.0

- NEW: Spotlight display mode — one logo at a time instead of a scrolling row, with adjustable hold time, fade/slide/hard-cut transitions, fixed or random order and left/center/right alignment
- NEW: Color cycle for the spotlight — one brand color or a rotating set, applied through a CSS mask for an exact match
- Accessibility: with reduced motion the spotlight lays out all logos side by side; pause button and hover-pause work in this mode too

### 2.1.0

- NEW: "Original colors on hover" as an independent toggle — works with every color mode (Black, White, Grayscale, Custom) and inside capsules
- CHANGED: Grayscale is now purely a color mode; enable the new toggle for the hover effect

### 2.0.0

- NEW: Text Marquee block — infinitely scrolling text ticker with separator, text size, colors, uppercase, direction and speed settings
- NEW: Optional pause/play button on both blocks (WCAG 2.2.2)
- NEW: Grayscale logo mode with color on hover
- NEW: Live animated preview in the editor
- NEW: Wide/full alignment support
- IMPROVED: block.json + block API v3 registration; requires WordPress 6.0+

### 1.8.0

- NEW: Balance Logo Sizes — optional area-based size equalization (wide logos slightly smaller, compact logos slightly larger, similar visual weight for all)
- NEW: "Extra Large" preset + custom pixel value for logo gap (up to 200 px) and row gap (up to 150 px)

### 1.7.0

- NEW: Mobile Logo Height — optionally set a fixed logo height for phones (below 600 px viewport) instead of the automatic fluid scaling; capsule padding follows the mobile height proportionally
- IMPROVED: The uniform mobile item width from 1.5.3 is now scoped to capsule mode — plain sliders keep natural gap-based spacing on phones
- IMPROVED: Complete German translation, including the plugin description on the Plugins screen; bundled translations are loaded reliably again
- CHANGED: Plugin website moved to dennisbuchwald.de/apps/logo-slider

### 1.6.1

- FIXED: Carousel flashing at wrong speed on initial page load (`loading="lazy"` delayed width measurement; images now load eagerly, existing posts patched automatically)

### 1.6.0

- NEW: Logo Color mode (Original / Black / White / Custom tint), Capsule Logo Color for all capsule styles, "Original Colors" option for filled capsules

### 1.5.3

- IMPROVED: Mobile carousel layout — below 600 px viewport each item is locked to `clamp(140px, 46vw, 220px)`, the capsule fills the item, and the image shrinks via `max-width: 100%` + `object-fit: contain`. Result: ~2 uniform capsules per row on phones, regardless of individual logo aspect ratios. Desktop layout is unchanged (capsules still shrink-fit to their logo's natural width).

### 1.5.2

- IMPROVED: Responsive logo height — the value chosen in the editor (30–150 px) is now the desktop ceiling; on smaller viewports the logo height (and capsule padding) shrink fluidly via `clamp(28px, 12vw, --logo-height)` and a `min()`-capped padding. Large logos no longer overflow phone screens. No save-format change.

### 1.5.1

- FIXED: Unwanted thin border around the slider container on some themes (theme/WP-core resets auto-applied `border-style: solid` because our `--capsule-border-width` inline custom property accidentally matched `[style*="border-width"]`)
- IMPROVED: Capsule glow now extends vertically beyond the slider edge instead of being cut off (`overflow: clip` + `overflow-clip-margin-block`)

### 1.5.0

- NEW: Outline capsule style - transparent capsules with a colored border instead of a filled background
- NEW: Optional glow effect for capsules with adjustable intensity (neon-style logo walls)
- NEW: Adjustable outline border width (Thin / Medium / Thick / Custom)
- NEW: Logo color control for the outline style (Original / White / Black)
- FIXED: Capsule logo contrast now works when capsule colors use theme palette variables
- CHANGED: Plugin renamed to "Logo Slider – Infinite Carousel & Marquee Block"

### 1.4.0

- NEW: Capsule style - place each logo inside a rounded background container
- NEW: Corner style with Square / Rounded / Pill presets plus a custom radius
- NEW: Uniform or alternating (checkerboard) capsule backgrounds with custom colors
- NEW: Capsule logos render monochrome and automatically contrast their background
- NEW: Adjustable capsule padding (Small / Medium / Large / Custom)
- NEW: Adjustable gap between rows in the multi-row layout
- NEW: Custom carousel speed - set your own scroll duration when the presets are too fast or slow
- IMPROVED: Scroll speed stays consistent regardless of the number of logos (large sets no longer scroll too fast)
- IMPROVED: Newly added logos use an appropriately sized image instead of the full-size original (lighter pages, faster loading)

### 1.3.0

- NEW: Multi-row layout - display logos across 2 to 4 rows, ideal for large logo collections
- NEW: Alternating scroll direction - adjacent rows scroll in opposite directions
- NEW: Row speed modes - uniform speed for all rows, or varied speed for a livelier look
- NEW: Respects the "prefers-reduced-motion" accessibility setting - carousel stays static for visitors who prefer reduced motion
- FIXED: Carousel could stay frozen when logo images were lazy-loaded (scroll width measured before images loaded)
- IMPROVED: Logo images now include width and height attributes - less layout shift (CLS), better Core Web Vitals
- IMPROVED: Frontend script re-measures automatically via ResizeObserver (self-healing animation)
- IMPROVED: Smoother initial load - the carousel fades in once fully ready instead of visibly building up
- IMPROVED: Corrected block category - block now appears under "Media" in the inserter
- Confirmed compatibility with WordPress 7.0

### 1.2.0

- NEW: Alt text field for each logo (accessibility & SEO)
- NEW: Touch support - tap to pause/resume on mobile devices
- NEW: URL validation indicator for logo links in editor
- FIXED: Overlay gradient now works correctly with custom colors
- FIXED: Layout overflow in nested containers (.dbw-slider-track)
- IMPROVED: Smarter logo duplication for reliable infinite scroll with 20+ logos
- IMPROVED: Per-slider style management (better performance)
- IMPROVED: Lazy loading on all logo images
- IMPROVED: English base strings with proper German translations (i18n best practice)
- IMPROVED: Backward compatibility via deprecated block save
- Confirmed compatibility with WordPress 6.9

### 1.1.1

- Confirmed compatibility with WordPress 6.9
- Documented layout overflow issue in logo slider (.dbw-slider-track)

### 1.1.0

- NEW: Centralized Link Settings panel
- NEW: Link Target option (same window / new window)
- NEW: Rel Attributes control (nofollow, sponsored, noopener)
- NEW: Title Attribute option for tooltip text
- IMPROVED: Smart rel attribute handling
- IMPROVED: German translations for all new link settings

### 1.0.2

- Complete German translation implementation
- WordPress Plugin Check compliance

### 1.0.1

- Added developer source files for JS and CSS to comply with WordPress.org guidelines
- Updated readme.txt with correct Contributors
- Documented build process and source code location

### 1.0.0 (2025)

- Initial release
- Infinite scrolling animation
- Customizable speed and spacing
- Hover-pause functionality
- Logo linking capability
- Overlay controls
- Black logos option
- Responsive design

## License

GPL v2 or later. See [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html) for details.

---

Developed by [Dennis Buchwald](https://www.dennisbuchwald.de) - Professional WordPress Development
