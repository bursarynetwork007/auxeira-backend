#!/bin/bash
set -e

echo "=========================================="
echo "Uploading Files with Optimized Headers"
echo "=========================================="
echo ""

BUCKET="dashboard.auxeira.com"

# Function to upload HTML files (short cache)
upload_html() {
  local file=$1
  echo "Uploading $file (short cache: 60s)..."
  aws s3 cp "$file" "s3://$BUCKET/$file" \
    --content-type "text/html; charset=utf-8" \
    --cache-control "public, max-age=60, must-revalidate" \
    --metadata-directive REPLACE
  echo "✓ Uploaded $file"
}

# Function to upload CSS files (long cache with versioning)
upload_css() {
  local file=$1
  echo "Uploading $file (long cache: 1 year)..."
  aws s3 cp "$file" "s3://$BUCKET/$file" \
    --content-type "text/css; charset=utf-8" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive REPLACE
  echo "✓ Uploaded $file"
}

# Function to upload JS files (long cache with versioning)
upload_js() {
  local file=$1
  echo "Uploading $file (long cache: 1 year)..."
  aws s3 cp "$file" "s3://$BUCKET/$file" \
    --content-type "application/javascript; charset=utf-8" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive REPLACE
  echo "✓ Uploaded $file"
}

# Function to upload images (long cache)
upload_image() {
  local file=$1
  local ext="${file##*.}"
  local content_type="image/$ext"
  
  case $ext in
    jpg|jpeg) content_type="image/jpeg" ;;
    png) content_type="image/png" ;;
    gif) content_type="image/gif" ;;
    svg) content_type="image/svg+xml" ;;
  esac
  
  echo "Uploading $file (long cache: 1 year)..."
  aws s3 cp "$file" "s3://$BUCKET/$file" \
    --content-type "$content_type" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive REPLACE
  echo "✓ Uploaded $file"
}

echo "Uploading HTML files..."
echo "----------------------------------------"
for file in *.html; do
  if [ -f "$file" ]; then
    upload_html "$file"
  fi
done

echo ""
echo "Uploading CSS files..."
echo "----------------------------------------"
for file in *.css; do
  if [ -f "$file" ]; then
    upload_css "$file"
  fi
done

echo ""
echo "Uploading JS files..."
echo "----------------------------------------"
for file in *.js; do
  if [ -f "$file" ]; then
    upload_js "$file"
  fi
done

echo ""
echo "Uploading images..."
echo "----------------------------------------"
for file in *.{png,jpg,jpeg,gif,svg}; do
  if [ -f "$file" ]; then
    upload_image "$file"
  fi
done

echo ""
echo "✓ All files uploaded with optimized headers!"
echo ""
echo "Cache Strategy:"
echo "  HTML: 60s (must-revalidate)"
echo "  CSS/JS: 1 year (immutable, use versioning)"
echo "  Images: 1 year (immutable)"
