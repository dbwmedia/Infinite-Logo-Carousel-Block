#!/bin/bash
# Downloads the WordPress HTML API classes the render filter needs, so the
# PHP tests run without a WordPress install.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)/.wp"
BASE="https://raw.githubusercontent.com/WordPress/WordPress/6.5/wp-includes/html-api"
mkdir -p "$DIR"
for f in class-wp-html-attribute-token class-wp-html-span class-wp-html-text-replacement class-wp-html-tag-processor; do
    [ -f "$DIR/$f.php" ] || curl -fsSL "$BASE/$f.php" -o "$DIR/$f.php"
done
