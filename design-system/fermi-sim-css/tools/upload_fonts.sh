#!/bin/sh
# Upload the shared sim fonts (Wave 3) to the content bucket behind the media CDN:
#   s3://<bucket>/fermi-sim/fonts/<file>  <-  fonts/<file>
# Each key is created ONLY if it does not exist yet (--if-none-match '*'): a published font is immutable.
# A font already published with the same bytes is skipped; one published with DIFFERENT bytes stops the script.
#   sh tools/upload_fonts.sh [aws-profile]
set -e
cd "$(dirname "$0")/.."
PROFILE=${1:-fermi-new}
BUCKET=superstem-nonprod-content-us-east-2-188496449551
CDN=https://d6jsp0m3kqowo.cloudfront.net
for f in fonts/*.woff2 fonts/*.ttf; do
  n=$(basename "$f"); KEY="fermi-sim/fonts/$n"
  case "$n" in *.woff2) CT=font/woff2 ;; *.ttf) CT=font/ttf ;; esac
  live=$(curl -s "$CDN/$KEY" | md5)
  if [ "$live" = "$(md5 -q "$f")" ]; then echo "same   $KEY (already published)"; continue; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" "$CDN/$KEY")
  [ "$code" = "200" ] && { echo "DIFFERENT bytes already published at $KEY: stopping"; exit 1; }
  aws s3api put-object --profile "$PROFILE" --bucket "$BUCKET" --key "$KEY" --body "$f" \
    --content-type "$CT" --cache-control "public, max-age=31536000, immutable" \
    --server-side-encryption AES256 --if-none-match '*' --query ETag --output text
  echo "upload $KEY"
done
echo "CDN check:"
for f in fonts/*.woff2 fonts/*.ttf; do
  n=$(basename "$f")
  printf '%s  ' "$n"; curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -H "Origin: https://stage.fermi.ai" "$CDN/fermi-sim/fonts/$n"
done
