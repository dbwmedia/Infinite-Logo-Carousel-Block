#!/bin/bash

# WordPress.org deployment for the Logo Slider plugin.
# Usage: ./deploy.sh VERSION
#
# Release order: bump the version everywhere, commit, tag vVERSION, push,
# then run this script. It refuses to deploy anything that is not exactly
# the tagged, clean, freshly built Git state.
#
# The SVN working copy lives in ./infinite-logo-carousel-block/.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error()   { echo -e "${RED}ERROR: $1${NC}" >&2; exit 1; }
info()    { echo -e "${BLUE}INFO: $1${NC}"; }
success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
warning() { echo -e "${YELLOW}WARNING: $1${NC}"; }

[ $# -eq 1 ] || error "Usage: ./deploy.sh VERSION"

VERSION="$1"
SVN_USERNAME="dbwmediadennis"
SVN_PATH="./infinite-logo-carousel-block"
SVN_URL="https://plugins.svn.wordpress.org/infinite-logo-carousel-block"

# Only these paths are shipped. Everything else (tests, docs, editor
# config, credentials) can never reach the public SVN by accident.
SHIP=(logo-slider-block.php block.json uninstall.php readme.txt package.json build src includes languages)

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || error "VERSION must look like 1.2.3"
[ -f logo-slider-block.php ] || error "Run this from the plugin directory"
[ -d "$SVN_PATH/.svn" ] || error "$SVN_PATH is not an SVN working copy"

# 1. Version consistency
bin/check-version.sh "$VERSION" || error "Version mismatch"

# 2. Git state: clean, and HEAD is the release tag
info "Checking Git state..."
[ -z "$(git status --porcelain)" ] || error "Working tree is not clean. Commit or stash first."
TAG_COMMIT="$(git rev-parse -q --verify "refs/tags/v$VERSION^{commit}" || true)"
[ -n "$TAG_COMMIT" ] || error "Git tag v$VERSION is missing. Create it: git tag v$VERSION && git push origin v$VERSION"
[ "$TAG_COMMIT" = "$(git rev-parse HEAD)" ] || error "HEAD is not at tag v$VERSION"
success "Git state is clean and tagged"

# 3. Fresh build must match the committed build
info "Building..."
npm run build
[ -z "$(git status --porcelain -- build)" ] || error "Fresh build differs from the committed build/. Commit the build first."
success "Build matches the tagged commit"

# 4. SVN: the tag must not exist yet
info "Checking SVN tag..."
if svn ls "$SVN_URL/tags/$VERSION" >/dev/null 2>&1; then
    error "SVN tag $VERSION already exists"
fi
svn update "$SVN_PATH"

# 5. Mirror the shipped paths into trunk (removals included)
info "Copying files to trunk..."
for path in "${SHIP[@]}"; do
    [ -e "$path" ] || error "Missing $path"
done
# Remove everything in trunk that is not on the ship list.
for existing in "$SVN_PATH/trunk/"* "$SVN_PATH/trunk/".[!.]*; do
    [ -e "$existing" ] || continue
    name="$(basename "$existing")"
    keep=0
    for path in "${SHIP[@]}"; do [ "$name" = "$path" ] && keep=1; done
    [ $keep -eq 1 ] || rm -rf "$existing"
done
for path in "${SHIP[@]}"; do
    if [ -d "$path" ]; then
        rsync -a --delete --exclude='.DS_Store' "$path/" "$SVN_PATH/trunk/$path/"
    else
        cp "$path" "$SVN_PATH/trunk/$path"
    fi
done

cd "$SVN_PATH"
svn add --force trunk --quiet
# Files that vanished locally are scheduled for deletion (paths with spaces safe).
svn status trunk | sed -n 's/^! *//p' | while IFS= read -r missing; do
    svn delete --quiet "$missing"
done

# Last line of defence against publishing secrets or junk.
if svn status trunk | grep -Ei '(\.env|\.zip|\.log|sftp\.json|\.vscode|\.idea)'; then
    error "Suspicious files staged in trunk, aborting"
fi

# Trunk and tag go out in ONE commit, so Stable tag never points to a
# tag that does not exist yet.
svn copy --quiet trunk "tags/$VERSION"

info "SVN status:"
svn status

echo ""
warning "About to commit trunk + tags/$VERSION to WordPress.org"
read -p "Continue? (y/N): " -n 1 -r
echo
[[ $REPLY =~ ^[Yy]$ ]] || error "Deployment aborted"

svn commit -m "Release $VERSION" --username "$SVN_USERNAME"
cd ..

# 6. Verify against the remote repository
info "Verifying..."
svn ls "$SVN_URL/tags/" | grep -qxF "$VERSION/" || error "Tag verification failed"

echo ""
success "Version $VERSION is live on WordPress.org (allow ~15 minutes)"
info "https://wordpress.org/plugins/infinite-logo-carousel-block/"
