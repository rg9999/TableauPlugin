#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ── 1. Bump patch version ────────────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "==> Version: $CURRENT_VERSION → $NEW_VERSION"

# Update package.json version
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update manifest.trex version
sed -i "s/extension-version=\"[^\"]*\"/extension-version=\"$NEW_VERSION\"/" public/manifest.trex

# ── 2. Build ─────────────────────────────────────────────────────────
echo "==> Building production bundle..."
npm run build

# ── 3. Package ───────────────────────────────────────────────────────
RELEASE_DIR="$PROJECT_DIR/releases"
mkdir -p "$RELEASE_DIR"

ZIP_NAME="telemetry-explorer-v${NEW_VERSION}.zip"
ZIP_PATH="$RELEASE_DIR/$ZIP_NAME"

echo "==> Creating installation package: $ZIP_NAME"
cd dist
zip -r "$ZIP_PATH" . -x '*.DS_Store'
cd "$PROJECT_DIR"

# Show result
SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo ""
echo "════════════════════════════════════════════════"
echo "  Telemetry Explorer v$NEW_VERSION"
echo "  Package: releases/$ZIP_NAME ($SIZE)"
echo "════════════════════════════════════════════════"
echo ""
echo "Deploy instructions:"
echo "  1. Copy $ZIP_NAME to Tableau Server"
echo "  2. Unzip into the extension hosting directory"
echo "  3. Update the extension URL in Tableau Server allowlist (if first deploy)"
echo ""
