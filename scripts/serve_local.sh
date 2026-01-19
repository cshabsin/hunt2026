#!/bin/bash
set -e

ROOT_DIR=$(pwd)
DOCS_DIR="$ROOT_DIR/docs"

if [ ! -d "$DOCS_DIR" ]; then
  echo "Error: 'docs' directory not found."
  echo "Please run './scripts/build_release.sh' first to generate the static site."
  exit 1
fi

echo "Serving local site from $DOCS_DIR at http://localhost:8080..."
echo "Press Ctrl+C to stop."

python3 -m http.server --directory "$DOCS_DIR" 8080
