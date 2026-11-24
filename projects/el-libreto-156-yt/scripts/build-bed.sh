#!/usr/bin/env bash
# Construye el stem de cama del reel a partir de una cama de la biblioteca.
# Uso: bash scripts/build-bed.sh <bed-id> [out-stem]
#   <bed-id>: id del registro (p. ej. libreto-messi-desmentido).
#   [out-stem]: destino (defecto public/audio/music-bed.wav).
# Pasos: bed-loop a 46,5 s (la cama tiene 60 s: recorte, sin bucle) al
# nivel NATIVO de la cama, sin ganancia -> dips de timeline.json
# (apply-bed-dips.py; este reel no tiene dips: la lista está vacía y
# el paso deja el stem intacto). SIN loudnorm posterior: el nivel de
# la cama en la mezcla se calibra con --music-volume en run-mix.py
# (ganancia lineal).
# La cama la define research/timeline.json (bed.id): FUENTE ÚNICA.
# Prohibido hardcodear otra cama (incidente V4, 23-nov-2026:
# negacion-embargo sonó con la cama vieja documentary-flow-a porque
# build-audio.sh la tenía hardcodeada). run-mix.py verifica la
# identidad del stem con bed_identity (NCC >= 0,99) antes de mezclar.
set -euo pipefail
cd "$(dirname "$0")/.."
HUB_PY="${HUB_PY:-$HOME/workspace/remotion-hub/.venv/bin/python}"
export TMPDIR="${TMPDIR:-$HOME/workspace/.tmp}"
mkdir -p "$TMPDIR" public/audio
BED_ID="${1:?falta bed-id}"
OUT="${2:-public/audio/music-bed.wav}"
NATIVE_LUFS=$(python3 -c "
import json
r = json.load(open('/home/hatch/workspace/remotion-hub/assets/music/beds/registry.json'))
beds = r['beds'] if 'beds' in r else r
for b in beds:
    if b.get('id') == '$BED_ID':
        print(b['lufs_measured']); break
else:
    raise SystemExit('bed no registrada: $BED_ID')
")
echo "cama $BED_ID (nativa $NATIVE_LUFS LUFS, sin ganancia)"
"$HUB_PY" ../../scripts/audio/bed-loop.py --bed "$BED_ID" \
  --seconds 46.5 --xfade 3.0 --target-lufs "$NATIVE_LUFS" --force \
  --out public/audio/music-bed-loop.wav
python3 scripts/apply-bed-dips.py public/audio/music-bed-loop.wav "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 \
  | grep -E "^\s+I:|^\s+True Peak" | head -3
echo "stem listo: $OUT (nivel nativo + dips; el volumen se calibra en la mezcla)"
