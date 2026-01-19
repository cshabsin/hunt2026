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

# Create landing page
echo "Creating landing page..."
cat > "$DIST_DIR/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hunt 2026 Projects</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        ul { list-style-type: none; padding: 0; }
        li { margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; transition: background 0.2s; }
        li:hover { background: #f9f9f9; border-color: #bbb; }
        a { text-decoration: none; color: #0070f3; font-weight: bold; font-size: 1.2rem; display: block; }
        p { color: #666; margin: 0.5rem 0 0; }
    </style>
</head>
<body>
    <h1>Hunt 2026 Project Hub</h1>
    <p>Collection of applications for the hunt.</p>
    <ul>
        <li>
            <a href="pursuit/">Pursuit of Liberty</a>
            <p>Go Game Viewer & Game of Life Simulation</p>
            <p style="color: red; font-weight: bold; margin-top: 0.25rem;">Warning: This tool may reveal spoilers for the puzzle.</p>
        </li>
        <li>
            <a href="skilldrasil/">Skilldrasil</a>
            <p>Interactive Skill Tree Visualization</p>
            <p style="color: red; font-weight: bold; margin-top: 0.25rem;">Warning: This tool may reveal spoilers for the puzzle.</p>
        </li>
        <li>
            <a href="physics/">The Physics of Linguistic Fracture</a>
            <p>Graph Viewer (Physics Module)</p>
            <p style="color: red; font-weight: bold; margin-top: 0.25rem;">Warning: This tool may reveal spoilers for the puzzle.</p>
        </li>
        <li>
            <a href="mass_confusion/">Mass Confusion</a>
            <p>Map Overlay Tool</p>
        </li>
    </ul>
</body>
</html>
EOF

# Create .nojekyll to bypass Jekyll processing on GH Pages
touch "$DIST_DIR/.nojekyll"

echo "------------------------------------------------"
echo "Build complete! Artifacts are in $DIST_DIR"
echo "------------------------------------------------"
