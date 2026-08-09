# WordPress Plugin Development - Complete Workflow Guide

## Setup (Einmalig)

### 1. Basis-Setup

```bash
# Plugin-Ordner erstellen
mkdir mein-plugin
cd mein-plugin

# Git initialisieren
git init
git add .
git commit -m "Initial commit"

# Node.js Setup (falls nötig)
npm init -y
npm install @wordpress/scripts --save-dev
```

### 2. WordPress.org Vorbereitung

- Plugin bei WordPress.org einreichen
- Genehmigung abwarten (kann Tage dauern)
- SVN-Passwort generieren: https://profiles.wordpress.org/me/profile/edit/group/3/

### 3. SVN Repository auschecken

```bash
svn checkout https://plugins.svn.wordpress.org/dein-plugin-name
```

## Täglich Entwicklung

### Neues Feature entwickeln

```bash
# 1. Development
# Arbeite an deinem Code in Git-Repository

# 2. Testen
# Plugin lokal in WordPress testen

# 3. Git commit
git add .
git commit -m "Add new feature: beschreibung"

# 4. Claude Code für größere Features
claude_code "Add [feature beschreibung] following WordPress coding standards"
```

### Bug fixes

```bash
# 1. Problem identifizieren und fixen
# Code ändern

# 2. Git commit
git add .
git commit -m "Fix: beschreibung des problems"

# 3. Mit AI-Hilfe
claude_code "Fix the issue where [problem beschreibung]"
```

## Release Prozess (Neue Version)

### Option A: Vollautomatisch mit Claude Code

```bash
claude_code "Execute full release for version 1.1.0: Analyze git commits, create changelog, update versions, generate SVN deployment commands, create git tags, provide copy-paste terminal commands using SVN username DEIN_USERNAME"
```

### Option B: Schritt-für-Schritt (Manuell)

#### Schritt 1: Versionsnummern updaten

In folgenden Dateien Version von 1.0.1 auf 1.1.0 ändern:

- `mein-plugin.php`: Plugin Header "Version: 1.1.0"
- `readme.txt`: "Stable tag: 1.1.0"
- `package.json`: "version": "1.1.0"

#### Schritt 2: Changelog erstellen

In `readme.txt` neuen Changelog-Eintrag hinzufügen:

```
= 1.1.0 =
* Added: Neue Feature-Beschreibung
* Changed: Was wurde geändert
* Fixed: Welche Bugs wurden behoben
```

#### Schritt 3: Dateien zu SVN kopieren

```bash
# Wichtige Dateien kopieren (NICHT node_modules!)
cp mein-plugin.php ../mein-plugin-svn/trunk/
cp readme.txt ../mein-plugin-svn/trunk/
cp uninstall.php ../mein-plugin-svn/trunk/
cp -r src ../mein-plugin-svn/trunk/

# Assets aktualisieren (falls geändert)
cp .wordpress-org/*.png ../mein-plugin-svn/assets/
```

#### Schritt 4: SVN commit

```bash
cd ../mein-plugin-svn
svn add trunk/* assets/* --force
svn commit -m "Version 1.1.0" --username DEIN_USERNAME
```

#### Schritt 5: Tag erstellen

```bash
svn copy trunk tags/1.1.0
svn commit -m "Tag version 1.1.0" --username DEIN_USERNAME
```

#### Schritt 6: Git-Repository taggen

```bash
cd ../mein-plugin
git add .
git commit -m "Release version 1.1.0"
git tag -a v1.1.0 -m "Version 1.1.0"
git push origin main --tags
```

## Häufig verwendete Befehle

### Claude Code Commands

```bash
# Changelog erstellen
claude_code "Create changelog from git commits since version 1.0.1"

# Version vorbereiten
claude_code "Update version to 1.1.0 in all files and show changes"

# Code review
claude_code "Review code for WordPress standards and security issues"

# Deployment vorbereiten
claude_code "Generate SVN deployment commands for WordPress.org using username DEIN_USERNAME"
```

### Git Commands

```bash
git status                    # Was wurde geändert
git add .                     # Alle Änderungen hinzufügen
git commit -m "beschreibung"   # Änderungen committen
git log --oneline             # Commit-Historie anzeigen
git tag                       # Alle Tags anzeigen
```

### SVN Commands

```bash
svn status                    # SVN-Status prüfen
svn add datei.php             # Datei hinzufügen
svn commit -m "nachricht"     # Änderungen hochladen
svn info                      # Repository-Infos
```

## Troubleshooting

### SVN Authentication Fehler

```bash
# Neues SVN-Passwort generieren
# Gehe zu: https://profiles.wordpress.org/me/profile/edit/group/3/
# Verwende IMMER das SVN-Passwort, nicht WordPress-Login-Passwort
```

### Plugin erscheint nicht auf WordPress.org

- Überprüfe ob Tag erstellt wurde: `svn list https://plugins.svn.wordpress.org/dein-plugin/tags/`
- Warte 1-2 Stunden - kann dauern
- Prüfe readme.txt Syntax

### Lokales Plugin vs WordPress.org Version

- Klicke "Aktualisieren" in WordPress Admin
- WordPress lädt automatisch neueste Version von WordPress.org

## Dateien die NICHT zu SVN gehören

- `node_modules/`
- `package.json`, `package-lock.json`
- `.git/`, `.gitignore`
- `.dev/` (Development-Dokumentation)
- Build-Tools und Config-Dateien

## Wichtige URLs

- Plugin-Seite: `https://wordpress.org/plugins/dein-plugin-name/`
- SVN-Repository: `https://plugins.svn.wordpress.org/dein-plugin-name`
- SVN-Passwort: `https://profiles.wordpress.org/me/profile/edit/group/3/`
- Support-Forum: `https://wordpress.org/support/plugin/dein-plugin-name/`

## Workflow-Zusammenfassung

1. **Entwickeln** - Code ändern, lokal testen
2. **Committen** - `git add . && git commit -m "beschreibung"`
3. **Release vorbereiten** - Versionsnummern + Changelog
4. **SVN deployment** - Dateien kopieren, SVN commit, Tag erstellen
5. **Git taggen** - `git tag vX.X.X && git push --tags`
6. **Testen** - WordPress.org Plugin-Seite prüfen
