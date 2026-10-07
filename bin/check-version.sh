#!/bin/bash
# Fails unless every file declares the same version.
# Usage: bin/check-version.sh [VERSION]   (default: package.json)
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:-$(node -p "require('./package.json').version")}"
V="${VERSION//./\\.}"
fail=0
check() {
    if ! grep -qE "$2" "$1"; then
        echo "✗ $1 does not declare $VERSION ($2)" >&2
        fail=1
    fi
}
check logo-slider-block.php "^ \* Version: $V\$"
check logo-slider-block.php "'ILCB_VERSION', '$V'"
check readme.txt "^Stable tag: $V\$"
check readme.txt "^= $V =\$"
check package.json "\"version\": \"$V\""
check readme.md "version-$V-blue"
[ $fail -eq 0 ] && echo "✓ version $VERSION is consistent"
exit $fail
