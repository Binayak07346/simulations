#!/bin/sh
# Push ONE built sim over its live stage copy, safely.
#   sh tools/push_stage.sh "<local built html>" "<s3 key>" [aws-profile]
# 1. reads the live object's ETag + VersionId
# 2. downloads it to ~/Desktop/stage-sims-s3-backup_<timestamp>/ (or $BACKUP_DIR) and appends a line to manifest.jsonl
# 3. overwrites it ONLY IF it is still that exact object (--if-match ETag)
# 4. prints what stage now serves
# Roll back: aws s3api put-object ... --body <backup file> (or restore the VersionId; the bucket is versioned).
set -e
# Batch:  sh tools/push_stage.sh --list LIST.tsv [aws-profile]
#   LIST.tsv rows: <local file> TAB <s3 key> TAB <md5 of the tested build>
#   Every row is checked BEFORE anything is written (file exists, md5 = the tested build,
#   key under simulations/, no duplicate keys); then the rows are pushed one by one into
#   ONE backup folder, stopping at the first failure.
if [ "$1" = "--list" ]; then
  LIST="$2"; PROFILE=${3:-fermi-new}; TAB="$(printf '\t')"
  [ -f "$LIST" ] || { echo "no such list: $LIST"; exit 1; }
  n=0
  while IFS="$TAB" read -r f k m; do
    n=$((n+1))
    [ -f "$f" ] || { echo "row $n: missing file $f"; exit 1; }
    [ "$(md5 -q "$f")" = "$m" ] || { echo "row $n: $f is not the tested build (md5 differs); nothing pushed"; exit 1; }
    case "$k" in simulations/*/*.html) ;; *) echo "row $n: unexpected key $k; nothing pushed"; exit 1;; esac
  done < "$LIST"
  [ "$(cut -f2 "$LIST" | sort | uniq -d | wc -l | tr -d ' ')" = "0" ] || { echo "duplicate keys in list; nothing pushed"; exit 1; }
  echo "list ok: $n files, all match their tested builds"
  export BACKUP_DIR="$HOME/Desktop/stage-sims-s3-backup_$(date +%Y-%m-%d_%H%M)_$(basename "$LIST" .tsv)"
  i=0
  while IFS="$TAB" read -r f k m; do
    i=$((i+1)); echo "[$i/$n] $k"
    sh "$0" "$f" "$k" "$PROFILE" </dev/null || { echo "STOPPED at row $i; rows after it were not touched"; exit 1; }
  done < "$LIST"
  echo "done: $n pushed · backups + manifest.jsonl in $BACKUP_DIR"; exit 0
fi
SRC="$1"; KEY="$2"; PROFILE=${3:-fermi-new}
BUCKET=superstem-nonprod-content-us-east-2-188496449551
[ -f "$SRC" ] || { echo "no such file: $SRC"; exit 1; }
BK=${BACKUP_DIR:-"$HOME/Desktop/stage-sims-s3-backup_$(date +%Y-%m-%d_%H%M)"}; mkdir -p "$BK"   # BACKUP_DIR: one folder for a whole batch
HEAD=$(aws s3api head-object --profile "$PROFILE" --bucket "$BUCKET" --key "$KEY" --query '[ETag,VersionId]' --output text)
ETAG=$(echo "$HEAD" | cut -f1 | tr -d '"'); VID=$(echo "$HEAD" | cut -f2)
echo "live: etag=$ETAG version=$VID"
aws s3api get-object --profile "$PROFILE" --bucket "$BUCKET" --key "$KEY" --version-id "$VID" "$BK/$(basename "$KEY")" >/dev/null
printf '{"bucket":"%s","key":"%s","etag":"%s","version_id":"%s","replaced_by":"%s"}\n' "$BUCKET" "$KEY" "$ETAG" "$VID" "$(md5 -q "$SRC")" >> "$BK/manifest.jsonl"
[ "$(md5 -q "$BK/$(basename "$KEY")")" = "$ETAG" ] || { echo "backup does not match live ETag; stopping"; exit 1; }
echo "backup: $BK"
aws s3api put-object --profile "$PROFILE" --bucket "$BUCKET" --key "$KEY" --body "$SRC" \
  --content-type "text/html; charset=utf-8" --server-side-encryption AES256 --if-match "\"$ETAG\"" \
  --query '[ETag,VersionId]' --output text
echo "pushed: s3://$BUCKET/$KEY"
