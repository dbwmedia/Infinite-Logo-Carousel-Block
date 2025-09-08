# Infinite Logo Carousel Block

[![WordPress Plugin Version](https://img.shields.io/badge/version-1.0.0-blue)](https://wordpress.org/plugins/infinite-logo-carousel-block/)
[![License](https://img.shields.io/badge/license-GPL%20v2-green)](https://www.gnu.org/licenses/gpl-2.0.html)
[![WordPress](https://img.shields.io/badge/WordPress-5.8%2B-blue)](https://wordpress.org/)
[![PHP](https://img.shields.io/badge/PHP-7.2%2B-purple)](https://php.net/)

A professional infinity logo carousel Gutenberg block with customizable speed, spacing and hover-pause. Perfect for showcasing client, partner or sponsor logos.

## Features

### Core Functionality

- **Infinite Scrolling** - Seamless, continuous loop without interruption
- **Hover-Pause** - Animation automatically pauses on mouse hover
- **Customizable Speed** - Slow (40s), medium (25s), or fast (15s) scrolling
- **Flexible Logo Spacing** - Small (20px), medium (40px), or large (60px) gaps
- **Adjustable Logo Height** - Custom height from 30px to 150px
- **Optional Logo Links** - Link each logo individually with target="\_blank"

### Design Options

- **Edge Overlay Control** - Enable/disable gradient overlay
- **Custom Overlay Color** - Match your site's design
- **Black Logos Mode** - Convert all logos to black for uniform appearance
- **Margin Control** - Adjustable top/bottom spacing

### Technical Features

- **Gutenberg Native** - Built specifically for the block editor
- **No jQuery Required** - Pure JavaScript for better performance
- **Responsive Design** - Works on all devices
- **Lightweight** - Minimal impact on page load

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
git clone https://github.com/dbw-media/infinite-logo-carousel-block.git

# Install dependencies
cd infinite-logo-carousel-block
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

## Block Settings

| Setting           | Options                                   | Default    |
| ----------------- | ----------------------------------------- | ---------- |
| Speed             | Slow (40s), Medium (25s), Fast (15s)      | Medium     |
| Logo Spacing      | Small (20px), Medium (40px), Large (60px) | Medium     |
| Logo Height       | 30px - 150px                              | 50px       |
| Top/Bottom Margin | Small (25px), Medium (50px), Large (75px) | Medium     |
| Overlay           | On/Off with color picker                  | On (white) |
| Black Logos       | On/Off                                    | Off        |

## Compatibility

- WordPress 5.8 or higher
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
│   ├── index.js         # Block registration
│   ├── frontend.js      # Frontend animations
│   ├── editor.scss      # Editor styles
│   └── style.scss       # Frontend styles
├── build/               # Compiled files
├── languages/           # Translations
└── infinite-logo-carousel-block.php
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
- **Professional Support**: [dbw media](https://dbw-media.de/kontakt)

## About dbw media

[dbw media](https://dbw-media.de) is a WordPress agency specializing in custom development, Gutenberg blocks, and performance optimization.

## Changelog

### 1.0.0 (2024)

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

Developed by [dbw media](https://dbw-media.de) - Professional WordPress Development
