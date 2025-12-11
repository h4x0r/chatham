#!/bin/bash
#
# Export D2 diagrams to PNG
# Usage: ./scripts/export-diagrams.sh
#

set -e

echo "🎨 Exporting D2 Diagrams to PNG"
echo ""

# Export security model
echo "📤 Exporting security-model.d2..."
d2 docs/images/security-model.d2 docs/images/security-model.png \
  --theme=0 \
  --pad=20 \
  --scale=2
echo "✅ security-model.png"
echo ""

# Export chatham house model
echo "📤 Exporting chatham-house-model.d2..."
d2 docs/images/chatham-house-model.d2 docs/images/chatham-house-model.png \
  --theme=0 \
  --pad=20 \
  --scale=2
echo "✅ chatham-house-model.png"
echo ""

echo "✅ All diagrams exported successfully!"
