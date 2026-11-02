#!/bin/sh
# Upload the built stylesheet to the content bucket behind the media CDN.
#   sh tools/upload_cdn.sh [version] [aws-profile]   (default: VERSION file, profile fermi-new)
# Creates fermi-sim/<VERSION>/fermi-sim.css ONLY if that key does not exist yet
# (--if-none-match '*'): a published version is immutable and is never overwritten.
set -e
cd "$(dirname "$0")/.."
V=${1:-$(cat VERSION)}
PROFILE=${2:-fermi-new}
BUCKET=superstem-nonprod-content-us-east-2-188496449551
KEY="fermi-sim/$V/fermi-sim.css"
FILE="dist/fermi-sim/$V/fermi-sim.css"
# a version that is already built is FROZEN: upload exactly the verified bytes, never rebuild it from newer sources
if [ ! -f "dist/fermi-sim.$V.css" ]; then [ "$V" = "$(cat VERSION)" ] || { echo "dist for $V missing"; exit 1; }; python3 tools/build.py; fi
[ "$(shasum -a 256 "dist/fermi-sim.$V.css" | cut -d" " -f1)" = "$(cat "dist/fermi-sim.$V.sha256")" ] || { echo "dist $V does not match its recorded sha256"; exit 1; }
mkdir -p "dist/fermi-sim/$V" && cp "dist/fermi-sim.$V.css" "dist/fermi-sim/$V/fermi-sim.css"
aws s3api put-object --profile "$PROFILE" --bucket "$BUCKET" --key "$KEY" --body "$FILE" \
  --content-type "text/css; charset=utf-8" \
  --cache-control "public, max-age=31536000, immutable" \
  --server-side-encryption AES256 --if-none-match '*'
echo "uploaded s3://$BUCKET/$KEY"
echo "CDN check:"
curl -sI "https://d6jsp0m3kqowo.cloudfront.net/$KEY" | grep -iE "^(HTTP|content-type|access-control-allow-origin)" || true
