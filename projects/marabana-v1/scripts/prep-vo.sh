#!/usr/bin/env bash
# Normaliza la VO de previsualización a -14 LUFS (igual que V30) y la pasa
# a 48 kHz estéreo, en el mismo archivo public/audio/vo-preview.wav.
# loudnorm en dos pasadas (medir -> aplicar), como en prep-media.sh.
# La duración NO cambia (solo ganancia + resampleo), así que vo-lines.json
# y los tiempos de los subtítulos siguen siendo válidos.
set -euo pipefail
cd "$(dirname "$0")/.."

VO=public/audio/vo-preview.wav
TMP=/tmp/vo-norm.wav

echo "== Pasada 1: medir sonoridad =="
MEASURED=$(ffmpeg -v info -i "$VO" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/Parsed_loudnorm/,/^}/p')
echo "$MEASURED"
get() { echo "$MEASURED" | grep "\"$1\"" | sed 's/.*: *"\?\([^",}]*\)"\?[,}]*$/\1/' || true; }
I=$(get input_i); TP=$(get input_tp); LRA=$(get input_lra)
THRESH=$(get input_thresh); OFFSET=$(get target_offset)
LINEAR=$(get linear)
# Este ffmpeg no reporta "linear" en el JSON; con LRA tan estrecha (TTS)
# la normalización lineal (ganancia simple) es la correcta.
[ -z "$LINEAR" ] && LINEAR=true
echo "medido: I=$I TP=$TP LRA=$LRA thresh=$THRESH offset=$OFFSET linear=$LINEAR"

echo "== Pasada 2: aplicar =="
ffmpeg -y -v error -i "$VO" -af "aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$THRESH:offset=$OFFSET:linear=$LINEAR" -ar 48000 -ac 2 "$TMP"

echo "== Verificación =="
ffmpeg -v info -i "$TMP" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/Parsed_loudnorm/,/^}/p' | grep -E 'input_i|input_tp'
ffprobe -v error -show_entries stream=sample_rate,channels -show_entries format=duration -of default=noprint_wrappers=1 "$TMP"

mv "$TMP" "$VO"
echo "OK $VO (48 kHz, -14 LUFS)"
