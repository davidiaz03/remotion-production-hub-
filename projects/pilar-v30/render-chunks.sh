#!/bin/bash
# Chunked master render for REEL PILAR V30.
# Full single-pass render dies in Chromium (OOM) at ~frame 339 with
# --concurrency 1 (~148 with concurrency 2): cumulative memory growth.
# Workaround: 9 chunks of ~251 frames (fresh Chromium each), then concat.
# Each chunk renders the FULL composition for its frame range, so crossfades,
# captions, punches and overlays are identical to a single-pass render.
# Audio is re-encoded at concat to smooth chunk boundaries (video copied).
set -e
source ~/workspace/remotion-hub/activate.sh
cd ~/workspace/remotion-hub/repo
OUT=$PWD/projects/pilar-v30/out
mkdir -p "$OUT/chunks"
CLI=node_modules/@remotion/cli/remotion-cli.js
ENTRY=$PWD/projects/pilar-v30/src/index.ts
PUB=$PWD/projects/pilar-v30/public
CHUNKS="0-250 251-501 502-752 753-1003 1004-1254 1255-1505 1506-1756 1757-2007 2008-2260"
i=1
for range in $CHUNKS; do
  f="$OUT/chunks/chunk_$(printf %02d $i).mp4"
  if [ -f "$f" ]; then echo "chunk $i ($range) exists, skipping"; i=$((i+1)); continue; fi
  echo "=== chunk $i / 9 : frames $range (start $(date -u +%H:%M:%S)) ==="
  node "$CLI" render "$ENTRY" MainReel "$f" --public-dir "$PUB" \
    --codec h264 --pixel-format yuv420p --crf 19 --concurrency 1 \
    --frames "$range" --log info 2>&1 | grep -E "Encoded [0-9]+/|Error|error" | tail -3
  echo "chunk $i done: $(stat -c%s "$f") bytes"
  i=$((i+1))
done
echo "=== all chunks rendered, concatenating ==="
ls "$OUT/chunks"/chunk_*.mp4 | sort | sed "s/^/file '/; s/$/'/" > "$OUT/chunks/list.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$OUT/chunks/list.txt" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 "$OUT/pilar-v30-full.mp4"
echo "MASTER DONE: $(stat -c%s "$OUT/pilar-v30-full.mp4") bytes"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,width,height -of csv=p=0 "$OUT/pilar-v30-full.mp4"
