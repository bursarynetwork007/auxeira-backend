#!/bin/bash
set -e

echo "=========================================="
echo "Implementing Cache-Busting Strategy"
echo "=========================================="
echo ""

# Generate version timestamp
VERSION=$(date +%Y%m%d%H%M%S)
echo "Version: $VERSION"
echo ""

# Function to add version to URLs in HTML files
add_cache_busting() {
  local file=$1
  echo "Processing $file..."
  
  # Backup original
  cp "$file" "${file}.backup"
  
  # Add version to CSS links
  sed -i "s|href=\"\([^\"]*\.css\)\"|href=\"\1?v=$VERSION\"|g" "$file"
  
  # Add version to JS scripts
  sed -i "s|src=\"\([^\"]*\.js\)\"|src=\"\1?v=$VERSION\"|g" "$file"
  
  # Add version to image sources
  sed -i "s|src=\"\([^\"]*\.\(png\|jpg\|jpeg\|gif\|svg\)\)\"|src=\"\1?v=$VERSION\"|g" "$file"
  
  echo "✓ Added cache-busting to $file"
}

# Process HTML files
if [ -f "startup_founder.html" ]; then
  add_cache_busting "startup_founder.html"
fi

if [ -f "onboarding-form.html" ]; then
  add_cache_busting "onboarding-form.html"
fi

if [ -f "index.html" ]; then
  add_cache_busting "index.html"
fi

echo ""
echo "✓ Cache-busting implemented!"
echo ""
echo "Version: $VERSION"
echo ""
echo "Backups created with .backup extension"
echo "To restore: mv file.backup file"
