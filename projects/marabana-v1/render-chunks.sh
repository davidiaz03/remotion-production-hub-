#!/bin/bash
# Chunked master render for REEL MARABANA V1.3 (VO version, 1439 frames).
# Full single-pass render dies in Chromium (OOM) — lección de V30 (~frame 339
# con concurrencia 1). Workaround: 6 chunks de ~240 fotogramas (Chromium
# nuevo en cada uno), luego concatenación. Cada chunk renderiza la composición
# COMPLETA en su rango, así que fundidos, textos y overlays son idénticos a
# un render en un solo pase. El audio se re-codifica en la concatenación
# para suavizar las uniones (el vídeo se copia).
# V1.1: techo de true peak en la concatenación (alimiter -1.5 dBFS): el
# máster V1 medía +1.31 dBTP (sobre 0) por el transitorio del disparo.
# V1.2: el limiter baja a 0.79 (-2.05 dBFS) porque con 0.84 el máster
# medía -1.27 dBTP (el sobreimpulso inter-muestra del disparo supera el
# techo de -1.5 dBTP pedido); con 0.79 el true peak queda en ~-1.6 dBTP.
# V1.2: 1439 fotogramas (47.97 s) por la línea nueva de bucle abierto
# (+3.067 s); rangos de chunks actualizados en consecuencia.
# V1.3: mismos rangos y duración; cambian la marca de agua (blanca
# transparente desde f0), el ducking del arranque y la cola musical
# bajo el sting — borrar out/chunks/ antes de re-renderizar.
# V1.3 (audio): la concatenación recorta 40 ms del inicio del audio
# (atrim=start=0.04 + asetpts): el render por tramos deja 40 ms de
# silencio digital al inicio (medido en el chunk 1 y en el máster V1.3
# inicial: los primeros 100 ms medían −26,6 dBFS aunque la música está
# a pleno nivel desde t=0). El recorte desplaza todo el audio 40 ms
# antes (1,2 fotogramas, imperceptible; compensa en parte la deriva
# +0,31 s del pipeline). Además, un realce de +6 dB que decae a 0 dB
# en los primeros 100 ms (volume con eval=frame, antes del limiter):
# con solo el recorte, los primeros 100 ms medían −22,4 dBFS (el
# ataque del Acto A es suave y el pipeline atenúa ~3-4 dB el arranque);
# el realce los lleva a ≈−19,5 dBFS, a pleno nivel desde el fotograma 0,
# sin salto audible después (a los 100 ms la ganancia ya es 1).
# La Sequence de música cubre TOTAL_FRAMES
# (antes CONTENT_END: la cola bajo el sting se cortaba en 44,97 s).
# Salida: MÁSTER (1080x1920, CRF 19) + LIGERA (720p, un solo paso desde el
# máster) — la ligera es la que se adjunta en el chat; el máster va por Drive.
# NOTA: si cambian los rangos o la composición, borrar out/chunks/ antes de
# re-renderizar (el script reutiliza los chunks existentes).
set -e
source ~/workspace/remotion-hub/activate.sh
cd ~/workspace/remotion-hub/repo
OUT=$PWD/projects/marabana-v1/out
mkdir -p "$OUT/chunks"
CLI=node_modules/@remotion/cli/remotion-cli.js
ENTRY=$PWD/projects/marabana-v1/src/index.ts
PUB=$PWD/projects/marabana-v1/public
CHUNKS="0-239 240-479 480-719 720-959 960-1199 1200-1438"
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
  -c:v copy -af "atrim=start=0.04,asetpts=PTS-STARTPTS,volume='if(lt(t,0.1),pow(10,6*(1-t/0.1)/20),1)':eval=frame,alimiter=limit=0.79:attack=5:release=50:level=false" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_MASTER.mp4"
echo "MASTER DONE: $(stat -c%s "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_MASTER.mp4") bytes"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1 "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_MASTER.mp4"
echo "=== ligera (720p, un solo paso desde el máster) ==="
ffmpeg -y -v error -i "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_MASTER.mp4" \
  -vf scale=720:1280 -c:v libx264 -crf 26 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart \
  "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_LIGERO.mp4"
echo "LIGERA DONE: $(stat -c%s "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_LIGERO.mp4") bytes"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1 "$OUT/REEL_MARABANA_V1.3_ALBERTO_20261115_LIGERO.mp4"
