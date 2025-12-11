#!/bin/bash
#
# Export Excalidraw diagrams to PNG
# Usage: ./scripts/export-diagrams.sh
#

set -e

echo "🎨 Exporting Excalidraw Diagrams to PNG"
echo ""

# Export security model
echo "📤 Exporting security-model.excalidraw..."
npx excalidraw-brute-export-cli \
  -i docs/images/security-model.excalidraw \
  -o docs/images/security-model.png \
  --format png \
  --scale 2 \
  --background 1
echo "✅ security-model.png"
echo ""

# Export chatham house model
echo "📤 Exporting chatham-house-model.excalidraw..."
npx excalidraw-brute-export-cli \
  -i docs/images/chatham-house-model.excalidraw \
  -o docs/images/chatham-house-model.png \
  --format png \
  --scale 2 \
  --background 1
echo "✅ chatham-house-model.png"
echo ""

echo "✅ All diagrams exported successfully!"
