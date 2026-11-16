#!/usr/bin/env bash
# Reinstala las dependencias del SISTEMA del hub Remotion tras un
# reemplazo de VM. Todo lo demás del hub vive en ~/workspace y sobrevive;
# estos paquetes son /usr/bin y se pierden.
#
#   ffmpeg            (render/QA/audio: ebur128, loudnorm, silencedetect)
#   tesseract-ocr + spa/eng/osd   (OCR de capturas y documentos)
#   libimage-exiftool-perl         (exiftool: metadatos de fotos)
#   espeak-ng                      (Kokoro TTS lo exige en runtime)
#
# Uso (desde cualquier sitio):
#   bash ~/workspace/remotion-hub/repo/scripts/install-system-deps.sh
#
# Notas:
# - NO hace `apt upgrade`: solo `apt-get update` + install de los
#   paquetes nombrados. No toca nada más del sistema.
# - NO fija versiones exactas: las del apt de esta imagen llevan sufijos
#   propios del entorno (p. ej. ffmpeg 7:8.1.2-2ubuntu2+hatch3) que no
#   existirían en otra imagen y romperían el script. En su lugar, tras
#   instalar verifica que cada binario existe y avisa si su versión
#   queda por debajo del suelo documentado (ffmpeg 7, tesseract 5,
#   exiftool 12, espeak-ng 1.51).
# - Si apt no tiene red, usa como respaldo los .deb cacheados en
#   ~/workspace/remotion-hub/debs/ (durables: tesseract, exiftool y
#   espeak-ng; ffmpeg NO está cacheado y exige apt con red).
# - Usa sudo solo si no se corre como root.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_DIR="$(dirname "$SCRIPT_DIR")"
DEBS_DIR="$HUB_DIR/debs"

PKGS="ffmpeg tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng tesseract-ocr-osd libimage-exiftool-perl espeak-ng"

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
elif command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
else
  echo "ERROR: hace falta root o sudo para instalar paquetes" >&2
  exit 1
fi

echo "== install-system-deps: $PKGS"
$SUDO apt-get update || echo "AVISO: apt-get update falló; se intenta instalar igualmente"

if ! $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $PKGS; then
  echo "AVISO: apt install falló; respaldo con .deb cacheados en $DEBS_DIR"
  if [ -d "$DEBS_DIR" ] && ls "$DEBS_DIR"/*.deb >/dev/null 2>&1; then
    # dpkg -i puede fallar por dependencias; apt-get install -f las resuelve.
    $SUDO dpkg -i "$DEBS_DIR"/*.deb || true
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -f --no-install-recommends
    # ffmpeg no está en la caché: reintento solo para él.
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg
  else
    echo "ERROR: sin red apt y sin .deb cacheados en $DEBS_DIR" >&2
    exit 1
  fi
fi

echo "== Verificación"
fail=0
for bin in ffmpeg tesseract exiftool espeak-ng; do
  if command -v "$bin" >/dev/null 2>&1; then
    echo "  OK $bin: $(command -v "$bin")"
  else
    echo "  FALTA $bin" >&2
    fail=1
  fi
done
[ "$fail" -eq 0 ] || exit 1

# Suelos de versión documentados (aviso, no fallo: la imagen futura
# puede traer versiones distintas y el hub no debe bloquearse por eso).
check_floor() { # paquete, suelo
  local ver
  ver="$(dpkg-query -W -f='${Version}' "$1" 2>/dev/null || echo "?")"
  if dpkg --compare-versions "$ver" ge "$2" 2>/dev/null; then
    echo "  OK $1 $ver (>= $2)"
  else
    echo "  AVISO: $1 $ver por debajo del suelo documentado $2" >&2
  fi
}
check_floor ffmpeg "7:7.0"
check_floor tesseract-ocr "5.0"
check_floor libimage-exiftool-perl "12.0"
check_floor espeak-ng "1.51"

echo "  ffmpeg: $(ffmpeg -version 2>/dev/null | head -1)"
echo "  tesseract: $(tesseract --version 2>/dev/null | head -1)"
echo "  tesseract langs: $(tesseract --list-langs 2>/dev/null | tr '\n' ' ')"
echo "  exiftool: $(exiftool -ver 2>/dev/null)"
echo "  espeak-ng: $(espeak-ng --version 2>/dev/null | head -1)"
echo "OK: dependencias del sistema instaladas y verificadas"
