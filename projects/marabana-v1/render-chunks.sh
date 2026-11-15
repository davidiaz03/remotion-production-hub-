#!/bin/bash
# Chunked master render for REEL MARABANA V1.
# Full single-pass render dies in Chromium (OOM) — lección de V30 (~frame 339
# con concurrencia 1). Workaround: 6 chunks de ~230 fotogramas (Chromium
# nuevo en cada uno), luego concatenación. Cada chunk renderiza la composición
# COMPLETA en su rango, así que fundidos, textos y overlays son idénticos a
# un render en un solo pase. El audio se re-codifica en la concatenación
# para suavizar las uniones (el vídeo se copia).
set -e
source ~/workspace/remotion-hub/activate.sh
cd ~/workspace/remotion-hub/repo
OUT=$PWD/projects/marabana-v1/out
mkdir -p "$OUT/chunks"
CLI=node_modules/@remotion/cli/remotion-cli.js
ENTRY=$PWD/projects/marabana-v1/src/index.ts
PUB=$PWD/projects/marabana-v1/public
CHUNKS="0-229 230-459 460-689 690-919 920-1149 1150-1379"
i=1
for range in $CHUNKS; do
  f="$OUT/chunks/chunk_$(printf %02d $i).mp4"
  if [ -f "$f" ]; then echo "chunk $i ($range) exists, skipping"; i=$((i+1)); continue; fi
  echo "=== chunk $i / 6 : frames $range (start $(date -u +%H:%M:%S)) ==="
  node "$CLI" render "$ENTRY" MainReel "$f" --public-dir "$PUB" \
    --codec h264 --pixel-format yuv420p --crf 19 --concurrency 1 \
    --frames "$range" --log info 2>&1 | grep -E "Encoded [0-9]+/|Error|error" | tail -3
  echo "chunk $i done: $(stat -c%s "$f") bytes"
  i=$((i+1))
done
echo "=== all chunks rendered, concatenating ==="
ls "$OUT/chunks"/chunk_*.mp4 | sort | sed "s/^/file '/; s/$/'/" > "$OUT/chunks/list.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$OUT/chunks/list.txt" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  "$OUT/REEL_MARABANA_V1_ALBERTO_20261115.mp4"
echo "MASTER DONE: $(stat -c%s "$OUT/REEL_MARABANA_V1_ALBERTO_20261115.mp4") bytes"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1 "$OUT/REEL_MARABANA_V1_ALBERTO_20261115.mp4"
