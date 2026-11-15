#!/usr/bin/env bash
# Prepara video y audio de marabana-v1 con ffmpeg.
# Uso: bash scripts/prep-media.sh
set -euo pipefail
SRC="$HOME/workspace/marabana/assets"
V30="$HOME/workspace/remotion-hub/repo/projects/pilar-v30/public"
DST="$HOME/workspace/remotion-hub/repo/projects/marabana-v1/public"

# --- Video: salida masiva Canal Caribe, 43.5-48s (4.5s; el beat usa 3.5s) ---
ffmpeg -v error -y -ss 43.5 -i "$SRC/video/canalcaribe-15nov2026.mp4" -t 4.5 \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an \
  "$DST/video/start.mp4"
echo "start.mp4: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DST/video/start.mp4") s"

# --- Sting oficial (copia tal cual) ---
cp "$SRC/CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4" "$DST/video/sting.mp4"

# --- Audio del sting (el disparo está en ~1-2s; el resto casi silencio) ---
ffmpeg -v error -y -i "$SRC/CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4" -map 0:a \
  -ac 2 -ar 48000 "$DST/audio/sting.wav"

# --- Música Flow editada: intro 0-12s + sección potente 30-59s, crossfade 1s, fade-out 2s ---
# 12 + 29 - 1 (crossfade) = 40 s exactos (fotogramas 0-1199 del reel).
ffmpeg -v error -y -i "$V30/audio/music.wav" -filter_complex \
  "[0:a]atrim=0:12,asetpts=PTS-STARTPTS[intro]; \
   [0:a]atrim=30:59,asetpts=PTS-STARTPTS[drive]; \
   [intro][drive]acrossfade=d=1:c1=tri:c2=tri,afade=t=out:st=38:d=2,aresample=48000" \
  "$DST/audio/music-edit.wav"
echo "music-edit.wav: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DST/audio/music-edit.wav") s"

# --- Nivelación a -14 LUFS integrado (mismo objetivo que V30), ganancia global ---
# loudnorm imprime el JSON en stderr a nivel info: hay que extraer el bloque {..}.
measure_lufs() {
  ffmpeg -hide_banner -i "$1" -af loudnorm=print_format=json -f null - 2>&1 \
    | python3 -c "import sys,json; t=sys.stdin.read(); d=json.loads(t[t.index('{'):t.rindex('}')+1]); print(d['input_i'], d['input_tp'])"
}
read MEASURED TP <<< "$(measure_lufs "$DST/audio/music-edit.wav")"
echo "loudness medida: $MEASURED LUFS (true peak $TP dBTP)"
GAIN=$(python3 -c "print(round(-14 - ($MEASURED), 2))")
echo "ganancia aplicada: ${GAIN} dB"
ffmpeg -v error -y -i "$DST/audio/music-edit.wav" -af "volume=${GAIN}dB" "$DST/audio/music.wav"
rm "$DST/audio/music-edit.wav"
read FINAL_I FINAL_TP <<< "$(measure_lufs "$DST/audio/music.wav")"
echo "music.wav final: $FINAL_I LUFS, true peak: $FINAL_TP dBTP"
echo "OK prep-media.sh"
