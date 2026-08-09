# WordPress.org Deployment Workflows

## WICHTIG: SVN Repository Location
**SVN Repository Pfad**: `./infinite-logo-carousel-block/` (im Projektordner)
**NIEMALS Desktop oder andere Verzeichnisse verwenden!**

## Complete Release Process

### Automated Release Command

```
"Execute full release for version [X.X.X]: Analyze git commits, create changelog, update versions, generate SVN deployment commands, create git tags, provide copy-paste terminal commands using SVN username dbwmediadennis"
```

## Korrekte SVN Deployment Commands (Updated)

### Step 1: Version Updates

Files to modify:

- `logo-slider-block.php`: Plugin header version + ILCB_VERSION constant
- `readme.txt`: Stable tag + changelog section
- `package.json`: version field
- `languages/*.po`: Project-Id-Version

### Step 2: Build und SVN Deployment

```bash
# 1. Production Build erstellen
npm run build

# 2. SVN Repository updaten
cd ./infinite-logo-carousel-block
svn update

# 3. Dateien zu SVN trunk kopieren (AUTOMATED - excludes richtig konfiguriert)
cd ..
rsync -av --exclude='.git*' --exclude='node_modules' --exclude='*.log' --exclude='.DS_Store' --exclude='package-lock.json' --exclude='.claude*' --exclude='.dev' --exclude='.wordpress-org' --exclude='DEPLOY-*.md' --exclude='PLUGIN-CHECK-*.md' --exclude='readme.md' --exclude='infinite-logo-carousel-block' ./ ./infinite-logo-carousel-block/trunk/

# 4. SVN Changes committen
cd ./infinite-logo-carousel-block
svn add trunk --force
svn status | grep '^!' | awk '{print $2}' | xargs -r svn delete
svn commit -m "vX.X.X: RELEASE MESSAGE" --username dbwmediadennis

# 5. Tag erstellen und committen
svn copy trunk tags/X.X.X
svn commit -m "Tag version X.X.X" --username dbwmediadennis

# 6. Verification
svn list tags/ | grep X.X.X
```

### Step 3: Git Operations

```bash
git add .
git commit -m "Release version X.X.X"
git tag -a vX.X.X -m "Version X.X.X"
git push origin main --tags
```

## File Sync Rules

### Include in SVN

- `logo-slider-block.php`
- `readme.txt`
- `uninstall.php`
- `src/` directory and contents

### Exclude from SVN

- `node_modules/`
- `package.json`, `package-lock.json`
- `.git/`, `.gitignore`
- `.dev/` directory
- Build tools and config files

## Changelog Format

```
= X.X.X =
* Added: New features
* Changed: Modified existing features
* Fixed: Bug fixes and corrections
* Removed: Deprecated or removed features
```

## Release Checklist

- [ ] All code follows WordPress standards
- [ ] Version numbers updated in all files
- [ ] Changelog created and formatted
- [ ] Files copied to SVN trunk
- [ ] SVN committed successfully
- [ ] Tag created in SVN
- [ ] Git repository tagged
- [ ] WordPress.org plugin page verified
- [ ] Test installation from WordPress.org

## Troubleshooting

### Common SVN Issues

- Authentication: Use `dbwmediadennis` username
- File conflicts: Use `svn update` before commit
- Missing files: Use `svn add --force` for new files

### Version Sync Problems

Ensure version consistency across:

- PHP plugin header
- readme.txt stable tag
- package.json version field

### Post-Release Verification

1. Check WordPress.org plugin page loads correctly
2. Test download and installation
3. Verify version numbers display correctly
4. Monitor for any error reports
