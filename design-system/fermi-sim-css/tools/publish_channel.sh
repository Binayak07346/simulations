#!/bin/sh
# Point the CHANNEL address (default v1) at the current VERSION:
#   s3://<bucket>/fermi-sim/v1/fermi-sim.css  <-  dist/fermi-sim.<VERSION>.css
# Sims built with `apply.py --channel v1` load this address, so publishing here restyles every such sim at once.
# Rules: the exact version must already be published (immutable, tools/upload_cdn.sh); the channel copy is
# cached only 5 minutes; S3 keeps every previous channel object (versioned bucket), and the channel can be
# rolled back by re-running this with VERSION set to an older published version.
#   sh tools/publish_channel.sh [channel] [version] [aws-profile]
set -e
cd "$(dirname "$0")/.."
CH=${1:-v1}; V=${2:-$(cat VERSION)}; PROFILE=${3:-fermi-new}
 BUCKET=superstem-nonprod-content-us-east-2-188496449551
FILE="dist/fermi-sim.$V.css"; [ -f "$FILE" ] || { echo "no $FILE"; exit 1; }
CDN=https://d6jsp0m3kqowo.cloudfront.net
[ "$(curl -s "$CDN/fermi-sim/$V/fermi-sim.css" | md5)" = "$(md5 -q "$FILE")" ] || { echo "version $V is not published (or differs) at $CDN/fermi-sim/$V/ : run tools/upload_cdn.sh first"; exit 1; }
aws s3api put-object --profile "$PROFILE" --bucket "$BUCKET" --key "fermi-sim/$CH/fermi-sim.css" --body "$FILE" \
  --content-type "text/css; charset=utf-8" --cache-control "public, max-age=300" \
  --metadata "fsim-version=$V" --server-side-encryption AES256 --query '[ETag,VersionId]' --output text
echo "channel $CH -> $V"
curl -sI "$CDN/fermi-sim/$CH/fermi-sim.css" | grep -iE "^(HTTP|content-type|cache-control|age|x-cache)" || true
