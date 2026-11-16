#!/usr/bin/env bash
# Corrección de color con un LUT 3D (lut3d, ffmpeg 8.1.2 del sistema).
#
# Uso:
#   tools/color-grade.sh entrada.mp4 salida.mp4 [lut.cube]
#
# LUT por defecto: tools/luts/warm-contrast.cube (cálido documental:
# saturación 1.15, contraste 1.08, temperatura +0.04).
# Otros LUT incluidos: tools/luts/cool-teal.cube.
#
# Crear tu propio LUT (reproducible, sin software de etalonaje):
#   python tools/make-lut.py --saturation 1.2 --contrast 1.1 -o mi.cube
# También vale cualquier .cube de terceros (17^3 o 33^3, dominio 0-1).
#
# Nota: lut3d aplica el LUT tal cual, sin adaptación por escena. Para
# planos con exposición muy distinta, gradúa por separado o ajusta
# primero con eq=brightness/contrast antes del lut3d.
set -euo pipefail

IN="${1:?Uso: color-grade.sh entrada.mp4 salida.mp4 [lut.cube]}"
OUT="${2:?Uso: color-grade.sh entrada.mp4 salida.mp4 [lut.cube]}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LUT="${3:-$SCRIPT_DIR/luts/warm-contrast.cube}"

[ -f "$LUT" ] || { echo "ERROR: no existe el LUT $LUT" >&2; exit 1; }

echo "Aplicando LUT $LUT ..."
ffmpeg -y -v error -i "$IN" \
  -vf "lut3d=file='$LUT'" \
  -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p \
  -c:a copy "$OUT"

echo "OK -> $OUT"
