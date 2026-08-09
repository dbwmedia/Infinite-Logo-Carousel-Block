#!/bin/bash

# WordPress.org Deployment Script für Infinite Logo Carousel Block
# Author: dbw media
# Usage: ./deploy.sh [VERSION]
#
# WICHTIG: Dieses Script verwendet IMMER das lokale SVN Repository im Projektordner!
# SVN Repository Pfad: ./infinite-logo-carousel-block/

set -e  # Exit bei Fehler

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Version Parameter prüfen
if [ -z "$1" ]; then
    error "Version parameter required! Usage: ./deploy.sh [VERSION]"
fi

VERSION="$1"
SVN_USERNAME="dbwmediadennis"
SVN_PATH="./infinite-logo-carousel-block"

info "Starting deployment for version $VERSION"

# 1. Prüfungen
info "Running pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "logo-slider-block.php" ]; then
    error "Not in the correct project directory! logo-slider-block.php not found."
fi

# Check if SVN directory exists
if [ ! -d "$SVN_PATH" ]; then
    error "SVN repository not found at $SVN_PATH"
fi

# Check if SVN directory is actually an SVN repo
if [ ! -d "$SVN_PATH/.svn" ]; then
    error "$SVN_PATH is not an SVN repository"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    error "package.json not found"
fi

success "Pre-deployment checks passed"

# 2. Build erstellen
info "Creating production build..."
npm run build || error "Build failed"
success "Production build created"

# 3. SVN Repository updaten
info "Updating SVN repository..."
cd "$SVN_PATH"
svn update || error "SVN update failed"
cd ..
success "SVN repository updated"

# 4. Dateien zu SVN trunk kopieren
info "Copying files to SVN trunk..."
rsync -av \
    --exclude='.git*' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='package-lock.json' \
    --exclude='.claude*' \
    --exclude='.dev' \
    --exclude='.wordpress-org' \
    --exclude='DEPLOY-*.md' \
    --exclude='PLUGIN-CHECK-*.md' \
    --exclude='readme.md' \
    --exclude='infinite-logo-carousel-block' \
    --exclude='deploy.sh' \
    ./ "$SVN_PATH/trunk/" || error "File copy failed"
success "Files copied to SVN trunk"

# 5. SVN Changes verarbeiten
info "Processing SVN changes..."
cd "$SVN_PATH"

# Add new files
svn add trunk --force 2>/dev/null || true

# Remove deleted files
svn status | grep '^!' | awk '{print $2}' | xargs -r svn delete 2>/dev/null || true

# Show status
info "SVN Status:"
svn status

# 6. User Confirmation vor Commit
echo ""
warning "About to commit to SVN trunk with version $VERSION"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Deployment aborted by user"
fi

# 7. SVN Trunk Commit
info "Committing to SVN trunk..."
svn commit -m "v$VERSION: WordPress.org release" --username "$SVN_USERNAME" || error "SVN trunk commit failed"
success "SVN trunk committed"

# 8. Tag erstellen
info "Creating SVN tag $VERSION..."
svn copy trunk "tags/$VERSION" || error "SVN tag creation failed"
success "SVN tag created"

# 9. Tag committen
info "Committing SVN tag..."
svn commit -m "Tag version $VERSION" --username "$SVN_USERNAME" || error "SVN tag commit failed"
success "SVN tag committed"

# 10. Verification (against the REMOTE repository — the local working copy
# listing produced false negatives right after the tag commit)
info "Verifying deployment..."
if svn list "https://plugins.svn.wordpress.org/infinite-logo-carousel-block/tags/" | grep -q "^$VERSION/$"; then
    success "Tag $VERSION successfully created"
else
    error "Tag verification failed"
fi

cd ..

# 11. Final Success Message
echo ""
success "🚀 DEPLOYMENT SUCCESSFUL!"
echo ""
info "Version $VERSION has been deployed to WordPress.org"
info "Check: https://wordpress.org/plugins/infinite-logo-carousel-block/"
info "Plugin will be available in ~15 minutes"
echo ""
warning "Don't forget to:"
echo "  - Create a Git tag: git tag v$VERSION && git push origin v$VERSION"
echo "  - Update any documentation"
echo "  - Test the plugin installation from WordPress.org"