# Logo Slider – Infinite Carousel & Marquee Block

[![WordPress Plugin Version](https://img.shields.io/badge/version-1.7.0-blue)](https://wordpress.org/plugins/infinite-logo-carousel-block/)
[![License](https://img.shields.io/badge/license-GPL%20v2-green)](https://www.gnu.org/licenses/gpl-2.0.html)
[![WordPress](https://img.shields.io/badge/WordPress-5.8%2B-blue)](https://wordpress.org/)
[![Tested up to](https://img.shields.io/badge/tested%20up%20to-7.0-blue)](https://wordpress.org/)
[![PHP](https://img.shields.io/badge/PHP-7.2%2B-purple)](https://php.net/)

A professional infinity logo carousel Gutenberg block with customizable speed, spacing and hover-pause. Perfect for showcasing client, partner or sponsor logos.

## Features

### Core Functionality

- **Infinite Scrolling** - Seamless, continuous loop without interruption
- **Multi-Row Layout** - Spread large logo sets across 2-4 rows with alternating scroll direction and optional varied speeds
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
2. Search for "Infinite Logo Carousel"
3. Upload your logos
4. Configure settings in the sidebar:
   - Speed (slow/medium/fast)
   - Logo spacing
   - Logo height
   - Overlay settings
   - Black logos option
   - Link settings
   - Alt text per logo

## Block Settings

| Setting           | Options                                   | Default    |
| ----------------- | ----------------------------------------- | ---------- |
| Layout            | Single Row / Multiple Rows (2-4 rows)     | Single Row |
| Row Speed         | Uniform / Varied (multi-row only)         | Uniform    |
| Speed             | Slow (40s), Medium (25s), Fast (15s)      | Medium     |
| Logo Spacing      | Small (20px), Medium (40px), Large (60px) | Medium     |
| Logo Height       | 30px - 150px                              | 50px       |
| Top/Bottom Margin | Small (25px), Medium (50px), Large (75px) | Medium     |
| Overlay           | On/Off with color picker                  | On (white) |
| Black Logos       | On/Off                                    | Off        |
| Link Target       | Same window / New window                  | Same       |
| Rel Attributes    | Custom (nofollow, sponsored, etc.)        | None       |
| Title Attribute   | Custom tooltip text                       | None       |

## Compatibility

- WordPress 5.8 or higher (tested up to 7.0)
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
│   ├── index.js         # Block registration, editor UI, save output
│   ├── frontend.js      # Frontend animations & touch support
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
