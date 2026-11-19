#!/bin/bash
# finish-masters.sh — modern-wisdom-aprende
# Mux del mix con el video renderizado + máster 1080p + 720p + 360p.
# Requisitos previos: out/modern-wisdom-aprende-chunks.mp4,
# public/audio/mix.wav (mix.py, -14.5 LUFS).
#
# Notas:
# - master.py solo procesa el audio EMBEBIDO en el video de entrada, así
#   que primero se muxa el mix con el render (video copy, audio PCM).
# - --no-trim --no-boost: el recorte de 40 ms y el realce de arranque
#   compensan artefactos del audio DENTRO de los tramos; aquí los tramos
#   son solo video y el audio es una mezcla continua, así que no aplican.
#   Sin --atempo: sin audio en los tramos no hay deriva A/V.
# - La ligera de master.py asume video VERTICAL (light_h = w*16/9): para
#   este horizontal produciría un aspecto incorrecto. Se genera a un
#   archivo temporal y se borra; la 720p y la 360p se hacen con ffmpeg
#   directamente desde el máster.
# - 360p (entrega principal): 2-pass a 500 kbps video + AAC 96k.
#   720p (archivo estándar): CRF 21 + AAC 128k.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1/5 mux mix + video =="
ffmpeg -y -v error -i out/modern-wisdom-aprende-chunks.mp4 \
  -i public/audio/mix.wav -map 0:v -map 1:a \
  -c:v copy -c:a pcm_s16le -ar 48000 out/muxed-temp.mp4

echo "== 2/5 máster 1080p (master.py) =="
~/workspace/remotion-hub/.venv/bin/python ../../scripts/audio/master.py \
  --input out/muxed-temp.mp4 \
  --out-master out/modern-wisdom-aprende-MASTER.mp4 \
  --out-light out/_tmp-light-vertical.mp4 \
  --no-trim --no-boost --force
rm -f out/_tmp-light-vertical.mp4 out/muxed-temp.mp4

echo "== 3/5 720p estándar (archivo) =="
ffmpeg -y -v error -i out/modern-wisdom-aprende-MASTER.mp4 \
  -vf scale=1280:720 -c:v libx264 -crf 21 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart \
  out/modern-wisdom-aprende-720p.mp4

echo "== 4/5 360p entrega principal (2-pass 500k + AAC 96k) =="
ffmpeg -y -v error -i out/modern-wisdom-aprende-MASTER.mp4 \
  -vf scale=640:360 -c:v libx264 -b:v 500k -pass 1 -passlogfile out/360p-passlog \
  -preset medium -pix_fmt yuv420p -an -f mp4 /dev/null
ffmpeg -y -v error -i out/modern-wisdom-aprende-MASTER.mp4 \
  -vf scale=640:360 -c:v libx264 -b:v 500k -pass 2 -passlogfile out/360p-passlog \
  -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ar 48000 -movflags +faststart \
  out/modern-wisdom-aprende-360p.mp4
rm -f out/360p-passlog-0.log out/360p-passlog-0.log.mbtree

echo "== 5/5 tamaños =="
ls -la out/modern-wisdom-aprende-MASTER.mp4 out/modern-wisdom-aprende-720p.mp4 \
  out/modern-wisdom-aprende-360p.mp4
for f in MASTER 720p 360p; do
  ffprobe -v error -show_entries format=duration,size \
    -show_entries stream=width,height,codec_name,bit_rate \
    -of default=noprint_wrappers=1 "out/modern-wisdom-aprende-$f.mp4" | sed "s/^/[$f] /"
done
echo FIN_OK
