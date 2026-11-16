#!/usr/bin/env bash
# Reducción de ruido de audio con afftdn (ffmpeg 8.1.2 del sistema).
#
# Uso:
#   tools/denoise-audio.sh entrada salida.wav|salida.mp4 [nr] [nf]
#
#   nr  Reducción máxima de ruido en dB (12 por defecto; 6-8 suave,
#       15-20 agresivo). Por encima de ~15 dB aparecen artefactos
#       ("burbujas" metálicas) en la voz: mejor dos pasadas suaves
#       que una agresiva. En la práctica nr importa menos que nf:
#       con nf=-30, nr=6 da -3,3 dB y nr=30 da -5,3 dB.
#   nf  Piso de ruido en dB (-30 por defecto). ES EL PARÁMETRO QUE
#       MANDA: afftdn solo atenúa lo que está por debajo de nf, así
#       que nf debe estar CERCA del nivel real del ruido. Con el
#       valor por defecto de ffmpeg (nf=-50) afftdn NO HACE NADA en
#       grabaciones con ruido de -25 a -35 dB (medido 16-nov-2026:
#       0,0 dB de cambio). Regla: mide el RMS de un tramo sin voz
#       (p. ej. `ffmpeg -i x.wav -af astats -f null -` sobre un
#       recorte de silencio) y pon nf a ese nivel o unos dB por
#       encima. Si no sabes el nivel, prueba -35, -30, -25 y escucha.
#
# Verificación (16-nov-2026, voz de estudio + ruido blanco a -25 dB):
#   nf=-50 -> 0,0 dB de reducción (nada); nf=-35 -> -1,6 dB;
#   nf=-30 -> -4,5 dB; nf=-25 -> -9,5 dB; nf=-20 -> -11,9 dB,
#   con la banda de voz (300 Hz-1 kHz) intacta en todos los casos.
#   (Todos con nr=12 y sin tn; ver abajo.)
#
# NO usar tn=1 (track noise): medido 16-nov-2026, el seguimiento
# continuo del ruido DEBILITA la reducción (con nf=-30: -4,5 dB sin
# tn frente a -1,6 dB con tn=1; con nf=-25: -9,5 dB frente a -2,2 dB).
# El estimador se adapta hacia arriba hasta el nivel señal+ruido y
# deja de atenuar. Para ruido cambiante (calle) tampoco ayuda: ver
# el límite de multitud abajo.
#
# Límites (medidos 16-nov-2026):
# - afftdn NO quita ruido fuerte no estacionario (multitud, música
#   bajo la voz): en un clip de Canal Caribe con multitud a -13 dB
#   el cambio fue de 0,0-0,3 dB en todas las bandas. Para ese caso
#   usa DeepFilterNet (ver README del hub).
# - La salida sale ~25 ms ADELANTADA respecto a la entrada (latencia
#   del FFT sin compensar, medida por correlación cruzada). En un
#   .wav suelto no importa; si reemplazas el audio de un video,
#   el desfase A/V de 25 ms es apenas perceptible, pero para sync
#   exacto retrasa el audio con `-itsoffset 0.025 -i`.
# - NO sustituye a regrabar en silencio: si el ruido tapa la voz,
#   el resultado seguirá sonando procesado.
#
# Con entrada de video, el video se copia sin recodificar y solo se
# procesa el audio. La salida .wav sale en PCM 16 bit / 48 kHz;
# cualquier otra extensión sale en AAC 192 kbps.
set -euo pipefail

IN="${1:?Uso: denoise-audio.sh entrada salida.wav|salida.mp4 [nr] [nf]}"
OUT="${2:?Uso: denoise-audio.sh entrada salida.wav|salida.mp4 [nr] [nf]}"
NR="${3:-12}"
NF="${4:--30}"

HAS_VIDEO="$(ffprobe -v error -select_streams v:0 -show_entries stream=index -of csv=p=0 "$IN" || true)"
FILTER="afftdn=nr=$NR:nf=$NF"

if [ -n "$HAS_VIDEO" ]; then
  VIDEO_OPTS=(-c:v copy)
else
  VIDEO_OPTS=()
fi

case "$OUT" in
  *.wav) AUDIO_OPTS=(-c:a pcm_s16le -ar 48000) ;;
  *)     AUDIO_OPTS=(-c:a aac -b:a 192k) ;;
esac

echo "afftdn nr=$NR nf=$NF ..."
ffmpeg -y -v error -i "$IN" -af "$FILTER" \
  "${VIDEO_OPTS[@]}" "${AUDIO_OPTS[@]}" "$OUT"

echo "OK -> $OUT"
