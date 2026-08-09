# Project Development Guide

## Overview

WordPress Gutenberg Block Plugin für unendlich scrollende Logo-Karussels.

## Current Status

- **Version:** 1.3.0
- **WordPress.org Status:** Live
- **Repository:** https://plugins.svn.wordpress.org/infinite-logo-carousel-block

## File Structure

```
/
├── logo-slider-block.php          # Main plugin file
├── readme.txt                     # WordPress.org documentation
├── uninstall.php                  # Cleanup script
├── src/                           # Frontend assets
├── .wordpress-org/                # WordPress.org assets
└── .dev/                          # Development documentation (hidden)
```

## Key Features

- Infinite scrolling carousel
- Hover-pause functionality
- Customizable speed settings
- Flexible logo spacing
- Gutenberg native integration
- Responsive design

## Development Standards

- WordPress Coding Standards
- WordPress Plugin Guidelines
- Gutenberg Block API best practices
- Semantic versioning

## Done

- [x] Logo link functionality (v1.1.0)
- [x] Internationalization / German translations (v1.0.2)
- [x] Accessibility: alt text, touch support, prefers-reduced-motion (v1.2.0 / v1.3.0)
- [x] Multi-row layout with alternating direction + uniform/varied row speed (v1.3.0)
- [x] Lazy-load freeze bugfix + width/height attributes for CLS (v1.3.0)
- [x] Capsule / pill logo style with alternating checkerboard (v1.4.0)
- [x] Outline capsule style + optional glow; renamed to "Logo Slider" (v1.5.0)

## Roadmap

### Backlog / ideas

- [ ] Drag & drop reordering of logos in the editor
- [ ] Mobile touch-swipe support

## Next Steps

1. Test v1.5.0 on the sandbox (Plugin Check + outline style + glow)
2. Release v1.5.0 to WordPress.org
