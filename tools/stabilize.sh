#!/usr/bin/env bash
# Estabilizar video (ffmpeg 8.1.2 del sistema).
#
# Uso:
#   tools/stabilize.sh entrada.mp4 salida.mp4 [--method deshake|vidstab] \
#       [shakiness] [smoothing]
#
#   --method deshake  Método por defecto: filtro `deshake` de un solo
#       pase. Determinista (dos corridas producen salida bit-idéntica)
#       y sin saltos; corrección moderada.
#   --method vidstab  vidstabdetect + vidstabtransform, dos pases.
#       Corrección mucho más fuerte, PERO NO DETERMINISTA en este
#       build de ffmpeg 8.1.2 (ver "Hallazgo" abajo): cada corrida da
#       un resultado distinto y en planos con temblor fuerte aparecen
#       saltos de un solo fotograma. Usar solo cuando la corrección
#       máxima compense y verificando el resultado visualmente.
#   shakiness  1-10, cuánto tiembla el plano (5 por defecto; 8-10 para
#       móvil a pulso corriendo, 2-3 para trípode con vibración).
#       Solo afecta a vidstab.
#   smoothing  Ventana de suavizado del camino de cámara, en fotogramas
#       (30 por defecto ≈ 1 s a 30 fps; más = más suave pero más
#       recorte y más retardo en los paneos). Solo afecta a vidstab.
#
# Hallazgo (16-nov-2026, medido en este ffmpeg 8.1.2): vidstab es NO
# DETERMINISTA. `vidstabdetect` dos veces sobre el mismo clip produce
# .trf distintos, y `vidstabtransform` dos veces con el MISMO .trf
# produce 103/120 fotogramas distintos (clip sintético con temblor) y
# 95/120 en metraje real. No es threading de filtros (persiste con
# -filter_threads 1). En el clip con temblor, vidstab deja 34/119 pares
# de fotogramas con saltos >10 px aunque la mediana residual es
# excelente (0,17 px frente a 6,32 px de temblor). deshake, en el
# mismo clip, es bit-idéntico entre corridas y baja la mediana de
# 7,07 px a 2,68 px sin saltos (solo 1/119 pares >10 px).
#
# Reglas de uso:
# - NUNCA estabilizar cruzando un corte de escena: la ventana de
#   suavizado (61 fotogramas con smoothing=30) mezcla los dos planos
#   y corrompe los fotogramas cercanos al corte. Cortar primero por
#   escenas (ver tools/README.md).
# - Los paneos intencionados rápidos se suavizan: baja smoothing a
#   10-15 si el paneo debe sentirse.
# - Ningún método arregla temblor extremo ni rolling shutter; ambos
#   recortan los bordes (vidstab con optzoom=1 hace zoom dinámico,
#   típico 5-15%; deshake rellena los bordes con clamp).
set -euo pipefail

METHOD="deshake"
ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --method)
      METHOD="${2:?--method necesita deshake o vidstab}"; shift 2 ;;
    --method=*)
      METHOD="${1#--method=}"; shift ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

IN="${ARGS[0]:-}"
OUT="${ARGS[1]:-}"
if [ -z "$IN" ] || [ -z "$OUT" ]; then
  echo "Uso: stabilize.sh entrada.mp4 salida.mp4 [--method deshake|vidstab] [shakiness] [smoothing]" >&2
  exit 2
fi
SHAKINESS="${ARGS[2]:-5}"
SMOOTHING="${ARGS[3]:-30}"

case "$METHOD" in
  deshake)
    echo "deshake (rx=16 ry=16 edge=clamp blocksize=8)..."
    ffmpeg -y -v error -i "$IN" \
      -vf "deshake=rx=16:ry=16:edge=clamp:blocksize=8" \
      -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p \
      -c:a copy "$OUT"
    ;;
  vidstab)
    echo "ADVERTENCIA: vidstab es NO DETERMINISTA en este ffmpeg 8.1.2;" >&2
    echo "  cada corrida da un resultado distinto. Verifica el resultado" >&2
    echo "  visualmente; si hay saltos, prueba --method deshake." >&2
    TMPDIR="$(mktemp -d)"
    trap 'rm -rf "$TMPDIR"' EXIT
    TRF="$TMPDIR/transforms.trf"
    echo "Pase 1/2: vidstabdetect (shakiness=$SHAKINESS)..."
    ffmpeg -y -v error -i "$IN" \
      -vf "vidstabdetect=stepsize=6:shakiness=$SHAKINESS:accuracy=15:result=$TRF" \
      -f null -
    echo "Pase 2/2: vidstabtransform (smoothing=$SMOOTHING, optzoom=1)..."
    ffmpeg -y -v error -i "$IN" \
      -vf "vidstabtransform=input=$TRF:zoom=0:optzoom=1:smoothing=$SMOOTHING:interpol=bicubic" \
      -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p \
      -c:a copy "$OUT"
    ;;
  *)
    echo "Método desconocido: $METHOD (usa deshake o vidstab)" >&2
    exit 2
    ;;
esac

echo "OK -> $OUT"
