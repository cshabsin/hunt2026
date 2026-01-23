#!/bin/bash
set -e

# Define root
ROOT_DIR=$(pwd)
DIST_DIR="$ROOT_DIR/docs"

echo "Cleaning dist directory: $DIST_DIR"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Helper function
build_app() {
  APP_DIR=$1
  URL_SUBPATH=$2
  
  echo "------------------------------------------------"
  echo "Building $APP_DIR for /$URL_SUBPATH..."
  echo "------------------------------------------------"
  
  cd "$ROOT_DIR/$APP_DIR"
  
  # Install dependencies if needed (check node_modules)
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
  fi
  
  # Build
  echo "Running build..."
  npm run build
  
  # Move artifacts
  TARGET_DIR="$DIST_DIR/$URL_SUBPATH"
  mkdir -p "$TARGET_DIR"
  cp -r out/* "$TARGET_DIR/"
  
  echo "Done building $APP_DIR"
}

# Build all apps
build_app "pursuit" "pursuit"
build_app "skilldrasil" "skilldrasil"
build_app "physics/graph-viewer" "physics"
build_app "mass_confusion/map-overlay" "mass_confusion"
build_app "balancing_act/puzzle-ui" "balancing_act"

# Create landing page
echo "Creating landing page..."
cp "$ROOT_DIR/index.html" "$DIST_DIR/index.html"
cp "$ROOT_DIR/styles.css" "$DIST_DIR/styles.css"

# Create .nojekyll to bypass Jekyll processing on GH Pages
touch "$DIST_DIR/.nojekyll"

echo "------------------------------------------------"
echo "Build complete! Artifacts are in $DIST_DIR"
echo "------------------------------------------------"
