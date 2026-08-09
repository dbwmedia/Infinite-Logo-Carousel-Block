# Development Task Templates

## Standard Development Tasks

### Feature Development

```
"Add [feature description] to the plugin. Consider WordPress coding standards and test compatibility."
```

### Bug Fixes

```
"Fix the issue where [describe problem]. Analyze the code and provide a solution that follows WordPress best practices."
```

### Code Review

```
"Review the current codebase for potential improvements, security issues, and WordPress standards compliance."
```

### Version Preparation

```
"Prepare version [X.X.X] - update version numbers and create changelog based on recent changes."
```

## COMPLETE RELEASE WORKFLOW

### Full Release Process

```
"Execute complete release workflow for version [X.X.X]:

STEP 1 - PREPARATION:
- Analyze git commits since last version
- Generate changelog for readme.txt (Added/Changed/Fixed/Removed)
- Update version numbers in all files
- Verify WordPress standards compliance

STEP 2 - WORDPRESS.ORG DEPLOYMENT:
- Create SVN commands for file copying to trunk/
- Generate svn add and commit commands
- Create tag creation commands
- Provide exact terminal command sequence

STEP 3 - GIT MANAGEMENT:
- Create git tag commands
- Provide complete copy-paste command list

Use SVN username: dbwmediadennis"
```

### Changelog Only

```
"Create changelog from git commits since version [X.X.X]. Categorize as Added/Changed/Fixed/Removed and format for readme.txt."
```

### Version Number Update

```
"Update version to [X.X.X] in logo-slider-block.php, readme.txt, and package.json. Show exact changes needed."
```

### Deployment Preparation

```
"Prepare WordPress.org SVN deployment commands:
1. List files to copy from git to SVN trunk/
2. List files to exclude
3. Provide exact terminal commands with username dbwmediadennis"
```

## Quality Assurance

### Pre-Release Check

```
"Perform pre-release quality check: WordPress coding standards, translation readiness, readme.txt validation, plugin headers verification."
```

### Security Review

```
"Review code for potential security vulnerabilities including XSS, SQL injection, and data sanitization issues."
```

### Performance Analysis

```
"Analyze code performance, especially CSS/JS loading and efficiency with multiple logos."
```

## Specialized Tasks

### Accessibility Improvements

```
"Add accessibility features including ARIA labels, keyboard navigation, and screen reader support."
```

### Internationalization

```
"Prepare plugin for translations by adding __() and _e() functions for all user-facing strings."
```

### Documentation Update

```
"Update readme.txt for WordPress.org based on current features and recent changes."
```
